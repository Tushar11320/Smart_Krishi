package com.smartkrishi.controller;

import com.smartkrishi.service.notification.EmailService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@AllArgsConstructor
public class TestEmailController {

    private final EmailService emailService;

    @PostMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestBody TestEmailRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Email recipient address is required.");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            emailService.sendEmail(
                request.getEmail(),
                "Smart Krishi - SMTP Test Connection",
                "This is a test email sent from Smart Krishi platform diagnostics endpoint to verify SMTP configurations."
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "SMTP test email sent successfully to " + request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "SMTP test connection failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestEmailRequest {
        private String email;
    }
}
