import { mockRequest } from "./api.helper";

const HOTELS_DATA = [
  {
    id: "h1",
    name: "The Grand Plaza",
    location: "Mumbai, India",
    price: 9500,
    rating: 4.8,
    reviewsCount: 142,
    heroImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "h2",
    name: "Stripe Heritage Hotel",
    location: "London, UK",
    price: 18000,
    rating: 4.9,
    reviewsCount: 89,
    heroImage: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80"
  }
];

export const hotelService = {
  async getHotels() {
    return mockRequest(HOTELS_DATA, 0.01, "Failed to load hotels data.");
  },
  async getHotelById(id) {
    const hotel = HOTELS_DATA.find(h => h.id === id) || HOTELS_DATA[0];
    return mockRequest(hotel, 0.02, `Failed to load hotel details for ID: ${id}`);
  }
};
