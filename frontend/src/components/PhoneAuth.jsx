import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import firebasePhoneService from "../services/firebase.service";

const PhoneAuth = ({ mode = "login", onAuthSuccess, role = "ROLE_CUSTOMER", name = "", initialPhoneNumber = "" }) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [firebaseResult, setFirebaseResult] = useState(null);
  
  const recaptchaContainerRef = useRef(null);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);

  // Update phone number when initialPhoneNumber prop changes
  useEffect(() => {
    if (initialPhoneNumber && !phoneNumber) {
      setPhoneNumber(initialPhoneNumber);
    }
  }, [initialPhoneNumber]);

  useEffect(() => {
    // Check if Firebase is configured
    setIsFirebaseConfigured(firebasePhoneService.isInitialized());

    // Initialize invisible reCAPTCHA when component mounts
    const initializeRecaptcha = () => {
      try {
        if (firebasePhoneService.isInitialized()) {
          firebasePhoneService.initializeRecaptcha('recaptcha-container', true);
        }
      } catch (error) {
        console.error('Failed to initialize reCAPTCHA:', error);
      }
    };

    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(initializeRecaptcha, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup reCAPTCHA when component unmounts
      try {
        firebasePhoneService.clearRecaptcha();
      } catch (error) {
        console.error('Failed to clear reCAPTCHA:', error);
      }
    };
  }, []);

  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters
    let cleaned = value.replace(/\D/g, '');
    
    // If user didn't enter country code, assume India (+91)
    if (cleaned.length === 10 && !value.includes('+')) {
      cleaned = '91' + cleaned;
    }
    
    // Add + if not present
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Format based on country code
    if (cleaned.startsWith('91')) {
      // Indian phone number format: +91 XXXXX XXXXX
      if (cleaned.length <= 2) return '+' + cleaned;
      if (cleaned.length <= 7) return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    
    // Generic international format
    if (cleaned.length <= 3) return '+' + cleaned;
    if (cleaned.length <= 6) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setOtpSent(false);
    setOtpCode("");
    setFirebaseResult(null);
  };

  const handleSendOtp = async () => {
    console.log("=== Send OTP clicked ===");
    console.log("Phone number:", phoneNumber);
    console.log("Firebase configured:", firebasePhoneService.isInitialized());
    
    // Check if Firebase is initialized
    if (!firebasePhoneService.isInitialized()) {
      console.log("Firebase not configured!");
      setToastMsg("Firebase is not configured. Please set up Firebase configuration first.");
      return;
    }

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    console.log("Cleaned phone:", cleanedPhone);
    
    // Validate phone number length (Indian numbers: 10 digits + 91 country code = 12 digits)
    if (cleanedPhone.length < 10) {
      console.log("Phone number too short");
      setToastMsg("Please enter a valid phone number (10 digits for India)");
      return;
    }
    
    // For Indian numbers, ensure proper format
    if (cleanedPhone.length === 10) {
      // Auto-add +91 for Indian numbers
      setPhoneNumber("+91 " + cleanedPhone.slice(0, 5) + " " + cleanedPhone.slice(5));
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) {
      // Handle numbers starting with 0 (like 09876543210)
      setPhoneNumber("+91 " + cleanedPhone.slice(1, 6) + " " + cleanedPhone.slice(6));
    }

    try {
      setIsSendingOtp(true);
      console.log("Calling Firebase sendOtp...");
      const result = await firebasePhoneService.sendOtp(phoneNumber, 'recaptcha-container');
      console.log("Firebase result:", result);
      
      if (result.success) {
        setOtpSent(true);
        setToastMsg("OTP sent successfully to your phone");
        console.log("OTP sent successfully");
      } else {
        setToastMsg(result.message);
        console.log("OTP send failed:", result.message);
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      setToastMsg("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    // Check if Firebase is initialized
    if (!firebasePhoneService.isInitialized()) {
      setToastMsg("Firebase is not configured. Please set up Firebase configuration first.");
      return;
    }

    if (otpCode.length !== 6) {
      setToastMsg("Please enter the 6-digit OTP code");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const result = await firebasePhoneService.verifyOtp(otpCode);
      
      if (result.success) {
        setFirebaseResult(result);
        setToastMsg("Phone verified successfully!");
        
        // Call the success callback with Firebase token
        if (onAuthSuccess) {
          await onAuthSuccess({
            phoneNumber: result.phoneNumber,
            firebaseIdToken: result.idToken,
            uid: result.uid
          });
        }
      } else {
        setToastMsg(result.message);
      }
    } catch (error) {
      setToastMsg("OTP verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpSent(false);
    setOtpCode("");
    setFirebaseResult(null);
    await handleSendOtp();
  };

  return (
    <div className="space-y-3">
      {/* Firebase configuration warning */}
      {!isFirebaseConfigured && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-semibold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200"
        >
          <strong>Firebase not configured:</strong> Phone authentication requires Firebase setup. Please configure Firebase credentials to enable this feature.
        </motion.div>
      )}

      {/* Toast message */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-[10px] font-semibold px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Number Input */}
      <div className="space-y-1 flex flex-col relative">
        <label className="text-[9.5px] font-bold text-text-gray uppercase tracking-wider block w-full text-left ml-1">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray" />
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={otpSent}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-light border border-border-color text-text-dark rounded-xl text-[11.5px] font-semibold outline-none focus:border-primary transition disabled:opacity-60"
          />
        </div>
      </div>

      {/* Phone verification - matches Email form style */}
      <div className="space-y-2 rounded-xl border border-border-color bg-bg-light p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-gray ml-1">Phone verification</span>
          <button
            type="button"
            onClick={otpSent ? handleResendOtp : handleSendOtp}
            disabled={!isFirebaseConfigured || isSendingOtp || phoneNumber.replace(/\D/g, "").length < 10}
            className="rounded-lg border-none bg-primary px-3 py-1.5 text-[9px] font-bold text-white disabled:cursor-not-allowed disabled:bg-border-color disabled:text-text-gray disabled:opacity-60"
          >
            {isSendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
          </button>
        </div>
        {otpSent && !firebaseResult && (
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit OTP"
              className="min-w-0 flex-1 rounded-lg border border-border-color bg-bg-light text-text-dark px-3 py-2 text-[11px] font-semibold outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp || otpCode.length !== 6}
              className="rounded-lg border-primary bg-bg-light px-3 py-1.5 text-[9px] font-bold text-primary disabled:cursor-not-allowed disabled:border-border-color disabled:text-text-gray disabled:opacity-60"
            >
              {isVerifyingOtp ? "Checking..." : "Verify"}
            </button>
          </div>
        )}
      </div>

      {/* Success State */}
      {firebaseResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span className="text-[10px] font-semibold text-green-700">
            Phone verified successfully! Proceeding...
          </span>
        </motion.div>
      )}

      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} className="hidden" />
    </div>
  );
};

export default PhoneAuth;