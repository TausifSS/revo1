import { apiClient } from "./apiClient";

const mapSearchResort = (r) => ({
  id: r.id,
  name: r.name || "Luxury Stay",
  location: r.location || "India",
  price: Number(r.pricePerNight ?? r.price ?? 0),
  rating: Number(r.rating ?? 4.5),
  image: r.imageUrl || r.image || "",
  amenities: Array.isArray(r.amenities) ? r.amenities : [],
  tag: r.featuredTag || r.tag || "Verified",
  category: r.category || "",
  description: r.description || ""
});

const fetchResorts = async () => {
  const result = await apiClient.get("/api/v1/resorts");
  if (!result?.success) {
    throw new Error(result?.message || "Failed to load resorts from backend");
  }
  return Array.isArray(result.data) ? result.data : [];
};

export const searchService = {
  async searchDestinations(query, filters = {}) {
    let results = (await fetchResorts()).map(mapSearchResort);

    if (query && query.trim() !== "") {
      const q = query.toLowerCase().trim();
      results = results.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        (r.region && r.region.toLowerCase().includes(q))
      );
    }

    if (filters.category && filters.category !== "all") {
      results = results.filter(r => r.category === filters.category);
    }

    if (filters.maxPrice) {
      results = results.filter(r => r.price <= filters.maxPrice);
    }

    return results;
  },

  async getSuggestions(query) {
    if (!query || query.trim().length < 2) return [];

    const q = query.toLowerCase().trim();
    const resortsList = await fetchResorts();

    return resortsList
      .filter(r =>
        String(r.name || "").toLowerCase().includes(q) ||
        String(r.location || "").toLowerCase().includes(q)
      )
      .map(r => ({
        id: r.id,
        name: r.name,
        location: r.location,
        type: "resort"
      }))
      .slice(0, 5);
  }
};
