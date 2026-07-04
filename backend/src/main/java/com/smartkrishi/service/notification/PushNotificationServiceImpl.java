package com.smartkrishi.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class PushNotificationServiceImpl implements PushNotificationService {
    @Override
    public void sendPush(Long userId, String title, String message) {
        log.info("[PUSH NOTIFICATION GATEWAY] Sending Push Notification to User {}: Title: {}, Body: {}", userId, title, message);
    }
}
