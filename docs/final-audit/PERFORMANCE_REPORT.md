# PHASE 6 — PERFORMANCE REPORT
> **Smart Krishi Marketplace — Final Pre-Production Audit**
> Auditor: Antigravity Performance Engineer
> Date: 2026-06-22
> Method: Static analysis — bundle analysis, dependency review, code pattern review, config analysis

---

## 1. FRONTEND PERFORMANCE

### 1.1 Bundle Size Analysis (Static Estimate)

| Chunk | Estimated Contributor | Size Risk |
|---|---|---|
| `vendor-core` | React 19, React DOM, React Router 7 | ~150KB gzipped — acceptable |
| `vendor-icons` | lucide-react (~560 icons available) | 🟡 MEDIUM — tree-shaking dependent |
| `vendor-motion` | framer-motion 12 | 🟡 MEDIUM — ~60KB gzipped |
| `vendor-maps` | @react-google-maps/api 2.20 | 🟡 MEDIUM — Maps SDK is loaded externally via CDN |
| `vendor-other` | axios, swiper, react-hot-toast, react-icons, AOS, tailwindcss | ⚠️ LARGE |

**HIGH RISK FILES (large component sizes):**

| File | Size | Risk |
|---|---|---|
| `MerchantDashboard.jsx` | **205,851 bytes** (~201KB raw) | 🔴 VERY LARGE — single file |
| `AdminPages.jsx` | 37,596 bytes | 🟡 MEDIUM |
| `SellerAnalyticsDashboard.jsx` | 30,653 bytes | 🟡 MEDIUM |
| `PaymentModal.jsx` | 29,108 bytes | 🟡 MEDIUM |
| `Dashboard.jsx` | 34,966 bytes | 🟡 MEDIUM |
| `Checkout.jsx` | 29,384 bytes | 🟡 MEDIUM |
| `AdminVerificationConsole.jsx` | 23,949 bytes | 🟡 LOW |

**`MerchantDashboard.jsx` at 200KB is a critical performance concern.** It should be split into multiple sub-components. This alone can cause a 1-2 second First Contentful Paint (FCP) delay on mobile networks.

### 1.2 Lazy Loading Assessment

| Route/Component | Lazy Loaded | Status |
|---|---|---|
| `ProfileSection` | ✅ `React.lazy()` | ✅ |
| `SellerApplication` | ✅ `React.lazy()` | ✅ |
| `OrdersHistory` | ✅ `React.lazy()` | ✅ |
| `MachineryRentals` | ✅ `React.lazy()` | ✅ |
| `MyReviews` | ✅ `React.lazy()` | ✅ |
| `Wishlist` | ✅ `React.lazy()` | ✅ |
| `Notifications` | ✅ `React.lazy()` | ✅ |
| `AddressBook` | ✅ `React.lazy()` | ✅ |
| `MerchantDashboard.jsx` | ❌ Not lazy loaded | 🔴 MISSING — 200KB always bundled |
| `AdminDashboardOverview.jsx` | ❌ Not lazy loaded | 🟡 MISSING — 18KB but large component |
| Admin pages (7 components) | ❌ Not lazy loaded | 🟡 MISSING |

### 1.3 Unused Dependencies

| Package | Listed In | Actual Usage | Status |
|---|---|---|---|
| `express` | `dependencies` | ❌ No usage found in frontend | 🔴 REMOVE — backend package in frontend |
| `cors` | `dependencies` | ❌ No usage found in frontend | 🔴 REMOVE — backend package in frontend |
| `nodemon` | `devDependencies` | ❌ No usage in Vite project | 🔴 REMOVE — backend dev tool |
| `aos` | `dependencies` | Needs verification | 🟡 CHECK |
| `swiper` | `dependencies` | Needs verification | 🟡 CHECK |
| `react-icons` | `dependencies` | Alongside `lucide-react` — duplicate icon libraries | 🟡 REVIEW |

**Critical:** `express` (5.2.1) included in frontend `dependencies`. Vite will attempt to bundle it if any module imports it. If Vite externalizes it, it still inflates `package.json` and confuses dependency auditing.

### 1.4 Code Splitting Configuration

| Configuration | Status |
|---|---|
| `manualChunks` defined in `vite.config.js` | ✅ |
| `chunkSizeWarningLimit: 600` | ✅ (increased from default 500KB) |
| Tree shaking for lucide-react | ✅ Vite handles this automatically |
| Source maps in production | Not configured — recommended to disable for performance |

### 1.5 Large Component Renders

| Issue | File | Risk |
|---|---|---|
| `MerchantDashboard.jsx` 200KB monolith | All seller operations in one file | 🔴 HIGH — huge bundle, slow parse |
| No React.memo or useMemo evidence in large components | Multiple files | 🟡 MEDIUM — potential unnecessary re-renders |
| `window.innerWidth` read in render without debounce | `App.jsx` L84 | 🟡 MEDIUM — layout thrashing |

---

## 2. BACKEND PERFORMANCE

### 2.1 Database Configuration

| Setting | Value | Assessment |
|---|---|---|
| HikariCP max pool size (prod) | 20 | ✅ Adequate for moderate traffic |
| HikariCP min idle (prod) | 10 | ✅ Keeps connections warm |
| Batch insert size | 20 | ✅ Reduces database round trips |
| Batch update ordering | `order_inserts: true`, `order_updates: true` | ✅ Optimizes batch sequences |
| `open-in-view` | `false` | ✅ Critical — prevents database connection leaks per request |
| Fetch size | 50 | ✅ Reasonable |
| Connection timeout | 30,000ms | ✅ |
| Idle timeout | 600,000ms (10 min) | ✅ |
| Max lifetime | 1,800,000ms (30 min) | ✅ |
| Leak detection threshold | 60,000ms (1 min) | ✅ Catches connection leaks |

### 2.2 N+1 Query Analysis

| Risk Area | Status | Notes |
|---|---|---|
| Product with images | 🟡 POTENTIAL | Products have `OneToMany` images — no `@EntityGraph` or join fetch visible in controllers reviewed |
| Orders with order items | 🟡 POTENTIAL | Orders reference items — verify `@EntityGraph` or fetch joins in `OrderService` |
| Seller profile with products | 🟡 POTENTIAL | If `seller.getProducts()` is called in a list, N+1 risk |
| Batch fetch size configured | ✅ `fetch_size: 50` | Mitigates N+1 partially |
| HikariCP batch optimization | ✅ `rewriteBatchedStatements: true` | Database URL in `application.yml` — reduces network overhead |

**Note:** Without reviewing every `@Repository` and `@Service` method, N+1 cannot be definitively ruled out. The presence of `fetch_size` and batch settings mitigates worst-case scenarios.

### 2.3 Caching Configuration

| Profile | Cache Type | Configuration |
|---|---|---|
| Dev | `simple` | In-memory cache — names: `products, categories, sellers` |
| Prod | `redis` | Redis required — TTL: 3,600,000ms (1 hour) |

> ⚠️ **WARNING:** Production profile requires Redis. If Redis is not running/configured, Spring Boot will fail to start. This is a **deployment blocker** if Redis is not provisioned.

**Caching strategy is sound:** caching products, categories, and sellers reduces database load on high-frequency reads. Redis TTL of 1 hour is appropriate for marketplace data.

### 2.4 Memory Leaks Assessment

| Risk | Evidence | Status |
|---|---|---|
| Connection pool leak detection | `leak-detection-threshold: 60000` in prod | ✅ Enabled |
| `open-in-view: false` | Prevents JPA session held across entire HTTP request lifecycle | ✅ GOOD |
| Async configuration | `AsyncConfig.java` present | ✅ Thread pool configured |
| WebSocket session management | `WebSocketConfig.java` present | ✅ |
| Large file uploads | 10MB max configured | ✅ |
| Logs rotation | `max-size: 50MB`, `max-history: 90`, `total-size-cap: 5GB` in prod | ✅ |

### 2.5 Build Warnings (Static Review)

| Warning | Location | Severity |
|---|---|---|
| `SignatureAlgorithm.HS512` deprecated in newer JJWT | `JwtTokenProvider.java` — uses `SignatureAlgorithm.HS512` | 🟡 LOW — deprecation, not breakage |
| `application.yml` uses non-env-wrapped datasource URL | Line 9, `application.yml` | 🟡 MEDIUM |
| H2 in-memory database bundled for runtime | `pom.xml` — `<scope>runtime</scope>` for H2 | 🟡 LOW — adds ~1.5MB to JAR |

### 2.6 Indexing Analysis

No direct access to database schema (`db/migration`) was possible for this review. However, based on entity patterns:

| Table | Expected Index | Risk |
|---|---|---|
| `users` | `email` UNIQUE index | Critical for login queries |
| `products` | `seller_id`, `category_id`, `product_status` | High frequency filter |
| `orders` | `buyer_id`, `seller_id`, `order_status` | High frequency filter |
| `cart_items` | `user_id`, `product_id` | High frequency |
| `reviews` | `product_id`, `user_id` | Aggregate queries |

> **Recommendation:** Verify Flyway migration scripts include proper indexes for all foreign key columns and frequently-queried fields.

---

## 3. PERFORMANCE SUMMARY

| Category | Score | Notes |
|---|---|---|
| Frontend bundle splitting | 7/10 | Manual chunks configured; MerchantDashboard not lazy-loaded |
| Lazy loading | 6/10 | Account sub-pages lazy; admin/merchant pages not |
| Dependency bloat | 5/10 | Express, cors, nodemon should be removed |
| Large component size | 4/10 | MerchantDashboard 200KB is a red flag |
| Backend HikariCP config | 9/10 | Well-configured for production |
| Backend caching | 8/10 | Redis in prod, simple in dev — correct approach |
| Database batch optimization | 9/10 | Batch statements, fetch size configured |
| N+1 risk | 7/10 | Cannot fully assess without service layer review |
| Memory management | 8/10 | open-in-view false, leak detection enabled |
| Build configuration | 7/10 | JVM tuning in Docker ENTRYPOINT |

**Overall Performance Score: 7/10**

---

## PERFORMANCE RECOMMENDATIONS

### Critical
1. **Split `MerchantDashboard.jsx`** into sub-components (ShopSetup, ProductForm, OrderManagement, etc.) and lazy-load each
2. **Remove `express` and `cors`** from `frontend/package.json` dependencies

### High Priority
3. **Lazy-load Admin pages** — wrap AdminPages components in `React.lazy()`
4. **Set Redis host** in production deployment — required for production cache
5. **Verify database indexes** in Flyway migration scripts

### Medium Priority
6. Remove `nodemon` from frontend devDependencies
7. Audit `react-icons` vs `lucide-react` — consolidate to one icon library
8. Add `React.memo` to heavy list components (product cards, order lists)
9. Debounce `window.resize` handler in `App.jsx`

---

*Report generated: 2026-06-22 | Audit Version: 1.0.0-FINAL*
