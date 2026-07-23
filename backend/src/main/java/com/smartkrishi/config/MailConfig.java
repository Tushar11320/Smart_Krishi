package com.smartkrishi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import lombok.extern.slf4j.Slf4j;

import java.util.Properties;

@Configuration
@Slf4j
public class MailConfig {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private String smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private String starttlsEnable;

    @Value("${spring.mail.properties.mail.smtp.starttls.required:true}")
    private String starttlsRequired;

    @Value("${spring.mail.properties.mail.smtp.connectiontimeout:30000}")
    private int connectionTimeout;

    @Value("${spring.mail.properties.mail.smtp.timeout:30000}")
    private int timeout;

    @Value("${spring.mail.properties.mail.smtp.writetimeout:30000}")
    private int writeTimeout;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        String targetHost = (host != null && !host.isBlank()) ? host.trim() : "smtp.gmail.com";
        int targetPort = (port > 0) ? port : 587;

        mailSender.setHost(targetHost);
        mailSender.setPort(targetPort);

        // Sanitize credentials: trim spaces and strip internal whitespace from App Password if present
        String cleanUsername = (username != null) ? username.trim() : "";
        String cleanPassword = (password != null) ? password.trim().replaceAll("\\s+", "") : "";

        mailSender.setUsername(cleanUsername);
        mailSender.setPassword(cleanPassword);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", smtpAuth);

        if (targetPort == 465) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        } else {
            props.put("mail.smtp.starttls.enable", starttlsEnable);
            props.put("mail.smtp.starttls.required", starttlsRequired);
        }

        props.put("mail.smtp.connectiontimeout", String.valueOf(connectionTimeout));
        props.put("mail.smtp.timeout", String.valueOf(timeout));
        props.put("mail.smtp.writetimeout", String.valueOf(writeTimeout));
        props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.debug", "true");

        runSmtpDiagnostic(targetHost, targetPort, cleanUsername, cleanPassword);

        return mailSender;
    }

    private void runSmtpDiagnostic(String targetHost, int targetPort, String cleanUsername, String cleanPassword) {
        boolean usernamePresent = cleanUsername != null && !cleanUsername.isBlank();
        boolean passwordPresent = cleanPassword != null && !cleanPassword.isBlank();
        int passLen = passwordPresent ? cleanPassword.length() : 0;

        log.info("[SMTP Diagnostic] Host: {}", targetHost);
        log.info("[SMTP Diagnostic] Port: {}", targetPort);
        log.info("[SMTP Diagnostic] Username Presence: {} ({})", usernamePresent ? "PRESENT" : "MISSING", usernamePresent ? cleanUsername : "N/A");
        log.info("[SMTP Diagnostic] Password Presence: {} (Length: {} chars, App Password valid 16-char format: {})",
                passwordPresent ? "PRESENT" : "MISSING", passLen, (passLen == 16 ? "YES" : "NO"));

        new Thread(() -> {
            try (java.net.Socket socket = new java.net.Socket()) {
                log.info("[SMTP Diagnostic] Testing outbound TCP socket connection to {}:{}...", targetHost, targetPort);
                socket.connect(new java.net.InetSocketAddress(targetHost, targetPort), 5000);
                log.info("[SMTP Diagnostic] Outbound TCP Connection Result: SUCCESS - Port {} is open and reachable.", targetPort);
            } catch (Exception e) {
                log.error("[SMTP Diagnostic] Outbound TCP Connection Result: FAILED to connect to {}:{} within 5000ms. Cause: {}. (Production hosting firewall e.g. Render may block outbound SMTP port {}).",
                        targetHost, targetPort, e.getMessage(), targetPort);
            }
        }, "SMTP-Diagnostic-Thread").start();
    }
}
