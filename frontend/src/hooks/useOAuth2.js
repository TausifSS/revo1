import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/auth.service";
import { oauth2Service } from "../services/oauth2.service";

export function useOAuth2() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle OAuth2 callback when returning from OAuth2 provider
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const provider = searchParams.get("provider");

      if (code && state && provider) {
        setIsLoading(true);
        try {
          // For Spring Security OAuth2, the backend handles the callback
          // We just need to get the auth token from the backend
          const result = await authService.getCurrentUser();
          if (result) {
            // Redirect based on user role
            const role = authService.getUserRole();
            if (role === "ROLE_ADMIN") {
              navigate("/admin/reservo");
            } else if (role === "ROLE_OWNER") {
              navigate("/admin/resort");
            } else {
              navigate("/dashboard");
            }
          }
        } catch (err) {
          setError(err.message || "OAuth2 authentication failed");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleOAuth2Login = (provider) => {
    setIsLoading(true);
    setError(null);
    try {
      oauth2Service.initiateOAuth2Login(provider);
    } catch (err) {
      setError(err.message || "Failed to initiate OAuth2 login");
      setIsLoading(false);
    }
  };

  const handleOAuth2Signup = (provider) => {
    setIsLoading(true);
    setError(null);
    try {
      oauth2Service.initiateOAuth2Login(provider);
    } catch (err) {
      setError(err.message || "Failed to initiate OAuth2 signup");
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleOAuth2Login,
    handleOAuth2Signup,
  };
}