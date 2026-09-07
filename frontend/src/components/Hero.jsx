import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRight,
  Play,
  Sparkles,
  Star,
  ShieldCheck,
  Wand2,
  Sun,
  IndianRupee,
  ArrowDown,
  ChevronDown,
  Minus,
  Plus,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";



import SearchLoadingOverlay from "./SearchLoadingOverlay";
import herovideo from "../assets/images/hero-video.mp4";
import CustomCalendar from "./CustomCalendar";




// Indian destinations grouped by category
const DESTINATIONS = [
  { group: "🏖️ Beach", places: [
    { name: "Goa", region: "West Coast, India", emoji: "🌊" },
    { name: "Kovalam", region: "Kerala, India", emoji: "🌴" },
    { name: "Andaman Islands", region: "Bay of Bengal, India", emoji: "🏝️" },
    { name: "Gokarna", region: "Karnataka, India", emoji: "🐚" },
    { name: "Pondicherry", region: "Tamil Nadu, India", emoji: "🌅" },
    { name: "Lakshadweep", region: "Arabian Sea, India", emoji: "🪸" },
  ]},
  { group: "🏔️ Mountain", places: [
    { name: "Manali", region: "Himachal Pradesh, India", emoji: "❄️" },
    { name: "Shimla", region: "Himachal Pradesh, India", emoji: "🌲" },
    { name: "Mussoorie", region: "Uttarakhand, India", emoji: "⛰️" },
    { name: "Darjeeling", region: "West Bengal, India", emoji: "🍵" },
    { name: "Munnar", region: "Kerala, India", emoji: "🌿" },
    { name: "Nainital", region: "Uttarakhand, India", emoji: "🏞️" },
    { name: "Srinagar", region: "Kashmir, India", emoji: "🪷" },
  ]},
  { group: "🏛️ Heritage & Culture", places: [
    { name: "Udaipur", region: "Rajasthan, India", emoji: "🏰" },
    { name: "Jaipur", region: "Rajasthan, India", emoji: "🐘" },
    { name: "Varanasi", region: "Uttar Pradesh, India", emoji: "🪔" },
    { name: "Jodhpur", region: "Rajasthan, India", emoji: "🏜️" },
    { name: "Mysuru", region: "Karnataka, India", emoji: "👑" },
  ]},
  { group: "🌴 Backwaters & Nature", places: [
    { name: "Alleppey", region: "Kerala, India", emoji: "🚣" },
    { name: "Coorg", region: "Karnataka, India", emoji: "☕" },
    { name: "Ooty", region: "Tamil Nadu, India", emoji: "🌸" },
    { name: "Wayanad", region: "Kerala, India", emoji: "🦋" },
    { name: "Meghalaya", region: "North East, India", emoji: "🌧️" },
    { name: "Rishikesh", region: "Uttarakhand, India", emoji: "🧘" },
  ]},
];

function Hero() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  




  // Dropdown visibility states
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [calendarSelectionMode, setCalendarSelectionMode] = useState("checkIn");
  const [locationSearch, setLocationSearch] = useState("");

  // Refs for outside-click detection
  const locationRef = useRef(null);
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);
  const guestsRef = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(e.target)) {
        setShowGuestsDropdown(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Search state
  const [location, setLocation] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const [roomCount, setRoomCount] = useState(1);
  const [guestsSelected, setGuestsSelected] = useState(false);

  // Derived display strings
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return "Select date";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "long" });
  };

  const checkIn = formatDate(checkInDate) || "Select Date";
  const checkOut = formatDate(checkOutDate) || "Select Date";
  const guests = guestsSelected
    ? `${guestCount} Adult${guestCount !== 1 ? "s" : ""}${childCount > 0 ? `, ${childCount} Child${childCount !== 1 ? "ren" : ""}` : ""}, ${roomCount} Room${roomCount !== 1 ? "s" : ""}`
    : "Select Guests & Rooms";

  // Min date for check-in (today)
  const today = new Date().toISOString().split("T")[0];

  const handleSelectLocation = (place) => {
    setLocation(`${place.name}, ${place.region.split(",")[0]}`);
    setShowLocationDropdown(false);
    setLocationSearch("");
  };

  // Filter destinations by search
  const filteredDestinations = DESTINATIONS.map(group => ({
    ...group,
    places: group.places.filter(p =>
      p.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      p.region.toLowerCase().includes(locationSearch.toLowerCase())
    )
  })).filter(g => g.places.length > 0);



  const [showDestinations, setShowDestinations] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
  };

  const handleSearchComplete = () => {
    setIsSearching(false);
    const finalGuests = guestsSelected 
      ? `${guestCount} Adult${guestCount !== 1 ? "s" : ""}${childCount > 0 ? `, ${childCount} Child${childCount !== 1 ? "ren" : ""}` : ""}, ${roomCount} Room${roomCount !== 1 ? "s" : ""}`
      : "2 Guests, 1 Room";
    
    const searchPayload = {
      location,
      checkInDate: checkInDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      checkOutDate: checkOutDate || new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
      checkIn,
      checkOut,
      guestCount,
      childCount,
      roomCount,
      guestsLabel: finalGuests
    };

    try {
      sessionStorage.setItem("reservo_search_state", JSON.stringify(searchPayload));
    } catch (e) {}

    navigate("/search", { state: searchPayload });
  };

  const scrollToExplore = () => {
    const el = document.getElementById("explore");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    
    <section className="relative w-full min-h-[600px] md:min-h-[700px] md:h-screen flex flex-col items-center justify-center pt-16 md:pt-24 pb-12 md:pb-16 overflow-hidden">
      
      {/* Background Video */}
<div
  className="absolute inset-0 z-10 overflow-hidden"
  style={{
    transform: `translateY(${scrollY * 0.3}px) scale(${
      1 + scrollY * 0.0002
    })`,
  }}
>
  <video
    className="absolute inset-0 w-full h-full object-cover"
    src={herovideo}
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
  />
</div>
  





      <div className="relative z-10 w-full max-w-[1300px] mx-auto px-6 flex flex-col lg:flex-row justify-between items-center gap-12 mt-4 md:mt-10">
        
        {/* Left Content Area */}
        <div className="flex-1 max-w-[600px] text-white" style={{ transform: `translateY(${-scrollY * 0.08}px)`, opacity: Math.max(0, 1 - scrollY / 700) }}>
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-md mb-6 shadow-lg">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-[11px] font-bold uppercase tracking-[1px] text-white/90">AI-POWERED TRAVEL PLANNER</span>
          </div>

          {/* Title */}
          <h1 className="font-extrabold text-[36px] sm:text-[56px] lg:text-[70px] leading-[1.05] mb-6 font-serif tracking-tight drop-shadow-xl text-white">
  Book Smart.<br />
  Stay <span className="italic text-white font-serif">Better.</span>
</h1>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 md:mb-12">
            <button 
              onClick={() => navigate("/ai-planner")}
              className="w-full sm:w-auto bg-[#1B5CF8] text-white px-6 py-3.5 rounded-full text-[15px] font-bold border-none cursor-pointer flex items-center justify-center gap-2 hover:bg-[#1549d4] transition-all shadow-[0_10px_25px_rgba(27,92,248,0.4)]"
            >
              <Sparkles size={18} /> Launch Rivo AI Planner
            </button>
            <button 
              onClick={scrollToExplore}
              className="w-full sm:w-auto bg-black/30 backdrop-blur-md border border-white/20 text-white px-6 py-3.5 rounded-full text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-black/50 transition-all shadow-lg"
            >
              Explore Resorts <ArrowRight size={18} />
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-white/10 bg-black/20 backdrop-blur-sm">
              <div className="flex -space-x-2">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=32&h=32&q=80" alt="User" className="w-8 h-8 rounded-full border-2 border-transparent object-cover" />
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=32&h=32&q=80" alt="User" className="w-8 h-8 rounded-full border-2 border-transparent object-cover" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=32&h=32&q=80" alt="User" className="w-8 h-8 rounded-full border-2 border-transparent object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white leading-tight">10,000+</span>
                <span className="text-[11px] text-white/70">Happy Travelers</span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-white/10 bg-black/20 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Star size={14} className="fill-current text-teal-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white leading-tight">4.9/5</span>
                <span className="text-[11px] text-white/70">12K+ Reviews</span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-white/10 bg-black/20 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <ShieldCheck size={14} className="text-teal-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white leading-tight">Best Price</span>
                <span className="text-[11px] text-white/70">Guaranteed</span>
              </div>
            </div>
          </div>

        </div>

      </div>


      {/* Floating Bottom Search Bar */}
      <div className="w-[95%] mx-auto relative md:absolute md:bottom-6 left-0 md:left-1/2 translate-x-0 md:-translate-x-1/2 max-w-[1100px] bg-bg-white/95 backdrop-blur-xl rounded-3xl md:rounded-[100px] p-4 md:p-3 mt-8 md:mt-0 shadow-[0_30px_60px_rgba(47,128,237,0.15)] flex flex-col md:flex-row items-center justify-between border border-border-color transition-colors duration-300 z-20">
        
        <div className="flex-1 flex flex-col md:flex-row items-center w-full divide-y md:divide-y-0 md:divide-x divide-border-color">
          
          {/* Location - Clickable Dropdown */}
          <div className="flex-1 relative w-full" ref={locationRef}>
            <div 
              onClick={() => { setShowLocationDropdown(!showLocationDropdown); setShowGuestsDropdown(false); }}
              className="flex items-center gap-3 px-6 py-2 md:py-0 w-full cursor-pointer group"
            >
              <MapPin size={20} className={`transition-colors ${showLocationDropdown ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
              <div className="flex flex-col w-full text-left">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Where to?</label>
                <span className="text-[15px] font-bold text-text-dark transition-colors duration-300">
                  {location || "Select Destination"}
                </span>
                <span className="text-[12px] text-gray-400">All Destinations <ChevronDown size={12} className={`inline transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} /></span>
              </div>
            </div>

            {/* Location Dropdown (Positions above search bar) */}
            {showLocationDropdown && (
              <div className="absolute bottom-full left-0 right-0 md:left-0 md:right-auto md:w-[380px] mb-3 bg-bg-white rounded-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.15)] border border-border-color overflow-hidden z-50 animate-fade-in">
                {/* Search Input */}
                <div className="p-3 border-b border-border-color">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-bg-card)] border border-border-color">
                    <Search size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && locationSearch.trim()) {
                          setLocation(locationSearch.trim());
                          setShowLocationDropdown(false);
                          setLocationSearch("");
                        }
                      }}
                      placeholder="Search destinations..."
                      className="w-full text-[13px] font-medium bg-transparent outline-none text-text-dark placeholder:text-gray-400 transition-colors duration-300"
                      autoFocus
                    />
                    {locationSearch && (
                      <button onClick={(e) => { e.stopPropagation(); setLocationSearch(""); }} className="text-gray-400 hover:text-text-dark">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Destinations List */}
                <div className="max-h-[320px] overflow-y-auto overscroll-contain">
                  {locationSearch.trim() && (
                    <button
                      onClick={() => {
                        setLocation(locationSearch.trim());
                        setShowLocationDropdown(false);
                        setLocationSearch("");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-border-color bg-primary/5"
                    >
                      <span className="text-lg">🔍</span>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-primary">Use custom location</span>
                        <span className="text-[12px] text-gray-400">"{locationSearch.trim()}"</span>
                      </div>
                    </button>
                  )}

                  {filteredDestinations.length > 0 ? (
                    filteredDestinations.map((group, gIdx) => (
                      <div key={gIdx}>
                        <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-[var(--color-bg-card)] sticky top-0 transition-colors duration-300">
                          {group.group}
                        </div>
                        {group.places.map((place, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSelectLocation(place)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors ${
                              location === `${place.name}, ${place.region.split(",")[0]}` ? 'bg-primary/10' : ''
                            }`}
                          >
                            <span className="text-lg">{place.emoji}</span>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-bold text-text-dark transition-colors duration-300">{place.name}</span>
                              <span className="text-[12px] text-gray-400">{place.region}</span>
                            </div>
                            {location === `${place.name}, ${place.region.split(",")[0]}` && (
                              <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ))
                  ) : (
                    !locationSearch.trim() && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-[13px] text-gray-400 font-medium">No destinations found</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dates Container - Check In & Check Out */}
          <div className="flex-1 flex flex-col md:flex-row w-full divide-y md:divide-y-0 md:divide-x divide-border-color relative" ref={calendarRef}>
            
            {/* Check In */}
            <div 
              onClick={() => { setCalendarSelectionMode("checkIn"); setShowCalendarDropdown(true); setShowLocationDropdown(false); setShowGuestsDropdown(false); }}
              className="flex-1 flex items-center gap-3 px-6 py-2 md:py-0 cursor-pointer group"
            >
              <Calendar size={20} className={`transition-colors ${showCalendarDropdown ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
              <div className="flex flex-col w-full text-left">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Check In</label>
                <span className="text-[15px] font-bold text-text-dark transition-colors duration-300">
                  {checkIn}
                </span>
                <span className="text-[12px] text-gray-400">{getDayName(checkInDate)}</span>
              </div>
            </div>

            {/* Check Out */}
            <div 
              onClick={() => { setCalendarSelectionMode("checkOut"); setShowCalendarDropdown(true); setShowLocationDropdown(false); setShowGuestsDropdown(false); }}
              className="flex-1 flex items-center gap-3 px-6 py-2 md:py-0 cursor-pointer group"
            >
              <Calendar size={20} className={`transition-colors ${showCalendarDropdown ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
              <div className="flex flex-col w-full text-left">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Check Out</label>
                <span className="text-[15px] font-bold text-text-dark transition-colors duration-300">
                  {checkOut}
                </span>
                <span className="text-[12px] text-gray-400">{getDayName(checkOutDate)}</span>
              </div>
            </div>

            {/* Custom Calendar Dropdown */}
            {showCalendarDropdown && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-[320px] mb-3 bg-bg-white rounded-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.15)] border border-border-color overflow-hidden z-50 animate-fade-in p-2">
                <CustomCalendar
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  activeField={calendarSelectionMode}
                  onActiveFieldChange={(field) => setCalendarSelectionMode(field)}
                  onDateChange={(ci, co, status) => {
                    setCheckInDate(ci);
                    setCheckOutDate(co);
                    if (status === "done" && ci && co) {
                      setTimeout(() => setShowCalendarDropdown(false), 250);
                    }
                  }}
                  isDarkMode={document.body.classList.contains("dark-theme")}
                />
              </div>
            )}
          </div>

          {/* Guests & Rooms - Stepper Dropdown */}
          <div className="flex-1 relative w-full" ref={guestsRef}>
            <div 
              onClick={() => { setShowGuestsDropdown(!showGuestsDropdown); setShowLocationDropdown(false); setGuestsSelected(true); }}
              className="flex items-center gap-3 px-6 py-2 md:py-0 w-full cursor-pointer group"
            >
              <Users size={20} className={`transition-colors ${showGuestsDropdown ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
              <div className="flex flex-col w-full text-left">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Guests & Rooms</label>
                <span className="text-[15px] font-bold text-text-dark transition-colors duration-300">
                  {guests}
                </span>
                <span className="text-[12px] text-gray-400">Rooms <ChevronDown size={12} className={`inline transition-transform ${showGuestsDropdown ? 'rotate-180' : ''}`} /></span>
              </div>
            </div>

            {/* Guests Dropdown (Positions above search bar) */}
            {showGuestsDropdown && (
              <div className="absolute bottom-full right-0 md:right-0 md:left-auto w-full md:w-[280px] mb-3 bg-bg-white rounded-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.15)] border border-border-color overflow-hidden z-50 animate-fade-in p-5 space-y-5">
                {/* Adults Stepper */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-text-dark transition-colors duration-300">Adults</p>
                    <p className="text-[12px] text-gray-400">Ages 13 or above</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setGuestCount(Math.max(1, guestCount - 1)); }}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                        guestCount <= 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-border-color text-text-dark hover:border-primary hover:text-primary'
                      }`}
                      disabled={guestCount <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-[16px] font-bold text-text-dark w-6 text-center transition-colors duration-300">{guestCount}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setGuestCount(Math.min(12, guestCount + 1)); }}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                        guestCount >= 12 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-border-color text-text-dark hover:border-primary hover:text-primary'
                      }`}
                      disabled={guestCount >= 12}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-border-color"></div>

                {/* Children Stepper */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-text-dark transition-colors duration-300">Children</p>
                    <p className="text-[12px] text-gray-400">Ages 2–12</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setChildCount(Math.max(0, childCount - 1)); }}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                        childCount <= 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-border-color text-text-dark hover:border-primary hover:text-primary'
                      }`}
                      disabled={childCount <= 0}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-[16px] font-bold text-text-dark w-6 text-center transition-colors duration-300">{childCount}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setChildCount(Math.min(6, childCount + 1)); }}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                        childCount >= 6 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-border-color text-text-dark hover:border-primary hover:text-primary'
                      }`}
                      disabled={childCount >= 6}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-border-color"></div>

                {/* Rooms Stepper */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-text-dark transition-colors duration-300">Rooms</p>
                    <p className="text-[12px] text-gray-400">Number of rooms</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRoomCount(Math.max(1, roomCount - 1)); }}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                        roomCount <= 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-border-color text-text-dark hover:border-primary hover:text-primary'
                      }`}
                      disabled={roomCount <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-[16px] font-bold text-text-dark w-6 text-center transition-colors duration-300">{roomCount}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRoomCount(Math.min(6, roomCount + 1)); }}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                        roomCount >= 6 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-border-color text-text-dark hover:border-primary hover:text-primary'
                      }`}
                      disabled={roomCount >= 6}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowGuestsDropdown(false)}
                  className="w-full py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl hover:bg-primary-dark transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>

        </div>

        <button 
          onClick={handleSearch}
          className="w-full md:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-2xl md:rounded-full font-bold text-[14px] flex items-center justify-center gap-2 border-none cursor-pointer transition-all shadow-[0_5px_15px_rgba(27,92,248,0.3)] shrink-0 ml-0 md:ml-2 mt-4 md:mt-0"
        >
          <Search size={18} /> Search Stays
        </button>
      </div>

      {/* Scroll Down Indicator */}
      <div className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-70 animate-bounce cursor-pointer" onClick={scrollToExplore}>
        <div className="w-7 h-7 rounded-full border border-white flex items-center justify-center">
          <ArrowDown size={14} className="text-white" />
        </div>
        <span className="text-white text-[10px] font-bold tracking-widest uppercase">Scroll to explore</span>
      </div>

      {isSearching && (
        <SearchLoadingOverlay destination={location} onComplete={handleSearchComplete} />
      )}
    </section>
  );
}

export default Hero;