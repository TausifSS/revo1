import React, { useState, useEffect, useRef } from "react";
import { resortService } from "../services/resort.service";
import { X, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import rivoMascot from "../assets/images/rivo_mascot.jpg";
import rivoSearching from "../assets/images/rivo_searching.png";
import rivoConfirmed from "../assets/images/rivo_confirmed.png";
import rivoPlanner from "../assets/images/rivo_planner.png";
import rivoSupport from "../assets/images/rivo_support.png";
import rivoWaving from "../assets/images/rivo_waving.png";
import mascotWebp from "../assets/images/mascot_transparent.webp";

const QUICK_REPLIES = [
  { text: "🌴 Suggest beach resorts", key: "beach" },
  { text: "🏔️ Tell me about Manali", key: "manali" },
  { text: "📅 How do I book?", key: "book" }
];

const COMPANION_MODES = [
  { id: "support", label: "Support Mode", emoji: "🤖", avatar: rivoSupport, name: "Support" },
  { id: "luxury", label: "Luxury Mode", emoji: "👑", avatar: rivoPlanner, name: "Luxury" },
  { id: "budget", label: "Budget Mode", emoji: "🐷", avatar: rivoSearching, name: "Budget" },
  { id: "relax", label: "Relax Mode", emoji: "🏖️", avatar: rivoMascot, name: "Relax" },
  { id: "adventure", label: "Adventure Mode", emoji: "🏔️", avatar: rivoPlanner, name: "Adventure" }
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
  
  // 1. Check for location queries
  const locations = ["bali", "maldives", "manali", "dubai", "coorg", "kerala", "santorini", "greece"];
  const matchedLocation = locations.find(loc => lower.includes(loc));

  // 2. Check for amenities queries
  const amenitiesList = ["pool", "spa", "ocean view", "breakfast", "wifi", "fireplace", "mountain view", "ski", "chef", "gym"];
  const matchedAmenities = amenitiesList.filter(am => lower.includes(am));

  // 3. Check for budget queries
  let maxBudget = null;
  const budgetMatch = lower.match(/(?:under|below|less than|max)\s*(\d+)/) || lower.match(/\$\s*(\d+)/) || lower.match(/₹\s*(\d+)/);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1], 10);
  }

  // Filter properties
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

  // Generate response
  if (matches.length > 0) {
    let responseText = `I found some excellent matches for you! Here are ${matches.length} luxury stays that match your request:\n\n`;
    matches.forEach((r, idx) => {
      responseText += `${idx + 1}. **${r.name}** in *${r.location}* — **$${r.price}/night** (${r.rating}⭐). Features: ${r.amenities.slice(0, 3).join(", ")}. "${r.tag}"\n`;
    });
    responseText += `\nWould you like me to check live room availability for any of these?`;
    return responseText;
  }

  // Fallback replies
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

function Mascot({ isDark, setIsDark }) {
  const navigate = useNavigate();
  const [liveResorts, setLiveResorts] = useState([]);

  useEffect(() => {
    let active = true;
    resortService.getAllResorts()
      .then(data => { if (active) setLiveResorts(Array.isArray(data) ? data : []); })
      .catch(err => console.warn("Failed to load live resorts for Rivo:", err));
    return () => { active = false; };
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("support");
  const [rivoAvatar, setRivoAvatar] = useState(rivoSupport);
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({
    transform: "perspective(300px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0)",
    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
  });

  const [showBubble, setShowBubble] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

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
    if (isReducedMotion || isOpen) {
      setShowBubble(false);
      return;
    }

    const startTime = Date.now();
    const checkTiming = () => {
      if (isHovered) {
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
  }, [isReducedMotion, isOpen, isHovered]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowBubble(true);
  };

  const handleMouseMove = (e) => {
    if (isReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = (x - centerX) / centerX;
    const dy = (y - centerY) / centerY;
    
    const rotateY = (dx * 16).toFixed(1);
    const rotateX = (-dy * 16).toFixed(1);
    
    setTiltStyle({
      transform: `perspective(300px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.1) translateY(-6px)`,
      filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.2))",
      transition: "transform 0.1s ease-out, filter 0.3s ease"
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowBubble(false);
    setTiltStyle({
      transform: "perspective(300px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0)",
      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
      transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), filter 0.5s ease"
    });
  };

  const renderFormattedText = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const tokens = line.split(/(\*\*.*?\*\*|\*.*?\*)/);
      const elements = tokens.map((token, tokenIdx) => {
        if (token.startsWith("**") && token.endsWith("**")) {
          return <strong key={tokenIdx} className="font-extrabold text-[#2563EB]">{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith("*") && token.endsWith("*")) {
          return <em key={tokenIdx} className="italic text-slate-500 font-bold">{token.slice(1, -1)}</em>;
        }
        return token;
      });
      return (
        <span key={lineIdx} className="block min-h-[1.2em]">
          {elements}
        </span>
      );
    });
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "rivo",
      text: "Hi! I'm Rivo, your AI travel buddy. I can recommend premium stays, check availability, or help with concierge. Where would you like to travel?"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectMode = (mode) => {
    setActiveMode(mode.id);
    setRivoAvatar(mode.avatar);
    localStorage.setItem("reservo-active-mode", mode.id);

    let replyMessage = "";
    if (mode.id === "luxury") {
      if (setIsDark) setIsDark(true);
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

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: text
    };
    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    const userReactAvatar = getAvatarForText(text);
    if (userReactAvatar) {
      setRivoAvatar(userReactAvatar);
    }

    // Simulate Rivo reply after 1.5s
    setTimeout(() => {
      const replyText = generateAIResponse(text);

      const replyReactAvatar = getAvatarForText(replyText);
      if (replyReactAvatar) {
        setRivoAvatar(replyReactAvatar);
      } else if (!userReactAvatar) {
        // Find avatar matching activeMode if no custom match
        const activeModeObj = COMPANION_MODES.find(m => m.id === activeMode);
        setRivoAvatar(activeModeObj ? activeModeObj.avatar : rivoSupport);
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "rivo",
          text: replyText
        }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const activeModeObj = COMPANION_MODES.find(m => m.id === activeMode) || COMPANION_MODES[0];

  return (
    <div className="fixed bottom-7.5 right-7.5 z-[2000]">
      
      {/* Floating Mascot Trigger Badge with peeking out-of-bounds hover animation */}
      <div className="relative w-18 h-18 group select-none">
        {/* Hi! Speech Bubble */}
        {!isReducedMotion && (
          <div 
            className={`absolute -top-7 -left-9 bg-bg-white border border-border-color text-text-dark text-[10.5px] font-extrabold px-3 py-1.2 rounded-2xl rounded-br-sm shadow-md pointer-events-none flex items-center gap-1 select-none z-50 transition-all duration-300 origin-bottom-right ${
              showBubble ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 translate-y-2"
            }`}
          >
            Hi! 👋
          </div>
        )}

        {/* Mascot WebP Animation (Plays the transparent loop, no circular container) */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible"
          style={tiltStyle}
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
          onClick={toggleChat}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          aria-label="Toggle Rivo AI Companion"
        />
      </div>

      {/* Interactive Chat Popup Dialog */}
      {isOpen && (
        <div className="absolute bottom-[75px] right-0 w-[350px] h-[520px] bg-bg-white border border-border-color rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-[#121e1b] px-5 py-3.75 flex items-center gap-3 text-white border-b border-white/5 shrink-0">
            <img src={rivoAvatar} alt="Rivo Avatar" className="w-8.5 h-8.5 rounded-full border-1.5 border-white/20 object-cover" />
            <div className="flex-1">
              <h4 className="text-[14.5px] m-0 font-bold text-white flex items-center gap-1">
                Rivo AI {activeModeObj.emoji}
              </h4>
              <span className="text-[11px] text-white/60 block mt-px">🟢 {activeModeObj.name} Companion</span>
            </div>
            <button className="bg-transparent text-white border-none cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-200 flex items-center" onClick={toggleChat} aria-label="Close Chat">
              <X size={18} />
            </button>
          </div>

          {/* Companion Mode Selector Bar */}
          <div className="bg-bg-light border-b border-border-color px-4 py-2 flex gap-2 overflow-x-auto whitespace-nowrap shrink-0 scrollbar-none">
            {COMPANION_MODES.map(m => (
              <button
                key={m.id}
                onClick={() => handleSelectMode(m)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                  activeMode === m.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB] scale-105'
                    : 'bg-bg-white text-text-gray border-border-color'
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3.75 bg-bg-light">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-2.5 max-w-[85%] ${
                msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"
              }`}>
                {msg.sender === "rivo" && (
                  <img src={rivoAvatar} alt="Rivo" className="w-7 h-7 rounded-full object-cover border border-border-color shrink-0" />
                )}
                <div className={`px-4 py-3 rounded-[18px] text-[13.5px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                  msg.sender === "user" 
                    ? "bg-[#121e1b] text-white rounded-tr-[4px]" 
                    : "bg-bg-white text-text-dark rounded-tl-[4px] border border-border-color"
                }`}>
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-2.5 max-w-[85%] self-start">
                <img src={rivoAvatar} alt="Rivo" className="w-7 h-7 rounded-full object-cover border border-border-color shrink-0" />
                <div className="px-4 py-3 rounded-[18px] text-[13.5px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.02)] bg-bg-white text-text-dark rounded-tl-[4px] border border-border-color flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-text-gray rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-text-gray rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-text-gray rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && !isTyping && (
            <div className="flex flex-col gap-2 px-5 py-3 bg-bg-light border-t border-border-color shrink-0">
              {QUICK_REPLIES.map((reply, i) => (
                <button 
                  key={i} 
                  className="bg-bg-white text-text-dark border border-border-color px-3.5 py-2 rounded-xl text-[12.5px] text-left cursor-pointer transition-colors duration-200 hover:bg-bg-light hover:border-gold hover:text-gold"
                  onClick={() => handleSend(reply.text)}
                >
                  {reply.text}
                </button>
              ))}
            </div>
          )}

          {/* Message Input Form */}
          <form 
            className="flex px-3.75 py-3 border-t border-border-color bg-bg-white items-center gap-2.5 shrink-0"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
          >
            <input 
              type="text" 
              placeholder="Ask Rivo about stays..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 border-none outline-none px-3 py-2 text-[13.5px] bg-bg-light rounded-lg text-text-dark"
            />
            <button type="submit" className="bg-[#121e1b] text-white border-none w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-gold shrink-0" aria-label="Send message">
              <Send size={16} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}

export default Mascot;
