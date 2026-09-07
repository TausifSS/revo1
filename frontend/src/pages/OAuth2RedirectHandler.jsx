import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { secureStorage } from "../services/secureStorage";
import { authService } from "../services/auth.service";

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast("OAuth2 login failed: " + error, "error");
      navigate("/login", { replace: true });
      return;
    }

    if (token) {
      // Store the token
      secureStorage.setItem("reservo_auth_token", token);
      
      // We also need to fetch and store user details using authService
      authService.refreshCurrentUser().then(user => {
        toast("Successfully logged in with Google!", "success");
        // Redirect based on role
        const role = user.role;
        if (role === "ROLE_ADMIN") {
          navigate("/admin/reservo", { replace: true });
        } else if (role === "ROLE_OWNER") {
          navigate("/admin/resort", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }).catch(err => {
        toast("Failed to fetch user details after OAuth.", "error");
        secureStorage.removeItem("reservo_auth_token");
        navigate("/login", { replace: true });
      });
    } else {
      toast("No token found in redirect url.", "error");
      navigate("/login", { replace: true });
    }
  }, [navigate, searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-text-gray tracking-wider">Completing Authentication...</span>
      </div>
    </div>
  );
}
