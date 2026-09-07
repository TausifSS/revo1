import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  Search, MapPin, Calendar, Users, Heart, Star,
  X, ChevronDown, Map, Sparkles, Filter, Wind,
  Sun, Coffee, Waves, Dumbbell, ArrowRight, ChevronLeft, ChevronRight, CheckCircle2
} from "lucide-react";
import rivoSearching from "../assets/images/rivo_searching.png";
import { resortService } from "../services/resort.service";
import { authService } from "../services/auth.service";

const FILTER_CHIPS = [
  { id: "ai", label: "✨ AI Recommended", icon: null },
  { id: "beach", label: "Beachfront", icon: <Waves size={12} /> },
  { id: "sunset", label: "Sunset View", icon: <Sun size={12} /> },
  { id: "luxury", label: "Luxury", icon: <Star size={12} /> },
  { id: "wellness", label: "Wellness", icon: <Wind size={12} /> },
];

const AMENITY_CHIPS = [
  { id: "Pool", icon: "🏊" },
  { id: "Spa", icon: "🧘" },
  { id: "Ocean View", icon: "🌅" },
  { id: "Breakfast", icon: "🍽" },
  { id: "Free WiFi", icon: "💻" },
  { id: "Gym", icon: "🏋" }
];

const SORT_OPTIONS = [
  { key: "recommended", label: "Recommended" },
  { key: "price_asc", label: "Price (Low→High)" },
  { key: "price_desc", label: "Price (High→Low)" },
  { key: "rating", label: "Top Rated" },
];

function ResortCard({ resort, searchParams, nights }) {
  const [isLiked, setIsLiked] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("reservo-wishlist") || "[]");
      return s.some((i) => i.id === resort.id);
    } catch { return false; }
  });
  const [pop, setPop] = useState(false);
  const navigate = useNavigate();

  const toggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPop(true);
    setTimeout(() => setPop(false), 400);
    setIsLiked((prev) => {
      const next = !prev;
      try {
        const s = JSON.parse(localStorage.getItem("reservo-wishlist") || "[]");
        const updated = next ? [...s, resort] : s.filter((i) => i.id !== resort.id);
        localStorage.setItem("reservo-wishlist", JSON.stringify(updated));
      } catch {}
      const toast = document.getElementById("toast");
      const msg = document.getElementById("toast-message");
      if (toast && msg) {
        msg.textContent = next ? `Added ${resort.name} to Wishlist!` : `Removed from Wishlist`;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
      }
      return next;
    });
  };

  const handleBookNow = (e) => {
    e.preventDefault();
    navigate(`/resort/${resort.id}?${searchParams.toString()}`);
  };

  const total = (Number(resort.price ?? resort.pricePerNight) || 0) * nights;

  return (
    <Link to={`/resort/${resort.id}?${searchParams.toString()}`} className="bg-bg-white border border-border-color rounded-[24px] overflow-hidden shadow-sm transition-all duration-300 ease-out flex flex-col group hover:-translate-y-1 hover:shadow-custom no-underline">
      {/* 16:10 Hero Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={resort.image} alt={resort.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {resort.tag === "AI Choice" && (
            <div className="bg-bg-white/95 backdrop-blur-sm text-text-dark px-2.5 py-1.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
              ✨ AI Match 97%
            </div>
          )}
          <div className="bg-black/50 backdrop-blur-md text-white px-2.5 py-1.5 rounded-full text-[10px] font-bold">
            {resort.aiTag}
          </div>
        </div>

        {/* Heart */}
        <button
          className={`absolute top-4 right-4 w-9 h-9 rounded-full bg-bg-white/90 backdrop-blur-sm flex items-center justify-center cursor-pointer border-none transition-all duration-300 hover:bg-white hover:scale-110 ${pop ? "scale-125" : ""}`}
          onClick={toggleLike}
        >
          <Heart
            size={16}
            fill={isLiked ? "#EF4444" : "none"}
            stroke={isLiked ? "#EF4444" : "#121e1b"}
            className={`transition-all duration-200 ${pop ? "scale-125" : ""}`}
          />
        </button>

        {/* Navigation Arrows (Visual only for now) */}
        <div className="absolute inset-y-0 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-7 h-7 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center"><ChevronLeft size={16} /></div>
          <div className="w-7 h-7 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center"><ChevronRight size={16} /></div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-[9px] font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          1/8
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 bg-bg-white">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-text-dark leading-tight">{resort.name}</h3>
          <span className="flex items-center gap-1 font-semibold text-text-dark text-sm bg-bg-light px-2 py-0.5 rounded-lg border border-border-color">
            <Star size={12} className="text-gold fill-gold" /> {resort.rating}
          </span>
        </div>
        
        <span className="text-xs text-text-gray font-medium flex items-center gap-1 mb-4">
          <MapPin size={11} /> {resort.location}
        </span>

        {/* Price Breakdown */}
        <div className="mt-auto border-t border-border-color pt-4 flex justify-between items-end">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-text-dark font-number">${resort.price}</span>
              <span className="text-xs text-text-gray font-medium">/ night</span>
            </div>
            <div className="text-[11px] text-text-gray mt-1">Total <span className="font-bold text-text-dark font-number">${total}</span> for {nights} night{nights > 1 ? 's' : ''}</div>
            <div className="text-[10px] text-text-gray mt-0.5 flex gap-2">
              <span>Taxes Included</span>
              <span className="text-success font-semibold">Free Cancellation</span>
            </div>
          </div>
          
          <button 
            onClick={handleBookNow}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer hover:bg-gold transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300 ease-out"
          >
            Explore Stay <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
}

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const routeState = routerLocation.state || {};
  const dest = searchParams.get("destination") || routeState.destination || routeState.location || "";
  const checkinStr = searchParams.get("checkin") || routeState.checkin || routeState.checkIn || "";
  const checkoutStr = searchParams.get("checkout") || routeState.checkout || routeState.checkOut || "";
  const guests = Number(searchParams.get("guests") || routeState.guests || 2) || 2;
  const rooms = Number(searchParams.get("rooms") || routeState.rooms || 1) || 1;

  const [isLoading, setIsLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(800);
  const [minRating, setMinRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortKey, setSortKey] = useState("recommended");
  const [activeTopChip, setActiveTopChip] = useState("ai");
  const [resortsList, setResortsList] = useState([]);

  useEffect(() => {
    const loadResorts = async () => {
      try {
        const data = await resortService.getSearchResorts();
        setResortsList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load search resorts:", e);
      }
    };
    loadResorts();
  }, []);

  let nights = 1;
  if (checkinStr && checkoutStr) {
    const ci = new Date(checkinStr);
    const co = new Date(checkoutStr);
    if(ci && co) {
      nights = Math.max(1, Math.round((co - ci) / 86400000));
    }
  }

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(t);
  }, [dest]);

  useEffect(() => {
    const handleRivoMode = (e) => {
      const { mode } = e.detail;
      if (mode === 'luxury') {
        setMaxPrice(800);
        setMinRating(4.8);
        setSelectedAmenities(['Spa', 'Ocean View']);
      } else if (mode === 'budget') {
        setMaxPrice(200);
        setMinRating(0);
        setSelectedAmenities([]);
      } else if (mode === 'relax') {
        setMaxPrice(800);
        setMinRating(0);
        setSelectedAmenities(['Spa', 'Pool']);
      } else if (mode === 'adventure') {
        setMaxPrice(800);
        setMinRating(0);
        setSelectedAmenities(['Mountain View']);
      }
    };
    window.addEventListener('rivo-mode', handleRivoMode);
    return () => window.removeEventListener('rivo-mode', handleRivoMode);
  }, []);

  const toggleAmenity = (am) =>
    setSelectedAmenities((prev) =>
      prev.includes(am) ? prev.filter((a) => a !== am) : [...prev, am]
    );

  const normalizeText = (value) => {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(normalizeText).filter(Boolean).join(" ");
    if (typeof value === "object") {
      return [value.name, value.address, value.city, value.state, value.country, value.label]
        .map(normalizeText).filter(Boolean).join(" ");
    }
    return String(value);
  };

  const getLocationText = (resort) => normalizeText(resort?.location || resort?.city || resort?.region);
  const getAmenitiesText = (resort) => normalizeText(resort?.amenities).toLowerCase();
  const getHighlightsText = (resort) => normalizeText(resort?.highlights).toLowerCase();

  const filtered = (Array.isArray(resortsList) ? resortsList : []).filter((r) => {
    if (!r || typeof r !== "object") return false;

    const destKey = normalizeText(dest).split(",")[0].trim().toLowerCase();
    const locationText = getLocationText(r).toLowerCase();
    const destMatch = !destKey || locationText.includes(destKey);
    const price = Number(r.price ?? r.pricePerNight ?? 0);
    const rating = Number(r.rating ?? 0);
    const priceMatch = Number.isFinite(price) && price <= maxPrice;
    const ratingMatch = Number.isFinite(rating) && rating >= minRating;

    const amenityMatch = selectedAmenities.length === 0 || selectedAmenities.every((a) => {
      const needle = String(a).toLowerCase();
      return getAmenitiesText(r).includes(needle) || getHighlightsText(r).includes(needle);
    });

    return destMatch && priceMatch && ratingMatch && amenityMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ap = Number(a.price ?? a.pricePerNight ?? 0);
    const bp = Number(b.price ?? b.pricePerNight ?? 0);
    const ar = Number(a.rating ?? 0);
    const br = Number(b.rating ?? 0);
    if (sortKey === "price_asc") return ap - bp;
    if (sortKey === "price_desc") return bp - ap;
    if (sortKey === "rating") return br - ar;
    return 0;
  });

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getMapSrc = () => {
    if (sorted.length === 0) return "https://www.openstreetmap.org/export/embed.html?bbox=60.0%2C-10.0%2C120.0%2C40.0&layer=mapnik";
    const points = sorted
      .map(r => ({ lat: Number(r.lat), lng: Number(r.lng) }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    if (!points.length) return "https://www.openstreetmap.org/export/embed.html?bbox=60.0%2C-10.0%2C120.0%2C40.0&layer=mapnik";
    const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
    const bbox = `${centerLng - 2}%2C${centerLat - 2}%2C${centerLng + 2}%2C${centerLat + 2}`;
    const marker = `${centerLat}%2C${centerLng}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  };

  return (
    <div className="min-h-screen bg-bg-light pb-20">

      {/* Glassmorphic Search Bar */}
      <div className="sticky top-[72px] md:top-[85px] z-40 bg-bg-white/82 backdrop-blur-2xl border-b border-white/40 shadow-sm transition-all hover:shadow-custom">
        <div className="w-[92%] max-w-[1400px] mx-auto py-3">
          <div
            className="flex items-center gap-0 bg-white border border-border-color rounded-[20px] overflow-hidden cursor-pointer hover:border-gold/50 transition-colors shadow-sm"
            onClick={() => navigate("/")}
            title="Modify search"
          >
            <div className="flex items-center gap-3 px-6 py-3.5 border-r border-border-color flex-1 min-w-0">
              <MapPin size={18} className="text-gold shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-gray mb-0.5">Destination</div>
                <div className="text-sm font-bold text-text-dark truncate">{dest || "Anywhere in the world"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3.5 border-r border-border-color hidden sm:flex">
              <Calendar size={18} className="text-gold shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-gray mb-0.5">Dates</div>
                <div className="text-sm font-bold text-text-dark whitespace-nowrap">{fmtDate(checkinStr)} – {fmtDate(checkoutStr)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3.5 border-r border-border-color hidden md:flex">
              <Users size={18} className="text-gold shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-gray mb-0.5">Guests</div>
                <div className="text-sm font-bold text-text-dark whitespace-nowrap">{guests} Guest{guests !== 1 ? "s" : ""}, {rooms} Room</div>
              </div>
            </div>
            <div className="px-4">
              <button className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-white px-6 py-3 rounded-2xl text-sm font-bold border-none cursor-pointer hover:shadow-[0_4px_14px_rgba(212,166,79,0.4)] hover:scale-[1.02] transition-all duration-300">
                <Sparkles size={14} /> Search with Rivo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[92%] max-w-[1400px] mx-auto pt-8">
        
        {/* Personalization Banner */}
        <div className="mb-8 fade-up">
          <h1 className="text-2xl font-extrabold text-text-dark flex items-center gap-2 mb-2">
            👋 Welcome back, {user?.name || user?.displayName || user?.email?.split('@')[0] || "User"}.
          </h1>
          <p className="text-text-gray text-base">
            We found <strong className="text-text-dark">{sorted.length} stays</strong> in {dest || "your selected location"} that match your travel style.
          </p>
        </div>

        {/* Main 3-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Sidebar: Filters */}
          <aside className="w-full lg:w-[260px] shrink-0 sticky top-[180px] hidden md:block">
            <div className="bg-bg-white border border-border-color rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-text-dark text-base m-0">Refine Search</h3>
                <button className="text-xs text-gold font-bold bg-transparent border-none cursor-pointer hover:underline" onClick={() => {setMaxPrice(800); setMinRating(0); setSelectedAmenities([]);}}>Clear All</button>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-border-color">
                <h4 className="text-sm font-bold text-text-dark mb-4">Budget per night</h4>
                <div className="flex justify-between text-xs font-bold text-text-gray mb-3">
                  <span>$100</span>
                  <span className="text-primary font-number">${maxPrice}+</span>
                </div>
                <input type="range" min="100" max="800" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-gold cursor-pointer" />
              </div>

              {/* Rating */}
              <div className="mb-6 pb-6 border-b border-border-color">
                <h4 className="text-sm font-bold text-text-dark mb-4">Minimum Rating</h4>
                <div className="flex flex-wrap gap-2">
                  {[{ v: 0, l: "All" }, { v: 4.5, l: "4.5+" }, { v: 4.7, l: "4.7+" }, { v: 4.9, l: "4.9" }].map(r => (
                    <button key={r.v}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${minRating === r.v ? "bg-gold text-white border-gold shadow-sm" : "bg-bg-light text-text-gray border-border-color hover:border-gold hover:text-gold"}`}
                      onClick={() => setMinRating(r.v)}>{r.l}</button>
                  ))}
                </div>
              </div>

              {/* Icon-based Amenities */}
              <div>
                <h4 className="text-sm font-bold text-text-dark mb-4">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_CHIPS.map(am => (
                    <button 
                      key={am.id} 
                      onClick={() => toggleAmenity(am.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedAmenities.includes(am.id) 
                          ? "bg-primary text-white border-primary shadow-sm" 
                          : "bg-bg-white text-text-gray border-border-color hover:border-gold hover:text-gold"
                      }`}
                    >
                      <span className="text-sm">{am.icon}</span> {am.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Middle: Results Grid */}
          <div className="flex-1 min-w-0">
            
            {/* Top Filter Chips */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-4 hide-scrollbar">
              {FILTER_CHIPS.map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setActiveTopChip(chip.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap transition-all cursor-pointer ${
                    activeTopChip === chip.id
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-bg-white text-text-gray border-border-color hover:bg-bg-light"
                  }`}
                >
                  {chip.icon} {chip.label}
                </button>
              ))}
            </div>

            {/* Title & Sort */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-text-dark">
                {sorted.length} handpicked stays in {dest ? dest.split(',')[0] : 'your location'}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-gray">Sort by:</span>
                <select 
                  className="bg-bg-white border border-border-color text-text-dark text-sm font-bold py-2 px-3 rounded-xl outline-none cursor-pointer hover:border-gold transition-colors"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                >
                  {SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-bg-white border border-border-color rounded-3xl">
                <div className="w-16 h-16 mb-6 relative">
                   <img src={rivoSearching} alt="Rivo" className="w-full h-full rounded-full object-cover border-2 border-gold shadow-[0_0_15px_rgba(212,166,79,0.3)] animate-bounce" style={{animationDuration: '1.5s'}} />
                   <div className="absolute -inset-4 border border-gold/30 rounded-full animate-ping pointer-events-none"></div>
                </div>
                <div className="text-lg font-bold text-text-dark mb-2">Rivo is curating your stays...</div>
                <div className="text-sm text-text-gray animate-pulse">Checking weather and local availability</div>
              </div>
            ) : sorted.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {sorted.map((r) => <ResortCard key={r.id} resort={r} searchParams={searchParams} nights={nights} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center py-24 text-center bg-bg-white border border-border-color rounded-3xl shadow-sm">
                <img src={rivoSearching} alt="Rivo" className="w-20 h-20 rounded-full object-cover border-2 border-border-color mb-6 grayscale" />
                <h3 className="text-2xl font-bold text-text-dark mb-2">No stays match your criteria</h3>
                <p className="text-text-gray mb-8">Try adjusting your budget or removing some amenities.</p>
                <button onClick={() => {setMaxPrice(800); setMinRating(0); setSelectedAmenities([]);}} className="bg-gold text-white font-bold py-3 px-6 rounded-xl hover:bg-gold-dark transition-colors border-none cursor-pointer">
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Widgets & Map */}
          <aside className="w-full lg:w-[300px] shrink-0 sticky top-[180px] hidden xl:flex flex-col gap-6">
            
            {/* Weather Widget */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 rounded-[24px] shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Current Weather</div>
                  <div className="text-2xl font-extrabold text-blue-900 font-number">29°C</div>
                  <div className="text-sm font-semibold text-blue-800">Sunny & Clear</div>
                </div>
                <div className="text-4xl">☀️</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1"><CheckCircle2 size={12} className="text-success" /> Air Quality: Excellent</div>
                <div className="text-xs text-blue-900 leading-relaxed"><strong>Tip:</strong> Perfect weather for a sunset cruise or beachfront dining tonight.</div>
              </div>
            </div>

            {/* Map Widget */}
            <div className="bg-bg-white border border-border-color rounded-[24px] overflow-hidden shadow-sm h-[300px] relative group">
              {!isLoading && (
                <iframe
                  title="Resort Map"
                  src={getMapSrc()}
                  className="w-full h-full border-none absolute inset-0 z-10"
                  loading="lazy"
                />
              )}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl border border-border-color shadow-custom text-sm font-bold text-text-dark opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 cursor-pointer">
                <Map size={14} className="text-gold" /> Expand Map
              </div>
            </div>

            {/* Local Events Widget */}
            <div className="bg-bg-white border border-border-color p-5 rounded-[24px] shadow-sm">
              <h4 className="text-sm font-bold text-text-dark mb-4 uppercase tracking-wider text-[11px]">Happening Nearby</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">🎵</div>
                  <div>
                    <div className="text-sm font-bold text-text-dark">Sunset Music Fest</div>
                    <div className="text-xs text-text-gray">Tonight at 6:00 PM</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg font-bold">🍜</div>
                  <div>
                    <div className="text-sm font-bold text-text-dark">Weekend Night Market</div>
                    <div className="text-xs text-text-gray">0.5 miles away</div>
                  </div>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] lg:hidden">
        <div className="bg-primary text-white px-6 py-3.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex items-center gap-6">
          <button className="flex items-center gap-2 text-sm font-bold text-white bg-transparent border-none cursor-pointer">
            <Filter size={16} /> Filters
          </button>
          <div className="w-px h-5 bg-white/20"></div>
          <button className="flex items-center gap-2 text-sm font-bold text-white bg-transparent border-none cursor-pointer">
            <Map size={16} /> Map
          </button>
        </div>
      </div>

    </div>
  );
}

export default SearchResults;
