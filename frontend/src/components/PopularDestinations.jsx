import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Heart, Star, ChevronLeft, ChevronRight, Waves, Mountain, TreePine, Home, Tent, Palmtree, ArrowRight, ShieldCheck, HeadphonesIcon, Sparkles } from "lucide-react";
import { CATEGORIES } from '../data/resortsData';
import { resortService } from '../services/resort.service';
import { useTranslation } from "../hooks/useTranslation";
import { useWishlist } from "../context/WishlistContext";
import rivoSearching from "../assets/images/rivo_searching.png";

function PopularDestinations({ currencySymbol = "₹", exchangeRate = 1 }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { wishlist, toggleWishlist } = useWishlist();
  const [activeCat, setActiveCat] = useState("all");
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resortService.getAllResorts()
      .then(data => {
        setResorts(data || []);
      })
      .catch(err => {
        console.warn("No dynamic resorts to display on landing page.", err);
        setResorts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredDestinations = resorts.filter((dest) => {
    const cat = (dest.category || "").toLowerCase();
    if (activeCat === "all") return true;
    if (activeCat === "beach") return cat.includes("beach");
    if (activeCat === "mountain") return cat.includes("mountain") || cat.includes("hill");
    if (activeCat === "chalet") return cat.includes("chalet") || cat.includes("forest") || cat.includes("tree");
    if (activeCat === "villa") return cat.includes("villa") || cat.includes("estate");
    if (activeCat === "cabin") return cat.includes("cabin") || cat.includes("lodge");
    if (activeCat === "glamping") return cat.includes("glamping") || cat.includes("tent") || cat.includes("camp");
    if (activeCat === "island") return cat.includes("island") || cat.includes("sanctuary");
    if (activeCat === "eco") return cat.includes("eco") || cat.includes("camp");
    return false;
  });

  return (
    <section className="py-12 bg-bg-light transition-colors duration-300" id="explore">
      <div className="w-full max-w-[1280px] mx-auto px-5">
        
        {/* Categories Tab Bar */}
        <div className="flex overflow-x-auto hide-scrollbar gap-6 mb-5 bg-bg-white rounded-2xl px-5 py-3 shadow-[0_5px_15px_rgba(0,0,0,0.02)] border border-border-color transition-colors duration-300">
          {CATEGORIES.map((cat) => {
            const isActive = activeCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`flex flex-col items-center gap-1.5 min-w-max pb-1 relative transition-colors duration-300 ${
                  isActive ? "text-primary" : "text-text-gray hover:text-primary"
                } bg-transparent border-none cursor-pointer focus:outline-none`}
              >
                {/* Fallback mock simple icons for styling */}
                <span className="text-slate-600 dark:text-slate-300">
                  {cat.id === "beach" && <Waves size={16} />}
                  {cat.id === "mountain" && <Mountain size={16} />}
                  {cat.id === "forest" && <TreePine size={16} />}
                  {cat.id === "villa" && <Home size={16} />}
                  {cat.id === "cabin" && <Home size={16} />}
                  {cat.id === "glamping" && <Tent size={16} />}
                  {cat.id === "island" && <Palmtree size={16} />}
                  {!["beach", "mountain", "forest", "villa", "cabin", "glamping", "island"].includes(cat.id) && <Sparkles size={16} />}
                </span>
                <span className="text-[12px] font-bold">{cat.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Section Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-5">
          
          {/* Left Title Area */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-primary">POPULAR STAYS</span>
              <div className="w-8 h-0.5 bg-primary"></div>
            </div>
            <h2 className="text-[24px] sm:text-[30px] font-extrabold text-text-dark mb-1.5 font-serif transition-colors duration-300">
              {t("popular_destinations")}
            </h2>
            <p className="text-text-gray text-[13.5px] leading-relaxed max-w-[420px] transition-colors duration-300">
              {t("discover_stays")}
            </p>
          </div>

          {/* Right Trust Badges & Controls */}
          <div className="flex flex-col items-start lg:items-end gap-3.5 w-full lg:w-auto">
            <div className="flex flex-wrap gap-3 bg-bg-white rounded-[20px] p-2 shadow-[0_5px_15px_rgba(0,0,0,0.02)] border border-border-color transition-colors duration-300 w-full lg:w-auto">
              
              <div className="flex items-center gap-2 px-2 py-1 border-r border-border-color flex-1 lg:flex-initial">
                <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-primary transition-colors duration-300">
                  <ShieldCheck size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-text-dark transition-colors duration-300">Verified Stays</span>
                  <span className="text-[10px] text-text-gray transition-colors duration-300">Quality checked</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2 py-1 border-r border-border-color flex-1 lg:flex-initial">
                <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-primary transition-colors duration-300">
                  <Star size={16} className="fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-text-dark transition-colors duration-300">Best Price</span>
                  <span className="text-[10px] text-text-gray transition-colors duration-300">Value guaranteed</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2 py-1 flex-1 lg:flex-initial">
                <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-primary transition-colors duration-300">
                  <HeadphonesIcon size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-text-dark transition-colors duration-300">24/7 Support</span>
                  <span className="text-[10px] text-text-gray transition-colors duration-300">Here anytime</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-3">
              <button 
                onClick={() => navigate("/resorts")}
                className="flex items-center gap-1.5 text-primary font-bold text-[13px] hover:text-primary-dark bg-transparent border-none cursor-pointer transition-colors px-2"
              >
                View All Stays <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Destination Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-center">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-bg-white rounded-[20px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-border-color max-w-[380px] w-full mx-auto animate-pulse">
                {/* Skeleton Image */}
                <div className="h-[210px] bg-slate-200 dark:bg-slate-700" />
                {/* Skeleton Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDestinations.length === 0 ? (
          <div className="text-center py-12 px-6 bg-bg-white border border-border-color rounded-[32px] w-full max-w-md mx-auto shadow-sm transition-colors duration-300 flex flex-col items-center">
            <div className="w-24 h-24 mb-4 relative">
              <img 
                src={rivoSearching} 
                alt="Rivo Mascot Searching Stays" 
                className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-border-color/80 animate-in zoom-in-95 duration-300" 
              />
            </div>
            <h4 className="font-extrabold text-base text-text-dark">No Active Stays Found</h4>
            <p className="text-xs text-text-gray mt-2 max-w-xs mx-auto leading-relaxed">
              All mock listings have been removed. Use <strong className="text-primary font-bold">Become a Host</strong> in the menu drawer to register your own stays!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-center">
            {filteredDestinations.map((dest) => {
              const isLiked = wishlist.some(item => String(item.id) === String(dest.id));
              return (
                <div 
                  key={dest.id} 
                  onClick={() => navigate(`/resort/${dest.id}`)}
                  className="bg-bg-white rounded-[20px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-border-color transition-colors duration-300 group cursor-pointer max-w-[380px] w-full mx-auto"
                >
                  
                  {/* Image Area */}
                  <div className="relative h-[210px] overflow-hidden">
                    <img 
                      src={dest.imageUrl || dest.image || "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80"} 
                      alt={dest.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    
                    {/* Top Left Rating Badge */}
                    <div className="absolute top-4 left-4 bg-primary/95 backdrop-blur-sm text-white p-1.5 rounded-lg shadow-md border border-white/10 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-0.5 text-[12px] font-bold text-yellow-400">
                        <Star size={10} className="fill-current" /> {dest.rating || 5.0}
                      </div>
                    </div>

                    {/* Top Right Heart */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(dest);
                      }}
                      className="absolute top-4 right-4 w-8.5 h-8.5 rounded-full bg-bg-white text-text-gray flex items-center justify-center shadow-md hover:text-red-500 transition-all border-none cursor-pointer focus:outline-none"
                    >
                      <Heart 
                        size={16} 
                        className={`transition-colors duration-300 ${
                          isLiked ? "fill-red-500 text-red-500" : "text-text-gray"
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Text Details Area */}
                  <div className="p-5.5 space-y-3.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-text-gray text-[11px] mb-1 font-semibold uppercase tracking-wide">
                        <MapPin size={12} className="text-primary" /> {dest.location}
                      </div>
                      <h3 className="font-extrabold text-[16px] text-text-dark group-hover:text-primary transition-colors duration-300 line-clamp-1">
                        {dest.name}
                      </h3>
                    </div>

                    <div className="flex justify-between items-center border-t border-border-color pt-3.5 transition-colors duration-300">
                      <div>
                        <span className="text-[11px] text-text-gray block font-semibold">{t("price_per_night")}</span>
                        <span className="text-[17px] font-black text-primary">
                          {currencySymbol}{(Math.round((dest.price || dest.pricePerNight || 0) * exchangeRate)).toLocaleString()}
                        </span>
                      </div>
                      <button className="px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-xl shadow-[0_5px_15px_rgba(47,128,237,0.15)] group-hover:bg-primary-dark transition-all flex items-center gap-1 border-none cursor-pointer">
                        Book Stay <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default PopularDestinations;