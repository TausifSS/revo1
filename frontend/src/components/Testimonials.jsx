import React from "react";
import { Quote, Star, ChevronLeft, ChevronRight, Users, Globe, Award, Shield } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Rahul Sharma",
    location: "Mumbai, India",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    review: "Reservo made our honeymoon unforgettable. The booking process was seamless, and the resort was even more beautiful than the pictures."
  },
  {
    id: 2,
    name: "Priya Patel",
    location: "Ahmedabad, India",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    review: "The luxury stay, exceptional hospitality, and smooth booking experience exceeded all our expectations. Highly recommended!"
  },
  {
    id: 3,
    name: "Aman Verma",
    location: "Delhi, India",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    review: "One of the finest resort booking platforms. Premium resorts, transparent pricing, and outstanding customer support."
  }
];

function Testimonials() {
  const { t } = useTranslation();
  return (
    <section className="py-12 bg-bg-light relative overflow-hidden transition-colors duration-300" id="testimonials">
      <div className="w-full max-w-[1280px] mx-auto px-5 relative z-10 flex flex-col items-center">
        
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-500"></div>
          <span className="text-[11px] font-bold uppercase tracking-[2px] text-yellow-600">{t("guest_reviews")}</span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-500"></div>
        </div>

        <h2 className="text-[32px] sm:text-[38px] md:text-[44px] font-extrabold text-text-dark leading-[1.1] text-center mb-3 font-serif transition-colors duration-300">
          {t("guests_say_part1")}<span className="text-primary">{t("guests_say_part2")}</span>{t("guests_say_part3")}
        </h2>
        
        <p className="text-text-gray text-[14px] leading-relaxed mb-8 max-w-[560px] text-center transition-colors duration-300">
          {t("reviews_desc")}
        </p>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 w-full">
          {TESTIMONIALS.map((item) => (
            <div key={item.id} className="bg-bg-white rounded-[24px] p-5.5 shadow-custom border border-border-color flex flex-col transition-colors duration-300">
              
              <div className="flex justify-between items-start mb-4">
                <Quote size={28} className="text-primary fill-current" />
                <div className="flex items-center gap-1 bg-bg-light text-primary px-2.5 py-1 rounded-full border border-border-color transition-colors duration-300">
                  <Star size={12} className="fill-current" />
                  <span className="text-xs font-bold">{item.rating.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-[13.5px] leading-relaxed text-text-gray mb-4 flex-1 transition-colors duration-300">
                "{t("review_" + item.id)}"
              </p>
              
              <div className="w-full h-px bg-border-color mb-4 transition-colors duration-300"></div>
 
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2.5">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="text-[13.5px] font-extrabold text-text-dark mb-0.5 flex items-center gap-1 transition-colors duration-300">
                      {item.name} 
                      <span className="bg-primary text-white rounded-full p-0.5"><Shield size={8} className="fill-current" /></span>
                    </h4>
                    <span className="text-[11px] text-text-gray font-medium transition-colors duration-300">{item.location}</span>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-3 bg-bg-white px-4 py-2 rounded-full shadow-sm border border-border-color transition-colors duration-300">
          <button className="text-primary hover:text-primary-dark transition-colors border-none bg-transparent cursor-pointer flex items-center"><ChevronLeft size={16} /></button>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1.5 rounded-full bg-primary transition-colors"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-border-color transition-colors"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-border-color transition-colors"></span>
          </div>
          <button className="text-primary hover:text-primary-dark transition-colors border-none bg-transparent cursor-pointer flex items-center"><ChevronRight size={16} /></button>
        </div>

      </div>
    </section>
  );
}

export default Testimonials;