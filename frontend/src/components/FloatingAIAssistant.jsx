import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { Sparkles, X, MessageSquare, ChevronRight, Check, Star, MapPin, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import rivoSearching from '../assets/images/rivo_searching.png';
import { apiClient } from '../services/apiClient';
import { resortService } from '../services/resort.service';

export default function FloatingAIAssistant() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const renderFormattedText = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const tokens = line.split(/(\*\*.*?\*\*|\*.*?\*)/);
      const elements = tokens.map((token, tokenIdx) => {
        if (token.startsWith("**") && token.endsWith("**")) {
          return <strong key={tokenIdx} className="font-extrabold text-primary">{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith("*") && token.endsWith("*")) {
          return <em key={tokenIdx} className="italic text-text-gray font-bold">{token.slice(1, -1)}</em>;
        }
        return token;
      });
      return (
        <div key={lineIdx} className={lineIdx > 0 ? "mt-1" : ""}>
          {elements}
        </div>
      );
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const [liveResorts, setLiveResorts] = useState([]);

  useEffect(() => {
    let active = true;
    resortService.getAllResorts()
      .then(data => { if (active) setLiveResorts(Array.isArray(data) ? data : []); })
      .catch(err => console.warn("Failed to load live resorts for Rivo assistant:", err));
    return () => { active = false; };
  }, []);
  const [selectedMood, setSelectedMood] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "rivo",
      text: "Hi! I'm Rivo, your personal travel concierge. Tell me what kind of vibe you're looking for, and I'll find the perfect stay."
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  // Telephony call states
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [callTime, setCallTime] = useState(0);

  const MOODS = [
    { label: 'Beach Vibe 🌊', category: 'beach', resortId: 'goa-coastline' },
    { label: 'Mountain Trek 🏔️', category: 'mountain', resortId: 'himalayan-chalet' },
    { label: 'Royal Heritage 👑', category: 'villa', resortId: 'udaipur-palace' },
    { label: 'Lagoon Paradise 🏝️', category: 'island', resortId: 'maldives-overwater' }
  ];

  // Call timer effect
  useEffect(() => {
    let timer;
    let connectTimeout;
    if (isCalling) {
      connectTimeout = setTimeout(() => {
        setCallStatus("Connected");
      }, 1500);

      timer = setInterval(() => {
        setCallTime(prev => prev + 1);
      }, 1000);
    } else {
      setCallStatus("Connecting...");
      setCallTime(0);
    }
    return () => {
      clearTimeout(connectTimeout);
      clearInterval(timer);
    };
  }, [isCalling]);

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    
    const userMsg = {
      id: "msg-user-" + Date.now(),
      sender: "user",
      text: `I'm looking for a ${mood.label} getaway.`
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const matchedResort = liveResorts.find(r => String(r.category || "").toLowerCase().includes(mood.category))
        || liveResorts[0];

      if (!matchedResort) {
        setMessages(prev => [...prev, {
          id: "msg-rivo-" + Date.now(),
          sender: "rivo",
          text: "I couldn't find an approved stay matching that mood in the live inventory yet."
        }]);
        return;
      }
      
      const rivoReply = {
        id: "msg-rivo-" + Date.now(),
        sender: "rivo",
        text: `I've analyzed our listings and matched your mood with this premium property!`,
        recommendation: {
          id: matchedResort.id,
          name: matchedResort.name,
          location: matchedResort.location,
          rating: matchedResort.rating,
          price: matchedResort.price,
          image: matchedResort.heroImage,
          badge: matchedResort.badge
        }
      };
      
      setMessages(prev => [...prev, rivoReply]);
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;
    
    const userText = inputMessage;
    setInputMessage("");
    
    const userMsg = {
      id: "msg-user-" + Date.now(),
      sender: "user",
      text: userText
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    
    try {
      // Call backend AI chat endpoint
      const responseBody = await apiClient.post("/api/v1/ai/chat", {
        sessionId: "assistant-session-101",
        message: userText,
        selectedMood: selectedMood ? selectedMood.category : "luxury"
      });
      
      if (responseBody && responseBody.success && responseBody.data) {
        const data = responseBody.data;
        setMessages(prev => [...prev, {
          id: "msg-rivo-" + Date.now(),
          sender: "rivo",
          text: data.replyText,
          recommendation: data.recommendedResort ? {
            id: data.recommendedResort.id,
            name: data.recommendedResort.name,
            location: data.recommendedResort.location,
            rating: data.recommendedResort.rating,
            price: data.recommendedResort.price,
            image: data.recommendedResort.heroImage || data.recommendedResort.image,
            badge: data.recommendedResort.badge || "Verified"
          } : null
        }]);
      } else {
        throw new Error("API call failed");
      }
    } catch (err) {
      console.warn("Backend unavailable, using dynamic mock generator:", err);
      setTimeout(() => {
        const msg = userText.toLowerCase();
        let reply = "I couldn't reach the live resort inventory right now. Please try again in a moment.";
        if (msg.includes("available") || msg.includes("resort") || msg.includes("list")) {
          reply = "I couldn't reach the live resort inventory right now. Please open the Search Stays page after the backend is available to see the current approved resorts.";
        } else if (msg.includes("hello") || msg.includes("hi ")) {
          reply = "Greetings! I'm Rivo, your luxury travel companion. How can I assist you with your booking today?";
        }
        setMessages(prev => [...prev, {
          id: "msg-rivo-" + Date.now(),
          sender: "rivo",
          text: reply
        }]);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setSelectedMood(null);
    setMessages([
      {
        id: "m1",
        sender: "rivo",
        text: "Hi! I'm Rivo, your personal travel concierge. Tell me what kind of vibe you're looking for, and I'll find the perfect stay."
      }
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="Toggle Rivo AI Companion"
        className={`fixed bottom-6 right-6 z-[100] w-14 h-14 bg-bg-white border-2 border-gold rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] cursor-pointer hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center p-0.5 ${isOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}
      >
        <img src={rivoSearching} alt="Rivo AI" className="w-full h-full rounded-full object-cover" />
      </button>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-6 right-6 w-[340px] bg-bg-white border border-border-color rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-[101] overflow-hidden flex flex-col origin-bottom-right"
          >
            
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold relative">
                  <img src={rivoSearching} alt="Rivo AI" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary rounded-full"></div>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">Rivo AI</div>
                  <div className="text-white/60 text-[11px] flex items-center gap-1"><Sparkles size={10} className="text-gold" /> Online Concierge</div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => {
                    setIsCalling(true);
                    setCallStatus("Connecting...");
                    setCallTime(0);
                  }}
                  className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer p-1.5 transition-colors flex items-center justify-center rounded-full hover:bg-white/10"
                  aria-label="Call Rivo support line"
                >
                  <Phone size={15} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer p-1.5 transition-colors flex items-center justify-center rounded-full hover:bg-white/10"
                  aria-label="Close panel"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-bg-light h-[360px] overflow-y-auto flex flex-col gap-4 scrollbar-thin">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
                    {msg.sender === 'rivo' ? (
                      <img src={rivoSearching} alt="Rivo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary text-white flex items-center justify-center text-[10px] font-bold rounded-full">You</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 max-w-[75%]">
                    <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-none text-right'
                        : 'bg-bg-white text-text-dark rounded-tl-none text-left border border-border-color'
                    }`}>
                      {msg.id === 'm1' ? t('m1_greeting') : renderFormattedText(msg.text)}
                    </div>

                    {msg.recommendation && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-bg-white border border-border-color rounded-2xl overflow-hidden shadow-md cursor-pointer hover:-translate-y-0.5 transition duration-200 text-left flex flex-col"
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/resort/${msg.recommendation.id}`);
                        }}
                      >
                        <div className="relative h-24 w-full">
                          <img src={msg.recommendation.image} alt={msg.recommendation.name} className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 text-primary text-[8px] font-bold uppercase rounded">{msg.recommendation.badge}</span>
                        </div>
                        <div className="p-3 space-y-1">
                          <span className="text-[9px] text-text-gray font-semibold flex items-center gap-0.5"><MapPin size={8} className="text-primary" /> {msg.recommendation.location}</span>
                          <h5 className="text-[11.5px] font-bold text-text-dark truncate">{msg.recommendation.name}</h5>
                          <div className="flex justify-between items-center pt-2 border-t border-border-color">
                            <span className="text-[10px] font-extrabold text-primary">₹{msg.recommendation.price.toLocaleString()} / night</span>
                            <span className="text-[9px] font-extrabold text-[#22C55E]">View Details →</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
                    <img src={rivoSearching} alt="Rivo" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-bg-white border border-border-color p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-9">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}

              {!selectedMood && (
                <div className="flex flex-col gap-2 pl-10.5 text-left animate-fade-in">
                  <p className="text-[10px] font-bold text-text-gray uppercase tracking-widest">{t('select_vibe')}</p>
                  <div className="flex flex-col gap-1.5">
                    {MOODS.map(mood => (
                      <button 
                        key={mood.label}
                        onClick={() => handleMoodSelect(mood)}
                        className="w-full text-left p-2 px-3.5 bg-bg-white border border-border-color rounded-xl text-xs font-semibold text-text-dark hover:border-gold hover:text-gold transition cursor-pointer"
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMood && !isTyping && (
                <button 
                  onClick={handleReset}
                  className="mt-2 py-1.5 px-4 self-center bg-bg-white border border-border-color hover:border-primary text-text-dark text-[10px] font-bold rounded-lg cursor-pointer transition"
                >
                  {t('start_over')}
                </button>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-bg-white border-t border-border-color">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text" 
                  placeholder={t('ask_rivo')} 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="w-full bg-bg-light border border-border-color rounded-full py-2 pl-4 pr-10 text-xs outline-none focus:border-gold transition-colors font-semibold text-text-dark"
                  disabled={!!selectedMood}
                />
                <button 
                  type="submit"
                  disabled={!!selectedMood || !inputMessage.trim()}
                  className="absolute right-1 top-1 w-6.5 h-6.5 rounded-full bg-gold text-white flex items-center justify-center border-none cursor-pointer hover:bg-gold-dark transition-colors disabled:opacity-50"
                  aria-label="Send message"
                >
                  <ChevronRight size={14} />
                </button>
              </form>
            </div>

            {/* Telephony Call Screen Overlay */}
            {isCalling && (
              <div className="absolute inset-0 bg-[#0F172A] text-white z-[200] p-6 flex flex-col justify-between items-center animate-fade-in font-sans">
                {/* Top Section */}
                <div className="w-full flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('secure_line')}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {Math.floor(callTime / 60).toString().padStart(2, '0')}:{ (callTime % 60).toString().padStart(2, '0') }
                  </div>
                </div>

                {/* Mid Section */}
                <div className="flex flex-col items-center space-y-4 my-auto">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-[#2563eb]/20 animate-ping" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute -inset-8 rounded-full bg-[#2563eb]/10 animate-ping" style={{ animationDuration: '3s' }}></div>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold relative shadow-2xl bg-white">
                      <img src={rivoSearching} alt="Rivo AI" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h4 className="text-base font-bold text-white font-serif">{t('telephony_concierge')}</h4>
                    <p className="text-[11px] text-[#38BDF8] font-bold mt-1 tracking-wide">{callStatus === "Connecting..." ? t('connecting') : t('connected')}</p>
                  </div>

                  {callStatus === "Connected" && (
                    <div className="flex items-end gap-1 h-6">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((val, idx) => (
                        <div 
                          key={idx} 
                          className="w-1 bg-[#38BDF8] rounded-full"
                          style={{
                            height: `${val * 4}px`,
                            animation: `shimmer-anim 0.8s infinite alternate`,
                            animationDelay: `${idx * 80}ms`
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="max-w-[260px] p-3 rounded-2xl bg-white/5 border border-white/10 text-[10.5px] leading-relaxed text-slate-300 italic text-center">
                    {callStatus === "Connecting..." 
                      ? t('connecting_sip') 
                      : t('telephony_greeting')
                    }
                  </div>
                </div>

                {/* Bottom Section */}
                <button
                  onClick={() => setIsCalling(false)}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg border-none cursor-pointer hover:scale-105 transition-all"
                  aria-label="End call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
