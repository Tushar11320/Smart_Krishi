# Build Verification Audit Report
**Project:** Smart Krishi Marketplace  
**Scope:** Compilation, Build Artifacts & Test Executions Audit  
**Status:** 🟢 SUCCESSFUL BUILD & TEST PASS (No Errors, 3 Builder Warnings)

---

## 1. Frontend Build Verification (React/Vite)

- **Command executed**: `npm run build`
- **Compiler/Packager**: Vite v7.3.0
- **Duration**: 5.09 seconds
- **Status**: ✅ SUCCESSFUL
- **Errors**: 0
- **Warnings**: 0

### Build Output Artifacts & Chunks:
- `dist/index.html` (1.33 kB)
- `dist/assets/farmer_hero-BXW5df0p.png` (629.52 kB)
- `dist/assets/index-BNW-lsDS.css` (145.64 kB)
- `dist/assets/Wishlist-DPw0cb4i.js` (4.09 kB)
- `dist/assets/Notifications-BZr6vGSg.js` (4.62 kB)
- `dist/assets/MachineryRentals-B2TupSVG.js` (5.18 kB)
- `dist/assets/MyReviews-CkTnQH6h.js` (8.15 kB)
- `dist/assets/OrdersHistory-BX1-jcNm.js` (8.62 kB)
- `dist/assets/ProfileSection-CDVY4KL3.js` (10.53 kB)
- `dist/assets/AddressBook-L0A17G4T.js` (14.89 kB)
- `dist/assets/vendor-motion-Dmx-43H0.js` (32.42 kB)
- `dist/assets/vendor-other-DmZBko98.js` (137.56 kB)
- `dist/assets/SellerApplication-C1TEh4D0.js` (168.12 kB)
- `dist/assets/vendor-core-DN7vyK_B.js` (429.30 kB)
- `dist/assets/index-BDV9kCqL.js` (464.39 kB)

---

## 2. Backend Build Verification (Spring Boot/Maven)

- **Commands executed**:
  - `.\mvnw.cmd clean package -DskipTests`
  - `.\mvnw.cmd test`
- **Compiler**: JDK 21 (javac)
- **Framework**: Spring Boot v3.3.0, Spring v6.1.8
- **Status**: ✅ BUILD SUCCESS
- **Errors**: 0
- **Warnings**: 2 Lombok Builder Warnings, 2 Deprecation/Unsafe warnings

### Compilation Warnings Audit:
1. **Lombok `@Builder` Initialization Warning 1**:
   - **File:** [DeliveryProfile.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/entity/DeliveryProfile.java#L35)
   - **Line:** 35
   - **Message:** `@Builder will ignore the initializing expression entirely.`
   - **Root Cause:** Builder doesn't capture field initializations at declaration.
   - **Fix:** Annotate the field with `@Builder.Default`.
2. **Lombok `@Builder` Initialization Warning 2**:
   - **File:** [OrderTracking.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/entity/OrderTracking.java#L48)
   - **Line:** 48
   - **Message:** `@Builder will ignore the initializing expression entirely.`
   - **Fix:** Annotate the field with `@Builder.Default`.
3. **Deprecated JWT APIs Warning**:
   - **File:** [JwtTokenProvider.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/security/JwtTokenProvider.java)
   - **Message:** Uses or overrides a deprecated API.
4. **Unsafe Operations Warning**:
   - **File:** [WeatherServiceImpl.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/service/weather/WeatherServiceImpl.java)
   - **Message:** Uses unchecked or unsafe operations (raw generic types).

---

## 3. Test Suite Executions (JUnit)

- **Total Tests Run**: 47
- **Total Successes**: 47
- **Failures / Errors**: 0
- **Time Elapsed**: ~6.40 seconds

### Verified Test Suites Breakdown:
- `com.smartkrishi.service.payment.PaymentServiceImplTest` (8/8 Passed)
- `com.smartkrishi.service.review.ReviewSystemTest` (7/7 Passed)
- `com.smartkrishi.service.SecurityBOLAIntegrationTest` (7/7 Passed)
- `com.smartkrishi.service.seller.SellerAnalyticsServiceTest` (2/2 Passed)
- `com.smartkrishi.service.seller.SellerListingServiceTest` (9/9 Passed)
- `com.smartkrishi.service.tracking.OrderTrackingServiceTest` (8/8 Passed)
- Other security/auth and controllers tests (6/6 Passed)

---

## 4. Release Audit & Package Readiness

The backend compiles into a bootable JAR: `backend/target/smart-krishi-backend-1.0.0.jar`. It includes all nested runtime dependencies packed inside `BOOT-INF/lib/` for direct deployment. The build is fully package-ready and qualified for production deployment.
