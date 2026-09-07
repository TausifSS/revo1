package com.reservo.backend.service;

import com.reservo.backend.entity.Resort;
import com.reservo.backend.entity.Room;
import com.reservo.backend.exception.ResourceNotFoundException;
import com.reservo.backend.repository.ResortRepository;
import com.reservo.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {
    private final RoomRepository roomRepository;
    private final ResortRepository resortRepository;

    public List<Room> getRoomsByResort(String resortId) {
        Resort resort = resortRepository.findById(resortId)
                .orElseThrow(() -> new ResourceNotFoundException("Resort not found with ID: " + resortId));

        List<Room> rooms = roomRepository.findByResortId(resortId);

        // A published resort must always be bookable. Older/demo properties can
        // exist without a room document, so provision one safe default room on
        // first access. Availability is then open by default for every date
        // until a real booking or an explicit maintenance block exists.
        if (rooms.isEmpty()) {
            Room defaultRoom = Room.builder()
                    .resortId(resortId)
                    .roomNumber("101")
                    .roomType("Standard Room")
                    .description("Default bookable room")
                    .pricePerNight(resort.getPricePerNight() != null
                            ? resort.getPricePerNight() : java.math.BigDecimal.ZERO)
                    .capacity(resort.getGuests() != null && resort.getGuests() > 0
                            ? resort.getGuests() : 2)
                    .bedCount(resort.getBeds() != null && resort.getBeds() > 0
                            ? resort.getBeds() : 1)
                    .bedType("King")
                    .imageUrl(resort.getImageUrl())
                    .status(Room.RoomStatus.AVAILABLE)
                    .cleaningStatus(Room.CleaningStatus.CLEAN)
                    .build();

            rooms = List.of(roomRepository.save(defaultRoom));
        }

        return rooms;
    }

    public Room getRoomById(String id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));
    }

    public Room createRoom(String resortId, Room room) {
        resortRepository.findById(resortId)
                .orElseThrow(() -> new ResourceNotFoundException("Resort not found with ID: " + resortId));
        room.setResortId(resortId);
        if (room.getStatus() == null) room.setStatus(Room.RoomStatus.AVAILABLE);
        if (room.getCapacity() == null) room.setCapacity(2);
        return roomRepository.save(room);
    }

    public Room updateRoomStatus(String id, Room.RoomStatus status, String maintenance) {
        Room room = getRoomById(id);
        if (status != null) room.setStatus(status);
        if (maintenance != null) room.setDescription(maintenance);
        return roomRepository.save(room);
    }

    public Room updateRoom(String id, Room updatedDetails) {
        Room room = getRoomById(id);
        if (updatedDetails.getRoomNumber() != null) room.setRoomNumber(updatedDetails.getRoomNumber());
        if (updatedDetails.getPricePerNight() != null) room.setPricePerNight(updatedDetails.getPricePerNight());
        if (updatedDetails.getCapacity() != null) room.setCapacity(updatedDetails.getCapacity());
        if (updatedDetails.getRoomType() != null) room.setRoomType(updatedDetails.getRoomType());
        if (updatedDetails.getDescription() != null) room.setDescription(updatedDetails.getDescription());
        if (updatedDetails.getBedCount() != null) room.setBedCount(updatedDetails.getBedCount());
        if (updatedDetails.getBedType() != null) room.setBedType(updatedDetails.getBedType());
        if (updatedDetails.getImageUrl() != null) room.setImageUrl(updatedDetails.getImageUrl());
        if (updatedDetails.getStatus() != null) room.setStatus(updatedDetails.getStatus());
        return roomRepository.save(room);
    }

    public void deleteRoom(String id) {
        getRoomById(id);
        roomRepository.deleteById(id);
    }
}
