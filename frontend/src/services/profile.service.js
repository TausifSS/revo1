import { secureStorage } from "./secureStorage";
import { apiClient } from "./apiClient";

const USER_KEY = "reservo_user";

export const profileService = {
  async getProfile() {
    try {
      const result = await apiClient.get("/api/v1/user/profile");
      if (result && result.success && result.data) {
        const profile = {
          ...result.data,
          tier: result.data.membershipLevel || "Standard Member",
          joined: result.data.createdAt ? `Member since ${new Date(result.data.createdAt).toLocaleDateString("en-US", { month: 'long', year: 'numeric' })}` : "Member since 2026",
          points: `${result.data.rewardPoints !== undefined ? result.data.rewardPoints : 0} pts`
        };
        secureStorage.setItem(USER_KEY, profile);
        return profile;
      }
      throw new Error("Failed to load profile");
    } catch (e) {
      console.warn("Fallback to local storage profile:", e);
      return secureStorage.getItem(USER_KEY) || {
        name: "User Profile",
        email: "user@mail.in",
        phone: "+91 98765 43210",
        tier: "Standard Member",
        joined: "Member since 2026",
        points: "0 pts"
      };
    }
  },

  async updateProfile(updatedDetails) {
    try {
      const result = await apiClient.put("/api/v1/user/profile", updatedDetails);
      if (result && result.success && result.data) {
        const currentProfile = secureStorage.getItem(USER_KEY) || {};
        const profile = {
          ...currentProfile,
          ...result.data,
        };
        secureStorage.setItem(USER_KEY, profile);
        return profile;
      }
      throw new Error("Failed to update profile");
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
