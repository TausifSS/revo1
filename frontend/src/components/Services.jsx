import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const EXPERIENCES = [
  {
    id: 1,
    title: "Luxury Spa Rituals",
    description: "Restore clarity and balance with hand-tailored botanical therapies, hot volcanic stones, and master therapists.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    title: "Private Yacht Charters",
    description: "Explore remote sandbars, crystal lagoons, and sunset sail routes with a private catamaran fleet and dedicated chef.",
    image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    title: "Helicopter Coastline Tours",
    description: "Take in stunning volcanic peaks, majestic cascading waterfalls, and oceanic vistas from premium custom heights.",
    image: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    title: "Bespoke Safari Treks",
    description: "Capture majestic animal migration, track rare reserve species, and enjoy sunset dining amidst open savanna peaks.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80"
  }
];

function Services() {
  const [sliderIndex, setSliderIndex] = useState(0);

  const handleNext = () => {
    if (sliderIndex < EXPERIENCES.length - 3) {
      setSliderIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (sliderIndex > 0) {
      setSliderIndex(prev => prev - 1);
    }
  };

  return (
    <section className="py-20 bg-bg-white transition-colors duration-300 overflow-hidden" id="experiences">
      <div className="w-[90%] max-w-[1300px] mx-auto">
        
        {/* Title Header with Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12.5">
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-gold mb-3">Luxury Curated Programs</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4.5">Experiences Beyond Stays</h2>
            <p className="text-text-gray text-base md:text-lg leading-relaxed max-w-[720px]">
              Immerse yourself in authentic custom adventures mapped by local culture and elite hospitality experts.
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              className={`w-11 h-11 rounded-full border border-border-color bg-bg-white text-text-dark flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-gold hover:text-gold hover:scale-105 disabled:opacity-40 disabled:pointer-events-none`}
              onClick={handlePrev}
              disabled={sliderIndex === 0}
              aria-label="Previous experiences"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className={`w-11 h-11 rounded-full border border-border-color bg-bg-white text-text-dark flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-gold hover:text-gold hover:scale-105 disabled:opacity-40 disabled:pointer-events-none`}
              onClick={handleNext}
              disabled={sliderIndex >= EXPERIENCES.length - 3}
              aria-label="Next experiences"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Carousel Slider */}
        <div className="w-full">
          <div 
            className="flex gap-[30px] transition-transform duration-500 ease-out w-full overflow-x-auto md:overflow-visible scrollbar-none [transform:none] md:[transform:var(--carousel-transform)]"
            style={{
              "--carousel-transform": `translateX(-${sliderIndex * (100 / 3)}%)`
            }}
          >
            {EXPERIENCES.map((exp) => (
              <div className="flex-[0_0_85%] md:flex-[0_0_calc((100%-30px)/2)] lg:flex-[0_0_calc((100%-60px)/3)] h-[350px] lg:h-[400px] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] relative cursor-pointer transition-all duration-400 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] group" key={exp.id}>
                {/* Image background */}
                <div className="w-full h-full">
                  <img src={exp.image} alt={exp.title} className="w-full h-full object-cover transition-transform duration-600 ease-out group-hover:scale-105" />
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10 transition-opacity duration-300"></div>
                {/* Info Text */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 text-white text-left">
                  <h3 className="text-2xl font-bold text-white mb-2 [text-shadow:0_2px_4px_rgba(0,0,0,0.2)]">{exp.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-white/85 m-0">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default Services;