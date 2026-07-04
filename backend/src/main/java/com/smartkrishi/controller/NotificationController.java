package com.smartkrishi.controller;
import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.notification.NotificationDTO;
import com.smartkrishi.dto.notification.NotificationPreferenceDTO;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@AllArgsConstructor
@Tag(name = "Notifications", description = "APIs for user notification management")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all notifications for a user")
    public ResponseEntity<ApiResponse<Page<NotificationDTO>>> getUserNotifications(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            Pageable pageable) {
        if (userPrincipal == null || (!userPrincipal.getId().equals(userId) && !isAdmin(userPrincipal))) {
            throw new AccessDeniedException("Unauthorized access to notifications");
        }
        Page<NotificationDTO> notifications = notificationService.getUserNotifications(userId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notifications retrieved successfully", notifications));
    }

    @GetMapping("/user/{userId}/unread")
    @Operation(summary = "Get unread notifications for a user")
    public ResponseEntity<ApiResponse<Page<NotificationDTO>>> getUnreadNotifications(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            Pageable pageable) {
        if (userPrincipal == null || (!userPrincipal.getId().equals(userId) && !isAdmin(userPrincipal))) {
            throw new AccessDeniedException("Unauthorized access to notifications");
        }
        Page<NotificationDTO> notifications = notificationService.getUnreadNotifications(userId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Unread notifications retrieved successfully", notifications));
    }

    @GetMapping("/user/{userId}/unread-count")
    @Operation(summary = "Get unread notification count for a user")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null || (!userPrincipal.getId().equals(userId) && !isAdmin(userPrincipal))) {
            throw new AccessDeniedException("Unauthorized access to notifications");
        }
        Long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Unread count retrieved successfully", count));
    }

    @PutMapping("/{id}/mark-read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<NotificationDTO>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        NotificationDTO notification;
        if (isAdmin(userPrincipal)) {
            notification = notificationService.markAsRead(id);
        } else {
            notification = notificationService.markAsReadSecure(id, userPrincipal.getId());
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Notification marked as read", notification));
    }

    @PutMapping("/user/{userId}/mark-all-read")
    @Operation(summary = "Mark all notifications as read for a user")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null || (!userPrincipal.getId().equals(userId) && !isAdmin(userPrincipal))) {
            throw new AccessDeniedException("Unauthorized access to notifications");
        }
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a notification")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        if (isAdmin(userPrincipal)) {
            notificationService.deleteNotification(id);
        } else {
            notificationService.deleteNotificationSecure(id, userPrincipal.getId());
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Notification deleted successfully", null));
    }

    @DeleteMapping("/user/{userId}")
    @Operation(summary = "Delete all notifications for a user")
    public ResponseEntity<ApiResponse<Void>> deleteAllUserNotifications(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null || (!userPrincipal.getId().equals(userId) && !isAdmin(userPrincipal))) {
            throw new AccessDeniedException("Unauthorized access to notifications");
        }
        notificationService.deleteAllUserNotifications(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "All notifications deleted successfully", null));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get notification preferences for the logged-in user")
    public ResponseEntity<ApiResponse<List<NotificationPreferenceDTO>>> getUserPreferences(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        List<NotificationPreferenceDTO> preferences = notificationService.getUserPreferences(userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Preferences retrieved successfully", preferences));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update notification preferences for the logged-in user")
    public ResponseEntity<ApiResponse<List<NotificationPreferenceDTO>>> updateUserPreferences(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody List<NotificationPreferenceDTO> preferences) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        List<NotificationPreferenceDTO> updated = notificationService.updateUserPreferences(userPrincipal.getId(), preferences);
        return ResponseEntity.ok(new ApiResponse<>(true, "Preferences updated successfully", updated));
    }

    private boolean isAdmin(UserPrincipal principal) {
        if (principal == null) return false;
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
