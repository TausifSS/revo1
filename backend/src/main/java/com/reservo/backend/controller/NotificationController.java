package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.dto.NotificationResponse;
import com.reservo.backend.entity.User;
import com.reservo.backend.exception.UnauthorizedException;
import com.reservo.backend.service.AuthService;
import com.reservo.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;

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
        throw new UnauthorizedException("Authentication required to access notifications");
    }

    /**
     * Get all notifications for a user.
     *
     * GET /api/v1/notifications?userId=1
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>>
    getNotifications(
            @RequestParam(required = false) String userId
    ) {
        String effectiveUserId = resolveEffectiveUserId(userId);
        List<NotificationResponse> notifications =
                notificationService.getUserNotifications(effectiveUserId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        notifications,
                        "Notifications retrieved successfully"
                )
        );
    }

    /**
     * Get unread notifications for a user.
     *
     * GET /api/v1/notifications/unread?userId=1
     */
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>>
    getUnreadNotifications(
            @RequestParam(required = false) String userId
    ) {
        String effectiveUserId = resolveEffectiveUserId(userId);
        List<NotificationResponse> notifications =
                notificationService.getUnreadNotifications(effectiveUserId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        notifications,
                        "Unread notifications retrieved successfully"
                )
        );
    }

    /**
     * Mark a single notification as read.
     *
     * PATCH /api/v1/notifications/{id}/read
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable String id
    ) {
        notificationService.markAsRead(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "Notification marked as read"
                )
        );
    }

    /**
     * Mark all notifications of a user as read.
     *
     * PATCH /api/v1/notifications/read-all?userId=1
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestParam(required = false) String userId
    ) {
        String effectiveUserId = resolveEffectiveUserId(userId);
        notificationService.markAllAsRead(effectiveUserId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "All notifications marked as read"
                )
        );
    }

    /**
     * Delete a notification.
     *
     * DELETE /api/v1/notifications/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable String id
    ) {
        notificationService.deleteNotification(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "Notification deleted successfully"
                )
        );
    }
}