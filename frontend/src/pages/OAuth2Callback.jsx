import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/auth.service";
import { Sparkles, Loader2 } from "lucide-react";

export default function OAuth2Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing OAuth2 authentication...");

  useEffect(() => {
    const handleOAuth2Callback = async () => {
      try {
        // Check if this is a success or error callback
        const error = searchParams.get("error");
        if (error) {
          setStatus("error");
          setMessage(`OAuth2 authentication failed: ${error}`);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // For Spring Security OAuth2, the callback is handled by the backend
        // We need to get the current user from the backend endpoint
        const result = await authService.refreshCurrentUser();
        
        if (result) {
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
          
          // Redirect based on user role
          const role = authService.getUserRole();
          setTimeout(() => {
            if (role === "ROLE_ADMIN") {
              navigate("/admin/reservo");
            } else if (role === "ROLE_OWNER") {
              navigate("/admin/resort");
            } else {
              navigate("/dashboard");
            }
          }, 1500);
        } else {
          throw new Error("Failed to authenticate user");
        }
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "OAuth2 authentication failed");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleOAuth2Callback();
  }, [searchParams, navigate]);

  return (
    <div className="h-screen w-screen bg-bg-light flex items-center justify-center font-sans">
      <div className="bg-bg-white border border-border-color rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
        {status === "processing" && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            <h2 className="text-xl font-bold text-text-primary">Authenticating...</h2>
            <p className="text-text-gray">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">Success!</h2>
            <p className="text-text-gray">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary">Authentication Failed</h2>
            <p className="text-text-gray">{message}</p>
            <p className="text-sm text-text-gray">Redirecting to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
}