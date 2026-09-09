import { apiClient } from "./apiClient";

const BACKEND_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://reservobd.onrender.com" : "http://localhost:8080")).replace(/\/$/, "");

export const oauth2Service = {
  // Check if OAuth2 is enabled on the backend
  async isOAuth2Enabled() {
    return true; // Hardcoded to true since we just enabled and configured it in the backend
  },

  // Get OAuth2 authorization URL for a provider
  getOAuth2Url(provider) {
    const redirectUri = `${window.location.origin}/login/oauth2/callback/${provider}`;
    return `${BACKEND_URL}/oauth2/authorization/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  },

  // Handle OAuth2 callback (called after redirect from OAuth2 provider)
  async handleOAuth2Callback(provider, code, state) {
    try {
      const result = await apiClient.post(`/api/v1/auth/oauth2/callback`, {
        provider,
        code,
        state,
      });
      return result;
    } catch (error) {
      console.error("OAuth2 callback error:", error);
      throw error;
    }
  },

  // Link OAuth2 account to existing user
  async linkOAuth2Account(provider, providerUserId) {
    try {
      const result = await apiClient.post("/api/v1/auth/oauth2/link", {
        provider,
        providerUserId,
      });
      return result;
    } catch (error) {
      console.error("OAuth2 link error:", error);
      throw error;
    }
  },

  // Unlink OAuth2 account
  async unlinkOAuth2Account() {
    try {
      const result = await apiClient.post("/api/v1/auth/oauth2/unlink");
      return result;
    } catch (error) {
      console.error("OAuth2 unlink error:", error);
      throw error;
    }
  },

  // Redirect to OAuth2 provider
  async initiateOAuth2Login(provider) {
    try {
      // First check if OAuth2 is enabled
      const isEnabled = await this.isOAuth2Enabled();
      if (!isEnabled) {
        throw new Error("OAuth2 is not currently enabled. Please use email/password authentication.");
      }

      const authUrl = this.getOAuth2Url(provider);
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to initiate OAuth2 login:", error);
      throw error;
    }
  },
};