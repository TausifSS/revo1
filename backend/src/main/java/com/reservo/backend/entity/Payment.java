package com.reservo.backend.entity;

import com.google.cloud.firestore.annotation.Exclude;

import java.math.BigDecimal;
import java.time.Instant;

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
public class Payment {

    /** Firestore document ID. */
    private String id;

    /** Stripe/payment provider transaction ID. */
    private String transactionId;

    /** Firestore document ID of the related booking. */
    private String bookingId;

    private BigDecimal amount;
    private String paymentMethod;
    private PaymentStatus status;

    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum PaymentStatus {
        PENDING,
        SUCCESS,
        FAILED,
        REFUNDED
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
