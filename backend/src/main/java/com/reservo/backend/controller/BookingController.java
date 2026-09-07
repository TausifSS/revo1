package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.dto.BookingHistoryResponse;
import com.reservo.backend.entity.Booking;
import com.reservo.backend.entity.User;
import com.reservo.backend.exception.UnauthorizedException;
import com.reservo.backend.service.AuthService;
import com.reservo.backend.service.BookingService;
import com.reservo.backend.repository.UserRepository;
import com.reservo.backend.repository.ResortRepository;
import com.reservo.backend.repository.RoomRepository;
import com.reservo.backend.entity.Resort;
import com.reservo.backend.entity.Room;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final ResortRepository resortRepository;
    private final RoomRepository roomRepository;

    private String resolveEffectiveUserId(String requestedUserId) {
        Optional<User> authUser = authService.getOptionalAuthenticatedUser();
        if (authUser.isPresent()) {
            User user = authUser.get();
            if (user.getRole() == User.Role.ROLE_ADMIN) {
                return (requestedUserId != null && !requestedUserId.isBlank()) ? requestedUserId : user.getId();
            }
            return user.getId();
        }
        if (requestedUserId != null && !requestedUserId.isBlank()) {
            return requestedUserId;
        }
        throw new UnauthorizedException("Authentication required to perform booking operations");
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Booking>> createBooking(
            @RequestParam(required = false) String userId,
            @RequestParam String resortId,
            @RequestParam String roomId,
            @RequestParam String checkIn,
            @RequestParam String checkOut,
            @RequestParam BigDecimal amount,
            @RequestParam(defaultValue = "2") int adults,
            @RequestParam(defaultValue = "0") int children,
            @RequestParam(defaultValue = "1") int roomsCount,
            @RequestParam(required = false) String couponCode,
            @RequestParam(defaultValue = "0") BigDecimal discountAmount,
            @RequestParam(defaultValue = "0") int pointsToRedeem,
            @RequestParam(defaultValue = "0") BigDecimal pointsValue) {
        String effectiveUserId = resolveEffectiveUserId(userId);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) != 0) {
            return ResponseEntity.status(501)
                    .body(ApiResponse.error(
                            "Payment module not implemented yet. Your booking was not created.",
                            501));
        }

        Booking booking = bookingService.createBooking(
                effectiveUserId, resortId, roomId,
                LocalDate.parse(checkIn), LocalDate.parse(checkOut),
                amount, null, null, couponCode, discountAmount, pointsToRedeem, pointsValue,
                adults, children, roomsCount);
        // Only zero-total bookings may be confirmed without payment.
        bookingService.confirmBooking(booking.getBookingCode(), "FREE_" + System.currentTimeMillis(), "ZERO_TOTAL");
        return ResponseEntity.ok(ApiResponse.success(booking, "Booking created and confirmed successfully"));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<ApiResponse<List<Booking>>> getUserBookings(@RequestParam(required = false) String userId) {
        String effectiveUserId = resolveEffectiveUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(bookingService.getUserBookings(effectiveUserId)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<BookingHistoryResponse>>> getBookingHistory(
            @RequestParam(required = false) String userId
    ) {
        String effectiveUserId = resolveEffectiveUserId(userId);
        return ResponseEntity.ok(
                ApiResponse.success(
                        bookingService.getUserBookingHistory(effectiveUserId),
                        "Booking history retrieved successfully"
                )
        );
    }

    @GetMapping("/admin-all")
    public ResponseEntity<ApiResponse<List<Booking>>> getAdminAllBookings() {
        return ResponseEntity.ok(ApiResponse.success(bookingService.getAllBookings()));
    }

    /**
     * Bookings for properties owned by the currently authenticated owner.
     * No ownerId is accepted from the client, preventing one owner from
     * requesting another owner's reservations.
     */
    @GetMapping("/owner-bookings")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOwnerBookings() {
        User user = authService.getOptionalAuthenticatedUser()
                .orElseThrow(() -> new UnauthorizedException("Authentication required"));

        if (user.getRole() != User.Role.ROLE_OWNER
                && user.getRole() != User.Role.ROLE_ADMIN) {
            throw new UnauthorizedException("Only property owners can access owner bookings");
        }

        List<Booking> bookings = bookingService.getOwnerBookings(user.getId());
        List<Map<String, Object>> enriched = new ArrayList<>();

        for (Booking booking : bookings) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", booking.getId());
            item.put("bookingId", booking.getId());
            item.put("bookingCode", booking.getBookingCode());
            item.put("userId", booking.getUserId());
            item.put("resortId", booking.getResortId());
            item.put("roomId", booking.getRoomId());
            item.put("checkInDate", booking.getCheckInDate());
            item.put("checkOutDate", booking.getCheckOutDate());
            item.put("guestsCount", booking.getGuestsCount());
            item.put("roomsCount", booking.getRoomsCount());
            item.put("totalAmount", booking.getTotalAmount());
            item.put("guestName", booking.getGuestName());
            item.put("guestPhone", booking.getGuestPhone());
            item.put("appliedCouponCode", booking.getAppliedCouponCode());
            item.put("discountAmount", booking.getDiscountAmount());
            item.put("rewardPointsUsed", booking.getRewardPointsUsed());
            item.put("rewardPointsValue", booking.getRewardPointsValue());
            item.put("status", booking.getStatus());
            item.put("bookingSource", booking.getBookingSource());
            item.put("createdAt", booking.getCreatedAt());

            userRepository.findById(booking.getUserId()).ifPresent(guest -> {
                item.put("guestName", booking.getGuestName() != null && !booking.getGuestName().isBlank()
                        ? booking.getGuestName() : guest.getName());
                item.put("guestEmail", guest.getEmail());
                item.put("guestPhone", booking.getGuestPhone() != null && !booking.getGuestPhone().isBlank()
                        ? booking.getGuestPhone() : guest.getPhone());
                item.put("guestCountry", "India");
                item.put("guestAvatar", guest.getAvatarUrl());
            });

            resortRepository.findById(booking.getResortId()).ifPresent(resort -> {
                item.put("resortName", resort.getName());
                item.put("resortLocation", resort.getLocation());
                item.put("resortImage", resort.getImageUrl());
            });

            roomRepository.findById(booking.getRoomId()).ifPresent(room -> {
                item.put("roomType", room.getRoomType());
                item.put("roomNumber", room.getRoomNumber());
            });

            enriched.add(item);
        }

        return ResponseEntity.ok(
                ApiResponse.success(enriched, "Owner bookings retrieved successfully")
        );
    }

    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<Booking>> cancelBooking(
            @PathVariable String bookingId) {

        User user = authService.getOptionalAuthenticatedUser()
                .orElseThrow(() -> new UnauthorizedException("Authentication required"));

        Booking cancelled = bookingService.cancelBookingForUser(bookingId, user.getId());

        return ResponseEntity.ok(
                ApiResponse.success(cancelled, "Booking cancelled successfully")
        );
    }

    /**
     * Host-side cancellation. The backend verifies property ownership before
     * releasing the booking and its room/night availability locks.
     */
    @PatchMapping("/owner/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<Booking>> cancelBookingByOwner(
            @PathVariable String bookingId) {
        User user = authService.getOptionalAuthenticatedUser()
                .orElseThrow(() -> new UnauthorizedException("Authentication required"));

        if (user.getRole() != User.Role.ROLE_OWNER && user.getRole() != User.Role.ROLE_ADMIN) {
            throw new UnauthorizedException("Only property owners can cancel guest bookings");
        }

        Booking cancelled = bookingService.cancelBookingForOwner(bookingId, user.getId(), user.getRole() == User.Role.ROLE_ADMIN);
        return ResponseEntity.ok(
                ApiResponse.success(cancelled, "Booking cancelled successfully")
        );
    }

    @PostMapping("/update-status")
    public ResponseEntity<ApiResponse<Booking>> updateBookingStatus(
            @RequestParam String bookingId,
            @RequestParam Booking.BookingStatus status) {
        Booking updated = bookingService.updateBookingStatus(bookingId, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Booking status updated successfully"));
    }
}
