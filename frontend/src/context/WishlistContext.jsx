import React, { createContext, useContext, useState, useEffect } from "react";
import { secureStorage } from "../services/secureStorage";
import { authService } from "../services/auth.service";
import { useNavigate } from "react-router-dom";
import { X, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import rivoMascot from "../assets/images/rivo_mascot.jpg";

const WishlistContext = createContext();
const WISHLIST_KEY = "reservo-wishlist";

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      let secured = secureStorage.getItem(WISHLIST_KEY);
      if (!secured) {
        const plain = localStorage.getItem(WISHLIST_KEY);
        secured = plain ? JSON.parse(plain) : [];
      }
      // Filter out old pre-seeded mock IDs from secureStorage wishlist
      const mockIds = [
        "goa-coastline", "kerala-backwaters", "himalayan-chalet", "udaipur-palace", "maldives-overwater",
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13",
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
      ];
      return (secured || []).filter(item => {
        const id = item?.id;
        if (!id) return false;
        const checkId = typeof id === 'string' && id.startsWith('home-') ? id.replace('home-', '') : id;
        return !mockIds.includes(checkId);
      });
    } catch {
      return [];
    }
  });

  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    secureStorage.setItem(WISHLIST_KEY, wishlist);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("wishlist-updated"));
  }, [wishlist]);

  const toggleWishlist = (resort) => {
    if (!authService.isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === resort.id);
      if (exists) {
        return prev.filter((item) => item.id !== resort.id);
      } else {
        return [...prev, {
          id: resort.id,
          name: resort.name,
          location: resort.location,
          price: resort.price,
          image: resort.heroImage || resort.image
        }];
      }
    });
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist }}>
      {children}
      <AnimatePresence>
        {showLoginModal && (
          <WishlistLoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </AnimatePresence>
    </WishlistContext.Provider>
  );
}

function WishlistLoginModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-bg-white border border-border-color rounded-[32px] p-6 max-w-sm w-full text-center shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-bg-light border-none flex items-center justify-center text-text-gray hover:text-text-dark cursor-pointer transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gold mx-auto mb-4 mt-2 shadow-md">
          <img src={rivoMascot} alt="Rivo AI" className="w-full h-full object-cover" />
        </div>

        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
          Authentication Required
        </span>

        <h3 className="text-xl font-bold text-text-dark mt-3 mb-2 font-serif">Log In to Save</h3>
        
        <p className="text-xs text-text-gray leading-relaxed mb-6">
          Hi, I'm Rivo! Please log in to save retreats to your wishlist and sync them across all your devices.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              navigate("/login");
            }}
            className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md border-none cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" /> Log In Now
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 bg-bg-light hover:bg-[#2563eb]/5 text-text-dark text-xs font-bold uppercase tracking-wider rounded-xl border border-border-color cursor-pointer transition-all"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
