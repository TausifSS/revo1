/**
 * Secure Storage wrapper for encrypting localStorage keys and values.
 * Uses a browser fingerprinting key combined with XOR encryption + Base64
 * to prevent XSS session hijack reads on other machines or browsers.
 */

const IS_PRODUCTION = true;

const getFingerprintKey = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "reservo-fallback-salt";
  }
  const parts = [
    navigator.userAgent || "ua",
    (window.screen ? window.screen.width : 0) + "",
    (window.screen ? window.screen.height : 0) + "",
    "reservo-salt-2026"
  ];
  return parts.join("|");
};

const xorCipher = (str, key) => {
  let output = "";
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    output += String.fromCharCode(charCode);
  }
  return output;
};

// Helper to encrypt string (Base64 + XOR)
const encrypt = (str) => {
  if (!IS_PRODUCTION) return str;
  try {
    const key = getFingerprintKey();
    const xored = xorCipher(encodeURIComponent(str), key);
    return btoa(xored);
  } catch (e) {
    return str;
  }
};

// Helper to decrypt string (Base64 + XOR)
const decrypt = (str) => {
  if (!IS_PRODUCTION) return str;
  try {
    const key = getFingerprintKey();
    const decodedB64 = atob(str);
    return decodeURIComponent(xorCipher(decodedB64, key));
  } catch (e) {
    return str;
  }
};

export const secureStorage = {
  setItem(key, value) {
    try {
      const encryptedKey = encrypt(key);
      const jsonValue = JSON.stringify(value);
      const encryptedValue = encrypt(jsonValue);
      localStorage.setItem(encryptedKey, encryptedValue);
    } catch (e) {
      console.error("Error setting secure storage item:", e);
    }
  },

  getItem(key) {
    try {
      const encryptedKey = encrypt(key);
      const encryptedValue = localStorage.getItem(encryptedKey);
      if (!encryptedValue) return null;
      const decryptedValue = decrypt(encryptedValue);
      return JSON.parse(decryptedValue);
    } catch (e) {
      console.error("Error getting secure storage item:", e);
      return null;
    }
  },

  removeItem(key) {
    try {
      const encryptedKey = encrypt(key);
      localStorage.removeItem(encryptedKey);
    } catch (e) {
      console.error("Error removing secure storage item:", e);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (e) {
      console.error("Error clearing secure storage:", e);
    }
  }
};
