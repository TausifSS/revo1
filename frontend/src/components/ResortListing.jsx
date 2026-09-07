import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { Star, Heart, MapPin, Sparkles, ChevronRight, SlidersHorizontal, ArrowUpDown, RotateCcw, Check, X, ArrowLeft, Search, Calendar, Users } from 'lucide-react';
import { CATEGORIES } from '../data/resortsData';
import { resortService } from '../services/resort.service';
import { ResortCardSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import ErrorScreen from './ErrorScreen';

export default function ResortListing({ onSelectResort, activeCategory: propActiveCategory = 'all', setActiveCategory: propSetActiveCategory, isDarkMode, onAskRivo }) {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const searchState = routerLocation.state || {};

  const [internalCategory, setInternalCategory] = useState(propActiveCategory);
  const activeCategory = propSetActiveCategory ? propActiveCategory : internalCategory;
  const setActiveCategory = propSetActiveCategory || setInternalCategory;

  const getInitialQuery = () => {
    const params = new URLSearchParams(routerLocation.search);
    return params.get("destination") || params.get("location") || params.get("q") || searchState.location || "";
  };

  const [searchQuery, setSearchQuery] = useState(getInitialQuery);
  const [searchInput, setSearchInput] = useState(getInitialQuery);
  const [searchCheckIn, setSearchCheckIn] = useState(() => {
    const params = new URLSearchParams(routerLocation.search);
    return params.get("checkIn") || params.get("checkin") || searchState.checkIn || "";
  });
  const [searchCheckOut, setSearchCheckOut] = useState(() => {
    const params = new URLSearchParams(routerLocation.search);
    return params.get("checkOut") || params.get("checkout") || searchState.checkOut || "";
  });
  const [searchGuests, setSearchGuests] = useState(() => {
    const params = new URLSearchParams(routerLocation.search);
    return params.get("guests") || searchState.guests || "";
  });

  const isSearchActive = searchQuery.trim().length > 0;

  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const dest = params.get("destination") || params.get("location") || params.get("q") || searchState.location || "";
    const ci = params.get("checkIn") || params.get("checkin") || searchState.checkIn || "";
    const co = params.get("checkOut") || params.get("checkout") || searchState.checkOut || "";
    const g = params.get("guests") || searchState.guests || "";

    setSearchQuery(dest);
    setSearchInput(dest);
    if (ci) setSearchCheckIn(ci);
    if (co) setSearchCheckOut(co);
    if (g) setSearchGuests(g);
  }, [routerLocation.search, routerLocation.state]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Resorts data states
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter Panel Toggle State
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sort State
  const [sortBy, setSortBy] = useState('recommended');

  // Filter States
  const [maxPrice, setMaxPrice] = useState(150000);
  const [minRating, setMinRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedPerks, setSelectedPerks] = useState([]);
  const { wishlist, toggleWishlist } = useWishlist();

  // Currency Converter states
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [exchangeRate, setExchangeRate] = useState(1);

  useEffect(() => {
    const handleStorage = () => {
      const cur = localStorage.getItem("reservo-currency") || "en_inr";
      if (cur === "en_usd") {
        setCurrencySymbol("$");
        setExchangeRate(0.012);
      } else {
        setCurrencySymbol("₹");
        setExchangeRate(1);
      }
    };
    handleStorage();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const fetchResorts = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (searchQuery.trim()) {
        data = await resortService.searchResorts(searchQuery);
      } else {
        data = await resortService.getAllResorts();
      }
      setResorts(data);
    } catch (err) {
      if (err.message === "No resorts found" || err.message === "No resorts available from backend") {
        setResorts([]);
      } else {
        setError(err.message || "Failed to load luxury stays.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResorts();
  }, [searchQuery]);

  const toggleFavorite = (resort, e) => {
    e.stopPropagation();
    toggleWishlist(resort);
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const togglePerk = (perk) => {
    setSelectedPerks(prev =>
      prev.includes(perk) ? prev.filter(p => p !== perk) : [...prev, perk]
    );
  };

  const resetAllFilters = () => {
    setMaxPrice(150000);
    setMinRating(0);
    setSelectedAmenities([]);
    setSelectedPerks([]);
    setActiveCategory('all');
    setSortBy('recommended');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchInput('');
    setSearchCheckIn('');
    setSearchCheckOut('');
    setSearchGuests('');
    // Clear router state so refresh doesn't re-apply
    navigate(routerLocation.pathname, { replace: true, state: {} });
  };

  useEffect(() => {
    const applyRivoMode = (mode) => {
      if (!mode) return;
      setIsFilterOpen(true);
      if (mode === "luxury") {
        setSortBy("price-high");
        setMaxPrice(150000);
        setSelectedAmenities(["Personal AI Butler", "Private Beach Access"]);
      } else if (mode === "budget") {
        setSortBy("price-low");
        setMaxPrice(15000);
        setSelectedAmenities([]);
      } else if (mode === "relax") {
        setSortBy("rating-high");
        setMaxPrice(150000);
        setSelectedAmenities(["Aura Ayurvedic Spa", "Infinity Edge Pool"]);
      } else if (mode === "adventure") {
        setSortBy("popular");
        setMaxPrice(150000);
        setSelectedAmenities(["Private Helipad Access", "Scuba & Water Sports"]);
      } else if (mode === "support") {
        resetAllFilters();
      }
    };

    // Check if there is an active mode set in localStorage on mount
    const savedMode = localStorage.getItem("reservo-active-mode");
    if (savedMode) {
      applyRivoMode(savedMode);
      // Clear it after applying so it doesn't lock filters on every page load
      localStorage.removeItem("reservo-active-mode");
    }

    const handleRivoMode = (e) => {
      const mode = e.detail?.mode;
      applyRivoMode(mode);
    };

    window.addEventListener("rivo-mode", handleRivoMode);
    return () => window.removeEventListener("rivo-mode", handleRivoMode);
  }, []);

  // Search text matching logic (City, Resort Name, Description, Category)
  const matchesSearch = (resort) => {
    if (!isSearchActive) return true;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const locationStr = typeof resort.location === 'string' 
      ? resort.location 
      : `${resort.location?.address || ''} ${resort.location?.city || ''} ${resort.location?.state || ''} ${resort.location?.country || ''}`;

    const textToSearch = [
      resort.name,
      resort.title,
      locationStr,
      resort.city,
      resort.region,
      resort.description,
      resort.category,
      resort.categoryLabel,
      resort.badge
    ].filter(Boolean).join(" ").toLowerCase();

    if (textToSearch.includes(q)) return true;

    const words = q.split(/\s+/).filter(Boolean);
    return words.every(word => textToSearch.includes(word));
  };

  // Filter Logic
  const filteredResorts = resorts.filter(resort => {
    const matchesSearchQuery = matchesSearch(resort);
    const resortCat = (resort.category || '').toLowerCase();
    const activeCat = (activeCategory || 'all').toLowerCase();
    const matchesCategory = activeCat === 'all' || resortCat === activeCat;
    
    // If maxPrice is at the top limit (40000+), treat as no price ceiling
    const matchesPrice = maxPrice >= 40000 ? true : (Number(resort.price) || 0) <= maxPrice;
    
    const numericRating = typeof resort.rating === 'number' ? resort.rating : (parseFloat(resort.rating) || 5.0);
    const matchesRating = numericRating >= minRating;
    
    const matchesAmenities = selectedAmenities.length === 0 || selectedAmenities.every(a => {
      const inHighlights = resort.highlights && resort.highlights.some(h => String(h).toLowerCase().includes(a.toLowerCase()));
      const inAmenities = resort.amenities && resort.amenities.some(item => 
        (typeof item === 'string' ? item : item.name || '').toLowerCase().includes(a.toLowerCase())
      );
      return inHighlights || inAmenities;
    });

    return matchesSearchQuery && matchesCategory && matchesPrice && matchesRating && matchesAmenities;
  });

  // Sort Logic
  const sortedResorts = [...filteredResorts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating-high') return b.rating - a.rating;
    if (sortBy === 'popular') return b.reviewsCount - a.reviewsCount;
    return 0;
  });

  const getImageFallback = () =>
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80';

  const activeFilterCount = (activeCategory !== 'all' ? 1 : 0) +
    (maxPrice < 150000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    selectedAmenities.length +
    selectedPerks.length;

  // Reusable Filter Form Component
  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* 1. Sort Options */}
      <div className="space-y-2">
        <label htmlFor="filter-sort" className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#2563EB]" /> Sort By
        </label>
        <select
          id="filter-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`w-full p-3 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none focus:border-[#2563EB] ${
            isDarkMode ? 'bg-[#111827] border-[#334155] text-white' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
          }`}
        >
          <option value="recommended">✨ Recommended / AI Match</option>
          <option value="price-low">💰 Price: Low to High</option>
          <option value="price-high">💎 Price: High to Low</option>
          <option value="rating-high">⭐ Rating: Highest First</option>
          <option value="popular">🔥 Popularity & Reviews</option>
        </select>
      </div>

      {/* 2. Price Range */}
      <div className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-stone-700">
        <div className="flex justify-between items-center text-xs">
          <label htmlFor="filter-price" className="font-bold uppercase tracking-wider text-stone-400">Max Budget / Night</label>
          <span className="font-bold text-[#2563EB] text-sm">{currencySymbol}{(Math.round(maxPrice * exchangeRate)).toLocaleString()}</span>
        </div>
        <input
          id="filter-price"
          type="range"
          min="5000"
          max="150000"
          step="5000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#2563EB] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-stone-400 font-medium">
          <span>{currencySymbol}{(Math.round(5000 * exchangeRate)).toLocaleString()}</span>
          <span>{currencySymbol}{(Math.round(75000 * exchangeRate)).toLocaleString()}</span>
          <span>{currencySymbol}{(Math.round(150000 * exchangeRate)).toLocaleString()}+</span>
        </div>
      </div>

      {/* 3. Rating */}
      <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Guest Rating</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Any', value: 0 },
            { label: '4.5+ ⭐', value: 4.5 },
            { label: '4.8+ ⭐', value: 4.8 },
            { label: '5.0 ⭐', value: 5.0 }
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setMinRating(item.value)}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold border text-center transition ${
                minRating === item.value
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : isDarkMode
                    ? 'bg-[#111827] text-[#CBD5E1] border-[#334155]'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Luxury Amenities */}
      <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Popular Amenities</label>
        <div className="space-y-1.5">
          {[
            'Private Beach Access',
            'Infinity Edge Pool',
            'Aura Ayurvedic Spa',
            'Personal AI Butler',
            'Private Helipad Access',
            'Scuba & Water Sports'
          ].map((amenity, idx) => {
            const isChecked = selectedAmenities.includes(amenity);
            return (
              <label
                key={idx}
                onClick={() => toggleAmenity(amenity)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  isChecked
                    ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] font-bold'
                    : isDarkMode
                      ? 'bg-[#111827] border-[#334155] text-[#CBD5E1]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'
                }`}
              >
                <span>{amenity}</span>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isChecked ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-stone-400'
                }`}>
                  {isChecked && <Check className="w-3 h-3" />}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Stay Perks */}
      <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Inclusive Perks</label>
        <div className="space-y-1.5">
          {[
            '100% Hand-Verified Guarantee',
            'Free Airport Transfer',
            'Breakfast Included',
            'Flexible Cancellation'
          ].map((perk, idx) => {
            const isChecked = selectedPerks.includes(perk);
            return (
              <label
                key={idx}
                onClick={() => togglePerk(perk)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  isChecked
                    ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] font-bold'
                    : isDarkMode
                      ? 'bg-[#111827] border-[#334155] text-[#CBD5E1]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'
                }`}
              >
                <span>{perk}</span>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isChecked ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-stone-400'
                }`}>
                  {isChecked && <Check className="w-3 h-3" />}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <ErrorScreen type="network" message={error} onRetry={fetchResorts} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-12">
      {/* MOBILE EXCLUSIVE FULL-SCREEN SORT & FILTER VIEW (Only shown when filter is open on Mobile) */}
      {isFilterOpen && (
        <div className="block lg:hidden space-y-6 animate-fade-in">
          {/* Mobile Filter Header */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between shadow ${
            isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="flex items-center gap-2 text-xs font-bold text-[#2563EB]"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Resorts
            </button>
            <h2 className={`text-base font-bold ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
              Sort & Filter Menu
            </h2>
            {activeFilterCount > 0 && (
              <button onClick={resetAllFilters} className="text-xs text-[#2563EB] font-bold">
                Reset ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Filter Controls Container */}
          <div className={`p-6 rounded-3xl border shadow-xl ${
            isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
          }`}>
            {renderFilterControls()}
          </div>

          {/* Mobile Apply Button */}
          <button
            onClick={() => setIsFilterOpen(false)}
            className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-xl transition"
          >
            Apply Filters & View ({sortedResorts.length}) Stays
          </button>
        </div>
      )}

      {/* REGULAR RESORT LISTING VIEW (Hidden on Mobile when Mobile Filter View is active) */}
      <div className={isFilterOpen ? 'hidden lg:block space-y-12' : 'space-y-12'}>

        {/* Search Results Banner */}
        {isSearchActive && (
          <div className={`rounded-2xl border p-4 sm:p-5 animate-fade-in ${
            isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-[#DBEAFE]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-[#2563EB]/20' : 'bg-[#2563EB]/10'
                }`}>
                  <Search className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
                    Search results for "{searchQuery}"
                  </h2>
                  <div className={`flex flex-wrap items-center gap-3 mt-1 text-xs ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#64748B]'}`}>
                    {searchCheckIn && (
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-[#2563EB]" /> {searchCheckIn} {searchCheckOut ? `→ ${searchCheckOut}` : ''}
                      </span>
                    )}
                    {searchGuests && (
                      <span className="flex items-center gap-1 font-semibold">
                        <Users className="w-3.5 h-3.5 text-[#2563EB]" /> {searchGuests}
                      </span>
                    )}
                    <span className="font-bold text-[#2563EB]">
                      {sortedResorts.length} {sortedResorts.length === 1 ? 'stay' : 'stays'} found
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={clearSearch}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  isDarkMode
                    ? 'bg-[#334155] text-[#CBD5E1] hover:bg-[#475569]'
                    : 'bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0] shadow-xs'
                }`}
              >
                <X className="w-3.5 h-3.5" /> Clear Search
              </button>
            </div>
          </div>
        )}

        {/* Category Filter Tabs Bar */}
        <section className="space-y-6">
          <div className={`flex items-center justify-between overflow-x-auto pb-3 space-x-2 border-b ${
            isDarkMode ? 'border-[#334155]' : 'border-[#E2E8F0]'
          }`}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeCategory === cat.id
                    ? isDarkMode
                      ? 'bg-[#3B82F6] text-white shadow-md border border-[#60A5FA]/40'
                      : 'bg-[#2563EB] text-white shadow-md border border-[#60A5FA]/40'
                    : isDarkMode
                      ? 'bg-[#1E293B] text-[#CBD5E1] hover:bg-[#334155] border border-[#334155]'
                      : 'bg-white text-[#475569] hover:bg-[#DBEAFE] border border-[#E2E8F0]'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
            <div>
              <div className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#93C5FD]' : 'text-[#2563EB]'}`}>
                {isSearchActive ? 'SEARCH RESULTS' : 'POPULAR DESTINATIONS'}
              </div>
              <h1 className={`text-3xl sm:text-4xl font-bold mt-1 ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
                {isSearchActive ? `Stays in ${searchQuery}` : 'Trending Vacation Stays'}
              </h1>
              <p className={`text-xs sm:text-sm max-w-xl mt-1 ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                {isSearchActive
                  ? `Showing ${sortedResorts.length} verified luxury stays matching your search.`
                  : 'Discover verified luxury retreats, overwater villas, and boutique resorts around the world.'
                }
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                Showing <strong className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{loading ? "..." : sortedResorts.length}</strong> stays
              </span>

              {/* Sort & Filter Button Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold shadow-lg transition transform hover:scale-105 ${
                  isFilterOpen
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{isFilterOpen ? 'Hide Filters' : 'Sort & Filter'}</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-[#2563EB] text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Responsive Layout */}
          <div className="flex flex-col lg:flex-row gap-8 pt-4 items-start transition-all duration-500 ease-in-out">
            {/* Resort Cards Grid */}
            <div className={`transition-all duration-500 ease-in-out w-full ${
              isFilterOpen ? 'lg:w-2/3' : 'lg:w-full'
            }`}>
              {loading ? (
                /* Shimmer Loader Grid */
                <div className={`grid gap-6 ${
                  isFilterOpen
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {[...Array(6)].map((_, i) => (
                    <ResortCardSkeleton key={i} />
                  ))}
                </div>
              ) : sortedResorts.length > 0 ? (
                <div className={`grid gap-6 transition-all duration-500 ${
                  isFilterOpen
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {sortedResorts.map(resort => {
                    const isFav = wishlist.some(item => item.id === resort.id);
                    return (
                      <div
                        key={resort.id}
                        onClick={() => onSelectResort && onSelectResort(resort)}
                        className={`group rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border cursor-pointer flex flex-col justify-between ${
                          isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
                        }`}
                      >
                        {/* Image */}
                        <div className="relative h-60 overflow-hidden">
                          <img
                            src={resort.heroImage || resort.image || resort.imageUrl || getImageFallback(resort)}
                            alt={resort.name}
                            onError={(e) => {
                              const fallback = getImageFallback(resort);
                              if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />

                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[#2563EB] text-[10px] font-bold uppercase tracking-wider rounded-full shadow border border-white/60">
                              {resort.badge}
                            </span>
                          </div>

                          <button
                            onClick={(e) => toggleFavorite(resort, e)}
                            className={`absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center transition hover:scale-110 shadow ${
                              isFav ? 'text-rose-500' : 'text-stone-700'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                          </button>

                          <div className="absolute bottom-4 right-4 bg-[#0F172A]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow border border-slate-700">
                            from <span className="text-[#60A5FA] text-sm">{currencySymbol}{(Math.round(resort.price * exchangeRate)).toLocaleString()}</span>/night
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={`flex items-center gap-1 font-medium ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                                <MapPin className="w-3.5 h-3.5 text-[#2563EB]" /> {resort.location}
                              </span>
                              <span className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border ${
                                isDarkMode ? 'bg-sky-950/60 text-sky-300 border-sky-800' : 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]'
                              }`}>
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {resort.rating}
                              </span>
                            </div>

                            <h3 className={`text-lg font-bold transition ${
                              isDarkMode ? 'text-[#F8FAFC] group-hover:text-[#60A5FA]' : 'text-[#0F172A] group-hover:text-[#2563EB]'
                            }`}>
                              {resort.name}
                            </h3>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(Array.isArray(resort.highlights) ? resort.highlights : []).slice(0, 3).map((h, i) => (
                              <span key={i} className={`text-[10px] px-2.5 py-1 rounded-full border ${
                                isDarkMode ? 'bg-[#111827] text-[#CBD5E1] border-[#334155]' : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
                              }`}>
                                {h}
                              </span>
                            ))}
                          </div>

                          <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold transition ${
                            isDarkMode ? 'border-[#334155] text-[#93C5FD] group-hover:text-[#60A5FA]' : 'border-[#E2E8F0] text-[#2563EB] group-hover:text-[#1D4ED8]'
                          }`}>
                            <span>Explore Details & Map</span>
                            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState 
                  title={isSearchActive ? `No stays found in "${searchQuery}"` : "No resorts match your criteria"}
                  description={isSearchActive 
                    ? "Rivo couldn't find any luxury stays matching this location. Try searching for Goa, Kerala, Udaipur, Maldives, or Jaisalmer."
                    : "Try resetting your filters, selecting a different search query, or shifting your price sliders."
                  }
                  ctaText={isSearchActive ? "Clear Search" : "Reset All Filters"}
                  onCtaClick={isSearchActive ? clearSearch : resetAllFilters}
                  icon={isSearchActive ? Search : SlidersHorizontal}
                />
              )}
            </div>

            {/* Desktop Right-Side Filter Menu */}
            {isFilterOpen && (
              <aside className="hidden lg:block w-1/3 space-y-6 animate-fade-in transition-all duration-500">
                <div className={`rounded-3xl p-6 shadow-xl border sticky top-6 space-y-6 ${
                  isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-700">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                      <h3 className={`text-base font-bold ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
                        Sort & Filter Menu
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeFilterCount > 0 && (
                        <button
                          onClick={resetAllFilters}
                          className="text-[11px] text-[#2563EB] hover:underline font-bold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                          isDarkMode ? 'bg-[#334155] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {renderFilterControls()}
                </div>
              </aside>
            )}
          </div>
        </section>


      </div>
    </div>
  );
}
