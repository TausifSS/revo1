import React from "react";
import rivoSearching from "../assets/images/rivo_searching.png";

export default function EmptyState({ 
  title, 
  description, 
  ctaText, 
  onCtaClick, 
  icon: CustomIcon,
  image = rivoSearching 
}) {
  return (
    <div className="text-center py-16 px-5 border border-dashed border-border-color rounded-[32px] bg-bg-white shadow-sm flex flex-col items-center max-w-[550px] mx-auto animate-fade-in">
      <div className="relative w-36 h-36 mb-6">
        <img 
          src={image} 
          alt="Rivo mascot showing empty state" 
          className="w-full h-full rounded-full border-3 border-border-color object-cover shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
        />
        <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold border-3 border-bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          {CustomIcon ? <CustomIcon className="w-5 h-5" /> : "?"}
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-text-dark mb-2">{title}</h3>
      <p className="text-sm text-text-gray max-w-[360px] mx-auto leading-relaxed mb-6">
        {description}
      </p>

      {ctaText && onCtaClick && (
        <button 
          onClick={onCtaClick}
          className="bg-primary text-white border-none py-2.5 px-6 rounded-xl font-bold text-xs shadow hover:bg-primary-dark transition cursor-pointer select-none"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
}
