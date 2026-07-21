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

    @PostMapping("/test/email")
    public ResponseEntity<Map<String, Object>> testEmail(@RequestBody TestEmailRequest request) {
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            response.put("success", false);
            response.put("failureReason", "Email recipient address is required.");
            response.put("smtpResponse", "Client Error: Missing recipient email");
            return ResponseEntity.badRequest().body(response);
        }

        // Basic validation
        if (!request.getEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            response.put("success", false);
            response.put("failureReason", "Invalid email address format.");
            response.put("smtpResponse", "Client Error: Invalid email format");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            emailService.sendEmail(
                request.getEmail(),
                "Smart Krishi - SMTP Test Connection",
                "This is a test email sent from Smart Krishi platform diagnostics endpoint to verify SMTP configurations."
            );

            response.put("success", true);
            response.put("failureReason", null);
            response.put("smtpResponse", "250 2.0.0 OK (SMTP connection and send operation succeeded)");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("failureReason", e.getMessage());
            response.put("smtpResponse", extractSmtpResponse(e));
            return ResponseEntity.status(500).body(response);
        }
    }

    private String extractSmtpResponse(Throwable e) {
        if (e == null) return "No response details available";
        String message = e.getMessage();
        
        if (message != null) {
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\d{3}\\s+\\d\\.\\d\\.\\d\\s+.*").matcher(message);
            if (matcher.find()) {
                return matcher.group();
            }
            java.util.regex.Matcher codeMatcher = java.util.regex.Pattern.compile("\\b(535|550|553|554|421|450|451|452)\\b").matcher(message);
            if (codeMatcher.find()) {
                return "SMTP Code " + codeMatcher.group() + ": " + message;
            }
        }
        
        if (e.getCause() != null && e.getCause() != e) {
            return extractSmtpResponse(e.getCause());
        }
        
        return message != null ? message : e.getClass().getSimpleName();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestEmailRequest {
        private String email;
    }
}
