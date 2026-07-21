package com.smartkrishi.service.notification;

import com.smartkrishi.exception.BadRequestException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${email.fallback.enabled:false}")
    private boolean fallbackEnabled;

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
        log.info("[SMTP] Preparing to send email. Recipient: {}, Subject: {}", to, subject);

        // 1. Validate recipient email address format
        if (to == null || !to.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            log.error("[SMTP] Email address validation failed for: {}", to);
            throw new BadRequestException("Please enter a valid email address.");
        }

        // 2. Check if primary sender is null
        if (mailSender == null) {
            log.warn("[SMTP] Primary JavaMailSender is null. Attempting fallback immediately if enabled.");
            if (fallbackEnabled) {
                try {
                    sendUsingFallback(to, subject, content);
                    return;
                } catch (Exception ex) {
                    throw new BadRequestException("Primary SMTP is not initialized and Fallback SMTP failed: " + getDetailedErrorMessage(ex));
                }
            } else {
                throw new BadRequestException("SMTP Mail Sender is not initialized. Please configure SMTP or enable fallback.");
            }
        }

        if (mailSender instanceof JavaMailSenderImpl) {
            JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
            String host = impl.getHost();
            int port = impl.getPort();
            String username = impl.getUsername();
            String password = impl.getPassword();
            
            String maskedPassword = (password != null) ? "*".repeat(Math.min(password.length(), 8)) + " (length: " + password.length() + ")" : "null";

            log.info("[SMTP Diagnostics] Host: {}, Port: {}, Username: {}, Password: {}", host, port, username, maskedPassword);

            if (password == null || password.trim().isEmpty() || password.equals("your-email-password")) {
                log.error("[SMTP] SMTP Password is empty or uses placeholder credentials");
                throw new BadRequestException("SMTP credentials verification failed: Password is missing or uses a placeholder password. Please provide a valid App Password.");
            }
        }

        // 3. Send email with retries and exception handling
        int attempt = 0;
        Exception lastException = null;

        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                log.info("[SMTP] Attempt {}/{} to send email to {}", attempt, MAX_RETRIES, to);
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(content, true);

                log.info("[SMTP] Sending MIME message to: {} ...", to);
                mailSender.send(message);
                log.info("[SMTP] Email sent successfully to {} on attempt {}", to, attempt);
                return;
            } catch (org.springframework.mail.MailAuthenticationException e) {
                lastException = e;
                log.error("[SMTP] Authentication failed on attempt {}: {}", attempt, getDetailedErrorMessage(e));
                // Authentication failure is fatal for this provider
                break;
            } catch (Exception e) {
                lastException = e;
                boolean isTimeout = isTimeoutException(e);
                if (isTimeout) {
                    log.error("[SMTP] Network connection timeout occurred on attempt {}: {}", attempt, getDetailedErrorMessage(e));
                } else {
                    log.warn("[SMTP] Error sending email on attempt {} of {}: {}", attempt, MAX_RETRIES, getDetailedErrorMessage(e));
                }
                
                if (attempt < MAX_RETRIES && isTransientException(e)) {
                    long backoffDelay = RETRY_DELAY_MS * (long) Math.pow(2, attempt - 1);
                    log.info("[SMTP] Transient error detected. Retrying in {}ms (exponential backoff)...", backoffDelay);
                    try {
                        Thread.sleep(backoffDelay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new BadRequestException("Email sending interrupted during retry: " + ie.getMessage());
                    }
                } else {
                    break;
                }
            }
        }

        // 4. Fall back to secondary email provider if enabled
        if (fallbackEnabled) {
            log.warn("[SMTP] Primary SMTP failed. Attempting fallback email provider...");
            try {
                sendUsingFallback(to, subject, content);
                return;
            } catch (Exception ex) {
                log.error("[SMTP] Fallback email provider failed as well.", ex);
                throw new BadRequestException("Primary SMTP failed (" + getDetailedErrorMessage(lastException) + 
                        ") and Fallback SMTP failed (" + getDetailedErrorMessage(ex) + ").");
            }
        }

        log.error("[SMTP] Failed to deliver email to recipient: {} after {} attempts. Error: ", to, MAX_RETRIES, lastException);
        throw new BadRequestException("Email delivery failed after " + MAX_RETRIES + " attempts. Exact SMTP error: " + getDetailedErrorMessage(lastException));
    }

    private void sendUsingFallback(String to, String subject, String content) throws Exception {
        if (fallbackHost == null || fallbackHost.trim().isEmpty()) {
            throw new IllegalStateException("Fallback host is not configured");
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
        helper.setFrom(fallbackUsername != null && !fallbackUsername.isEmpty() ? fallbackUsername : fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(content, true);

        fallbackSender.send(message);
        log.info("[SMTP Fallback] Email sent successfully to {}", to);
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
        if (e instanceof org.springframework.mail.MailAuthenticationException) {
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
