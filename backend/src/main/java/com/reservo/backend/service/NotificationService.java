package com.reservo.backend.service;

import com.reservo.backend.dto.NotificationResponse;
import com.reservo.backend.entity.Booking;
import com.reservo.backend.entity.Notification;
import com.reservo.backend.entity.User;
import com.reservo.backend.exception.ResourceNotFoundException;
import com.reservo.backend.repository.BookingRepository;
import com.reservo.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final BookingRepository bookingRepository;

    public Notification createNotification(
            User user, Booking booking,
            Notification.NotificationType type,
            Notification.NotificationChannel channel,
            String recipient, String message) {

        if (user == null) throw new IllegalArgumentException("User cannot be null");

        Notification notification = Notification.builder()
                .userId(user.getId())
                .bookingId(booking != null ? booking.getId() : null)
                .type(type)
                .channel(channel)
                .recipient(recipient)
                .message(message)
                .status(Notification.NotificationStatus.SENT)
                .read(false)
                .sentAt(Instant.now())
                .createdAt(Instant.now())
                .build();

        return notificationRepository.save(notification);
    }

    public List<NotificationResponse> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::convertToResponse).toList();
    }

    public List<NotificationResponse> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream().map(this::convertToResponse).toList();
    }

    public void markAsRead(String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found with ID: " + id));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> notifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : notifications) {
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        }
    }

    public void deleteNotification(String id) {
        notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found with ID: " + id));
        notificationRepository.deleteById(id);
    }

    private NotificationResponse convertToResponse(Notification n) {
        String bookingCode = null;
        if (n.getBookingId() != null) {
            bookingCode = bookingRepository.findById(n.getBookingId())
                    .map(Booking::getBookingCode).orElse(null);
        }

        return NotificationResponse.builder()
                .id(n.getId())
                .bookingId(n.getBookingId())
                .bookingCode(bookingCode)
                .type(n.getType())
                .channel(n.getChannel())
                .recipient(n.getRecipient())
                .message(n.getMessage())
                .status(n.getStatus())
                .read(n.isRead())
                .sentAt(n.getSentAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
