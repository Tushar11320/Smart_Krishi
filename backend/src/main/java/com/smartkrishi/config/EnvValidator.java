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

        checkRequired(dbUrl, "spring.datasource.url (DATABASE_URL)", missingOrInvalid, "jdbc:mysql");
        checkRequired(dbUsername, "spring.datasource.username (DATABASE_USERNAME)", missingOrInvalid, "username");
        checkRequired(dbPassword, "spring.datasource.password (DATABASE_PASSWORD)", missingOrInvalid, "password");
        checkRequired(jwtSecret, "spring.security.jwt.secret (JWT_SECRET)", missingOrInvalid, "secret");
        checkRequired(razorpayKeyId, "razorpay.key-id (RAZORPAY_KEY_ID)", missingOrInvalid, "key_id");
        checkRequired(razorpayKeySecret, "razorpay.key-secret (RAZORPAY_KEY_SECRET)", missingOrInvalid, "key_secret");
        checkRequired(razorpayWebhookSecret, "razorpay.webhook-secret (RAZORPAY_WEBHOOK_SECRET)", missingOrInvalid, "webhook_secret");
        checkRequired(weatherApiKey, "openweather.api-key (OPENWEATHER_API_KEY)", missingOrInvalid, "api_key");
        checkRequired(cloudinaryCloudName, "cloudinary.cloud-name (CLOUDINARY_CLOUD_NAME)", missingOrInvalid, "cloud_name");
        checkRequired(cloudinaryApiKey, "cloudinary.api-key (CLOUDINARY_API_KEY)", missingOrInvalid, "api_key");
        checkRequired(cloudinaryApiSecret, "cloudinary.api-secret (CLOUDINARY_API_SECRET)", missingOrInvalid, "api_secret");

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
}
