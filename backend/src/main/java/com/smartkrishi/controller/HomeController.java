package com.smartkrishi.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HomeController {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${email.provider:smtp}")
    private String activeProvider;

    @Value("${email.api-key:}")
    private String apiKey;

    @Value("${email.sender-email:}")
    private String senderEmail;

    @Value("${email.fallback.enabled:false}")
    private boolean fallbackEnabled;

    @Value("${email.fallback.provider:smtp}")
    private String fallbackProvider;

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
        
        response.put("configured_provider", activeProvider);
        response.put("sender_email_configured", senderEmail != null && !senderEmail.isEmpty());
        response.put("sender_email_masked", maskUsername(senderEmail));
        response.put("api_key_configured", apiKey != null && !apiKey.isEmpty());

        // DNS & TCP Connection Diagnostics for Primary SMTP (both 587 and 465)
        Map<String, Object> smtpGmail587 = testHostConnection("smtp.gmail.com", 587);
        Map<String, Object> smtpGmail465 = testHostConnection("smtp.gmail.com", 465);
        
        Map<String, Object> smtpDiag = new HashMap<>();
        smtpDiag.put("port_587", smtpGmail587);
        smtpDiag.put("port_465", smtpGmail465);
        response.put("gmail_smtp_diagnostics", smtpDiag);

        // DNS & TCP Connection Diagnostics for REST API Providers
        Map<String, Object> brevoApi = testHostConnection("api.brevo.com", 443);
        Map<String, Object> sendgridApi = testHostConnection("api.sendgrid.com", 443);
        
        Map<String, Object> apiDiag = new HashMap<>();
        apiDiag.put("api_brevo_com", brevoApi);
        apiDiag.put("api_sendgrid_com", sendgridApi);
        response.put("rest_api_endpoints_diagnostics", apiDiag);

        // Fallback Configuration & Diagnostics
        Map<String, Object> fallbackStatus = new HashMap<>();
        fallbackStatus.put("enabled", fallbackEnabled);
        fallbackStatus.put("provider", fallbackProvider);
        fallbackStatus.put("host", fallbackHost);
        fallbackStatus.put("port", fallbackPort);
        fallbackStatus.put("username_masked", maskUsername(fallbackUsername));

        if (fallbackEnabled && fallbackHost != null && !fallbackHost.isEmpty()) {
            Map<String, Object> fallbackConnection = testHostConnection(fallbackHost, fallbackPort);
            fallbackStatus.put("connection_test", fallbackConnection);
        }
        response.put("fallback_provider_diagnostics", fallbackStatus);

        // Overall Status Determination
        boolean emailDeliveryAvailable = false;
        if ("brevo".equalsIgnoreCase(activeProvider)) {
            emailDeliveryAvailable = "UP".equals(brevoApi.get("status"));
        } else if ("sendgrid".equalsIgnoreCase(activeProvider)) {
            emailDeliveryAvailable = "UP".equals(sendgridApi.get("status"));
        } else { // smtp
            emailDeliveryAvailable = "UP".equals(smtpGmail587.get("status")) || "UP".equals(smtpGmail465.get("status"));
        }

        // If primary is down but fallback is enabled and up, then overall status is UP
        if (!emailDeliveryAvailable && fallbackEnabled) {
            if ("brevo".equalsIgnoreCase(fallbackProvider)) {
                emailDeliveryAvailable = "UP".equals(brevoApi.get("status"));
            } else if ("sendgrid".equalsIgnoreCase(fallbackProvider)) {
                emailDeliveryAvailable = "UP".equals(sendgridApi.get("status"));
            } else if (fallbackHost != null && !fallbackHost.isEmpty()) {
                Map<String, Object> fallbackConn = testHostConnection(fallbackHost, fallbackPort);
                emailDeliveryAvailable = "UP".equals(fallbackConn.get("status"));
            }
        }

        response.put("status", emailDeliveryAvailable ? "UP" : "DOWN");

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

    private Map<String, Object> testHostConnection(String host, int port) {
        Map<String, Object> result = new HashMap<>();
        if (host == null || host.trim().isEmpty()) {
            result.put("status", "UNCONFIGURED");
            return result;
        }

        long dnsStart = System.currentTimeMillis();
        InetAddress address;
        try {
            address = InetAddress.getByName(host);
            result.put("dns_resolution", "SUCCESS");
            result.put("resolved_ip", address.getHostAddress());
            result.put("dns_lookup_time_ms", System.currentTimeMillis() - dnsStart);
        } catch (Exception e) {
            result.put("dns_resolution", "FAILED");
            result.put("dns_error", e.getClass().getSimpleName() + ": " + e.getMessage());
            result.put("status", "DOWN");
            return result;
        }

        long tcpStart = System.currentTimeMillis();
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(address, port), 4000); // 4-second timeout
            result.put("tcp_connection", "SUCCESS");
            result.put("tcp_connect_time_ms", System.currentTimeMillis() - tcpStart);
            result.put("status", "UP");
        } catch (Exception e) {
            result.put("tcp_connection", "FAILED");
            result.put("tcp_error", e.getClass().getSimpleName() + ": " + e.getMessage());
            result.put("status", "DOWN");
        }

        return result;
    }
}
