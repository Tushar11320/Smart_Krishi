package com.smartkrishi.service.notification;

import com.smartkrishi.dto.notification.NotificationDTO;
import com.smartkrishi.dto.notification.NotificationPreferenceDTO;
import com.smartkrishi.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface NotificationService {
    Page<NotificationDTO> getUserNotifications(Long userId, Pageable pageable);
    Page<NotificationDTO> getUnreadNotifications(Long userId, Pageable pageable);
    Long getUnreadCount(Long userId);
    NotificationDTO markAsRead(Long id);
    NotificationDTO markAsReadSecure(Long id, Long userId);
    void markAllAsRead(Long userId);
    void deleteNotification(Long id);
    void deleteNotificationSecure(Long id, Long userId);
    void deleteAllUserNotifications(Long userId);
    
    // Multi-channel dispatch and preferences management
    void sendEventNotification(User user, String eventType, String title, String message, String relatedEntityType, String relatedEntityId);
    List<NotificationPreferenceDTO> getUserPreferences(Long userId);
    List<NotificationPreferenceDTO> updateUserPreferences(Long userId, List<NotificationPreferenceDTO> preferences);
}
