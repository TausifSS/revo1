// Firebase Configuration
// Get these from Firebase Console -> Project Settings -> General -> Your Apps -> Web App
// These values are loaded from environment variables

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDl8_aAH-EoL7mOnLpHQYE0maIW8lpW4LI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "reservo-de8ec.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "reservo-de8ec",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "reservo-de8ec.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "452998198059",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:452998198059:web:116c7ed562568d2dbb0b6e"
};

export default firebaseConfig;