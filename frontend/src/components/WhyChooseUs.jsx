import React, { useState } from "react";
import { Sparkles, ShieldCheck, CreditCard, HeadphonesIcon, Users, Globe, Award, Shield, ArrowRight, X } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const FEATURES = [
  {
    id: "01",
    icon: <Sparkles size={22} />,
    title: "AI Recommendations",
    description: "Our intelligent algorithm maps your mood, calendar, and past stay histories to deliver tailored recommendations.",
  },
  {
    id: "02",
    icon: <ShieldCheck size={22} />,
    title: "Hand-Verified Stays",
    description: "Every resort, villa, and boutique hotel goes through a thorough 150+ point safety, luxury, and auditing process.",
  },
  {
    id: "03",
    icon: <CreditCard size={22} />,
    title: "Secure Payments",
    description: "Sleek checkout powered by Stripe, accepting premium credit cards, digital wallets, and installment schedules.",
  },
  {
    id: "04",
    icon: <HeadphonesIcon size={22} />,
    title: "24/7 Concierge Support",
    description: "Our dedicated digital and human concierge support teams are available around the clock to handle bookings.",
  }
];

const STATS = [
  {
    icon: <Users size={16} />,
    value: "10,000+",
    label: "Happy Travelers",
    subLabel: "Trusted globally",
  },
  {
    icon: <Globe size={16} />,
    value: "1,200+",
    label: "Luxury Properties",
    subLabel: "Curated perfect stays",
  },
  {
    icon: <Award size={16} />,
    value: "4.9/5",
    label: "Average Rating",
    subLabel: "From 12K+ reviews",
  },
  {
    icon: <Shield size={16} />,
    value: "100%",
    label: "Secure & Safe",
    subLabel: "Your safety priority",
  }
];

function WhyChooseUs() {
  const { t } = useTranslation();
  const [activeFeature, setActiveFeature] = useState(null);

  return (
    <section className="py-12 bg-bg-light transition-colors duration-300" id="why">
      <div className="w-full max-w-[1280px] mx-auto px-5 flex flex-col items-center">
        
        {/* Top Badge */}
        <div className="flex items-center justify-center gap-2 bg-bg-light text-primary px-4 py-1.5 rounded-full mb-4 border border-border-color transition-colors duration-300">
          <ShieldCheck size={14} />
          <span className="text-[11px] font-bold uppercase tracking-[1px]">{t("why_choose_reservo")}</span>
        </div>

        {/* Header */}
        <h2 className="text-[32px] sm:text-[38px] md:text-[44px] font-extrabold text-text-dark leading-[1.1] text-center mb-3 font-serif transition-colors duration-300">
          {t("next_era_part1")}<span className="text-primary">{t("next_era_part2")}</span>
        </h2>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-500"></div>
          <div className="w-2 h-2 rotate-45 bg-yellow-500"></div>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-500"></div>
        </div>

        <p className="text-text-gray text-[14px] leading-relaxed mb-6 max-w-[560px] text-center transition-colors duration-300">
          {t("why_us_desc")}
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
          {FEATURES.map((feature, index) => (
            <div key={index} className="bg-bg-white rounded-3xl p-5 flex flex-col items-center text-center shadow-custom border border-border-color transition-all duration-300 hover:-translate-y-1">
              <div className="w-full flex justify-start mb-1">
                <span className="text-primary bg-bg-light font-bold text-[10px] px-2 py-0.5 rounded-full border border-border-color transition-colors duration-300">{feature.id}</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-bg-light flex items-center justify-center text-primary mb-3.5 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-[16px] font-bold text-text-dark mb-2 leading-snug transition-colors duration-300">{t("feature_" + feature.id + "_title")}</h3>
              <div className="w-8 h-0.5 bg-gradient-to-r from-blue-200 to-blue-500 rounded-full mb-3"></div>
              <p className="text-text-gray text-[13px] leading-relaxed mb-4 flex-1 transition-colors duration-300">{t("feature_" + feature.id + "_desc")}</p>
              
              <button 
                onClick={() => setActiveFeature(feature)}
                className="flex items-center gap-1.5 text-primary font-semibold text-[13px] hover:text-primary-dark transition-colors mt-auto group border-none bg-transparent cursor-pointer"
              >
                Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Stats Bar */}
        <div className="w-full bg-bg-white rounded-3xl p-5 shadow-custom border border-border-color flex flex-wrap justify-between items-center gap-6 transition-colors duration-300">
          {STATS.map((stat, index) => (
            <div key={index} className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-[0_5px_15px_rgba(13,71,161,0.2)] transition-colors duration-300">
                  {stat.icon}
                </div>
                <div>
                  <h4 className="text-[18px] font-extrabold text-text-dark leading-none mb-1 transition-colors duration-300">{stat.value}</h4>
                  <p className="text-[12px] font-medium text-text-gray m-0 transition-colors duration-300">{t("stat_" + index + "_label")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-yellow-500 text-[11px]">★</span>
                <span className="text-[11px] font-medium text-text-gray/80 transition-colors duration-300">{stat.subLabel}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Feature Detailed Modal */}
      {activeFeature && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-bg-white border border-border-color rounded-[32px] max-w-lg w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-left">
            <button 
              onClick={() => setActiveFeature(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-bg-light hover:bg-slate-200 border-none cursor-pointer flex items-center justify-center text-text-dark"
            >
              <X size={16} />
            </button>
            <div className="w-[72px] h-[72px] rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
              {activeFeature.icon}
            </div>
            <span className="text-[10px] bg-gold/15 text-gold font-bold px-3 py-1 rounded-full uppercase tracking-wider">Feature Detail</span>
            <h3 className="text-2xl font-extrabold text-text-dark mt-4 mb-3">{t("feature_" + activeFeature.id + "_title")}</h3>
            <p className="text-text-gray text-sm leading-relaxed mb-6">{t("feature_" + activeFeature.id + "_desc")}</p>
            <div className="p-4 bg-bg-light border border-border-color rounded-2xl">
              <h4 className="text-xs uppercase tracking-wider text-text-dark font-bold mb-2">Concierge Highlight:</h4>
              <p className="text-xs text-text-gray m-0 leading-relaxed">
                Rivo AI is fully optimized to sync with this feature. You can ask Rivo inside the chatbot at the bottom right to learn more about how we personalize recommendation profiles, verify luxury stays, manage Stripe checkouts, or order concierge services.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default WhyChooseUs;