import { apiClient } from "./apiClient";

export const reviewService = {
  async getReviewsForResort(resortId) {
    try {
      const result = await apiClient.get(`/api/v1/reviews/resort/${resortId}`);
      if (result && result.success && result.data) {
        return result.data.map(item => ({
          id: "rev-" + item.id,
          author: item.user ? item.user.name : "Anonymous Traveller",
          rating: item.rating,
          date: new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          content: item.comment
        }));
      }
      throw new Error("Failed to load reviews");
    } catch (e) {
      console.warn("Fallback to mock reviews:", e);
      return [
        {
          id: "rev-1",
          author: "Amit Patel",
          rating: 5,
          date: "July 24, 2026",
          content: "An absolute dream. The Rivo AI planner made organizing our day trips completely effortless. The room was pristine, and the views were breathtaking."
        },
        {
          id: "rev-2",
          author: "Jessica M.",
          rating: 4.8,
          date: "June 12, 2026",
          content: "Outstanding hospitality. The staff was incredibly welcoming, and the beachfront access was wonderful. Highly recommend the sunset villas."
        }
      ];
    }
  },

  async addReview(resortId, review) {
    try {
      const body = {
        rating: review.rating,
        comment: review.content
      };
      const result = await apiClient.post(`/api/v1/reviews/resort/${resortId}`, body);
      if (result && result.success && result.data) {
        const item = result.data;
        return {
          id: "rev-" + item.id,
          author: item.user ? item.user.name : "Guest User",
          rating: item.rating,
          date: new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          content: item.comment
        };
      }
      throw new Error("Failed to post review");
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
