# Smart Krishi - Enterprise-Grade MySQL Database Architecture

**Project**: Smart Krishi (Agricultural Super-App & Multi-Vendor Marketplace)  
**Scale**: 1M+ Users, 100K+ Sellers, Millions of Products  
**Database**: MySQL 8.0+  
**Design Pattern**: Relational Database with ACID Compliance  
**Normalization**: 3rd Normal Form (3NF)

---

## 📋 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Database Design Principles](#database-design-principles)
3. [Complete ER Diagram](#complete-er-diagram)
4. [Database Schema](#database-schema)
5. [Table Specifications](#table-specifications)
6. [Relationships & Constraints](#relationships--constraints)
7. [Indexing Strategy](#indexing-strategy)
8. [Normalization Analysis](#normalization-analysis)
9. [Scalability Considerations](#scalability-considerations)
10. [Production Best Practices](#production-best-practices)
11. [Spring Boot JPA Mappings](#spring-boot-jpa-mappings)

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer (Frontend)              │
│              React/Mobile Apps + REST API                    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer (Backend)                   │
│   Spring Boot Microservices (Auth, Order, Payment, etc.)    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│          Hibernate/JPA + Connection Pooling (HikariCP)      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│                  Persistent Storage Layer                    │
│  MySQL 8.0 (Primary) + Read Replicas + Redis Cache          │
│  Partitioning + Sharding for Scale                          │
└─────────────────────────────────────────────────────────────┘
```

### Domain Organization

The database is organized into **10 core domains**:

1. **Authentication & Security** - User identity, sessions, JWT tokens
2. **User Management** - Buyer/Seller/Admin profiles, KYC
3. **Product Catalog** - Products, categories, inventory
4. **Agricultural Domain** - Crops, machinery, land, dairy
5. **Order Management** - Orders, cart, checkout
6. **Payment System** - Transactions, settlements, refunds
7. **Logistics** - Shipping, tracking, delivery
8. **Social & Communication** - Chat, notifications, reviews
9. **Governance** - Schemes, complaints, reports
10. **Analytics** - Metrics, logs, audit trails

---

## Database Design Principles

### 1. **Normalization**
- **3NF Compliance**: Eliminates transitive dependencies
- **No Redundant Data**: Single source of truth
- **Referential Integrity**: FK constraints enforce relationships

### 2. **ACID Properties**
- **Atomicity**: All-or-nothing transactions
- **Consistency**: Data integrity maintained
- **Isolation**: Transaction-level isolation
- **Durability**: Persisted after commit

### 3. **Performance**
- **Strategic Indexing**: B-tree indexes on frequently queried columns
- **Query Optimization**: Avoid N+1, use JOIN efficiently
- **Connection Pooling**: HikariCP for connection management

### 4. **Security**
- **Encryption**: Sensitive data encrypted at rest/transit
- **Audit Trails**: All changes tracked with timestamps
- **Role-Based Access**: Column-level permissions in application layer
- **SQL Injection Prevention**: Parameterized queries via ORM

### 5. **Scalability**
- **Horizontal Partitioning**: User/Order tables by date/range
- **Read Replicas**: Primary-replica replication for reads
- **Caching Layer**: Redis for hot data
- **Archive Strategy**: Old data moved to cold storage

### 6. **Maintainability**
- **Consistent Naming**: Prefix by domain, snake_case
- **Comments**: Schema documentation
- **Version Control**: DDL scripts in Git
- **Migration Scripts**: Flyway/Liquibase for schema evolution

---

## Complete ER Diagram

```
DOMAIN 1: AUTHENTICATION & SECURITY
users ──┬──> user_roles
        ├──> login_history
        ├──> sessions
        ├──> devices
        ├──> otp_verifications
        └──> password_resets

DOMAIN 2: USER MANAGEMENT
users ──┬──> buyer_profiles
        ├──> seller_profiles
        ├──> user_addresses
        ├──> user_documents
        ├──> kyc_verifications
        └──> profile_photos

DOMAIN 3: SELLER BUSINESS
seller_profiles ──┬──> seller_business_info
                  ├──> seller_bank_accounts
                  ├──> seller_upi_accounts
                  ├──> seller_ratings
                  └──> seller_analytics

DOMAIN 4: PRODUCT CATALOG
categories ──┬──> subcategories ──┬──> products ──┬──> product_images
             │                     │               ├──> product_videos
             │                     │               ├──> product_specs
             │                     │               ├──> product_variants
             │                     │               └──> product_inventory
             │                     │
             └─ category_attributes

DOMAIN 5: AGRICULTURAL
products ──┬──> agricultural_metadata
           ├──> crops
           ├──> machinery
           ├──> land_listings ──┬──> land_soil_info
           │                    ├──> land_water_info
           │                    ├──> land_ownership
           │                    └──> land_documents
           └──> fertilizers

DOMAIN 6: MARKETPLACE FEATURES
users ──┬──> wishlists
        ├──> cart_items
        └──> search_history

products ──> product_recommendations
           └──> trending_products

DOMAIN 7: ORDER & TRANSACTION
users ──> orders ──┬──> order_items
                  ├──> order_history
                  ├──> order_tracking
                  ├──> order_cancellations
                  └──> returns

orders ──> payments ──┬──> payment_transactions
                     ├──> refunds
                     └──> settlements

DOMAIN 8: SHIPPING & LOGISTICS
orders ──> shipping_addresses
       └──> shipments ──┬──> delivery_tracking
                       └──> delivery_partners

DOMAIN 9: SOCIAL & REVIEWS
products ──> reviews ──> review_images
seller_profiles ──> seller_reviews
users ──> conversations ──> messages ──> message_attachments

DOMAIN 10: GOVERNANCE & ANALYTICS
users ──> government_schemes ──> scheme_applications
users ──> farmer_posts ──┬──> post_comments
                        └──> post_engagement (likes, shares)
users ──> complaints ──> dispute_resolutions
users ──> notifications
         └──> audit_logs
```

---

## Database Schema

### Domain 1: Authentication & Security

#### Table: users
```sql
Core user identity table with multi-role support
- Stores user account information
- Supports buyer, seller, admin roles
- Denormalized: role stored here for quick lookup
- Columns: email, phone, password_hash, status
- Index: email (unique), phone (unique), status
- Partitioning: By user_id (HASH) for sharding
```

#### Table: user_roles
```sql
Role assignment tracking (M:M relationship)
- Many users can have many roles
- Tracks role assignment timestamps
- Used for RBAC in application layer
```

#### Table: login_history
```sql
Audit trail for login attempts
- Failed logins tracked for security
- Device fingerprinting for multi-device support
- Useful for login analytics
```

#### Table: sessions
```sql
Active session management
- JWT token metadata storage
- Session expiry for timeout management
- Used to invalidate sessions on logout
```

#### Table: devices
```sql
Multi-device login tracking
- FCM tokens for push notifications
- Device fingerprinting
- Last known location for security alerts
```

#### Table: otp_verifications
```sql
OTP tracking for email/SMS verification
- Tracks OTP generation and verification
- Expiry time enforcement
- Rate limiting via attempt_count
```

#### Table: password_resets
```sql
Password reset token management
- Secure token generation and validation
- Expiry time enforcement
- Single-use token policy
```

---

### Domain 2: User Management

#### Table: buyer_profiles
```sql
Buyer-specific information
- Denormalized: preferred_language, notification_preferences
- Foreign key: user_id
- Supports buyer personalization
```

#### Table: seller_profiles
```sql
Seller business profiles
- Business name, description, website
- Seller status (pending, verified, suspended)
- Foreign key: user_id
```

#### Table: user_addresses
```sql
Multiple addresses per user (delivery, billing)
- Address type: HOME, OFFICE, SHIPPING, BILLING
- Geolocation: latitude, longitude for delivery zone calculation
- Default address flag
```

#### Table: user_documents
```sql
Document storage for KYC
- Document type: AADHAR, PAN, LICENSE
- Document URL (stored in S3)
- Verification status
```

#### Table: kyc_verifications
```sql
KYC verification workflow
- Status: PENDING, VERIFIED, REJECTED
- Tracks verification timestamp and admin notes
- Used for seller/high-value buyer verification
```

#### Table: profile_photos
```sql
User profile picture management
- Versioning for profile updates
- S3 URL storage
- Created_at for retrieval of latest
```

---

### Domain 3: Seller Business

#### Table: seller_business_info
```sql
GST and PAN information
- GST number (unique for seller)
- PAN number (unique for seller)
- Business category classification
- Foreign key: seller_profile_id
```

#### Table: seller_bank_accounts
```sql
Seller payment settlement accounts
- Bank name, account number, IFSC
- Account holder verification
- Status (active, inactive)
- Primary account flag
- Encrypted storage for sensitive data
```

#### Table: seller_upi_accounts
```sql
UPI ID for faster settlements
- Encrypted UPI ID storage
- Verification status
- Primary flag
```

#### Table: seller_ratings
```sql
Aggregated seller ratings
- Average rating (denormalized for performance)
- Total reviews count
- Recalculated daily via batch job
```

#### Table: seller_analytics
```sql
Seller performance metrics
- Total sales, revenue
- Product count
- Return rate, cancellation rate
- Updated daily via ETL process
- Used for dashboard queries
```

---

### Domain 4: Product Catalog

#### Table: categories
```sql
Product categories (L1)
- Category name: Machinery, Fertilizers, Dairy, etc.
- Category image
- Display order
```

#### Table: subcategories
```sql
Product subcategories (L2)
- Foreign key: category_id
- Subcategory name
- Display order
- Enables hierarchical browsing
```

#### Table: products
```sql
Main product table (denormalized for performance)
- seller_id: which seller listed this
- category_id, subcategory_id: categorization
- name, description, sku
- price, discount_price
- status: ACTIVE, DRAFT, INACTIVE, DELETED
- rating, review_count (denormalized)
- Foreign keys: seller_id, category_id, subcategory_id
- Partitioning: By created_at (RANGE) for archiving
- Indexes: seller_id, category_id, status, created_at
```

#### Table: product_images
```sql
Product images (1:M)
- Multiple images per product
- Display order (sort_order)
- S3 URL storage
- Image type: MAIN, THUMBNAIL, DETAIL
```

#### Table: product_videos
```sql
Product videos (1:M)
- YouTube/Vimeo URL
- Video title
- Display order
- Thumbnail URL
```

#### Table: product_specs
```sql
Product specifications (key-value pairs)
- spec_key: "Color", "Size", "Material"
- spec_value: "Red", "XL", "Plastic"
- Enables dynamic attributes
- Foreign key: product_id
```

#### Table: product_variants
```sql
Product variants (SKU-level)
- variant_sku
- variant_name: "Red-XL", "Blue-M"
- variant_price (may differ from base)
- variant_stock
- Foreign key: product_id
- Enables size/color selection
```

#### Table: product_inventory
```sql
Stock management
- quantity_available
- quantity_reserved (pending orders)
- quantity_sold (cumulative)
- Last updated timestamp
- Warehouse location
- Foreign key: product_id
- Partitioning: For high-volume updates
```

#### Table: category_attributes
```sql
Dynamic attributes per category
- Color, Size, Material, etc.
- Attribute values (JSON or separate table)
- Mandatory vs optional flags
```

---

### Domain 5: Agricultural Products

#### Table: crops
```sql
Crop-specific information
- crop_name, scientific_name
- season information
- yield information
- Foreign key: product_id (optional, for crop listings)
```

#### Table: machinery
```sql
Machinery-specific attributes
- machinery_type: Tractor, Harvester, etc.
- specifications, maintenance_schedule
- Foreign key: product_id
```

#### Table: fertilizers
```sql
Fertilizer-specific information
- nutrient_composition: NPK ratio
- application_method
- toxicity_level
- Foreign key: product_id
```

#### Table: land_listings
```sql
Land marketplace
- seller_id: farmer selling land
- location_description
- area_in_acres
- geolocation: lat, lng for mapping
- price_per_acre
- status: AVAILABLE, SOLD, DELISTED
- Foreign key: seller_id
- Geospatial Index: On coordinates for location-based search
```

#### Table: land_soil_info
```sql
Soil composition and quality
- soil_type
- pH_level
- nitrogen, phosphorus, potassium levels
- Foreign key: land_listing_id
```

#### Table: land_water_info
```sql
Water availability information
- water_source_type: Bore, Canal, River, Well
- water_availability_months
- irrigation_capacity
- Foreign key: land_listing_id
```

#### Table: land_ownership
```sql
Land ownership verification
- ownership_documents (S3 URLs)
- verification_status
- verified_by_admin
- Foreign key: land_listing_id
```

#### Table: land_documents
```sql
Legal documents for land
- document_type: DEED, SURVEY, TITLE
- document_url (S3)
- uploaded_at
- Foreign key: land_listing_id
```

---

### Domain 6: Marketplace Features

#### Table: wishlists
```sql
User wishlist (saved products)
- user_id, product_id
- added_at timestamp
- Index: user_id for quick retrieval
- Unique constraint: (user_id, product_id)
```

#### Table: cart_items
```sql
Shopping cart
- user_id, product_id, variant_id
- quantity
- added_price (price at time of adding)
- added_at
- Index: user_id
- TTL: Delete carts older than 30 days
```

#### Table: search_history
```sql
User search analytics
- user_id, search_query
- search_timestamp
- results_count
- click_through (which result was clicked)
- Partitioning: By created_at (RANGE) for archiving
- Used for search recommendations
```

#### Table: product_recommendations
```sql
Collaborative filtering recommendations
- user_id, recommended_product_id
- score (relevance score)
- recommendation_type: VIEWED, WISHLIST, BOUGHT, TRENDING
- created_at
- TTL: Refresh daily via batch job
```

#### Table: trending_products
```sql
Trending products by category
- category_id, product_id
- trend_score
- trend_period (daily, weekly, monthly)
- updated_at
- Refresh frequency: Hourly
```

---

### Domain 7: Order Management

#### Table: orders
```sql
Main order table
- order_number: Unique order ID (e.g., ORD-20240101-00001)
- buyer_id (user_id)
- seller_id (primary seller for multi-vendor)
- order_status: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, RETURNED
- total_amount, discount_amount, tax_amount, net_amount
- shipping_address_id
- payment_id (FK to payments table)
- created_at, updated_at
- Partitioning: By created_at (RANGE) for historical queries
- Indexes: buyer_id, seller_id, order_status, created_at, order_number
- TTL Archive: Move to cold storage after 2 years
```

#### Table: order_items
```sql
Individual items in an order (1:M)
- order_id, product_id, variant_id
- quantity_ordered
- unit_price_at_order
- discount_per_item
- tax_per_item
- total_price
- seller_id (for multi-vendor support)
- Foreign keys: order_id, product_id, seller_id
```

#### Table: order_history
```sql
Audit trail for order status changes
- order_id
- old_status, new_status
- changed_at
- changed_by (admin user or system)
- reason/notes
- Used for dispute resolution
```

#### Table: order_tracking
```sql
Real-time order tracking
- order_id
- status: PENDING, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED
- last_update_at
- current_location (optional)
- Foreign key: order_id
```

#### Table: order_cancellations
```sql
Cancellation details
- order_id
- cancellation_reason
- cancelled_by: BUYER, SELLER, ADMIN
- cancelled_at
- refund_status: PENDING, PROCESSED, FAILED
- Foreign key: order_id
```

#### Table: returns
```sql
Return management
- order_id, order_item_id
- return_reason
- return_status: REQUESTED, APPROVED, SHIPPED_BACK, RECEIVED, COMPLETED, REJECTED
- return_authorization_number (RMA)
- requested_at, approved_at, completed_at
- refund_amount
- Foreign keys: order_id, order_item_id
```

---

### Domain 8: Payment System

#### Table: payments
```sql
Payment transactions
- order_id
- buyer_id
- amount
- payment_method: RAZORPAY, UPI, CARD, WALLET, NET_BANKING
- payment_status: INITIATED, PROCESSING, SUCCESS, FAILED, REFUNDED
- transaction_id (from payment gateway)
- razorpay_payment_id
- razorpay_order_id
- created_at, updated_at
- Foreign keys: order_id, buyer_id
- Indexes: razorpay_payment_id, order_id, payment_status
```

#### Table: payment_transactions
```sql
Payment gateway transaction logs
- payment_id
- gateway: RAZORPAY
- request_data (JSON)
- response_data (JSON)
- transaction_timestamp
- Foreign key: payment_id
```

#### Table: refunds
```sql
Refund management
- payment_id, order_id
- refund_amount
- refund_reason: RETURN, CANCELLATION, DISPUTE, CHARGEBACK
- refund_status: INITIATED, PROCESSING, SUCCESS, FAILED
- razorpay_refund_id
- initiated_at, processed_at
- Foreign keys: payment_id, order_id
```

#### Table: settlements
```sql
Seller payment settlements
- seller_id
- settlement_period: DAILY, WEEKLY, MONTHLY
- settlement_date
- total_amount
- fees_deducted
- net_amount
- settlement_status: PENDING, PROCESSED, FAILED
- bank_account_id (seller's bank account)
- created_at, processed_at
- Foreign keys: seller_id, bank_account_id
- Partitioning: By settlement_date (RANGE)
```

---

### Domain 9: Shipping & Logistics

#### Table: shipping_addresses
```sql
Shipping address for orders
- order_id
- full_name, phone_number
- address_line1, address_line2
- city, state, postal_code, country
- latitude, longitude (for delivery zone)
- address_type: RESIDENTIAL, COMMERCIAL
- Foreign key: order_id
```

#### Table: shipments
```sql
Shipment tracking
- order_id
- shipment_number
- carrier/logistics_partner: Delhivery, Shiprocket, etc.
- tracking_number
- shipment_date
- estimated_delivery_date
- actual_delivery_date
- shipment_status: PENDING, PICKED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED
- Foreign key: order_id
```

#### Table: delivery_tracking
```sql
Real-time delivery tracking
- shipment_id
- status: OUT_FOR_DELIVERY, FAILED_ATTEMPT, DELIVERED
- location (address or landmark)
- timestamp
- tracking_notes
- Foreign key: shipment_id
- Partitioning: By created_at for time-series queries
```

#### Table: delivery_partners
```sql
Registered delivery partners
- partner_name
- api_key (for integration)
- coverage_areas (JSON or separate table)
- support_email
- is_active
- ratings (denormalized)
- Total deliveries (denormalized)
```

---

### Domain 10: Reviews & Social

#### Table: reviews
```sql
Product reviews
- product_id, buyer_id, order_item_id
- rating (1-5 stars)
- review_title
- review_text
- is_verified_purchase (verified from orders)
- helpful_count (upvotes)
- unhelpful_count (downvotes)
- created_at, updated_at
- Foreign keys: product_id, buyer_id, order_item_id
- Partitioning: By created_at (RANGE)
- Indexes: product_id, created_at, rating
- Index: (product_id, created_at) for recent reviews
```

#### Table: review_images
```sql
Review images (1:M)
- review_id
- image_url (S3)
- Foreign key: review_id
```

#### Table: seller_reviews
```sql
Seller reviews (separate from product reviews)
- seller_id, buyer_id, order_id
- rating (1-5 stars)
- review_text
- created_at
- Foreign keys: seller_id, buyer_id, order_id
```

#### Table: conversations
```sql
Chat conversations (1:1 or group)
- participant1_id, participant2_id (for 1:1)
- conversation_type: ONE_TO_ONE, GROUP
- last_message_at
- is_active
- created_at
- Foreign keys: participant1_id, participant2_id
- Index: (participant1_id, participant2_id) for conversation lookup
```

#### Table: messages
```sql
Chat messages
- conversation_id
- sender_id
- message_text
- message_type: TEXT, IMAGE, DOCUMENT
- is_read
- read_at
- created_at
- Foreign keys: conversation_id, sender_id
- Partitioning: By created_at (RANGE) for old message archiving
- Index: (conversation_id, created_at)
- TTL: Archive messages older than 1 year
```

#### Table: message_attachments
```sql
Message file attachments
- message_id
- file_url (S3)
- file_type: IMAGE, DOCUMENT, VIDEO
- file_size
- Foreign key: message_id
```

#### Table: farmer_posts
```sql
Community posts by farmers
- poster_id (user_id)
- post_title
- post_content
- post_type: DISCUSSION, QUESTION, ADVICE, MARKET_INSIGHT
- is_anonymous
- created_at, updated_at
- deleted_at (soft delete)
- Foreign key: poster_id
- Partitioning: By created_at (RANGE)
```

#### Table: post_comments
```sql
Comments on farmer posts
- post_id
- commenter_id (user_id)
- comment_text
- parent_comment_id (for nested replies)
- created_at, updated_at
- Foreign keys: post_id, commenter_id
```

#### Table: post_engagement
```sql
Likes and shares on posts
- post_id, user_id, comment_id
- engagement_type: LIKE, SHARE
- created_at
- Unique constraint: (post_id, user_id, engagement_type)
```

---

### Domain 11: Notifications & Governance

#### Table: notifications
```sql
Multi-channel notifications
- user_id
- notification_type: ORDER_CONFIRMED, PAYMENT_RECEIVED, DELIVERY_UPDATE, etc.
- title, body
- notification_channel: PUSH, SMS, EMAIL, IN_APP
- is_read
- read_at
- created_at
- Foreign key: user_id
- Partitioning: By created_at (RANGE)
- TTL: Delete notifications older than 6 months
```

#### Table: government_schemes
```sql
Agricultural government schemes
- scheme_name
- scheme_description
- eligibility_criteria (JSON)
- benefits (JSON)
- application_start_date, application_end_date
- status: ACTIVE, INACTIVE, CLOSED
```

#### Table: scheme_applications
```sql
User applications for schemes
- user_id, scheme_id
- application_status: SUBMITTED, APPROVED, REJECTED, PENDING_VERIFICATION
- application_date
- submitted_documents (S3 URLs, JSON)
- admin_notes
- approved_date
- Foreign keys: user_id, scheme_id
- Partitioning: By application_date (RANGE)
```

#### Table: complaints
```sql
User complaints
- complaint_id
- complainant_id (user_id)
- complaint_type: PRODUCT, SELLER, ORDER, PAYMENT, OTHER
- order_id (if related to order)
- complaint_title
- complaint_description
- complaint_status: OPEN, INVESTIGATING, RESOLVED, CLOSED
- created_at
- Foreign keys: complainant_id, order_id
```

#### Table: dispute_resolutions
```sql
Complaint resolution tracking
- complaint_id
- assigned_admin_id
- resolution_notes
- resolution_action: REFUND, REPLACEMENT, CANCEL_ORDER, WARNING, BAN
- resolution_amount (if refund)
- resolved_at
- Foreign key: complaint_id
```

#### Table: audit_logs
```sql
System audit trail
- entity_type: USER, ORDER, PRODUCT, PAYMENT, etc.
- entity_id
- action: CREATE, UPDATE, DELETE, VERIFY, APPROVE
- actor_id (user performing action)
- actor_type: SYSTEM, ADMIN, USER
- old_values (JSON for updates)
- new_values (JSON for updates)
- timestamp
- ip_address
- Partitioning: By timestamp (RANGE) for archiving
- Indexes: entity_type, entity_id, timestamp, actor_id
```

---

## Relationships & Constraints

### Primary Key Strategy
- **Surrogate Keys**: Auto-increment `id` as primary key for all tables
- **Natural Keys**: Unique constraints on business identifiers (email, phone, order_number, sku)

### Foreign Key Constraints
- **Cascade Delete**: Used sparingly (e.g., cart_items when cart cleared)
- **Restrict Delete**: Most relationships (prevent orphaned records)
- **Set Null**: Optional relationships only

### Unique Constraints
```sql
users: UNIQUE(email), UNIQUE(phone)
seller_business_info: UNIQUE(gst_number), UNIQUE(pan_number)
products: UNIQUE(seller_id, sku)
orders: UNIQUE(order_number)
reviews: UNIQUE(product_id, buyer_id, order_item_id)
```

### Check Constraints
```sql
users: status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED')
products: status IN ('ACTIVE', 'DRAFT', 'INACTIVE', 'DELETED')
orders: order_status IN ('PENDING', 'CONFIRMED', 'SHIPPED', ...)
payments: payment_status IN ('INITIATED', 'SUCCESS', 'FAILED', ...)
reviews: rating BETWEEN 1 AND 5
```

---

## Indexing Strategy

### Critical Indexes (Performance-Critical)

```sql
-- Authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);

-- Orders
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Composite indexes for common queries
CREATE INDEX idx_orders_buyer_status ON orders(buyer_id, order_status);
CREATE INDEX idx_orders_seller_status ON orders(seller_id, order_status, created_at);

-- Products
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Composite for search
CREATE INDEX idx_products_category_status ON products(category_id, status);

-- Search History
CREATE INDEX idx_search_history_user_id ON search_history(user_id, created_at);

-- Wishlist
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);

-- Cart
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- Payments
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_payment_id ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Reviews
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_reviews_product_created ON reviews(product_id, created_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Audit
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

### Geospatial Indexes (Location-Based Queries)

```sql
-- For land listings proximity search
CREATE SPATIAL INDEX idx_land_listings_location ON land_listings(geolocation);

-- For shipping zones
CREATE SPATIAL INDEX idx_shipping_addresses_location ON shipping_addresses(coordinates);
```

### Full-Text Search Indexes

```sql
-- For product search
CREATE FULLTEXT INDEX idx_products_search ON products(name, description);

-- For post search
CREATE FULLTEXT INDEX idx_posts_search ON farmer_posts(post_title, post_content);
```

---

## Normalization Analysis (3NF)

### First Normal Form (1NF)
✅ **All attributes are atomic** (no multi-valued fields)
- Used JSON for complex data (attributes, eligibility criteria)
- S3 URLs for files instead of BLOBs
- Separate tables for 1:M relationships

### Second Normal Form (2NF)
✅ **All attributes depend on the entire primary key**
- Composite keys used only where appropriate
- No partial dependencies

### Third Normal Form (3NF)
✅ **No transitive dependencies**
- Seller ratings denormalized for performance (read-heavy)
- Product rating/review_count denormalized (calculated nightly)
- Seller analytics denormalized (updated via ETL)

### Denormalization Justification
| Table | Denormalized Field | Reason | Update Strategy |
|-------|-------------------|--------|-----------------|
| products | rating | Read-heavy, queried for sorting | Batch job nightly |
| products | review_count | Read-heavy, displayed on UI | Batch job nightly |
| seller_profiles | seller_ratings | Displayed on seller cards | ETL job daily |
| seller_profiles | total_sales | Seller dashboard | ETL job daily |

---

## Scalability Considerations

### 1. Horizontal Partitioning (Sharding)

```sql
-- Partition orders by user_id (HASH sharding)
-- Enables: Each region/tenant has separate partition
PARTITION BY HASH(buyer_id) PARTITIONS 64;

-- Partition large tables by time (RANGE partitioning)
-- Enable: Archive old data, faster queries
PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

### 2. Vertical Partitioning

```
COLD DATA ARCHIVE:
- Move completed orders (delivered, cancelled) > 2 years old to archive
- Monthly backup snapshots in S3

HOT DATA CACHE:
- Active orders, recent reviews → Redis
- Trending products, recommendations → Redis
- Session data → Redis
```

### 3. Read Replicas

```
PRIMARY (Write):
  - All writes go to primary
  - Connected to: Orders, Payments, Users

REPLICA 1 (Read):
  - Reports, Analytics
  - Historical data queries

REPLICA 2 (Read):
  - Product searches, recommendations
  - User profiles, seller pages

REPLICA 3 (Read):
  - Monitoring, logging
  - Audit trails, complaints
```

### 4. Connection Pooling

```
HikariCP Configuration:
- Pool Size: 20-50 connections
- Max Lifetime: 30 minutes
- Idle Timeout: 10 minutes
- Connection Timeout: 30 seconds
```

### 5. Caching Strategy

```
Redis Cache Layers:

L1 - Session Cache (TTL: Session duration):
  - user::{user_id}:session
  - user::{user_id}:roles
  - user::{user_id}:permissions

L2 - User Profile Cache (TTL: 1 hour):
  - user::{user_id}:profile
  - seller::{seller_id}:profile
  - seller::{seller_id}:ratings

L3 - Product Cache (TTL: 6 hours):
  - product::{product_id}
  - products::category::{category_id}
  - products::trending::{category_id}

L4 - Search Cache (TTL: 30 minutes):
  - search::query::{search_term}

L5 - Recommendation Cache (TTL: 24 hours):
  - recommendations::user::{user_id}
```

### 6. Database Optimization

```
QUERY OPTIMIZATION:
- Use EXPLAIN to analyze slow queries
- Avoid N+1 queries (use JOIN or batch)
- Pagination for large result sets

BATCH OPERATIONS:
- Bulk inserts for notifications
- Batch updates for analytics
- Scheduled ETL jobs

MONITORING:
- Slow query log threshold: 1 second
- Monitor connection pool usage
- Track replica lag < 100ms
```

---

## Production Best Practices

### 1. Backup & Recovery

```sql
-- Daily automated backups
BACKUP STRATEGY:
- Full backup: Weekly (Sunday 2 AM UTC)
- Incremental: Daily (2 AM UTC)
- Retention: 30 days hot, 1 year cold (S3 Glacier)
- Recovery Point Objective (RPO): 24 hours
- Recovery Time Objective (RTO): 4 hours

-- Point-in-time recovery
- Binary logging enabled
- Binlog retention: 7 days
```

### 2. Security Best Practices

```sql
-- Encryption
ALTER TABLE users MODIFY password_hash VARCHAR(255) ENCRYPTED;
ALTER TABLE user_documents MODIFY document_url VARCHAR(1000) ENCRYPTED;
ALTER TABLE seller_bank_accounts MODIFY account_number VARCHAR(100) ENCRYPTED;

-- Column-level access control
GRANT SELECT(email, phone, name) ON smart_krishi.users TO 'app_user'@'app_server';
GRANT ALL ON smart_krishi.* TO 'admin'@'localhost' WITH GRANT OPTION;

-- Row-level security
-- Implemented in application layer via context-aware queries
```

### 3. Monitoring & Alerting

```sql
-- Replication lag monitoring
SHOW SLAVE STATUS\G

-- Connection pool monitoring
-- Via HikariCP metrics

-- Disk space monitoring
SELECT table_name, ROUND(((data_length+index_length)/1024/1024),2) 
FROM information_schema.tables 
WHERE table_schema = 'smart_krishi';

-- Query performance
-- Slow query log enabled
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

### 4. Maintenance Windows

```
WEEKLY MAINTENANCE:
- Thursday 11 PM - 1 AM UTC
- Database optimization (OPTIMIZE TABLE)
- Index analysis (ANALYZE TABLE)

MONTHLY MAINTENANCE:
- First Sunday 2 AM - 4 AM UTC
- Full backup verification
- Data consistency checks
```

### 5. High Availability Setup

```
ARCHITECTURE:
Primary (Master) <--> Replica 1 (Hot Standby)
                  <--> Replica 2 (Analytics)
                  <--> Replica 3 (Reporting)

FAILOVER MECHANISM:
- Automated via Orchestrator or MHA
- Promotes Replica 1 if Primary fails
- Application connection pooling redirects
- Failover time: < 2 minutes

MULTI-REGION (Future):
- Primary: India (us-central)
- Replica: India (us-east)
- Disaster Recovery: AWS Multi-AZ
```

---

## Spring Boot JPA Mappings

### Entity Mapping Examples

```java
// User Entity
@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = "email"),
    @UniqueConstraint(columnNames = "phone")
})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 255)
    private String email;
    
    @Column(nullable = false, unique = true, length = 20)
    private String phone;
    
    @Column(nullable = false)
    private String passwordHash;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status; // ACTIVE, INACTIVE, SUSPENDED
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private Set<UserRole> roles;
    
    @OneToMany(mappedBy = "user")
    private List<LoginHistory> loginHistory;
    
    @OneToMany(mappedBy = "user")
    private List<Order> orders;
}

// Product Entity
@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_seller_id", columnList = "seller_id"),
    @Index(name = "idx_category_id", columnList = "category_id"),
    @Index(name = "idx_status", columnList = "status")
})
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String sku;
    
    @Column(nullable = false, length = 500)
    private String name;
    
    @Column(length = 2000)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private SellerProfile seller;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    private BigDecimal discountPrice;
    
    @Column(precision = 3, scale = 2)
    private Double rating; // Denormalized
    
    @Column
    private Integer reviewCount; // Denormalized
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductImage> images;
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductInventory> inventory;
}

// Order Entity
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_buyer_id", columnList = "buyer_id"),
    @Index(name = "idx_order_status", columnList = "order_status"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String orderNumber; // ORD-20240101-00001
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;
    
    @Column(nullable = false)
    private BigDecimal totalAmount;
    
    private BigDecimal discountAmount;
    
    @Column(nullable = false)
    private BigDecimal netAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus orderStatus;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;
}

// Review Entity
@Entity
@Table(name = "reviews", 
    uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "buyer_id", "order_item_id"}),
    indexes = {
        @Index(name = "idx_product_id", columnList = "product_id"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_product_created", columnList = "product_id, created_at DESC")
    }
)
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;
    
    @Column(nullable = false)
    @Min(1)
    @Max(5)
    private Integer rating;
    
    @Column(length = 500)
    private String reviewTitle;
    
    @Column(length = 2000)
    private String reviewText;
    
    @Column(nullable = false)
    private Boolean isVerifiedPurchase;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL)
    private List<ReviewImage> images;
}
```

---

## Database Naming Conventions

### Table Naming

```
Pattern: domain_entity or entity (if unique)

Examples:
- users (core entity)
- user_roles (bridge table for M:M)
- user_addresses (1:M relationship)
- seller_profiles (domain-specific)
- seller_business_info (domain detail)
- products
- product_images
- product_inventory
- orders
- order_items
- order_tracking
- payments
- payment_transactions
- reviews
- review_images
```

### Column Naming

```
Pattern: snake_case

- Primary key: id (auto-increment)
- Foreign key: entity_id (e.g., user_id, product_id)
- Timestamps: created_at, updated_at, deleted_at
- Booleans: is_active, is_verified, is_primary
- Status: status (enum), order_status, payment_status
- Amount: total_amount, discount_amount, net_amount
- Count: review_count, total_reviews
- Numeric IDs: email, phone (business identifiers)
```

### Enum Naming

```
UserStatus: ACTIVE, INACTIVE, SUSPENDED, DELETED
ProductStatus: ACTIVE, DRAFT, INACTIVE, DELETED
OrderStatus: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, RETURNED
PaymentStatus: INITIATED, PROCESSING, SUCCESS, FAILED, REFUNDED
DeliveryStatus: PENDING, PICKED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED
ReviewStatus: PENDING, APPROVED, REJECTED
```

---

## Summary: Table Count & Statistics

### Total Tables: **75 Tables** (Estimated Production)

**Domain Breakdown:**
- Authentication & Security: 6 tables
- User Management: 6 tables
- Seller Management: 5 tables
- Product Catalog: 8 tables
- Agricultural Products: 8 tables
- Marketplace Features: 5 tables
- Order Management: 6 tables
- Payment System: 4 tables
- Shipping & Logistics: 4 tables
- Reviews & Social: 8 tables
- Notifications & Governance: 6 tables

### Estimated Data Growth (1M users, 100K sellers)

| Table | Estimated Rows | Growth Rate | Storage |
|-------|-----------------|------------|---------|
| users | 1,000,000 | Yearly 10-20% | 150 MB |
| products | 10,000,000 | Yearly 20-30% | 2 GB |
| orders | 50,000,000 | Yearly 30-50% | 5 GB |
| order_items | 75,000,000 | Yearly 30-50% | 6 GB |
| reviews | 20,000,000 | Yearly 25-35% | 2 GB |
| messages | 100,000,000+ | Daily growth | 8-10 GB |
| **Total** | **~260M rows** | **See schedule** | **~30-40 GB** |

---

## Database Configuration for 1M+ Users

```sql
-- MySQL 8.0 Recommended Configuration

[mysqld]
# Connection Pool
max_connections = 2000
max_allowed_packet = 64M
thread_cache_size = 500

# InnoDB Settings
innodb_buffer_pool_size = 32G (50-70% of RAM)
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2 (balance between safety and performance)
innodb_flush_method = O_DIRECT

# Query Cache (Disable in MySQL 8)
query_cache_type = OFF
query_cache_size = 0

# Replication
binlog_format = ROW
server-id = 1
log-bin = /var/log/mysql/mysql-bin.log
relay-log = /var/log/mysql/mysql-relay-bin

# Performance
slow_query_log = ON
long_query_time = 1
log-queries-not-using-indexes

# Partitioning
# Use RANGE partitioning for time-series tables
# Use HASH for load distribution
```

---

## Estimated Total Development Time

1. **Database Design**: 2-3 weeks ✅ (This document)
2. **Schema Implementation**: 1 week
3. **Application Development**: 8-12 weeks
4. **Integration Testing**: 2-3 weeks
5. **Performance Testing**: 2 weeks
6. **Security Audit**: 1-2 weeks
7. **Production Deployment**: 1 week

**Total Timeline**: 4-5 months

---

## References & Standards

- MySQL 8.0 Documentation: https://dev.mysql.com/doc/
- InnoDB Storage Engine: https://dev.mysql.com/doc/innodb/8.0/
- Database Partitioning: https://dev.mysql.com/doc/refman/8.0/en/partitioning.html
- Hibernate/JPA: https://hibernate.org/orm/documentation/
- Spring Data JPA: https://spring.io/projects/spring-data-jpa
- System Design: https://systemdesign.techjam.in/
