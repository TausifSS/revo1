import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, Globe, 
  ChevronDown, ShieldCheck, Star, HeadphonesIcon, 
  Sparkles, User, Smartphone
} from "lucide-react";
import { authService } from "../services/auth.service";
import PhoneAuth from "../components/PhoneAuth";
import logoImage from "../assets/images/logo.png";
import hero1 from "../assets/images/hero1.jpg";
import rivoMascot from "../assets/images/rivo_mascot.jpg";

// Define registration validation schema with Zod
const registerSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters." })
    .max(40, { message: "Name cannot exceed 40 characters." }),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
});

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [language, setLanguage] = useState("English");
  const [toastMsg, setToastMsg] = useState("");
  const [authMethod, setAuthMethod] = useState("email"); // 'email' or 'phone'

  const [roleMode, setRoleMode] = useState("traveller");
  const [businessName, setBusinessName] = useState("");
  const [resortName, setResortName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role");
    if (r === "resort_admin" || r === "host") {
      setRoleMode("business");
    }
    
    // Clear any invalid testing mode tokens on register page load
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.provider) {
        // This is a testing mode token - clear it
        console.log("Clearing old testing mode token");
        authService.logout();
      }
    } catch (error) {
      console.log("Error checking for old tokens:", error);
    }
  }, []);

  // Setup Hook Form
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange"
  });

  const nameVal = watch("name", "") || "";
  const emailVal = watch("email", "") || "";
  const passwordVal = watch("password", "") || "";

  useEffect(() => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode("");
  }, [emailVal]);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-gray-200" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
      case 2:
        return { score: 25, label: "Weak", color: "bg-red-500" };
      case 3:
        return { score: 50, label: "Medium", color: "bg-amber-500" };
      case 4:
        return { score: 75, label: "Strong", color: "bg-blue-500" };
      case 5:
        return { score: 100, label: "Very Strong", color: "bg-emerald-500" };
      default:
        return { score: 0, label: "Empty", color: "bg-gray-200" };
    }
  };

  const strength = getPasswordStrength(passwordVal);

  const handleSendOtp = async () => {
    const email = getValues("email");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setToastMsg("Enter a valid email address before requesting an OTP.");
      return;
    }
    try {
      setIsSendingOtp(true);
      await authService.sendOtp(email);
      setOtpSent(true);
      setOtpVerified(false);
      setOtpCode("");
      setToastMsg("Verification code sent. Check your email.");
    } catch (err) {
      setToastMsg(err.message || "Could not send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setToastMsg("Enter the 6-digit verification code.");
      return;
    }
    try {
      setIsVerifyingOtp(true);
      await authService.verifyOtp(emailVal, otpCode);
      setOtpVerified(true);
      setToastMsg("Email verified. You can now create your account.");
    } catch (err) {
      setOtpVerified(false);
      setToastMsg(err.message || "Verification code is invalid.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (!otpVerified) {
        throw new Error("Verify your email OTP before creating an account.");
      }
      const role = roleMode === "business" ? "ROLE_OWNER" : "ROLE_CUSTOMER";
      await authService.register(data.name, data.email, data.password, otpCode, roleMode === "business" ? ownerPhone : null, role);
      setToastMsg("Account created successfully. Redirecting...");
      setTimeout(() => {
        setToastMsg("");
        navigate(role === "ROLE_OWNER" ? "/partner" : "/dashboard", { replace: true });
      }, 1200);
    } catch (err) {
      // Check if error is due to email already existing
      if (err.message && err.message.includes("already registered")) {
        // Automatically redirect to login page without showing error
        // Pass the email to login page so user doesn't have to re-enter it
        navigate(`/login?email=${encodeURIComponent(data.email)}`, { replace: true });
        return;
      }
      setToastMsg(err.message || "Failed to create account. Please try again.");
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const handlePhoneAuthSuccess = async (phoneAuthData) => {
    try {
      const role = roleMode === "business" ? "ROLE_OWNER" : "ROLE_CUSTOMER";
      const name = getValues("name") || "User";
      
      const result = await authService.registerWithPhone(
        name,
        phoneAuthData.phoneNumber,
        phoneAuthData.firebaseIdToken,
        role
      );
      
      setToastMsg("Account created successfully! Redirecting...");
      setTimeout(() => {
        setToastMsg("");
        navigate(role === "ROLE_OWNER" ? "/partner" : "/dashboard", { replace: true });
      }, 1200);
    } catch (err) {
      // Check if error is due to phone number already existing
      if (err.message && err.message.includes("already registered")) {
        // Automatically redirect to login page without showing error
        // Pass the phone number to login page so user doesn't have to re-enter it
        navigate(`/login?phone=${encodeURIComponent(phoneAuthData.phoneNumber)}`, { replace: true });
        return;
      }
      setToastMsg(err.message || "Phone registration failed. Please try again.");
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const handleSocialAuth = async (provider) => {
    try {
      const role = roleMode === "business" ? "ROLE_OWNER" : "ROLE_CUSTOMER";
      const name = getValues("name") || "User";
      let result;
      
      switch (provider) {
        case 'google':
          result = await authService.registerWithGoogle(name, role);
          break;
        case 'facebook':
          result = await authService.registerWithFacebook(name, role);
          break;
        case 'twitter':
          result = await authService.registerWithTwitter(name, role);
          break;
        default:
          throw new Error('Invalid provider');
      }
      
      // Check for account conflict - just sign in with existing provider
      if (result.accountConflict) {
        try {
          setToastMsg(`Account exists with ${result.existingProvider}. Signing in with that provider...`);
          // Sign in with the existing provider only (don't link)
          const signInResult = await authService.signInForLinking(result.existingProvider);
          
          if (signInResult.success) {
            setToastMsg(`Signed in successfully! Redirecting...`);
            setTimeout(() => {
              setToastMsg("");
              const user = authService.getCurrentUser();
              const finalRole = user?.role || (roleMode === "business" ? "ROLE_OWNER" : "ROLE_CUSTOMER");
              navigate(finalRole === "ROLE_OWNER" ? "/partner" : "/dashboard", { replace: true });
            }, 1500);
          } else {
            throw new Error(signInResult.message || "Failed to sign in with existing provider");
          }
        } catch (error) {
          console.error("Auto-sign-in error:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          // If auto sign-in fails, redirect to login page
          navigate("/login", { replace: true });
          return;
        }
        return;
      }
      
      setToastMsg(`Account created with ${provider.charAt(0).toUpperCase() + provider.slice(1)}! Redirecting...`);
      setTimeout(() => {
        setToastMsg("");
        navigate(role === "ROLE_OWNER" ? "/partner" : "/dashboard", { replace: true });
      }, 1200);
    } catch (err) {
      // Check if error is due to email already existing
      if (err.message && err.message.includes("already registered")) {
        // Automatically redirect to login page without showing error
        navigate("/login", { replace: true });
        return;
      }
      setToastMsg(err.message || `${provider.charAt(0).toUpperCase() + provider.slice(1)} registration failed. Please try again.`);
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  return (
    <div className="h-screen w-screen bg-bg-light flex items-center justify-center font-sans overflow-hidden transition-colors duration-300 p-0 lg:p-6 select-none">
      
      {/* Toast message overlay */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[9999] bg-[#121e1b] text-white border border-[#334155] py-4 px-6 rounded-2xl shadow-2xl flex items-center gap-2.5"
          >
            <Sparkles className="w-4 h-4 text-gold animate-pulse" />
            <span className="text-xs font-bold">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Split Container */}
      <div className="w-full h-full lg:h-[90vh] lg:max-h-[800px] max-w-[1200px] bg-bg-white border border-border-color lg:rounded-[32px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row">
        
        {/* LEFT COLUMN: HERO PANEL */}
        <div className="relative w-full lg:w-[45%] h-[280px] lg:h-full bg-slate-900 text-white p-6 lg:p-10 hidden lg:flex flex-col justify-between shrink-0 overflow-hidden">
          {/* Background Image overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={hero1} 
              alt="Luxury Pool Beachfront Resort" 
              className="w-full h-full object-cover filter brightness-[0.85]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/70 z-10" />
          </div>

          {/* Logo & Brand Name */}
          <Link to="/" className="relative z-20 flex items-center gap-2.5 no-underline group select-none shrink-0">
            <img 
              src={logoImage} 
              alt="Reservo Logo" 
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
            <span className="text-[22px] font-extrabold tracking-[0.5px] text-white font-serif leading-none transition-colors duration-300">
              Reservo
            </span>
          </Link>

          {/* Hero text descriptor */}
          <div className="relative z-20 space-y-3 max-w-[380px] hidden lg:block">
            <h1 className="text-3xl lg:text-4.5xl font-serif font-bold leading-[1.1] tracking-tight">Start Your Journey</h1>
            <div className="w-12 h-0.5 bg-gold" />
            <p className="text-[12px] text-white/80 leading-relaxed font-semibold">
              Create an account to unlock amazing stays, personalized trip planning with RIVO AI, exclusive rewards and more.
            </p>
          </div>

          {/* Rivo overlay card & Trust points */}
          <div className="relative z-20 space-y-5 hidden lg:block">
            {/* Rivo Overlay */}
            <div className="bg-[#0e1624]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-white/20">
                <img src={rivoMascot} alt="Rivo Mascot" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-[12px] font-bold text-white">Hi, I'm RIVO 👋</h4>
                <p className="text-[9.5px] text-[#94A3B8] leading-normal mt-0.5">Your AI Travel Buddy. I'll help you plan the perfect trip just for you!</p>
              </div>
            </div>

            {/* Trust points */}
            <div className="grid grid-cols-3 gap-2 text-center border-t border-white/10 pt-4 text-[9px] text-white/80 font-medium">
              <div className="space-y-1">
                <ShieldCheck className="w-3.5 h-3.5 mx-auto text-gold" />
                <strong className="block text-white">Secure & Safe</strong>
                <span className="text-white/50 block text-[7.5px] leading-tight">Data protected by top security</span>
              </div>
              <div className="space-y-1 border-x border-white/10">
                <HeadphonesIcon className="w-3.5 h-3.5 mx-auto text-gold" />
                <strong className="block text-white">24/7 Support</strong>
                <span className="text-white/50 block text-[7.5px] leading-tight">We are here for you anytime</span>
              </div>
              <div className="space-y-1">
                <Star className="w-3.5 h-3.5 mx-auto text-gold fill-current" />
                <strong className="block text-white">Best Price</strong>
                <span className="text-white/50 block text-[7.5px] leading-tight">Get the best deals or match</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INPUT FORM */}
        <div className="w-full lg:flex-1 h-0 lg:h-full flex-grow bg-bg-white p-6 lg:p-10 flex flex-col justify-between items-center relative overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* Top Actions: Language Selector */}
          <div className="self-end relative shrink-0">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border-color rounded-full bg-bg-white text-text-dark text-[10px] font-bold cursor-pointer hover:border-primary transition"
            >
              <Globe className="w-3 h-3 text-text-gray" />
              <span>{language}</span>
              <ChevronDown className="w-2.5 h-2.5 text-text-gray" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-9 bg-bg-white border border-border-color rounded-xl shadow-lg p-1 w-26 z-50 text-[10px] font-semibold text-text-dark animate-fade-in">
                {["English", "Hindi"].map(lang => (
                  <button 
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setShowLangMenu(false);
                    }}
                    className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-bg-light bg-transparent border-none cursor-pointer text-text-dark"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-[360px] w-full my-auto py-2 space-y-4">
            <div className="space-y-0.5">
              <h1 className="text-2xl lg:text-3xl font-serif font-extrabold text-text-dark">
                {roleMode === "business" ? "Partner Registration" : "Create Account"}
              </h1>
              <p className="text-[11.5px] text-text-gray font-semibold">
                {roleMode === "business" ? "Register your hotel or resort company on Reservo" : "Sign up to begin your journey"}
              </p>
            </div>

            {/* Auth Method Toggle */}
            <div className="flex bg-bg-light rounded-xl p-1 border border-border-color">
              <button
                type="button"
                onClick={() => setAuthMethod("email")}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  authMethod === "email"
                    ? "bg-bg-white text-primary border border-border-color shadow-sm"
                    : "text-text-gray hover:text-text-dark"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod("phone")}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  authMethod === "phone"
                    ? "bg-bg-white text-primary border border-border-color shadow-sm"
                    : "text-text-gray hover:text-text-dark"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Phone
              </button>
            </div>

            {/* Email Registration Form */}
            {authMethod === "email" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {/* Business Partner Mode Fields */}
                {roleMode === "business" && (
                  <div className="space-y-3 border-b border-border-color pb-3 animate-in fade-in duration-200 text-left">
                    <div className="space-y-1 flex flex-col relative">
                      <label className="text-[9.5px] font-bold text-text-gray uppercase tracking-wider block w-full text-left ml-1">Contact Phone *</label>
                      <input 
                        type="tel" 
                        required
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-4 py-2 bg-bg-light border border-border-color text-text-dark rounded-xl text-[11.5px] font-semibold outline-none focus:border-primary transition"
                      />
                    </div>
                  </div>
                )}
              
              {/* Full Name with Character Counter */}
              <div className="space-y-1 flex flex-col relative">
                <div className="flex justify-between items-center w-full">
                  <label htmlFor="nameInput" className="text-[9.5px] font-bold text-text-gray uppercase tracking-wider block text-left ml-1">Full Name</label>
                  <span className="text-[9px] text-text-gray font-semibold">{nameVal.length}/40</span>
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray" />
                  <input 
                    id="nameInput"
                    type="text" 
                    placeholder="Enter your full name"
                    {...register("name")}
                    className={`w-full pl-10 pr-4 py-2.5 bg-bg-light border ${
                      errors.name ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]" : "border-border-color focus:border-primary focus:shadow-[0_0_0_2px_rgba(13,71,161,0.1)]"
                    } text-text-dark rounded-xl text-[11.5px] font-semibold outline-none transition-all duration-300`}
                  />
                </div>
                <AnimatePresence>
                  {errors.name && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10.5px] text-red-500 font-bold mt-1 ml-1"
                    >
                      {errors.name.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Email Address */}
              <div className="space-y-1 flex flex-col relative">
                <label htmlFor="emailInput" className="text-[9.5px] font-bold text-text-gray uppercase tracking-wider block w-full text-left ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray" />
                  <input 
                    id="emailInput"
                    type="email" 
                    placeholder="Enter your email address"
                    {...register("email")}
                    className={`w-full pl-10 pr-4 py-2.5 bg-bg-light border ${
                      errors.email ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]" : "border-border-color focus:border-primary focus:shadow-[0_0_0_2px_rgba(13,71,161,0.1)]"
                    } text-text-dark rounded-xl text-[11.5px] font-semibold outline-none transition-all duration-300`}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10.5px] text-red-500 font-bold mt-1 ml-1"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Email verification */}
              <div className="space-y-2 rounded-xl border border-border-color bg-bg-light p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-gray ml-1">Email verification</span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="rounded-lg border-none bg-primary px-3 py-1.5 text-[9px] font-bold text-white disabled:cursor-not-allowed disabled:bg-border-color disabled:text-text-gray disabled:opacity-60"
                  >
                    {isSendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
                {otpSent && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(event) => {
                        setOtpCode(event.target.value.replace(/\D/g, ""));
                        setOtpVerified(false);
                      }}
                      placeholder="6-digit OTP"
                      className="min-w-0 flex-1 rounded-lg border border-border-color bg-bg-light text-text-dark px-3 py-2 text-[11px] font-semibold outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="rounded-lg border border-primary bg-bg-light px-3 py-1.5 text-[9px] font-bold text-primary disabled:cursor-not-allowed disabled:border-border-color disabled:text-text-gray disabled:opacity-60"
                    >
                      {isVerifyingOtp ? "Checking..." : otpVerified ? "Verified" : "Verify"}
                    </button>
                  </div>
                )}
              </div>

              {/* Password & Strength Meter */}
              <div className="space-y-1 flex flex-col relative">
                <label htmlFor="passwordInput" className="text-[9.5px] font-bold text-text-gray uppercase tracking-wider block w-full text-left ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray" />
                  <input 
                    id="passwordInput"
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password"
                    {...register("password")}
                    className={`w-full pl-10 pr-10 py-2.5 bg-bg-light border ${
                      errors.password ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]" : "border-border-color focus:border-primary focus:shadow-[0_0_0_2px_rgba(13,71,161,0.1)]"
                    } text-text-dark rounded-xl text-[11.5px] font-semibold outline-none transition-all duration-300`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-gray hover:text-text-dark bg-transparent border-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Strength Meter Bar */}
                {passwordVal && (
                  <div className="mt-2 space-y-1 animate-fade-in">
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase text-text-gray">
                      <span>Password Strength:</span>
                      <span className={errors.password ? "text-red-500" : "text-emerald-500"}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${strength.color}`} 
                        initial={{ width: 0 }}
                        animate={{ width: `${strength.score}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10.5px] text-red-500 font-bold mt-1 ml-1"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Action */}
              <button 
                type="submit"
                disabled={isSubmitting || !isValid || !otpVerified}
                className={`w-full py-2.5 font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow cursor-pointer border-none flex items-center justify-center gap-1.5 transition-all duration-300 ${
                  isSubmitting || !isValid || !otpVerified
                    ? "bg-border-color text-text-gray opacity-60 cursor-not-allowed shadow-none" 
                    : "bg-primary hover:bg-primary-dark text-white"
                }`}
              >
                {isSubmitting ? "Creating Account..." : <>Sign Up <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </form>
            )}

            {/* Phone Registration Form */}
            {authMethod === "phone" && (
              <div className="space-y-3">
                {/* Full Name - required for phone registration */}
                <div className="space-y-1 flex flex-col relative">
                  <div className="flex justify-between items-center w-full">
                    <label htmlFor="phoneNameInput" className="text-[9.5px] font-bold text-text-gray uppercase tracking-wider block text-left ml-1">Full Name</label>
                    <span className="text-[9px] text-text-gray font-semibold">{nameVal.length}/40</span>
                  </div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray" />
                    <input 
                      id="phoneNameInput"
                      type="text" 
                      placeholder="Enter your full name"
                      {...register("name")}
                      className={`w-full pl-10 pr-4 py-2.5 bg-bg-light border ${
                        errors.name ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]" : "border-border-color focus:border-primary focus:shadow-[0_0_0_2px_rgba(13,71,161,0.1)]"
                      } text-text-dark rounded-xl text-[11.5px] font-semibold outline-none transition-all duration-300`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10.5px] text-red-500 font-bold mt-1 ml-1"
                      >
                        {errors.name.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Phone Auth Component */}
                <PhoneAuth 
                  mode="register"
                  onAuthSuccess={handlePhoneAuthSuccess}
                  role={roleMode === "business" ? "ROLE_OWNER" : "ROLE_CUSTOMER"}
                  name={nameVal}
                />
              </div>
            )}

            {/* Social Connects - always available as alternative */}
            {authMethod === "email" && (
              <>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-border-color"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-text-gray font-bold uppercase tracking-wider">or continue with</span>
                  <div className="flex-grow border-t border-border-color"></div>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full">
              <button 
                type="button"
                onClick={() => handleSocialAuth('google')}
                className="py-1.5 bg-bg-white border border-border-color hover:bg-bg-light rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300"
                title="Continue with Google"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => handleSocialAuth('facebook')}
                className="py-1.5 bg-bg-white border border-border-color hover:bg-bg-light rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300"
                title="Continue with Facebook"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => handleSocialAuth('twitter')}
                className="py-1.5 bg-bg-white border border-border-color hover:bg-bg-light rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300"
                title="Continue with X (Twitter)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" className="text-text-dark fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
            </div>
              </>
            )}

            {/* Bottom link toggle */}
            <div className="text-center text-[11px] font-semibold text-text-gray py-0.5">
              <span>Already have an account?</span>{" "}
              <button 
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
              >
                Sign In
              </button>
            </div>



          </div>

          {/* Bottom Copyright info */}
          <div className="text-[9px] text-text-gray font-bold shrink-0 mt-2">
            © 2026 Reservo. All rights reserved.
          </div>

        </div>

      </div>   
    </div>
  );
}
