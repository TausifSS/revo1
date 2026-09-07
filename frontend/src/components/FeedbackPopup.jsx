import React, { useEffect, useState } from "react";
import { X, Sparkles, Send } from "lucide-react";

function FeedbackPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let hasShown = false;

    const showFeedback = () => {
      if (hasShown) return;

      hasShown = true;
      setIsVisible(true);

      window.removeEventListener("scroll", handleScroll);
    };

    const timer = setTimeout(showFeedback, 20000);

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const pageHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (pageHeight > 0) {
        const scrollPercentage =
          (scrollPosition / pageHeight) * 100;

        if (scrollPercentage >= 45) {
          showFeedback();
        }
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleRating = (rating) => {
    setSelectedRating(rating);
    setShowMessage(true);
  };

  const handleSubmit = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="
        fixed
        bottom-6
        left-6
        z-[9999]
        w-[340px]
        sm:w-[380px]
        animate-feedback-popup
      "
    >
      <div
        className="
          relative
          overflow-hidden
          rounded-[24px]
          border
          border-border-color
          bg-bg-white
          backdrop-blur-xl
          p-6
          shadow-[0_20px_60px_rgba(0,0,0,0.25)]
          transition-colors
          duration-300
        "
      >

        {/* Decorative glow */}
        <div
          className="
            absolute
            -right-12
            -top-12
            h-32
            w-32
            rounded-full
            bg-primary/20
            blur-2xl
          "
        />

        
        {/* Close Button */}
        <button
          type="button"
          aria-label="Close feedback"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="
            absolute
            right-4
            top-4
            z-50
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-bg-light
            border
            border-border-color
            text-text-gray
            shadow-sm
            transition-all
            duration-300
            hover:text-text-dark
            hover:scale-110
            cursor-pointer
          "
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Header */}
        <div className="relative mb-5 text-left">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-primary/10
                text-primary
              "
            >
              <Sparkles size={18} />
            </div>

            <span
              className="
                text-[11px]
                font-bold
                uppercase
                tracking-[0.15em]
                text-primary
              "
            >
              Quick Feedback
            </span>
          </div>

          <h3
            className="
              font-serif
              text-[22px]
              font-bold
              leading-tight
              text-text-dark
            "
          >
            Enjoying Reservo?
          </h3>

          <p className="mt-1 text-[13px] leading-relaxed text-text-gray font-medium">
            We'd love to know how your experience has been so far.
          </p>
        </div>

        {/* Rating */}
        <div className="relative text-left">
          <p className="mb-3 text-[13px] font-bold text-text-dark">
            How would you rate your experience?
          </p>

          <div className="flex justify-between rounded-2xl bg-bg-light border border-border-color p-3">
            {[
              { emoji: "😞", label: "Poor" },
              { emoji: "😕", label: "Okay" },
              { emoji: "🙂", label: "Good" },
              { emoji: "😍", label: "Great" },
              { emoji: "🤩", label: "Amazing" },
            ].map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleRating(index)}
                title={item.label}
                className={`
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  text-[22px]
                  cursor-pointer
                  border-none
                  transition-all
                  duration-300
                  ${
                    selectedRating === index
                      ? "scale-110 bg-bg-white border border-border-color shadow-md"
                      : "hover:scale-110 hover:bg-bg-white hover:shadow-sm"
                  }
                `}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Message appears after rating */}
        {showMessage && (
          <div className="mt-4 animate-fade-in text-left">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              rows={3}
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-border-color
                bg-bg-light
                px-4
                py-3
                text-xs
                font-semibold
                text-text-dark
                outline-none
                transition
                focus:border-primary
                focus:bg-bg-white
              "
            />

            <button
              type="button"
              onClick={handleSubmit}
              className="
                mt-3
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-primary
                py-3
                text-xs
                font-bold
                text-white
                border-none
                cursor-pointer
                shadow-lg
                shadow-primary/20
                transition-all
                duration-300
                hover:bg-primary-dark
                active:scale-[0.98]
              "
            >
              Send Feedback
              <Send size={14} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default FeedbackPopup;