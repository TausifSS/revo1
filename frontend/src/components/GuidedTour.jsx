import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import rivoMascot from '../assets/images/rivo_mascot.jpg';

const TOUR_STEPS = [
  {
    target: '[href="/"]',
    title: "Welcome to Reservo! 🌴",
    content: "Discover verified luxury retreats, overwater villas, and nature sanctuaries around the world."
  },
  {
    target: '[href="/ai-planner"]',
    title: "✨ Rivo AI Trip Planner",
    content: "Ask Rivo to draft your next custom vacation itinerary in seconds."
  },
  {
    target: '[href="/wishlist"]',
    title: "❤️ Curated Wishlists",
    content: "Keep track of your favorite luxury suites and book them instantly."
  },
  {
    target: '[aria-label="Toggle Rivo AI Companion"]',
    title: "🛎️ Your 24/7 AI Companion",
    content: "Click Rivo at any time to check room status, order food, or get local weather details."
  }
];

export default function GuidedTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Show only once
    const completed = localStorage.getItem("reservo-tour-completed");
    if (!completed) {
      // Delay tour popup by 2 seconds for smooth landing page experience
      const timer = setTimeout(() => setShowTour(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!showTour) return;

    const updateSpotlight = () => {
      const step = TOUR_STEPS[currentStep];
      const el = document.querySelector(step.target);
      if (el) {
        // Scroll element into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait briefly for scroll to settle before measuring
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setCoords({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
        }, 150);
      } else {
        // Fallback to center screen if element is missing
        setCoords({
          top: window.innerHeight / 2 - 50,
          left: window.innerWidth / 2 - 150,
          width: 300,
          height: 100,
          isFallback: true
        });
      }
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [currentStep, showTour]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("reservo-tour-completed", "true");
    setShowTour(false);
  };

  if (!showTour || !coords) return null;

  const current = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none select-none font-sans">
      {/* SVG Spotlight Mask */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] pointer-events-auto">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {!coords.isFallback && (
                <rect 
                  x={coords.left - window.scrollX - 6} 
                  y={coords.top - window.scrollY - 6} 
                  width={coords.width + 12} 
                  height={coords.height + 12} 
                  rx="12" 
                  fill="black" 
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="currentColor" mask="url(#spotlight-mask)" />
        </svg>
      </div>

      {/* Tooltip Dialog Card */}
      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            // Position near the spotlight element
            top: coords.isFallback 
              ? window.innerHeight / 2 - 100 
              : coords.top - window.scrollY + coords.height + 16,
            left: coords.isFallback 
              ? window.innerWidth / 2 - 150 
              : Math.max(16, Math.min(window.innerWidth - 336, coords.left - window.scrollX + (coords.width / 2) - 150))
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className="absolute w-[300px] bg-bg-white border border-border-color rounded-3xl p-5 shadow-2xl pointer-events-auto flex flex-col gap-4 text-left"
        >
          {/* Close button */}
          <button 
            onClick={handleComplete}
            className="absolute top-4 right-4 text-text-gray hover:text-text-dark bg-transparent border-none cursor-pointer p-0"
            aria-label="Skip onboarding tour"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Rivo Header info */}
          <div className="flex items-center gap-3">
            <img src={rivoMascot} alt="Rivo" className="w-9 h-9 rounded-full object-cover border border-gold" />
            <div>
              <h4 className="text-xs font-bold text-text-dark flex items-center gap-1">
                {current.title} <Sparkles className="w-3 h-3 text-gold animate-pulse" />
              </h4>
              <span className="text-[9px] uppercase tracking-wider text-text-gray font-bold">Step {currentStep + 1} of {TOUR_STEPS.length}</span>
            </div>
          </div>

          <p className="text-[11.5px] leading-relaxed text-text-gray font-semibold">
            {current.content}
          </p>

          {/* Actions bottom */}
          <div className="flex items-center justify-between pt-2 border-t border-border-color">
            <button 
              onClick={handleComplete}
              className="text-[10px] text-text-gray hover:text-text-dark bg-transparent border-none font-bold cursor-pointer"
            >
              Skip Intro
            </button>

            <button 
              onClick={handleNext}
              className="py-1.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border-none shadow transition"
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Finish Tour" : <>Next <ChevronRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
