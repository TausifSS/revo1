package com.reservo.backend.entity;

import com.google.cloud.firestore.annotation.Exclude;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    /** Firestore document ID. */
    private String id;

    /** Human-readable booking reference, e.g. RSV-20260830-ABC123. */
    private String bookingCode;

    /** Firestore document ID of the user. */
    private String userId;

    /** Firestore document ID of the resort. */
    private String resortId;

    /** Primary/first assigned room. Kept for backward compatibility. */
    private String roomId;

    /** All room IDs assigned to this booking when multiple rooms are requested. */
    @Builder.Default
    private List<String> assignedRoomIds = new ArrayList<>();

    private LocalDate checkInDate;
    private LocalDate checkOutDate;

    @Builder.Default
    private Integer guestsCount = 2;

    @Builder.Default
    private Integer roomsCount = 1;

    private BigDecimal totalAmount;
    private String guestName;
    private String guestPhone;
    private String appliedCouponCode;

    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    private Integer rewardPointsUsed = 0;

    @Builder.Default
    private BigDecimal rewardPointsValue = BigDecimal.ZERO;

    private BookingStatus status;
    private BookingSource bookingSource;

    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum BookingStatus {
        PENDING,
        CONFIRMED,
        CANCELLED,
        COMPLETED
    }

    public enum BookingSource {
        DIRECT,
        SEARCH,
        REFERRAL,
        OTHERS
    }
    /**
     * The canonical entity ID is the Firestore document ID.
     * Do not read/write a separate `id` field from/to Firestore.
     */
    @Exclude
    public String getId() {
        return id;
    }

}
