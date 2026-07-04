package com.smartkrishi.service.notification;

public interface PushNotificationService {
    void sendPush(Long userId, String title, String message);
}
