-- ============================================================
-- SMART KRISHI MARKETPLACE — CLIENT HANDOVER CLEANUP SCRIPT
-- ============================================================
-- Purpose: Remove all demo, seed, mock, and test data
--          while preserving core schemas, roles, categories,
--          and default administrative/seller accounts.
-- ============================================================

USE smart_krishi;

-- Temporarily disable foreign key checks to allow truncation/deletion of all tables in correct dependency order
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. CLEAN BUSINESS & TRANSACTION DATA (Phase 3)
-- ------------------------------------------------------------

-- Cart data
TRUNCATE TABLE cart_items;
TRUNCATE TABLE carts;

-- Order data
TRUNCATE TABLE order_items;
TRUNCATE TABLE order_history;
TRUNCATE TABLE order_tracking;
TRUNCATE TABLE order_cancellations;
TRUNCATE TABLE orders;

-- Payment & transaction data
TRUNCATE TABLE payment_transactions;
TRUNCATE TABLE refunds;
TRUNCATE TABLE settlements;
TRUNCATE TABLE payments;

-- Reviews & Feedbacks
TRUNCATE TABLE review_images;
TRUNCATE TABLE reviews;
TRUNCATE TABLE seller_reviews;
TRUNCATE TABLE feedbacks;

-- Customer Support / Dispute resolution
TRUNCATE TABLE message_attachments;
TRUNCATE TABLE messages;
TRUNCATE TABLE conversations;
TRUNCATE TABLE dispute_resolutions;
TRUNCATE TABLE complaints;

-- Social / Community / Scheme data
TRUNCATE TABLE post_comments;
TRUNCATE TABLE post_engagement;
TRUNCATE TABLE farmer_posts;
TRUNCATE TABLE scheme_applications;
TRUNCATE TABLE government_schemes;

-- Search, wishlists, and recommendations
TRUNCATE TABLE search_history;
TRUNCATE TABLE wishlists;
TRUNCATE TABLE product_recommendations;
TRUNCATE TABLE trending_products;

-- Audits and Logs (keep structural schemas intact, but clear demo run logs)
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE tracking_audit_logs;
TRUNCATE TABLE login_history;
TRUNCATE TABLE weather_cache;

-- ------------------------------------------------------------
-- 2. CLEAN MARKETPLACE LISTINGS & ASSOCIATED DOMAIN DATA
-- ------------------------------------------------------------

-- Product domain details
TRUNCATE TABLE milks;
TRUNCATE TABLE fertilizers;
TRUNCATE TABLE machinery;
TRUNCATE TABLE farming_equipments;
TRUNCATE TABLE crops;
TRUNCATE TABLE building_materials;

-- Product specs, variants, videos
TRUNCATE TABLE product_specifications;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE product_videos;

-- Product images and inventories
TRUNCATE TABLE product_images;
TRUNCATE TABLE product_inventory;

-- Core products table
TRUNCATE TABLE products;

-- Land Listings
TRUNCATE TABLE land_images;
TRUNCATE TABLE land_documents;
TRUNCATE TABLE land_ownership_information;
TRUNCATE TABLE land_soil_information;
TRUNCATE TABLE land_water_information;
TRUNCATE TABLE land_visit_requests;
TRUNCATE TABLE land_listings;

-- Machinery bookings (rental bookings)
TRUNCATE TABLE machinery_rental_bookings;
TRUNCATE TABLE rental_bookings;

-- ------------------------------------------------------------
-- 3. REMOVE REGISTERED TEST USERS & PROFILES (Phase 2)
-- ------------------------------------------------------------

-- Preserve:
--   - Admin User: admin@smartkrishi.com (ID=1)
--   - Default Seller User: seller@smartkrishi.com (ID=12)

-- Clean up related tables for users we are deleting (using subquery to be completely safe)
DELETE FROM user_roles WHERE user_id NOT IN (1, 12);
DELETE FROM user_addresses WHERE user_id NOT IN (1, 12);
DELETE FROM user_documents WHERE user_id NOT IN (1, 12);
DELETE FROM kyc_verifications WHERE user_id NOT IN (1, 12);
DELETE FROM profile_photos WHERE user_id NOT IN (1, 12);
DELETE FROM notification_preferences WHERE user_id NOT IN (1, 12);
DELETE FROM otp_verifications WHERE user_id NOT IN (1, 12);
DELETE FROM password_resets WHERE user_id NOT IN (1, 12);
DELETE FROM sessions WHERE user_id NOT IN (1, 12);
DELETE FROM devices WHERE user_id NOT IN (1, 12);

-- Delete dependent seller profiles and metadata (excluding seller ID 12's profile)
DELETE FROM seller_business_info WHERE seller_profile_id NOT IN (
    SELECT id FROM seller_profiles WHERE user_id = 12
);
DELETE FROM seller_bank_accounts WHERE seller_profile_id NOT IN (
    SELECT id FROM seller_profiles WHERE user_id = 12
);
DELETE FROM seller_upi_accounts WHERE seller_profile_id NOT IN (
    SELECT id FROM seller_profiles WHERE user_id = 12
);
DELETE FROM seller_ratings WHERE seller_profile_id NOT IN (
    SELECT id FROM seller_profiles WHERE user_id = 12
);
DELETE FROM seller_analytics WHERE seller_profile_id NOT IN (
    SELECT id FROM seller_profiles WHERE user_id = 12
);
DELETE FROM seller_profiles WHERE user_id NOT IN (12);

-- Delete all buyer profiles (since all buyers are test users)
DELETE FROM buyer_profiles;

-- Delete users
DELETE FROM users WHERE id NOT IN (1, 12);

-- ------------------------------------------------------------
-- 4. DELIVERY PARTNERS & PROFILES
-- ------------------------------------------------------------
TRUNCATE TABLE delivery_tracking;
TRUNCATE TABLE delivery_profiles;
TRUNCATE TABLE delivery_partners;
TRUNCATE TABLE delivery_zones;
TRUNCATE TABLE shipments;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
