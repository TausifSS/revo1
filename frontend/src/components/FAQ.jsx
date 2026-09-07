import React, { useState } from "react";
import { Sparkles, X, Plus } from "lucide-react";

const faqData = [
  {
    question: "How do I book a luxury resort?",
    answer:
      "Simply search for your preferred destination, select a resort, choose your check-in and check-out dates, and complete the secure payment process.",
  },
  {
    question: "Can I cancel or modify my booking?",
    answer:
      "Yes. Booking modifications and cancellations are available according to the cancellation policy of your selected resort.",
  },
  {
    question: "Are my online payments secure?",
    answer:
      "Absolutely. Reservo uses industry-standard encrypted payment gateways to ensure every transaction is completely secure.",
  },
  {
    question: "When will I receive my booking confirmation?",
    answer:
      "Your booking confirmation is sent instantly via email immediately after successful payment.",
  },
  {
    question: "Is customer support available 24/7?",
    answer:
      "Yes. Our dedicated travel experts are available 24 hours a day to assist with bookings, cancellations, and travel queries.",
  },
  {
    question: "Do resorts include complimentary breakfast?",
    answer:
      "Many of our partner resorts offer complimentary breakfast. The inclusions are clearly listed on each resort page.",
  },
];

function FAQ() {
  const [selectedFaq, setSelectedFaq] = useState(null);

  return (
    <section className="py-12 bg-bg-light transition-colors duration-300">
      <div className="w-[90%] max-w-[1300px] mx-auto">
        <span className="block text-center text-xs font-bold uppercase tracking-widest text-gold mb-2">
          Help Center
        </span>

        <h2 className="text-[24px] sm:text-[28px] md:text-[34px] font-bold text-center text-primary mb-2.5">
          Frequently Asked Questions
        </h2>

        <p className="max-w-[720px] mx-auto mb-4 text-center text-text-gray text-[14px] leading-relaxed">
          Everything you need to know before booking your next luxury getaway.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3.5 max-w-[1000px] mx-auto mt-6">
          {faqData.map((item, index) => {
            return (
              <div
                key={index}
                onClick={() => setSelectedFaq(item)}
                className="bg-bg-white border border-border-color rounded-xl overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md cursor-pointer flex justify-between items-center px-5 py-4 gap-3 group"
              >
                <h3 className="text-[14px] font-bold text-text-dark m-0 leading-snug group-hover:text-primary transition-colors">
                  {item.question}
                </h3>

                <span className="shrink-0 w-8 h-8 rounded-full flex justify-center items-center bg-bg-light border border-border-color text-text-gray group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                  <Plus size={16} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Answer Modal Popup (Matches Image 2) */}
      {selectedFaq && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedFaq(null)}
        >
          <div
            className="bg-bg-white border border-border-color rounded-[32px] p-6 sm:p-8 max-w-lg w-full relative shadow-2xl text-left space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedFaq(null)}
              className="absolute top-5 right-5 text-text-gray hover:text-text-dark bg-bg-light border border-border-color p-2 rounded-full cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>

            {/* Top Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
              <Sparkles size={22} />
            </div>

            {/* Category Pill */}
            <div>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                FAQ Detail
              </span>
            </div>

            {/* Question Title */}
            <h3 className="text-xl sm:text-2xl font-black text-text-dark font-serif leading-snug">
              {selectedFaq.question}
            </h3>

            {/* Answer Content */}
            <p className="text-[14px] text-text-gray font-medium leading-relaxed">
              {selectedFaq.answer}
            </p>

            {/* Concierge Highlight Container */}
            <div className="bg-bg-light border border-border-color rounded-2xl p-4 space-y-2 mt-4">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5 m-0">
                <Sparkles size={12} /> CONCIERGE HIGHLIGHT:
              </h4>
              <p className="text-[12px] text-text-gray leading-relaxed font-semibold m-0">
                Rivo AI is fully optimized to sync with this feature. You can ask Rivo inside the chatbot at the bottom right to learn more about how we personalize recommendation profiles, verify luxury stays, manage checkout, or order concierge services.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default FAQ;