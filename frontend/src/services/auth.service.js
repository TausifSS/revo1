import { secureStorage } from "./secureStorage";
import { apiClient } from "./apiClient";
import firebaseService from "./firebase.service";

const TOKEN_KEY = "reservo_auth_token";
const USER_KEY = "reservo_user";

export const authService = {
  async login(email, password) {
    try {
      const result = await apiClient.post("/api/v1/auth/login", { email, password });
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async register(name, email, password, otpCode, phone = null, role = "ROLE_CUSTOMER") {
    try {
      const result = await apiClient.post("/api/v1/auth/signup", {
        name,
        email,
        password,
        otpCode,
        phone,
        role
      });
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  async sendOtp(email) {
    try {
      const result = await apiClient.post(`/api/v1/auth/otp/send?email=${encodeURIComponent(email)}`);
      return result.message || "OTP sent successfully";
    } catch (error) {
      console.error("OTP send error:", error);
      throw error;
    }
  },

  async verifyOtp(email, otpCode) {
    try {
      const result = await apiClient.post("/api/v1/auth/otp/verify", { email, otpCode });
      return result.message || "OTP verified successfully";
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  },

  async logout() {
    try {
      const token = secureStorage.getItem(TOKEN_KEY);
      if (token) {
        await apiClient.post("/api/v1/auth/logout");
      }
      secureStorage.removeItem(TOKEN_KEY);
      secureStorage.removeItem(USER_KEY);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      secureStorage.removeItem(TOKEN_KEY);
      secureStorage.removeItem(USER_KEY);
      return true;
    }
  },

  getCurrentUser() {
    return secureStorage.getItem(USER_KEY);
  },

  async requestPasswordReset(email) {
    const result = await apiClient.post(`/api/v1/auth/password-reset/request?email=${encodeURIComponent(email)}`);
    if (!result.success) {
      throw new Error(result.message || "Could not request a password reset.");
    }
    return result.message;
  },

  async resetPassword(email, otpCode, newPassword) {
    const result = await apiClient.post("/api/v1/auth/password-reset/confirm", { email, otpCode, newPassword });
    if (!result.success) {
      throw new Error(result.message || "Could not reset the password.");
    }
    return result.message;
  },

  async refreshCurrentUser() {
    try {
      const token = secureStorage.getItem(TOKEN_KEY);
      if (!token) {
        return null;
      }
      const result = await apiClient.get("/api/v1/auth/me");
      if (result.success && result.data) {
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  isAuthenticated() {
    return !!secureStorage.getItem(TOKEN_KEY);
  },

  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  },

  getAuthToken() {
    return secureStorage.getItem(TOKEN_KEY);
  },

  // Phone Authentication Methods
  async loginWithPhone(phoneNumber, firebaseIdToken, role = "ROLE_CUSTOMER") {
    try {
      const result = await apiClient.post("/api/v1/auth/login/phone", {
        phoneNumber,
        firebaseIdToken,
        role
      });
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Phone authentication failed");
      }
    } catch (error) {
      console.error("Phone login error:", error);
      throw error;
    }
  },

  async registerWithPhone(name, phoneNumber, firebaseIdToken, role = "ROLE_CUSTOMER") {
    try {
      const result = await apiClient.post("/api/v1/auth/signup/phone", {
        name,
        phoneNumber,
        firebaseIdToken,
        role
      });
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Phone registration failed");
      }
    } catch (error) {
      console.error("Phone registration error:", error);
      throw error;
    }
  },

  // Social Authentication Methods
  async signInWithGoogle(role = "ROLE_CUSTOMER") {
    try {
      const firebaseResult = await firebaseService.signInWithGoogle();
      
      // Call backend social auth endpoint
      const result = await apiClient.post("/api/v1/auth/social/login", {
        provider: "google",
        firebaseIdToken: firebaseResult.idToken,
        role
      });
      
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Google authentication failed");
      }
      
    } catch (error) {
      console.error("Google sign-in error:", error);
      
      // Handle account exists with different credential error
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        const credential = error.customData?._tokenResponse; // The pending credential
        
        // Fetch existing sign-in methods
        const methods = await firebaseService.fetchSignInMethodsForEmail(email);
        
        // Map Firebase method names to our provider names
        const providerMap = {
          'google.com': 'google',
          'facebook.com': 'facebook',
          'twitter.com': 'twitter',
          'password': 'email',
          'phone': 'phone'
        };
        
        const existingProvider = providerMap[methods[0]] || 'google'; // Default to google if unknown
        
        return {
          accountConflict: true,
          existingProvider: existingProvider,
          newProvider: 'google',
          email: email,
          pendingCredential: credential,
          message: `This email is already registered with ${existingProvider.charAt(0).toUpperCase() + existingProvider.slice(1)}. Sign in with ${existingProvider} first to link Google.`
        };
      }
      
      throw error;
    }
  },

  async signInWithFacebook(role = "ROLE_CUSTOMER") {
    try {
      console.log("Auth Service: Starting Facebook sign-in with role:", role);
      const firebaseResult = await firebaseService.signInWithFacebook();
      
      console.log("Auth Service: Firebase result received:", firebaseResult);
      
      // Call backend social auth endpoint
      const result = await apiClient.post("/api/v1/auth/social/login", {
        provider: "facebook",
        firebaseIdToken: firebaseResult.idToken,
        role
      });
      
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Facebook authentication failed");
      }
      
    } catch (error) {
      console.error("Facebook sign-in error:", error);
      
      // Handle account exists with different credential error
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        const credential = error.customData?._tokenResponse;
        
        const methods = await firebaseService.fetchSignInMethodsForEmail(email);
        
        // Map Firebase method names to our provider names
        const providerMap = {
          'google.com': 'google',
          'facebook.com': 'facebook',
          'twitter.com': 'twitter',
          'password': 'email',
          'phone': 'phone'
        };
        
        const existingProvider = providerMap[methods[0]] || 'google';
        
        return {
          accountConflict: true,
          existingProvider: existingProvider,
          newProvider: 'facebook',
          email: email,
          pendingCredential: credential,
          message: `This email is already registered with ${existingProvider.charAt(0).toUpperCase() + existingProvider.slice(1)}. Sign in with ${existingProvider} first to link Facebook.`
        };
      }
      
      throw error;
    }
  },

  async signInWithTwitter(role = "ROLE_CUSTOMER") {
    try {
      console.log("Auth Service: Starting Twitter sign-in with role:", role);
      const firebaseResult = await firebaseService.signInWithTwitter();
      
      console.log("Auth Service: Firebase result received:", firebaseResult);
      
      // Call backend social auth endpoint
      const result = await apiClient.post("/api/v1/auth/social/login", {
        provider: "twitter",
        firebaseIdToken: firebaseResult.idToken,
        role
      });
      
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Twitter authentication failed");
      }
      
    } catch (error) {
      console.error("Twitter sign-in error:", error);
      
      // Handle account exists with different credential error
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        const credential = error.customData?._tokenResponse;
        
        const methods = await firebaseService.fetchSignInMethodsForEmail(email);
        
        // Map Firebase method names to our provider names
        const providerMap = {
          'google.com': 'google',
          'facebook.com': 'facebook',
          'twitter.com': 'twitter',
          'password': 'email',
          'phone': 'phone'
        };
        
        const existingProvider = providerMap[methods[0]] || 'google';
        
        return {
          accountConflict: true,
          existingProvider: existingProvider,
          newProvider: 'twitter',
          email: email,
          pendingCredential: credential,
          message: `This email is already registered with ${existingProvider.charAt(0).toUpperCase() + existingProvider.slice(1)}. Sign in with ${existingProvider} first to link Twitter.`
        };
      }
      
      throw error;
    }
  },

  async registerWithGoogle(name, role = "ROLE_CUSTOMER") {
    try {
      const firebaseResult = await firebaseService.signInWithGoogle();
      
      // Call backend social auth endpoint (same as login for social providers)
      const result = await apiClient.post("/api/v1/auth/social/login", {
        provider: "google",
        firebaseIdToken: firebaseResult.idToken,
        name: name || firebaseResult.user.displayName,
        role
      });
      
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Google authentication failed");
      }
      
    } catch (error) {
      console.error("Google registration error:", error);
      
      // Handle account exists with different credential error
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        const credential = error.customData?._tokenResponse;
        
        const methods = await firebaseService.fetchSignInMethodsForEmail(email);
        
        // Map Firebase method names to our provider names
        const providerMap = {
          'google.com': 'google',
          'facebook.com': 'facebook',
          'twitter.com': 'twitter',
          'password': 'email',
          'phone': 'phone'
        };
        
        const existingProvider = providerMap[methods[0]] || 'google';
        
        return {
          accountConflict: true,
          existingProvider: existingProvider,
          newProvider: 'google',
          email: email,
          pendingCredential: credential,
          message: `This email is already registered with ${existingProvider.charAt(0).toUpperCase() + existingProvider.slice(1)}. Sign in with ${existingProvider} first to link Google.`
        };
      }
      
      throw error;
    }
  },

  async registerWithFacebook(name, role = "ROLE_CUSTOMER") {
    try {
      const firebaseResult = await firebaseService.signInWithFacebook();
      
      // Call backend social auth endpoint (same as login for social providers)
      const result = await apiClient.post("/api/v1/auth/social/login", {
        provider: "facebook",
        firebaseIdToken: firebaseResult.idToken,
        name: name || firebaseResult.user.displayName,
        role
      });
      
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Facebook authentication failed");
      }
      
    } catch (error) {
      console.error("Facebook registration error:", error);
      
      // Handle account exists with different credential error
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        const credential = error.customData?._tokenResponse;
        
        const methods = await firebaseService.fetchSignInMethodsForEmail(email);
        
        // Map Firebase method names to our provider names
        const providerMap = {
          'google.com': 'google',
          'facebook.com': 'facebook',
          'twitter.com': 'twitter',
          'password': 'email',
          'phone': 'phone'
        };
        
        const existingProvider = providerMap[methods[0]] || 'google';
        
        return {
          accountConflict: true,
          existingProvider: existingProvider,
          newProvider: 'facebook',
          email: email,
          pendingCredential: credential,
          message: `This email is already registered with ${existingProvider.charAt(0).toUpperCase() + existingProvider.slice(1)}. Sign in with ${existingProvider} first to link Facebook.`
        };
      }
      
      throw error;
    }
  },

  async registerWithTwitter(name, role = "ROLE_CUSTOMER") {
    try {
      const firebaseResult = await firebaseService.signInWithTwitter();
      
      // Call backend social auth endpoint (same as login for social providers)
      const result = await apiClient.post("/api/v1/auth/social/login", {
        provider: "twitter",
        firebaseIdToken: firebaseResult.idToken,
        name: name || firebaseResult.user.displayName,
        role
      });
      
      if (result.success && result.data) {
        secureStorage.setItem(TOKEN_KEY, result.data.token);
        secureStorage.setItem(USER_KEY, result.data);
        return result.data;
      } else {
        throw new Error(result.message || "Twitter authentication failed");
      }
      
    } catch (error) {
      console.error("Twitter registration error:", error);
      
      // Handle account exists with different credential error
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        const credential = error.customData?._tokenResponse;
        
        const methods = await firebaseService.fetchSignInMethodsForEmail(email);
        
        // Map Firebase method names to our provider names
        const providerMap = {
          'google.com': 'google',
          'facebook.com': 'facebook',
          'twitter.com': 'twitter',
          'password': 'email',
          'phone': 'phone'
        };
        
        const existingProvider = providerMap[methods[0]] || 'google';
        
        return {
          accountConflict: true,
          existingProvider: existingProvider,
          newProvider: 'twitter',
          email: email,
          pendingCredential: credential,
          message: `This email is already registered with ${existingProvider.charAt(0).toUpperCase() + existingProvider.slice(1)}. Sign in with ${existingProvider} first to link Twitter.`
        };
      }
      
      throw error;
    }
  },

  // Account Linking Methods
  async linkProvider(provider, firebaseIdToken) {
    try {
      // This would typically call your backend to link the provider
      // For testing mode, we'll just update the user's provider info
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          linkedProviders: [...(currentUser.linkedProviders || []), provider],
          provider: provider // Set the most recent provider as primary
        };
        secureStorage.setItem(USER_KEY, updatedUser);
        return updatedUser;
      }
      throw new Error("No existing user to link provider to");
    } catch (error) {
      console.error("Provider linking error:", error);
      throw error;
    }
  },

  // Full Firebase account linking flow
  async linkAuthProvider(newProvider) {
    try {
      console.log(`Starting account linking for ${newProvider}...`);
      
      // Call Firebase to link the provider
      const result = await firebaseService.linkWithProvider(newProvider);
      
      if (result.success) {
        // Update local storage with new user data
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            providerData: result.user.providerData,
            linkedProviders: [...(currentUser.linkedProviders || []), newProvider],
            token: result.idToken // Update with new token
          };
          secureStorage.setItem(TOKEN_KEY, result.idToken);
          secureStorage.setItem(USER_KEY, updatedUser);
        }
        
        return {
          success: true,
          message: `${newProvider.charAt(0).toUpperCase() + newProvider.slice(1)} has been linked to your account. You can now use either provider.`,
          user: result.user
        };
      }
      
      throw new Error("Failed to link provider");
    } catch (error) {
      console.error("Account linking error:", error);
      
      // Provide friendly error messages
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("The popup was closed. Please try again.");
      } else if (error.code === 'auth/provider-already-linked') {
        throw new Error("This provider is already linked to your account.");
      } else if (error.code === 'auth/internal-error') {
        throw new Error("A server error occurred. Please try again.");
      }
      
      throw error;
    }
  },

  // Sign in with existing provider for account linking
  async signInForLinking(provider) {
    try {
      console.log(`Signing in with ${provider} for account linking...`);
      const firebaseResult = await firebaseService.signInWithProvider(provider);
      
      if (firebaseResult.success) {
        // Call backend social auth endpoint to get proper JWT token
        const result = await apiClient.post("/api/v1/auth/social/login", {
          provider: provider,
          firebaseIdToken: firebaseResult.idToken,
          role: authService.getCurrentUser()?.role || "ROLE_CUSTOMER"
        });
        
        if (result.success && result.data) {
          secureStorage.setItem(TOKEN_KEY, result.data.token);
          secureStorage.setItem(USER_KEY, result.data);
          
          return {
            success: true,
            user: result.data,
            message: `Signed in with ${provider}. You can now link other providers.`
          };
        } else {
          throw new Error(result.message || "Authentication failed");
        }
      }
      
      throw new Error("Failed to sign in");
    } catch (error) {
      console.error("Sign in for linking error:", error);
      
      // Provide friendly error messages
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("The popup was closed. Please try again.");
      } else if (error.code === 'auth/internal-error') {
        throw new Error("A server error occurred. Please try again.");
      }
      
      throw error;
    }
  }
};
