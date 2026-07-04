-- ============================================================
-- SMART KRISHI MARKETPLACE — COMPLETE TEST DATA SEED SCRIPT
-- ============================================================
-- Version     : 1.0.0
-- Generated   : 2026-06-23
-- Author      : Test Data Specialist
-- Purpose     : Populate realistic demo/test data for E2E
--               testing of buyer, seller, cart, checkout,
--               payment, order, review, and inventory flows.
--
-- IMPORTANT RULES:
--   * All data is marked as DEMO / TEST
--   * Does NOT drop or modify any existing data
--   * Uses INSERT IGNORE to avoid duplicate records
--   * Run against: smart_krishi database
--
-- TEST LOGIN CREDENTIALS:
--   All sellers & buyers password : Demo@12345
--   BCrypt hash included below is for "Demo@12345"
--
-- HOW TO RUN:
--   mysql -u root -p smart_krishi < TEST_DATA_SEED.sql
--   OR paste directly in MySQL Workbench / DBeaver.
-- ============================================================

USE smart_krishi;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
-- SECTION 1 — ROLES
-- Ensure the three core roles exist (INSERT IGNORE = safe)
-- ============================================================

INSERT IGNORE INTO roles (role_type, description) VALUES
  ('ROLE_USER',   'Standard buyer / user role'),
  ('ROLE_SELLER', 'Marketplace seller / vendor role'),
  ('ROLE_ADMIN',  'Platform administrator role');

-- ============================================================
-- SECTION 2 — TEST USERS
-- 3 sellers + 2 buyers
-- Password hash = BCrypt(Demo@12345, cost=10)
-- ============================================================

INSERT IGNORE INTO users
  (email, phone, password_hash, first_name, last_name,
   user_status, email_verified, phone_verified, created_at, updated_at)
VALUES
-- Seller 1 : Green Farm Supplies
('greenfarm.demo@smartkrishi.test', '+919900011001',
 '$2a$10$brlVVU/5xwlmuYJO5Lu2Le3Szu0kvbZK0cxkz/LCthSh/cky/vBAi',
 'Ramesh', 'Patil',
 'ACTIVE', TRUE, TRUE, NOW(), NOW()),

-- Seller 2 : Krishi Agro Store
('krishiagro.demo@smartkrishi.test', '+919900011002',
 '$2a$10$brlVVU/5xwlmuYJO5Lu2Le3Szu0kvbZK0cxkz/LCthSh/cky/vBAi',
 'Suresh', 'Kumar',
 'ACTIVE', TRUE, TRUE, NOW(), NOW()),

-- Seller 3 : Village Farmer Producer Group
('villagefpg.demo@smartkrishi.test', '+919900011003',
 '$2a$10$brlVVU/5xwlmuYJO5Lu2Le3Szu0kvbZK0cxkz/LCthSh/cky/vBAi',
 'Mahendra', 'Singh',
 'ACTIVE', TRUE, TRUE, NOW(), NOW()),

-- Buyer 1  : Test Buyer
('testbuyer1.demo@smartkrishi.test', '+919900022001',
 '$2a$10$brlVVU/5xwlmuYJO5Lu2Le3Szu0kvbZK0cxkz/LCthSh/cky/vBAi',
 'Anjali', 'Sharma',
 'ACTIVE', TRUE, TRUE, NOW(), NOW()),

-- Buyer 2  : Test Buyer 2
('testbuyer2.demo@smartkrishi.test', '+919900022002',
 '$2a$10$brlVVU/5xwlmuYJO5Lu2Le3Szu0kvbZK0cxkz/LCthSh/cky/vBAi',
 'Vikram', 'Rao',
 'ACTIVE', TRUE, TRUE, NOW(), NOW());

-- ============================================================
-- SECTION 3 — ASSIGN ROLES TO TEST USERS
-- ============================================================

-- Sellers get ROLE_SELLER + ROLE_USER
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.role_type = 'ROLE_SELLER'
WHERE u.email IN (
  'greenfarm.demo@smartkrishi.test',
  'krishiagro.demo@smartkrishi.test',
  'villagefpg.demo@smartkrishi.test'
);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.role_type = 'ROLE_USER'
WHERE u.email IN (
  'greenfarm.demo@smartkrishi.test',
  'krishiagro.demo@smartkrishi.test',
  'villagefpg.demo@smartkrishi.test',
  'testbuyer1.demo@smartkrishi.test',
  'testbuyer2.demo@smartkrishi.test'
);

-- ============================================================
-- SECTION 4 — SELLER PROFILES
-- seller_status ENUM: PENDING | APPROVED | REJECTED | SUSPENDED
-- ============================================================

INSERT IGNORE INTO seller_profiles
  (user_id, business_name, business_description, business_category,
   seller_status, business_type, gst_number, pan_number,
   business_registration_number, shop_address,
   latitude, longitude, state, district, pincode,
   bank_account_holder_name, bank_name, account_number, ifsc_code,
   upi_id, logo_url,
   total_products, total_sales, rating, review_count,
   response_time_hours, return_rate, cancellation_rate,
   created_at, updated_at)
VALUES

-- Seller 1 ─ Green Farm Supplies
(
  (SELECT id FROM users WHERE email='greenfarm.demo@smartkrishi.test'),
  '[DEMO] Green Farm Supplies',
  'Premium agricultural inputs supplier — fertilizers, seeds, equipment and dairy products. Test seller account for Smart Krishi platform.',
  'MULTI_CATEGORY',
  'APPROVED',
  'SOLE_PROPRIETOR',
  '27ABCPG1234A1ZE',
  'ABCPG1234A',
  'MH-REG-2019-00123',
  'Survey No. 45, Near Gram Panchayat, Nanded Road, Latur, Maharashtra - 413512',
  18.40556, 76.56999,
  'Maharashtra', 'Latur', '413512',
  'Ramesh Patil', 'State Bank of India', '32109876543210', 'SBIN0005123',
  'greenfarm@upi',
  'https://picsum.photos/seed/greenfarm_logo/200/200',
  15, 0.00, 4.50, 0, 2, 0.00, 0.00,
  NOW(), NOW()
),

-- Seller 2 ─ Krishi Agro Store
(
  (SELECT id FROM users WHERE email='krishiagro.demo@smartkrishi.test'),
  '[DEMO] Krishi Agro Store',
  'One-stop shop for all farming needs — crops, building materials, and machinery rental. Test seller for Smart Krishi.',
  'AGRO_GENERAL',
  'APPROVED',
  'PARTNERSHIP',
  '29XYZAG5678B1ZK',
  'XYZAG5678B',
  'KA-REG-2020-00456',
  'Plot 12, APMC Market Road, Hubli, Karnataka - 580028',
  15.36480, 75.12444,
  'Karnataka', 'Dharwad', '580028',
  'Suresh Kumar', 'Punjab National Bank', '8765432109876', 'PUNB0123456',
  'krishiagro@upi',
  'https://picsum.photos/seed/krishiagro_logo/200/200',
  10, 0.00, 4.20, 0, 3, 0.00, 0.00,
  NOW(), NOW()
),

-- Seller 3 ─ Village Farmer Producer Group
(
  (SELECT id FROM users WHERE email='villagefpg.demo@smartkrishi.test'),
  '[DEMO] Village Farmer Producer Group',
  'Farmer collective from Rajasthan — specializing in crops, land listings and organic farming inputs. FPO test account.',
  'FARMER_COLLECTIVE',
  'APPROVED',
  'LLP',
  '08FPGRJ9012C1ZQ',
  'FPGRJ9012C',
  'RJ-REG-2021-00789',
  'Gram Sabha Bhavan, Mandore Road, Jodhpur, Rajasthan - 342006',
  26.32459, 73.02193,
  'Rajasthan', 'Jodhpur', '342006',
  'Mahendra Singh', 'Bank of Baroda', '23456789012345', 'BARB0JODHPU',
  'villagefpg@upi',
  'https://picsum.photos/seed/villagefpg_logo/200/200',
  10, 0.00, 4.70, 0, 4, 0.00, 0.00,
  NOW(), NOW()
);

-- ============================================================
-- SECTION 5 — CATEGORIES
-- These are the 7 marketplaces on the platform
-- ============================================================

INSERT IGNORE INTO categories
  (category_name, description, image_url, display_order, is_active)
VALUES
  ('Milk & Dairy',
   'Fresh farm milk, dairy products from local farmers — cow milk, buffalo milk, A2 milk and more.',
   'https://picsum.photos/seed/cat_milk/400/300',
   1, TRUE),

  ('Fertilizers',
   'All types of chemical and organic fertilizers — urea, DAP, potash, compost and bio-fertilizers.',
   'https://picsum.photos/seed/cat_fertilizer/400/300',
   2, TRUE),

  ('Machinery',
   'Buy or rent farming machinery — tractors, rotavators, seed drills, sprayers and cultivators.',
   'https://picsum.photos/seed/cat_machinery/400/300',
   3, TRUE),

  ('Farming Equipment',
   'Irrigation kits, water pumps, shovels, harvester blades and complete agricultural tool sets.',
   'https://picsum.photos/seed/cat_equipment/400/300',
   4, TRUE),

  ('Crops',
   'Fresh and stored crops directly from farms — wheat, rice, maize, soybean, chana and more.',
   'https://picsum.photos/seed/cat_crops/400/300',
   5, TRUE),

  ('Building Materials',
   'Construction materials for farm infrastructure — cement, TMT rods, bricks, sand and aggregates.',
   'https://picsum.photos/seed/cat_building/400/300',
   6, TRUE),

  ('Land',
   'Buy or lease agricultural land — irrigated farmland, organic land, river-side and road-connected plots.',
   'https://picsum.photos/seed/cat_land/400/300',
   7, TRUE);

-- ============================================================
-- SECTION 6 — PRODUCTS
-- 30 products across 6 product categories (5 each)
-- seller_id resolved via sub-query from seller_profiles
-- ============================================================

-- ── 6A. MILK & DAIRY PRODUCTS (5 products) ────────────────

INSERT IGNORE INTO products
  (seller_id, category_id, sku, product_name, product_description,
   short_description, price, discount_price, discount_percentage,
   currency, product_status, is_featured, is_bestseller,
   return_policy_days, warranty_months,
   seo_title, seo_description, seo_keywords,
   created_at, updated_at)
VALUES

-- M1
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  (SELECT id FROM categories WHERE category_name='Milk & Dairy'),
  'DEMO-MLK-001',
  '[DEMO] Fresh Cow Milk (1L)',
  'Farm-fresh cow milk delivered daily. Rich in natural goodness, sourced from healthy grass-fed cows on our certified farm. No additives, no preservatives — just pure wholesome milk for your family. Ideal for drinking, curd making, and cooking. Pasteurized under hygienic conditions.',
  'Daily farm-fresh cow milk 1L | No preservatives | Pasteurized',
  55.00, 50.00, 9.09,
  'INR', 'ACTIVE', TRUE, TRUE,
  1, 0,
  'Fresh Cow Milk 1L - Farm Direct | Smart Krishi',
  'Buy fresh cow milk 1 litre directly from farm. No preservatives, daily delivery.',
  'fresh cow milk, farm milk, 1 litre milk, cow milk online',
  NOW(), NOW()
),

-- M2
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  (SELECT id FROM categories WHERE category_name='Milk & Dairy'),
  'DEMO-MLK-002',
  '[DEMO] Fresh Buffalo Milk (1L)',
  'Thick, creamy buffalo milk packed with higher fat content — perfect for making paneer, ghee, and rabri. Sourced from well-maintained Murrah buffaloes. Tested daily for quality and fat content. No artificial hormones used on our animals.',
  'Creamy buffalo milk 1L | High fat | Ideal for paneer & ghee',
  65.00, 60.00, 7.69,
  'INR', 'ACTIVE', FALSE, TRUE,
  1, 0,
  'Fresh Buffalo Milk 1L - High Fat | Smart Krishi',
  'Order fresh buffalo milk 1 litre. High fat content, ideal for dairy products.',
  'buffalo milk, murrah milk, fresh milk, fat milk',
  NOW(), NOW()
),

-- M3
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Milk & Dairy'),
  'DEMO-MLK-003',
  '[DEMO] Organic Cow Milk (500ml)',
  'Certified organic cow milk in convenient 500ml pack. Our cows are raised on organic pastures with zero chemical inputs. The milk undergoes gentle low-heat pasteurization to retain maximum nutrients. Perfect for health-conscious families and children.',
  'Certified organic cow milk 500ml | Chemical-free | Nutrient-rich',
  45.00, 40.00, 11.11,
  'INR', 'ACTIVE', TRUE, FALSE,
  1, 0,
  'Organic Cow Milk 500ml | Smart Krishi',
  'Buy certified organic cow milk 500ml online. Chemical-free, nutrient-rich, farm fresh.',
  'organic milk, organic cow milk, 500ml milk, natural milk',
  NOW(), NOW()
),

-- M4
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Milk & Dairy'),
  'DEMO-MLK-004',
  '[DEMO] A2 Desi Cow Milk (1L)',
  'Premium A2 milk from indigenous Gir and Sahiwal cows containing only A2 beta-casein protein — easier to digest and more nutritious than regular milk. The cows graze freely on natural pastures. Unprocessed, fresh churned and delivered within 4 hours of milking.',
  'Pure A2 milk from Gir/Sahiwal cows 1L | Easy digest | Chemical free',
  120.00, 110.00, 8.33,
  'INR', 'ACTIVE', TRUE, TRUE,
  1, 0,
  'A2 Desi Cow Milk 1L - Gir Sahiwal | Smart Krishi',
  'Order pure A2 milk from indigenous Gir and Sahiwal cows. 1 litre, fresh daily.',
  'A2 milk, desi cow milk, gir cow milk, sahiwal milk, a2 protein',
  NOW(), NOW()
),

-- M5
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Milk & Dairy'),
  'DEMO-MLK-005',
  '[DEMO] Farm Fresh Milk Pack (2L)',
  'Economy 2-litre pack of fresh farm milk — great value for large families and food businesses. Sourced from a co-operative of 12 local farmers. Regular testing for purity and fat content ensures consistent quality. Available in morning and evening slots.',
  'Economy 2L farm milk pack | Cooperative sourced | Twice-daily slots',
  99.00, 90.00, 9.09,
  'INR', 'ACTIVE', FALSE, FALSE,
  1, 0,
  'Farm Fresh Milk 2L Pack - Economy | Smart Krishi',
  'Buy 2 litre farm fresh milk pack at best price. Great value, cooperative sourced.',
  'milk pack, 2 litre milk, economy milk, farm milk pack',
  NOW(), NOW()
);

-- ── 6B. FERTILIZER PRODUCTS (5 products) ──────────────────

INSERT IGNORE INTO products
  (seller_id, category_id, sku, product_name, product_description,
   short_description, price, discount_price, discount_percentage,
   currency, product_status, is_featured, is_bestseller,
   return_policy_days, warranty_months,
   seo_title, seo_description, seo_keywords,
   created_at, updated_at)
VALUES

-- F1
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  (SELECT id FROM categories WHERE category_name='Fertilizers'),
  'DEMO-FRT-001',
  '[DEMO] Urea Fertilizer (50 kg Bag)',
  'High-quality granular Urea fertilizer with 46% nitrogen content for maximum crop yield. Suitable for paddy, wheat, sugarcane, and all Kharif and Rabi crops. Easy to apply — broadcast or top-dress. Government-subsidized product available through licensed distributor.',
  'Urea 46% N | 50 kg bag | All-crop nitrogen fertilizer',
  320.00, 290.00, 9.37,
  'INR', 'ACTIVE', FALSE, TRUE,
  7, 0,
  'Urea Fertilizer 50kg Bag | Smart Krishi',
  'Buy urea fertilizer 50kg at best price. 46% nitrogen, suitable for all crops.',
  'urea fertilizer, urea 46, nitrogen fertilizer, urea 50kg',
  NOW(), NOW()
),

-- F2
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  (SELECT id FROM categories WHERE category_name='Fertilizers'),
  'DEMO-FRT-002',
  '[DEMO] DAP Fertilizer (50 kg Bag)',
  'Di-Ammonium Phosphate (DAP) — the world''s most widely used phosphate fertilizer with 18% N and 46% P2O5. Promotes root development, early crop establishment and fruit/grain formation. Best for basal application before sowing. Suitable for all soil types.',
  'DAP 18-46-0 | 50 kg | Root booster | Universal phosphate',
  1350.00, 1280.00, 5.18,
  'INR', 'ACTIVE', TRUE, TRUE,
  7, 0,
  'DAP Fertilizer 50kg | Smart Krishi',
  'Buy DAP fertilizer 50kg. 18% N + 46% P2O5, promotes root development.',
  'DAP fertilizer, di ammonium phosphate, phosphate fertilizer, DAP 50kg',
  NOW(), NOW()
),

-- F3
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Fertilizers'),
  'DEMO-FRT-003',
  '[DEMO] Muriate of Potash (25 kg)',
  'MOP — Muriate of Potash with 60% K2O content for improving crop quality, disease resistance and water-use efficiency. Essential for potato, banana, tobacco, cotton and vegetable crops. Granular form for even spreading. Enhances shelf life of produce.',
  'MOP 60% K2O | 25 kg | Potash for quality crops',
  720.00, 680.00, 5.55,
  'INR', 'ACTIVE', FALSE, FALSE,
  7, 0,
  'Potash MOP Fertilizer 25kg | Smart Krishi',
  'Buy Muriate of Potash 25kg. 60% K2O, improves crop quality and disease resistance.',
  'potash fertilizer, MOP, muriate of potash, potassium fertilizer',
  NOW(), NOW()
),

-- F4
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Fertilizers'),
  'DEMO-FRT-004',
  '[DEMO] Organic Compost (40 kg Bag)',
  'Premium organic compost made from farm waste, crop residue and cow dung through controlled composting. Improves soil structure, water retention and microbial activity. NPOP-certified organic input — safe for all food crops including vegetables and fruits. Zero chemical inputs.',
  'NPOP-certified organic compost 40kg | Soil health booster',
  280.00, 250.00, 10.71,
  'INR', 'ACTIVE', TRUE, FALSE,
  7, 0,
  'Organic Compost 40kg - NPOP Certified | Smart Krishi',
  'Buy organic compost 40kg. NPOP certified, improves soil health, zero chemicals.',
  'organic compost, organic fertilizer, cow dung compost, soil health',
  NOW(), NOW()
),

-- F5
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Fertilizers'),
  'DEMO-FRT-005',
  '[DEMO] Vermicompost (30 kg Bag)',
  'High-grade vermicompost produced by earthworm composting of organic matter. Rich in plant-available nutrients, humic acid, and beneficial microorganisms. Dramatically improves soil fertility and reduces dependency on chemical fertilizers. Ideal for vegetable gardens, orchards and nurseries.',
  'Earthworm vermicompost 30kg | Humic acid rich | Microbial active',
  350.00, 320.00, 8.57,
  'INR', 'ACTIVE', FALSE, TRUE,
  7, 0,
  'Vermicompost 30kg Organic | Smart Krishi',
  'Buy vermicompost 30kg. Rich in humic acid and microorganisms for soil fertility.',
  'vermicompost, earthworm compost, organic manure, worm casting',
  NOW(), NOW()
);

-- ── 6C. MACHINERY PRODUCTS (5 products) ──────────────────

INSERT IGNORE INTO products
  (seller_id, category_id, sku, product_name, product_description,
   short_description, price, discount_price, discount_percentage,
   currency, product_status, is_featured, is_bestseller,
   return_policy_days, warranty_months,
   seo_title, seo_description, seo_keywords,
   created_at, updated_at)
VALUES

-- MC1
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  (SELECT id FROM categories WHERE category_name='Machinery'),
  'DEMO-MCH-001',
  '[DEMO] Mahindra 575 DI Tractor (55 HP)',
  'Well-maintained Mahindra 575 DI XP Plus 55 HP tractor — ideal for heavy tillage, ploughing and transport operations. Diesel engine with single-clutch, oil-immersed brakes and power steering. Available for sale and daily rental. Suitable for 2-5 acres operations. Includes one year warranty on engine.',
  'Mahindra 575 DI 55HP | Sale & Rent | Heavy duty farming',
  650000.00, 625000.00, 3.84,
  'INR', 'ACTIVE', TRUE, TRUE,
  0, 12,
  'Mahindra 575 DI 55HP Tractor Buy Rent | Smart Krishi',
  'Buy or rent Mahindra 575 DI 55HP tractor. Well maintained, available daily/weekly.',
  'tractor, Mahindra tractor, 55HP tractor, tractor rent, farm tractor',
  NOW(), NOW()
),

-- MC2
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  (SELECT id FROM categories WHERE category_name='Machinery'),
  'DEMO-MCH-002',
  '[DEMO] Rotavator 7 Feet (Tractor Mounted)',
  'Heavy-duty rotavator with 7-foot working width and 48 blades — perfect for soil pulverization, seedbed preparation and residue management. Compatible with 45 HP+ tractors. Galvanized blades for longer life. Gear-drive gearbox for better power transmission and less maintenance.',
  'Rotavator 7ft | 48 blades | Tractor mounted | Seedbed prep',
  85000.00, 78000.00, 8.23,
  'INR', 'ACTIVE', FALSE, FALSE,
  7, 12,
  'Rotavator 7 Feet Tractor Mounted | Smart Krishi',
  'Buy rotavator 7 feet tractor mounted. 48 blades, galvanized, heavy duty.',
  'rotavator, tractor rotavator, rotary tiller, soil preparation',
  NOW(), NOW()
),

-- MC3
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Machinery'),
  'DEMO-MCH-003',
  '[DEMO] Pneumatic Seed Drill (9 Row)',
  'Nine-row pneumatic seed drill for precision seeding of wheat, soybean, cotton and vegetables. Air-pressure mechanism ensures uniform seed spacing and depth. Compatible with 35-50 HP tractors. Adjustable row spacing 20-45 cm. Reduces seed wastage by up to 30%.',
  'Pneumatic seed drill 9-row | Precision seeding | Adjustable spacing',
  95000.00, 88000.00, 7.36,
  'INR', 'ACTIVE', TRUE, FALSE,
  7, 12,
  'Pneumatic Seed Drill 9 Row | Smart Krishi',
  'Buy pneumatic seed drill 9 row. Precision seeding, reduces seed wastage by 30%.',
  'seed drill, pneumatic seeder, precision seeding, seed drill machine',
  NOW(), NOW()
),

-- MC4
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Machinery'),
  'DEMO-MCH-004',
  '[DEMO] Honda Power Sprayer (25L Tank)',
  'Honda-engine powered knapsack sprayer with 25-litre tank for pesticide, herbicide and nutrient spraying. High-pressure pump delivers 15-bar pressure. Lightweight ergonomic design for operator comfort. Suitable for all row crops, orchards and vegetable fields.',
  'Honda power sprayer 25L | 15-bar | All crop pesticide application',
  18500.00, 17000.00, 8.10,
  'INR', 'ACTIVE', FALSE, TRUE,
  7, 12,
  'Honda Power Sprayer 25L | Smart Krishi',
  'Buy Honda power sprayer 25 litre tank. 15-bar pressure, for all crops.',
  'power sprayer, farm sprayer, pesticide sprayer, Honda sprayer',
  NOW(), NOW()
),

-- MC5
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Machinery'),
  'DEMO-MCH-005',
  '[DEMO] 9-Tine Cultivator (Tractor Mounted)',
  'Robust 9-tine spring cultivator for weed control, inter-row tillage and stubble incorporation. Spring-loaded tines absorb shocks from stones and roots. Working width 2.1 m, depth 15 cm. Compatible with 35 HP+ tractors. Hot-dip galvanized frame for corrosion resistance.',
  'Cultivator 9-tine 2.1m | Spring loaded | Weed control | 35HP+',
  42000.00, 38000.00, 9.52,
  'INR', 'ACTIVE', FALSE, FALSE,
  7, 12,
  'Tractor Cultivator 9 Tine 2.1m | Smart Krishi',
  'Buy tractor cultivator 9 tine 2.1 metre. Spring loaded, for weed control.',
  'cultivator, tractor cultivator, spring cultivator, weed control',
  NOW(), NOW()
);

-- ── 6D. FARMING EQUIPMENT PRODUCTS (5 products) ──────────

INSERT IGNORE INTO products
  (seller_id, category_id, sku, product_name, product_description,
   short_description, price, discount_price, discount_percentage,
   currency, product_status, is_featured, is_bestseller,
   return_policy_days, warranty_months,
   seo_title, seo_description, seo_keywords,
   created_at, updated_at)
VALUES

-- E1
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Farming Equipment'),
  'DEMO-EQP-001',
  '[DEMO] Kirloskar 5 HP Water Pump Set',
  'Kirloskar Star-1 centrifugal monoblock water pump — 5 HP single-phase motor with 50 mm inlet/outlet. Max head 30 metres, discharge 900 LPM. Ideal for bore well, open well and canal water lifting for irrigation. Thermally protected motor with ISI mark. Includes 5-year pump body warranty.',
  'Kirloskar 5HP mono pump | 900 LPM | 30m head | Irrigation',
  12500.00, 11800.00, 5.60,
  'INR', 'ACTIVE', TRUE, TRUE,
  7, 60,
  'Kirloskar 5HP Water Pump Set for Irrigation | Smart Krishi',
  'Buy Kirloskar 5HP water pump for farm irrigation. 900 LPM, 30 metre head.',
  'water pump, Kirloskar pump, irrigation pump, 5HP water pump',
  NOW(), NOW()
),

-- E2
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Farming Equipment'),
  'DEMO-EQP-002',
  '[DEMO] Drip Irrigation Kit (1 Acre)',
  'Complete drip irrigation kit for 1 acre — includes main line, sub-main, laterals, inline emitters, filters and all fittings. Designed for row crops, vegetables and orchards. Saves up to 50% water vs flood irrigation. DRIP controller and pressure regulator included. Installation guide provided.',
  'Complete drip irrigation kit 1 acre | Emitters + fittings | 50% water saving',
  14500.00, 13000.00, 10.34,
  'INR', 'ACTIVE', TRUE, TRUE,
  7, 12,
  'Drip Irrigation Kit 1 Acre Complete Set | Smart Krishi',
  'Buy drip irrigation kit for 1 acre. Complete set, 50% water saving, includes fittings.',
  'drip irrigation, drip kit, micro irrigation, drip system, irrigation kit',
  NOW(), NOW()
),

-- E3
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  (SELECT id FROM categories WHERE category_name='Farming Equipment'),
  'DEMO-EQP-003',
  '[DEMO] Heavy Duty Shovel Set (3 Piece)',
  'Professional 3-piece shovel set — pointed digging shovel, flat spade and drain shovel. Heat-treated high-carbon steel blades. Ergonomic 1.2 m D-grip fibreglass handles for reduced fatigue. Suitable for soil digging, canal work, compost turning and general farm work. Lifetime blade warranty.',
  '3-piece shovel set | High carbon steel | D-grip fibreglass | Farm grade',
  1800.00, 1650.00, 8.33,
  'INR', 'ACTIVE', FALSE, FALSE,
  7, 0,
  'Heavy Duty Shovel Set 3 Piece Farm Grade | Smart Krishi',
  'Buy 3-piece shovel set. High carbon steel, D-grip handles, farm grade quality.',
  'shovel set, farm shovel, digging shovel, spade set, farm tools',
  NOW(), NOW()
),

-- E4
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Farming Equipment'),
  'DEMO-EQP-004',
  '[DEMO] Harvester Blade Kit (Combine Compatible)',
  'OEM-spec harvester blade kit compatible with New Holland, John Deere and Claas combines. Kit contains 16 upper blades + 16 lower sections + rivets and bolts. Hardox-450 steel for superior wear resistance — lasts 3x longer than standard blades. Suitable for wheat, paddy and soybean.',
  'Harvester blade kit 32pc | Hardox-450 | Combine compatible',
  8500.00, 7800.00, 8.23,
  'INR', 'ACTIVE', FALSE, TRUE,
  7, 0,
  'Harvester Blade Kit Combine Compatible | Smart Krishi',
  'Buy harvester blade kit. Hardox-450 steel, compatible with major combines.',
  'harvester blade, combine blade, harvester parts, blade kit',
  NOW(), NOW()
),

-- E5
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Farming Equipment'),
  'DEMO-EQP-005',
  '[DEMO] Complete Agricultural Tool Kit (15 Piece)',
  'All-in-one 15-piece agricultural tool kit for small farmers. Includes: hand hoe, weeder, garden fork, transplanter, dibber, pruning shears, hand trowel, cultivator claw, soil scoop, and more. Powder-coated handles and stainless steel blades. Packaged in a heavy-duty canvas carry bag.',
  '15-piece farm tool kit | Stainless steel | Canvas carry bag',
  2200.00, 1999.00, 9.13,
  'INR', 'ACTIVE', TRUE, FALSE,
  7, 0,
  'Agricultural Tool Kit 15 Piece Set | Smart Krishi',
  'Buy 15-piece agricultural tool kit. Stainless steel tools with canvas carry bag.',
  'farm tool kit, agricultural tools, garden tools set, farming kit',
  NOW(), NOW()
);

-- ── 6E. CROP PRODUCTS (5 products) ───────────────────────

INSERT IGNORE INTO products
  (seller_id, category_id, sku, product_name, product_description,
   short_description, price, discount_price, discount_percentage,
   currency, product_status, is_featured, is_bestseller,
   return_policy_days, warranty_months,
   seo_title, seo_description, seo_keywords,
   created_at, updated_at)
VALUES

-- CR1
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Crops'),
  'DEMO-CRP-001',
  '[DEMO] Premium Wheat (Lokwan) - 50 kg',
  'Premium grade Lokwan wheat — the most popular variety for chakki atta. Freshly harvested from Rajasthan farms, cleaned and graded. Moisture content below 12%. Bold, hard grains with high protein content (11-13%). Ideal for flour mills, bakeries and households. Packed in food-grade bags.',
  'Premium Lokwan wheat 50kg | <12% moisture | 11-13% protein | Rajasthan farm',
  1800.00, 1700.00, 5.55,
  'INR', 'ACTIVE', TRUE, TRUE,
  3, 0,
  'Premium Lokwan Wheat 50kg Farm Fresh | Smart Krishi',
  'Buy premium Lokwan wheat 50kg from Rajasthan farms. Low moisture, high protein.',
  'wheat, Lokwan wheat, farm wheat, 50kg wheat, atta wheat',
  NOW(), NOW()
),

-- CR2
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Crops'),
  'DEMO-CRP-002',
  '[DEMO] Sona Masuri Rice - 26 kg',
  'Sona Masuri — medium-grain aromatic rice from Karnataka. Lightweight, low-starch variety ideal for daily cooking, idli, dosa and biryani. Aged for 6 months for better texture and aroma. Hand sorted and triple cleaned. No polishing agents. Natural white colour.',
  'Sona Masuri rice 26kg | Aged 6 months | Aromatic | Karnataka origin',
  1400.00, 1300.00, 7.14,
  'INR', 'ACTIVE', FALSE, TRUE,
  3, 0,
  'Sona Masuri Rice 26kg Aged | Smart Krishi',
  'Buy Sona Masuri rice 26kg aged 6 months. Aromatic, Karnataka origin.',
  'Sona Masuri rice, Karnataka rice, rice 26kg, aromatic rice',
  NOW(), NOW()
),

-- CR3
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Crops'),
  'DEMO-CRP-003',
  '[DEMO] Yellow Soybean - 50 kg',
  'Premium quality JS-335 yellow soybean — freshly harvested, sun-dried and cleaned to food-grade standard. Protein content 40-42%, ideal for tofu, tempeh, soy milk, animal feed and industrial crushing. Below 13% moisture. Sorted for uniform bean size. No adulteration, lab tested.',
  'JS-335 yellow soybean 50kg | 40-42% protein | Food grade',
  3200.00, 3000.00, 6.25,
  'INR', 'ACTIVE', FALSE, FALSE,
  3, 0,
  'Yellow Soybean 50kg JS-335 | Smart Krishi',
  'Buy JS-335 yellow soybean 50kg. 40-42% protein, food grade, lab tested.',
  'soybean, yellow soybean, JS-335 soybean, protein soy, soya bean',
  NOW(), NOW()
),

-- CR4
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Crops'),
  'DEMO-CRP-004',
  '[DEMO] Desi Yellow Maize - 50 kg',
  'Farm-fresh desi yellow maize — dual-purpose for poultry feed and human consumption. High in energy and fibre. Moisture below 14%. Cleaned and graded. Free from aflatoxin contamination (test certificate available). Ideal for poultry farms, cattle feed units and maize flour production.',
  'Desi yellow maize 50kg | <14% moisture | Aflatoxin tested | Feed grade',
  1600.00, 1500.00, 6.25,
  'INR', 'ACTIVE', TRUE, FALSE,
  3, 0,
  'Desi Yellow Maize 50kg Feed Grade | Smart Krishi',
  'Buy desi yellow maize 50kg. Aflatoxin free, feed grade, moisture below 14%.',
  'maize, yellow maize, corn, desi maize, poultry feed corn',
  NOW(), NOW()
),

-- CR5
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  (SELECT id FROM categories WHERE category_name='Crops'),
  'DEMO-CRP-005',
  '[DEMO] Desi Chana (Chickpea) - 50 kg',
  'Bold Desi Chana (Bengal gram) variety — high-fibre, high-protein pulse from Maharashtra. Machine cleaned and graded. Suitable for dal, besan flour, snacks and sprouting. Protein content 19-21%. Below 12% moisture. No chemical treatment post-harvest. Direct from farmer collective storage.',
  'Desi Chana bold 50kg | 19-21% protein | Maharashtra | Besan grade',
  5500.00, 5200.00, 5.45,
  'INR', 'ACTIVE', FALSE, TRUE,
  3, 0,
  'Desi Chana Chickpea 50kg Bold Grade | Smart Krishi',
  'Buy desi chana chickpea 50kg. Bold grade, 19-21% protein, besan grade.',
  'chana, desi chana, chickpea, Bengal gram, besan chana',
  NOW(), NOW()
);

-- ── 6F. BUILDING MATERIAL PRODUCTS (5 products) ──────────

INSERT IGNORE INTO products
  (seller_id, category_id, sku, product_name, product_description,
   short_description, price, discount_price, discount_percentage,
   currency, product_status, is_featured, is_bestseller,
   return_policy_days, warranty_months,
   seo_title, seo_description, seo_keywords,
   created_at, updated_at)
VALUES

-- BM1
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Building Materials'),
  'DEMO-BLD-001',
  '[DEMO] UltraTech Cement (50 kg Bag)',
  'UltraTech PPC (Portland Pozzolana Cement) 50 kg bag — India''s #1 cement brand. Grade: 53. Ideal for all RCC, masonry and plastering work on farm structures, storage sheds, warehouses and boundary walls. Low heat of hydration, high long-term strength. BIS certified.',
  'UltraTech PPC cement 53 grade 50kg | BIS certified | Farm construction',
  420.00, 399.00, 5.00,
  'INR', 'ACTIVE', TRUE, TRUE,
  7, 0,
  'UltraTech Cement 50kg PPC Grade 53 | Smart Krishi',
  'Buy UltraTech PPC cement 50kg. Grade 53, BIS certified for farm construction.',
  'cement, UltraTech cement, PPC cement, 53 grade cement, construction cement',
  NOW(), NOW()
),

-- BM2
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  (SELECT id FROM categories WHERE category_name='Building Materials'),
  'DEMO-BLD-002',
  '[DEMO] TMT Steel Rod Fe-500D (12mm x 12m)',
  'TATA Tiscon 500D TMT steel reinforcement bar — 12mm diameter, 12-metre length. Fe-500D grade with superior ductility for earthquake resistance. Used in farm building RCC frames, slabs and columns. BIS certified (IS:1786). Low carbon content, superior weld-ability.',
  'TATA Tiscon TMT 12mm Fe-500D | Earthquake resistant | BIS IS:1786',
  750.00, 720.00, 4.00,
  'INR', 'ACTIVE', FALSE, TRUE,
  7, 0,
  'TATA TMT Steel Rod 12mm Fe-500D 12m | Smart Krishi',
  'Buy TATA Tiscon TMT 12mm rod Fe-500D. Earthquake resistant, BIS certified.',
  'TMT steel, TMT rod, TATA Tiscon, 12mm rod, construction steel',
  NOW(), NOW()
),

-- BM3
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  (SELECT id FROM categories WHERE category_name='Building Materials'),
  'DEMO-BLD-003',
  '[DEMO] Red Clay Bricks (500 Piece Bundle)',
  'Machine-made red clay bricks — First class quality as per IS:1077. Dimensions 230x110x75 mm, compressive strength 75 kg/cm². Low water absorption, uniform size and colour. Ideal for farm walls, cattle sheds, storage rooms and boundary constructions. Local kiln, free stacking at site.',
  '500 machine-made IS bricks | 75 kg/cm² strength | Farm construction',
  6500.00, 6000.00, 7.69,
  'INR', 'ACTIVE', FALSE, FALSE,
  7, 0,
  'Red Clay Bricks 500 Piece IS Grade | Smart Krishi',
  'Buy 500 machine-made red clay bricks. IS:1077 grade, 75 kg/cm2 strength.',
  'bricks, red bricks, clay bricks, construction bricks, IS bricks',
  NOW(), NOW()
),

-- BM4
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Building Materials'),
  'DEMO-BLD-004',
  '[DEMO] River Sand (One Truck Load - 5 Cubic Metres)',
  'Natural river sand — one full truck load (approximately 5 cubic metres / 7.5 metric tonnes). Washed and sieved to remove organic matter and silt. Zone II gradation suitable for plastering and concreting. Free from clay lumps and alkalis. Delivery to farm site included in price.',
  'River sand 5m³ truck load | Zone-II | Washed | Site delivery included',
  8500.00, 8000.00, 5.88,
  'INR', 'ACTIVE', TRUE, FALSE,
  3, 0,
  'River Sand 5 Cubic Metre Truck Load | Smart Krishi',
  'Buy river sand 5 cubic metres truck load. Zone-II, washed, site delivery included.',
  'river sand, construction sand, Zone II sand, M-sand, plastering sand',
  NOW(), NOW()
),

-- BM5
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  (SELECT id FROM categories WHERE category_name='Building Materials'),
  'DEMO-BLD-005',
  '[DEMO] Stone Aggregate 20mm (One Truck Load)',
  'Crushed granite stone aggregate 20mm — one truck load (approx. 6 cubic metres / 9 MT). Cube-shaped particles from hard granite for maximum concrete strength. Clean and dry, free from dust and organic matter. IS:383 compliant. Used in RCC work, road base, and drainage works on farms.',
  'Granite aggregate 20mm 6m³ | IS:383 | Cube shaped | RCC grade',
  9500.00, 9000.00, 5.26,
  'INR', 'ACTIVE', FALSE, FALSE,
  3, 0,
  'Stone Aggregate 20mm Granite Truck Load | Smart Krishi',
  'Buy granite stone aggregate 20mm truck load. IS:383, cube shaped, RCC grade.',
  'stone aggregate, granite aggregate, 20mm aggregate, jelly, coarse aggregate',
  NOW(), NOW()
);

-- ============================================================
-- SECTION 7 — PRODUCT IMAGES
-- 2 images per product (primary + secondary)
-- Uses picsum.photos with product-specific seeds
-- ============================================================

INSERT IGNORE INTO product_images
  (product_id, image_url, public_id, is_primary, display_order, created_at)
SELECT p.id,
  CONCAT('https://picsum.photos/seed/', p.sku, '_1/600/400') AS image_url,
  CONCAT('smartkrishi/demo/', p.sku, '_1') AS public_id,
  TRUE AS is_primary,
  1 AS display_order,
  NOW()
FROM products p
WHERE p.sku LIKE 'DEMO-%'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

INSERT IGNORE INTO product_images
  (product_id, image_url, public_id, is_primary, display_order, created_at)
SELECT p.id,
  CONCAT('https://picsum.photos/seed/', p.sku, '_2/600/400') AS image_url,
  CONCAT('smartkrishi/demo/', p.sku, '_2') AS public_id,
  FALSE AS is_primary,
  2 AS display_order,
  NOW()
FROM products p
WHERE p.sku LIKE 'DEMO-%'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.display_order = 2
  );

-- ============================================================
-- SECTION 8 — PRODUCT INVENTORY
-- Stock quantities for all 30 demo products
-- ============================================================

INSERT IGNORE INTO product_inventory
  (product_id, quantity_available, quantity_reserved, quantity_sold,
   reorder_level, reorder_quantity, last_stock_update)
SELECT
  p.id,
  CASE
    WHEN p.sku LIKE 'DEMO-MLK-%' THEN 200
    WHEN p.sku LIKE 'DEMO-FRT-%' THEN 150
    WHEN p.sku LIKE 'DEMO-MCH-%' THEN 10
    WHEN p.sku LIKE 'DEMO-EQP-%' THEN 50
    WHEN p.sku LIKE 'DEMO-CRP-%' THEN 100
    WHEN p.sku LIKE 'DEMO-BLD-%' THEN 80
    ELSE 50
  END AS quantity_available,
  0 AS quantity_reserved,
  0 AS quantity_sold,
  CASE
    WHEN p.sku LIKE 'DEMO-MCH-%' THEN 2
    ELSE 10
  END AS reorder_level,
  CASE
    WHEN p.sku LIKE 'DEMO-MCH-%' THEN 5
    ELSE 50
  END AS reorder_quantity,
  NOW() AS last_stock_update
FROM products p
WHERE p.sku LIKE 'DEMO-%'
  AND NOT EXISTS (
    SELECT 1 FROM product_inventory pi WHERE pi.product_id = p.id
  );

-- ============================================================
-- SECTION 9 — DOMAIN-SPECIFIC TABLES
-- Populate: milks, fertilizers, machinery,
--           farming_equipments, crops, building_materials
-- ============================================================

-- ── 9A. MILKS table ───────────────────────────────────────

INSERT IGNORE INTO milks
  (product_id, milk_type, fat_percentage, daily_availability, delivery_radius, created_at)
SELECT p.id,
  CASE p.sku
    WHEN 'DEMO-MLK-001' THEN 'Cow'
    WHEN 'DEMO-MLK-002' THEN 'Buffalo'
    WHEN 'DEMO-MLK-003' THEN 'Cow'
    WHEN 'DEMO-MLK-004' THEN 'A2 Desi Cow'
    WHEN 'DEMO-MLK-005' THEN 'Mixed'
  END,
  CASE p.sku
    WHEN 'DEMO-MLK-001' THEN 3.5
    WHEN 'DEMO-MLK-002' THEN 7.0
    WHEN 'DEMO-MLK-003' THEN 3.2
    WHEN 'DEMO-MLK-004' THEN 4.5
    WHEN 'DEMO-MLK-005' THEN 3.8
  END,
  TRUE,
  CASE p.sku
    WHEN 'DEMO-MLK-003' THEN 5
    WHEN 'DEMO-MLK-004' THEN 10
    ELSE 20
  END,
  NOW()
FROM products p
WHERE p.sku IN ('DEMO-MLK-001','DEMO-MLK-002','DEMO-MLK-003','DEMO-MLK-004','DEMO-MLK-005')
  AND NOT EXISTS (SELECT 1 FROM milks m WHERE m.product_id = p.id);

-- ── 9B. FERTILIZERS table ─────────────────────────────────

INSERT IGNORE INTO fertilizers
  (product_id, fertilizer_name, brand, manufacturing_date, expiry_date, created_at)
SELECT p.id,
  CASE p.sku
    WHEN 'DEMO-FRT-001' THEN 'Urea 46% N'
    WHEN 'DEMO-FRT-002' THEN 'DAP 18-46-0'
    WHEN 'DEMO-FRT-003' THEN 'Muriate of Potash 60% K2O'
    WHEN 'DEMO-FRT-004' THEN 'Organic Compost'
    WHEN 'DEMO-FRT-005' THEN 'Premium Vermicompost'
  END AS fertilizer_name,
  CASE p.sku
    WHEN 'DEMO-FRT-001' THEN 'IFFCO'
    WHEN 'DEMO-FRT-002' THEN 'IFFCO'
    WHEN 'DEMO-FRT-003' THEN 'Coromandel'
    WHEN 'DEMO-FRT-004' THEN 'Village Farmer FPO'
    WHEN 'DEMO-FRT-005' THEN 'Village Farmer FPO'
  END AS brand,
  DATE_SUB(CURDATE(), INTERVAL 3 MONTH) AS manufacturing_date,
  DATE_ADD(CURDATE(), INTERVAL 21 MONTH) AS expiry_date,
  NOW()
FROM products p
WHERE p.sku IN ('DEMO-FRT-001','DEMO-FRT-002','DEMO-FRT-003','DEMO-FRT-004','DEMO-FRT-005')
  AND NOT EXISTS (SELECT 1 FROM fertilizers f WHERE f.product_id = p.id);

-- ── 9C. MACHINERY table ───────────────────────────────────

INSERT IGNORE INTO machinery
  (product_id, machinery_type, brand_name, model_number,
   engine_type, power_hp, capacity_specification,
   maintenance_interval_hours, warranty_years,
   fuel_efficiency, manufacturing_year, condition_status,
   negotiable, rent_per_day, security_deposit,
   available_for_sale, available_for_rent, available_for_both,
   state, district, village_city, pincode,
   seller_contact_name, mobile_number, whatsapp_number,
   created_at)
VALUES

(
  (SELECT id FROM products WHERE sku='DEMO-MCH-001'),
  'TRACTOR', 'Mahindra', '575 DI XP Plus',
  'DIESEL', 55, '2WD, PTO 1000 rpm, 3-Point Linkage',
  250, 1, '3.5 L/hour', 2021, 'GOOD',
  TRUE, 3500.00, 50000.00,
  TRUE, TRUE, TRUE,
  'Maharashtra', 'Latur', 'Nanded Road', '413512',
  'Ramesh Patil', '+919900011001', '+919900011001',
  NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-MCH-002'),
  'ROTAVATOR', 'Fieldking', 'Excel 175',
  'TRACTOR_PTO', 0, '7-foot, 48 blades, gear drive',
  500, 1, NULL, 2022, 'EXCELLENT',
  FALSE, 1200.00, 15000.00,
  TRUE, TRUE, FALSE,
  'Maharashtra', 'Latur', 'Nanded Road', '413512',
  'Ramesh Patil', '+919900011001', '+919900011001',
  NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-MCH-003'),
  'SEED_DRILL', 'Kinze', 'K300 9-Row Pneumatic',
  'TRACTOR_PTO', 0, '9 rows, spacing 20-45cm, pneumatic',
  300, 1, NULL, 2022, 'GOOD',
  TRUE, 1800.00, 20000.00,
  TRUE, TRUE, FALSE,
  'Karnataka', 'Dharwad', 'APMC Market', '580028',
  'Suresh Kumar', '+919900011002', '+919900011002',
  NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-MCH-004'),
  'SPRAYER', 'Honda', 'WJR25 Knapsack',
  'PETROL', 2, '25 litre tank, 15-bar pump',
  100, 1, '0.8 L/hour', 2023, 'EXCELLENT',
  FALSE, 500.00, 5000.00,
  TRUE, TRUE, FALSE,
  'Karnataka', 'Dharwad', 'Hubli', '580028',
  'Suresh Kumar', '+919900011002', '+919900011002',
  NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-MCH-005'),
  'CULTIVATOR', 'Fieldking', '9-Tine Spring Cultivator',
  'TRACTOR_PTO', 0, '9 tines, 2.1m width, depth 15cm',
  200, 1, NULL, 2021, 'GOOD',
  TRUE, 800.00, 10000.00,
  TRUE, TRUE, FALSE,
  'Rajasthan', 'Jodhpur', 'Mandore', '342006',
  'Mahendra Singh', '+919900011003', '+919900011003',
  NOW()
);

-- ── 9D. FARMING_EQUIPMENTS table ──────────────────────────

INSERT IGNORE INTO farming_equipments
  (product_id, equipment_name, brand, model,
   purchase_year, equipment_condition,
   rent_per_day, security_deposit, for_sale, for_rent, created_at)
VALUES
(
  (SELECT id FROM products WHERE sku='DEMO-EQP-001'),
  'Water Pump Monoblock', 'Kirloskar', 'Star-1 5HP',
  2023, 'NEW', 250.00, 3000.00, TRUE, TRUE, NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-EQP-002'),
  'Drip Irrigation Kit 1 Acre', 'Netafim', 'Uniram 1 Acre Kit',
  2023, 'NEW', 600.00, 5000.00, TRUE, TRUE, NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-EQP-003'),
  'Heavy Duty Shovel Set', 'Billhook', 'Pro-3 Series',
  2024, 'NEW', NULL, NULL, TRUE, FALSE, NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-EQP-004'),
  'Harvester Blade Kit', 'Hardox', 'HX-32 Universal',
  2024, 'NEW', NULL, NULL, TRUE, FALSE, NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-EQP-005'),
  'Agricultural Tool Kit 15 Piece', 'Agri Pro', 'APK-15 Complete',
  2024, 'NEW', NULL, NULL, TRUE, FALSE, NOW()
);

-- ── 9E. CROPS table ───────────────────────────────────────

INSERT IGNORE INTO crops
  (product_id, crop_name, scientific_name, crop_type,
   growing_season, growth_cycle_days, soil_type,
   water_requirement, temperature_min, temperature_max,
   yield_per_hectare, market_demand, variety, unit,
   harvest_date, location, created_at)
VALUES
(
  (SELECT id FROM products WHERE sku='DEMO-CRP-001'),
  'Wheat', 'Triticum aestivum', 'CEREAL',
  'RABI', 120, 'LOAM',
  'Moderate (450mm season)', 10, 25,
  '4-5 tonnes/hectare', 'HIGH', 'Lokwan', 'kg',
  DATE_SUB(CURDATE(), INTERVAL 30 DAY),
  'Barmer, Rajasthan', NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-CRP-002'),
  'Rice', 'Oryza sativa', 'CEREAL',
  'KHARIF', 135, 'CLAY_LOAM',
  'High (1200mm season)', 22, 35,
  '5-6 tonnes/hectare', 'HIGH', 'Sona Masuri', 'kg',
  DATE_SUB(CURDATE(), INTERVAL 45 DAY),
  'Shimoga, Karnataka', NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-CRP-003'),
  'Soybean', 'Glycine max', 'OILSEED',
  'KHARIF', 100, 'WELL_DRAINED_LOAM',
  'Moderate (600mm season)', 18, 32,
  '2-3 tonnes/hectare', 'MEDIUM', 'JS-335', 'kg',
  DATE_SUB(CURDATE(), INTERVAL 60 DAY),
  'Vidarbha, Maharashtra', NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-CRP-004'),
  'Maize', 'Zea mays', 'CEREAL',
  'KHARIF', 90, 'SANDY_LOAM',
  'Moderate (500mm season)', 15, 30,
  '5-7 tonnes/hectare', 'HIGH', 'Desi Yellow', 'kg',
  DATE_SUB(CURDATE(), INTERVAL 20 DAY),
  'Jodhpur, Rajasthan', NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-CRP-005'),
  'Chana', 'Cicer arietinum', 'PULSE',
  'RABI', 110, 'SANDY_LOAM',
  'Low (300mm season)', 8, 25,
  '1.5-2.5 tonnes/hectare', 'HIGH', 'Desi Bold', 'kg',
  DATE_SUB(CURDATE(), INTERVAL 40 DAY),
  'Aurangabad, Maharashtra', NOW()
);

-- ── 9F. BUILDING_MATERIALS table ──────────────────────────

INSERT IGNORE INTO building_materials
  (product_id, material_type, unit, delivery_available, created_at)
VALUES
(
  (SELECT id FROM products WHERE sku='DEMO-BLD-001'),
  'Cement', 'bags', TRUE, NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-BLD-002'),
  'Iron Rods', 'pieces', TRUE, NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-BLD-003'),
  'Bricks', 'pieces', TRUE, NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-BLD-004'),
  'Sand', 'brass', TRUE, NOW()
),
(
  (SELECT id FROM products WHERE sku='DEMO-BLD-005'),
  'Stone', 'tons', TRUE, NOW()
);

-- ============================================================
-- SECTION 10 — LAND LISTINGS (5 listings)
-- ============================================================

INSERT IGNORE INTO land_listings
  (seller_id, land_title, description,
   area_in_acres, area_unit, village,
   electricity_availability, road_connectivity,
   land_type, state, district, taluka, pin_code,
   latitude, longitude, price_per_acre, currency,
   soil_information, water_source_information, accessibility,
   land_status, view_count, interest_count, created_at, updated_at)
VALUES

-- L1 : 2 Acre Irrigated Farm Land
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  '[DEMO] 2 Acre Irrigated Farm Land - Latur',
  'Well-maintained 2-acre irrigated farmland on the outskirts of Latur city. Loamy black soil suitable for sugarcane, cotton, vegetables and rabi crops. Has a functional 4HP borwell with submersible pump. Electricity connection available, road accessible throughout the year. RTC and 7/12 documents clear. Ideal for individual farmer or FPO purchase.',
  2.00, 'acre', 'Dongaon',
  TRUE, 'ALL_WEATHER',
  'Irrigated Agricultural Land',
  'Maharashtra', 'Latur', 'Latur', '413512',
  18.40211, 76.57813,
  550000.00, 'INR',
  'Black cotton soil (Vertisol), pH 7.2, high organic matter, well-drained. Suitable for cotton, sugarcane and vegetables.',
  'Borewell 180 feet depth, 4HP submersible pump, 2 inch outlet, yield 2500 LPH. River canal 200m away.',
  'State highway frontage 50m. Metal road access. 3 km from Latur city centre.',
  'AVAILABLE', 0, 0, NOW(), NOW()
),

-- L2 : 5 Acre Agriculture Land
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Green Farm Supplies'),
  '[DEMO] 5 Acre Agriculture Land - Osmanabad',
  'Productive 5-acre dryland agriculture land with scope for irrigation development. Red laterite soil ideal for tur dal, jowar and oilseeds. Moderate slope ensures good drainage. Situated in a fast-developing zone with proximity to agricultural markets. All legal documents including survey, 7/12, and mutation are up to date.',
  5.00, 'acre', 'Kallam',
  FALSE, 'SEASONAL',
  'Dryland Agricultural Land',
  'Maharashtra', 'Osmanabad', 'Kallam', '413507',
  18.01400, 76.22100,
  380000.00, 'INR',
  'Red laterite soil, pH 6.8, moderate fertility. Good for tur, jowar, sunflower and gram.',
  'Seasonal stream 500m. Borewell feasible in rainy season. Groundwater at 220 feet.',
  'Village road access, motorable in dry season. NH-52 bypass 4 km.',
  'AVAILABLE', 0, 0, NOW(), NOW()
),

-- L3 : Organic Farming Land
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  '[DEMO] Certified Organic Farming Land 3 Acres - Jodhpur',
  'Rare certified organic land — 3 acres with NPOP organic certification valid until 2026. Chemical-free for 7+ years. Ideal for organic vegetable, spice and herb production. Established compost pit and vermicompost unit on site. Low-cost drip irrigation system already installed. Adjacent to a functional organic farmers cluster of 12 families.',
  3.00, 'acre', 'Mandore',
  TRUE, 'ALL_WEATHER',
  'Certified Organic Agricultural Land',
  'Rajasthan', 'Jodhpur', 'Jodhpur', '342006',
  26.33200, 73.04500,
  420000.00, 'INR',
  'Sandy loam soil, chemical-free 7+ years, NPOP certified. pH 7.5. Rich in organic matter from compost application. Suitable for vegetables, spices and medicinal herbs.',
  'Drip irrigation installed (1 acre capacity), water harvesting pond (500 kL), borewell 150 feet. Rainy season canal nearby.',
  'Concrete road to land boundary. 8 km from Jodhpur city. Transport connectivity available.',
  'AVAILABLE', 0, 0, NOW(), NOW()
),

-- L4 : Road Connected Farm Land
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Krishi Agro Store'),
  '[DEMO] Road Connected Prime Farm Land 4 Acres - Hubli',
  'Four-acre high-value farm land with direct state highway frontage — premium location for agri-processing unit, cold storage or advanced farming. Flat terrain, no encumbrances. Electricity substation 100m away. Municipal water pipeline adjacent. Title clear, registered sale deed available. Ideal for polyhouse/greenhouse or agri-business.',
  4.00, 'acre', 'Gabbur',
  TRUE, 'ALL_WEATHER',
  'Commercial Agricultural Land',
  'Karnataka', 'Dharwad', 'Hubli', '580023',
  15.38000, 75.14500,
  750000.00, 'INR',
  'Deep red loamy soil, pH 6.5-7.0, fertile. Suitable for cotton, maize, vegetables and floriculture.',
  'Municipal water connection available. Borewell 200 feet, 3HP pump installed. Annual rainfall 800mm.',
  'State highway NH-48 frontage 40 metres. All-weather concrete road. Power line on boundary.',
  'AVAILABLE', 0, 0, NOW(), NOW()
),

-- L5 : River Side Agriculture Land
(
  (SELECT id FROM seller_profiles WHERE business_name='[DEMO] Village Farmer Producer Group'),
  '[DEMO] Riverside Agriculture Land 6 Acres - Nagaur',
  'Fertile riverside agriculture land — 6 acres on the banks of the Luni River with natural irrigation advantage. Rich alluvial soil deposits every season replenish soil nutrients. Suitable for mustard, wheat, vegetables and fruit orchards. Lift irrigation from the river is already established. Rare opportunity for riverside farming in Rajasthan.',
  6.00, 'acre', 'Makrana',
  FALSE, 'SEASONAL',
  'Riverside Agricultural Land',
  'Rajasthan', 'Nagaur', 'Makrana', '341505',
  27.04300, 74.72300,
  350000.00, 'INR',
  'Alluvial sandy loam, pH 7.8, replenished annually by river silt. Rich in potassium and phosphorus. Suitable for mustard, wheat, vegetables.',
  'Luni River 80 metres from boundary. Lift irrigation pump 3HP installed. Seasonal flooding risk low — land above flood plain.',
  'Village road 1.5 km from Makrana-Nagaur state road. Accessible in dry season.',
  'AVAILABLE', 0, 0, NOW(), NOW()
);

-- ============================================================
-- SECTION 11 — LAND IMAGES
-- Primary + secondary image per land listing
-- ============================================================

INSERT IGNORE INTO land_images
  (land_listing_id, image_url, public_id, is_primary, display_order, created_at)
SELECT ll.id,
  CONCAT('https://picsum.photos/seed/land_', ll.id, '_1/800/500') AS image_url,
  CONCAT('smartkrishi/land/', ll.id, '_primary') AS public_id,
  TRUE, 1, NOW()
FROM land_listings ll
WHERE ll.land_title LIKE '[DEMO]%'
  AND NOT EXISTS (
    SELECT 1 FROM land_images li
    WHERE li.land_listing_id = ll.id AND li.is_primary = TRUE
  );

INSERT IGNORE INTO land_images
  (land_listing_id, image_url, public_id, is_primary, display_order, created_at)
SELECT ll.id,
  CONCAT('https://picsum.photos/seed/land_', ll.id, '_2/800/500') AS image_url,
  CONCAT('smartkrishi/land/', ll.id, '_secondary') AS public_id,
  FALSE, 2, NOW()
FROM land_listings ll
WHERE ll.land_title LIKE '[DEMO]%'
  AND NOT EXISTS (
    SELECT 1 FROM land_images li
    WHERE li.land_listing_id = ll.id AND li.display_order = 2
  );

-- ============================================================
-- SECTION 12 — BUYER PROFILES
-- Create buyer profile for the 2 test buyers
-- ============================================================

INSERT IGNORE INTO buyer_profiles
  (user_id, preferred_language, wallet_balance,
   total_orders, total_spent, loyalty_points, updated_at)
SELECT u.id, 'en', 0.00, 0, 0, 100, NOW()
FROM users u
WHERE u.email IN (
  'testbuyer1.demo@smartkrishi.test',
  'testbuyer2.demo@smartkrishi.test'
)
AND NOT EXISTS (
  SELECT 1 FROM buyer_profiles bp WHERE bp.user_id = u.id
);

-- ============================================================
-- SECTION 13 — USER ADDRESSES (test buyers)
-- ============================================================

INSERT IGNORE INTO user_addresses
  (user_id, address_type, full_name, mobile_number,
   house_number, street, landmark, city, district,
   state, pincode, country, is_default, created_at, updated_at)
VALUES
(
  (SELECT id FROM users WHERE email='testbuyer1.demo@smartkrishi.test'),
  'HOME',
  'Anjali Sharma',
  '+919900022001',
  '42-B', 'Gandhi Nagar', 'Near Post Office',
  'Pune', 'Pune', 'Maharashtra', '411001', 'India',
  TRUE, NOW(), NOW()
),
(
  (SELECT id FROM users WHERE email='testbuyer2.demo@smartkrishi.test'),
  'FARM',
  'Vikram Rao',
  '+919900022002',
  'Survey 23', 'Kalmadi Road', 'Near Krishi Kendra',
  'Sangli', 'Sangli', 'Maharashtra', '416416', 'India',
  TRUE, NOW(), NOW()
);

-- ============================================================
-- SECTION 14 — FINAL VALIDATION QUERIES
-- Run after seeding to confirm counts
-- ============================================================

-- Uncomment the block below to view a seed summary:
/*
SELECT 'SEED SUMMARY' AS report_section, '' AS value
UNION ALL
SELECT 'Total Demo Users',       COUNT(*) FROM users    WHERE email LIKE '%.demo@smartkrishi.test'
UNION ALL
SELECT 'Total Demo Sellers',     COUNT(*) FROM seller_profiles WHERE business_name LIKE '[DEMO]%'
UNION ALL
SELECT 'Total Demo Products',    COUNT(*) FROM products WHERE sku LIKE 'DEMO-%'
UNION ALL
SELECT 'Milk Products',          COUNT(*) FROM products WHERE sku LIKE 'DEMO-MLK-%'
UNION ALL
SELECT 'Fertilizer Products',    COUNT(*) FROM products WHERE sku LIKE 'DEMO-FRT-%'
UNION ALL
SELECT 'Machinery Products',     COUNT(*) FROM products WHERE sku LIKE 'DEMO-MCH-%'
UNION ALL
SELECT 'Equipment Products',     COUNT(*) FROM products WHERE sku LIKE 'DEMO-EQP-%'
UNION ALL
SELECT 'Crop Products',          COUNT(*) FROM products WHERE sku LIKE 'DEMO-CRP-%'
UNION ALL
SELECT 'Building Mat Products',  COUNT(*) FROM products WHERE sku LIKE 'DEMO-BLD-%'
UNION ALL
SELECT 'Product Images',         COUNT(*) FROM product_images pi JOIN products p ON p.id=pi.product_id WHERE p.sku LIKE 'DEMO-%'
UNION ALL
SELECT 'Inventory Records',      COUNT(*) FROM product_inventory pinv JOIN products p ON p.id=pinv.product_id WHERE p.sku LIKE 'DEMO-%'
UNION ALL
SELECT 'Land Listings',          COUNT(*) FROM land_listings WHERE land_title LIKE '[DEMO]%'
UNION ALL
SELECT 'Land Images',            COUNT(*) FROM land_images li JOIN land_listings ll ON ll.id=li.land_listing_id WHERE ll.land_title LIKE '[DEMO]%'
UNION ALL
SELECT 'Categories (Total)',     COUNT(*) FROM categories WHERE is_active = TRUE;
*/

-- ============================================================
-- SECTION 15 — RE-ENABLE FK CHECKS
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- END OF TEST_DATA_SEED.sql
-- Smart Krishi Marketplace — Test Data Seed v1.0.0
-- ============================================================
