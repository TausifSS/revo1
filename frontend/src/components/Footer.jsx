import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import logoImage from "../assets/images/logo.png";
import { hostService } from "../services/host.service";

// Inline SVG components for brand and utility icons
const GlobeIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const TwitterIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const XIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const LinkedInIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const MapPinIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.5 19.5 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MailIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SendIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const HeadphoneIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const LockIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function Footer() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [hasPublished, setHasPublished] = useState(() => hostService.hasPublishedListing());

  useEffect(() => {
    const handleHostCheck = () => {
      setHasPublished(hostService.hasPublishedListing());
    };
    window.addEventListener("storage", handleHostCheck);
    window.addEventListener("reservo-host-data-updated", handleHostCheck);
    return () => {
      window.removeEventListener("storage", handleHostCheck);
      window.removeEventListener("reservo-host-data-updated", handleHostCheck);
    };
  }, []);

  const renderFeedbackModal = () => {
    if (!showFeedbackModal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10005] flex items-center justify-center p-4" onClick={() => setShowFeedbackModal(false)}>
        <div className="bg-bg-white border border-border-color rounded-3xl p-6 shadow-2xl max-w-md w-full relative space-y-4 text-left font-sans animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            onClick={() => setShowFeedbackModal(false)}
            className="absolute top-4 right-4 text-text-gray hover:text-text-dark bg-transparent border-none cursor-pointer p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-dark">Thank You!</h3>
              <p className="text-text-gray text-xs leading-relaxed max-w-xs mx-auto font-medium">
                Your feedback has been logged. We appreciate your input in helping us make Reservo better!
              </p>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-xl text-xs border-none cursor-pointer hover:bg-primary-dark transition"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!feedbackText.trim()) return;
              setSubmitted(true);
              setFeedbackText("");
            }} className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <MessageSquare size={20} />
                <span>Send Feedback</span>
              </div>
              <p className="text-xs text-text-gray leading-relaxed font-semibold">
                Have suggestions or thoughts about your experience on Reservo? Let us know below!
              </p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your thoughts or suggestions..."
                required
                className="w-full p-3 border border-border-color rounded-xl text-xs outline-none bg-bg-light text-text-dark h-28 resize-none font-semibold focus:border-primary transition"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 bg-transparent text-text-gray hover:text-text-dark font-bold text-xs rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border-none cursor-pointer shadow hover:bg-primary-dark transition"
                >
                  <Send size={12} /> Submit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // Small Footer for subpages
  if (!isHomePage) {
    return (
      <>
        <footer className="bg-[#0B1530] text-slate-300 py-12 border-t border-slate-800 font-sans mt-auto">
          <div className="w-full max-w-[1280px] mx-auto px-6">
            {/* Top section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 pb-8 border-b border-slate-800">
              
              {/* Left Side: Logo and tagline */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <Link to="/" className="flex items-center gap-2 no-underline text-white">
                  <img src={logoImage} alt="R" className="h-9 w-auto object-contain" />
                  <span className="text-[20px] font-extrabold tracking-[0.5px] font-serif text-white transition-colors duration-300">
                    Reservo
                  </span>
                </Link>
                <p className="text-slate-400 text-sm mt-3">
                  Luxury stays. Unforgettable experiences.
                </p>
              </div>

              {/* Center: Navigation Links */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold">
                <Link to="/" className="text-slate-300 hover:text-white transition-colors decoration-none">Home</Link>
                <span className="text-slate-600">•</span>
                <Link to="/search" className="text-slate-300 hover:text-white transition-colors decoration-none">Destinations</Link>
                <span className="text-slate-600">•</span>
                <Link to="/resorts" className="text-slate-300 hover:text-white transition-colors decoration-none">Stays</Link>
                <span className="text-slate-600">•</span>
                <Link to="/about" className="text-slate-300 hover:text-white transition-colors decoration-none">About Us</Link>
                <span className="text-slate-600">•</span>
                <button type="button" onClick={() => { setShowFeedbackModal(true); setSubmitted(false); }} className="text-slate-300 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-sm font-semibold">Feedback</button>
                <span className="text-slate-600">•</span>
                <Link to="/support" className="text-slate-300 hover:text-white transition-colors decoration-none">Contact Us</Link>
              </div>

              {/* Right Side: Follow Us */}
              <div className="flex flex-col items-center md:items-end gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Follow Us</span>
                <div className="flex gap-3">
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Reservo Instagram" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#2563EB] hover:text-white flex items-center justify-center text-slate-300 transition-colors">
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Reservo Facebook" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#2563EB] hover:text-white flex items-center justify-center text-slate-300 transition-colors">
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Reservo X" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#2563EB] hover:text-white flex items-center justify-center text-slate-300 transition-colors">
                    <XIcon className="w-4 h-4" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Reservo LinkedIn" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#2563EB] hover:text-white flex items-center justify-center text-slate-300 transition-colors">
                    <LinkedInIcon className="w-4 h-4" />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Reservo YouTube" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#2563EB] hover:text-white flex items-center justify-center text-slate-300 transition-colors">
                    <YoutubeIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>

            {/* Bottom Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-xs text-slate-500">
              <div>
                &copy; 2026 <span className="font-semibold text-slate-400">Reservo</span>. All Rights Reserved.
              </div>
              <div className="flex gap-4">
                <Link to="/terms" className="hover:text-slate-300 transition-colors decoration-none">Terms of Service</Link>
                <Link to="/help" className="hover:text-slate-300 transition-colors decoration-none">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </footer>
        {renderFeedbackModal()}
      </>
    );
  }

  // Large Footer for Landing/Home page
  return (
    <>
      <footer
        className="bg-bg-white pt-16 font-sans border-t border-border-color transition-colors duration-300"
        id="footer"
      >
        <div className="w-full max-w-[1280px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-6 mb-12">

            {/* Left Column: Brand & Social */}
            <div className="lg:col-span-3">
              <Link to="/" className="flex items-center gap-2 no-underline mb-6">
                <img
                  src={logoImage}
                  alt="R"
                  className="h-10 w-auto object-contain"
                />

                <span className="text-[24px] font-extrabold tracking-[0.5px] text-text-dark font-serif transition-colors duration-300">
                  Reservo
                </span>
              </Link>

              <p className="text-text-gray text-[14px] leading-relaxed mb-8 max-w-[280px] transition-colors duration-300">
                Discover India's finest luxury resorts, boutique stays, and
                unforgettable travel experiences. Your perfect vacation starts
                with Reservo.
              </p>

              <div className="flex gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Reservo Facebook Page"
                  className="w-10 h-10 rounded-full border border-border-color flex items-center justify-center text-text-gray hover:text-white hover:bg-primary hover:border-primary transition-all bg-transparent"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Reservo Instagram Page"
                  className="w-10 h-10 rounded-full border border-border-color flex items-center justify-center text-text-gray hover:text-white hover:bg-primary hover:border-primary transition-all bg-transparent"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>

                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Reservo X Page"
                  className="w-10 h-10 rounded-full border border-border-color flex items-center justify-center text-text-gray hover:text-white hover:bg-primary hover:border-primary transition-all bg-transparent"
                >
                  <XIcon className="w-4 h-4" />
                </a>

                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Reservo LinkedIn Page"
                  className="w-10 h-10 rounded-full border border-border-color flex items-center justify-center text-text-gray hover:text-white hover:bg-primary hover:border-primary transition-all bg-transparent"
                >
                  <LinkedInIcon className="w-4 h-4" />
                </a>

                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Reservo YouTube Page"
                  className="w-10 h-10 rounded-full border border-border-color flex items-center justify-center text-text-gray hover:text-white hover:bg-primary hover:border-primary transition-all bg-transparent"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2 lg:col-start-4">
              <h4 className="text-[14px] font-extrabold text-text-dark uppercase tracking-wider mb-6 flex flex-col gap-2 transition-colors duration-300">
                Quick Links
                <span className="w-8 h-0.5 bg-[#2563EB]"></span>
              </h4>

              <ul className="flex flex-col gap-4 text-[14px] text-text-gray font-medium p-0 list-none transition-colors duration-300">
                <li>
                  <Link
                    to="/"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Home</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/search"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Destinations</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/search"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Stays</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/about"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>About Us</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to={hasPublished ? "/host/dashboard" : "/become-a-host"}
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>{hasPublished ? "Host Administration" : "Become a Host"}</span>
                  </Link>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeedbackModal(true);
                      setSubmitted(false);
                    }}
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5 bg-transparent border-none p-0 cursor-pointer font-medium text-[14px] w-full text-left"
                  >
                    <span>Feedback</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Our Services */}
            <div className="lg:col-span-2">
              <h4 className="text-[14px] font-extrabold text-text-dark uppercase tracking-wider mb-6 flex flex-col gap-2 transition-colors duration-300">
                Our Services
                <span className="w-8 h-0.5 bg-[#2563EB]"></span>
              </h4>

              <ul className="flex flex-col gap-4 text-[14px] text-text-gray font-medium p-0 list-none transition-colors duration-300">
                <li>
                  <Link
                    to="/search"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Luxury Stays</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/search"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Spa & Wellness</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/search"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Private Villas</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/search"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Wedding Events</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/search"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Travel Packages</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Info */}
            <div className="lg:col-span-2">
              <h4 className="text-[14px] font-extrabold text-text-dark uppercase tracking-wider mb-6 flex flex-col gap-2 transition-colors duration-300">
                Company Info
                <span className="w-8 h-0.5 bg-[#2563EB]"></span>
              </h4>

              <ul className="flex flex-col gap-4 text-[14px] text-text-gray font-medium p-0 list-none transition-colors duration-300">
                <li>
                  <Link
                    to="/careers"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Careers</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/terms"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Terms of Service</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/help"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Help Center</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/support"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Support</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/privacy-policy"
                    className="hover:text-primary transition-colors flex items-center justify-between text-text-gray decoration-none py-0.5"
                  >
                    <span>Privacy Policy</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-3">
              <h4 className="text-[14px] font-extrabold text-text-dark uppercase tracking-wider mb-6 flex flex-col gap-2 transition-colors duration-300">
                Newsletter
                <span className="w-8 h-0.5 bg-[#2563EB]"></span>
              </h4>

              <p className="text-text-gray text-[13px] leading-relaxed mb-6 transition-colors duration-300">
                Subscribe to get exclusive offers, travel inspiration & more.
              </p>

              <form
                className="flex flex-col gap-3 relative z-10"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="relative w-full">
                  <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray" />

                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full border border-border-color rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-bg-light text-text-dark"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 border-none cursor-pointer transition-colors shadow-md"
                >
                  Subscribe
                  <SendIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#0B1530] text-slate-300 py-6 w-full transition-colors duration-300">
          <div className="w-full max-w-[1280px] mx-auto px-6 flex flex-col lg:flex-row justify-between items-center gap-6 text-xs font-semibold">

            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <ShieldIcon className="w-4 h-4 text-[#2563EB]" />
                100% Secure Booking
              </span>

              <span className="w-px h-4 bg-slate-800"></span>

              <span className="flex items-center gap-2">
                <HeadphoneIcon className="w-4 h-4 text-[#2563EB]" />
                24/7 Customer Support
              </span>
            </div>

            <div className="text-slate-400">
              &copy; 2026{" "}
              <span className="font-extrabold text-white">Reservo</span>.
              All Rights Reserved.
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="font-black italic text-sm tracking-tighter text-white">
                  VISA
                </span>

                <div className="flex items-center -space-x-1.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-[#EB001B] opacity-90"></div>
                  <div className="w-4.5 h-4.5 rounded-full bg-[#F79E1B] opacity-90"></div>
                </div>

                <span className="font-bold italic text-[10px] border border-slate-700 px-1.5 py-0.5 rounded-sm text-slate-400">
                  AMEX
                </span>

                <span className="font-bold italic text-xs text-white">
                  UPI
                </span>
              </div>

              <span className="w-px h-4 bg-slate-800"></span>

              <span className="flex items-center gap-1.5">
                <LockIcon className="w-3.5 h-3.5 text-[#2563EB]" />
                Encrypted & Secure
              </span>
            </div>

          </div>
        </div>
      </footer>
      {renderFeedbackModal()}
    </>
  );
}

export default Footer;