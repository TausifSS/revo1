package com.reservo.backend.entity;

import com.google.cloud.firestore.annotation.Exclude;

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
public class Notification {

    /** Firestore document ID. */
    private String id;

    /** Firestore document ID of the recipient user. */
    private String userId;

    /** Optional Firestore document ID of the related booking. */
    private String bookingId;

    private NotificationType type;
    private NotificationChannel channel;

    /** Email address or WhatsApp number. */
    private String recipient;

    private String message;

    @Builder.Default
    private NotificationStatus status = NotificationStatus.SENT;

    /** Whether the user has read the notification. */
    @Builder.Default
    private boolean read = false;

    private Instant sentAt;

    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum NotificationType {
        BOOKING_CONFIRMED,
        BOOKING_CANCELLED,
        PAYMENT_SUCCESS,
        REFUND_SUCCESS,
        CHECK_IN_REMINDER
    }

    public enum NotificationChannel {
        EMAIL,
        WHATSAPP
    }

    public enum NotificationStatus {
        PENDING,
        SENT,
        FAILED
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
