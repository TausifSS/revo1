import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Sparkles, MapPin, Shield, 
  ArrowRight, ArrowLeft, Check, Camera, 
  Users, Bed, Bath, Plus, Minus, ChevronDown, Award, Zap, HeartHandshake, 
  ShieldCheck, Coffee, Wifi, Tv, Wind, 
  Waves, Mountain, Compass, Upload, Video, Globe, FileImage, X,
  Star, Heart, ChevronRight, Building2
} from "lucide-react";
import { hostService } from "../services/host.service";
import { authService } from "../services/auth.service";
import { resortService } from "../services/resort.service";
import { secureStorage } from "../services/secureStorage";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import { apiClient } from "../services/apiClient";

const DESTINATIONS = [
  { name: "Goa (North & South)", multiplier: 1.35, baseRate: 22000 },
  { name: "Manali & Himachal", multiplier: 1.15, baseRate: 16500 },
  { name: "Udaipur & Rajasthan", multiplier: 1.45, baseRate: 28000 },
  { name: "Kerala Backwaters", multiplier: 1.25, baseRate: 19500 },
  { name: "Coorg & Chikmagalur", multiplier: 1.10, baseRate: 15000 },
  { name: "Maldives (Overwater)", multiplier: 2.10, baseRate: 45000 }
];

const PROPERTY_CATEGORIES = [
  { id: "Villa", name: "Luxury Villa", icon: "🏰", desc: "Standalone estate with private grounds and premium amenities" },
  { id: "Chalet", name: "Alpine Chalet", icon: "🏔️", desc: "Cozy timber or stone lodge in mountainous retreats" },
  { id: "Heritage Haven", name: "Heritage Haveli", icon: "🕌", desc: "Historic palatial residence or royal courtyard home" },
  { id: "Beachfront", name: "Oceanfront Haven", icon: "🏖️", desc: "Direct beachfront access with panoramic coastal views" },
  { id: "Boutique Resort", name: "Boutique Resort", icon: "🌴", desc: "Curated resort suites with bespoke hospitality services" },
  { id: "Treehouse", name: "Eco Canopy Treehouse", icon: "🌿", desc: "Elevated nature immersion with architectural elegance" }
];

const AMENITY_OPTIONS = [
  { id: "pool", label: "Private Infinity Pool", icon: Waves, category: "Luxury" },
  { id: "wifi", label: "High-Speed WiFi (300Mbps+)", icon: Wifi, category: "Essentials" },
  { id: "chef", label: "Private Chef on Demand", icon: Coffee, category: "Luxury" },
  { id: "ocean_view", label: "Panoramic Ocean / Lake View", icon: Compass, category: "Views" },
  { id: "mountain_view", label: "Snow Peak / Mountain View", icon: Mountain, category: "Views" },
  { id: "jacuzzi", label: "Private Jacuzzi / Hot Tub", icon: Waves, category: "Luxury" },
  { id: "fireplace", label: "Stone Fireplace & Fire Pit", icon: Sparkles, category: "Cozy" },
  { id: "workspace", label: "Dedicated Executive Workspace", icon: Tv, category: "Essentials" },
  { id: "ev_charger", label: "EV Vehicle Charging Station", icon: Zap, category: "Facilities" },
  { id: "air_con", label: "Central Climate Control", icon: Wind, category: "Essentials" },
  { id: "butler", label: "24/7 Dedicated Butler Service", icon: Award, category: "Luxury" },
  { id: "pet_friendly", label: "Pet Friendly Grounds", icon: HeartHandshake, category: "Policies" }
];

export default function BecomeAHost() {
  const navigate = useNavigate();
  const toast = useToast();
  const { wishlist = [], toggleWishlist } = useWishlist() || {};

  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const webcamVideoRef = useRef(null);

  // Live Camera & Google Drive State
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveMediaType, setDriveMediaType] = useState("photo"); // 'photo' or 'video'
  const [driveUrlInput, setDriveUrlInput] = useState("");

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraInputRef.current?.click();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setCameraModalOpen(true);
      setTimeout(() => {
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err) {
      console.warn("Camera permission or access failed, using native file fallback", err);
      toast("Launching camera capture...", "info");
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraModalOpen(false);
  };

  const captureCameraPhoto = () => {
    if (!webcamVideoRef.current) return;
    const video = webcamVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    if (formData.images.length >= 10) {
      toast("Maximum 10 photos allowed.", "warning");
      stopCamera();
      return;
    }

    setFormData(prev => {
      const updatedImages = [...prev.images, dataUrl];
      return {
        ...prev,
        images: updatedImages,
        coverImage: prev.coverImage || updatedImages[0] || ""
      };
    });
    toast("Photo captured successfully!", "success");
    stopCamera();
  };

  const handlePhotoFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (formData.images.length + files.length > 10) {
      toast("Maximum 10 photos allowed. Some files were skipped.", "warning");
    }

    const newUrls = files.slice(0, 10 - formData.images.length).map(file => URL.createObjectURL(file));
    setFormData(prev => {
      const updatedImages = [...prev.images, ...newUrls];
      return {
        ...prev,
        images: updatedImages,
        coverImage: prev.coverImage || updatedImages[0] || ""
      };
    });
    toast(`${newUrls.length} photo(s) added successfully!`, "success");
    if (e.target) e.target.value = "";
  };

  const handleVideoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentVideos = formData.videos || [];
    if (currentVideos.length >= 2) {
      toast("Maximum 2 videos allowed.", "warning");
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      videos: [...currentVideos, videoUrl]
    }));
    toast("Video tour uploaded successfully!", "success");
    if (e.target) e.target.value = "";
  };

  const handleAddDriveUrl = (e) => {
    e.preventDefault();
    if (!driveUrlInput.trim()) return;

    let finalUrl = driveUrlInput.trim();
    if (driveMediaType === "photo") {
      if (formData.images.length >= 10) {
        toast("Maximum 10 photos allowed.", "warning");
        return;
      }
      setFormData(prev => {
        const updatedImages = [...prev.images, finalUrl];
        return {
          ...prev,
          images: updatedImages,
          coverImage: prev.coverImage || updatedImages[0] || ""
        };
      });
      toast("Photo URL imported successfully!", "success");
    } else {
      const currentVideos = formData.videos || [];
      if (currentVideos.length >= 2) {
        toast("Maximum 2 videos allowed.", "warning");
        return;
      }
      setFormData(prev => ({ ...prev, videos: [...currentVideos, finalUrl] }));
      toast("Video URL imported successfully!", "success");
    }

    setDriveUrlInput("");
    setDriveModalOpen(false);
  };

  const [mode, setMode] = useState("landing"); // 'landing' or 'wizard'
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  // Earnings Estimator States
  const [estLocation, setEstLocation] = useState(DESTINATIONS[0].name);
  const [estType, setEstType] = useState("Villa");
  const [estBedrooms, setEstBedrooms] = useState(3);
  const [estOccupancy, setEstOccupancy] = useState(70); // %

  // Calculator logic
  const selectedDestObj = DESTINATIONS.find(d => d.name === estLocation) || DESTINATIONS[0];
  const typeMultiplier = estType === "Villa" ? 1.3 : estType === "Heritage Haven" ? 1.5 : estType === "Beachfront" ? 1.4 : 1.1;
  const estimatedNightlyRate = Math.round(selectedDestObj.baseRate * typeMultiplier * (1 + (estBedrooms - 1) * 0.22));
  const estimatedMonthlyBookedNights = Math.round((30 * estOccupancy) / 100);
  const estimatedMonthlyEarnings = estimatedNightlyRate * estimatedMonthlyBookedNights;
  const estimatedAnnualEarnings = estimatedMonthlyEarnings * 12;

  // Wizard Form Data State
  const [formData, setFormData] = useState({
    title: "",
    category: "Villa",
    location: {
      address: "",
      city: "Goa",
      state: "Goa",
      country: "India",
      pinCode: "",
      landmark: ""
    },
    pricePerNight: estimatedNightlyRate,
    instantBook: true,
    specs: {
      guests: 6,
      rooms: 4,
      bedrooms: 3,
      beds: 3,
      bathrooms: 3,
      sqft: 2500
    },
    amenities: ["Private Infinity Pool", "High-Speed WiFi (300Mbps+)", "Central Climate Control"],
    coverImage: "",
    images: [],
    videos: [],
    description: "",
    cleaningFee: 2000,
    weekendSurgePercent: 15,
    discounts: { weekly: 10, monthly: 20 },
    cancellationPolicy: "Flexible",
    minNights: 2,
    maxNights: 30,
    // KYC & Payouts
    hostName: "",
    hostEmail: "",
    hostPhone: "",
    payoutType: "bank",
    bankAccountHolderName: "",
    bankAccountNumber: "",
    ifscCode: "",
    upiId: "",
    govIdNumber: "",
    gstinNumber: ""
  });

  const [aiGenerating, setAiGenerating] = useState(false);

  // AI Description Generator Simulation
  const handleGenerateAiCopy = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const generatedTitle = `The Royal ${formData.category} Sanctuary at ${formData.location.city || "Scenic Coast"}`;
      const generatedDesc = `Escape to this ultra-exclusive ${formData.category.toLowerCase()} nestled in prime ${formData.location.city || "prime sanctuary"}. Featuring ${formData.specs.bedrooms} lavish master suites, ${formData.specs.bathrooms} marble bathrooms, and breathtaking views, this retreat combines bespoke artisan elegance with modern comforts like ${formData.amenities.slice(0, 3).join(", ")}. Enjoy curated dining, complete privacy, and unparalleled luxury.`;
      setFormData(prev => ({
        ...prev,
        title: generatedTitle,
        description: generatedDesc
      }));
      setAiGenerating(false);
      toast("AI generated a luxury listing title and description!", "success");
    }, 800);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !formData.category) {
      toast("Please select a property category", "error");
      return;
    }
    if (currentStep === 2 && (!formData.location.address || !formData.location.city)) {
      toast("Please provide the property address and city", "error");
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handlePublishListing = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const token = authService.getAuthToken();

      if (!token || !currentUser) {
        toast("Please log in before submitting a property.", "error");
        navigate("/login");
        return;
      }

      // Any authenticated customer may submit a property application.
      // The backend stores it as PENDING_APPROVAL. Admin approval promotes
      // the submitting user to ROLE_OWNER and publishes the property.

      const finalTitle = formData.title || `Luxury ${formData.category || "Villa"} in ${formData.location.city || "Goa"}`;
      const description = formData.description || `Exquisite luxury ${formData.category ? formData.category.toLowerCase() : "villa"} designed for unforgettable stays.`;

      // Browser blob/data URLs are temporary and must never be stored as the
      // public property's permanent image URL. Use an empty image when no
      // persistent URL was supplied; media upload can be added separately.
      const persistentImages = (formData.images || []).filter(
        url => typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/api/"))
      );
      const persistentVideos = (formData.videos || []).filter(
        url => typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/api/"))
      );

      const resortData = {
        name: finalTitle,
        location: `${formData.location.city || "Goa"}, ${formData.location.state || "Goa"}, ${formData.location.country || "India"}`,
        description,
        imageUrl: persistentImages[0] || "",
        pricePerNight: Number(formData.pricePerNight || 0),
        // A submitted owner property ALWAYS waits for admin approval.
        status: "PENDING_APPROVAL",
        rating: 5.0,
        reviewCount: 0,
        category: String(formData.category || "Villa").toLowerCase(),
        galleryUrls: persistentImages.join("|"),
        videoUrls: persistentVideos.join("|"),
        highlights: (formData.amenities || []).slice(0, 5).join(","),
        amenities: (formData.amenities || []).join(","),
        guests: Number(formData.specs?.guests || 0),
        bedrooms: Number(formData.specs?.bedrooms || 0),
        beds: Number(formData.specs?.beds || 0),
        bathrooms: Number(formData.specs?.bathrooms || 0)
      };

      // Do NOT create a fake/local listing before the backend succeeds.
      // The backend is the single source of truth.
      const created = await resortService.createResort(resortData);

      // Keep only a lightweight local reference for the owner's portal UI.
      // This is not used by the public resort listing.
      try {
        hostService.saveData({
          ...hostService.getData(),
          listings: [
            {
              id: created?.id,
              backendResortId: created?.id,
              title: finalTitle,
              name: finalTitle,
              location: formData.location,
              status: "Pending Approval",
              pricePerNight: resortData.pricePerNight,
              image: persistentImages[0] || "",
              createdAt: new Date().toISOString()
            },
            ...(hostService.getData().listings || []).filter(item => String(item.id) !== String(created?.id))
          ]
        });
      } catch (localError) {
        console.warn("Could not update local host portal cache:", localError);
      }

      secureStorage.setItem("reservo_user_has_published", "true");
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("reservo-host-data-updated"));

      toast("Property submitted successfully. It is now waiting for Admin approval.", "success");
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      console.error("Publish listing failed:", err);
      toast(`Failed to submit property: ${err?.message || "Unknown error"}`, "error");
    }
  };

  const toggleAmenity = (label) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(label);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== label)
          : [...prev.amenities, label]
      };
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const readerPromises = files.map(file => {
      if (file.size === 0) return null;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }).filter(Boolean);

    Promise.all(readerPromises).then(newImages => {
      setFormData(prev => {
        // Clear default Unsplash placeholders on first upload
        const currentList = prev.images.every(img => img.startsWith("http"))
          ? []
          : prev.images.filter(img => !img.startsWith("http"));
        const updatedImages = [...currentList, ...newImages].slice(0, 10);
        return {
          ...prev,
          images: updatedImages,
          coverImage: prev.coverImage && !prev.coverImage.startsWith("http") ? prev.coverImage : updatedImages[0]
        };
      });
      toast(`Successfully loaded ${newImages.length} images!`, "success");
    });
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const readerPromises = files.map(file => {
      if (file.size === 0) return null;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }).filter(Boolean);

    Promise.all(readerPromises).then(newVideos => {
      setFormData(prev => {
        // Clear default placeholder video on first upload
        const currentList = (prev.videos || []).every(vid => vid.startsWith("http"))
          ? []
          : (prev.videos || []).filter(vid => !vid.startsWith("http"));
        const updatedVideos = [...currentList, ...newVideos].slice(0, 2);
        return {
          ...prev,
          videos: updatedVideos
        };
      });
      toast(`Successfully loaded ${newVideos.length} videos!`, "success");
    });
  };

  return (
    <div className="w-full font-sans transition-colors duration-300 pb-16">
      
      {/* Sub-Header Host Control Bar */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-serif font-black text-sm select-none shrink-0 shadow-sm">
              R
            </span>
            <div>
              <div className="text-xs font-extrabold text-[var(--color-text-dark)] flex items-center gap-2">
                Reservo Host Hub
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                  Verified Partner
                </span>
              </div>
              <div className="text-[11px] text-[var(--color-text-gray)]">
                {mode === "wizard" ? `Property Creation Wizard (Step ${currentStep} of ${totalSteps})` : "Host your luxury property with $1M coverage"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {mode === "wizard" ? (
              <button 
                onClick={() => setMode("landing")} 
                className="text-xs font-bold text-[var(--color-text-gray)] hover:text-red-500 bg-transparent border border-[var(--color-border-color)] px-3.5 py-2 rounded-xl cursor-pointer transition-all"
              >
                Save & Exit to Overview
              </button>
            ) : (
              <button 
                onClick={() => { setMode("wizard"); setCurrentStep(1); }} 
                className="text-xs font-bold bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer border-none flex items-center gap-1.5"
              >
                <Plus size={14} /> Create New Listing
              </button>
            )}
          </div>
        </div>

        {/* Wizard Progress Line */}
        {mode === "wizard" && (
          <div className="w-full bg-[var(--color-border-color)] h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-out" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* LANDING VIEW */}
      {mode === "landing" && (
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-8 md:p-12 shadow-2xl border border-slate-700/50">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
                <Sparkles size={14} /> Luxury Hosting with Reservo
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold font-serif tracking-tight leading-tight">
                Turn your sanctuary into a high-yield luxury stay.
              </h1>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
                Host your villa, boutique chalet, or heritage haven with complete peace of mind. Benefit from verified ultra-high-net-worth guests, $1M damage protection, and automated payouts.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button 
                  onClick={() => { setMode("wizard"); setCurrentStep(1); }}
                  className="bg-primary hover:bg-primary-dark text-white font-bold text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer border-none"
                >
                  Start Setup Wizard <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Earnings Estimator */}
          <div className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] rounded-[32px] p-6 md:p-10 shadow-xl space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Earnings Simulator</span>
              <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-[var(--color-text-dark)]">
                Estimate your hosting revenue
              </h2>
              <p className="text-xs text-[var(--color-text-gray)]">
                Calculated in real-time from high-season luxury travel booking demand.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Controls Column */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-2">
                    Select Destination
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DESTINATIONS.map((dest) => (
                      <button
                        key={dest.name}
                        onClick={() => setEstLocation(dest.name)}
                        className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          estLocation === dest.name
                            ? "bg-primary text-white border-primary shadow-md"
                            : "bg-[var(--color-bg-light)] text-[var(--color-text-dark)] border-[var(--color-border-color)] hover:border-primary/50"
                        }`}
                      >
                        {dest.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-2">
                      Property Category
                    </label>
                    <select
                      value={estType}
                      onChange={(e) => setEstType(e.target.value)}
                      className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3 rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    >
                      {PROPERTY_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)]">
                        Bedrooms
                      </label>
                      <span className="text-xs font-bold text-primary">{estBedrooms} Bedrooms</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="8" 
                      value={estBedrooms} 
                      onChange={(e) => setEstBedrooms(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)]">
                      Monthly Occupancy Rate
                    </label>
                    <span className="text-xs font-bold text-emerald-600">{estOccupancy}% (~{estimatedMonthlyBookedNights} nights/mo)</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="95" 
                    step="5"
                    value={estOccupancy} 
                    onChange={(e) => setEstOccupancy(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Live Calculator Result Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-[28px] p-8 shadow-2xl space-y-6 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Estimated Host Earnings</span>
                  <div className="text-4xl md:text-5xl font-extrabold font-sans tabular-nums tracking-tight flex items-center">
                    ₹{estimatedMonthlyEarnings.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-blue-200 font-semibold">
                    per month (${Math.round(estimatedMonthlyEarnings * 0.012).toLocaleString()} USD)
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4 space-y-2.5 text-xs text-blue-100">
                  <div className="flex justify-between items-center">
                    <span>Estimated Nightly Rate:</span>
                    <span className="font-bold text-white font-sans tabular-nums">₹{estimatedNightlyRate.toLocaleString("en-IN")} / night</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Projected Annual Income:</span>
                    <span className="font-bold text-amber-300 font-sans tabular-nums">₹{estimatedAnnualEarnings.toLocaleString("en-IN")} / year</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Reservo Service Fee:</span>
                    <span className="font-bold text-emerald-300">Flat 3% (Lowest in Industry)</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      category: estType,
                      pricePerNight: estimatedNightlyRate,
                      specs: { ...prev.specs, bedrooms: estBedrooms }
                    }));
                    setMode("wizard");
                    setCurrentStep(1);
                  }}
                  className="w-full py-3.5 bg-white text-primary hover:bg-blue-50 font-extrabold text-xs rounded-2xl shadow transition-all cursor-pointer border-none text-center"
                >
                  List with this Estimate
                </button>
              </div>
            </div>
          </div>

          {/* Pillars of Trust */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] p-6 rounded-3xl space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-dark)]">$1M Host Cover</h3>
              <p className="text-xs text-[var(--color-text-gray)] leading-relaxed">
                Comprehensive damage protection and liability guarantee covering rare property incidents and fine art.
              </p>
            </div>

            <div className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] p-6 rounded-3xl space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Award size={24} />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-dark)]">Verified Elite Guests</h3>
              <p className="text-xs text-[var(--color-text-gray)] leading-relaxed">
                Government ID verification, credit card pre-authorization, and guest reviews before any key is handed over.
              </p>
            </div>

            <div className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] p-6 rounded-3xl space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <Zap size={24} />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-dark)]">Automated Payouts</h3>
              <p className="text-xs text-[var(--color-text-gray)] leading-relaxed">
                Direct bank transfer (IMPS/NEFT) or UPI within 24 hours of guest check-in without hidden escrow delays.
              </p>
            </div>
          </div>

          {/* Quick FAQ */}
          <div className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] rounded-[32px] p-6 md:p-8 shadow-xs space-y-4">
            <h3 className="text-lg font-bold font-serif text-[var(--color-text-dark)]">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <details className="group p-4 bg-[var(--color-bg-light)] rounded-2xl cursor-pointer">
                <summary className="text-xs font-bold text-[var(--color-text-dark)] flex items-center justify-between list-none">
                  How does Reservo verify guests?
                  <ChevronDown size={14} className="group-open:rotate-180 transition-transform text-primary" />
                </summary>
                <p className="text-xs text-[var(--color-text-gray)] mt-2 leading-relaxed">
                  All guests must verify government ID (Passport, Aadhaar, Driving License) and link valid payment credentials prior to booking confirmation.
                </p>
              </details>
              <details className="group p-4 bg-[var(--color-bg-light)] rounded-2xl cursor-pointer">
                <summary className="text-xs font-bold text-[var(--color-text-dark)] flex items-center justify-between list-none">
                  Can I set custom pricing for peak holiday dates?
                  <ChevronDown size={14} className="group-open:rotate-180 transition-transform text-primary" />
                </summary>
                <p className="text-xs text-[var(--color-text-gray)] mt-2 leading-relaxed">
                  Yes! Your Host Administration includes an interactive Calendar tool where you can block dates and set custom nightly surge prices at any time.
                </p>
              </details>
              <details className="group p-4 bg-[var(--color-bg-light)] rounded-2xl cursor-pointer">
                <summary className="text-xs font-bold text-[var(--color-text-dark)] flex items-center justify-between list-none">
                  What is the commission fee structure?
                  <ChevronDown size={14} className="group-open:rotate-180 transition-transform text-primary" />
                </summary>
                <p className="text-xs text-[var(--color-text-gray)] mt-2 leading-relaxed">
                  Reservo charges a flat 3% host service fee per completed booking, ensuring you keep 97% of your earned nightly revenue.
                </p>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* 10-STEP INTERACTIVE LISTING WIZARD */}
      {mode === "wizard" && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] rounded-[24px] p-5 md:p-7 shadow-lg space-y-4">
            
            {/* Step 1: Category Selection */}
            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 1 • Basics</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    Which best describes your luxury property?
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    This helps guests find your sanctuary under the correct curation style.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {PROPERTY_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        formData.category === cat.id
                          ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md"
                          : "bg-[var(--color-bg-light)] border-[var(--color-border-color)] hover:border-primary/50"
                      }`}
                    >
                      <div className="text-3xl">{cat.icon}</div>
                      <div>
                        <div className="text-sm font-bold text-[var(--color-text-dark)]">{cat.name}</div>
                        <div className="text-[11px] text-[var(--color-text-gray)] leading-snug mt-1">{cat.desc}</div>
                      </div>
                      {formData.category === cat.id && (
                        <div className="self-end text-primary font-bold text-xs flex items-center gap-1">
                          <Check size={14} /> Selected
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Location & Address */}
            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 2 • Location</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    Where is your property situated?
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    Your exact address is only shared with confirmed guests with paid bookings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                      Street Address / Estate Name *
                    </label>
                    <input 
                      type="text" 
                      value={formData.location.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, address: e.target.value } }))}
                      placeholder="e.g., Villa No. 12, Aguada Foothills Road"
                      className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                        City / Destination *
                      </label>
                      <input 
                        type="text" 
                        value={formData.location.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, city: e.target.value } }))}
                        placeholder="e.g., Goa"
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                        State / Province
                      </label>
                      <input 
                        type="text" 
                        value={formData.location.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }))}
                        placeholder="e.g., Goa"
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                        PIN / Postal Code
                      </label>
                      <input 
                        type="text" 
                        value={formData.location.pinCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, pinCode: e.target.value } }))}
                        placeholder="e.g., 403515"
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                        Country
                      </label>
                      <input 
                        type="text" 
                        value={formData.location.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, country: e.target.value } }))}
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Simulated Map Pin Card */}
                  <div className="p-4 rounded-2xl bg-[var(--color-bg-light)] border border-[var(--color-border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--color-text-dark)]">Pinpoint Map Coordinates</div>
                        <div className="text-[11px] text-[var(--color-text-gray)]">Lat: 15.5164 • Long: 73.7634 (Auto-detected)</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200">
                      Coordinates Verified
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Capacity & Specifications */}
            {currentStep === 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 3 • Floor Plan</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    Share the essentials about your space
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    Let guests know the maximum occupancy and bed layouts.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Maximum Guests", key: "guests", min: 1, max: 10000, icon: Users },
                    { label: "Rooms", key: "rooms", min: 1, max: 1000, icon: Building2 },
                    { label: "Bedrooms", key: "bedrooms", min: 1, max: 1000, icon: Bed },
                    { label: "Beds", key: "beds", min: 1, max: 1000, icon: Bed },
                    { label: "Bathrooms", key: "bathrooms", min: 1, max: 1000, icon: Bath }
                  ].map((item) => {
                    const Icon = item.icon;
                    const currentValue = formData.specs[item.key] ?? 1;
                    return (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-2xl transition-colors duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[var(--color-bg-white)] border border-[var(--color-border-color)] flex items-center justify-center text-primary transition-colors duration-300">
                            <Icon size={16} />
                          </div>
                          <span className="text-xs font-bold text-[var(--color-text-dark)] transition-colors duration-300">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              specs: { ...prev.specs, [item.key]: Math.max(item.min, (prev.specs[item.key] ?? 1) - 1) }
                            }))}
                            className="w-8 h-8 rounded-full border border-[var(--color-border-color)] bg-[var(--color-bg-white)] flex items-center justify-center text-[var(--color-text-dark)] hover:border-primary cursor-pointer transition-colors duration-300 shadow-xs"
                            title={`Decrease ${item.label}`}
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="number"
                            value={formData.specs[item.key] === "" ? "" : (formData.specs[item.key] ?? 1)}
                            onChange={(e) => {
                              const val = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                              if (val === "") {
                                setFormData(prev => ({
                                  ...prev,
                                  specs: { ...prev.specs, [item.key]: "" }
                                }));
                              } else if (!isNaN(val)) {
                                setFormData(prev => ({
                                  ...prev,
                                  specs: { ...prev.specs, [item.key]: Math.max(item.min, Math.min(item.max, val)) }
                                }));
                              }
                            }}
                            onBlur={() => {
                              if (formData.specs[item.key] === "" || isNaN(formData.specs[item.key])) {
                                setFormData(prev => ({
                                  ...prev,
                                  specs: { ...prev.specs, [item.key]: item.min }
                                }));
                              }
                            }}
                            className="text-xs font-extrabold text-[var(--color-text-dark)] w-10 text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              specs: { ...prev.specs, [item.key]: (prev.specs[item.key] ?? 0) + 1 }
                            }))}
                            className="w-8 h-8 rounded-full border border-[var(--color-border-color)] bg-[var(--color-bg-white)] flex items-center justify-center text-[var(--color-text-dark)] hover:border-primary cursor-pointer transition-colors duration-300 shadow-xs"
                            title={`Increase ${item.label}`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5 transition-colors duration-300">
                      Approximate Area (Sq. Ft.)
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        type="number"
                        value={formData.specs.sqft}
                        onChange={(e) => setFormData(prev => ({ ...prev, specs: { ...prev.specs, sqft: Math.max(0, Number(e.target.value)) } }))}
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 pr-24 rounded-2xl text-xs font-medium outline-none focus:border-primary font-sans tabular-nums transition-colors duration-300"
                      />
                      <div className="absolute right-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, specs: { ...prev.specs, sqft: Math.max(0, (prev.specs.sqft || 0) - 100) } }))}
                          className="w-7 h-7 rounded-xl bg-[var(--color-bg-white)] border border-[var(--color-border-color)] flex items-center justify-center text-[var(--color-text-dark)] hover:border-primary cursor-pointer text-xs font-bold transition-all shadow-xs"
                          title="Decrease Area by 100"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, specs: { ...prev.specs, sqft: (prev.specs.sqft || 0) + 100 } }))}
                          className="w-7 h-7 rounded-xl bg-[var(--color-bg-white)] border border-[var(--color-border-color)] flex items-center justify-center text-[var(--color-text-dark)] hover:border-primary cursor-pointer text-xs font-bold transition-all shadow-xs"
                          title="Increase Area by 100"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Amenities Picker */}
            {currentStep === 4 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 4 • Amenities</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    What standout amenities do you offer?
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    Select all that apply. Luxury amenities drastically boost booking conversion.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {AMENITY_OPTIONS.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = formData.amenities.includes(amenity.label);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.label)}
                        className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                            : "bg-[var(--color-bg-light)] border-[var(--color-border-color)] text-[var(--color-text-dark)] hover:border-primary/50"
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${isSelected ? "bg-primary text-white" : "bg-[var(--color-bg-white)] text-[var(--color-text-gray)]"}`}>
                          <Icon size={16} />
                        </div>
                        <span className="text-xs font-semibold">{amenity.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 5: Photos & Gallery */}
            {currentStep === 5 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Hidden File Inputs */}
                <input 
                  type="file" 
                  ref={photoInputRef} 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handlePhotoFileUpload} 
                />
                <input 
                  type="file" 
                  ref={cameraInputRef} 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handlePhotoFileUpload} 
                />
                <input 
                  type="file" 
                  ref={videoInputRef} 
                  accept="video/*" 
                  className="hidden" 
                  onChange={handleVideoFileUpload} 
                />

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 5 • Photography</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    Add photos & videos of your luxury stay
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    High-resolution imagery and video tours are the #1 deciding factor for luxury guests (Max 10 photos, Max 2 videos).
                  </p>
                </div>

                {/* Upload Photos Box Dropzone */}
                <div 
                  className="border-2 border-dashed border-[var(--color-border-color)] hover:border-primary rounded-3xl p-6 text-center space-y-4 bg-[var(--color-bg-light)] transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.length) {
                      handlePhotoFileUpload({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Camera size={22} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold text-[var(--color-text-dark)]">
                      Drag and drop high-res photos here ({formData.images.length}/10)
                    </div>
                    <div className="text-[11px] text-[var(--color-text-gray)]">
                      Supports JPG, PNG, WEBP, HEIC up to 25MB each
                    </div>
                  </div>

                  {/* Action Buttons Toolbar for Photos */}
                  <div className="flex flex-wrap justify-center items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer border-none flex items-center gap-1.5 transition-all"
                    >
                      <Upload size={14} /> Upload from Device
                    </button>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="bg-[var(--color-bg-white)] hover:bg-primary/10 border border-[var(--color-border-color)] text-[var(--color-text-dark)] text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Camera size={14} className="text-primary" /> Take Photo (Camera)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDriveMediaType("photo");
                        setDriveModalOpen(true);
                      }}
                      className="bg-[var(--color-bg-white)] hover:bg-blue-500/10 border border-[var(--color-border-color)] text-[var(--color-text-dark)] text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Globe size={14} className="text-blue-500" /> Google Drive Link
                    </button>
                  </div>
                </div>

                {/* Photo Previews */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {formData.images.map((imgUrl, idx) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden group aspect-[4/3] border border-[var(--color-border-color)] shadow-xs">
                      <img src={imgUrl} alt={`Space ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, coverImage: imgUrl }))}
                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-primary text-white text-[9px] font-bold px-2 py-1 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                      >
                        Set Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => {
                          const newImages = prev.images.filter((_, i) => i !== idx);
                          return {
                            ...prev,
                            images: newImages,
                            coverImage: newImages[0] || ""
                          };
                        })}
                        className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload Videos Box Dropzone */}
                <div 
                  className="border-2 border-dashed border-[var(--color-border-color)] hover:border-indigo-500 rounded-3xl p-6 text-center space-y-4 bg-[var(--color-bg-light)] mt-4 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.length) {
                      handleVideoFileUpload({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto">
                    <Video size={22} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold text-[var(--color-text-dark)]">
                      Upload property video tours ({(formData.videos || []).length}/2)
                    </div>
                    <div className="text-[11px] text-[var(--color-text-gray)]">
                      Supports MP4, MOV, WebM up to 100MB each
                    </div>
                  </div>

                  {/* Action Buttons Toolbar for Videos */}
                  <div className="flex flex-wrap justify-center items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer border-none flex items-center gap-1.5 transition-all"
                    >
                      <Upload size={14} /> Upload Video Tour
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDriveMediaType("video");
                        setDriveModalOpen(true);
                      }}
                      className="bg-[var(--color-bg-white)] hover:bg-indigo-500/10 border border-[var(--color-border-color)] text-[var(--color-text-dark)] text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Globe size={14} className="text-indigo-500" /> Google Drive Video Link
                    </button>
                  </div>
                </div>

                {/* Video Previews */}
                <div className="grid grid-cols-2 gap-3">
                  {(formData.videos || []).map((videoUrl, idx) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden group aspect-[16/9] border border-[var(--color-border-color)] bg-black">
                      <video src={videoUrl} controls className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== idx) }))}
                        className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none z-20"
                      >
                        Delete Video
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 6: AI Copywriting Title & Description */}
            {currentStep === 6 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 6 • Story & Copy</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    Craft your property title & story
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    Highlight the architectural charm, views, and bespoke atmosphere.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                      Catchy Listing Title *
                    </label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Villa Solarium Infinity Pool & Ocean Cove"
                      className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                      Detailed Luxury Description *
                    </label>
                    <textarea 
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the atmosphere, private pool, dining service, nearby beach access, and what makes your property extraordinary..."
                      className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 7: House Rules & Safety */}
            {currentStep === 7 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 7 • House Rules</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    Set your expectations & safety guidelines
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    Guests must agree to these rules prior to booking confirmation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--color-bg-light)] border border-[var(--color-border-color)] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[var(--color-text-dark)]">Minimum Stay (Nights)</div>
                      <div className="text-[11px] text-[var(--color-text-gray)]">Default is 2 nights</div>
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      max="14" 
                      value={formData.minNights} 
                      onChange={(e) => setFormData(prev => ({ ...prev, minNights: Number(e.target.value) }))}
                      className="w-16 bg-[var(--color-bg-white)] border border-[var(--color-border-color)] p-2 rounded-xl text-xs font-bold text-center outline-none focus:border-primary"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--color-bg-light)] border border-[var(--color-border-color)] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[var(--color-text-dark)]">Cancellation Policy</div>
                      <div className="text-[11px] text-[var(--color-text-gray)]">Flexible, Moderate, or Strict</div>
                    </div>
                    <select
                      value={formData.cancellationPolicy}
                      onChange={(e) => setFormData(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                      className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] p-2 rounded-xl text-xs font-bold outline-none focus:border-primary"
                    >
                      <option value="Flexible">Flexible (24h)</option>
                      <option value="Moderate">Moderate (5 days)</option>
                      <option value="Strict">Strict (14 days)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Shield size={14} /> Reservo Quiet Hours Standard
                  </div>
                  <div>Quiet hours are automatically enforced between 10:00 PM and 7:00 AM for residential tranquility.</div>
                </div>
              </motion.div>
            )}

            {/* Step 8: Nightly Pricing & Discounts */}
            {currentStep === 8 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 8 • Pricing</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    Set your nightly rates & discounts
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    You can easily override rates for weekends or holidays later in your calendar.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-3xl space-y-3 transition-colors duration-300">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary">
                      Base Nightly Price (INR ₹)
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-extrabold text-primary font-sans tabular-nums">₹</span>
                      <input 
                        type="number"
                        step="500"
                        value={formData.pricePerNight}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricePerNight: Number(e.target.value) }))}
                        className="text-2xl font-extrabold text-[var(--color-text-dark)] bg-transparent border-b-2 border-primary outline-none w-48 font-sans tabular-nums"
                      />
                      <span className="text-xs font-bold text-[var(--color-text-gray)] font-sans">/ night</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                        Cleaning & Sanitization Fee (₹)
                      </label>
                      <input 
                        type="number"
                        value={formData.cleaningFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, cleaningFee: Number(e.target.value) }))}
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                        Weekend Surge (% Surcharge)
                      </label>
                      <input 
                        type="number"
                        value={formData.weekendSurgePercent}
                        onChange={(e) => setFormData(prev => ({ ...prev, weekendSurgePercent: Number(e.target.value) }))}
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 9: Host KYC & Payout Details */}
            {currentStep === 9 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 9 • Verification & Payouts</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    Where should we deposit your earnings?
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    Reservo disburses earnings automatically via IMPS/NEFT or instant UPI.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                        Host Full Legal Name *
                      </label>
                      <input 
                        type="text"
                        value={formData.hostName}
                        onChange={(e) => setFormData(prev => ({ ...prev, hostName: e.target.value }))}
                        placeholder="e.g., Tony Stark"
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                        Government ID No. *
                      </label>
                      <input 
                        type="text"
                        value={formData.govIdNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, govIdNumber: e.target.value }))}
                        placeholder="e.g., Aadhaar / PAN / Passport"
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary transition-colors uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                        GSTIN Number *
                      </label>
                      <input 
                        type="text"
                        value={formData.gstinNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, gstinNumber: e.target.value.toUpperCase() }))}
                        placeholder="e.g., 22AAAAA0000A1Z5"
                        className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-primary transition-colors uppercase font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  {/* Payout Method Toggle */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)]">
                      Select Payout Method *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, payoutType: "bank" }))}
                        className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          formData.payoutType === "bank"
                            ? "bg-primary/10 border-primary text-primary shadow-xs"
                            : "bg-[var(--color-bg-light)] border-[var(--color-border-color)] text-[var(--color-text-dark)] hover:border-primary/50"
                        }`}
                      >
                        🏦 Bank Account (NEFT / IMPS)
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, payoutType: "upi" }))}
                        className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          formData.payoutType === "upi"
                            ? "bg-primary/10 border-primary text-primary shadow-xs"
                            : "bg-[var(--color-bg-light)] border-[var(--color-border-color)] text-[var(--color-text-dark)] hover:border-primary/50"
                        }`}
                      >
                        ⚡ Instant UPI ID
                      </button>
                    </div>
                  </div>
                  {/* Dynamic Fields based on Payout Type */}
                  {formData.payoutType === "bank" ? (
                    <div className="p-5 rounded-2xl bg-[var(--color-bg-light)] border border-[var(--color-border-color)] space-y-4 transition-colors">
                      <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        🏦 Bank Account Details
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--color-text-dark)] mb-1.5">
                          Bank Account Holder Name *
                        </label>
                        <input 
                          type="text"
                          value={formData.bankAccountHolderName}
                          onChange={(e) => setFormData(prev => ({ ...prev, bankAccountHolderName: e.target.value }))}
                          placeholder="e.g., Tony Stark"
                          className="w-full bg-[var(--color-bg-white)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-xl text-xs font-medium outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--color-text-dark)] mb-1.5">
                            Bank Account Number *
                          </label>
                          <input 
                            type="text"
                            value={formData.bankAccountNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                            placeholder="e.g., 50100293849102"
                            className="w-full bg-[var(--color-bg-white)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-xl text-xs font-medium outline-none focus:border-primary font-sans tabular-nums"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[var(--color-text-dark)] mb-1.5">
                            IFSC Code *
                          </label>
                          <input 
                            type="text"
                            value={formData.ifscCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                            placeholder="e.g., HDFC0001234"
                            className="w-full bg-[var(--color-bg-white)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-xl text-xs font-medium outline-none focus:border-primary uppercase font-mono tracking-wider"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-[var(--color-bg-light)] border border-[var(--color-border-color)] space-y-3 transition-colors">
                      <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        ⚡ Instant UPI Details
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--color-text-dark)] mb-1.5">
                          UPI ID (VPA) *
                        </label>
                        <input 
                          type="text"
                          value={formData.upiId}
                          onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                          placeholder="e.g., user@okhdfcbank or 9876543210@paytm"
                          className="w-full bg-[var(--color-bg-white)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] p-3.5 rounded-xl text-xs font-medium outline-none focus:border-primary font-sans"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                      Upload Government ID / GST Proof Document Scan
                    </label>
                    <div className="border border-dashed border-[var(--color-border-color)] hover:border-primary rounded-2xl p-4 text-center bg-[var(--color-bg-white)] flex flex-col items-center gap-2">
                      <input 
                        type="file" 
                        id="kyc-doc-file-input"
                        accept="image/*,.pdf" 
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData(prev => ({ ...prev, kycDocumentBase64: reader.result }));
                              toast("Document scan loaded successfully!", "success");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById("kyc-doc-file-input").click()}
                        className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow cursor-pointer border-none"
                      >
                        + Upload ID Scan / Document Proof
                      </button>
                      {formData.kycDocumentBase64 ? (
                        <div className="text-[11px] text-emerald-600 font-bold mt-1">
                          ✓ Document attached ({formData.kycDocumentBase64.substring(0, 30)}...)
                        </div>
                      ) : (
                        <div className="text-[10px] text-[var(--color-text-gray)]">
                          Supports PNG, JPG, or PDF scans (Max 10MB)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 10: Review & Instant Publish */}
            {currentStep === 10 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Final Step • Live Preview</span>
                  <h2 className="text-2xl font-extrabold font-serif text-[var(--color-text-dark)] mt-1">
                    Review and publish your listing!
                  </h2>
                  <p className="text-xs text-[var(--color-text-gray)]">
                    Everything looks exceptional. Once published, your listing will appear in your Host Portal.
                  </p>
                </div>

                {/* Preview Card matching Resort Listing Cards */}
                {(() => {
                  const displayCoverImage = formData.coverImage || formData.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80";
                  const previewResort = {
                    id: "preview-host-listing",
                    name: formData.title || `Luxury ${formData.category} in ${formData.location.city || "Goa"}`,
                    location: formData.location.city || "Goa",
                    price: formData.pricePerNight || 41184,
                    heroImage: displayCoverImage,
                    image: displayCoverImage
                  };
                  const isFav = (wishlist || []).some(item => String(item.id) === String(previewResort.id));

                  return (
                    <div className="max-w-md mx-auto group rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border bg-[var(--color-bg-white)] border-[var(--color-border-color)] flex flex-col justify-between text-left">
                      {/* Hero / Cover Image with Badges */}
                      <div className="relative h-60 overflow-hidden">
                        <img 
                          src={displayCoverImage} 
                          alt={formData.title || "Luxury Resort"} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />

                        {/* Category Badge at Top-Left */}
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-primary text-[10px] font-bold uppercase tracking-wider rounded-full shadow border border-white/60 dark:border-slate-700">
                            {formData.category || "Luxury Stay"}
                          </span>
                        </div>

                        {/* Favorite Heart Button at Top-Right */}
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toggleWishlist) {
                              toggleWishlist(previewResort);
                            }
                          }}
                          className={`absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 shadow cursor-pointer border-none ${
                            isFav ? 'text-rose-500' : 'text-stone-700 dark:text-slate-200'
                          }`}
                          title={isFav ? "Remove from wishlist" : "Save to wishlist"}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        {/* Price Pill at Bottom-Right */}
                        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow border border-slate-700">
                          from <span className="text-blue-400 text-sm font-sans tabular-nums font-extrabold">₹{formData.pricePerNight ? Number(formData.pricePerNight).toLocaleString("en-IN") : "41,184"}</span>/night
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Location & Rating Header */}
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="flex items-center gap-1 font-medium text-[var(--color-text-gray)]">
                              <MapPin className="w-3.5 h-3.5 text-primary" /> {formData.location.city || "Goa"}
                            </span>
                            <span className="flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full border bg-blue-500/10 text-primary border-primary/20 text-xs">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 5.0 (New)
                            </span>
                          </div>

                          {/* Listing Title */}
                          <h3 className="text-lg font-bold text-[var(--color-text-dark)] group-hover:text-primary transition-colors font-sans line-clamp-1">
                            {formData.title || `Luxury ${formData.category} in ${formData.location.city || "Goa"}`}
                          </h3>

                          {/* Specs Bar */}
                          <div className="text-xs font-medium text-[var(--color-text-gray)] flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span>{formData.specs.guests || 6} Guests</span>
                            <span>•</span>
                            <span>{formData.specs.rooms || 4} Rooms</span>
                            <span>•</span>
                            <span>{formData.specs.bedrooms || 3} Bedrooms</span>
                            <span>•</span>
                            <span>{formData.specs.bathrooms || 3} Baths</span>
                          </div>
                        </div>

                        {/* Amenities Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(formData.amenities && formData.amenities.length > 0 
                            ? formData.amenities.slice(0, 3) 
                            : ["Private Pool", "WiFi", "Climate Control"]
                          ).map((amenity, i) => (
                            <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-[var(--color-bg-light)] text-[var(--color-text-gray)] border-[var(--color-border-color)]">
                              {amenity}
                            </span>
                          ))}
                        </div>

                        {/* Explore Footer Row */}
                        <div className="pt-3 border-t border-[var(--color-border-color)] flex items-center justify-between text-xs font-bold text-primary group-hover:text-primary-dark transition-colors">
                          <span>Explore Details & Map</span>
                          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* Wizard Navigation Actions */}
            <div className="border-t border-[var(--color-border-color)] pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`text-xs font-bold px-5 py-3 rounded-xl border border-[var(--color-border-color)] transition-all flex items-center gap-1.5 ${
                  currentStep === 1 
                    ? "opacity-40 cursor-not-allowed bg-transparent text-[var(--color-text-gray)]" 
                    : "cursor-pointer bg-[var(--color-bg-light)] hover:bg-[var(--color-border-color)] text-[var(--color-text-dark)]"
                }`}
              >
                <ArrowLeft size={14} /> Back
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer border-none flex items-center gap-1.5 transition-all"
                >
                  Continue <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublishListing}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold px-7 py-3 rounded-xl shadow-lg cursor-pointer border-none flex items-center gap-2 transition-all"
                >
                  <Sparkles size={15} /> Publish to Host Administration
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      {cameraModalOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={stopCamera}
        >
          <div 
            className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] rounded-[32px] max-w-lg w-full p-6 shadow-2xl relative space-y-4 text-center animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={stopCamera}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer border-none z-20 hover:bg-black"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Camera size={16} /> Live Camera Viewfinder
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] border border-[var(--color-border-color)] flex items-center justify-center">
              <video 
                ref={webcamVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="flex justify-center items-center gap-4 pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-2.5 rounded-xl border border-[var(--color-border-color)] text-xs font-bold text-[var(--color-text-gray)] hover:text-[var(--color-text-dark)] bg-transparent cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={captureCameraPhoto}
                className="bg-primary hover:bg-primary-dark text-white text-xs font-extrabold px-7 py-3 rounded-full shadow-lg shadow-primary/30 cursor-pointer border-none flex items-center gap-2 transition-all hover:scale-105"
              >
                <Camera size={16} /> Snap Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive / Cloud Import Modal */}
      {driveModalOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={() => setDriveModalOpen(false)}
        >
          <div 
            className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] rounded-[32px] max-w-md w-full p-6 shadow-2xl relative space-y-4 text-left animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setDriveModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[var(--color-bg-light)] border border-[var(--color-border-color)] flex items-center justify-center text-[var(--color-text-gray)] hover:text-[var(--color-text-dark)] cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Globe size={22} />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500">Google Drive / Cloud Import</span>
              <h3 className="text-xl font-extrabold text-[var(--color-text-dark)] mt-0.5">
                Import {driveMediaType === "photo" ? "Photo" : "Video"} Link
              </h3>
              <p className="text-xs text-[var(--color-text-gray)] mt-1">
                Paste a public Google Drive link or direct cloud URL for your {driveMediaType}.
              </p>
            </div>

            <form onSubmit={handleAddDriveUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)] mb-1.5">
                  Link / URL *
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-gray)]" />
                  <input 
                    type="url" 
                    required
                    value={driveUrlInput}
                    onChange={(e) => setDriveUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... or direct image/video URL"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] text-[var(--color-text-dark)] rounded-xl text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDriveModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--color-border-color)] text-xs font-bold text-[var(--color-text-gray)] hover:text-[var(--color-text-dark)] bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold cursor-pointer border-none shadow-md"
                >
                  Import {driveMediaType === "photo" ? "Photo" : "Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
