import React, { useState, useEffect } from "react";
import rivoMascot from "../assets/images/rivo_mascot.jpg";
import rivoSearching from "../assets/images/rivo_searching.png";
import rivoConfirmed from "../assets/images/rivo_confirmed.png";
import rivoPlanner from "../assets/images/rivo_planner.png";
import rivoSupport from "../assets/images/rivo_support.png";

const STEPS = [
  { text: "Rivo is planning your trip...", image: rivoPlanner },
  { text: "Filtering best resort inventories...", image: rivoSearching },
  { text: "Checking live room availability...", image: rivoSupport },
  { text: "Matching exclusive travel deals...", image: rivoConfirmed },
  { text: "Finalizing your best options...", image: rivoMascot },
];

const TIPS = [
  "💡 Book weekdays for lower prices.",
  "💡 Flexible dates can save up to 30%.",
  "💡 Early booking gets the best rooms.",
  "💡 Bundle stays for exclusive discounts.",
];

const WEATHER_MAP = {
  Bali: { temp: "29°C", icon: "☀️", desc: "Sunny" },
  Maldives: { temp: "31°C", icon: "🌤️", desc: "Partly Cloudy" },
  Goa: { temp: "28°C", icon: "🌊", desc: "Sea Breeze" },
  Manali: { temp: "12°C", icon: "❄️", desc: "Snowy" },
  Santorini: { temp: "26°C", icon: "☀️", desc: "Clear" },
  Dubai: { temp: "38°C", icon: "🌅", desc: "Hot & Sunny" },
  Kerala: { temp: "27°C", icon: "🌧️", desc: "Light Rain" },
  Switzerland: { temp: "18°C", icon: "🏔️", desc: "Cool & Clear" },
};

const TOTAL_MS = 2500;

function SearchLoadingOverlay({ destination, onComplete }) {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const destKey = Object.keys(WEATHER_MAP).find((k) =>
    (destination || "").toLowerCase().includes(k.toLowerCase())
  ) || "Bali";
  const weather = WEATHER_MAP[destKey];

  const activeStepIndex = Math.min(completedSteps.length, STEPS.length - 1);
  const activeImage = STEPS[activeStepIndex].image;

  useEffect(() => {
    const stepTimers = STEPS.map((_, i) =>
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i]);
      }, (TOTAL_MS / STEPS.length) * (i + 1))
    );

    let prog = 0;
    const progressInterval = setInterval(() => {
      prog += 100 / (TOTAL_MS / 30);
      setProgress(Math.min(100, prog));
      if (prog >= 100) clearInterval(progressInterval);
    }, 30);

    const completeTimer = setTimeout(() => onComplete(), TOTAL_MS + 50);

    const tipTimer = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 500);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
      clearInterval(tipTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#080e0c]/92 backdrop-blur-md">
      <div className="flex flex-col items-center max-w-[460px] w-full px-8 text-center">

        {/* Mascot with pulse rings */}
        <div className="relative mb-8">
          <div className="absolute -inset-5 border-2 border-gold/30 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute -inset-9 border border-gold/15 rounded-full animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
          <img
            src={`${activeImage}?v=10`}
            alt="Rivo Mascot"
            className="w-24 h-24 rounded-full object-cover border-2 border-gold shadow-[0_0_30px_rgba(197,160,89,0.4)]"
            style={{ animation: "bounceRivo 2s infinite" }}
          />
        </div>

        {/* Brand */}
        <h2 className="text-[28px] font-extrabold tracking-[8px] text-white uppercase mb-1">
          RESERV<span className="text-gold">O</span>
        </h2>
        <p className="text-white/50 text-sm mb-8 tracking-wide">Curating the perfect stay for you...</p>

        {/* Steps */}
        <div className="w-full mb-7 text-left space-y-2">
          {STEPS.map((step, i) => {
            const done = completedSteps.includes(i);
            const active = !done && completedSteps.length === i;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 py-1 transition-all duration-400 ${
                  done ? "opacity-100" : active ? "opacity-100" : "opacity-25"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300 ${
                    done
                      ? "bg-gold text-white scale-100"
                      : active
                      ? "bg-white/15 border border-white/30 text-white"
                      : "bg-white/8 text-white/30 border border-white/10"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
                    done ? "text-gold" : active ? "text-white" : "text-white/30"
                  }`}
                >
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold via-gold to-[#e8c06a] transition-all duration-75"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="w-full text-right text-gold text-xs font-bold mb-8">
          {Math.min(100, Math.round(progress))}%
        </div>

        {/* Bottom cards: Weather + Tip */}
        <div className="flex gap-3 w-full">
          <div className="flex-1 bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5 text-left">
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">
              {destKey} Weather
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-3xl leading-none">{weather.icon}</span>
              <div>
                <div className="text-white font-extrabold text-lg leading-tight">{weather.temp}</div>
                <div className="text-white/50 text-[11px]">{weather.desc}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5 text-left">
            <div className="text-[10px] text-gold/60 font-bold uppercase tracking-widest mb-2">
              Travel Tip
            </div>
            <p className="text-white/60 text-[11.5px] leading-relaxed min-h-[40px]">
              {TIPS[tipIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchLoadingOverlay;
