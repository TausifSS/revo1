import { secureStorage } from "./secureStorage";
import { apiClient } from "./apiClient";
import { resortService } from "./resort.service";

const BOOKINGS_KEY = "reservo-bookings";


const mapBackendBooking = (b, resort = null) => ({
  // IMPORTANT: booking ID and resort ID are different things.
  // The booking ID identifies the reservation; resortId identifies the property.
  id: b.id || b.bookingId,
  resortId: b.resortId,
  resortName: resort?.name || b.resort?.name || b.resortName || "Luxury Resort",
  location: resort?.location || b.resort?.location || b.resortLocation || "India",
  resortImage: resort?.image || resort?.heroImage || b.resort?.imageUrl || b.resortImage || "",
  checkin: b.checkInDate,
  checkout: b.checkOutDate,
  guests: b.guestsCount || 2,
  roomTitle: b.room ? b.room.type.replace(/_/g, " ") : (b.roomType || "Luxury Room"),
  total: b.totalAmount,
  status: b.status === "CONFIRMED" ? "Confirmed" : b.status === "CANCELLED" ? "Cancelled" : b.status,
  code: b.bookingCode,
  createdAt: b.createdAt
});

// Migration step: Migrate plain text localStorage to secureStorage if needed
const migrateBookings = () => {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (raw && !secureStorage.getItem(BOOKINGS_KEY)) {
      const parsed = JSON.parse(raw);
      secureStorage.setItem(BOOKINGS_KEY, parsed);
    }
  } catch (e) {
    console.error("Migration error:", e);
  }
};

migrateBookings();

export const bookingService = {
  async getBookings() {
    const user = secureStorage.getItem("reservo_user");
    if (!user?.id) {
      throw new Error("Please log in to view your bookings.");
    }

    const result = await apiClient.get(
      `/api/v1/bookings/my-bookings?userId=${encodeURIComponent(user.id)}`
    );

    if (!result?.success || !Array.isArray(result.data)) {
      throw new Error(result?.message || "Failed to load your bookings.");
    }

    const mapped = await Promise.all(
      result.data.map(async (booking) => {
        let resort = null;
        if (booking?.resortId) {
          try {
            resort = await resortService.getResortById(booking.resortId);
          } catch (e) {
            console.warn(`Could not load resort ${booking.resortId} for booking ${booking.id}:`, e);
          }
        }
        return mapBackendBooking(booking, resort);
      })
    );

    return mapped;
  },

  async createBooking(bookingDetails) {
    const user = secureStorage.getItem("reservo_user");
    if (!user?.id) {
      throw new Error("Please log in before creating a booking.");
    }

    const rId = bookingDetails.resortId;
    const roomId = bookingDetails.roomId;
    if (!rId || !roomId) {
      throw new Error("A valid resort and room are required.");
    }

    const result = await apiClient.post(
      `/api/v1/bookings/create?userId=${encodeURIComponent(user.id)}&resortId=${encodeURIComponent(rId)}&roomId=${encodeURIComponent(roomId)}&checkIn=${encodeURIComponent(bookingDetails.checkin)}&checkOut=${encodeURIComponent(bookingDetails.checkout)}&amount=${encodeURIComponent(bookingDetails.total)}&adults=${encodeURIComponent(bookingDetails.adults ?? 2)}&children=${encodeURIComponent(bookingDetails.children ?? 0)}&roomsCount=${encodeURIComponent(bookingDetails.roomsCount ?? 1)}&couponCode=${encodeURIComponent(bookingDetails.couponCode || "")}&discountAmount=${encodeURIComponent(bookingDetails.discountAmount ?? 0)}&pointsToRedeem=${encodeURIComponent(bookingDetails.pointsToRedeem ?? 0)}&pointsValue=${encodeURIComponent(bookingDetails.pointsValue ?? 0)}`
    );

    if (!result?.success || !result.data) {
      throw new Error(result?.message || "Failed to create booking.");
    }

    const resort = await resortService.getResortById(rId).catch(() => null);
    return mapBackendBooking(result.data, resort);
  },

  async cancelBooking(bookingId) {
    if (!bookingId) {
      throw new Error("Booking ID is required.");
    }

    const result = await apiClient.patch(
      `/api/v1/bookings/${encodeURIComponent(bookingId)}/cancel`
    );

    if (!result?.success) {
      throw new Error(result?.message || "Could not cancel booking.");
    }

    return result;
  },

  async checkAvailability(resortId, dates, guests = {}) {
    if (!resortId) throw new Error("A valid resort ID is required.");

    const checkIn = dates?.checkIn;
    const checkOut = dates?.checkOut;
    if (!checkIn || !checkOut) {
      throw new Error("Check-in and check-out dates are required.");
    }

    const adults = Math.max(1, Number(guests.adults ?? 2));
    const children = Math.max(0, Number(guests.children ?? 0));
    const requiredRooms = Math.max(
      1,
      Math.ceil(adults / 2),
      Math.ceil(children / 2),
      Number(guests.roomsCount ?? 1)
    );

    const result = await apiClient.get(
      `/api/v1/availability/check?resortId=${encodeURIComponent(resortId)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
    );

    if (!result?.success) {
      throw new Error(result?.message || "Failed to check availability.");
    }

    const rooms = Array.isArray(result.data) ? result.data.map(room => ({
      id: room.id,
      title: (room.roomType || room.type || "Room").replace(/_/g, " "),
      price: Number(room.pricePerNight || 0)
    })) : [];

    if (rooms.length < requiredRooms) {
      throw new Error(
        requiredRooms === 1
          ? "No room is available for the selected dates. Please choose different dates."
          : `Only ${rooms.length} room${rooms.length === 1 ? "" : "s"} available for these dates. You need ${requiredRooms}. Please choose different dates or reduce the number of rooms.`
      );
    }

    return {
      available: true,
      suggestedRooms: rooms,
      requiredRooms
    };
  },

  async createCheckoutSession(bookingDetails) {
    // Real payment processing is intentionally disabled. A reservation can
    // only be created directly when the final payable amount is exactly zero.
    const total = Number(bookingDetails?.total);
    if (!Number.isFinite(total) || total < 0) {
      throw new Error("Invalid booking amount.");
    }
    if (Math.round(total * 100) !== 0) {
      throw new Error("Payment module not implemented yet. Your booking was not created.");
    }

    const booking = await this.createBooking({
      ...bookingDetails,
      total: 0
    });

    return `${window.location.origin}/payment/success?bookingCode=${encodeURIComponent(booking.code || booking.id || "")}`;
  }
};
