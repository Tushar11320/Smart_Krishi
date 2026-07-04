-- Smart Krishi Database Optimizations
-- DDL Script to create composite and covering indexes for production scaling.
-- Target: MySQL 8.0+

USE smart_krishi;

-- 1. Products Table Optimizations
-- Optimizes queries filtering by category and status, and handles soft deletes.
CREATE INDEX idx_products_cat_status ON products(category_id, product_status, deleted_at);

-- Optimizes queries listing products by seller, and handles soft deletes.
CREATE INDEX idx_products_seller_deleted ON products(seller_id, deleted_at);

-- Optimizes queries returning active/draft products ordered by date.
CREATE INDEX idx_products_status_created ON products(product_status, created_at DESC);


-- 2. Orders Table Optimizations
-- Optimizes user-specific dashboard order history queries sorted by date.
CREATE INDEX idx_orders_buyer_created ON orders(buyer_id, created_at DESC);

-- Optimizes seller-specific dashboard order retrieval by status.
CREATE INDEX idx_orders_seller_status ON orders(seller_id, order_status);

-- Optimizes generic order query lookups by status.
CREATE INDEX idx_orders_status_created ON orders(order_status, created_at DESC);


-- 3. Notifications Table Optimizations
-- Optimizes user unread/read notifications count and page lists.
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);


-- 4. Reviews Table Optimizations
-- Optimizes product review lists sorting by rating/date.
CREATE INDEX idx_reviews_product_approved ON reviews(product_id, is_approved, created_at DESC);
