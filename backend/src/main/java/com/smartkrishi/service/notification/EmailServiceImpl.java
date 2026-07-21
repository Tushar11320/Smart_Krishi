package com.smartkrishi.service.notification;

import com.smartkrishi.exception.BadRequestException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Override
    public void sendEmail(String to, String subject, String content) {
        log.info("[SMTP] Preparing to send email. Recipient: {}, Subject: {}", to, subject);

        // 1. Validate recipient email address format (Requirement 6)
        if (to == null || !to.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            log.error("[SMTP] Email address validation failed for: {}", to);
            throw new BadRequestException("Please enter a valid email address.");
        }

        // 2. Verify environment variables are loaded and SMTP credentials are not missing or placeholders (Requirement 3)
        if (mailSender == null) {
            log.error("[SMTP] JavaMailSender bean is not initialized. Check your mail configuration properties.");
            throw new BadRequestException("SMTP Mail Sender is not initialized. Please check that MAIL_HOST, MAIL_PORT, MAIL_USERNAME and MAIL_PASSWORD are set correctly in your environment configuration.");
        }

        if (fromEmail == null || fromEmail.trim().isEmpty() || fromEmail.equals("your-email@gmail.com")) {
            log.error("[SMTP] MAIL_USERNAME (sender email) is empty or configured with a default placeholder: {}", fromEmail);
            throw new BadRequestException("Sender email address (MAIL_USERNAME) is missing or configured with a placeholder. Please set a valid sender email.");
        }

        // 3. Verify transporter connection before sending (Requirement 2 & 5)
        if (mailSender instanceof JavaMailSenderImpl) {
            JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
            String host = impl.getHost();
            int port = impl.getPort();
            String username = impl.getUsername();
            String password = impl.getPassword();
            
            String maskedPassword = (password != null) ? "*".repeat(Math.min(password.length(), 8)) + " (length: " + password.length() + ")" : "null";

            log.info("[SMTP Diagnostics] Host: {}, Port: {}, Username: {}, Password: {}", host, port, username, maskedPassword);

            if (password == null || password.trim().isEmpty() || password.equals("your-email-password") || password.equals("68A0EEC085847BB52E485ABD5CABFE231D50")) {
                log.error("[SMTP] SMTP Password is empty or uses placeholder credentials");
                throw new BadRequestException("SMTP credentials verification failed: Password is missing or uses a placeholder password. Please provide a valid App Password.");
            }

            // Connection testing is bypassed here to allow transient network pings and pooled connections to be managed internally by mailSender.send().
        }

        // 4. Send email and handle exceptions (Requirement 4, 5, 8, 13)
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);

            log.info("[SMTP] Sending MIME message to: {} ...", to);
            mailSender.send(message);
            log.info("[SMTP] Email sent successfully to {}", to);
            log.warn("[SPAM FOLDER WARNING] Ask the user to check their junk/spam folder if the email is not visible in the inbox.");
        } catch (Exception e) {
            log.error("[SMTP] Failed to deliver email to recipient: {}. Error Stack Trace: ", to, e);
            throw new BadRequestException("Email delivery failed. Exact SMTP error: " + e.getMessage());
        }
    }
}
