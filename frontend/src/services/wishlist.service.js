import { secureStorage } from "./secureStorage";
import { apiClient } from "./apiClient";

const WISHLIST_KEY = "reservo-wishlist";

export const wishlistService = {
  async getWishlist() {
    try {
      const result = await apiClient.get("/api/v1/wishlist");
      if (result && result.success && result.data) {
        const mapped = result.data.map(item => ({
          id: item.resort.id,
          name: item.resort.name,
          location: item.resort.location,
          price: item.resort.pricePerNight,
          image: item.resort.imageUrl
        }));
        secureStorage.setItem(WISHLIST_KEY, mapped);
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(mapped));
        return mapped;
      }
      throw new Error("Failed to fetch wishlist");
    } catch (e) {
      console.warn("Fallback to local storage wishlist:", e);
      return secureStorage.getItem(WISHLIST_KEY) || [];
    }
  },

  async toggleWishlist(resort) {
    try {
      const result = await apiClient.post(`/api/v1/wishlist/toggle/${resort.id}`);
      if (result && result.success) {
        const updated = await this.getWishlist();
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("wishlist-updated"));
        return updated;
      }
      throw new Error("Failed to toggle wishlist item");
    } catch (e) {
      console.warn("Fallback local toggle on error:", e);
      let list = secureStorage.getItem(WISHLIST_KEY) || [];
      const exists = list.some((item) => item.id === resort.id);
      if (exists) {
        list = list.filter((item) => item.id !== resort.id);
      } else {
        list.push({
          id: resort.id,
          name: resort.name,
          location: resort.location,
          price: resort.price || resort.pricePerNight,
          image: resort.heroImage || resort.image || resort.imageUrl
        });
      }
      secureStorage.setItem(WISHLIST_KEY, list);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("wishlist-updated"));
      return list;
    }
  }
};
