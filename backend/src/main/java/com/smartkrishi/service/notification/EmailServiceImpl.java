package com.smartkrishi.service.notification;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
        log.info("Sending Email to {}: Subject: {}, Content: {}", to, subject, content);
        boolean isMockEmail = fromEmail == null || fromEmail.trim().isEmpty() || 
                             fromEmail.equals("your-email@gmail.com") || 
                             fromEmail.equals("your-email@gmail.com");

        if (mailSender != null && !isMockEmail) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(content, true);
                mailSender.send(message);
                log.info("Email sent successfully to {}", to);
            } catch (Exception e) {
                log.error("Failed to send email to {}", to, e);
            }
        } else {
            log.warn("SMTP email settings are using placeholders. Email sending simulated.");
        }
    }
}
