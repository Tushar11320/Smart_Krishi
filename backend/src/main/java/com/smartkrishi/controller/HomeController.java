package com.smartkrishi.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HomeController {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${email.fallback.enabled:false}")
    private boolean fallbackEnabled;

    @Value("${email.fallback.host:}")
    private String fallbackHost;

    @Value("${email.fallback.port:587}")
    private int fallbackPort;

    @Value("${email.fallback.username:}")
    private String fallbackUsername;

    @GetMapping("/")
    public String home() {
        return "Smart Krishi Backend Running";
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @GetMapping("/api/health")
    public Map<String, String> apiHealth() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        return response;
    }

    @GetMapping("/api/health/email")
    public Map<String, Object> emailHealth() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> primaryStatus = new HashMap<>();
        Map<String, Object> fallbackStatus = new HashMap<>();

        boolean overallOk = true;

        if (mailSender instanceof JavaMailSenderImpl) {
            JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
            String host = impl.getHost();
            int port = impl.getPort();
            String username = impl.getUsername();
            String password = impl.getPassword();

            primaryStatus.put("host", host);
            primaryStatus.put("port", port);
            primaryStatus.put("configured", host != null && !host.isEmpty());
            primaryStatus.put("username_configured", username != null && !username.isEmpty());
            primaryStatus.put("username_masked", maskUsername(username));
            primaryStatus.put("password_configured", password != null && !password.isEmpty());

            // Test TCP socket connection to primary SMTP server
            boolean connected = testConnection(host, port);
            primaryStatus.put("connection_test", connected ? "SUCCESS" : "FAILED");
            if (!connected) {
                overallOk = false;
            }
        } else {
            primaryStatus.put("status", "NOT_CONFIGURED");
            overallOk = false;
        }

        fallbackStatus.put("enabled", fallbackEnabled);
        fallbackStatus.put("host", fallbackHost);
        fallbackStatus.put("port", fallbackPort);
        fallbackStatus.put("username_configured", fallbackUsername != null && !fallbackUsername.isEmpty());
        fallbackStatus.put("username_masked", maskUsername(fallbackUsername));

        if (fallbackEnabled && fallbackHost != null && !fallbackHost.isEmpty()) {
            boolean fallbackConnected = testConnection(fallbackHost, fallbackPort);
            fallbackStatus.put("connection_test", fallbackConnected ? "SUCCESS" : "FAILED");
            if (fallbackConnected) {
                // If primary failed but fallback succeeded, overall is OK
                overallOk = true;
            }
        }

        response.put("status", overallOk ? "UP" : "DOWN");
        response.put("primary_provider", primaryStatus);
        response.put("fallback_provider", fallbackStatus);

        return response;
    }

    @GetMapping("/api/test")
    public Map<String, String> apiTest() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Backend Connected");
        return response;
    }

    @GetMapping("/favicon.ico")
    public org.springframework.http.ResponseEntity<Void> returnNoFavicon() {
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    private String maskUsername(String username) {
        if (username == null || username.trim().isEmpty()) return "null";
        int atIndex = username.indexOf('@');
        if (atIndex <= 1) return "***";
        return username.substring(0, 1) + "***" + username.substring(atIndex);
    }

    private boolean testConnection(String host, int port) {
        if (host == null || host.trim().isEmpty()) return false;
        try (java.net.Socket socket = new java.net.Socket()) {
            socket.connect(new java.net.InetSocketAddress(host, port), 3000); // 3-second timeout
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
