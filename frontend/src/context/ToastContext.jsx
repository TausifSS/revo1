import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = "toast-" + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Expose toast method on window so legacy code that updates DOM toasts still works
  React.useEffect(() => {
    window.showReservoToast = (msg, type = "success") => {
      addToast(msg, type);
    };
  }, [addToast]);

  const getIcon = (type) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-400" />;
      case "success":
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-3.5 max-w-sm w-[90%] pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-[#121e1b] text-white p-3.5 px-5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-[#334155] flex items-center justify-between gap-3 text-xs font-semibold pointer-events-auto"
            >
              <div className="flex items-center gap-2">
                {getIcon(t.type)}
                <span>{t.message}</span>
              </div>
              <button 
                onClick={() => removeToast(t.id)}
                className="bg-transparent border-none text-white/50 hover:text-white cursor-pointer p-0 shrink-0"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context.toast;
}
