import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Calendar, MapPin, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import rivoSearching from "../assets/images/rivo_searching.png";

export default function Wishlist({ onBook }) {
  const navigate = useNavigate();
  const toast = useToast();
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

  const removeWish = (id, name) => {
    toggleWishlist({ id });
    toast(`Removed ${name} from Wishlist`, "info");
  };

  const bookStay = (resort) => {
    if (onBook) {
      onBook(resort);
    } else {
      toast("Checkout is currently processing...", "info");
    }
  };

  return (
    <div className="py-[120px] pb-[100px] bg-bg-light min-h-screen">
      <div className="w-[90%] max-w-[1300px] mx-auto text-left">
        <header className="text-center mb-[50px] animate-fade-in">
          <h1 className="text-[32px] sm:text-[40px] font-bold text-text-dark mb-3">Saved Stays & Wishlist</h1>
          <p className="text-[15px] text-text-gray max-w-[600px] mx-auto">Your curated selections of verified luxury retreats around the world.</p>
        </header>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
            <AnimatePresence mode="popLayout">
              {wishlist.map(resort => (
                <motion.div 
                  key={resort.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-bg-white border border-border-color rounded-2xl overflow-hidden shadow-custom flex flex-col transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="relative h-[220px]">
                    <img src={resort.image} alt={resort.name} className="w-full h-full object-cover" />
                    <button 
                      className="absolute top-[15px] right-[15px] bg-white/90 text-red-500 border-none w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-red-500 hover:text-white hover:scale-110"
                      onClick={() => removeWish(resort.id, resort.name)}
                      aria-label="Remove from Wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs text-text-gray flex items-center gap-1 mb-2 font-medium"><MapPin size={12} className="text-primary" /> {resort.location}</span>
                    <h3 className="text-xl font-bold text-text-dark mb-[18px]">{resort.name}</h3>

                    <div className="flex justify-between items-center border-t border-border-color pt-[15px] mt-auto">
                      <div className="flex items-center">
                        <strong className="text-xl font-bold text-text-dark">
                          {currencySymbol}{(Math.round(resort.price * exchangeRate)).toLocaleString()}
                        </strong>
                        <span className="text-[11px] text-text-gray ml-0.5">/ night</span>
                      </div>

                      <button 
                        className="bg-primary text-white border-none px-5 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer flex items-center transition-colors duration-300 hover:bg-primary-dark"
                        onClick={() => bookStay(resort)}
                      >
                        Book Now <Calendar size={13} style={{ marginLeft: 6 }} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="max-w-[550px] mx-auto">
            <EmptyState
              title="Your Wishlist is Empty"
              description="Rivo couldn't find any saved resorts here. Explore our verified listings and save your favorites!"
              ctaText="Explore Luxury Resorts"
              onCtaClick={() => navigate("/resorts")}
              icon={Heart}
              image={rivoSearching}
            />
          </div>
        )}
      </div>
    </div>
  );
}
