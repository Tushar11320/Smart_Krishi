package com.smartkrishi.service.notification;

public interface EmailService {
    void sendEmail(String to, String subject, String content);
}
