package com.smartkrishi.service.notification;

import com.smartkrishi.dto.notification.NotificationDTO;
import com.smartkrishi.dto.notification.NotificationPreferenceDTO;
import com.smartkrishi.entity.Notification;
import com.smartkrishi.entity.NotificationPreference;
import com.smartkrishi.entity.User;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.NotificationRepository;
import com.smartkrishi.repository.NotificationPreferenceRepository;
import com.smartkrishi.repository.UserRepository;
import com.smartkrishi.websocket.NotificationWebSocketHandler;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;

@Service
@AllArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final UserRepository userRepository;
    
    private final EmailService emailService;
    private final SmsService smsService;
    private final WhatsAppService whatsAppService;
    private final PushNotificationService pushNotificationService;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    private static final String[] SUPPORTED_EVENTS = {
        "ORDER_PLACED", "PAYMENT_SUCCESS", "PAYMENT_FAILURE", "ORDER_SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "REFUNDS"
    };

    @Override
    public Page<NotificationDTO> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    public Page<NotificationDTO> getUnreadNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationDTO markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        notification.setIsRead(true);
        Notification updated = notificationRepository.save(notification);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public NotificationDTO markAsReadSecure(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        if (!notification.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to modify this notification");
        }
        notification.setIsRead(true);
        Notification updated = notificationRepository.save(notification);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification", "id", id);
        }
        notificationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteNotificationSecure(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        if (!notification.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to delete this notification");
        }
        notificationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteAllUserNotifications(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public void sendEventNotification(User user, String eventType, String title, String message, String relatedEntityType, String relatedEntityId) {
        log.info("Dispatching notification '{}' to user ID {}", eventType, user.getId());
        
        // Find or build default preferences
        NotificationPreference pref = notificationPreferenceRepository.findByUserIdAndEventType(user.getId(), eventType.toUpperCase())
                .orElseGet(() -> {
                    NotificationPreference defaultPref = new NotificationPreference();
                    defaultPref.setUser(user);
                    defaultPref.setEventType(eventType.toUpperCase());
                    defaultPref.setInAppEnabled(true);
                    defaultPref.setEmailEnabled(true);
                    defaultPref.setSmsEnabled(true);
                    defaultPref.setWhatsappEnabled(true);
                    defaultPref.setPushEnabled(true);
                    return defaultPref;
                });

        // 1. In-App (WebSocket + DB)
        if (Boolean.TRUE.equals(pref.getInAppEnabled())) {
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setNotificationType(Notification.NotificationType.valueOf(eventType.toUpperCase()));
            notification.setRelatedEntityType(relatedEntityType);
            notification.setRelatedEntityId(relatedEntityId);
            notification.setIsRead(false);
            Notification saved = notificationRepository.save(notification);

            // Push real-time over WebSocket
            try {
                notificationWebSocketHandler.sendNotificationToUser(user.getId(), mapToDTO(saved));
            } catch (Exception e) {
                log.error("Failed to push WS notification to user ID: {}", user.getId(), e);
            }
        }

        // 2. Email (Real SMTP / Mock)
        if (Boolean.TRUE.equals(pref.getEmailEnabled())) {
            try {
                String htmlBody = String.format("<h2>%s</h2><p>%s</p><br/><small>Sent via Smart Krishi</small>", title, message);
                emailService.sendEmail(user.getEmail(), title, htmlBody);
            } catch (Exception e) {
                log.error("Failed to send email notification to {}", user.getEmail(), e);
            }
        }

        // 3. SMS (Mock)
        if (Boolean.TRUE.equals(pref.getSmsEnabled())) {
            try {
                smsService.sendSms(user.getPhone(), title + ": " + message);
            } catch (Exception e) {
                log.error("Failed to send SMS notification", e);
            }
        }

        // 4. WhatsApp (Mock)
        if (Boolean.TRUE.equals(pref.getWhatsappEnabled())) {
            try {
                whatsAppService.sendWhatsApp(user.getPhone(), title + ": " + message);
            } catch (Exception e) {
                log.error("Failed to send WhatsApp notification", e);
            }
        }

        // 5. Push Notification (Mock)
        if (Boolean.TRUE.equals(pref.getPushEnabled())) {
            try {
                pushNotificationService.sendPush(user.getId(), title, message);
            } catch (Exception e) {
                log.error("Failed to send Push notification", e);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationPreferenceDTO> getUserPreferences(Long userId) {
        List<NotificationPreference> currentPrefs = notificationPreferenceRepository.findByUserId(userId);
        List<NotificationPreferenceDTO> dtos = new ArrayList<>();
        
        for (String event : SUPPORTED_EVENTS) {
            NotificationPreference pref = currentPrefs.stream()
                    .filter(p -> p.getEventType().equalsIgnoreCase(event))
                    .findFirst()
                    .orElse(null);
            
            if (pref != null) {
                dtos.add(mapPreferenceToDTO(pref));
            } else {
                dtos.add(NotificationPreferenceDTO.builder()
                        .eventType(event)
                        .inAppEnabled(true)
                        .emailEnabled(true)
                        .smsEnabled(true)
                        .whatsappEnabled(true)
                        .pushEnabled(true)
                        .build());
            }
        }
        return dtos;
    }

    @Override
    @Transactional
    public List<NotificationPreferenceDTO> updateUserPreferences(Long userId, List<NotificationPreferenceDTO> preferences) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        for (NotificationPreferenceDTO dto : preferences) {
            NotificationPreference pref = notificationPreferenceRepository
                    .findByUserIdAndEventType(userId, dto.getEventType().toUpperCase())
                    .orElseGet(() -> {
                        NotificationPreference newPref = new NotificationPreference();
                        newPref.setUser(user);
                        newPref.setEventType(dto.getEventType().toUpperCase());
                        return newPref;
                    });
            
            pref.setInAppEnabled(dto.getInAppEnabled() != null ? dto.getInAppEnabled() : true);
            pref.setEmailEnabled(dto.getEmailEnabled() != null ? dto.getEmailEnabled() : true);
            pref.setSmsEnabled(dto.getSmsEnabled() != null ? dto.getSmsEnabled() : true);
            pref.setWhatsappEnabled(dto.getWhatsappEnabled() != null ? dto.getWhatsappEnabled() : true);
            pref.setPushEnabled(dto.getPushEnabled() != null ? dto.getPushEnabled() : true);
            
            notificationPreferenceRepository.save(pref);
        }
        return getUserPreferences(userId);
    }

    private NotificationPreferenceDTO mapPreferenceToDTO(NotificationPreference pref) {
        return NotificationPreferenceDTO.builder()
                .eventType(pref.getEventType())
                .inAppEnabled(pref.getInAppEnabled())
                .emailEnabled(pref.getEmailEnabled())
                .smsEnabled(pref.getSmsEnabled())
                .whatsappEnabled(pref.getWhatsappEnabled())
                .pushEnabled(pref.getPushEnabled())
                .build();
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUser() != null ? notification.getUser().getId() : null)
                .notificationType(notification.getNotificationType() != null ? notification.getNotificationType().name() : null)
                .title(notification.getTitle())
                .message(notification.getMessage())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
