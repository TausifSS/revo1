import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  linkWithPopup
} from 'firebase/auth';
import firebaseConfig from '../config/firebase';

// Initialize Firebase with error handling
let app;
let auth;
let isFirebaseInitialized = false;

try {
  // Check if Firebase config has valid values (not placeholders)
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && 
      firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    isFirebaseInitialized = true;
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase config contains placeholder values. Phone authentication will not work until proper config is provided.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

class FirebasePhoneAuthService {
  constructor() {
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
  }

  // Initialize reCAPTCHA verifier
  initializeRecaptcha(containerId, invisible = false) {
    if (!isFirebaseInitialized) {
      throw new Error("Firebase is not initialized. Please check your Firebase configuration.");
    }
    
    try {
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: invisible ? 'invisible' : 'normal',
        callback: (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          console.log('reCAPTCHA expired');
        }
      });
      return this.recaptchaVerifier;
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
      throw error;
    }
  }

  // Send OTP to phone number
  async sendOtp(phoneNumber, containerId) {
    console.log('Firebase initialized:', isFirebaseInitialized);
    console.log('Sending OTP to:', phoneNumber);
    console.log('Container ID:', containerId);
    
    if (!isFirebaseInitialized) {
      console.error('Firebase not initialized');
      return { success: false, message: 'Firebase is not configured. Please set up Firebase configuration first.' };
    }
    
    try {
      if (!this.recaptchaVerifier) {
        console.log('Initializing reCAPTCHA...');
        this.initializeRecaptcha(containerId);
      }

      console.log('Calling signInWithPhoneNumber...');
      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        this.recaptchaVerifier
      );
      
      this.confirmationResult = confirmationResult;
      console.log('OTP sent successfully');
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('=== OTP SENDING ERROR ===');
      console.error('Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to send OTP';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please include country code (e.g., +91 for India)';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Firebase free tier has limited SMS. Please try again later or upgrade your Firebase plan.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again. Firebase has rate limits to prevent abuse.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please refresh the page and try again.';
      } else if (error.code === 'auth/invalid-app-credential') {
        errorMessage = 'Firebase configuration error. Please check your Firebase setup.';
      } else if (error.code === 'auth/app-not-authorized') {
        errorMessage = 'Firebase app not authorized. Please check your Firebase project settings.';
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        errorMessage = `Domain '${domain}' is not authorized in Firebase. Please add '${domain}' to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
      } else if (error.code === 'auth/billing-not-enabled') {
        errorMessage = 'Firebase billing is not enabled. Please enable billing in Firebase Console to use phone authentication.';
      } else {
        errorMessage = `Firebase error: ${error.message || error.code}`;
      }
      
      return { success: false, message: errorMessage, error: error.code };
    }
  }

  // Verify OTP and get Firebase token
  async verifyOtp(otpCode) {
    console.log('Verifying OTP:', otpCode);
    
    if (!isFirebaseInitialized) {
      return { success: false, message: 'Firebase is not configured. Please set up Firebase configuration first.' };
    }
    
    try {
      if (!this.confirmationResult) {
        throw new Error('No pending OTP verification. Please request OTP first.');
      }

      const result = await this.confirmationResult.confirm(otpCode);
      const user = result.user;
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      return { 
        success: true, 
        message: 'Phone verified successfully',
        idToken: idToken,
        phoneNumber: user.phoneNumber,
        uid: user.uid
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      let errorMessage = 'Invalid OTP code';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one';
      }
      
      return { success: false, message: errorMessage, error: error.code };
    }
  }

  // Clear reCAPTCHA verifier
  clearRecaptcha() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }

  // Check if Firebase is properly initialized
  isInitialized() {
    return isFirebaseInitialized;
  }

  // Google Authentication
  async signInWithGoogle() {
    if (!isFirebaseInitialized) {
      throw new Error("Firebase is not initialized. Please check your Firebase configuration.");
    }
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      // Debug: Log the raw Firebase user data
      console.log("Raw Firebase user data:", user);
      console.log("User displayName:", user.displayName);
      console.log("User email:", user.email);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        },
        idToken: idToken,
        provider: 'google'
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        throw new Error(`Domain '${domain}' is not authorized in Firebase. Please add '${domain}' to Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      }
      throw error; // Throw the original error so auth.service.js can handle it
    }
  }

  // Facebook Authentication
  async signInWithFacebook() {
    if (!isFirebaseInitialized) {
      throw new Error("Firebase is not initialized. Please check your Firebase configuration.");
    }
    
    try {
      console.log("Starting Facebook authentication...");
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      
      console.log("Opening Facebook popup...");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      console.log("Facebook auth successful, user data:", user);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        },
        idToken: idToken,
        provider: 'facebook'
      };
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error; // Throw the original error so auth.service.js can handle it
    }
  }

  // Twitter Authentication
  async signInWithTwitter() {
    if (!isFirebaseInitialized) {
      throw new Error("Firebase is not initialized. Please check your Firebase configuration.");
    }
    
    try {
      console.log("Starting Twitter authentication...");
      const provider = new TwitterAuthProvider();
      
      console.log("Opening Twitter popup...");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      console.log("Twitter auth successful, user data:", user);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          username: user.reloadUserInfo.screenName
        },
        idToken: idToken,
        provider: 'twitter'
      };
    } catch (error) {
      console.error('Twitter sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error; // Throw the original error so auth.service.js can handle it
    }
  }

  // Fetch sign-in methods for an email (for account linking)
  async fetchSignInMethodsForEmail(email) {
    if (!isFirebaseInitialized) {
      throw new Error("Firebase is not initialized. Please check your Firebase configuration.");
    }
    
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      console.log("Sign-in methods for email:", email, methods);
      return methods;
    } catch (error) {
      console.error('Error fetching sign-in methods:', error);
      throw error;
    }
  }

  // Link a provider to the current user
  async linkWithProvider(providerName) {
    if (!isFirebaseInitialized) {
      throw new Error("Firebase is not initialized. Please check your Firebase configuration.");
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No user is currently signed in. Please sign in first.");
    }
    
    try {
      let provider;
      switch (providerName) {
        case 'google':
          provider = new GoogleAuthProvider();
          provider.addScope('email');
          provider.addScope('profile');
          break;
        case 'facebook':
          provider = new FacebookAuthProvider();
          provider.addScope('email');
          provider.addScope('public_profile');
          break;
        case 'twitter':
          provider = new TwitterAuthProvider();
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }
      
      console.log(`Linking ${providerName} to current user...`);
      const result = await linkWithPopup(currentUser, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      console.log(`${providerName} linked successfully. User now has providers:`, user.providerData);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          providerData: user.providerData // Shows all linked providers
        },
        idToken: idToken,
        linkedProvider: providerName
      };
    } catch (error) {
      console.error(`Error linking ${providerName}:`, error);
      
      // Handle specific linking errors
      if (error.code === 'auth/provider-already-linked') {
        throw new Error(`${providerName.charAt(0).toUpperCase() + providerName.slice(1)} is already linked to your account.`);
      } else if (error.code === 'auth/credential-already-in-use') {
        throw new Error(`This ${providerName} account is already linked to another user.`);
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error(`The ${providerName} popup was closed. Please try again.`);
      }
      
      throw new Error(`Failed to link ${providerName}: ${error.message}`);
    }
  }

  // Sign in with a specific provider (for account linking flow)
  async signInWithProvider(providerName) {
    if (!isFirebaseInitialized) {
      throw new Error("Firebase is not initialized. Please check your Firebase configuration.");
    }
    
    try {
      let provider;
      switch (providerName) {
        case 'google':
          provider = new GoogleAuthProvider();
          provider.addScope('email');
          provider.addScope('profile');
          break;
        case 'facebook':
          provider = new FacebookAuthProvider();
          provider.addScope('email');
          provider.addScope('public_profile');
          break;
        case 'twitter':
          provider = new TwitterAuthProvider();
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          providerData: user.providerData
        },
        idToken: idToken,
        provider: providerName
      };
    } catch (error) {
      console.error(`Error signing in with ${providerName}:`, error);
      throw error;
    }
  }
}

export default new FirebasePhoneAuthService();