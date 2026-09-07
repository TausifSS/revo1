import { apiClient } from "./apiClient";

export const rewardService = {
  async getRewardStatus() {
    const result = await apiClient.get("/api/v1/rewards/status");
    if (result && result.success) {
      return result.data;
    }
    throw new Error(result?.message || "Failed to load rewards stats.");
  },

  async redeemPoints(pointsToRedeem) {
    const result = await apiClient.post(`/api/v1/rewards/redeem?points=${pointsToRedeem}`);
    if (result && result.success) {
      // Synchronize full state including updated points, coupons count, and history
      const updatedStatus = await this.getRewardStatus();
      return {
        updatedPoints: updatedStatus.points,
        couponsCount: updatedStatus.couponsCount
      };
    }
    throw new Error(result?.message || "Failed to redeem points.");
  },

  async validateCoupon(code, resortId, amount) {
    let url = `/api/v1/rewards/validate?code=${encodeURIComponent(code)}`;
    if (resortId) url += `&resortId=${resortId}`;
    if (amount) url += `&amount=${amount}`;
    const result = await apiClient.get(url);
    if (result && result.success) {
      return result.data;
    }
    throw new Error(result?.message || "Invalid coupon code.");
  }
};
