package com.reservo.backend.service;

import com.reservo.backend.entity.Booking;
import com.reservo.backend.entity.Room;
import com.reservo.backend.repository.BookingRepository;
import com.reservo.backend.repository.RoomRepository;
import com.reservo.backend.repository.AvailabilityBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final RoomService roomService;
    private final AvailabilityBlockRepository availabilityBlockRepository;

    public List<Room> checkAvailability(String resortId, LocalDate checkIn, LocalDate checkOut) {
        // Use the same room-loading path as the booking flow so legacy/demo
        // resorts without a room document are provisioned with one default
        // AVAILABLE room instead of appearing unavailable.
        List<Room> allRooms = roomService.getRoomsByResort(resortId);
        if (checkIn == null || checkOut == null || !checkIn.isBefore(checkOut)) {
            throw new IllegalArgumentException("Check-in must be before check-out");
        }

        // A host block makes every room in the property unavailable for the
        // affected night(s). Check every night in the requested stay.
        for (LocalDate date = checkIn; date.isBefore(checkOut); date = date.plusDays(1)) {
            if (availabilityBlockRepository.isBlocked(resortId, date)) {
                return List.of();
            }
        }

        List<Booking> overlapping = bookingRepository.findOverlappingBookings(resortId, checkIn, checkOut);

        Set<String> occupiedRoomIds = overlapping.stream()
                .flatMap(booking -> {
                    if (booking.getAssignedRoomIds() != null && !booking.getAssignedRoomIds().isEmpty()) {
                        return booking.getAssignedRoomIds().stream();
                    }
                    return java.util.stream.Stream.ofNullable(booking.getRoomId());
                })
                .filter(java.util.Objects::nonNull)
                .map(String::valueOf)
                .collect(Collectors.toSet());

        return allRooms.stream()
                .filter(r -> r.getId() != null)
                .filter(r -> !occupiedRoomIds.contains(String.valueOf(r.getId())))
                .filter(r -> r.getStatus() == Room.RoomStatus.AVAILABLE)
                .toList();
    }

    public void setDateBlocked(String resortId, LocalDate date, boolean blocked) {
        if (blocked) availabilityBlockRepository.block(resortId, date);
        else availabilityBlockRepository.unblock(resortId, date);
    }

    public boolean isDateBlocked(String resortId, LocalDate date) {
        return availabilityBlockRepository.isBlocked(resortId, date);
    }
}
