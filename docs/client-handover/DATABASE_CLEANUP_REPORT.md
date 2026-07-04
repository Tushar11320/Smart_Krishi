# Smart Krishi Marketplace — Database Handover Cleanup Report

This report documents the operations performed to prepare the Smart Krishi Marketplace database for client handover by purging all demo, seed, mock, and test data. 

**Handover Status:** ✅ DATABASE CLEANED & READIED FOR DELIVERY  
**Cleanup Date:** 2026-07-03  
**Auditor/Architect:** Senior Database Architect & Backend Engineer  
**Target Environment Database:** `smart_krishi` (MySQL 8.0)  

---

## 💾 Pre-Cleanup Backup
Before initiating any data deletion, a complete database dump was successfully created.

* **Backup File:** `database/backups/backup_pre_cleanup_20260703.sql`
* **Backup Size:** 434 KB (434,082 bytes)
* **Backup Method:** MySQL Dump (`mysqldump` CLI utility)
* **Status:** Verified and secured.

---

## 🧹 Preserved Data (Remaining Production Data)
To ensure the application functions immediately upon setup and first launch by the client, infrastructure and configuration tables along with the default accounts listed in the [Handover Checklist](file:///PROJECT_ROOT/docs/client-handover/HANDOVER_CHECKLIST.md) have been preserved.

### Preserved User Accounts
* **Default Administrator:** `admin@smartkrishi.com` (User ID 1) — Role: `ROLE_ADMIN`, `ROLE_USER`
* **Default Merchant Manager:** `seller@smartkrishi.com` (User ID 12) — Role: `ROLE_SELLER`, `ROLE_USER`

### Preserved Structural Config Tables
* **`categories`** (9 records): Structural catalog categories required by the marketplace.
* **`roles`** (4 records): Core role permissions (`ROLE_USER`, `ROLE_SELLER`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`).
* **`user_roles`** (4 records): Role mappings for the preserved default admin and default seller.
* **`seller_profiles`** (1 record): Preserved business profile for the default merchant manager (`seller@smartkrishi.com`).

---

## 📊 Cleanup Reconciliation

The table below reconciles database records before and after the cleanup operation:

| Table Name | Pre-Cleanup Rows | Post-Cleanup Rows | Records Purged | Status |
| :--- | :---: | :---: | :---: | :---: |
| **`users`** | 22 | 2 | 20 | ✅ Cleared |
| **`user_roles`** | 32 | 4 | 28 | ✅ Mapped |
| **`seller_profiles`** | 15 | 1 | 14 | ✅ Cleared |
| **`buyer_profiles`** | 7 | 0 | 7 | ✅ Cleared |
| **`user_addresses`** | 4 | 0 | 4 | ✅ Cleared |
| **`products`** | 31 | 0 | 31 | ✅ Cleared |
| **`product_inventory`** | 31 | 0 | 31 | ✅ Cleared |
| **`product_images`** | 60 | 0 | 60 | ✅ Cleared |
| **`milks`** | 5 | 0 | 5 | ✅ Cleared |
| **`fertilizers`** | 6 | 0 | 6 | ✅ Cleared |
| **`machinery`** | 5 | 0 | 5 | ✅ Cleared |
| **`farming_equipments`** | 5 | 0 | 5 | ✅ Cleared |
| **`crops`** | 5 | 0 | 5 | ✅ Cleared |
| **`building_materials`** | 5 | 0 | 5 | ✅ Cleared |
| **`land_listings`** | 5 | 0 | 5 | ✅ Cleared |
| **`land_images`** | 10 | 0 | 10 | ✅ Cleared |
| **`orders`** | 6 | 0 | 6 | ✅ Cleared |
| **`order_items`** | 45 | 0 | 45 | ✅ Cleared |
| **`carts`** | 5 | 0 | 5 | ✅ Cleared |
| **`cart_items`** | 2 | 0 | 2 | ✅ Cleared |
| **`payments`** | 6 | 0 | 6 | ✅ Cleared |
| **`notifications`** | 11 | 0 | 11 | ✅ Cleared |
| **`feedbacks`** | 1 | 0 | 1 | ✅ Cleared |
| **`audit_logs`** | 6 | 0 | 6 | ✅ Cleared |
| **`weather_cache`** | 3 | 0 | 3 | ✅ Cleared |
| **`categories`** | 9 | 9 | 0 | 🛡️ Preserved |
| **`roles`** | 4 | 4 | 0 | 🛡️ Preserved |
| **All other tables** | 0 | 0 | 0 | ✅ Clean |

---

## 🖼️ Image and Media Cleanup

### 1. Cloudinary / Remote Media
All remote test images retrieved from the `picsum.photos` CDN (60 product image mappings, 10 land image mappings, and 3 seller logo mappings) have been cleared from the database metadata.

### 2. Local Server Fallback Uploads
The directory `backend/uploads/` was completely cleared of all local files to save disk storage and remove user-generated test uploads.
* **Deleted Files Count:** 17 files
* **Cleaned Path:** `backend/uploads/`
* **Purged File List:**
  * `0675e4bc-4f14-4cba-8e86-38f966262bd4.png`
  * `07e98913-adba-43b2-b244-27eb6270f438.jpg`
  * `0f31d7ff-db8c-4cdd-a8ee-89cf52210486.jpg`
  * `0fa99aa5-b074-4ef4-b11f-86d8614b7655.jpg`
  * `105e208f-9df0-49b7-aa31-c5ef3bc4746b.jpg`
  * `1280e1ea-04ce-4faa-985a-f14308afc271.jpg`
  * `5f45a8e8-db20-47e3-9fb8-7faa9df97f76.jpg`
  * `739c4291-00f4-46e1-9792-5ef99bf703c6.jpg`
  * `783ce01b-1595-4352-a94b-58b7bb0421fd.png`
  * `83cbcbfa-5846-4a47-a9f4-f6091069881a.jpg`
  * `989442c9-3800-4ee2-8d65-d5abfac98bc5.png`
  * `a3695fd7-994b-4409-bb66-6132a720f1df.jpg`
  * `bfed0518-32f6-41c7-aa5c-3b640ed1995c.jpg`
  * `c7b9bee7-7ae7-4185-bbf9-ca076fefaa65.png`
  * `c7db0889-85b4-4053-ae5a-ceb23cd5614f.jpg`
  * `e0973024-8630-466d-97f5-bf971e95844b.jpg`
  * `f9efbf72-181b-4a6e-9cd0-cc35e4478354.jpg`

---

## ⚙️ Codebase Adjustments

To prevent the Spring Boot application from re-seeding the database with the default fertilizer product (`FERT-UREA-001`), its associated inventory record, and fertilizer detail mapping, the following change was made to the java codebase:

* **File Modified:** [DataInitializer.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/config/DataInitializer.java#L329-L331)
* **Action:** Seeding code for the product `FERT-UREA-001` was disabled. It now only writes a log entry confirming that seeding is disabled for handover, ensuring that future server runs will not dirty the clean production database schema.
* **Test Verification:** Maven build and test suite run successfully:
  * **Command:** `backend/mvnw.cmd clean test -f backend/pom.xml`
  * **Result:** `BUILD SUCCESS` (47/47 tests passed, 0 failures, 0 errors)

---

### Verification Summary
The database and server application have been certified in a clean, production-ready handover state:
* No demo users remain.
* No test orders/payments exist.
* No mock products or listing details exist.
* The system is ready to be delivered to the client.
