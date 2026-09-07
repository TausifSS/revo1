package com.reservo.backend.service;

import com.reservo.backend.dto.BookingHistoryResponse;
import com.reservo.backend.entity.*;
import com.reservo.backend.exception.ResourceNotFoundException;
import com.reservo.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final AvailabilityBlockRepository availabilityBlockRepository;
    private final UserRepository userRepository;
    private final ResortRepository resortRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final StripeService stripeService;
    private final LoyaltyService loyaltyService;
    private final NotificationService notificationService;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;

    /**
     * Canonical pre-discount booking price used by both the UI and checkout.
     * The resort's published nightly price is the single price source.
     */
    public BigDecimal calculateBaseBookingAmount(
            String resortId, String roomId,
            LocalDate checkIn, LocalDate checkOut) {
        return calculateBaseBookingAmount(resortId, roomId, checkIn, checkOut, 1);
    }

    public BigDecimal calculateBaseBookingAmount(
            String resortId, String roomId,
            LocalDate checkIn, LocalDate checkOut, int roomsCount) {

        Resort resort = getResort(resortId);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + roomId));

        if (room.getResortId() != null && !room.getResortId().equals(resortId)) {
            throw new IllegalStateException("Room does not belong to the selected resort.");
        }

        validateDatesAndAmount(checkIn, checkOut, BigDecimal.ZERO);

        long nights = java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut);
        int rooms = Math.max(1, roomsCount);

        // One simple customer-facing price: nightly rate × nights × rooms.
        // No cleaning fee, luxury/service fee, or tax is added here.
        BigDecimal nightly = resort.getPricePerNight();
        if (nightly == null || nightly.compareTo(BigDecimal.ZERO) < 0) {
            nightly = room.getPricePerNight();
        }
        if (nightly == null || nightly.compareTo(BigDecimal.ZERO) < 0) {
            nightly = BigDecimal.ZERO;
        }

        return nightly.multiply(BigDecimal.valueOf(nights))
                .multiply(BigDecimal.valueOf(rooms));
    }

    public Booking createBooking(
            String userId, String resortId, String roomId,
            LocalDate checkIn, LocalDate checkOut, BigDecimal amount,
            String guestName, String guestPhone, String couponCode,
            BigDecimal discountAmount, Integer pointsUsed, BigDecimal pointsValue) {
        return createBooking(userId, resortId, roomId, checkIn, checkOut, amount,
                guestName, guestPhone, couponCode, discountAmount, pointsUsed, pointsValue,
                2, 0, 1);
    }

    public Booking createBooking(
            String userId, String resortId, String roomId,
            LocalDate checkIn, LocalDate checkOut, BigDecimal amount,
            String guestName, String guestPhone, String couponCode,
            BigDecimal discountAmount, Integer pointsUsed, BigDecimal pointsValue,
            int adults, int children, int roomsCount) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        Resort resort = resortRepository.findById(resortId)
                .orElseThrow(() -> new ResourceNotFoundException("Resort not found with ID: " + resortId));
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + roomId));

        validateDatesAndAmount(checkIn, checkOut, amount);

        if (room.getResortId() != null && !room.getResortId().equals(resortId)) {
            throw new IllegalStateException("Room does not belong to the selected resort.");
        }

        int safeAdults = Math.max(1, adults);
        int safeChildren = Math.max(0, children);
        int requiredRoomsByGuests = Math.max(
                (int) Math.ceil(safeAdults / 2.0),
                (int) Math.ceil(safeChildren / 2.0)
        );
        int requestedRooms = Math.max(requiredRoomsByGuests, roomsCount);

        // The backend is the final authority for the nightly × nights × rooms
        // amount. A non-zero amount cannot be booked without a payment module.
        BigDecimal expectedBase = calculateBaseBookingAmount(
                resortId, roomId, checkIn, checkOut, requestedRooms);

        BigDecimal safeDiscount = BigDecimal.ZERO;
        if (couponCode != null && !couponCode.isBlank()) {
            var coupon = loyaltyService.validateCoupon(
                    user.getEmail(), couponCode, resortId, expectedBase);
            safeDiscount = coupon.getCalculatedDiscount() != null
                    ? coupon.getCalculatedDiscount().max(BigDecimal.ZERO)
                    : BigDecimal.ZERO;
        }

        BigDecimal requestedPointsValue = BigDecimal.ZERO;
        int safePointsUsed = Math.max(0, pointsUsed == null ? 0 : pointsUsed);
        if (safePointsUsed > 0) {
            int balance = user.getRewardPoints() == null ? 0 : user.getRewardPoints();
            if (safePointsUsed > balance) {
                throw new IllegalStateException("You do not have enough Reservo points.");
            }
            BigDecimal remainingAfterCoupon = expectedBase.subtract(safeDiscount).max(BigDecimal.ZERO);
            BigDecimal maxPointsValue = remainingAfterCoupon.multiply(BigDecimal.valueOf(0.5));
            requestedPointsValue = BigDecimal.valueOf(safePointsUsed)
                    .divide(BigDecimal.TEN, 2, java.math.RoundingMode.DOWN)
                    .min(maxPointsValue);
        }

        // Ignore client-supplied discount/points values. They are verified
        // against the same server-side coupon and loyalty rules used by the UI.
        BigDecimal safePointsValue = requestedPointsValue;
        BigDecimal expectedFinal = expectedBase.subtract(safeDiscount).subtract(safePointsValue)
                .max(BigDecimal.ZERO);

        if (amount == null || amount.compareTo(expectedFinal) != 0) {
            throw new IllegalArgumentException(
                    "The booking amount is out of date. Please return to the booking summary and try again.");
        }

        if (amount.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException(
                    "Payment module not implemented yet. Your booking was not created.");
        }

        String code = "RS" + UUID.randomUUID().toString().replace("-", "")
                .substring(0, 8).toUpperCase();

        Booking booking = Booking.builder()
                .bookingCode(code)
                .userId(userId)
                .resortId(resortId)
                .roomId(roomId)
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .guestsCount(safeAdults + safeChildren)
                .roomsCount(requestedRooms)
                .totalAmount(amount)
                .guestName(guestName)
                .guestPhone(guestPhone)
                .appliedCouponCode(couponCode)
                .discountAmount(safeDiscount)
                .rewardPointsUsed(safePointsUsed)
                .rewardPointsValue(safePointsValue)
                .status(Booking.BookingStatus.PENDING)
                .bookingSource(Booking.BookingSource.DIRECT)
                .createdAt(Instant.now())
                .build();

        // Atomically select and lock all requested rooms for every night.
        return bookingRepository.createIfAvailable(
                booking,
                roomRepository.findByResortId(resortId).stream()
                        .filter(r -> r.getId() != null)
                        .filter(r -> r.getStatus() == Room.RoomStatus.AVAILABLE)
                        .map(Room::getId)
                        .toList()
        );
    }

    public Booking confirmBooking(String bookingCode, String paymentIntentId, String paymentMethod) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with code: " + bookingCode));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) return booking;

        User user = getUser(booking.getUserId());
        Resort resort = getResort(booking.getResortId());

        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);

        // A zero-total booking is fully comped. It must not create a
        // payment record or invoke/pretend to invoke a payment gateway.
        if (booking.getTotalAmount() != null
                && booking.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
            Payment payment = Payment.builder()
                    .transactionId(paymentIntentId)
                    .bookingId(booking.getId())
                    .amount(booking.getTotalAmount())
                    .paymentMethod(paymentMethod != null ? paymentMethod : "STRIPE")
                    .status(Payment.PaymentStatus.SUCCESS)
                    .createdAt(Instant.now())
                    .build();
            paymentRepository.save(payment);
        }

        loyaltyService.awardPoints(user, booking.getTotalAmount());

        int used = booking.getRewardPointsUsed() != null ? booking.getRewardPointsUsed() : 0;
        if (used > 0) {
            user.setRewardPoints(Math.max(0, user.getRewardPoints() - used));
            userRepository.save(user);

            LoyaltyTransaction tx = LoyaltyTransaction.builder()
                    .userId(user.getId())
                    .description("Points Redeemed for Booking " + booking.getBookingCode())
                    .pointsChange(-used)
                    .createdAt(Instant.now())
                    .build();
            loyaltyTransactionRepository.save(tx);
        }

        try {
            emailService.sendBookingConfirmationEmail(
                    user.getEmail(), user.getName(), booking.getBookingCode(),
                    resort.getName(), booking.getTotalAmount().toString());
        } catch (Exception e) {
            log.error("Failed to send booking confirmation email: {}", e.getMessage());
        }

        try {
            notificationService.createNotification(
                    user, booking, Notification.NotificationType.BOOKING_CONFIRMED,
                    Notification.NotificationChannel.EMAIL, user.getEmail(),
                    "Your booking " + booking.getBookingCode() + " at " +
                            resort.getName() + " has been confirmed successfully.");
        } catch (Exception e) {
            log.error("Failed to create confirmation notification: {}", e.getMessage());
        }

        return booking;
    }

    /**
     * Cancel a booking owned by the authenticated user.
     * Zero-total/mock bookings do not have a Stripe payment record, so they
     * are cancelled directly. Real paid bookings are refunded before the
     * cancellation is persisted.
     */
    /**
     * Cancel a booking from the host panel after verifying that the booking
     * belongs to a resort owned by the authenticated host.
     */
    public Booking cancelBookingForOwner(String bookingId, String ownerId, boolean admin) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            booking = bookingRepository.findByBookingCode(bookingId).orElse(null);
        }
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found with ID or code: " + bookingId);
        }

        Resort resort = getResort(booking.getResortId());
        if (!admin && (ownerId == null || !ownerId.equals(resort.getOwnerId()))) {
            throw new com.reservo.backend.exception.UnauthorizedException(
                    "You can only cancel bookings for your own properties");
        }

        return cancelBookingInternal(booking);
    }

    public Booking cancelBookingForUser(String bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            booking = bookingRepository.findByBookingCode(bookingId).orElse(null);
        }
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found with ID or code: " + bookingId);
        }

        if (!java.util.Objects.equals(booking.getUserId(), userId)) {
            throw new com.reservo.backend.exception.UnauthorizedException(
                    "You are not allowed to cancel this booking");
        }

        return cancelBookingInternal(booking);
    }

    private Booking cancelBookingInternal(Booking booking) {
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            return booking;
        }

        // Persist cancellation first so a bad/legacy payment document can
        // never prevent the customer's booking from being cancelled.
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        Booking cancelled = bookingRepository.save(booking);
        // Make every cancelled night immediately bookable again.
        try {
            bookingRepository.releaseBookingLocks(booking);
        } catch (Exception lockError) {
            log.warn("Could not release booking locks for {}: {}", booking.getBookingCode(), lockError.getMessage());
        }

        Payment payment = null;
        try {
            payment = paymentRepository.findByBookingId(booking.getId()).orElse(null);
        } catch (Exception paymentLookupError) {
            // Legacy payment records are not required for cancellation.
            log.warn("Could not load payment for cancelled booking {}: {}",
                    booking.getId(), paymentLookupError.getMessage());
        }

        // Refund a real Stripe payment when possible. A mock/free booking has
        // no real charge and therefore needs no payment operation.
        if (payment != null
                && payment.getStatus() == Payment.PaymentStatus.SUCCESS
                && payment.getAmount() != null
                && payment.getAmount().compareTo(BigDecimal.ZERO) > 0
                && !stripeService.isPlaceholderKey()
                && payment.getTransactionId() != null
                && !payment.getTransactionId().isBlank()
                && !payment.getTransactionId().startsWith("ch_mock_")
                && !payment.getTransactionId().startsWith("ch_direct_")
                && !payment.getTransactionId().startsWith("FREE_")) {
            try {
                stripeService.refundPayment(payment.getTransactionId(), payment.getAmount());
                payment.setStatus(Payment.PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
            } catch (Exception refundError) {
                // Cancellation remains successful. Log the refund problem so
                // it can be handled separately without breaking the booking UI.
                log.error("Refund failed for cancelled booking {}: {}",
                        booking.getId(), refundError.getMessage(), refundError);
            }
        } else if (payment != null
                && payment.getStatus() == Payment.PaymentStatus.SUCCESS
                && (payment.getAmount() == null
                    || payment.getAmount().compareTo(BigDecimal.ZERO) == 0)) {
            try {
                payment.setStatus(Payment.PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
            } catch (Exception ignored) {
                log.warn("Could not mark zero-value payment as refunded for booking {}", booking.getId());
            }
        }

        // Restore redeemed reward points. This is also best-effort and must
        // not turn a successful cancellation into a 500 response.
        try {
            User user = getUser(booking.getUserId());
            if (booking.getRewardPointsUsed() != null && booking.getRewardPointsUsed() > 0) {
                user.setRewardPoints((user.getRewardPoints() == null ? 0 : user.getRewardPoints())
                        + booking.getRewardPointsUsed());
                userRepository.save(user);
            }

            Resort resort = getResort(booking.getResortId());
            BigDecimal refundAmount = payment != null && payment.getAmount() != null
                    ? payment.getAmount() : BigDecimal.ZERO;

            try {
                emailService.sendBookingCancellationEmail(
                        user.getEmail(), user.getName(), booking.getBookingCode(),
                        resort.getName(), refundAmount.toString());
            } catch (Exception e) {
                log.warn("Cancellation email failed for booking {}: {}",
                        booking.getId(), e.getMessage());
            }

            try {
                notificationService.createNotification(
                        user, booking, Notification.NotificationType.BOOKING_CANCELLED,
                        Notification.NotificationChannel.EMAIL, user.getEmail(),
                        "Your booking " + booking.getBookingCode() + " at " +
                                resort.getName() + " has been cancelled.");
            } catch (Exception e) {
                log.warn("Cancellation notification failed for booking {}: {}",
                        booking.getId(), e.getMessage());
            }
        } catch (Exception ancillaryError) {
            log.warn("Ancillary cancellation processing failed for booking {}: {}",
                    booking.getId(), ancillaryError.getMessage());
        }

        return cancelled;    }


    /**
     * Backwards-compatible cancellation entry point used by the legacy
     * /api/v1/payments/refund/{bookingId} endpoint.
     *
     * The authenticated BookingController uses cancelBookingForUser().
     * This method resolves the booking owner and delegates to the same
     * cancellation/refund workflow so there is only one source of truth.
     */
    public Booking cancelAndRefundBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            booking = bookingRepository.findByBookingCode(bookingId).orElse(null);
        }
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found with ID or code: " + bookingId);
        }
        return cancelBookingForUser(booking.getId(), booking.getUserId());
    }

    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<BookingHistoryResponse> getUserBookingHistory(String userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    /**
     * Return bookings belonging to properties owned by the authenticated owner.
     * We resolve ownership through the resorts collection instead of trusting a
     * client-supplied ownerId on the booking document.
     */
    public List<Booking> getOwnerBookings(String ownerId) {
        if (ownerId == null || ownerId.isBlank()) {
            return List.of();
        }

        java.util.Set<String> ownedResortIds = resortRepository.findByOwnerId(ownerId)
                .stream()
                .map(Resort::getId)
                .filter(id -> id != null && !id.isBlank())
                .collect(java.util.stream.Collectors.toSet());

        if (ownedResortIds.isEmpty()) {
            return List.of();
        }

        return bookingRepository.findAll().stream()
                .filter(booking -> booking.getResortId() != null)
                .filter(booking -> ownedResortIds.contains(booking.getResortId()))
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .toList();
    }

    public Booking getBookingById(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with ID: " + bookingId));
    }

    public Booking updateBookingStatus(String bookingId, Booking.BookingStatus status) {
        if (status == null) throw new IllegalArgumentException("Booking status cannot be null");
        Booking booking = getBookingById(bookingId);
        booking.setStatus(status);
        return bookingRepository.save(booking);
    }

    private BookingHistoryResponse toHistoryResponse(Booking booking) {
        Resort resort = booking.getResortId() != null
                ? resortRepository.findById(booking.getResortId()).orElse(null) : null;
        Room room = booking.getRoomId() != null
                ? roomRepository.findById(booking.getRoomId()).orElse(null) : null;

        BookingHistoryResponse.BookingHistoryResponseBuilder builder =
                BookingHistoryResponse.builder()
                        .bookingId(booking.getId())
                        .bookingCode(booking.getBookingCode())
                        .checkInDate(booking.getCheckInDate())
                        .checkOutDate(booking.getCheckOutDate())
                        .guestsCount(booking.getGuestsCount())
                        .roomsCount(booking.getRoomsCount())
                        .totalAmount(booking.getTotalAmount())
                        .status(booking.getStatus())
                        .bookingSource(booking.getBookingSource())
                        .createdAt(booking.getCreatedAt());

        if (resort != null) {
            builder.resortName(resort.getName()).resortLocation(resort.getLocation());
        }
        if (room != null) {
            builder.roomNumber(room.getRoomNumber()).roomType(room.getRoomType());
        }
        return builder.build();
    }

    private User getUser(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
    }

    private Resort getResort(String id) {
        return resortRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resort not found with ID: " + id));
    }

    private void validateDatesAndAmount(LocalDate checkIn, LocalDate checkOut, BigDecimal amount) {
        if (checkIn == null || checkOut == null)
            throw new IllegalArgumentException("Check-in and check-out dates are required");
        if (!checkOut.isAfter(checkIn))
            throw new IllegalArgumentException("Check-out date must be after check-in date");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("Booking amount cannot be negative");
    }
}
