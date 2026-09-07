import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Pause, Play, Compass, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ResortNavigationMap({ mapPoints = [], resortName = "Resort Grounds", isDarkMode, onSelectSpot }) {
  const [selectedPoint, setSelectedPoint] = useState(mapPoints[0] || null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  useEffect(() => {
    if (mapPoints.length > 0 && !selectedPoint) {
      setSelectedPoint(mapPoints[0]);
    }
  }, [mapPoints]);

  useEffect(() => {
    let interval;
    if (isTourRunning && mapPoints.length > 0) {
      interval = setInterval(() => {
        setTourIndex((prev) => {
          const next = (prev + 1) % mapPoints.length;
          setSelectedPoint(mapPoints[next]);
          return next;
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isTourRunning, mapPoints]);

  const filteredPoints = activeFilter === 'all'
    ? mapPoints
    : mapPoints.filter(p => p.category === activeFilter);

  return (
    <div className={`rounded-3xl p-6 shadow-xl border font-sans my-8 ${
      isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
    }`}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b ${
        isDarkMode ? 'border-[#334155]' : 'border-[#E2E8F0]'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-[#2563EB] font-bold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4" /> Interactive Spatial Tour
          </div>
          <h3 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
            {resortName} Navigation Map
          </h3>
          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
            Click pins to view walking distance, real-time availability, and private amenity options.
          </p>
        </div>

        <button
          onClick={() => setIsTourRunning(!isTourRunning)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold shadow transition ${
            isTourRunning
              ? 'bg-amber-500 text-white animate-pulse'
              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
          }`}
        >
          {isTourRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isTourRunning ? 'Pause Rivo Map Tour' : 'Start Rivo Guided Tour'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { id: 'all', label: 'All Locations' },
          { id: 'accommodation', label: 'Villas & Suites' },
          { id: 'leisure', label: 'Pools & Beaches' },
          { id: 'wellness', label: 'Spa & Wellness' },
          { id: 'dining', label: 'Fine Dining' },
          { id: 'transport', label: 'Helipad & Cruises' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
              activeFilter === tab.id
                ? 'bg-[#2563EB] text-white shadow-sm'
                : isDarkMode
                  ? 'bg-[#111827] text-[#CBD5E1] hover:bg-[#334155]'
                  : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#DBEAFE]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className={`lg:col-span-2 relative min-h-[380px] sm:min-h-[460px] rounded-2xl overflow-hidden shadow-inner border ${
          isDarkMode ? 'bg-[#0B1120] border-[#334155]' : 'bg-[#EBF5FF] border-[#E2E8F0]'
        }`}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 1000 600">
            <path d="M 0 400 Q 300 300 600 450 T 1000 350 L 1000 600 L 0 600 Z" fill="#2563eb" />
            <path d="M 150 200 C 300 100 500 150 750 250 C 850 300 600 450 450 380 Z" fill="none" stroke="#60a5fa" strokeWidth="4" strokeDasharray="8,8" />
          </svg>

          <div className="absolute bottom-4 left-6 text-[#2563EB] font-bold text-xs tracking-widest uppercase flex items-center gap-1.5 opacity-90">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping"></span> Arabian Sea Shoreline
          </div>

          {filteredPoints.map((point) => {
            const isSelected = selectedPoint?.id === point.id;
            return (
              <div
                key={point.id}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
              >
                {isSelected && (
                  <span className="absolute -inset-2 rounded-full bg-[#2563EB] opacity-40 animate-ping"></span>
                )}

                <button
                  onClick={() => {
                    setSelectedPoint(point);
                    setIsTourRunning(false);
                  }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all transform hover:scale-110 border ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-white ring-4 ring-[#60A5FA]/40 scale-110 z-30'
                      : isDarkMode
                        ? 'bg-[#1E293B] text-white border-[#334155]'
                        : 'bg-white text-stone-900 border-[#E2E8F0]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
                  <span className="truncate max-w-[90px] sm:max-w-[120px]">{point.title}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Point Details */}
        <div className={`rounded-2xl p-5 border flex flex-col justify-between ${
          isDarkMode ? 'bg-[#111827] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          {selectedPoint ? (
            <div>
              <div className="relative h-44 rounded-xl overflow-hidden mb-4 shadow">
                <img src={selectedPoint.image} alt={selectedPoint.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold shadow bg-[#2563EB] text-white">
                    {selectedPoint.category.toUpperCase()}
                  </span>
                </div>
              </div>

              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
                {selectedPoint.title}
              </h4>

              <div className="flex items-center gap-4 text-xs my-3">
                <span className="flex items-center gap-1 font-medium text-[#2563EB]">
                  <Clock className="w-3.5 h-3.5" /> {selectedPoint.walkTime}
                </span>
                <span className="flex items-center gap-1 font-medium text-[#22C55E]">
                  <ShieldCheck className="w-3.5 h-3.5" /> {selectedPoint.status}
                </span>
              </div>

              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                {selectedPoint.desc}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full text-stone-400">
              <MapPin className="w-8 h-8 mb-2 text-[#2563EB]" />
              <p className="text-xs">Select any pin to view location details</p>
            </div>
          )}

          {selectedPoint && (
            <div className="mt-5 pt-4 border-t border-stone-200">
              <button
                onClick={() => onSelectSpot && onSelectSpot(selectedPoint)}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow"
              >
                Request Rivo Escort Here <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
