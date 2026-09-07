import React from "react";
import { WifiOff, AlertTriangle, ShieldAlert, Clock, RefreshCw } from "lucide-react";
import rivoSearching from "../assets/images/rivo_searching.png";

export default function ErrorScreen({ 
  type = "general", 
  message, 
  onRetry 
}) {
  const getErrorConfig = () => {
    switch (type) {
      case "network":
        return {
          icon: <WifiOff className="w-10 h-10 text-red-500" />,
          title: "Network Connection Lost",
          defaultMsg: "Rivo couldn't reach the server. Please check your internet connection and try again."
        };
      case "unauthorized":
      case "expired":
        return {
          icon: <ShieldAlert className="w-10 h-10 text-amber-500" />,
          title: type === "expired" ? "Session Expired" : "Unauthorized Access",
          defaultMsg: "Please sign in again to view this booking profile page."
        };
      case "timeout":
        return {
          icon: <Clock className="w-10 h-10 text-amber-500" />,
          title: "Connection Timeout",
          defaultMsg: "The server took too long to respond. The network might be congested."
        };
      case "500":
      case "server":
        return {
          icon: <AlertTriangle className="w-10 h-10 text-red-500" />,
          title: "Internal Server Error",
          defaultMsg: "Something went wrong on our servers. Rivo is looking into this."
        };
      case "404":
        return {
          icon: <AlertTriangle className="w-10 h-10 text-blue-500" />,
          title: "Page Not Found",
          defaultMsg: "The resource you are looking for does not exist or has been relocated."
        };
      default:
        return {
          icon: <AlertTriangle className="w-10 h-10 text-red-500" />,
          title: "An Error Occurred",
          defaultMsg: "An unexpected error occurred while loading this module."
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className="text-center py-16 px-5 border border-border-color rounded-[32px] bg-bg-white shadow-sm flex flex-col items-center max-w-[500px] mx-auto animate-fade-in my-6">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
        {config.icon}
      </div>
      
      <h3 className="text-xl font-bold text-text-dark mb-2">{config.title}</h3>
      <p className="text-sm text-text-gray max-w-[380px] mx-auto leading-relaxed mb-8">
        {message || config.defaultMsg}
      </p>

      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-primary hover:bg-primary-dark text-white border-none py-2.5 px-6 rounded-xl font-bold text-xs shadow flex items-center gap-2 cursor-pointer transition select-none"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Request
        </button>
      )}
    </div>
  );
}
