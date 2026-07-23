package com.smartkrishi.service.notification;

import org.springframework.scheduling.annotation.Async;

public interface EmailService {
    @Async("taskExecutor")
    void sendEmail(String to, String subject, String content);
}
