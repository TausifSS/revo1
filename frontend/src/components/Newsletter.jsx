import React from "react";
import { Mail, ArrowRight, Tag, ShieldCheck, Gift } from "lucide-react";
import bgImage from "../assets/images/goa.jpg";

function Newsletter() {
  return (
    <section className="py-24 bg-[#F8F9FA]" id="newsletter">
      <div className="w-full max-w-[1280px] mx-auto px-5">
        
        <div className="relative bg-white rounded-[40px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col items-center text-center py-20 px-8">
          
          {/* Background Elements */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            {/* Left wave pattern (simulated with CSS gradient/shapes) */}
            <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-transparent opacity-70"></div>
          </div>
          
          {/* Right Resort Image Overlay */}
          <div className="absolute top-0 right-0 w-1/3 h-full pointer-events-none hidden lg:block opacity-90">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10"></div>
            <img src={bgImage} alt="Luxury Resort" className="w-full h-full object-cover object-left" />
          </div>

          <div className="relative z-20 max-w-[700px] w-full flex flex-col items-center">
            
            {/* Badge */}
            <div className="flex items-center gap-4 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              <span className="text-[11px] font-bold uppercase tracking-[3px] text-[#2F80ED]">Stay Connected</span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            </div>

            {/* Title */}
            <h2 className="text-[38px] sm:text-[46px] md:text-[54px] font-extrabold text-[#111] leading-[1.15] mb-6 font-serif">
              Unlock Exclusive <br />
              <span className="text-[#2F80ED]">Luxury Travel Deals</span>
            </h2>

            {/* Subtitle */}
            <p className="text-gray-500 text-[15px] sm:text-[17px] leading-relaxed mb-12 max-w-[560px]">
              Join thousands of travelers and receive exclusive resort offers, early access to seasonal discounts, travel inspiration, and premium vacation ideas directly in your inbox.
            </p>

            {/* Input Form */}
            <form className="w-full max-w-[600px] flex flex-col sm:flex-row items-center gap-3 bg-white p-2.5 rounded-[100px] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 mb-12 transition-shadow focus-within:shadow-[0_15px_40px_rgba(47,128,237,0.15)] focus-within:border-blue-100">
              <div className="flex-1 flex items-center gap-3 px-5 w-full">
                <Mail size={20} className="text-gray-400" />
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  className="w-full bg-transparent border-none outline-none text-[16px] text-[#111] placeholder:text-gray-400 py-3"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1B5CF8] hover:bg-[#1549d4] text-white px-9 py-4 rounded-[100px] text-[16px] font-semibold transition-all shadow-[0_10px_20px_rgba(27,92,248,0.25)] hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(27,92,248,0.35)] shrink-0"
              >
                Subscribe <ArrowRight size={18} />
              </button>
            </form>

            {/* Bottom Badges */}
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#2F80ED]">
                  <Tag size={14} />
                </div>
                <span className="text-[13px] font-semibold text-gray-700">Exclusive Discounts</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-200"></div>
              
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#2F80ED]">
                  <ShieldCheck size={14} />
                </div>
                <span className="text-[13px] font-semibold text-gray-700">No Spam, Ever</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-200"></div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#2F80ED]">
                  <Gift size={14} />
                </div>
                <span className="text-[13px] font-semibold text-gray-700">Weekly Travel Tips</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

export default Newsletter;