import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../services/auth.service";
import ErrorScreen from "./ErrorScreen";

/**
 * Route guard component to restrict pages to authenticated users and specific roles.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = authService.isAuthenticated();
        if (authStatus) {
          const currentUser = authService.getCurrentUser();
          setIsAuthenticated(true);
          setUser(currentUser);
          
          // Validate token with backend for all auth types
          const validatedUser = await authService.refreshCurrentUser();
          if (validatedUser) {
            setUser(validatedUser);
          } else {
            // Token is invalid, clear it
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login and save the location they tried to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If authenticated but role is not allowed, show unauthorized screen
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-bg-light">
        <ErrorScreen 
          type="unauthorized" 
          message="You do not have the necessary permissions to access this administrative portal."
        />
      </div>
    );
  }

  return children;
}
