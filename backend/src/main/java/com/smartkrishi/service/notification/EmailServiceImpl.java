package com.smartkrishi.service.notification;

import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.EmailDeliveryException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${email.sender-email:}")
    private String senderEmail;

    @Value("${email.sender-name:Smart Krishi}")
    private String senderName;

    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_RETRY_DELAY_MS = 2000;

    @Override
    public void sendEmail(String to, String subject, String content) {
        log.info("[EmailService] Initiating email sending to: {}, Subject: {}", to, subject);

        // 1. Validate recipient email address format
        if (to == null || !to.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            log.error("[EmailService] Email address validation failed for recipient: {}", to);
            throw new BadRequestException("Please enter a valid email address.");
        }

        // 2. Dispatch email via Gmail SMTP with retry logic
        sendViaSmtpWithRetry(to, subject, content);
    }

    private void sendViaSmtpWithRetry(String to, String subject, String content) {
        if (mailSender == null) {
            log.error("[EmailService] Primary SMTP JavaMailSender is not initialized.");
            throw new EmailDeliveryException("SMTP JavaMailSender bean is not configured in application context.");
        }

        if (mailSender instanceof JavaMailSenderImpl) {
            JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
            String host = impl.getHost();
            int port = impl.getPort();
            String username = impl.getUsername();
            String password = impl.getPassword();

            String maskedPassword = (password != null && !password.isEmpty())
                    ? "*".repeat(Math.min(password.length(), 8)) + " (length: " + password.length() + ")"
                    : "null/empty";
            log.info("[SMTP Diagnostics] Host: {}, Port: {}, Username: {}, Password: {}", host, port, username, maskedPassword);
        }

        int attempt = 0;
        Exception lastException = null;

        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                log.info("[SMTP] Attempt {}/{} to send email to {}", attempt, MAX_RETRIES, to);
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                String fromEmail = (senderEmail != null && !senderEmail.trim().isEmpty())
                        ? senderEmail.trim()
                        : ((mailUsername != null && !mailUsername.trim().isEmpty()) ? mailUsername.trim() : "tusharbarskar8@gmail.com");

                helper.setFrom(fromEmail);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(content, true);

                mailSender.send(message);
                log.info("[SMTP] Email sent successfully to {} on attempt {}/{}", to, attempt, MAX_RETRIES);
                return;
            } catch (Exception e) {
                lastException = e;
                log.warn("[SMTP] Attempt {}/{} failed for recipient {}: {}", attempt, MAX_RETRIES, to, e.getMessage());
                analyzeSmtpFailure(e);

                if (attempt < MAX_RETRIES) {
                    long backoffDelay = INITIAL_RETRY_DELAY_MS * (long) Math.pow(2, attempt - 1);
                    log.info("[SMTP] Retrying in {}ms (exponential backoff)...", backoffDelay);
                    try {
                        Thread.sleep(backoffDelay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.error("[SMTP] Retry sleep interrupted", ie);
                        break;
                    }
                }
            }
        }

        log.error("[EmailService] All {} attempts to send email to {} failed.", MAX_RETRIES, to, lastException);
        throw new EmailDeliveryException("Failed to send verification email via Gmail SMTP: " + getDetailedErrorMessage(lastException), lastException);
    }

    private void analyzeSmtpFailure(Throwable e) {
        if (e == null) return;

        String message = e.getMessage() != null ? e.getMessage() : "";
        String className = e.getClass().getName();

        if (e instanceof java.net.UnknownHostException || message.contains("UnknownHostException")) {
            log.error("[SMTP Audit] DNS Failure: Host smtp.gmail.com could not be resolved.");
        } else if (e instanceof java.net.SocketTimeoutException || message.contains("SocketTimeoutException") || message.contains("timed out")) {
            log.error("[SMTP Audit] TCP Timeout: Connection timed out. Port 587 may be blocked by network firewall or server unresponsive.");
        } else if (e instanceof java.net.ConnectException || message.contains("ConnectException")) {
            log.error("[SMTP Audit] TCP Connection Refused: Port 587 refused connection.");
        } else if (className.contains("MailConnectException") || message.contains("Couldn't connect to host")) {
            log.error("[SMTP Audit] TCP Connection Failure: Couldn't connect to host smtp.gmail.com on port 587.");
        } else if (className.contains("Authentication") || message.contains("535 5.7.8")) {
            log.error("[SMTP Audit] SMTP Authentication Failure: Google App Password rejected. Verify MAIL_USERNAME and MAIL_PASSWORD.");
        } else {
            log.error("[SMTP Audit] Uncategorized SMTP Error [{}]: {}", className, message);
        }

        if (e.getCause() != null && e.getCause() != e) {
            analyzeSmtpFailure(e.getCause());
        }
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
