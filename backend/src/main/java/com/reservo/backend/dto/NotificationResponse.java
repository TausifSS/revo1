package com.reservo.backend.dto;

import com.reservo.backend.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private String id;
    private String bookingId;
    private String bookingCode;

    private Notification.NotificationType type;
    private Notification.NotificationChannel channel;

    private String recipient;
    private String message;

    private Notification.NotificationStatus status;

    private boolean read;

    private Instant sentAt;
    private Instant createdAt;
}
