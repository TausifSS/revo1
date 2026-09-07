import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingCode = searchParams.get("bookingCode") || "RS-UNKNOWN";

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-bg-light px-4 py-16 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center gap-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Booking Confirmed!</h1>
          <p className="text-sm text-gray-500">Your luxury stay is successfully reserved. An email confirmation has been sent to your inbox.</p>
        </div>

        <div className="w-full bg-gray-50 rounded-2xl p-5 flex flex-col gap-4 text-left border border-gray-100">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Booking Code</span>
            <span className="text-sm font-bold text-gray-900 font-mono">{bookingCode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Payment Status</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">Paid (Secure)</span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3 mt-4">
          <button 
            onClick={() => navigate("/bookings")}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 px-6 rounded-2xl font-semibold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            View Bookings <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate("/")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 px-6 rounded-2xl font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer border-none"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
