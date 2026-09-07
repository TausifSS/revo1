import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, ShieldCheck, Sparkles, RefreshCw, QrCode, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StripeCardInput({ onPaymentSuccess, grandTotal, currencySymbol = "₹" }) {
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card', 'upi', 'netbanking'
  
  // Card states
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [focusedField, setFocusedField] = useState("");

  // UPI states
  const [upiId, setUpiId] = useState("");

  // Netbanking states
  const [selectedBank, setSelectedBank] = useState("");

  // Transaction verification states
  const [show3dSecure, setShow3dSecure] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Card brand detection
  const getCardBrand = (number) => {
    const cleanNum = number.replace(/\D/g, '');
    if (cleanNum.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleanNum)) return 'mastercard';
    if (/^3[47]/.test(cleanNum)) return 'amex';
    return 'generic';
  };

  const brand = getCardBrand(cardNumber);

  // Expiry date auto formatting
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length > 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setExpiry(val);
  };

  // Card number spacing formatting
  const handleNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || "";
    setCardNumber(formatted);
  };

  const handleCvvChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    const limit = brand === 'amex' ? 4 : 3;
    if (val.length > limit) val = val.slice(0, limit);
    setCvv(val);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      if (cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3 || cardName.length < 3) {
        alert("Please fill all payment fields correctly.");
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.includes('@')) {
        alert("Please enter a valid UPI ID (e.g. name@upi)");
        return;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!selectedBank) {
        alert("Please select a bank to proceed.");
        return;
      }
    }
    setShow3dSecure(true);
  };

  const trigger3dSecureAuth = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setShow3dSecure(false);
      if (onPaymentSuccess) onPaymentSuccess();
    }, 2500);
  };

  const getBankName = (code) => {
    const banks = {
      sbi: "State Bank of India",
      hdfc: "HDFC Bank",
      icici: "ICICI Bank",
      axis: "Axis Bank",
      kotak: "Kotak Mahindra Bank",
      pnb: "Punjab National Bank",
      bob: "Bank of Baroda",
      indusind: "IndusInd Bank",
      yesbank: "Yes Bank",
      canara: "Canara Bank"
    };
    return banks[code] || code.toUpperCase();
  };

  return (
    <div className="space-y-5">
      
      {/* Payment Method Selector Tabs */}
      <div className="flex gap-2 p-1.5 bg-bg-light border border-border-color rounded-2xl">
        {[
          { id: 'card', label: 'Card Payment', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'upi', label: 'UPI / Scan QR', icon: <QrCode className="w-4 h-4" /> },
          { id: 'netbanking', label: 'Net Banking', icon: <Building className="w-4 h-4" /> }
        ].map((method) => {
          const isActive = paymentMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setPaymentMethod(method.id)}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border-none transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-transparent text-text-gray hover:text-text-dark'
              }`}
            >
              {method.icon}
              <span>{method.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CARD PAYMENT VIEW ────────────────────────── */}
      {paymentMethod === 'card' && (
        <div className="space-y-5 animate-fade-in">
          {/* 3D Visual Card Box */}
          <div className="flex justify-center select-none py-1">
            <div className="w-[320px] h-[190px] [perspective:1000px]">
              <motion.div 
                className="w-full h-full relative [transform-style:preserve-3d] transition-transform duration-700"
                animate={{ rotateY: focusedField === 'cvv' ? 180 : 0 }}
              >
                {/* Front Card Face */}
                <div className="absolute w-full h-full rounded-[20px] p-5 text-white bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#121824] border border-white/10 [backface-visibility:hidden] flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
                  {/* Card top */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="h-6 w-9 bg-amber-400/20 rounded-md border border-amber-400/30 flex items-center justify-center">
                        <div className="w-5 h-3 bg-amber-400/40 rounded-sm" />
                      </div>
                    </div>
                    {brand === 'visa' && <span className="font-extrabold italic text-lg tracking-wider text-white">VISA</span>}
                    {brand === 'mastercard' && (
                      <div className="flex -space-x-2.5">
                        <div className="w-5 h-5 rounded-full bg-red-500" />
                        <div className="w-5 h-5 rounded-full bg-amber-500" />
                      </div>
                    )}
                    {brand === 'amex' && <span className="font-extrabold text-sm tracking-wider text-sky-400">AMEX</span>}
                    {brand === 'generic' && <CreditCard className="w-5 h-5 text-slate-400" />}
                  </div>

                  {/* Card Number display */}
                  <div className="text-[17px] font-mono tracking-[2.5px] text-center my-3 text-slate-200">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>

                  {/* Card Bottom */}
                  <div className="flex justify-between items-end">
                    <div className="text-left">
                      <div className="text-[8px] uppercase tracking-wider text-slate-400">Card Holder</div>
                      <div className="text-xs font-bold font-mono tracking-wide truncate max-w-[170px] uppercase">
                        {cardName || "Your Full Name"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] uppercase tracking-wider text-slate-400">Expires</div>
                      <div className="text-xs font-bold font-mono tracking-wide">
                        {expiry || "MM/YY"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Card Face */}
                <div className="absolute w-full h-full rounded-[20px] text-white bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#121824] border border-white/10 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between py-5 shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
                  <div className="w-full h-10 bg-slate-950 mt-1" />
                  <div className="px-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-8 bg-slate-200/20 rounded-md flex items-center justify-end px-3">
                        <span className="text-[9px] text-slate-400 select-none">AUTHORIZED SIGNATURE</span>
                      </div>
                      <div className="w-12 h-7.5 bg-white text-slate-900 rounded font-mono font-bold text-xs flex items-center justify-center shadow">
                        {cvv || "•••"}
                      </div>
                    </div>
                    <p className="text-[7.5px] leading-snug text-slate-400 text-left">
                      This card is mock-secured for Reservo instant reservations. Tapping pay activates our secure 3DS gateway authentication.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="card-number-input" className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Card Number</label>
              <input 
                id="card-number-input"
                type="text"
                required
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChange={handleNumberChange}
                onFocus={() => setFocusedField("number")}
                onBlur={() => setFocusedField("")}
                className="w-full p-3 bg-bg-light border border-border-color rounded-xl text-xs font-semibold outline-none focus:border-primary transition"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="card-name-input" className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Cardholder Name</label>
              <input 
                id="card-name-input"
                type="text"
                required
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField("")}
                className="w-full p-3 bg-bg-light border border-border-color rounded-xl text-xs font-semibold outline-none focus:border-primary transition uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="card-expiry-input" className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Expiry Date</label>
                <input 
                  id="card-expiry-input"
                  type="text"
                  required
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiryChange}
                  onFocus={() => setFocusedField("expiry")}
                  onBlur={() => setFocusedField("")}
                  className="w-full p-3 bg-bg-light border border-border-color rounded-xl text-xs font-semibold outline-none focus:border-primary transition text-center"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="card-cvv-input" className="text-[10px] font-bold uppercase tracking-wider text-text-gray">CVV / CVC</label>
                <input 
                  id="card-cvv-input"
                  type="password"
                  required
                  placeholder="•••"
                  value={cvv}
                  onChange={handleCvvChange}
                  onFocus={() => setFocusedField("cvv")}
                  onBlur={() => setFocusedField("")}
                  className="w-full p-3 bg-bg-light border border-border-color rounded-xl text-xs font-semibold outline-none focus:border-primary transition text-center"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full mt-2 py-3.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg border-none cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              Verify Card & Pay {currencySymbol}{Math.round(grandTotal).toLocaleString()}
            </button>
          </form>
        </div>
      )}

      {/* ── UPI PAYMENT VIEW ─────────────────────────── */}
      {paymentMethod === 'upi' && (
        <div className="space-y-4 animate-fade-in">
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="upi-vpa-input" className="text-[10px] font-bold uppercase tracking-wider text-text-gray">UPI ID / VPA</label>
              <input 
                id="upi-vpa-input"
                type="text"
                required
                placeholder="e.g. name@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full p-3 bg-bg-light border border-border-color rounded-xl text-xs font-semibold outline-none focus:border-primary transition"
              />
            </div>

            {/* UPI Quick Handles Suffix selection */}
            <div className="flex flex-wrap gap-1.5 justify-start">
              {['@okhdfcbank', '@okaxis', '@okicici', '@paytm', '@ybl'].map((suffix) => (
                <button
                  key={suffix}
                  type="button"
                  onClick={() => {
                    const prefix = upiId.split('@')[0] || "username";
                    setUpiId(prefix + suffix);
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-bg-light hover:bg-[#2563eb]/10 border border-border-color hover:border-primary text-text-gray hover:text-primary rounded-lg transition cursor-pointer"
                >
                  {suffix}
                </button>
              ))}
            </div>

            {/* OR Separator */}
            <div className="flex items-center justify-center gap-4 my-2 text-[#8A9AAF] dark:text-[#91A3BF] text-[9px] uppercase font-bold tracking-widest select-none">
              <div className="h-px bg-border-color flex-1"></div>
              <span>OR SCAN STATIC QR CODE</span>
              <div className="h-px bg-border-color flex-1"></div>
            </div>

            {/* Interactive Scanning QR Box */}
            <div className="flex flex-col items-center justify-center p-4 bg-bg-light border border-border-color rounded-2xl relative overflow-hidden">
              <div className="relative w-36 h-36 bg-white p-2.5 rounded-2xl border border-border-color shadow-sm flex items-center justify-center">
                {/* Laser animation bar */}
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-[#2563eb] opacity-80"
                  style={{
                    animation: "shimmer-anim 2s infinite ease-in-out",
                    top: "0%"
                  }}
                />
                <QrCode className="w-full h-full text-slate-800" />
              </div>
              <span className="text-[10px] font-bold text-text-gray mt-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Scan QR with GPay, PhonePe, or BHIM to pay instantly
              </span>
            </div>

            <button 
              type="submit"
              className="w-full mt-2 py-3.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg border-none cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              Verify UPI & Pay {currencySymbol}{Math.round(grandTotal).toLocaleString()}
            </button>
          </form>
        </div>
      )}

      {/* ── NET BANKING VIEW ─────────────────────────── */}
      {paymentMethod === 'netbanking' && (
        <div className="space-y-4 animate-fade-in">
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Popular Banks</label>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { code: 'hdfc', short: 'HDFC', name: 'HDFC Bank', color: 'border-blue-900 text-blue-900 bg-blue-50/50' },
                  { code: 'sbi', short: 'SBI', name: 'State Bank of India', color: 'border-sky-500 text-sky-600 bg-sky-50/50' },
                  { code: 'icici', short: 'ICICI', name: 'ICICI Bank', color: 'border-orange-500 text-orange-600 bg-orange-50/50' },
                  { code: 'axis', short: 'AXIS', name: 'Axis Bank', color: 'border-purple-800 text-purple-800 bg-purple-50/50' }
                ].map((bank) => {
                  const isSelected = selectedBank === bank.code;
                  return (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => setSelectedBank(bank.code)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer ${bank.color} ${
                        isSelected 
                          ? 'ring-2 ring-primary border-primary bg-primary/10 font-bold scale-[1.02]' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Building className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold tracking-wider">{bank.short}</span>
                      <span className="text-[8px] text-text-gray truncate max-w-full font-medium">{bank.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropdown list for other banks */}
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="bank-select-dropdown" className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Other Banks</label>
              <select
                id="bank-select-dropdown"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full p-3 bg-bg-light border border-border-color rounded-xl text-xs font-semibold outline-none focus:border-primary transition cursor-pointer"
              >
                <option value="">-- Choose Your Bank --</option>
                <option value="kotak">Kotak Mahindra Bank</option>
                <option value="pnb">Punjab National Bank</option>
                <option value="bob">Bank of Baroda</option>
                <option value="indusind">IndusInd Bank</option>
                <option value="yesbank">Yes Bank</option>
                <option value="canara">Canara Bank</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full mt-2 py-3.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg border-none cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              Verify Bank & Pay {currencySymbol}{Math.round(grandTotal).toLocaleString()}
            </button>
          </form>
        </div>
      )}

      {/* ── 3D SECURE GATEWAY VERIFICATION DIALOG ──────── */}
      <AnimatePresence>
        {show3dSecure && (
          <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-white border border-border-color rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative"
            >
              <button 
                onClick={() => setShow3dSecure(false)}
                className="absolute top-5 right-5 w-7 h-7 bg-bg-light border-none rounded-full flex items-center justify-center text-text-dark cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <h4 className="text-base font-bold text-text-dark">Reservo Secure Gateway</h4>
              <p className="text-xs text-text-gray mt-1 leading-relaxed">
                Reservo matches transactions with secure protocols. Click authorize to complete payment.
              </p>

              <div className="border border-border-color rounded-2xl p-4 my-5 bg-bg-light text-left text-xs font-semibold space-y-1.5 text-text-dark">
                <div className="flex justify-between"><span>Merchant</span><span>Reservo Online Stays</span></div>
                <div className="flex justify-between"><span>Amount</span><span className="text-primary font-bold">{currencySymbol}{Math.round(grandTotal).toLocaleString()}</span></div>
                {paymentMethod === 'card' && (
                  <>
                    <div className="flex justify-between"><span>Method</span><span>Debit/Credit Card</span></div>
                    <div className="flex justify-between"><span>Card Number</span><span className="font-mono">•••• {cardNumber.slice(-4)}</span></div>
                  </>
                )}
                {paymentMethod === 'upi' && (
                  <>
                    <div className="flex justify-between"><span>Method</span><span>UPI Payment</span></div>
                    <div className="flex justify-between"><span>UPI ID</span><span className="font-mono">{upiId}</span></div>
                  </>
                )}
                {paymentMethod === 'netbanking' && (
                  <>
                    <div className="flex justify-between"><span>Method</span><span>Net Banking</span></div>
                    <div className="flex justify-between"><span>Bank</span><span>{getBankName(selectedBank)}</span></div>
                  </>
                )}
              </div>

              <button 
                onClick={trigger3dSecureAuth}
                disabled={verifying}
                className="w-full py-3 bg-[#22C55E] hover:bg-[#15803D] text-white text-xs font-bold uppercase rounded-xl border-none shadow transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" /> Authorize Transaction
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
