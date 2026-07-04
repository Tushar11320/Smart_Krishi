package com.smartkrishi.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsServiceImpl implements SmsService {
    @Override
    public void sendSms(String to, String message) {
        log.info("[SMS GATEWAY] Sending SMS to {}: {}", to, message);
    }
}
