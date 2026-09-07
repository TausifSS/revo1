import React, { useState, useEffect } from "react";
import rivoSupport from "../assets/images/rivo_support.png";

const LOADING_STEPS = [
  "Rivo is matching live inventories...",
  "Setting up luxury concierge...",
  "Unlocking elite hotel keys...",
  "Welcome to Reservo!"
];

function Preloader({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Cycle loading messages
    // Cycle loading messages faster for better UX
    const textInterval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 300);

    // Fade out after 1.2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1200);

    // Call onComplete after transition finishes (1.6s total)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1600);

    return () => {
      clearInterval(textInterval);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 bg-[#111111] z-[9999] flex flex-col items-center justify-center transition-all duration-700 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      }`}
    >
      {/* Concierge Card Wrapper */}
      <div className="flex flex-col items-center max-w-[420px] px-6 text-center animate-in fade-in zoom-in duration-500">
        
        {/* Pulsing Mascot Circle */}
        <div className="relative w-28 h-28 mb-8">
          <img 
            src={rivoSupport} 
            alt="Rivo Concierge" 
            className="w-full h-full rounded-full border-3 border-gold object-cover animate-bounce-rivo"
          />
          <div className="absolute -inset-3 border-2 border-gold rounded-full animate-pulse-rivo pointer-events-none z-[-1]"></div>
        </div>

        {/* Brand Logo with Letter Spacing Animation */}
        <h1 className="text-3xl font-extrabold tracking-[10px] text-white uppercase mb-4 pl-[10px] select-none animate-pulse">
          RESERV<span className="text-gold">O</span>
        </h1>

        {/* Dynamic Status Text */}
        <p className="text-text-gray text-[14.5px] font-medium leading-relaxed min-h-[44px] transition-all duration-300">
          {LOADING_STEPS[stepIndex]}
        </p>

        {/* Elegant Gold Progress Line */}
        <div className="w-40 h-[2px] bg-white/10 rounded-full mt-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full bg-gold rounded-full animate-[loadingProgress_1.2s_ease-out_forwards]" />
        </div>
      </div>
    </div>
  );
}

export default Preloader;
