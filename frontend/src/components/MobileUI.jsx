import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Moon, Sun, Heart, Bell, MapPin, Calendar, Users,
  Search, ArrowRight, Waves, Mountain, Home, Droplets,
  Sparkles, Star, ChevronRight, User, Send,
  LogIn, UserPlus, HelpCircle, Phone, Shield, FileText,
  LayoutGrid, BookOpen, Settings, LogOut, Sliders, Building2
} from "lucide-react";
import rivoMascot from "../assets/images/rivo_mascot.jpg";
import rivoSearching from "../assets/images/rivo_searching.png";
import rivoConfirmed from "../assets/images/rivo_confirmed.png";
import rivoPlanner from "../assets/images/rivo_planner.png";
import rivoSupport from "../assets/images/rivo_support.png";
import rivoWaving from "../assets/images/rivo_waving.png";
import mascotWebp from "../assets/images/mascot_transparent.webp";
import { authService } from "../services/auth.service";
import { resortService } from "../services/resort.service";
import Footer from "./Footer";

const COMPANION_MODES = [
  { id: "support", label: "Support", emoji: "🤖", avatar: rivoSupport, name: "Support" },
  { id: "luxury", label: "Luxury", emoji: "👑", avatar: rivoPlanner, name: "Luxury" },
  { id: "budget", label: "Budget", emoji: "🐷", avatar: rivoSearching, name: "Budget" },
  { id: "relax", label: "Relax", emoji: "🏖️", avatar: rivoMascot, name: "Relax" },
  { id: "adventure", label: "Adventure", emoji: "🏔️", avatar: rivoPlanner, name: "Adventure" }
];

const getAvatarForText = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes("book") || lower.includes("pay") || lower.includes("confirm") || lower.includes("reserve")) {
    return rivoConfirmed;
  }
  if (lower.includes("beach") || lower.includes("goa") || lower.includes("spa") || lower.includes("relax") || lower.includes("pool")) {
    return rivoMascot;
  }
  if (lower.includes("plan") || lower.includes("itinerary") || lower.includes("day") || lower.includes("trip")) {
    return rivoPlanner;
  }
  if (lower.includes("search") || lower.includes("find") || lower.includes("resort") || lower.includes("destination")) {
    return rivoSearching;
  }
  if (lower.includes("help") || lower.includes("support") || lower.includes("concierge") || lower.includes("service")) {
    return rivoSupport;
  }
  return null;
};

const generateAIResponse = (text, availableResorts = []) => {
  const lower = text.toLowerCase();
  
  const locations = ["bali", "maldives", "manali", "dubai", "coorg", "kerala", "santorini", "greece"];
  const matchedLocation = locations.find(loc => lower.includes(loc));

  const amenitiesList = ["pool", "spa", "ocean view", "breakfast", "wifi", "fireplace", "mountain view", "ski", "chef", "gym"];
  const matchedAmenities = amenitiesList.filter(am => lower.includes(am));

  let maxBudget = null;
  const budgetMatch = lower.match(/(?:under|below|less than|max)\s*(\d+)/) || lower.match(/\$\s*(\d+)/) || lower.match(/₹\s*(\d+)/);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1], 10);
  }

  let matches = Array.isArray(availableResorts) ? availableResorts : [];
  
  if (matchedLocation) {
    const locKey = matchedLocation === "greece" ? "santorini" : matchedLocation;
    matches = matches.filter(r => r.location.toLowerCase().includes(locKey));
  }

  if (matchedAmenities.length > 0) {
    matches = matches.filter(r => {
      return matchedAmenities.every(am => {
        return r.amenities.some(item => {
          const itemLower = String(typeof item === "string" ? item : item?.name || "").toLowerCase();
          if (am === "wifi") return itemLower.includes("wifi");
          if (am === "ski") return itemLower.includes("ski");
          return itemLower.includes(am);
        });
      });
    });
  }

  if (maxBudget) {
    matches = matches.filter(r => r.price <= maxBudget);
  }

  if (matches.length > 0) {
    let responseText = `I found some excellent matches for you! Here are ${matches.length} luxury stays that match your request:\n\n`;
    matches.forEach((r, idx) => {
      responseText += `${idx + 1}. **${r.name}** in *${r.location}* — **$${r.price}/night** (${r.rating}⭐). Features: ${r.amenities.slice(0, 3).join(", ")}. "${r.tag}"\n`;
    });
    responseText += `\nWould you like me to check live room availability for any of these?`;
    return responseText;
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hi there! I'm Rivo, your AI travel buddy. I can recommend the perfect luxury stays based on your destination, budget, or preferred amenities. Where are we heading next?";
  }
  
  if (lower.includes("book") || lower.includes("how to") || lower.includes("process")) {
    return "Booking is simple! Choose your destination, select check-in/check-out dates in the search bar, click 'Search Stays', and then select your preferred room. Rivo will take care of the rest!";
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("cheap") || lower.includes("expensive")) {
    return "I can check the current live resort inventory for your destination and budget. Tell me where you want to go or your maximum nightly budget.";
  }

  return "I'm always learning! Let me know where you want to travel (e.g. Bali, Maldives, Dubai) and what amenities you want (e.g. Spa, Pool, Fireplace), and I'll search our luxury collection for you.";
};

const CATEGORIES = [
  { id: "beach", label: "Beach", icon: <Waves size={20} /> },
  { id: "mountain", label: "Mountain", icon: <Mountain size={20} /> },
  { id: "villa", label: "Villas", icon: <Home size={20} /> },
  { id: "pool", label: "Pool", icon: <Droplets size={20} /> },
];

const FEATURED = [
  {
    id: 1, name: "Ayana Resort", location: "Bali, Indonesia",
    price: 320, rating: 4.9, tag: "Top Pick",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2, name: "Anantara Veli", location: "Maldives",
    price: 580, rating: 4.8, tag: "Overwater",
    image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3, name: "Six Senses Zighy", location: "Oman",
    price: 450, rating: 4.9, tag: "Remote Luxury",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
  },
];

const QUICK_REPLIES = [
  { text: "🌴 Suggest beach resorts", key: "beach" },
  { text: "🏔️ Tell me about Manali", key: "manali" },
  { text: "📅 How do I book?", key: "book" }
];

function MobileUI({ isDark, onToggleTheme, children }) {
  const [activeTab, setActiveTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState("beach");
  const { wishlist, toggleWishlist } = useWishlist();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMascotOpen, setIsMascotOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("support");
  const [rivoAvatar, setRivoAvatar] = useState(rivoSupport);
  const [messages, setMessages] = useState([
    { id: 1, sender: "rivo", text: "Hi! I'm Rivo 🤖 Your AI travel buddy. Where would you like to travel today?" }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isMascotHovered, setIsMascotHovered] = useState(false);
  const navigate = useNavigate();
  const [liveResorts, setLiveResorts] = useState([]);

  useEffect(() => {
    let active = true;
    resortService.getAllResorts()
      .then(data => { if (active) setLiveResorts(Array.isArray(data) ? data : []); })
      .catch(err => console.warn("Failed to load live resorts for Rivo:", err));
    return () => { active = false; };
  }, []);
  const location = useLocation();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleReducedMotion = () => {
      setIsReducedMotion(mediaQuery.matches);
    };
    handleReducedMotion();
    mediaQuery.addEventListener("change", handleReducedMotion);
    return () => mediaQuery.removeEventListener("change", handleReducedMotion);
  }, []);

  useEffect(() => {
    if (isReducedMotion || isMascotOpen) {
      setShowBubble(false);
      return;
    }

    const startTime = Date.now();
    const checkTiming = () => {
      if (isMascotHovered) {
        setShowBubble(true);
        return;
      }
      const elapsed = (Date.now() - startTime) % 10000;
      if (elapsed >= 1400 && elapsed <= 2700) {
        setShowBubble(true);
      } else {
        setShowBubble(false);
      }
    };

    const timerId = setInterval(checkTiming, 100);
    return () => clearInterval(timerId);
  }, [isReducedMotion, isMascotOpen, isMascotHovered]);

  const handleMouseEnter = () => {
    setIsMascotHovered(true);
    setShowBubble(true);
  };

  const handleMouseLeave = () => {
    setIsMascotHovered(false);
    setShowBubble(false);
  };

  // Sync activeTab with current URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      setActiveTab("home");
    } else if (path === "/search" || path === "/search-results" || path === "/resorts") {
      setActiveTab("explore");
    } else if (path === "/wishlist") {
      setActiveTab("wishlist");
    } else if (path === "/profile" || path === "/dashboard" || path === "/bookings" || path === "/notifications" || path === "/settings") {
      setActiveTab("profile");
    }
  }, [location.pathname]);

  // Scroll to top on navigation
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const toggleWishlistHandler = (resort) => {
    toggleWishlist({
      id: String(resort.id),
      name: resort.name,
      location: resort.location,
      price: resort.price,
      image: resort.image
    });
  };

  const scrollToSection = (id) => {
    setIsDrawerOpen(false);
    const performScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -80; // Mobile header offset
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(performScroll, 350);
    } else {
      performScroll();
    }
  };

  const handleSelectMode = (mode) => {
    setActiveMode(mode.id);
    setRivoAvatar(mode.avatar);
    localStorage.setItem("reservo-active-mode", mode.id);

    let replyMessage = "";
    if (mode.id === "luxury") {
      if (onToggleTheme && !isDark) onToggleTheme();
      replyMessage = "Rivo is now in Luxury Mode! 👑 I've toggled the premium dark theme and filtered our listings for high-end resorts with Dedicated AI Butler service. Enjoy your luxury escape!";
      window.dispatchEvent(new CustomEvent("rivo-mode", { detail: { mode: "luxury" } }));
      navigate("/search");
    } else if (mode.id === "budget") {
      replyMessage = "Rivo is now in Budget Mode! 🐷 I've set our max nightly rate filter to ₹15,000 to find you the smartest luxury deals.";
      window.dispatchEvent(new CustomEvent("rivo-mode", { detail: { mode: "budget" } }));
      navigate("/search");
    } else if (mode.id === "relax") {
      replyMessage = "Rivo is now in Relax Mode! 🏖️ I'm filtering for properties with premium Spa & Wellness facilities and infinity edge pools.";
      window.dispatchEvent(new CustomEvent("rivo-mode", { detail: { mode: "relax" } }));
      navigate("/search");
    } else if (mode.id === "adventure") {
      replyMessage = "Rivo is now in Adventure Mode! 🏔️ I've filtered for mountain/forest properties offering scuba, water sports, or private helipads.";
      window.dispatchEvent(new CustomEvent("rivo-mode", { detail: { mode: "adventure" } }));
      navigate("/search");
    } else {
      replyMessage = "Rivo is now in Support Mode! 🤖 Ask me anything about your booking, check-in details, or active reservations.";
    }

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: "rivo",
        text: replyMessage
      }
    ]);
  };

  const handleSend = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text }]);
    setInputVal("");
    setIsTyping(true);

    const userReactAvatar = getAvatarForText(text);
    if (userReactAvatar) {
      setRivoAvatar(userReactAvatar);
    }

    setTimeout(() => {
      const reply = generateAIResponse(text, liveResorts);

      const replyReactAvatar = getAvatarForText(reply);
      if (replyReactAvatar) {
        setRivoAvatar(replyReactAvatar);
      } else if (!userReactAvatar) {
        const activeModeObj = COMPANION_MODES.find(m => m.id === activeMode);
        setRivoAvatar(activeModeObj ? activeModeObj.avatar : rivoSupport);
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "rivo", text: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[8000] md:hidden bg-[var(--color-bg-white)] text-[var(--color-text-dark)] flex flex-col overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────── */}
      <header className="sticky top-0 z-[99] flex items-center justify-between px-4 py-3 bg-[var(--color-bg-white)]/95 backdrop-blur-xl border-b border-[var(--color-border-color)] shrink-0">
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-bg-light)] transition-colors border-none bg-transparent cursor-pointer"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} className="text-[var(--color-text-dark)]" />
        </button>

        <div className="flex items-center gap-1.5">
          <img src={rivoMascot} alt="Rivo" className="w-5 h-5 rounded-full object-cover border border-[var(--color-border-color)]" />
          <span className="text-sm font-extrabold tracking-[3px] text-[var(--color-text-dark)] uppercase">
            RESERV<span className="text-gold">O</span>
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-bg-light)] transition-colors border-none bg-transparent cursor-pointer"
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={18} className="text-gold" /> : <Moon size={18} className="text-[var(--color-text-dark)]" />}
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-bg-light)] transition-colors border-none bg-transparent cursor-pointer"
            onClick={() => { setActiveTab("wishlist"); navigate("/wishlist"); }}
            aria-label="View Wishlist"
          >
            <Heart size={18} className="text-[var(--color-text-dark)]" />
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-bg-light)] transition-colors border-none bg-transparent cursor-pointer"
            aria-label="View Notifications"
          >
            <Bell size={18} className="text-[var(--color-text-dark)]" />
          </button>
        </div>
      </header>

      {/* ── SCROLLABLE CONTENT ─────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain bg-[var(--color-bg-light)] text-[var(--color-text-dark)]">
        <div className="pb-0">
          {children}
          {location.pathname !== "/ai-planner" && <Footer />}
        </div>
      </div>

      {/* ── RIVO MASCOT CHAT (Above bottom nav) ──── */}
      <div className="fixed bottom-[72px] right-4 z-[8500]">
        {/* Chat Popup */}
        {isMascotOpen && (
          <div className="absolute bottom-[60px] right-0 w-[300px] h-[420px] bg-[var(--color-bg-white)] border border-[var(--color-border-color)] rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Chat Header */}
            <div className="bg-[#121e1b] px-4 py-3 flex items-center gap-2.5 border-b border-white/5 shrink-0">
              <img src={rivoAvatar} alt="Rivo" className="w-7 h-7 rounded-full object-cover border border-white/20" />
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-white m-0 flex items-center gap-1">
                  Rivo AI {(COMPANION_MODES.find(m => m.id === activeMode) || COMPANION_MODES[0]).emoji}
                </h4>
                <span className="text-[10px] text-white/60">🟢 {(COMPANION_MODES.find(m => m.id === activeMode) || COMPANION_MODES[0]).name} Companion</span>
              </div>
              <button className="bg-transparent border-none text-white/70 hover:text-white cursor-pointer" onClick={() => setIsMascotOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Companion Mode Selector Bar (Mobile) */}
            <div className="bg-slate-50 border-b border-border-color px-3 py-1.5 flex gap-1.5 overflow-x-auto whitespace-nowrap shrink-0 scrollbar-none">
              {COMPANION_MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMode(m)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                    activeMode === m.id
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-[var(--color-bg-white)] text-slate-600 border-slate-200'
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5 bg-bg-light">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-2 max-w-[90%] ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"}`}>
                  {msg.sender === "rivo" && (
                    <img src={rivoAvatar} alt="Rivo" className="w-6 h-6 rounded-full object-cover border border-border-color shrink-0" />
                  )}
                  <div className={`px-3 py-2 rounded-[14px] text-[12.5px] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#121e1b] text-white rounded-tr-[3px]"
                      : "bg-bg-white text-text-dark rounded-tl-[3px] border border-border-color"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 self-start">
                  <img src={rivoAvatar} alt="Rivo" className="w-6 h-6 rounded-full object-cover border border-[var(--color-border-color)] shrink-0" />
                  <div className="bg-[var(--color-bg-white)] border border-[var(--color-border-color)] px-3 py-2 rounded-[14px] flex gap-1 items-center">
                    <span className="text-[11px] font-bold text-[var(--color-text-gray)]">👋 Ask:</span>
                    <span className="text-[11px] font-bold text-[var(--color-text-dark)] truncate max-w-[140px]">Rivo...</span>
                  </div>
                </div>
              )}
            </div>
            {/* Quick Replies */}
            {messages.length === 1 && !isTyping && (
              <div className="bg-[var(--color-bg-light)] px-4 py-2 flex flex-col gap-1.5 border-t border-[var(--color-border-color)] shrink-0">
                {QUICK_REPLIES.map((r) => (
                  <button key={r.key} className="bg-[var(--color-bg-white)] text-[var(--color-text-dark)] border border-[var(--color-border-color)] px-3 py-1.5 rounded-xl text-[11.5px] text-left cursor-pointer transition-colors hover:bg-[var(--color-bg-light)] hover:text-gold" onClick={() => handleSend(r.text)}>
                    {r.text}
                  </button>
                ))}
              </div>
            )}
            {/* Input */}
            <form className="flex px-3 py-2.5 border-t border-[var(--color-border-color)] bg-[var(--color-bg-white)] items-center gap-2 shrink-0" onSubmit={(e) => { e.preventDefault(); handleSend(inputVal); }}>
              <input
                type="text"
                placeholder="Ask Rivo..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="flex-1 border-none outline-none px-2.5 py-1.5 text-[12.5px] bg-[var(--color-bg-light)] rounded-lg text-[var(--color-text-dark)]"
              />
              <button type="submit" className="bg-[#121e1b] text-white w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer hover:bg-gold shrink-0">
                <Send size={13} />
              </button>
            </form>
          </div>
        )}

        {/* Mascot Trigger Button with peeking out-of-bounds hover animation */}
        <div className="relative w-16 h-16 group select-none">
          {/* Hi! Speech Bubble */}
          {!isReducedMotion && (
            <div 
              className={`absolute -top-7 -left-7 bg-bg-white border border-border-color text-text-dark text-[9.5px] font-extrabold px-2.5 py-1 rounded-2xl rounded-br-sm shadow-md pointer-events-none flex items-center gap-1 select-none z-50 transition-all duration-300 origin-bottom-right ${
                showBubble ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 translate-y-2"
              }`}
            >
              Hi! 👋
            </div>
          )}

          {/* Mascot WebP Animation (Plays the transparent loop, no circular container) */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible transition-all duration-500"
            style={{
              transform: isMascotHovered ? "scale(1.08) translateY(-4px)" : "scale(1) translateY(0)",
              filter: isMascotHovered ? "drop-shadow(0 10px 20px rgba(0,0,0,0.15))" : "drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
            }}
          >
            {isReducedMotion ? (
              <img 
                src={`${rivoAvatar}?v=10`} 
                alt="Rivo Mascot Static" 
                className="w-full h-full object-contain select-none"
              />
            ) : (
              <img 
                src={mascotWebp} 
                alt="Rivo Mascot Animation" 
                className="w-full h-full object-contain select-none"
              />
            )}
          </div>

          {/* Click/Hover Event capture layer */}
          <button
            className="absolute inset-0 rounded-full bg-transparent border-none cursor-pointer z-10 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
            onClick={() => setIsMascotOpen(!isMascotOpen)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label="Chat with Rivo"
          />
        </div>
      </div>

      {/* ── BOTTOM NAV ─────────────────────────────── */}
      <nav className="h-[68px] bg-[var(--color-bg-white)]/95 backdrop-blur-xl border-t border-[var(--color-border-color)] flex items-center justify-around px-2 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[8100]">
        {[
          { id: "home", label: "Home", icon: <Home size={20} />, action: () => { setActiveTab("home"); navigate("/"); } },
          { id: "explore", label: "Explore", icon: <Search size={20} />, action: () => { setActiveTab("explore"); navigate("/search"); } },
          { id: "wishlist", label: "Wishlist", icon: <Heart size={20} />, action: () => { setActiveTab("wishlist"); navigate("/wishlist"); } },
          { id: "profile", label: "Profile", icon: <User size={20} />, action: () => { setActiveTab("profile"); navigate("/profile"); } },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all bg-transparent border-none cursor-pointer ${
              activeTab === tab.id ? "text-gold" : "text-[var(--color-text-gray)] hover:text-[var(--color-text-dark)]"
            }`}
            onClick={tab.action}
          >
            {tab.icon}
            <span className={`text-[10px] font-semibold ${activeTab === tab.id ? "text-gold" : ""}`}>{tab.label}</span>
            {activeTab === tab.id && <span className="w-1 h-1 bg-gold rounded-full" />}
          </button>
        ))}
      </nav>

      {/* ── SIDE DRAWER (same as desktop) ──────────── */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[9000] transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-72 bg-[var(--color-bg-white)] border-l border-[var(--color-border-color)] p-6 shadow-[-10px_0_40px_rgba(0,0,0,0.1)] transition-transform duration-400 ease-out z-[9001] flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border-color)] pb-4">
          <h3 className="text-lg font-bold text-[var(--color-text-dark)]">Account & Menu</h3>
          <button className="bg-transparent border-none cursor-pointer text-text-gray hover:text-text-dark" onClick={() => setIsDrawerOpen(false)}>
            <X size={22} />
          </button>
        </div>

        <ul className="list-none flex flex-col gap-1.5 p-0 m-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {(() => {
            const isLoggedIn = authService.isAuthenticated();
            const user = authService.getCurrentUser();
            return [
              ...(!isLoggedIn ? [
                { type: "item", icon: <LogIn size={18} />, label: "Login", path: "/login" },
                { type: "item", icon: <UserPlus size={18} />, label: "Create Account", path: "/register" }
              ] : [
                { type: "item", icon: <User size={18} />, label: `Profile (${user?.name || user?.displayName || user?.email?.split('@')[0] || "User"})`, path: "/profile" },
                ...(user?.role === "ROLE_ADMIN" ? [
                  { type: "item", icon: <Building2 size={18} />, label: "Reservo Team Admin", path: "/admin/reservo" }
                ] : user?.role === "ROLE_OWNER" ? [
                  { type: "item", icon: <Building2 size={18} />, label: "Host Administration", path: "/host/dashboard" }
                ] : [
                    user?.kycStatus === "PENDING_VERIFICATION"
                    ? { type: "item", icon: <LayoutGrid size={18} />, label: "Host Request Pending", action: () => alert("Your host request is currently pending admin review. Please wait for approval.") }
                    : { type: "item", icon: <LayoutGrid size={18} />, label: "Become a Host", path: "/become-a-host" }
                ])
              ]),
              { type: "divider" },
              { type: "item", icon: <HelpCircle size={18} />, label: "Help Center", path: "/help" },
              { type: "item", icon: <Phone size={18} />, label: "Contact", path: "/contact" },
              { type: "item", icon: <Shield size={18} />, label: "Privacy Policy", path: "/privacy" },
              { type: "item", icon: <FileText size={18} />, label: "Terms", path: "/terms" },
              { type: "divider" },
              ...(isLoggedIn ? [
                { type: "item", icon: <LayoutGrid size={18} />, label: "Dashboard", path: "/dashboard" },
                { type: "item", icon: <BookOpen size={18} />, label: "Bookings", path: "/bookings" },
                { type: "item", icon: <Bell size={18} />, label: "Notifications", path: "/notifications" },
                { type: "item", icon: <Settings size={18} />, label: "Settings", path: "/settings" },
                { type: "divider" },
                { type: "item", icon: <LogOut size={18} />, label: "Logout", action: () => { authService.logout().then(() => { navigate("/"); window.location.reload(); }); } }
              ] : [])
            ];
          })().map((item, idx) => {
            if (item.type === "divider") {
              return <hr key={idx} className="border-none h-px bg-border-color my-1 shrink-0" />;
            }
            const active = item.path && location.pathname === item.path;
            return (
              <li key={idx}>
                <button
                  onClick={() => {
                    if (item.action) item.action();
                    else if (item.path) navigate(item.path);
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl border-none transition text-sm font-semibold cursor-pointer text-left ${
                    active 
                      ? "bg-[#2F80ED]/10 text-primary" 
                      : "bg-transparent text-[var(--color-text-dark)] hover:bg-[var(--color-bg-light)]"
                  }`}
                >
                  <span className={active ? "text-primary" : "text-text-gray"}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

    </div>
  );
}

export default MobileUI;
