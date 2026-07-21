package com.smartkrishi.service.notification;

import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.EmailDeliveryException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${email.provider:smtp}")
    private String provider;

    @Value("${email.api-key:}")
    private String apiKey;

    @Value("${email.sender-email:}")
    private String senderEmail;

    @Value("${email.sender-name:Smart Krishi}")
    private String senderName;

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

    @Value("${email.fallback.password:}")
    private String fallbackPassword;

    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 2000;

    @Override
    public void sendEmail(String to, String subject, String content) {
        log.info("[EmailService] Routing email sending. Recipient: {}, Subject: {}, Provider: {}", to, subject, provider);

        // 1. Validate recipient email address format
        if (to == null || !to.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            log.error("[EmailService] Email address validation failed for: {}", to);
            throw new BadRequestException("Please enter a valid email address.");
        }

        // 2. Dispatch to the configured provider
        Exception lastException = null;
        try {
            if ("brevo".equalsIgnoreCase(provider)) {
                sendViaBrevo(to, subject, content);
                return;
            } else if ("sendgrid".equalsIgnoreCase(provider)) {
                sendViaSendGrid(to, subject, content);
                return;
            } else {
                // Default: SMTP
                sendViaSmtp(to, subject, content);
                return;
            }
        } catch (Exception e) {
            lastException = e;
            log.error("[EmailService] Primary email provider ({}) failed to deliver: {}", provider, getDetailedErrorMessage(e));
        }

        // 3. Fall back to secondary email provider if enabled
        if (fallbackEnabled) {
            log.warn("[EmailService] Attempting fallback provider: {}", fallbackProvider);
            try {
                if ("brevo".equalsIgnoreCase(fallbackProvider)) {
                    sendViaBrevo(to, subject, content);
                    return;
                } else if ("sendgrid".equalsIgnoreCase(fallbackProvider)) {
                    sendViaSendGrid(to, subject, content);
                    return;
                } else {
                    sendViaFallbackSmtp(to, subject, content);
                    return;
                }
            } catch (Exception ex) {
                log.error("[EmailService] Fallback email provider failed as well.", ex);
                throw new EmailDeliveryException("Primary provider (" + provider + ") failed: " + getDetailedErrorMessage(lastException) + 
                        ". Fallback provider (" + fallbackProvider + ") failed: " + getDetailedErrorMessage(ex));
            }
        }

        throw new EmailDeliveryException("Email delivery failed using provider (" + provider + "): " + getDetailedErrorMessage(lastException));
    }

    private void sendViaSmtp(String to, String subject, String content) throws Exception {
        if (mailSender == null) {
            throw new IllegalStateException("Primary SMTP JavaMailSender is not initialized.");
        }

        if (mailSender instanceof JavaMailSenderImpl) {
            JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
            String host = impl.getHost();
            int port = impl.getPort();
            String username = impl.getUsername();
            String password = impl.getPassword();
            
            String maskedPassword = (password != null) ? "*".repeat(Math.min(password.length(), 8)) + " (length: " + password.length() + ")" : "null";
            log.info("[SMTP Diagnostics] Primary SMTP Host: {}, Port: {}, Username: {}, Password: {}", host, port, username, maskedPassword);

            if (password == null || password.trim().isEmpty() || password.equals("your-email-password")) {
                throw new IllegalStateException("SMTP credentials verification failed: Password is missing or placeholder.");
            }
        }

        int attempt = 0;
        Exception lastException = null;

        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                log.info("[SMTP] Attempt {}/{} to send email to {}", attempt, MAX_RETRIES, to);
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(senderEmail != null && !senderEmail.isEmpty() ? senderEmail : "your-email@gmail.com");
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(content, true);

                mailSender.send(message);
                log.info("[SMTP] Email sent successfully to {} on attempt {}", to, attempt);
                return;
            } catch (Exception e) {
                lastException = e;
                analyzeSmtpFailure(e);
                
                if (attempt < MAX_RETRIES && isTransientException(e)) {
                    long backoffDelay = RETRY_DELAY_MS * (long) Math.pow(2, attempt - 1);
                    log.info("[SMTP] Transient error detected. Retrying in {}ms (exponential backoff)...", backoffDelay);
                    Thread.sleep(backoffDelay);
                } else {
                    break;
                }
            }
        }

        throw lastException;
    }

    private void sendViaFallbackSmtp(String to, String subject, String content) throws Exception {
        if (fallbackHost == null || fallbackHost.trim().isEmpty()) {
            throw new IllegalStateException("Fallback SMTP host is not configured");
        }
        log.info("[SMTP Fallback] Sending email via fallback host: {}, port: {}", fallbackHost, fallbackPort);
        
        JavaMailSenderImpl fallbackSender = new JavaMailSenderImpl();
        fallbackSender.setHost(fallbackHost);
        fallbackSender.setPort(fallbackPort);
        fallbackSender.setUsername(fallbackUsername);
        fallbackSender.setPassword(fallbackPassword);

        Properties props = fallbackSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "30000");
        props.put("mail.smtp.timeout", "30000");
        props.put("mail.smtp.writetimeout", "30000");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.debug", "true");

        MimeMessage message = fallbackSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fallbackUsername != null && !fallbackUsername.isEmpty() ? fallbackUsername : senderEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(content, true);

        fallbackSender.send(message);
        log.info("[SMTP Fallback] Email sent successfully to {}", to);
    }

    private void sendViaBrevo(String to, String subject, String content) throws Exception {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Brevo API key is not configured (EMAIL_API_KEY)");
        }
        
        String url = "https://api.brevo.com/v3/smtp/email";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);
        
        Map<String, Object> payload = new HashMap<>();
        
        Map<String, String> sender = new HashMap<>();
        sender.put("name", senderName);
        sender.put("email", senderEmail != null && !senderEmail.isEmpty() ? senderEmail : "info@smartkrishi.com");
        payload.put("sender", sender);
        
        List<Map<String, String>> toList = new ArrayList<>();
        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", to);
        toList.add(recipient);
        payload.put("to", toList);
        
        payload.put("subject", subject);
        payload.put("htmlContent", content);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        
        log.info("[Brevo API] Sending email to {} via Brevo REST API...", to);
        restTemplate.postForEntity(url, request, String.class);
        log.info("[Brevo API] Email sent successfully to {}", to);
    }

    private void sendViaSendGrid(String to, String subject, String content) throws Exception {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("SendGrid API key is not configured (EMAIL_API_KEY)");
        }
        
        String url = "https://api.sendgrid.com/v3/mail/send";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        
        Map<String, Object> payload = new HashMap<>();
        
        List<Map<String, Object>> personalizations = new ArrayList<>();
        Map<String, Object> personalization = new HashMap<>();
        List<Map<String, String>> toList = new ArrayList<>();
        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", to);
        toList.add(recipient);
        personalization.put("to", toList);
        personalizations.add(personalization);
        payload.put("personalizations", personalizations);
        
        Map<String, String> from = new HashMap<>();
        from.put("email", senderEmail != null && !senderEmail.isEmpty() ? senderEmail : "info@smartkrishi.com");
        from.put("name", senderName);
        payload.put("from", from);
        
        payload.put("subject", subject);
        
        List<Map<String, String>> contentList = new ArrayList<>();
        Map<String, String> contentMap = new HashMap<>();
        contentMap.put("type", "text/html");
        contentMap.put("value", content);
        contentList.add(contentMap);
        payload.put("content", contentList);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        
        log.info("[SendGrid API] Sending email to {} via SendGrid REST API...", to);
        restTemplate.postForEntity(url, request, String.class);
        log.info("[SendGrid API] Email sent successfully to {}", to);
    }

    private void analyzeSmtpFailure(Throwable e) {
        if (e == null) return;
        
        String message = e.getMessage() != null ? e.getMessage() : "";
        String className = e.getClass().getName();
        
        if (e instanceof java.net.UnknownHostException || message.contains("UnknownHostException") || message.contains("Temporary failure in name resolution")) {
            log.error("[SMTP Audit] DNS Failure: The mail server host could not be resolved. Please verify host domain DNS.");
            return;
        }
        
        if (e instanceof java.net.SocketTimeoutException || message.contains("SocketTimeoutException") || message.contains("timed out") || message.contains("timeout")) {
            log.error("[SMTP Audit] TCP Timeout: Connection attempt timed out. Port 587/465 is likely blocked or SMTP server is unresponsive.");
            return;
        }
        if (e instanceof java.net.ConnectException || message.contains("ConnectException") || message.contains("Connection refused")) {
            log.error("[SMTP Audit] TCP Connection Refused: The server refused connection. Port is likely blocked by cloud provider (Render).");
            return;
        }
        if (className.equals("com.sun.mail.util.MailConnectException") || message.contains("MailConnectException") || message.contains("Couldn't connect to host")) {
            log.error("[SMTP Audit] TCP Connection Failure: Couldn't connect to host. Network path is blocked.");
            return;
        }
        
        if (e instanceof javax.net.ssl.SSLHandshakeException || message.contains("SSLHandshakeException") || message.contains("handshake") || message.contains("PKIX path building failed")) {
            log.error("[SMTP Audit] TLS/SSL Handshake Failure: SSL/TLS negotiation failed. Verify SSL settings or truststore.");
            return;
        }
        
        if (className.contains("Authentication") || message.contains("AuthenticationFailedException") || message.contains("535 5.7.8")) {
            log.error("[SMTP Audit] SMTP Authentication Failure: SMTP server rejected credentials. Verify Google App Password.");
            return;
        }
        
        if (e.getCause() != null && e.getCause() != e) {
            analyzeSmtpFailure(e.getCause());
        }
    }

    private boolean isTimeoutException(Throwable e) {
        if (e == null) return false;
        String className = e.getClass().getName();
        if (e instanceof java.net.SocketTimeoutException || 
            e instanceof java.net.ConnectException ||
            className.equals("com.sun.mail.util.MailConnectException")) {
            return true;
        }
        String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        if (msg.contains("timeout") || msg.contains("connect timed out") || msg.contains("connection timed out")) {
            return true;
        }
        return isTimeoutException(e.getCause());
    }

    private boolean isTransientException(Throwable e) {
        if (e == null) return false;
        String className = e.getClass().getName();
        if (e instanceof org.springframework.mail.MailAuthenticationException || className.contains("Authentication")) {
            return false;
        }
        if (isTimeoutException(e)) {
            return true;
        }
        String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        if (msg.contains("temporary") || msg.contains("try again") || msg.contains("421") || msg.contains("451") || msg.contains("452")) {
            return true;
        }
        return isTransientException(e.getCause());
    }

    private String getDetailedErrorMessage(Throwable e) {
        if (e == null) return "Unknown error";
        StringBuilder sb = new StringBuilder();
        sb.append(e.getClass().getSimpleName()).append(": ").append(e.getMessage());
        
        Throwable cause = e.getCause();
        int depth = 0;
        while (cause != null && depth < 3) {
            sb.append(" -> ").append(cause.getClass().getSimpleName()).append(": ").append(cause.getMessage());
            cause = cause.getCause();
            depth++;
        }
        return sb.toString();
    }
}
