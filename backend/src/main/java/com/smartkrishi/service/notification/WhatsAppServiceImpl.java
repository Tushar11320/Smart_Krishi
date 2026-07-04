package com.smartkrishi.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class WhatsAppServiceImpl implements WhatsAppService {
    @Override
    public void sendWhatsApp(String to, String message) {
        log.info("[WHATSAPP GATEWAY] Sending WhatsApp to {}: {}", to, message);
    }
}
