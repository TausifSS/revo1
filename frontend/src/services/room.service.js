import { apiClient } from "./apiClient";

export const roomService = {
  async getRoomsByResort(resortId) {
    const result = await apiClient.get(`/api/v1/rooms/resort/${resortId}`);
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error(result?.message || "Failed to fetch resort rooms");
  },

  async createRoom(resortId, room) {
    const result = await apiClient.post(`/api/v1/rooms/resort/${resortId}`, room);
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error(result?.message || "Failed to create room");
  },

  async updateRoom(roomId, room) {
    const result = await apiClient.put(`/api/v1/rooms/${roomId}`, room);
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error(result?.message || "Failed to update room details");
  },

  async updateRoomStatus(roomId, status, cleaningStatus, maintenanceDetails) {
    const result = await apiClient.patch(`/api/v1/rooms/${roomId}/status`, {
      status,
      cleaningStatus,
      maintenanceDetails
    });
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error(result?.message || "Failed to update room status");
  },

  async deleteRoom(roomId) {
    const result = await apiClient.delete(`/api/v1/rooms/${roomId}`);
    if (result && result.success) {
      return true;
    }
    throw new Error(result?.message || "Failed to delete room");
  }
};
