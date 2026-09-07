package com.reservo.backend.entity;

import com.google.cloud.firestore.annotation.Exclude;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    /** Firestore document ID. */
    private String id;

    /** Unique coupon code, e.g. WELCOME10. */
    private String code;

    /**
     * Firestore document ID of the user who owns the coupon.
     * null means platform-wide coupon.
     */
    private String userId;

    @Builder.Default
    private Integer discountPercentage = 10;

    @Builder.Default
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @Builder.Default
    private BigDecimal discountValue = BigDecimal.TEN;

    /** null means valid for all resorts. */
    private String resortId;

    private BigDecimal minimumAmount;
    private LocalDate expiryDate;

    @Builder.Default
    private Integer usageLimit = 1000;

    @Builder.Default
    private Integer usedCount = 0;

    private CouponStatus status;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    public enum CouponStatus {
        ACTIVE,
        USED,
        EXPIRED,
        EXHAUSTED
    }

    public enum DiscountType {
        PERCENTAGE,
        FIXED
    }

    public void updateTimestamp() {
        this.updatedAt = Instant.now();
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
