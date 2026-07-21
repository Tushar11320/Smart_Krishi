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

    @Value("${spring.mail.host}")
    private String host;

    @Value("${spring.mail.port}")
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
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", smtpAuth);
        props.put("mail.smtp.starttls.enable", starttlsEnable);
        props.put("mail.smtp.starttls.required", starttlsRequired);
        props.put("mail.smtp.connectiontimeout", String.valueOf(connectionTimeout));
        props.put("mail.smtp.timeout", String.valueOf(timeout));
        props.put("mail.smtp.writetimeout", String.valueOf(writeTimeout));

        // For Gmail specifically, TLSv1.2 or TLSv1.3 is recommended
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");

        String maskedPassword = (password != null && !password.isEmpty()) 
                ? "*".repeat(Math.min(password.length(), 8)) + " (length: " + password.length() + ")" 
                : "null";

        log.info("[MailConfig] Initializing JavaMailSender with Host: {}, Port: {}, Username: {}, Password: {}", 
                 host, port, username, maskedPassword);
        
        // Verify Gmail App Password format (16 characters, alphanumeric)
        if ("smtp.gmail.com".equalsIgnoreCase(host) && password != null) {
            String cleanPassword = password.replace(" ", "");
            if (cleanPassword.length() != 16) {
                log.warn("[MailConfig WARNING] Gmail SMTP is active but the configured password length is {} (expected 16 for Gmail App Password). Direct account passwords will fail due to Google Security policies.", cleanPassword.length());
            } else {
                log.info("[MailConfig] Gmail App Password format verified (16 characters).");
            }
        }

        // Asynchronous SMTP connectivity test during startup
        new Thread(() -> {
            try {
                // Wait briefly for the server to finish starting up
                Thread.sleep(2000);
                log.info("[SMTP Startup Check] Testing SMTP outbound connectivity to {}:{}", host, port);
                try (java.net.Socket socket = new java.net.Socket()) {
                    socket.connect(new java.net.InetSocketAddress(host, port), 5000);
                    log.info("[SMTP Startup Check] Connection successful. {}:{} is REACHABLE.", host, port);
                } catch (Exception e) {
                    log.error("[SMTP Startup Check] ERROR: {}:{} is UNREACHABLE! "
                            + "Outbound SMTP connection timed out or is blocked. "
                            + "(Note: Render blocks direct outbound SMTP on ports 25, 465, and 587 by default to prevent spam. "
                            + "Please verify with Render support that outbound SMTP is allowed or use a web API mailing service.) "
                            + "Details: {}", host, port, e.getMessage());
                }
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }).start();
        
        return mailSender;
    }
}
