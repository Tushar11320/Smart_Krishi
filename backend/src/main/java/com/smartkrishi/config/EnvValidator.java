package com.smartkrishi.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@Slf4j
public class EnvValidator {

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${spring.security.jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret:}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook-secret:}")
    private String razorpayWebhookSecret;

    @Value("${openweather.api-key:}")
    private String weatherApiKey;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @Value("${cloudinary.api-secret:}")
    private String cloudinaryApiSecret;

    @PostConstruct
    public void validate() {
        if (!"prod".equalsIgnoreCase(activeProfile)) {
            log.info("Active profile is '{}'. Skipping strict environment validation.", activeProfile);
            return;
        }

        log.info("Active profile is 'prod'. Executing strict production environment variable checks...");
        List<String> missingOrInvalid = new ArrayList<>();

        // Critical configurations - Missing values will crash the application
        checkRequired(dbUrl, "spring.datasource.url (DATABASE_URL)", missingOrInvalid, "jdbc:mysql");
        
        boolean hasUserInfoInUrl = false;
        if (dbUrl != null && (dbUrl.startsWith("mysql://") || dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
            try {
                java.net.URI dbUri = new java.net.URI(dbUrl);
                if (dbUri.getUserInfo() != null && dbUri.getUserInfo().contains(":")) {
                    hasUserInfoInUrl = true;
                }
            } catch (Exception e) {
                // ignore
            }
        }

        if (!hasUserInfoInUrl) {
            checkRequired(dbUsername, "spring.datasource.username (DATABASE_USERNAME)", missingOrInvalid, "username");
            checkRequired(dbPassword, "spring.datasource.password (DATABASE_PASSWORD)", missingOrInvalid, "password");
        } else {
            log.info("Database credentials will be dynamically parsed from DATABASE_URL. Skipping standalone username/password check.");
        }
        checkRequired(jwtSecret, "spring.security.jwt.secret (JWT_SECRET)", missingOrInvalid, "secret");

        // Optional configurations - Missing values will log warnings but allow startup
        checkOptional(mailUsername, "spring.mail.username (MAIL_USERNAME)", "your-email@gmail.com");
        checkOptional(mailPassword, "spring.mail.password (MAIL_PASSWORD)", "your-email-password");
        checkOptional(razorpayKeyId, "razorpay.key-id (RAZORPAY_KEY_ID)", "key_id");
        checkOptional(razorpayKeySecret, "razorpay.key-secret (RAZORPAY_KEY_SECRET)", "key_secret");
        checkOptional(razorpayWebhookSecret, "razorpay.webhook-secret (RAZORPAY_WEBHOOK_SECRET)", "webhook_secret");
        checkOptional(weatherApiKey, "openweather.api-key (OPENWEATHER_API_KEY)", "api_key");
        checkOptional(cloudinaryCloudName, "cloudinary.cloud-name (CLOUDINARY_CLOUD_NAME)", "cloud_name");
        checkOptional(cloudinaryApiKey, "cloudinary.api-key (CLOUDINARY_API_KEY)", "api_key");
        checkOptional(cloudinaryApiSecret, "cloudinary.api-secret (CLOUDINARY_API_SECRET)", "api_secret");

        if (!missingOrInvalid.isEmpty()) {
            log.error("=========================================================================");
            log.error("PRODUCTION DEPLOYMENT FAILED: Missing or placeholder environment variables:");
            for (String error : missingOrInvalid) {
                log.error(" - " + error);
            }
            log.error("=========================================================================");
            throw new IllegalStateException("Production environment variable validation failed. Please set required secrets in Render settings.");
        }

        log.info("Production environment variable validation completed successfully. All keys are set.");
    }

    private void checkRequired(String value, String keyName, List<String> errors, String placeholderPattern) {
        if (value == null || value.trim().isEmpty()) {
            errors.add(keyName + " is missing or empty.");
            return;
        }
        String valLower = value.trim().toLowerCase();
        if (valLower.contains("your-") || valLower.contains("your_") || valLower.contains("demo-") || valLower.equals(placeholderPattern.toLowerCase())) {
            errors.add(keyName + " contains an invalid default placeholder value: '" + value + "'");
        }
    }

    private void checkOptional(String value, String keyName, String placeholderPattern) {
        if (value == null || value.trim().isEmpty()) {
            log.warn("[ENV CONFIG WARNING] Optional configuration {} is missing or empty.", keyName);
            return;
        }
        String valLower = value.trim().toLowerCase();
        if (valLower.contains("your-") || valLower.contains("your_") || valLower.contains("demo-") || valLower.equals(placeholderPattern.toLowerCase())) {
            log.warn("[ENV CONFIG WARNING] Optional configuration {} contains an invalid default placeholder value: '{}'", keyName, value);
        }
    }
}
