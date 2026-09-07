import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Eye, ChevronRight, Heart } from 'lucide-react';
import { secureStorage } from '../services/secureStorage';
import { useWishlist } from '../context/WishlistContext';

export default function RecentlyViewed({ currencySymbol = "₹", rates = 1 }) {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const { wishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    // Read from secure storage
    const fetchHistory = () => {
      let history = secureStorage.getItem("reservo-recently-viewed") || [];
      // Filter out old pre-seeded mock IDs from secureStorage history
      const mockIds = [
        "goa-coastline", "kerala-backwaters", "himalayan-chalet", "udaipur-palace", "maldives-overwater",
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13",
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
      ];
      const cleaned = history.filter(item => !mockIds.includes(item.id));
      if (cleaned.length !== history.length) {
        secureStorage.setItem("reservo-recently-viewed", cleaned);
        history = cleaned;
      }
      setList(history);
    };

    fetchHistory();
    // Re-check on local storage sync
    window.addEventListener("storage", fetchHistory);
    return () => window.removeEventListener("storage", fetchHistory);
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="w-[90%] max-w-[1300px] mx-auto pt-6 pb-2 font-sans text-left animate-fade-in">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#2563EB]">
        <Eye className="w-4.5 h-4.5" /> RECENTLY VIEWED RETREATS
      </div>
      <h2 className="text-2xl font-serif font-extrabold text-text-dark mt-1 mb-6">
        Pick Up Where You Left Off
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {list.map((resort) => {
          const isLiked = wishlist.some(item => (
            item.id === resort.id ||
            item.id === `home-${resort.id}` ||
            (typeof item.id === 'string' && item.id.includes(String(resort.id)))
          ));

          return (
            <div 
              key={resort.id}
              onClick={() => navigate(`/resort/${resort.id}`)}
              className="bg-bg-white border border-border-color rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 cursor-pointer flex flex-col group"
            >
              <div className="relative h-40 w-full overflow-hidden shrink-0 bg-bg-light">
                <img 
                  src={resort.heroImage || resort.image} 
                  alt={resort.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* Wishlist Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist({
                      id: resort.id,
                      name: resort.name,
                      location: resort.location,
                      price: resort.price,
                      heroImage: resort.heroImage || resort.image,
                      image: resort.heroImage || resort.image
                    });
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg-white/95 backdrop-blur text-text-gray flex items-center justify-center shadow-md hover:text-red-500 transition-all border-none cursor-pointer focus:outline-none z-10"
                  aria-label="Toggle Wishlist"
                >
                  <Heart 
                    size={15} 
                    className={`transition-colors duration-300 ${
                      isLiked ? "fill-red-500 text-red-500" : "text-text-gray"
                    }`} 
                  />
                </button>

                <div className="absolute bottom-3 right-3 bg-bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-text-dark text-[11px] font-bold shadow">
                  {currencySymbol}{(Math.round(resort.price * rates)).toLocaleString()}
                </div>
              </div>
              <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-text-gray font-semibold flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-[#2563EB]" /> {resort.location}
                  </span>
                  <h4 className="text-[13.5px] font-bold text-text-dark group-hover:text-primary transition truncate mt-0.5">
                    {resort.name}
                  </h4>
                </div>
                
                <div className="flex items-center justify-between text-[11px] font-bold text-primary pt-1 border-t border-border-color">
                  <span className="flex items-center gap-0.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {resort.rating}</span>
                  <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">Book <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
