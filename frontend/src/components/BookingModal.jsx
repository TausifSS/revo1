import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Sparkles, QrCode, ArrowLeft, ArrowRight, Upload, ShieldAlert, Check, Calendar, Users, DollarSign, Gift, BadgePercent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/booking.service';
import { rewardService } from '../services/reward.service';
import { authService } from '../services/auth.service';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../services/apiClient';
import { secureStorage } from '../services/secureStorage';
import rivoConfirmed from '../assets/images/rivo_confirmed.png';

export default function BookingModal({ resort, room, bookingDates, bookingGuests, checkInDate: propCheckIn, checkOutDate: propCheckOut, isDarkMode, onClose, onAskRivo }) {
  const toast = useToast();
  const navigate = useNavigate();

  // Retrieve dates from props or saved search state
  const getModalDates = () => {
    try {
      const passedCheckIn = bookingDates?.checkIn || propCheckIn;
      const passedCheckOut = bookingDates?.checkOut || propCheckOut;
      if (passedCheckIn && passedCheckOut) {
        return { checkIn: passedCheckIn, checkOut: passedCheckOut };
      }
      const saved = sessionStorage.getItem("reservo_search_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.checkInDate && parsed.checkOutDate) {
          return { checkIn: parsed.checkInDate, checkOut: parsed.checkOutDate };
        }
      }
    } catch (e) {}
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const d3 = new Date();
    d3.setDate(d3.getDate() + 3);
    const d3Str = d3.toISOString().split("T")[0];
    return { checkIn: todayStr, checkOut: d3Str };
  };

  const { checkIn: modalCheckIn, checkOut: modalCheckOut } = getModalDates();

  const getModalGuests = () => {
    try {
      if (bookingGuests) return bookingGuests;
      const saved = sessionStorage.getItem("reservo_search_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          adults: Math.max(1, Number(parsed.guestCount ?? 2)),
          children: Math.max(0, Number(parsed.childCount ?? 0)),
          roomsCount: Math.max(1, Number(parsed.roomCount ?? 1))
        };
      }
    } catch (e) {}
    return { adults: 2, children: 0, roomsCount: 1 };
  };

  const modalGuests = getModalGuests();
  const adultsCount = Math.max(1, Number(modalGuests.adults ?? 2));
  const childrenCount = Math.max(0, Number(modalGuests.children ?? 0));
  const roomsCount = Math.max(
    1,
    Number(modalGuests.roomsCount ?? 1),
    Math.ceil(adultsCount / 2),
    Math.ceil(childrenCount / 2)
  );

  const calculateNights = (startStr, endStr) => {
    try {
      const d1 = new Date(startStr + "T00:00:00");
      const d2 = new Date(endStr + "T00:00:00");
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch (e) {
      return 3;
    }
  };

  const nights = calculateNights(modalCheckIn, modalCheckOut);

  const formatDateRangeLabel = (startStr, endStr) => {
    try {
      const parseDate = (str) => {
        const parts = str.split("-");
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      };
      const d1 = parseDate(startStr);
      const d2 = parseDate(endStr);
      const f1 = d1.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const f2 = d2.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      return `${f1} - ${f2} (${nights} Night${nights !== 1 ? "s" : ""})`;
    } catch (e) {
      return `${startStr} - ${endStr} (${nights} Nights)`;
    }
  };

  // Wizard Steps:
  // 1: Guest Info (Booking for self vs other)
  // 2: KYC Identity Verification
  // 3: Coupon & Rewards Point Redemption
  // 4: Summary & Checkout
  // 5: Booking Confirmation Pass
  const [wizardStep, setWizardStep] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedBookingCode, setConfirmedBookingCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User details & points
  const [currentUser, setCurrentUser] = useState(null);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [kycStatus, setKycStatus] = useState("UNVERIFIED");

  // Guest Details state (Step 1)
  const [isBookingForSelf, setIsBookingForSelf] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // KYC state (Step 2)
  const [kycDocType, setKycDocType] = useState("Aadhaar");
  const [kycFileSelected, setKycFileSelected] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);

  // Rewards/Coupons state (Step 3)
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscountVal, setCouponDiscountVal] = useState(0);
  const [couponDiscountType, setCouponDiscountType] = useState("PERCENTAGE");
  const [calculatedCouponDiscount, setCalculatedCouponDiscount] = useState(0);

  const [redeemPointsChecked, setRedeemPointsChecked] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Currency Converter states
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [exchangeRate, setExchangeRate] = useState(1);

  useEffect(() => {
    const handleStorage = () => {
      const cur = localStorage.getItem("reservo-currency") || "en_inr";
      if (cur === "en_usd") {
        setCurrencySymbol("$");
        setExchangeRate(0.012);
      } else {
        setCurrencySymbol("₹");
        setExchangeRate(1);
      }
    };
    handleStorage();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Fetch initial profile & loyalty details
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setKycStatus(user.kycStatus || "UNVERIFIED");
      }
      rewardService.getRewardStatus()
        .then(data => {
          setPointsBalance(data.points || 0);
        })
        .catch(err => console.warn("Failed to load rewards stats", err));
    }
  }, []);

  // Pricing is intentionally simple: nightly rate × nights × rooms.
  // There are no cleaning, luxury, service, or tax charges.
  const toFiniteNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  };

  const basePrice = toFiniteNumber(
    resort?.pricePerNight ?? resort?.price,
    toFiniteNumber(room?.pricePerNight ?? room?.price, 0)
  );
  const subtotal = basePrice * nights * roomsCount;
  const totalBeforeDiscount = subtotal;

  // Coupon discount calculation
  useEffect(() => {
    if (couponApplied) {
      if (couponDiscountType === "PERCENTAGE") {
        setCalculatedCouponDiscount(Math.round(totalBeforeDiscount * (couponDiscountVal / 100)));
      } else {
        setCalculatedCouponDiscount(
          Math.min(Math.round(couponDiscountVal), Math.round(totalBeforeDiscount))
        );
      }
    } else {
      setCalculatedCouponDiscount(0);
    }
  }, [couponApplied, couponDiscountVal, couponDiscountType, totalBeforeDiscount]);

  // Points conversion (10 points = 1 INR)
  const maxRedeemablePoints = Math.max(
    0,
    Math.min(
      toFiniteNumber(pointsBalance),
      Math.round(Math.max(0, totalBeforeDiscount - calculatedCouponDiscount) * 0.5 * 10)
    )
  );
  
  const requestedPointsDiscount = redeemPointsChecked
    ? Math.max(0, Math.round(toFiniteNumber(pointsToRedeem) / 10))
    : 0;
  const maxPointsDiscount = Math.max(
    0,
    Math.min(
      requestedPointsDiscount,
      Math.floor(Math.max(0, totalBeforeDiscount - calculatedCouponDiscount) * 0.5)
    )
  );
  const pointsDiscountValue = maxPointsDiscount;
  const grandTotal = Math.max(
    0,
    totalBeforeDiscount - calculatedCouponDiscount - pointsDiscountValue
  );

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!authService.isAuthenticated()) {
        toast("Please log in to continue booking your stay.", "error");
        navigate("/login");
        onClose();
        return;
      }
      if (!isBookingForSelf && (!guestName.trim() || !guestPhone.trim())) {
        toast("Please enter the guest's name and phone number.", "error");
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      const isKycRequired = totalBeforeDiscount > 50000 && kycStatus !== "VERIFIED";
      if (isKycRequired) {
        toast("Please complete identity verification to proceed with this high-value booking.", "error");
        return;
      }
      setWizardStep(3);
    } else if (wizardStep === 3) {
      setWizardStep(4);
    }
  };

  const handlePrevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  // KYC Verification mockup call
  const handleVerifyKyc = async () => {
    if (!kycFileSelected) {
      toast("Please select a file scan to upload.", "error");
      return;
    }
    setKycLoading(true);
    try {
      const result = await apiClient.post("/api/v1/user/verify-kyc", {
        documentType: kycDocType,
        documentUrl: "mock://kyc-document-scan-uploaded"
      });
      if (result && result.success) {
        setKycStatus("VERIFIED");
        // Update user state locally
        const user = authService.getCurrentUser();
        if (user) {
          user.kycStatus = "VERIFIED";
          user.kycDocumentType = kycDocType;
          user.kycDocumentUrl = "mock://kyc-document-scan-uploaded";
          secureStorage.setItem("reservo_user", user);
        }
        toast("Identity verification completed successfully!", "success");
      }
    } catch (e) {
      toast(e.message || "Identity verification failed.", "error");
    } finally {
      setKycLoading(false);
    }
  };

  // Apply Promo Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const resp = await rewardService.validateCoupon(
        couponCode.trim(), 
        resort.id, 
        totalBeforeDiscount
      );
      setCouponDiscountVal(resp.discountValue);
      setCouponDiscountType(resp.discountType);
      setCouponApplied(true);
      toast(`Coupon applied! ${resp.discountType === "PERCENTAGE" ? `${resp.discountValue}%` : `₹${resp.discountValue}`} discount applied.`, "success");
    } catch (e) {
      toast(e.message || "Invalid coupon code.", "error");
      setCouponDiscountVal(0);
      setCouponApplied(false);
    } finally {
      setCouponLoading(false);
    }
  };

  // Checkout call
  const handleCheckout = async () => {
    if (Math.round(grandTotal * 100) !== 0) {
      toast("Payment module not implemented yet. Your booking was not created.", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Re-check availability at the last step as a race-condition safeguard.
      // The primary availability check already happens when the user clicks
      // "Check Availability".
      await bookingService.checkAvailability(
        resort.id,
        { checkIn: modalCheckIn, checkOut: modalCheckOut },
        { adults: adultsCount, children: childrenCount, roomsCount }
      );

      const bookingDetails = {
        resortId: resort.id,
        roomId: room?.id || null,
        checkin: modalCheckIn,
        checkout: modalCheckOut,
        total: grandTotal,
        adults: adultsCount,
        children: childrenCount,
        roomsCount,
        couponCode: couponApplied ? couponCode.trim().toUpperCase() : undefined,
        discountAmount: calculatedCouponDiscount,
        pointsToRedeem: redeemPointsChecked ? pointsToRedeem : 0,
        pointsValue: pointsDiscountValue,
        guestName: isBookingForSelf ? undefined : guestName,
        guestPhone: isBookingForSelf ? undefined : guestPhone
      };

      const result = await bookingService.createCheckoutSession(bookingDetails);
      const url = new URL(result);
      const bCode = url.searchParams.get("bookingCode") || `RES-${Math.floor(100000 + Math.random() * 900000)}`;

      setConfirmedBookingCode(bCode);
      setIsConfirmed(true);
      setWizardStep(5);
      toast(`Booking confirmed! Pass Code: ${bCode}`, "success");
    } catch (e) {
      console.error("Checkout failure:", e);
      toast(e.message || "Failed to confirm booking. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const isKycRequired = totalBeforeDiscount > 50000 && kycStatus !== "VERIFIED";

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className={`rounded-3xl max-w-xl w-full border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDarkMode ? 'bg-[#1E293B] border-[#334155] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
        }`}
      >
        {/* Header */}
        <div className="bg-[#2563EB] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {wizardStep > 1 && wizardStep < 5 && (
              <button 
                onClick={handlePrevStep}
                className="p-1 rounded-full hover:bg-white/20 text-white border-none bg-transparent cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="text-[10px] font-bold text-sky-200 uppercase tracking-widest">
                {wizardStep === 5 ? "RESERVATION CONFIRMED" : `Step ${wizardStep} of 4: Booking Details`}
              </div>
              <h3 className="text-base font-extrabold text-white mt-0.5">{resort.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* STEP 1: Guest Information */}
          {wizardStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b pb-3 border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-1.5"><Users size={16} /> Guest Information</h4>
                <p className="text-[11px] text-stone-400 mt-1">Review guest information for your reservation</p>
              </div>

              {/* Toggle Booking For */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookingForSelf(true)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isBookingForSelf
                      ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB]'
                      : isDarkMode ? 'bg-[#111827] border-[#334155] text-stone-400' : 'bg-[#F8FAFC] border-[#E2E8F0] text-stone-600'
                  }`}
                >
                  ✓ Book for Myself
                </button>
                <button
                  type="button"
                  onClick={() => setIsBookingForSelf(false)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    !isBookingForSelf
                      ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB]'
                      : isDarkMode ? 'bg-[#111827] border-[#334155] text-stone-400' : 'bg-[#F8FAFC] border-[#E2E8F0] text-stone-600'
                  }`}
                >
                  👥 Book for Someone Else
                </button>
              </div>

              {isBookingForSelf ? (
                /* Pre-filled Logged In Info */
                <div className={`p-4 rounded-xl border text-xs space-y-3 ${isDarkMode ? 'bg-[#111827] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Account Name:</span>
                    <span className="font-semibold">{currentUser?.name || "Guest User"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Account Email:</span>
                    <span className="font-semibold">{currentUser?.email || "guest@mail.in"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Contact Phone:</span>
                    <span className="font-semibold">{currentUser?.phone || "+91 98765 43210"}</span>
                  </div>
                  <div className="text-[10px] text-[#2563EB] font-bold text-right">✓ Contact details linked from profile</div>
                </div>
              ) : (
                /* Custom Guest Input Form */
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 mb-1.5 uppercase tracking-wide">Guest Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Sharma"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className={`w-full p-3 text-xs rounded-xl border bg-transparent font-semibold outline-none ${
                        isDarkMode ? 'border-[#334155] focus:border-[#2563EB]' : 'border-[#E2E8F0] focus:border-[#2563EB]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 mb-1.5 uppercase tracking-wide">Guest Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +91 99999 88888"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className={`w-full p-3 text-xs rounded-xl border bg-transparent font-semibold outline-none ${
                        isDarkMode ? 'border-[#334155] focus:border-[#2563EB]' : 'border-[#E2E8F0] focus:border-[#2563EB]'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Resort Overview Card */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-[#111827]/40 border-[#334155]' : 'bg-[#F8FAFC]/40 border-[#E2E8F0]'}`}>
                <div className="space-y-1">
                  <div className="text-[10px] text-primary font-bold uppercase">Suite selection</div>
                  <div className="text-xs font-bold">{room ? room.title : "Luxury Suite"}</div>
                  <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
                    <Calendar size={12} /> {formatDateRangeLabel(modalCheckIn, modalCheckOut)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-stone-400 uppercase">Subtotal</div>
                  <div className="text-sm font-bold text-primary">
                    {currencySymbol}{(Math.round(totalBeforeDiscount * exchangeRate)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Identity Verification (KYC) */}
          {wizardStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b pb-3 border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-1.5"><ShieldAlert size={16} /> Guest Verification</h4>
                <p className="text-[11px] text-stone-400 mt-1">Platform trust & security verification guidelines</p>
              </div>

              {isKycRequired ? (
                /* KYC Upload Flow */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                      <ShieldAlert className="w-4.5 h-4.5 text-amber-500" /> Dynamic KYC Verification Required
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-amber-700 dark:text-amber-400">
                      Reservo triggers identity checks for high-value reservations exceeding **₹50,000**. Upload a copy of your Government Photo ID to confirm your booking request.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wide">Document Type</label>
                      <select
                        value={kycDocType}
                        onChange={(e) => setKycDocType(e.target.value)}
                        className={`w-full p-2.5 text-xs rounded-xl border bg-transparent font-bold outline-none ${
                          isDarkMode ? 'border-[#334155] focus:border-[#2563EB] bg-[#1E293B]' : 'border-[#E2E8F0] focus:border-[#2563EB]'
                        }`}
                      >
                        <option value="Aadhaar">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="PAN">PAN Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wide">Upload ID Copy</label>
                      <label className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition border-dashed hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        kycFileSelected ? 'border-[#22C55E] text-[#22C55E]' : 'border-stone-300 text-stone-500'
                      }`}>
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={() => setKycFileSelected(true)}
                          className="hidden" 
                        />
                        {kycFileSelected ? (
                          <><Check size={14} /> ID Selected</>
                        ) : (
                          <><Upload size={14} /> Choose File</>
                        )}
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyKyc}
                    disabled={!kycFileSelected || kycLoading}
                    className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-stone-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {kycLoading ? "Verifying Document..." : "Verify & Approve Document"}
                  </button>
                </div>
              ) : (
                /* Auto-approved / Standard Verification */
                <div className="py-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#22C55E] flex items-center justify-center border border-emerald-200 dark:border-emerald-900/50">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-[#22C55E]">✓ Identity Check Passed</h5>
                    <p className="text-[11.5px] text-stone-400 mt-1 max-w-sm">
                      Your stay value is within the standard verification limit, or you have already verified your account ID. No document uploads are required at this time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Coupons & Rewards */}
          {wizardStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b pb-3 border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-1.5"><Gift size={16} /> Promo Code & Loyalty Points</h4>
                <p className="text-[11px] text-stone-400 mt-1">Apply platforms rewards or promo codes to deduct stay prices</p>
              </div>

              {/* Promo Coupon Entry */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wide">Do you have a Coupon Code?</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. WELCOME10, AZURE20" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={couponApplied || couponLoading}
                    className={`flex-grow p-3 text-xs rounded-xl border bg-transparent font-bold uppercase tracking-wider outline-none ${
                      isDarkMode 
                        ? 'border-[#334155] focus:border-[#2563EB] text-[#F8FAFC]' 
                        : 'border-[#E2E8F0] focus:border-[#2563EB] text-[#0F172A]'
                    }`}
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={couponApplied || !couponCode.trim() || couponLoading}
                    className="px-5 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-stone-400 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition"
                  >
                    {couponLoading ? "Checking..." : couponApplied ? "Applied" : "Apply"}
                  </button>
                </div>
                {couponApplied && (
                  <div className="flex items-center justify-between text-[11px] text-[#10B981] font-semibold">
                    <span>✓ Coupon Applied Successfully!</span>
                    <button 
                      onClick={() => { setCouponApplied(false); setCouponCode(""); }} 
                      className="bg-transparent border-none text-red-500 cursor-pointer font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Loyalty Reward Points */}
              <div className={`p-4 rounded-xl border space-y-3.5 ${isDarkMode ? 'bg-[#111827] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="redeemPoints" 
                      checked={redeemPointsChecked} 
                      onChange={(e) => {
                        setRedeemPointsChecked(e.target.checked);
                        if (e.target.checked && pointsToRedeem === 0) {
                          setPointsToRedeem(maxRedeemablePoints);
                        }
                      }}
                      className="w-4 h-4 cursor-pointer accent-[#2563EB]"
                    />
                    <label htmlFor="redeemPoints" className="text-xs font-bold cursor-pointer">Redeem Reservo Points</label>
                  </div>
                  <span className="text-[10px] bg-sky-100 text-primary dark:bg-sky-950/40 px-2 py-0.5 rounded-full font-bold">
                    Balance: {pointsBalance.toLocaleString()} pts
                  </span>
                </div>

                {redeemPointsChecked && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>Points to redeem (10 pts = ₹1):</span>
                      <span className="font-bold text-stone-200">{pointsToRedeem.toLocaleString()} pts</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max={maxRedeemablePoints}
                      step="10"
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(parseInt(e.target.value, 10))}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>0 pts</span>
                      <span className="text-primary font-bold">-{currencySymbol}{(Math.round(pointsDiscountValue * exchangeRate)).toLocaleString()} off</span>
                      <span>{maxRedeemablePoints.toLocaleString()} pts (Max)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Summary & Verified Mock Checkout */}
          {wizardStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b pb-3 border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-1.5"><BadgePercent size={16} /> Checkout Pricing Summary</h4>
                <p className="text-[11px] text-stone-400 mt-1">Review the final charges and complete your reservation</p>
              </div>

              {/* Itemized pricing breakdown */}
              <div className={`p-4 rounded-2xl border space-y-3 text-xs ${isDarkMode ? 'bg-[#111827] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <div className="flex justify-between">
                  <span className="text-stone-400">Stay ({nights} night{nights !== 1 ? "s" : ""} × {roomsCount} room{roomsCount !== 1 ? "s" : ""}):</span>
                  <span className="font-bold">{currencySymbol}{(Math.round(subtotal * exchangeRate)).toLocaleString()}</span>
                </div>

                {couponApplied && (
                  <div className="flex justify-between text-[#10B981] font-semibold">
                    <span>Coupon Discount ({couponCode}):</span>
                    <span>-{currencySymbol}{(Math.round(calculatedCouponDiscount * exchangeRate)).toLocaleString()}</span>
                  </div>
                )}

                {redeemPointsChecked && (
                  <div className="flex justify-between text-[#10B981] font-semibold">
                    <span>Redeemed Points Discount ({pointsToRedeem} pts):</span>
                    <span>-{currencySymbol}{(Math.round(pointsDiscountValue * exchangeRate)).toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-3 flex justify-between text-base font-extrabold text-primary">
                  <span>Grand Total</span>
                  <span>{currencySymbol}{(Math.round(grandTotal * exchangeRate)).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment module status note */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h6 className="text-[11.5px] font-bold">Payment Module</h6>
                  <p className="text-[10.5px] text-stone-400 leading-relaxed">
                    Reservations with a ₹0 final total can be confirmed immediately. For any amount above ₹0, the payment module is not implemented yet and the reservation will not be created.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Booking Confirmation Pass */}
          {wizardStep === 5 && (
            <div className="flex flex-col items-center text-center space-y-4 py-2 animate-fade-in">
              <div className="relative w-28 h-28 mx-auto">
                <img 
                  src={rivoConfirmed} 
                  alt="Booking Confirmed" 
                  className="w-full h-full object-cover rounded-full border-2 border-[#22C55E] shadow-lg animate-bounce"
                />
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center border-2 border-white shadow-md">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>

              <div>
                <span className="px-3 py-1 bg-emerald-100 text-[#22C55E] rounded-full text-[10px] font-bold uppercase tracking-wider">
                  ✓ PASSPORT & BOOKING CONFIRMED
                </span>
                <h3 className="text-2xl font-bold mt-2">Reservation Secured!</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Rivo has successfully finalized your booking. A digital pass has been emailed to you!
                </p>
              </div>

              {/* Complete Booking Card */}
              <div className="bg-[#0B1120] text-white rounded-2xl p-5 text-left border border-[#2563EB] w-full space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-[10px] text-[#60A5FA] font-bold uppercase">BOOKING REFERENCE</div>
                    <div className="text-sm font-mono font-bold">{confirmedBookingCode}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-[#0B1120]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">GUEST</span>
                    <span className="font-bold">{isBookingForSelf ? (currentUser?.name || "Valued User") : guestName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">DATES</span>
                    <span className="font-bold">{formatDateRangeLabel(modalCheckIn, modalCheckOut)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">ROOM SELECTION</span>
                    <span className="font-bold">{roomsCount} Room{roomsCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">LOYALTY POINTS</span>
                    <span className="font-bold text-[#10B981]">+{Math.round(grandTotal * 0.1)} Points Earned</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer controls */}
        {wizardStep < 5 && (
          <div className={`p-6 border-t flex justify-end gap-3 ${isDarkMode ? 'bg-[#111827] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
            {wizardStep > 1 && (
              <button
                onClick={handlePrevStep}
                className="py-3 px-5 border border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition bg-transparent text-inherit"
              >
                Back
              </button>
            )}
            
            {wizardStep === 4 ? (
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="py-3 px-6 bg-[#22C55E] hover:bg-[#15803D] disabled:bg-stone-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg border-none transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submitting ? "Processing..." : "Complete Reservation"}
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                className="py-3 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md border-none transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        {wizardStep === 5 && (
          <div className={`p-6 border-t ${isDarkMode ? 'bg-[#111827] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
              <button
                onClick={() => {
                  onClose();
                  if (onAskRivo) onAskRivo();
                }}
                className="w-full sm:flex-grow py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border-none cursor-pointer transition"
              >
                <Sparkles className="w-4 h-4" /> Open Rivo for Check-in
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl border-none cursor-pointer transition"
              >
                Close Pass
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
