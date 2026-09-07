package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.Booking;
import com.reservo.backend.entity.Coupon;
import com.reservo.backend.repository.CouponRepository;
import com.reservo.backend.service.BookingService;
import com.reservo.backend.service.StripeService;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.reservo.backend.repository.UserRepository;
import com.reservo.backend.service.CouponService;
import com.reservo.backend.entity.User;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final BookingService bookingService;
    private final StripeService stripeService;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final com.reservo.backend.service.AuthService authService;

    @Value("${app.stripe.webhook-secret}")
    private String endpointSecret;

    private User resolveEffectiveUser(String requestedUserId) {
        java.util.Optional<User> authUser = authService.getOptionalAuthenticatedUser();
        if (authUser.isPresent()) {
            User user = authUser.get();
            if (user.getRole() == User.Role.ROLE_ADMIN && requestedUserId != null && !requestedUserId.isBlank()) {
                return userRepository.findById(requestedUserId)
                        .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + requestedUserId));
            }
            return user;
        }
        if (requestedUserId != null && !requestedUserId.isBlank()) {
            return userRepository.findById(requestedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + requestedUserId));
        }
        throw new IllegalArgumentException("Authenticated user context or valid User ID is required");
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<String>> createCheckoutSession(
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
            @RequestParam(required = false) Integer pointsToRedeem,
            @RequestParam(required = false) String guestName,
            @RequestParam(required = false) String guestPhone,
            @RequestParam String successUrl,
            @RequestParam String cancelUrl) {
        try {
            User user = resolveEffectiveUser(userId);
            String effectiveUserId = user.getId();

            // Never trust the amount calculated by the browser. Recalculate the
            // canonical pre-discount price from the Firestore resort + dates.
            BigDecimal calculatedAmount = bookingService.calculateBaseBookingAmount(
                    resortId, roomId, LocalDate.parse(checkIn), LocalDate.parse(checkOut),
                    Math.max(1, Math.max(roomsCount, Math.max((int) Math.ceil(adults / 2.0), (int) Math.ceil(children / 2.0)))));

            // KYC validation rule: > ₹50,000 amount requires verified status
            if (calculatedAmount.compareTo(BigDecimal.valueOf(50000)) > 0 && user.getKycStatus() != User.KycStatus.VERIFIED) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Identity verification (KYC) required for bookings over ₹50,000.", 400));
            }

            BigDecimal discountAmount = BigDecimal.ZERO;
            if (couponCode != null && !couponCode.trim().isEmpty()) {
                Coupon coupon = couponService.getAndValidateCoupon(couponCode.trim(), effectiveUserId, resortId, calculatedAmount);
                if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                    discountAmount = calculatedAmount.multiply(coupon.getDiscountValue().divide(BigDecimal.valueOf(100)));
                } else {
                    discountAmount = coupon.getDiscountValue().min(calculatedAmount);
                }
                log.info("Applied coupon {} for discount: {}", couponCode, discountAmount);
            }

            BigDecimal pointsDiscount = BigDecimal.ZERO;
            int redeemedPoints = 0;
            if (pointsToRedeem != null && pointsToRedeem > 0) {
                if (user.getRewardPoints() < pointsToRedeem) {
                    throw new IllegalArgumentException("Insufficient points balance.");
                }
                BigDecimal pointsValue = BigDecimal.valueOf(pointsToRedeem).divide(BigDecimal.valueOf(10), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal remainingAmount = calculatedAmount.subtract(discountAmount);
                BigDecimal maxPointsValueAllowed = remainingAmount.multiply(BigDecimal.valueOf(0.5));
                if (pointsValue.compareTo(maxPointsValueAllowed) > 0) {
                    pointsValue = maxPointsValueAllowed;
                    redeemedPoints = pointsValue.multiply(BigDecimal.valueOf(10)).intValue();
                } else {
                    redeemedPoints = pointsToRedeem;
                }
                pointsDiscount = pointsValue;
                log.info("Applied reward points discount: {} (Redeemed: {} points)", pointsDiscount, redeemedPoints);
            }

            BigDecimal finalAmount = calculatedAmount.subtract(discountAmount).subtract(pointsDiscount).max(BigDecimal.ZERO);

            // Payment is intentionally not implemented yet.
            // Only a fully discounted (₹0) reservation may be completed without
            // a payment gateway. For any positive amount, fail before creating
            // a booking so we never leave an unpaid PENDING reservation behind.
            if (finalAmount.compareTo(BigDecimal.ZERO) > 0) {
                log.info("Payment required for checkout but payment module is not implemented yet. Amount: {}",
                        finalAmount);
                return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                        .body(ApiResponse.error(
                                "Payment module not implemented yet. Your booking was not created. " +
                                "Please use a 100% discount/promo code for now.",
                                HttpStatus.NOT_IMPLEMENTED.value()));
            }

            // ============================================================
            // ZERO-TOTAL BOOKING
            // ============================================================
            // A 100% coupon (or other combination of discounts) can make
            // the final amount exactly zero. In that case NO payment
            // gateway should be called. Create and confirm the reservation
            // immediately as a fully-comped booking.
            Booking booking = bookingService.createBooking(
                    effectiveUserId, resortId, roomId,
                    LocalDate.parse(checkIn), LocalDate.parse(checkOut),
                    BigDecimal.ZERO, guestName, guestPhone,
                    (couponCode != null && !couponCode.trim().isEmpty()) ? couponCode.trim().toUpperCase() : null,
                    discountAmount, redeemedPoints, pointsDiscount,
                    Math.max(1, adults), Math.max(0, children),
                    Math.max(1, Math.max(roomsCount, Math.max((int) Math.ceil(adults / 2.0), (int) Math.ceil(children / 2.0))))
            );

            log.info("Zero-total booking {}. Completing reservation without payment gateway.",
                    booking.getBookingCode());

            bookingService.confirmBooking(
                    booking.getBookingCode(),
                    "FREE_" + System.currentTimeMillis(),
                    "ZERO_TOTAL_COUPON"
            );

            if (couponCode != null && !couponCode.trim().isEmpty()) {
                couponService.incrementCouponUsage(couponCode.trim());
            }

            String zeroTotalSuccessUrl = appendBookingCode(successUrl, booking.getBookingCode());
            return ResponseEntity.ok(
                    ApiResponse.success(
                            zeroTotalSuccessUrl,
                            "Reservation completed successfully. No payment was required."
                    )
            );
        } catch (IllegalStateException e) {
            log.warn("Checkout rejected because dates are unavailable: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.CONFLICT.value()));
        } catch (Exception e) {
            log.error("Failed to process checkout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to process checkout: " + e.getMessage(), 500));
        }
    }

    private String appendBookingCode(String successUrl, String bookingCode) {
        String separator = successUrl.contains("?") ? "&" : "?";
        return successUrl + separator + "bookingCode=" +
                java.net.URLEncoder.encode(bookingCode, java.nio.charset.StandardCharsets.UTF_8);
    }

    @PostMapping("/refund/{bookingId}")
    public ResponseEntity<ApiResponse<Booking>> refundBooking(@PathVariable String bookingId) {
        try {
            Booking booking = bookingService.cancelAndRefundBooking(bookingId);
            return ResponseEntity.ok(ApiResponse.success(booking, "Booking cancelled and payment refunded successfully"));
        } catch (Exception e) {
            log.error("Refund processing failed for booking ID: {}", bookingId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload, HttpServletRequest request) {
        String sigHeader = request.getHeader("Stripe-Signature");
        if (sigHeader == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing Stripe-Signature header");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (Exception e) {
            log.error("Stripe Webhook Signature Verification failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature verification failed");
        }

        log.info("Received secure Stripe event: {}", event.getType());

        if ("checkout.session.completed".equals(event.getType())) {
            EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
            if (dataObjectDeserializer.getObject().isPresent()) {
                Session session = (Session) dataObjectDeserializer.getObject().get();
                String bookingCode = session.getMetadata().get("bookingCode");
                String paymentIntentId = session.getPaymentIntent();
                String paymentMethod = session.getPaymentMethodTypes() != null && !session.getPaymentMethodTypes().isEmpty() 
                        ? session.getPaymentMethodTypes().get(0).toUpperCase() 
                        : "CARD";

                try {
                    bookingService.confirmBooking(bookingCode, paymentIntentId, paymentMethod);
                    
                    // Consume Stripe Session Coupon if applied
                    String couponCode = session.getMetadata().get("couponCode");
                    if (couponCode != null && !couponCode.trim().isEmpty()) {
                        couponService.incrementCouponUsage(couponCode.trim());
                        log.info("Webhook successfully consumed coupon: {}", couponCode);
                    }

                    log.info("Webhook successfully confirmed booking: {}", bookingCode);
                } catch (Exception e) {
                    log.error("Failed to confirm booking from Webhook", e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Booking confirmation failed");
                }
            }
        }

        return ResponseEntity.ok("Received");
    }
}
