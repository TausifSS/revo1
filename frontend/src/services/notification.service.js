import { apiClient } from "./apiClient";
import { authService } from "./auth.service";

const mapNotification = (n) => ({
  id: n.id,
  title: getTitle(n.type),
  desc: n.message,
  time: formatTime(n.createdAt),
  type: mapType(n.type),
  unread: n.status === "PENDING",
  bookingId: n.bookingId,
  bookingCode: n.bookingCode,
  channel: n.channel,
  recipient: n.recipient,
  status: n.status,
});

const getTitle = (type) => {
  switch (type) {
    case "BOOKING_CONFIRMED":
      return "Booking Confirmed 🎉";
    case "BOOKING_CANCELLED":
      return "Booking Cancelled";
    case "PAYMENT_SUCCESS":
      return "Payment Successful 💳";
    case "REFUND_SUCCESS":
      return "Refund Successful";
    case "CHECK_IN_REMINDER":
      return "Check-in Reminder 🏨";
    default:
      return "Notification";
  }
};

const mapType = (type) => {
  switch (type) {
    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
      return "booking";

    case "PAYMENT_SUCCESS":
    case "REFUND_SUCCESS":
      return "payment";

    case "CHECK_IN_REMINDER":
      return "reminder";

    default:
      return "general";
  }
};

const formatTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();

  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Just now";

  if (diff < 3600) {
    return `${Math.floor(diff / 60)} min ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hours ago`;
  }

  if (diff < 604800) {
    return `${Math.floor(diff / 86400)} days ago`;
  }

  return date.toLocaleDateString();
};

export const notificationService = {

  async getNotifications() {
    const user = authService.getCurrentUser();

    if (!user?.id) {
      throw new Error("User is not logged in.");
    }

    const result = await apiClient.get(
      `/api/v1/notifications?userId=${user.id}`
    );

    if (!result.success) {
      throw new Error(
        result.message || "Failed to load notifications."
      );
    }

    return (result.data || []).map(mapNotification);
  },

  async getUnreadNotifications() {
    const user = authService.getCurrentUser();

    if (!user?.id) {
      throw new Error("User is not logged in.");
    }

    const result = await apiClient.get(
      `/api/v1/notifications/unread?userId=${user.id}`
    );

    if (!result.success) {
      throw new Error(
        result.message || "Failed to load unread notifications."
      );
    }

    return (result.data || []).map(mapNotification);
  },

  async markAsRead(id) {
    const result = await apiClient.patch(
      `/api/v1/notifications/${id}/read`
    );

    if (!result.success) {
      throw new Error(
        result.message || "Failed to mark notification as read."
      );
    }

    return result.data;
  },

  async markAllAsRead() {
    const user = authService.getCurrentUser();

    if (!user?.id) {
      throw new Error("User is not logged in.");
    }

    const result = await apiClient.patch(
      `/api/v1/notifications/read-all?userId=${user.id}`
    );

    if (!result.success) {
      throw new Error(
        result.message || "Failed to mark notifications as read."
      );
    }

    return result.data;
  },

  async deleteNotification(id) {
    const result = await apiClient.delete(
      `/api/v1/notifications/${id}`
    );

    if (!result.success) {
      throw new Error(
        result.message || "Failed to delete notification."
      );
    }

    return result.data;
  }
};