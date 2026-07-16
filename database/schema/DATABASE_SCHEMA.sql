-- Smart Krishi Database Schema
-- MySQL 8.0+ Production-Ready DDL Scripts
-- Domain: Agricultural Super-App & Multi-Vendor Marketplace
-- Scale: 1M+ Users, 100K+ Sellers, Millions of Products

-- =====================================================
-- DATABASE CREATION
-- =====================================================

DROP DATABASE IF EXISTS smart_krishi;
CREATE DATABASE smart_krishi
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smart_krishi;

-- =====================================================
-- DOMAIN 1: AUTHENTICATION & SECURITY
-- =====================================================

-- Users Table - Core user identity
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'User ID',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email address',
    phone VARCHAR(20) NOT NULL UNIQUE COMMENT 'Phone number',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hashed password (bcrypt)',
    first_name VARCHAR(100) NOT NULL COMMENT 'First name',
    last_name VARCHAR(100) NOT NULL COMMENT 'Last name',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Account status',
    email_verified BOOLEAN DEFAULT FALSE COMMENT 'Email verification status',
    phone_verified BOOLEAN DEFAULT FALSE COMMENT 'Phone verification status',
    two_factor_enabled BOOLEAN DEFAULT FALSE COMMENT 'Two-factor authentication enabled',
    last_login_at TIMESTAMP NULL COMMENT 'Last login timestamp',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation date',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update',
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Core user accounts for all roles';

-- User Roles - Role assignment (M:M bridge)
CREATE TABLE user_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL COMMENT 'BUYER, SELLER, ADMIN, MODERATOR',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by_admin_id BIGINT COMMENT 'Admin who assigned role',
    
    UNIQUE KEY uk_user_role (user_id, role_name),
    FOREIGN KEY fk_user_roles_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='M:M relationship between users and roles';

-- Login History - Audit trail for logins
CREATE TABLE login_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    login_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device_id VARCHAR(255) COMMENT 'Device fingerprint',
    device_type VARCHAR(50) COMMENT 'MOBILE, DESKTOP, TABLET',
    os_name VARCHAR(100) COMMENT 'Operating system',
    browser_name VARCHAR(100) COMMENT 'Browser name',
    ip_address VARCHAR(45) COMMENT 'IPv4 or IPv6',
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    login_status ENUM('SUCCESS', 'FAILED', 'SUSPICIOUS') DEFAULT 'SUCCESS',
    failure_reason VARCHAR(255),
    
    FOREIGN KEY fk_login_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, login_timestamp),
    INDEX idx_device_id (device_id),
    INDEX idx_login_timestamp (login_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Login attempt tracking and audit trail'
PARTITION BY RANGE(YEAR(login_timestamp)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Audit Logs - Security and change audit trail
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Audit log ID',
    entity_type VARCHAR(100) NOT NULL COMMENT 'Type of entity modified',
    entity_id BIGINT NOT NULL COMMENT 'ID of the entity modified',
    action VARCHAR(100) NOT NULL COMMENT 'Action description',
    actor_id BIGINT COMMENT 'User ID of the actor',
    actor_type VARCHAR(20) DEFAULT 'SYSTEM' COMMENT 'SYSTEM, ADMIN, USER',
    old_values TEXT COMMENT 'Serialized representation of values before change',
    new_values TEXT COMMENT 'Serialized representation of values after change',
    change_reason VARCHAR(500) COMMENT 'Reason for the change',
    ip_address VARCHAR(45) COMMENT 'IP address of the client',
    user_agent TEXT COMMENT 'Browser user agent details',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Log timestamp',
    
    INDEX idx_entity_type_id (entity_type, entity_id),
    INDEX idx_actor_id (actor_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='General security and change audit trails';

-- Sessions - Active session management
CREATE TABLE sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(500) NOT NULL UNIQUE COMMENT 'JWT token',
    device_id VARCHAR(255),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL COMMENT 'Session expiry',
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY fk_sessions_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_sessions (user_id, is_active),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Active user sessions with JWT metadata';

-- Devices - Multi-device login tracking
CREATE TABLE devices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) COMMENT 'User-assigned device name',
    device_type VARCHAR(50) COMMENT 'MOBILE, DESKTOP, TABLET',
    fcm_token VARCHAR(500) COMMENT 'Firebase Cloud Messaging token',
    push_notifications_enabled BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_devices_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_devices (user_id),
    INDEX idx_fcm_token (fcm_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Multi-device management and push notification tokens';

-- OTP Verifications - Email and SMS OTP
CREATE TABLE otp_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    otp_code VARCHAR(10) NOT NULL COMMENT '6-digit OTP',
    otp_type ENUM('EMAIL', 'SMS', 'CALL') NOT NULL,
    destination VARCHAR(255) NOT NULL COMMENT 'Email or phone',
    attempt_count INT DEFAULT 0 COMMENT 'Failed attempt count',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL COMMENT 'OTP expiry (usually 15 min)',
    verified_at TIMESTAMP NULL,
    
    FOREIGN KEY fk_otp_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_otp_type (user_id, otp_type),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='OTP generation and verification tracking';

-- Password Resets - Password reset token management
CREATE TABLE password_resets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reset_token VARCHAR(500) NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    
    FOREIGN KEY fk_password_reset_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reset_token (reset_token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Secure password reset token management';

-- =====================================================
-- DOMAIN 2: USER MANAGEMENT
-- =====================================================

-- Buyer Profiles - Buyer-specific information
CREATE TABLE buyer_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSON COMMENT 'Email, SMS, Push preferences',
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0 COMMENT 'Denormalized for quick stats',
    total_spent DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Denormalized',
    loyalty_points INT DEFAULT 0,
    preferred_category VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_buyer_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_preferred_language (preferred_language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Buyer-specific profile information';

-- Seller Profiles - Seller business profiles
CREATE TABLE seller_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    business_category VARCHAR(100) COMMENT 'MACHINERY, FERTILIZERS, DAIRY, etc.',
    business_website VARCHAR(500),
    seller_status ENUM('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED') DEFAULT 'PENDING',
    verification_document_url VARCHAR(500) COMMENT 'Business registration doc',
    verified_at TIMESTAMP NULL,
    verified_by_admin_id BIGINT COMMENT 'Admin who verified',
    approval_notes TEXT,
    logo_url VARCHAR(500),
    total_products INT DEFAULT 0 COMMENT 'Denormalized',
    total_sales DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Denormalized',
    rating DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'Average seller rating',
    review_count INT DEFAULT 0,
    response_time_hours INT DEFAULT 0 COMMENT 'Avg response time',
    return_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Return percentage',
    cancellation_rate DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_seller_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_seller_status (seller_status),
    INDEX idx_rating (rating),
    INDEX idx_business_category (business_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Seller business profile and verification status';

-- User Addresses - Multiple addresses per user
CREATE TABLE user_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    address_type ENUM('HOME', 'FARM', 'OFFICE', 'WAREHOUSE', 'OTHER') NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    alternate_mobile_number VARCHAR(20),
    house_number VARCHAR(255) NOT NULL,
    street VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_user_addresses_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Multiple delivery and billing addresses per user';

-- User Documents - KYC and identity documents
CREATE TABLE user_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    document_type ENUM('AADHAR', 'PAN', 'VOTER_ID', 'PASSPORT', 'LICENSE', 'GST', 'OTHER') NOT NULL,
    document_number VARCHAR(100),
    document_url VARCHAR(500) NOT NULL COMMENT 'S3 URL',
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY fk_documents_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_document_type (document_type),
    INDEX idx_verified (verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User identity documents for KYC verification';

-- KYC Verifications - KYC verification workflow
CREATE TABLE kyc_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    verification_status ENUM('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING',
    verification_type ENUM('BUYER', 'SELLER') NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    verified_by_admin_id BIGINT,
    rejection_reason VARCHAR(500),
    admin_notes TEXT,
    expiry_date DATE COMMENT 'KYC expiry date',
    
    FOREIGN KEY fk_kyc_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_kyc_admin (verified_by_admin_id) REFERENCES users(id),
    INDEX idx_verification_status (verification_status),
    INDEX idx_verification_type (verification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='KYC verification tracking and audit';

-- Profile Photos - User profile pictures
CREATE TABLE profile_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    photo_url VARCHAR(500) NOT NULL COMMENT 'S3 URL',
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_profile_photo_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_current (user_id, is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User profile photo history';

-- =====================================================
-- DOMAIN 3: SELLER BUSINESS
-- =====================================================

-- Seller Business Info - GST and PAN
CREATE TABLE seller_business_info (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_profile_id BIGINT NOT NULL UNIQUE,
    gst_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'GST registration number',
    gst_certificate_url VARCHAR(500),
    pan_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'PAN number',
    pan_certificate_url VARCHAR(500),
    business_type ENUM('SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED') NOT NULL,
    founded_year INT,
    total_employees INT,
    annual_turnover DECIMAL(15, 2),
    gst_verification_status ENUM('PENDING', 'VERIFIED', 'FAILED') DEFAULT 'PENDING',
    pan_verification_status ENUM('PENDING', 'VERIFIED', 'FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_business_seller (seller_profile_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    INDEX idx_gst (gst_number),
    INDEX idx_pan (pan_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Seller GST and PAN information';

-- Seller Bank Accounts - Payment settlement accounts
CREATE TABLE seller_bank_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_profile_id BIGINT NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL COMMENT 'Encrypted',
    ifsc_code VARCHAR(20) NOT NULL,
    account_type ENUM('SAVINGS', 'CURRENT') NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    verification_status ENUM('PENDING', 'VERIFIED', 'FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_bank_seller (seller_profile_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    INDEX idx_primary (is_primary),
    UNIQUE KEY uk_seller_account (seller_profile_id, account_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Seller bank accounts for payment settlements';

-- Seller UPI Accounts - Fast settlement via UPI
CREATE TABLE seller_upi_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_profile_id BIGINT NOT NULL,
    upi_id VARCHAR(255) NOT NULL UNIQUE COMMENT 'Encrypted',
    upi_holder_name VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    verification_status ENUM('PENDING', 'VERIFIED', 'FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_upi_seller (seller_profile_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Seller UPI accounts for instant settlements';

-- Seller Ratings - Aggregated seller ratings
CREATE TABLE seller_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_profile_id BIGINT NOT NULL UNIQUE,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    five_star_count INT DEFAULT 0,
    four_star_count INT DEFAULT 0,
    three_star_count INT DEFAULT 0,
    two_star_count INT DEFAULT 0,
    one_star_count INT DEFAULT 0,
    communication_rating DECIMAL(3, 2) DEFAULT 0.00,
    delivery_rating DECIMAL(3, 2) DEFAULT 0.00,
    product_quality_rating DECIMAL(3, 2) DEFAULT 0.00,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_seller_rating (seller_profile_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    INDEX idx_average_rating (average_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Denormalized seller rating statistics';

-- Seller Analytics - Seller performance metrics
CREATE TABLE seller_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_profile_id BIGINT NOT NULL UNIQUE,
    total_products INT DEFAULT 0,
    active_products INT DEFAULT 0,
    total_sales DECIMAL(15, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    cancelled_orders INT DEFAULT 0,
    returned_orders INT DEFAULT 0,
    return_rate DECIMAL(5, 2) DEFAULT 0.00,
    cancellation_rate DECIMAL(5, 2) DEFAULT 0.00,
    average_response_time_hours INT DEFAULT 0,
    repeat_customer_rate DECIMAL(5, 2) DEFAULT 0.00,
    views_count BIGINT DEFAULT 0,
    searches_count BIGINT DEFAULT 0,
    add_to_cart_count BIGINT DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_seller_analytics (seller_profile_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Denormalized seller performance analytics, updated daily';

-- =====================================================
-- DOMAIN 4: PRODUCT CATALOG
-- =====================================================

-- Categories - Product categories (L1)
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    category_slug VARCHAR(255) NOT NULL UNIQUE COMMENT 'URL-friendly slug',
    category_image_url VARCHAR(500),
    category_description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_category_slug (category_slug),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Level 1 product categories';

-- Subcategories - Product subcategories (L2)
CREATE TABLE subcategories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    subcategory_name VARCHAR(255) NOT NULL,
    subcategory_slug VARCHAR(255) NOT NULL,
    subcategory_image_url VARCHAR(500),
    subcategory_description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_subcat_category (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY uk_subcategory_name (category_id, subcategory_name),
    INDEX idx_subcategory_slug (subcategory_slug),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Level 2 product subcategories';

-- Products - Main product table
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    subcategory_id BIGINT NULL,
    sku VARCHAR(100) NOT NULL COMMENT 'Stock keeping unit',
    product_name VARCHAR(500) NOT NULL,
    product_description LONGTEXT,
    short_description VARCHAR(1000),
    price DECIMAL(15, 2) NOT NULL,
    discount_price DECIMAL(15, 2),
    discount_percentage DECIMAL(5, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    product_status ENUM('ACTIVE', 'DRAFT', 'INACTIVE', 'DELETED') DEFAULT 'DRAFT',
    rating DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'Denormalized from reviews',
    review_count INT DEFAULT 0 COMMENT 'Denormalized',
    purchase_count INT DEFAULT 0 COMMENT 'Total purchases',
    view_count INT DEFAULT 0 COMMENT 'Product impressions',
    is_featured BOOLEAN DEFAULT FALSE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    return_policy_days INT DEFAULT 7,
    warranty_months INT DEFAULT 0,
    seo_title VARCHAR(500),
    seo_description VARCHAR(1000),
    seo_keywords VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete',
    
    FOREIGN KEY fk_product_seller (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY fk_product_category (category_id) REFERENCES categories(id),
    FOREIGN KEY fk_product_subcategory (subcategory_id) REFERENCES subcategories(id),
    UNIQUE KEY uk_seller_sku (seller_id, sku),
    INDEX idx_seller_id (seller_id),
    INDEX idx_category_id (category_id),
    INDEX idx_product_status (product_status),
    INDEX idx_created_at (created_at),
    INDEX idx_rating (rating),
    INDEX idx_bestseller (is_bestseller),
    FULLTEXT INDEX idx_product_search (product_name, product_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Main product catalog'
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Product Images - Multiple images per product
CREATE TABLE product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL COMMENT 'S3 URL',
    image_type ENUM('MAIN', 'THUMBNAIL', 'DETAIL', 'VIDEO_THUMBNAIL') DEFAULT 'MAIN',
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_product_images (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_primary (product_id, is_primary),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Product images (1:M relationship)';

-- Product Videos - Product videos (YouTube/Vimeo)
CREATE TABLE product_videos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    video_url VARCHAR(500) NOT NULL COMMENT 'YouTube/Vimeo URL',
    video_title VARCHAR(255),
    video_description TEXT,
    display_order INT DEFAULT 0,
    thumbnail_url VARCHAR(500),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_product_videos (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Product video links for demos';

-- Product Specifications - Key-value product specs
CREATE TABLE product_specifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    spec_key VARCHAR(255) NOT NULL COMMENT 'Color, Size, Material, etc.',
    spec_value VARCHAR(1000) NOT NULL,
    display_order INT DEFAULT 0,
    
    FOREIGN KEY fk_product_specs (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_spec_key (spec_key),
    INDEX idx_product_specs (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Product specifications key-value pairs';

-- Product Variants - Size/color variants
CREATE TABLE product_variants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    variant_sku VARCHAR(100) NOT NULL,
    variant_name VARCHAR(255) NOT NULL COMMENT 'Red-XL, Blue-M, etc.',
    variant_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    variant_discount_price DECIMAL(15, 2),
    variant_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_product_variants (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_product_variant_sku (product_id, variant_sku),
    INDEX idx_product_variants (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Product size/color/variants';

-- Product Inventory - Stock management
CREATE TABLE product_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE,
    variant_id BIGINT COMMENT 'NULL for non-variant products',
    quantity_available INT NOT NULL DEFAULT 0 COMMENT 'Current stock',
    quantity_reserved INT DEFAULT 0 COMMENT 'Reserved for pending orders',
    quantity_sold BIGINT DEFAULT 0 COMMENT 'Cumulative sold',
    warehouse_location VARCHAR(255),
    reorder_level INT DEFAULT 10 COMMENT 'Alert when below this',
    last_restocked_at TIMESTAMP,
    last_sale_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_inventory_product (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY fk_inventory_variant (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_available (quantity_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Product inventory and stock tracking'
PARTITION BY HASH(product_id) PARTITIONS 32;

-- Category Attributes - Dynamic attributes per category
CREATE TABLE category_attributes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    attribute_name VARCHAR(255) NOT NULL,
    attribute_type ENUM('TEXT', 'NUMBER', 'DROPDOWN', 'MULTISELECT', 'DATE') DEFAULT 'TEXT',
    attribute_values JSON COMMENT 'Array of possible values for dropdown',
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_filterable BOOLEAN DEFAULT TRUE COMMENT 'Usable for search filters',
    display_order INT DEFAULT 0,
    
    FOREIGN KEY fk_attr_category (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY uk_category_attribute (category_id, attribute_name),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dynamic attributes per category for filtering';

-- =====================================================
-- DOMAIN 5: AGRICULTURAL PRODUCTS
-- =====================================================

-- Crops - Crop-specific information
CREATE TABLE crops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE COMMENT 'Links to products table',
    crop_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    crop_type VARCHAR(100) COMMENT 'CEREAL, PULSES, OILSEEDS, SPICES',
    growing_season VARCHAR(100) COMMENT 'SUMMER, WINTER, MONSOON',
    growth_cycle_days INT,
    soil_type VARCHAR(255),
    water_requirement VARCHAR(255),
    temperature_min INT,
    temperature_max INT,
    yield_per_hectare VARCHAR(100),
    market_demand VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_crop_product (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Crop-specific metadata';

-- Machinery - Farming machinery details
CREATE TABLE machinery (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE,
    machinery_type VARCHAR(100) NOT NULL COMMENT 'TRACTOR, HARVESTER, PLOUGH, etc.',
    brand_name VARCHAR(255),
    model_number VARCHAR(255),
    engine_type VARCHAR(100) COMMENT 'DIESEL, PETROL, ELECTRIC',
    power_hp INT,
    capacity_specification VARCHAR(255),
    maintenance_interval_hours INT,
    warranty_years INT,
    fuel_efficiency VARCHAR(100),
    noise_level_db INT,
    manufacturing_year INT NULL,
    condition_status VARCHAR(50) NULL,
    negotiable BOOLEAN DEFAULT FALSE,
    rent_per_hour DECIMAL(15, 2) NULL,
    rent_per_day DECIMAL(15, 2) NULL,
    rent_per_week DECIMAL(15, 2) NULL,
    security_deposit DECIMAL(15, 2) NULL,
    available_for_sale BOOLEAN DEFAULT TRUE,
    available_for_rent BOOLEAN DEFAULT FALSE,
    available_for_both BOOLEAN DEFAULT FALSE,
    state VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    village_city VARCHAR(100) NULL,
    pincode VARCHAR(20) NULL,
    gps_location VARCHAR(100) NULL,
    video_url VARCHAR(500) NULL,
    registration_certificate_url VARCHAR(500) NULL,
    insurance_document_url VARCHAR(500) NULL,
    engine_power VARCHAR(100) NULL,
    fuel_type VARCHAR(100) NULL,
    working_width VARCHAR(100) NULL,
    weight VARCHAR(100) NULL,
    other_specifications TEXT NULL,
    seller_contact_name VARCHAR(100) NULL,
    mobile_number VARCHAR(20) NULL,
    alternate_number VARCHAR(20) NULL,
    whatsapp_number VARCHAR(20) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_machinery_product (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Farming machinery specifications';

-- Machinery Rental Bookings - Rental reservations
CREATE TABLE machinery_rental_bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    machinery_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    security_deposit DECIMAL(15, 2) NOT NULL,
    booking_status VARCHAR(50) NOT NULL,
    return_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_booking_machinery (machinery_id) REFERENCES machinery(id) ON DELETE CASCADE,
    FOREIGN KEY fk_booking_buyer (buyer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Machinery rental slot bookings';

-- Fertilizers - Fertilizer product details
CREATE TABLE fertilizers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE,
    fertilizer_type VARCHAR(100) NULL COMMENT 'ORGANIC, INORGANIC, BIO-FERTILIZER',
    npk_ratio VARCHAR(20) COMMENT 'N-P-K ratio, e.g., 15-15-15',
    nitrogen_percent DECIMAL(5, 2),
    phosphorus_percent DECIMAL(5, 2),
    potassium_percent DECIMAL(5, 2),
    application_method VARCHAR(255) COMMENT 'SPRAY, SOIL, SEED',
    application_rate VARCHAR(255) COMMENT 'kg/hectare or similar',
    toxicity_level ENUM('NON_TOXIC', 'LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW',
    safety_period_days INT COMMENT 'Days to harvest after application',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_fertilizer_product (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Fertilizer product specifications';

-- Land Listings - Land marketplace
CREATE TABLE land_listings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT NOT NULL COMMENT 'Farmer selling land',
    location_description VARCHAR(500),
    area_in_acres DECIMAL(10, 2) NOT NULL,
    area_in_sqft DECIMAL(12, 2),
    price_per_acre DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    land_status ENUM('AVAILABLE', 'SOLD', 'DELISTED', 'PENDING') DEFAULT 'AVAILABLE',
    boundary_verified BOOLEAN DEFAULT FALSE,
    wildlife_sanctuary_nearby BOOLEAN DEFAULT FALSE,
    irrigation_facility BOOLEAN DEFAULT FALSE,
    power_supply BOOLEAN DEFAULT FALSE,
    road_access VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_land_seller (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    INDEX idx_land_status (land_status),
    INDEX idx_area (area_in_acres),
    SPATIAL INDEX idx_location (point(latitude, longitude))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Land marketplace listings with geolocation'
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Land Soil Information - Soil composition
CREATE TABLE land_soil_information (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    land_listing_id BIGINT NOT NULL,
    soil_type VARCHAR(100) COMMENT 'CLAY, LOAM, SAND, SILT',
    ph_level DECIMAL(3, 1) COMMENT 'pH value 0-14',
    nitrogen_mg_per_kg DECIMAL(10, 2),
    phosphorus_mg_per_kg DECIMAL(10, 2),
    potassium_mg_per_kg DECIMAL(10, 2),
    organic_matter_percent DECIMAL(5, 2),
    tested_at DATE,
    test_report_url VARCHAR(500),
    
    FOREIGN KEY fk_soil_land (land_listing_id) REFERENCES land_listings(id) ON DELETE CASCADE,
    INDEX idx_soil_type (soil_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Soil testing and composition data';

-- Land Water Information - Water availability
CREATE TABLE land_water_information (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    land_listing_id BIGINT NOT NULL,
    water_source_type VARCHAR(100) COMMENT 'BORE, CANAL, RIVER, WELL, TANK',
    water_depth_feet INT,
    water_quality VARCHAR(255),
    water_availability_months VARCHAR(255) COMMENT 'Jan,Feb,Mar,...',
    irrigation_capacity_hectare DECIMAL(10, 2),
    flood_prone BOOLEAN DEFAULT FALSE,
    underground_water_capacity INT COMMENT 'Liters per hour',
    
    FOREIGN KEY fk_water_land (land_listing_id) REFERENCES land_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Water availability and quality information';

-- Land Ownership Information - Ownership verification
CREATE TABLE land_ownership_information (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    land_listing_id BIGINT NOT NULL,
    owner_name VARCHAR(255),
    ownership_type VARCHAR(100) COMMENT 'INDIVIDUAL, JOINT, CORPORATE',
    land_ownership_percentage DECIMAL(5, 2),
    years_owned INT,
    ownership_document_url VARCHAR(500),
    document_type VARCHAR(100) COMMENT 'DEED, TITLE, PATTA',
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    verified_at TIMESTAMP NULL,
    verified_by_admin_id BIGINT,
    
    FOREIGN KEY fk_ownership_land (land_listing_id) REFERENCES land_listings(id) ON DELETE CASCADE,
    FOREIGN KEY fk_ownership_admin (verified_by_admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Land ownership verification documents';

-- Land Documents - Legal documents
CREATE TABLE land_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    land_listing_id BIGINT NOT NULL,
    document_type ENUM('DEED', 'SURVEY', 'TITLE', 'MUTATION', 'ENCUMBRANCE', 'OTHER') NOT NULL,
    document_url VARCHAR(500) NOT NULL COMMENT 'S3 URL',
    document_number VARCHAR(255),
    issued_date DATE,
    expiry_date DATE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_documents_land (land_listing_id) REFERENCES land_listings(id) ON DELETE CASCADE,
    INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Land legal documents storage';

-- =====================================================
-- DOMAIN 6: MARKETPLACE FEATURES
-- =====================================================

-- Wishlists - Saved products
CREATE TABLE wishlists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_wishlist_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_wishlist_product (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_wishlist (user_id, product_id),
    INDEX idx_user_wishlist (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User wishlist / saved products';

-- Carts - Shopping cart
CREATE TABLE carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    buyer_id BIGINT NOT NULL UNIQUE COMMENT 'User ID of the buyer',
    total_items INT NOT NULL DEFAULT 0,
    total_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_carts_buyer (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User active shopping cart';

-- Cart Items - Items in the shopping cart
CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(15, 2) NOT NULL COMMENT 'Price per unit',
    total_price DECIMAL(15, 2) NOT NULL COMMENT 'Total price for quantity',
    save_for_later BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flag for save for later items',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_cart_items_cart (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY fk_cart_items_product (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_cart_item (cart_id, product_id),
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Shopping cart items';


-- Search History - User search analytics
CREATE TABLE search_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT COMMENT 'NULL for anonymous searches',
    search_query VARCHAR(500) NOT NULL,
    category_filter BIGINT COMMENT 'Category ID if filtered',
    results_count INT,
    clicked_product_id BIGINT COMMENT 'Which result was clicked',
    search_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_search_user (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY fk_search_product (clicked_product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_user_timestamp (user_id, search_timestamp),
    INDEX idx_search_query (search_query),
    INDEX idx_search_timestamp (search_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Search query history for analytics'
PARTITION BY RANGE(YEAR(search_timestamp)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Product Recommendations - Collaborative filtering
CREATE TABLE product_recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recommended_product_id BIGINT NOT NULL,
    recommendation_score DECIMAL(3, 2) COMMENT 'Relevance score 0-1',
    recommendation_type ENUM('VIEWED', 'WISHLIST', 'BOUGHT', 'TRENDING', 'CATEGORY_POPULAR') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_rec_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_rec_product (recommended_product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user_recommendations (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Daily refreshed product recommendations, TTL: 24 hours';

-- Trending Products - Trending by category
CREATE TABLE trending_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    trend_score INT NOT NULL DEFAULT 0,
    trend_period ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY') DEFAULT 'DAILY',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_trend_category (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY fk_trend_product (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_category_period (category_id, trend_period),
    UNIQUE KEY uk_trending (category_id, product_id, trend_period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Trending products updated hourly';

-- =====================================================
-- DOMAIN 7: ORDER MANAGEMENT
-- =====================================================

-- Orders - Main order table
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NULL,
    order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total_items_count INT NOT NULL DEFAULT 0,
    subtotal_amount DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    shipping_charge DECIMAL(15, 2) DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL,
    order_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    platform_fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    seller_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    shipping_address VARCHAR(500) NULL,
    delivery_city VARCHAR(255) NULL,
    delivery_state VARCHAR(255) NULL,
    delivery_zip_code VARCHAR(255) NULL,
    coupon_code VARCHAR(100) NULL,
    notes TEXT NULL,
    expected_delivery_date DATE NULL,
    actual_delivery_date DATE NULL,
    cancellation_reason VARCHAR(500) NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_order_buyer (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_order_seller (seller_id) REFERENCES seller_profiles(id) ON DELETE SET NULL,
    UNIQUE KEY uk_order_number (order_number),
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_order_status (order_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Main order table'
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Order Items - Individual items in order
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    item_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_item_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY fk_item_product (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Order line items';

-- Order History - Status change audit trail
CREATE TABLE order_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    old_status VARCHAR(100),
    new_status VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by_admin_id BIGINT COMMENT 'NULL if system',
    reason_notes TEXT,
    
    FOREIGN KEY fk_history_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY fk_history_admin (changed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Order status change history for audit';

-- Order Tracking - Real-time tracking
CREATE TABLE order_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    current_status ENUM('PENDING', 'CONFIRMED', 'PACKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    current_location VARCHAR(500),
    last_update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery_date DATE,
    
    FOREIGN KEY fk_tracking_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_current_status (current_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Current order tracking status';

-- Order Cancellations - Cancellation details
CREATE TABLE order_cancellations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    cancellation_reason VARCHAR(500) NOT NULL,
    cancelled_by ENUM('BUYER', 'SELLER', 'ADMIN', 'SYSTEM') NOT NULL,
    cancelled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    refund_initiated BOOLEAN DEFAULT FALSE,
    refund_status ENUM('PENDING', 'PROCESSED', 'FAILED') DEFAULT 'PENDING',
    admin_notes TEXT,
    
    FOREIGN KEY fk_cancellation_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_cancelled_at (cancelled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Order cancellation tracking';

-- Returns - Return management
CREATE TABLE returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    order_item_id BIGINT NOT NULL,
    rma_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'Return Merchandise Authorization',
    return_reason VARCHAR(500) NOT NULL,
    return_status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'SHIPPED_BACK', 'RECEIVED', 'COMPLETED', 'CLOSED') DEFAULT 'REQUESTED',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    refund_amount DECIMAL(15, 2),
    return_notes TEXT,
    
    FOREIGN KEY fk_return_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY fk_return_item (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    INDEX idx_return_status (return_status),
    INDEX idx_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Return and refund management';

-- =====================================================
-- DOMAIN 8: PAYMENT SYSTEM
-- =====================================================

-- Payments - Payment transactions
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    buyer_id BIGINT NOT NULL,
    payment_method VARCHAR(100) NOT NULL DEFAULT 'RAZORPAY',
    transaction_id VARCHAR(255) NULL,
    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(100) NULL,
    razorpay_signature VARCHAR(100) NULL,
    amount DECIMAL(15, 2) NOT NULL,
    platform_fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
    failure_reason VARCHAR(500) NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_payment_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY fk_payment_buyer (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment transaction records';

-- Payment Transactions - Payment gateway logs
CREATE TABLE payment_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    gateway_name VARCHAR(100) COMMENT 'RAZORPAY, STRIPE, PAYPAL',
    request_data LONGTEXT COMMENT 'JSON request to gateway',
    response_data LONGTEXT COMMENT 'JSON response from gateway',
    transaction_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_code VARCHAR(10),
    status_message TEXT,
    
    FOREIGN KEY fk_gateway_payment (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_payment_id (payment_id),
    INDEX idx_timestamp (transaction_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment gateway transaction logs for auditing';

-- Refunds - Refund management
CREATE TABLE refunds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    refund_amount DECIMAL(15, 2) NOT NULL,
    refund_reason ENUM('RETURN', 'CANCELLATION', 'DISPUTE', 'CHARGEBACK', 'CUSTOMER_REQUEST', 'OTHER') NOT NULL,
    refund_status ENUM('INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED') DEFAULT 'INITIATED',
    razorpay_refund_id VARCHAR(255) UNIQUE,
    initiated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    admin_notes TEXT,
    
    FOREIGN KEY fk_refund_payment (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY fk_refund_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_refund_status (refund_status),
    INDEX idx_initiated_at (initiated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Refund tracking and settlement';

-- Settlements - Seller payment settlements
CREATE TABLE settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    settlement_period ENUM('DAILY', 'WEEKLY', 'MONTHLY') DEFAULT 'WEEKLY',
    settlement_date DATE NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    total_sales_amount DECIMAL(15, 2) NOT NULL,
    total_orders INT DEFAULT 0,
    commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
    commission_amount DECIMAL(15, 2) DEFAULT 0.00,
    platform_charges DECIMAL(15, 2) DEFAULT 0.00,
    gst_amount DECIMAL(15, 2) DEFAULT 0.00,
    other_deductions DECIMAL(15, 2) DEFAULT 0.00,
    net_settlement_amount DECIMAL(15, 2) NOT NULL,
    settlement_status ENUM('PENDING', 'PROCESSED', 'FAILED', 'REVERSED') DEFAULT 'PENDING',
    bank_account_id BIGINT NOT NULL,
    settlement_reference_id VARCHAR(255),
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_settlement_seller (seller_id) REFERENCES seller_profiles(id),
    FOREIGN KEY fk_settlement_bank (bank_account_id) REFERENCES seller_bank_accounts(id),
    INDEX idx_seller_date (seller_id, settlement_date),
    INDEX idx_settlement_status (settlement_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Seller payment settlements'
PARTITION BY RANGE(YEAR(settlement_date)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- =====================================================
-- DOMAIN 9: SHIPPING & LOGISTICS
-- =====================================================

-- Shipping Addresses - Delivery addresses
CREATE TABLE shipping_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(500) NOT NULL,
    address_line2 VARCHAR(500),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address_type VARCHAR(50) COMMENT 'RESIDENTIAL, COMMERCIAL',
    special_instructions TEXT,
    
    FOREIGN KEY fk_shipping_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Delivery address information';

-- Shipments - Shipment tracking
CREATE TABLE shipments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    shipment_number VARCHAR(50) NOT NULL UNIQUE,
    logistics_partner_id BIGINT COMMENT 'ID of delivery partner',
    tracking_number VARCHAR(255) UNIQUE COMMENT 'Logistics provider tracking ID',
    shipment_date DATE,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    shipment_status ENUM('PENDING', 'PICKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_ATTEMPT', 'RETURNED') DEFAULT 'PENDING',
    carrier_name VARCHAR(255) COMMENT 'Delhivery, Shiprocket, etc.',
    weight_kg DECIMAL(10, 2),
    dimensions VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_shipment_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_tracking_number (tracking_number),
    INDEX idx_shipment_status (shipment_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Shipment and logistics tracking'
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Delivery Tracking - Real-time delivery updates
CREATE TABLE delivery_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    status ENUM('PICKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPTED', 'DELIVERED', 'FAILED', 'RETURNED') NOT NULL,
    current_location VARCHAR(500),
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    tracking_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tracking_notes TEXT,
    
    FOREIGN KEY fk_tracking_shipment (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    INDEX idx_shipment_timestamp (shipment_id, tracking_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Real-time delivery tracking updates'
PARTITION BY RANGE(YEAR(tracking_timestamp)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Delivery Partners - Logistics partners
CREATE TABLE delivery_partners (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL UNIQUE,
    partner_code VARCHAR(50) UNIQUE,
    api_key VARCHAR(500) COMMENT 'API integration key',
    coverage_areas JSON COMMENT 'List of service areas',
    support_email VARCHAR(255),
    support_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'Denormalized',
    total_deliveries INT DEFAULT 0 COMMENT 'Denormalized',
    successful_deliveries INT DEFAULT 0,
    failed_deliveries INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registered delivery/logistics partners';

-- =====================================================
-- DOMAIN 10: REVIEWS & SOCIAL
-- =====================================================

-- Reviews - Product reviews
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NULL,
    buyer_id BIGINT NOT NULL,
    order_item_id BIGINT NULL,
    seller_id BIGINT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_title VARCHAR(500),
    review_text TEXT,
    media_urls TEXT NULL,
    delivery_experience INT NULL CHECK (delivery_experience BETWEEN 1 AND 5),
    product_quality_rating INT NULL CHECK (product_quality_rating BETWEEN 1 AND 5),
    communication_rating INT NULL CHECK (communication_rating BETWEEN 1 AND 5),
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0 COMMENT 'Upvotes',
    unhelpful_count INT DEFAULT 0 COMMENT 'Downvotes',
    seller_response TEXT,
    seller_response_at TIMESTAMP NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_review_product (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY fk_review_buyer (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_review_item (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
    FOREIGN KEY fk_review_seller (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY uk_review (product_id, buyer_id, order_item_id),
    INDEX idx_product_id (product_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_created_at (created_at),
    INDEX idx_rating (rating),
    INDEX idx_product_created (product_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Product reviews and ratings'
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Review Images - Review images
CREATE TABLE review_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL COMMENT 'S3 URL',
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_review_image (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    INDEX idx_review_id (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Images attached to reviews';

-- Seller Reviews - Seller-specific reviews
CREATE TABLE seller_reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
    delivery_rating INT CHECK (delivery_rating BETWEEN 1 AND 5),
    product_quality_rating INT CHECK (product_quality_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_seller_review_seller (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY fk_seller_review_buyer (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_seller_review_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_seller_id (seller_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Seller ratings and reviews';

-- Conversations - Chat conversations
CREATE TABLE conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    participant1_id BIGINT NOT NULL COMMENT 'First participant',
    participant2_id BIGINT NOT NULL COMMENT 'Second participant',
    conversation_type ENUM('ONE_TO_ONE', 'GROUP') DEFAULT 'ONE_TO_ONE',
    last_message_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_conv_user1 (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_conv_user2 (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_participants (participant1_id, participant2_id),
    INDEX idx_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Chat conversations between users';

-- Messages - Chat messages
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    message_text LONGTEXT,
    message_type ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO') DEFAULT 'TEXT',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_message_conversation (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY fk_message_sender (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation_created (conversation_id, created_at),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Chat messages with read receipts'
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Message Attachments - File attachments in messages
CREATE TABLE message_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL COMMENT 'S3 URL',
    file_type ENUM('IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO', 'OTHER') DEFAULT 'OTHER',
    file_size INT COMMENT 'Size in bytes',
    file_name VARCHAR(255),
    
    FOREIGN KEY fk_attachment_message (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Message file attachments';

-- Farmer Posts - Community posts
CREATE TABLE farmer_posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    poster_id BIGINT NOT NULL,
    post_title VARCHAR(500) NOT NULL,
    post_content LONGTEXT NOT NULL,
    post_type ENUM('DISCUSSION', 'QUESTION', 'ADVICE', 'MARKET_INSIGHT', 'SUCCESS_STORY') DEFAULT 'DISCUSSION',
    is_anonymous BOOLEAN DEFAULT FALSE,
    location_tag VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete',
    
    FOREIGN KEY fk_post_user (poster_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post_type (post_type),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_post_search (post_title, post_content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Farmer community posts and discussions'
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Post Comments - Comments on posts
CREATE TABLE post_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    commenter_id BIGINT NOT NULL,
    comment_text TEXT NOT NULL,
    parent_comment_id BIGINT COMMENT 'For nested replies',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete',
    
    FOREIGN KEY fk_comment_post (post_id) REFERENCES farmer_posts(id) ON DELETE CASCADE,
    FOREIGN KEY fk_comment_user (commenter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_comment_parent (parent_comment_id) REFERENCES post_comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_parent_id (parent_comment_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Comments and replies on farmer posts';

-- Post Engagement - Likes and shares on posts
CREATE TABLE post_engagement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT,
    comment_id BIGINT,
    user_id BIGINT NOT NULL,
    engagement_type ENUM('LIKE', 'SHARE') DEFAULT 'LIKE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_engage_post (post_id) REFERENCES farmer_posts(id) ON DELETE CASCADE,
    FOREIGN KEY fk_engage_comment (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE,
    FOREIGN KEY fk_engage_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_engagement (post_id, comment_id, user_id, engagement_type),
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Post and comment likes/shares engagement';

-- =====================================================
-- DOMAIN 11: NOTIFICATIONS & GOVERNANCE
-- =====================================================

-- Notifications - Multi-channel notifications
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    notification_type VARCHAR(100) NOT NULL COMMENT 'ORDER_CONFIRMED, DELIVERY_UPDATE, etc.',
    notification_title VARCHAR(500),
    notification_body TEXT,
    notification_channel ENUM('PUSH', 'SMS', 'EMAIL', 'IN_APP') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    action_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_notification_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Multi-channel notifications to users'
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Government Schemes - Agricultural government schemes
CREATE TABLE government_schemes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scheme_name VARCHAR(500) NOT NULL UNIQUE,
    scheme_description LONGTEXT,
    government_body VARCHAR(255),
    eligibility_criteria JSON COMMENT 'JSON object with eligibility rules',
    benefits JSON COMMENT 'Array of benefits',
    documents_required JSON COMMENT 'Array of required documents',
    application_start_date DATE,
    application_end_date DATE,
    scheme_status ENUM('ACTIVE', 'INACTIVE', 'CLOSED', 'UPCOMING') DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_scheme_status (scheme_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Government agricultural scheme information';

-- Scheme Applications - User scheme applications
CREATE TABLE scheme_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    scheme_id BIGINT NOT NULL,
    application_status ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'WITHDRAWN') DEFAULT 'SUBMITTED',
    application_date DATE NOT NULL,
    submitted_documents JSON COMMENT 'Array of S3 URLs',
    admin_notes TEXT,
    approved_date DATE,
    approved_by_admin_id BIGINT,
    rejection_reason VARCHAR(500),
    
    FOREIGN KEY fk_app_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_app_scheme (scheme_id) REFERENCES government_schemes(id) ON DELETE CASCADE,
    FOREIGN KEY fk_app_admin (approved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_scheme_app (user_id, scheme_id),
    INDEX idx_application_status (application_status),
    INDEX idx_application_date (application_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User applications for government schemes'
PARTITION BY RANGE(YEAR(application_date)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Complaints - User complaints and issues
CREATE TABLE complaints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_number VARCHAR(50) NOT NULL UNIQUE,
    complainant_id BIGINT NOT NULL,
    complaint_type VARCHAR(100) NOT NULL COMMENT 'PRODUCT, SELLER, ORDER, PAYMENT, OTHER',
    order_id BIGINT COMMENT 'If related to order',
    product_id BIGINT COMMENT 'If related to product',
    seller_id BIGINT COMMENT 'If related to seller',
    complaint_title VARCHAR(500) NOT NULL,
    complaint_description LONGTEXT NOT NULL,
    complaint_status ENUM('OPEN', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REJECTED') DEFAULT 'OPEN',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    assigned_admin_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_complaint_user (complainant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_complaint_order (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY fk_complaint_product (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY fk_complaint_seller (seller_id) REFERENCES seller_profiles(id) ON DELETE SET NULL,
    FOREIGN KEY fk_complaint_admin (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaint_status (complaint_status),
    INDEX idx_created_at (created_at),
    INDEX idx_assigned_admin (assigned_admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User complaints and dispute tickets'
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Dispute Resolutions - Resolution tracking
CREATE TABLE dispute_resolutions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT NOT NULL UNIQUE,
    assigned_admin_id BIGINT NOT NULL,
    resolution_notes LONGTEXT,
    resolution_action ENUM('REFUND', 'REPLACEMENT', 'CANCEL_ORDER', 'WARNING', 'SUSPEND_ACCOUNT', 'CLOSE', 'OTHER') NOT NULL,
    resolution_amount DECIMAL(15, 2) DEFAULT 0.00,
    resolved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_resolution_complaint (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY fk_resolution_admin (assigned_admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_resolved_at (resolved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dispute resolution and action tracking';

-- Audit Logs - System audit trail
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL COMMENT 'USER, ORDER, PRODUCT, PAYMENT, etc.',
    entity_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, VERIFY, APPROVE',
    actor_id BIGINT,
    actor_type ENUM('SYSTEM', 'ADMIN', 'USER') DEFAULT 'SYSTEM',
    old_values LONGTEXT COMMENT 'JSON of old values for updates',
    new_values LONGTEXT COMMENT 'JSON of new values',
    change_reason VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_actor (actor_id, actor_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Complete system audit trail for compliance'
PARTITION BY RANGE(YEAR(timestamp)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_orders_buyer_status ON orders(buyer_id, order_status);
CREATE INDEX idx_orders_seller_status ON orders(seller_id, order_status, created_at);
CREATE INDEX idx_products_category_status ON products(category_id, product_status);
CREATE INDEX idx_seller_status_rating ON seller_profiles(seller_status, rating);
CREATE INDEX idx_messages_conv_read ON messages(conversation_id, is_read);
CREATE INDEX idx_search_history_query_timestamp ON search_history(search_query, search_timestamp);

-- =====================================================
-- DOMAIN 15: REAL-TIME ORDER TRACKING
-- =====================================================

-- Delivery Profiles - Driver details
CREATE TABLE delivery_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_delivery_user (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Tracking - Live updates
CREATE TABLE order_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    delivery_profile_id BIGINT NULL,
    current_latitude DECIMAL(10, 8) NULL,
    current_longitude DECIMAL(11, 8) NULL,
    destination_latitude DECIMAL(10, 8) NOT NULL,
    destination_longitude DECIMAL(11, 8) NOT NULL,
    eta_minutes INT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    route_history TEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_tracking_order (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY fk_tracking_profile (delivery_profile_id) REFERENCES delivery_profiles(id) ON DELETE SET NULL,
    INDEX idx_tracking_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tracking Audit Logs - Audit trail for tracking updates
CREATE TABLE tracking_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    actor_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feedbacks - User feedback, complaints, and bugs
CREATE TABLE feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(100) NOT NULL COMMENT 'BUG_REPORT, SUGGESTION, COMPLAINT, FEATURE_REQUEST',
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    screenshot_url VARCHAR(500) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    priority ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY fk_feedback_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_feedback_category (category),
    INDEX idx_feedback_status (status),
    INDEX idx_feedback_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User feedback and complaints tracker';

-- =====================================================
-- END OF DDL SCRIPTS
-- =====================================================

-- Statistics updated:
-- - Total Tables: 75
-- - Estimated Row Count (1M users): 260M+ rows
-- - Estimated Storage: 30-40 GB
-- - Partitioning: RANGE (time-based) for large tables
-- - Replication: Primary + 3 Replicas
-- - Backup: Daily automated backups (30 days hot, 1 year cold)
