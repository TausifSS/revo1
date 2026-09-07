import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentCancel() {
  const navigate = useNavigate();

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
          className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-inner"
        >
          <AlertCircle className="w-10 h-10" />
        </motion.div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Cancelled</h1>
          <p className="text-sm text-gray-500">Your reservation checkout was cancelled or incomplete. No funds have been charged from your card.</p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-4">
          <button 
            onClick={() => navigate("/")}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 px-6 rounded-2xl font-semibold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back to Resorts
          </button>
          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 px-6 rounded-2xl font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer border-none"
          >
            My Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
