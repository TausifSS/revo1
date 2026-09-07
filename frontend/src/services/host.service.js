import { apiClient } from "./apiClient";
// Host Service for Reservo Web App

const HOST_STORAGE_KEY = "reservo_host_data_v2";

const INITIAL_HOST_DATA = {
  profile: {
    hostId: "HOST-89421",
    name: "Resort Owner",
    email: "owner@reservo.com",
    phone: "+91 98450 12345",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    isSuperhost: false,
    rating: 0,
    totalReviews: 0,
    responseTime: "N/A",
    responseRate: "N/A",
    joinedDate: "August 2026",
    kycVerified: true,
    coHosts: []
  },
  listings: [],
  reservations: [],
  blockedDates: {},
  customPricing: {},
  messages: [],
  reviews: [],
  financials: {
    totalRevenue: 0,
    monthRevenue: 0,
    lastMonthRevenue: 0,
    occupancyRate: 0,
    projectedNextMonth: 0,
    payouts: [],
    payoutMethods: [
      { id: "pm-1", type: "Bank Account", title: "Bank Account", details: "A/C: ****4910 • IFSC: HDFC000124", isPrimary: true }
    ]
  },
  confirmationLogs: []
};

export const hostService = {
  hasPublishedListing: () => {
    const data = hostService.getData();
    return (data?.listings || []).length > 0;
  },

  getData: () => {
    try {
      const stored = localStorage.getItem(HOST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.profile) {
          try {
            const rawUser = localStorage.getItem("reservo_user");
            if (rawUser) {
              const user = JSON.parse(rawUser);
              parsed.profile.name = user.name || "Resort Owner";
              parsed.profile.email = user.email || "owner@reservo.com";
            }
          } catch (e) {}
        }
        if (!parsed.confirmationLogs) {
          parsed.confirmationLogs = [];
        }
        if (!parsed.blockedDates) {
          parsed.blockedDates = {};
        }
        if (!parsed.customPricing) {
          parsed.customPricing = {};
        }
        return parsed;
      }
    } catch (e) {
      console.error("Error loading host data from storage:", e);
    }
    localStorage.setItem(HOST_STORAGE_KEY, JSON.stringify(INITIAL_HOST_DATA));
    return INITIAL_HOST_DATA;
  },

  saveData: (data) => {
    try {
      localStorage.setItem(HOST_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new Event("reservo-host-data-updated"));
    } catch (e) {
      console.error("Error saving host data:", e);
    }
  },

  addListing: (listing) => {
    const data = hostService.getData();
    const listingWithId = {
      ...listing,
      id: String(listing.id),
      status: listing.status || "PENDING_APPROVAL"
    };
    data.listings = [listingWithId, ...(data.listings || []).filter(item => String(item.id) !== String(listingWithId.id))];
    hostService.saveData(data);
    return listingWithId;
  },

  deleteListing: (listingId) => {
    const data = hostService.getData();
    data.listings = (data.listings || []).filter(item => String(item.id) !== String(listingId));
    data.reservations = (data.reservations || []).filter(item => String(item.listingId) !== String(listingId));
    hostService.saveData(data);
    if (data.listings.length === 0) {
      localStorage.removeItem("reservo_user_has_published");
    } else {
      localStorage.setItem("reservo_user_has_published", "true");
    }
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("reservo-host-data-updated"));
    return data.listings;
  },

  updateListingStatus: (listingId, newStatus) => {
    const data = hostService.getData();
    data.listings = data.listings.map(item => 
      item.id === listingId ? { ...item, status: newStatus } : item
    );
    hostService.saveData(data);
    return data.listings;
  },

  updateListingPrice: (listingId, newPrice) => {
    const data = hostService.getData();
    data.listings = data.listings.map(item => 
      item.id === listingId ? { ...item, pricePerNight: Number(newPrice) } : item
    );
    hostService.saveData(data);
    return data.listings;
  },

  toggleInstantBook: (listingId) => {
    const data = hostService.getData();
    data.listings = data.listings.map(item => 
      item.id === listingId ? { ...item, instantBook: !item.instantBook } : item
    );
    hostService.saveData(data);
    return data.listings;
  },

  approveReservation: (resId) => {
    const data = hostService.getData();
    data.reservations = data.reservations.map(res => 
      res.id === resId ? { ...res, status: "Upcoming", paymentStatus: "Escrow Secured" } : res
    );
    hostService.saveData(data);
    return data.reservations;
  },

  declineReservation: (resId) => {
    const data = hostService.getData();
    data.reservations = data.reservations.map(res => 
      res.id === resId ? { ...res, status: "Cancelled", paymentStatus: "Refunded to Guest" } : res
    );
    hostService.saveData(data);
    return data.reservations;
  },

  updateStayStatus: (resId, newStatus) => {
    const data = hostService.getData();
    data.reservations = data.reservations.map(res => 
      res.id === resId ? { ...res, status: newStatus } : res
    );
    hostService.saveData(data);
    return data.reservations;
  },

  cancelBooking: async (reservationId) => {
    if (!reservationId) throw new Error("Booking ID is required.");

    const result = await apiClient.patch(
      `/api/v1/bookings/owner/${encodeURIComponent(reservationId)}/cancel`
    );

    if (!result?.success) {
      throw new Error(result?.message || "Could not cancel booking.");
    }

    return result.data;
  },

  toggleDateBlock: async (listingId, dateStr) => {
    const data = hostService.getData();
    if (!data.blockedDates[listingId]) data.blockedDates[listingId] = [];
    const exists = data.blockedDates[listingId].includes(dateStr);
    const blocked = !exists;

    // Persist the block in the backend. The customer booking API also checks
    // this collection, so a host block cannot be bypassed by the public UI.
    const result = await apiClient.post(
      `/api/v1/availability/block?resortId=${encodeURIComponent(listingId)}&date=${encodeURIComponent(dateStr)}&blocked=${blocked}`
    );
    if (!result?.success) {
      throw new Error(result?.message || "Could not update availability.");
    }

    if (exists) {
      data.blockedDates[listingId] = data.blockedDates[listingId].filter(d => d !== dateStr);
    } else {
      data.blockedDates[listingId].push(dateStr);
    }
    hostService.saveData(data);
    return data.blockedDates[listingId];
  },

  setCustomPriceForDate: (listingId, dateStr, price) => {
    const data = hostService.getData();
    if (!data.customPricing[listingId]) {
      data.customPricing[listingId] = {};
    }
    if (price <= 0 || price === null) {
      delete data.customPricing[listingId][dateStr];
    } else {
      data.customPricing[listingId][dateStr] = Number(price);
    }
    hostService.saveData(data);
    return data.customPricing[listingId];
  },

  replyToReview: (reviewId, replyText) => {
    const data = hostService.getData();
    data.reviews = data.reviews.map(rev => 
      rev.id === reviewId ? { ...rev, response: replyText } : rev
    );
    hostService.saveData(data);
    return data.reviews;
  },

  sendMessage: (threadId, text) => {
    const data = hostService.getData();
    data.messages = data.messages.map(thread => {
      if (thread.id === threadId) {
        const newMsg = {
          sender: "host",
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...thread,
          lastMessage: text,
          lastTime: "Just now",
          unread: false,
          history: [...thread.history, newMsg]
        };
      }
      return thread;
    });
    hostService.saveData(data);
    return data.messages;
  },

  addPayoutMethod: (method) => {
    const data = hostService.getData();
    const newMethod = {
      id: `pm-${Date.now()}`,
      ...method,
      isPrimary: data.financials.payoutMethods.length === 0
    };
    data.financials.payoutMethods.push(newMethod);
    hostService.saveData(data);
    return data.financials.payoutMethods;
  },

  sendBookingConfirmation: (reservationId, options = {}) => {
    const { 
      sendEmail = true, 
      sendMessage = true, 
      templateTitle = "Royal Welcome & Keyless Access", 
      customNote = "", 
      accessCode = "" 
    } = options;

    const data = hostService.getData();
    const nowStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + 
                   " at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let targetReservation = null;

    data.reservations = data.reservations.map(res => {
      if (res.id === reservationId) {
        targetReservation = res;
        const currentConfirmation = res.confirmationSent || {};
        const assignedCode = accessCode || res.accessCode || `VS-${Math.floor(1000 + Math.random() * 9000)}#`;
        return {
          ...res,
          accessCode: assignedCode,
          confirmationSent: {
            email: sendEmail ? true : currentConfirmation.email || false,
            message: sendMessage ? true : currentConfirmation.message || false,
            emailSentAt: sendEmail ? nowStr : currentConfirmation.emailSentAt || null,
            messageSentAt: sendMessage ? nowStr : currentConfirmation.messageSentAt || null,
            lastTemplate: templateTitle
          }
        };
      }
      return res;
    });

    if (targetReservation) {
      let typeLabel = "Email Voucher";
      if (sendEmail && sendMessage) typeLabel = "Email & SMS";
      else if (sendMessage) typeLabel = "SMS / In-App Message";

      const finalCode = accessCode || targetReservation.accessCode || "VS-8942#";

      const newLog = {
        id: `NOTIF-${Date.now()}`,
        reservationId: targetReservation.id,
        guestName: targetReservation.guest?.name || "Valued Guest",
        guestEmail: targetReservation.guest?.email || "",
        guestPhone: targetReservation.guest?.phone || "",
        propertyTitle: targetReservation.listingTitle || "Luxury Stay",
        type: typeLabel,
        template: templateTitle,
        sentAt: nowStr,
        status: "Delivered",
        accessCode: finalCode
      };

      if (!data.confirmationLogs) data.confirmationLogs = [];
      data.confirmationLogs = [newLog, ...data.confirmationLogs];

      if (sendMessage) {
        const matchingThread = data.messages?.find(m => m.reservationId === targetReservation.id);
        const confirmMsgText = `✨ Booking Confirmation Dispatched!\nDear ${targetReservation.guest?.name?.split(" ")[0] || "Guest"}, your stay at ${targetReservation.listingTitle} (${targetReservation.dates?.checkIn} to ${targetReservation.dates?.checkOut}) is confirmed and fully paid. Your keyless access code is ${finalCode}.${customNote ? `\nHost Note: "${customNote}"` : ""}`;

        if (matchingThread) {
          data.messages = data.messages.map(thread => {
            if (thread.id === matchingThread.id) {
              const newMsg = {
                sender: "host",
                text: confirmMsgText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              return {
                ...thread,
                lastMessage: "✨ Booking Confirmation Dispatched",
                lastTime: "Just now",
                unread: false,
                history: [...thread.history, newMsg]
              };
            }
            return thread;
          });
        }
      }
    }

    hostService.saveData(data);
    return data;
  },

  resetToDefault: () => {
    localStorage.setItem(HOST_STORAGE_KEY, JSON.stringify(INITIAL_HOST_DATA));
    window.dispatchEvent(new Event("reservo-host-data-updated"));
    return INITIAL_HOST_DATA;
  }
};
