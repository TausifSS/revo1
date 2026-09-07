import { apiClient } from "./apiClient";


export const resortService = {
  async updateResort(id, changes) {
    const result = await apiClient.put(
      `/api/v1/resorts/${encodeURIComponent(id)}`,
      changes
    );

    if (!result?.success || !result.data) {
      throw new Error(result?.message || "Failed to update property");
    }

    return result.data;
  },

  async uploadMedia(file) {
    if (!file) throw new Error("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    const result = await apiClient.post("/api/v1/media/upload", formData);

    if (!result?.success || !result.data?.fileUrl) {
      throw new Error(result?.message || "Failed to upload media");
    }

    return result.data.fileUrl;
  },

  async getAllResorts() {
    const result = await apiClient.get("/api/v1/resorts");
    if (!result?.success) {
      throw new Error(result?.message || "Failed to load approved resorts");
    }

    const items = Array.isArray(result.data) ? result.data : [];

    // Public listings are database-only.
    // Ignore malformed legacy records with no property name/location.
    return items
      .filter(item =>
        item &&
        typeof item.name === "string" &&
        item.name.trim() !== "" &&
        typeof item.location === "string" &&
        item.location.trim() !== "" &&
        String(item.status || "").toUpperCase() === "APPROVED"
      )
      .map(item => this.mapBackendResort(item));
  },

  async getSearchResorts() {
    return this.getAllResorts();
  },

  async searchResorts(query) {
    const all = await this.getAllResorts();
    if (!query || !query.trim()) return all;

    const q = query.toLowerCase().trim();
    return all.filter(r => 
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.location && r.location.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.categoryLabel && r.categoryLabel.toLowerCase().includes(q)) ||
      (r.badge && r.badge.toLowerCase().includes(q))
    );
  },

  mapHostListingToResort(listing) {
    const rawCity = listing.location?.city || (typeof listing.location === 'string' ? listing.location.split(',')[0] : "Goa");
    const city = rawCity ? rawCity.trim() : "Goa";
    const cover = listing.coverImage || listing.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80";
    const rawPrice = Number(listing.pricePerNight || listing.price) || 24500;
    
    // Standardize category key for filter matching
    let catKey = (listing.category || "villa").toLowerCase();
    if (catKey.includes("villa")) catKey = "villa";
    else if (catKey.includes("beach")) catKey = "beach";
    else if (catKey.includes("mountain") || catKey.includes("hill")) catKey = "mountain";
    else if (catKey.includes("island")) catKey = "island";
    else if (catKey.includes("chalet")) catKey = "chalet";

    return {
      id: listing.id || `published-${Date.now()}`,
      name: listing.title || listing.name || `Luxury ${listing.category || "Villa"} in ${city}`,
      location: city,
      city: city,
      description: listing.description || "Exquisite luxury retreat designed for unforgettable staycations.",
      image: cover,
      heroImage: cover,
      price: rawPrice,
      pricePerNight: rawPrice,
      rating: 5.0,
      reviewCount: listing.reviewsCount || 0,
      reviewsCount: listing.reviewsCount || 0,
      badge: listing.category || "Luxury Stay",
      featuredTag: listing.category || "Luxury Stay",
      currency: "₹",
      highlights: (listing.amenities && listing.amenities.length > 0)
        ? listing.amenities.slice(0, 4) 
        : ["Private Infinity Pool", "High-Speed WiFi", "Climate Control"],
      amenities: (listing.amenities || []).map(a => typeof a === "string" ? { name: a, icon: "Sparkles" } : a),
      perks: ["Free Cancellation", "Breakfast Included", "Transfer Services"],
      category: catKey,
      categoryLabel: listing.category || "Luxury Villa"
    };
  },

  async getResortById(id) {
    const result = await apiClient.get(
      `/api/v1/resorts/${encodeURIComponent(id)}`
    );

    if (!result?.success || !result.data) {
      throw new Error("Resort not found");
    }

    const item = result.data;

    // Never fall back to frontend demo/static resort data.
    // A property must come from the backend database.
    if (
      typeof item.name !== "string" ||
      !item.name.trim() ||
      typeof item.location !== "string" ||
      !item.location.trim()
    ) {
      throw new Error("Invalid property data");
    }

    return this.mapBackendResort(item);
  },

  async getCategories() {
    return [
      { id: 'all', label: 'All Stays', icon: 'Sparkles' },
      { id: 'beach', label: 'Beach Resorts', icon: 'Waves' },
      { id: 'mountain', label: 'Mountain Retreats', icon: 'Mountain' },
      { id: 'chalet', label: 'Forest Chalets', icon: 'Trees' },
      { id: 'villa', label: 'Luxury Villas', icon: 'Home' },
      { id: 'cabin', label: 'Rustic Cabins', icon: 'Tent' },
      { id: 'glamping', label: 'Glamping Stays', icon: 'Flame' },
      { id: 'island', label: 'Private Islands', icon: 'Palmtree' },
      { id: 'eco', label: 'Eco Camping', icon: 'Compass' }
    ];
  },

  mapBackendResort(item) {
    // Helper to safely split URLs that might contain base64 string commas
    const splitUrls = (urlStr) => {
      if (!urlStr) return [];
      if (urlStr.includes("|")) {
        return urlStr.split("|").filter(Boolean);
      }
      if (urlStr.includes("data:") && urlStr.includes(",")) {
        const rawParts = urlStr.split(",");
        const cleaned = [];
        for (let i = 0; i < rawParts.length; i++) {
          if (rawParts[i].startsWith("data:") || rawParts[i].startsWith("http")) {
            if (rawParts[i].startsWith("data:") && i + 1 < rawParts.length) {
              cleaned.push(rawParts[i] + "," + rawParts[i+1]);
              i++;
            } else {
              cleaned.push(rawParts[i]);
            }
          } else {
            cleaned.push(rawParts[i]);
          }
        }
        return cleaned.filter(Boolean);
      }
      return urlStr.split(",").filter(Boolean);
    };

    // Map backend resort data to match frontend static data structure
    item = item || {};
    const safeName = typeof item.name === "string" ? item.name : "Luxury Stay";
    const safeLocation = typeof item.location === "string"
      ? item.location
      : (item.location?.city || item.location?.address || "India");
    const asList = (value) => {
      if (Array.isArray(value)) return value;
      if (value == null || value === "") return [];
      return String(value).split(",").map(v => v.trim()).filter(Boolean);
    };
    const category = item.category || this.getCategoryForResort(safeName, safeLocation);
    const fallbackImage = '';
    const backendImage = typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '';
    return {
      id: item.id ?? `resort-${Math.random().toString(36).slice(2)}`,
      name: safeName,
      location: safeLocation,
      description: typeof item.description === "string" ? item.description : "Luxury stay for an unforgettable experience.",
      image: backendImage || fallbackImage,
      heroImage: backendImage || fallbackImage,
      price: Number(item.pricePerNight ?? item.price ?? 0),
      pricePerNight: Number(item.pricePerNight ?? item.price ?? 0),
      rating: Number(item.rating ?? 4.5),
      reviewCount: Number(item.reviewCount ?? 0),
      reviewsCount: Number(item.reviewCount ?? 0),
      featuredTag: item.featuredTag,
      badge: item.featuredTag || "New Host", // For consistency with static data
      discount: item.discountPercentage || 0,
      currency: "₹",
      gallery: item.galleryUrls ? splitUrls(item.galleryUrls) : [backendImage || fallbackImage],
      videos: item.videoUrls ? splitUrls(item.videoUrls) : [],
      highlights: asList(item.highlights).length ? asList(item.highlights) : this.getHighlightsForResort(safeName, safeLocation),
      amenities: asList(item.amenities).map(name => ({ name, icon: "Sparkles" })),
      perks: ["Free Cancellation", "Breakfast Included", "Transfer Services"],
      category: category,
      categoryLabel: this.getCategoryLabel(safeName, safeLocation),
      specs: {
        guests: item.guests ? `${item.guests} Guests` : "2-4 Guests",
        bedrooms: item.bedrooms ? `${item.bedrooms} Bedrooms` : "1-2 Bedrooms",
        beds: item.beds ? `${item.beds} Beds` : "1-2 Beds",
        bathrooms: item.bathrooms ? `${item.bathrooms} Bathrooms` : "2 En-suite Baths",
        area: "2,500 sq.ft.",
        checkIn: "3:00 PM",
        checkOut: "11:00 AM"
      }
    };
  },

  getHighlightsForResort(name, location) {
    const lowerName = String(name || "").toLowerCase();
    const lowerLocation = String(location || "").toLowerCase();
    
    if (lowerName.includes("goa") || lowerLocation.includes("goa")) {
      return ["Private Beach Access", "Infinity Edge Pool", "Aura Ayurvedic Spa", "Personal AI Butler", "Private Helipad Access"];
    } else if (lowerName.includes("kerala") || lowerLocation.includes("kerala")) {
      return ["Private Houseboat Cruise", "Lakefront Infinity Pool", "Panchakarma Spa", "Organic Spice Garden"];
    } else if (lowerName.includes("udaipur") || lowerLocation.includes("udaipur")) {
      return ["Royal Butler Service", "Boat Arrival Experience", "Private Courtyard Pool", "Royal Spa Suites"];
    } else if (lowerName.includes("himalayan") || lowerLocation.includes("manali")) {
      return ["Heated Outdoor Jacuzzi", "Stone Fireplaces", "Guided Alpine Treks", "Glass Stargazing Dome"];
    } else if (lowerName.includes("maldives") || lowerLocation.includes("maldives")) {
      return ["Glass Floor Viewing", "Ocean Slide", "Private Lagoon", "Underwater Restaurant Access"];
    } else if (lowerName.includes("rajasthan") || lowerLocation.includes("jaisalmer")) {
      return ["Private Sand Dune Dining", "Camel Safari Experience", "Traditional Architecture", "Desert Sunset Views"];
    }
    
    return ["Luxury Amenities", "Premium Service", "Scenic Views", "Spa & Wellness"];
  },

  getAmenitiesForResort(name) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes("goa")) {
      return [
        { name: "Private Plunge Pool", icon: "Waves" },
        { name: "Aura Luxury Spa", icon: "Sparkles" },
        { name: "Oceanfront Dining", icon: "Utensils" },
        { name: "24/7 Rivo Concierge", icon: "Bot" },
        { name: "High-Speed Wi-Fi 6", icon: "Wifi" }
      ];
    } else if (lowerName.includes("kerala")) {
      return [
        { name: "Private Lake Cruise", icon: "Waves" },
        { name: "Ayurvedic Treatment", icon: "Sparkles" },
        { name: "Lakefront Dining", icon: "Utensils" },
        { name: "Rivo Concierge", icon: "Bot" }
      ];
    } else if (lowerName.includes("udaipur")) {
      return [
        { name: "Royal Butler", icon: "Bot" },
        { name: "Private Boat Charter", icon: "Waves" },
        { name: "Palace Dining", icon: "Utensils" }
      ];
    } else if (lowerName.includes("himalayan")) {
      return [
        { name: "Heated Jacuzzi", icon: "Waves" },
        { name: "Fireplace", icon: "Flame" },
        { name: "Star Observatory", icon: "Sparkles" }
      ];
    } else if (lowerName.includes("maldives")) {
      return [
        { name: "Lagoon Pool", icon: "Waves" },
        { name: "Underwater Dining", icon: "Utensils" },
        { name: "Personal Butler", icon: "Bot" }
      ];
    }
    
    return [
      { name: "Swimming Pool", icon: "Waves" },
      { name: "Spa & Wellness", icon: "Sparkles" },
      { name: "Fine Dining", icon: "Utensils" }
    ];
  },

  getCategoryForResort(name, location) {
    const lowerName = String(name || "").toLowerCase();
    const lowerLocation = String(location || "").toLowerCase();
    
    if (lowerName.includes("goa") || lowerLocation.includes("goa")) return "beach";
    if (lowerName.includes("kerala")) return "villa";
    if (lowerName.includes("udaipur")) return "villa";
    if (lowerName.includes("himalayan") || lowerLocation.includes("manali")) return "mountain";
    if (lowerName.includes("maldives")) return "island";
    if (lowerName.includes("rajasthan") || lowerLocation.includes("jaisalmer")) return "chalet";
    
    return "beach";
  },

  getCategoryLabel(name, location) {
    const category = this.getCategoryForResort(name, location);
    const labels = {
      beach: "Beach Resorts",
      villa: "Luxury Villas",
      mountain: "Mountain Retreats",
      island: "Private Islands",
      chalet: "Forest Chalets"
    };
    return labels[category] || "Luxury Stays";
  },

  async updateResort(id, resortDetails) {
    const result = await apiClient.put(`/api/v1/resorts/${id}`, resortDetails);
    if (result && result.success) {
      return result.data;
    }
    throw new Error(result?.message || "Failed to update resort details");
  },

  async deleteResort(id) {
    const result = await apiClient.delete(`/api/v1/resorts/${id}`);
    if (result && result.success) {
      return true;
    }
    throw new Error(result?.message || "Failed to delete resort");
  },

  async createResort(resortData) {
    const result = await apiClient.post("/api/v1/resorts", resortData, { suppressAuthRedirect: true });
    if (result && result.success) {
      return result.data;
    }
    throw new Error(result?.message || "Failed to submit resort for approval");
  }
};
