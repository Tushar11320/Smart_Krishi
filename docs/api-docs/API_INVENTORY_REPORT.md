# Smart Krishi Marketplace - API Inventory and Credential Audit

**Audit date:** 22 June 2026  
**Scope:** Entire available repository and workspace configuration, including frontend, backend, local ignored environment files, tracked/generated configuration, deployment files, dependencies, webhooks, and Git path history  
**Safety rule:** No credential value is reproduced in this report. Presence means only that a non-placeholder value was detected; it does not validate ownership, correctness, restrictions, activity, or production deployment.

## Executive Summary

| Metric | Result |
|---|---:|
| Total API/integration families found | **14** |
| Credential/configuration slots audited | **12** |
| Non-placeholder slots present locally | **6** |
| Missing, placeholder, or unsafe-default slots locally | **6** |
| Credentials verified in Vercel/Render production | **0 of 12** |
| Production-ready integration families | **2 of 14** |
| Production Readiness | **14%** |
| Backend HTTP mapping annotations | **259 across 31 controllers** |
| Frontend internal API call sites | **194** |
| Inbound third-party webhooks | **1 Razorpay endpoint** |

**Overall result: NOT READY FOR PRODUCTION.** The code contains broad API implementations, but production credentials and live provider configuration cannot be verified from the workspace. Server-side credentials are stored in ignored frontend environment files, the production Spring profile is ignored/untracked, SMTP properties are bound under the wrong namespace in the tracked base configuration, and credentials may remain exposed in Git history.

### Counting Method

- The 14 families include internal REST, WebSocket, OpenWeather, five distinct Google capabilities, Razorpay, Cloudinary, SMTP, JWT, MySQL, and OpenAPI. The external Unsplash image fallback is documented separately and is not included in the count.
- The 12 credential/configuration slots counted as "keys" are: `VITE_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_API_KEY`, `OPENWEATHER_API_KEY`, three Razorpay variables, three Cloudinary variables, two SMTP identity/credential variables, and `JWT_SECRET`.
- Six non-placeholder values were detected only in ignored local frontend environment files: two Google slots, OpenWeather, and three Cloudinary slots. This is **not** production readiness and is an incorrect location for server secrets.
- All 12 production values remain unverified because this audit has no access to Vercel, Render, database, or provider dashboards.
- The 14% readiness result is a strict binary code/configuration assessment. Only the internal REST surface and OpenAPI generation meet their basic implementation criteria; neither result proves a live deployment. All credentialed integrations fail production verification.

## Scope and Scan Evidence

### Scanned

- `frontend/src/`, including services, pages, components, context, data, and utilities.
- All backend controllers, services, repositories, configurations, security classes, WebSocket handlers, entities, DTOs, and tests.
- `application.yml`, local `application-dev.yml`, `application-local.yml`, ignored local `application-prod.yml`, and tracked generated profile resources.
- Frontend `.env`, `.env.development`, `.env.example`, Vite configuration, and Vercel configuration.
- Maven and npm manifests/lock data, Dockerfile, Git ignore rules, Git path history, deployment documentation, and GitHub configuration.

### Not Found or Not Verifiable

- No root/backend `.env` file.
- No Render Blueprint (`render.yaml` or `render.yml`).
- No `.github/workflows` CI/CD workflows.
- No production dashboard export or proof of Render/Vercel variables.
- No confirmed live frontend URL, backend URL, webhook delivery, provider ownership, quotas, billing, or API restrictions.
- No current Git-tracked `.env.example`; a local ignored example exists.

## Credential Status Definitions

| Status | Meaning |
|---|---|
| **Yes - local only** | A non-placeholder value was detected locally without printing it. It is not proof of production configuration. |
| **No - placeholder/default** | Only an empty, example, simulated, local, or unsafe hardcoded default exists. |
| **No - not found** | No usable value was detected in scanned files. |
| **Unknown - provider** | Value might exist in Vercel/Render/provider dashboard, but dashboard access was not available. |

## API Inventory

| # | API / Integration | Purpose | Frontend Usage Path | Backend Usage Path | Configuration Path | Environment Variable(s) | Key Present? | Production Ready? | Missing Configuration / Finding | Dependency Risk |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | Smart Krishi REST API | Browser-to-backend marketplace API | `frontend/src/services/api.js`; 194 call sites across pages/components/services | 31 classes under `backend/src/main/java/com/smartkrishi/controller/` | `frontend/src/services/api.js`, Vercel variables | `VITE_API_BASE_URL` | **No - local URL only** | **Yes, code-level only** | Production HTTPS API URL ending in `/api` is not verified; CORS origin must match | **High** |
| 2 | Smart Krishi WebSocket API | Live order tracking and in-app notifications | `frontend/src/Pages/OrderTracking.jsx`, `frontend/src/components/Topbar.jsx` | `websocket/TrackingWebSocketHandler.java`, `websocket/NotificationWebSocketHandler.java`, `config/WebSocketConfig.java` | Derived from `VITE_API_BASE_URL` | `VITE_API_BASE_URL` | **No - local URL only** | **No** | Production WSS/proxy behavior untested; `/ws/**` is publicly permitted and handler-level identity/authentication requires security review | **High** |
| 3 | OpenWeather REST API | Current weather, 5-day forecast, rain probability, and air pollution/AQI | `frontend/src/services/WeatherService.js`; weather pages/cards | `service/weather/WeatherServiceImpl.java`, `controller/WeatherController.java` | `application.yml`, ignored local profiles | `OPENWEATHER_API_KEY` | **Yes - local frontend file only** | **No** | Move value to Render; rotate; validate plan/quota. Backend places the key in query strings but masks it in its own request log | **High** |
| 4 | Google Maps JavaScript API | Browser map rendering | Map provider/component, location picker, route/farm/seller map pages | None for browser rendering | `frontend/src/components/MapProvider.jsx` | `VITE_GOOGLE_MAPS_API_KEY` | **Yes - local only** | **No** | Configure Vercel and restrict key to exact HTTPS referrers and only required browser APIs | **High** |
| 5 | Google Places API | Browser address autocomplete/place selection | `frontend/src/components/MapProvider.jsx`, `AddressAutocomplete.jsx`, location components | None | `MapProvider.jsx`; Google Cloud API enablement | `VITE_GOOGLE_MAPS_API_KEY` | **Yes - local only** | **No** | Places library is requested; Places API enablement, billing, quota, consent, and referrer restrictions are unverified | **High** |
| 6 | Google Drawing and Geometry Libraries | Farm boundary drawing and map geometry calculations | `MapProvider.jsx`, `FarmBoundaryMap.jsx`, map/location components | None | `MapProvider.jsx`; Google Cloud project | `VITE_GOOGLE_MAPS_API_KEY` | **Yes - local only** | **No** | Browser key restrictions and enabled libraries are not verified; farm-boundary persistence contains mock/local behavior | **Medium** |
| 7 | Google Geocoding API | Forward and reverse geocoding | `frontend/src/services/MapsService.js` calls `/maps/geocode` and `/maps/reverse-geocode` | `service/maps/GoogleMapsServiceImpl.java`, `controller/LocationController.java` | `application.yml`, ignored local profiles | `GOOGLE_MAPS_API_KEY` | **Yes - wrong local location** | **No** | Move to Render and use a server/IP-restricted key. Missing/error states silently return approximate fallback coordinates/addresses | **High** |
| 8 | Google Directions API | Route distance, duration, and polyline | `MapsService.js`, `RouteMap.jsx`, tracking/location views | `GoogleMapsServiceImpl.calculateDistance()` | `application.yml`, ignored local profiles | `GOOGLE_MAPS_API_KEY` | **Yes - wrong local location** | **No** | API enablement/billing/key restrictions unverified; fallback is a Haversine estimate with assumed overhead/speed, not an actual route | **High** |
| 9 | Razorpay Checkout, Java SDK, and Webhook | Online order creation, hosted checkout, signature verification, payment events, and refunds | `frontend/src/components/PaymentModal.jsx` dynamically loads `https://checkout.razorpay.com/v1/checkout.js` and calls `/payments` endpoints | `service/payment/PaymentServiceImpl.java`, `controller/PaymentController.java` | `application.yml`; Maven `razorpay-java`; Razorpay dashboard | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | **No - placeholders only** | **No** | Configure Render/live account; configure signed webhook at `/api/payments/webhook`; perform live/test-mode UAT, refund/replay/idempotency/reconciliation tests; review dynamic script CSP/supply-chain controls | **Critical** |
| 10 | Cloudinary API / Java SDK | Upload, update, delete, transform, and deliver listing images | `frontend/src/components/ImageUpload.jsx` posts multipart data to backend | `service/image/CloudinaryServiceImpl.java`, `config/CloudinaryConfig.java`, image/upload controllers | `application.yml`; Maven Cloudinary SDK | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | **Yes - local frontend file only** | **No** | Remove server credentials from frontend directory, rotate, store in Render. Validate resource type/MIME content, quotas, deletion authorization, and log redaction | **Critical** |
| 11 | SMTP / Jakarta Mail | Transactional email notifications | No direct SMTP use; notification pages/preferences call backend | `service/notification/EmailServiceImpl.java`, `NotificationServiceImpl.java` | Tracked `application.yml`, ignored profiles, Spring Mail starter | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | **No - identity/password placeholders** | **No** | Tracked YAML uses `mail.smtp.*`, while Spring Boot and service use `spring.mail.*`; correct binding, provider/sender/domain verification, TLS, SPF/DKIM/DMARC, bounce handling required | **High** |
| 12 | JWT / JJWT | Stateless authentication, role claims, access and refresh tokens | `frontend/src/services/api.js` reads `localStorage` and sets `Authorization: Bearer` | `security/JwtTokenProvider.java`, `JwtAuthenticationFilter.java`, `SecurityConfig.java`, auth services/controllers | `application.yml`; Maven JJWT dependencies | `JWT_SECRET` | **No - unsafe default only** | **No** | Replace hardcoded default; rotate historical values; enforce environment-specific secret. Tokens in `localStorage`, 24-hour access lifetime, no evident revocation, and verbose token error logs require hardening | **Critical** |
| 13 | MySQL / JDBC | Persistent marketplace, users, orders, payments, weather cache, and audit data | Accessed indirectly through REST | JPA repositories, entities, `config/DatabaseConfig.java` | base/local profile YAML, ignored production profile, Flyway migration | `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` (plus conflicting `DB_PASSWORD`) | **No - production credentials unverified** | **No** | Production profile ignored; URL/user/password naming conflicts; MySQL driver cannot support the PostgreSQL branch in `DatabaseConfig`; Flyway is disabled while Hibernate uses `ddl-auto: update` | **Critical** |
| 14 | OpenAPI / Swagger UI | Generates API contract and interactive documentation | Browser may access `/swagger-ui.html` | `SmartKrishiApplication.java`, `config/OpenApiConfig.java`, Springdoc | `application.yml`, Maven Springdoc dependency | None | **N/A** | **Yes, code-level only** | Swagger and API docs are publicly permitted. Disable or access-control them in production; validate that generated docs match all 259 mappings | **Medium** |

### External Resource Not Counted as a Credentialed API

`frontend/src/services/api.js` uses an Unsplash image URL as a default product image. This is an unowned external CDN dependency with no key. Availability, content stability, privacy/referrer behavior, and terms are outside client control. Replace it with a client-owned static fallback asset for production.

## Integration Detail and Risk Findings

### 1. Internal REST API

- Axios base URL is `VITE_API_BASE_URL` with `http://localhost:8080/api` fallback.
- Bearer tokens are added from browser `localStorage`.
- The frontend contains 194 Axios call sites; the backend contains 259 mapping annotations across 31 controllers.
- Production URL, TLS, CORS, timeout behavior, error telemetry, rate limiting, and live endpoint compatibility are not verified.
- There is no generated/committed client contract or frontend/backend contract test.

### 2. WebSocket API

- Tracking and notification clients derive WebSocket URLs from the API base.
- Backend permits `/ws/**` without Spring Security authentication.
- Before production, bind a connection to the authenticated principal rather than trusting a client-supplied user/order identifier, and test cross-user subscription attempts.
- In-memory handler/session state needs a shared broker or sticky/session-aware design before horizontal scaling.

### 3. OpenWeather

- Backend calls `/weather`, `/forecast`, and `/air_pollution` through `RestTemplate`.
- A 30-minute database cache and retry/backoff exist.
- The key is included as an `appid` query parameter. Application logging masks `appid`, but proxy/platform access logs must also be reviewed.
- A non-placeholder key is stored in ignored frontend environment files even though only the backend consumes it. Rotate and move it to Render.

### 4. Google Platform

- Browser loader requests `places`, `drawing`, and `geometry` libraries.
- Backend directly calls Google Geocoding and Directions REST endpoints.
- One local browser key and one local server variable are present, but provider restrictions and whether they are distinct keys are unknown.
- The backend falls back to fixed/estimated data when no key, rate limit, or provider error occurs. Production UI must clearly distinguish estimates from provider results.
- Use separate browser and server keys, separate staging/production projects where feasible, exact referrer/IP restrictions, API allowlists, quotas, budgets, and alerts.

### 5. Razorpay

- Frontend dynamically injects Razorpay Checkout rather than using an npm SDK.
- Backend uses `razorpay-java` to create gateway orders and refunds and `Utils` to verify checkout/webhook HMAC signatures.
- `/api/payments/webhook` is intentionally public and relies on signature verification.
- Development supports simulated IDs/signatures; production profile checks attempt to reject placeholder credentials and mock signatures.
- No usable keys were found. Live webhook URL, account mode, KYC, settlement account, allowed origins, refund permissions, and reconciliation are unverified.
- The webhook currently logs the signature value. Treat this as sensitive logging and remove/redact before production.

### 6. Cloudinary

- Server-side Java SDK uploads to `smartkrishi/products`, requires HTTPS delivery, validates extension and 10 MB size, and supports delete/update.
- Extension checking alone does not verify decoded MIME/content safety. Add content-type/magic-byte verification and image re-encoding/scanning policy.
- Upload success logs the full Cloudinary secure URL and public ID. Confirm those values contain no sensitive/private media identifiers.
- Non-placeholder Cloudinary server credentials reside under `frontend/`. They are not prefixed `VITE_` and therefore are not normally exposed by Vite, but the location is still unsafe and operationally wrong.

### 7. SMTP

- `EmailServiceImpl` injects `spring.mail.username` and uses Spring's `JavaMailSender`.
- Tracked base configuration defines `mail.smtp.*`, not `spring.mail.*`; this does not configure Spring Boot mail auto-configuration.
- The service simulates delivery when configuration is missing and catches provider failures, so workflows can appear successful without email delivery.
- Notification logging includes recipient and message content; classify and redact personal data.

### 8. JWT

- HS512-signed access and refresh JWTs are implemented.
- Access lifetime is 24 hours; refresh lifetime is 7 days.
- Base config contains a hardcoded default signing secret, which undermines environment isolation if production mappings fail.
- Browser storage is accessible to JavaScript, increasing XSS impact.
- No clear token revocation/denylist or signing-key version strategy was found.

### 9. MySQL

- Runtime and Maven dependencies implement MySQL 8.
- `DatabaseConfig` also parses `postgres://`, but the PostgreSQL JDBC driver is absent. That branch will fail at runtime and should not be treated as provider support.
- `application-prod.yml` exists locally but is ignored/untracked; Git-based Render builds will not receive it.
- A generated `backend/target/classes/application-prod.yml` remains Git-tracked, which is a build-artifact/configuration leakage risk.
- Production migration behavior is contradictory: Flyway is disabled in tracked base configuration while Hibernate `ddl-auto` is `update`.

## Third-Party SDK and Client Inventory

| Dependency / Client | Location | Role | Credential | Risk |
|---|---|---|---|---|
| `@react-google-maps/api` | `frontend/package.json` | Loads Google Maps JavaScript and libraries | `VITE_GOOGLE_MAPS_API_KEY` | High: browser key exposure is expected but must be restricted |
| Axios | `frontend/package.json`, `frontend/src/services/api.js` | Internal REST client and upload requests | JWT bearer token | High: localStorage token and broad call surface |
| Razorpay Checkout script | Runtime URL in `PaymentModal.jsx` | Hosted payment UI | Backend-returned key ID/order | Critical: dynamic third-party executable, payment integrity |
| `razorpay-java` 1.4.4 | `backend/pom.xml` | Orders, signatures, webhook verification, refunds | Three Razorpay variables | Critical |
| Cloudinary Java SDK 1.38.0 | `backend/pom.xml` | Media upload/delete | Three Cloudinary variables | Critical |
| Spring `RestTemplate` | Weather/maps services | OpenWeather and Google REST calls | Weather/Maps keys | High: URL query keys and fallback behavior |
| Spring Mail / Jakarta Mail | `backend/pom.xml` | SMTP email | SMTP identity/password | High: misconfiguration and silent simulation |
| JJWT 0.12.3 | `backend/pom.xml` | JWT signing/parsing | `JWT_SECRET` | Critical |
| MySQL Connector 8.0.33 | `backend/pom.xml` | JDBC database connection | Database credentials | Critical |
| Springdoc OpenAPI 2.4.0 | `backend/pom.xml` | API documentation | None | Medium: public production exposure |
| Browser Geolocation API | Location/map pages | Device coordinates | User permission, no key | High privacy risk; consent and retention required |
| Browser WebSocket API | Tracking/Topbar | Live tracking/notifications | Derived API URL/JWT design | High authorization risk |
| Service Worker / PWA APIs | `frontend/public/sw.js`, `App.jsx` | Offline/cache/install behavior | None | Medium: stale API/assets and privacy/cache review |

Versions above are the versions declared in manifests, not a statement that they are current or vulnerability-free. Add automated dependency scanning and review vendor advisories before launch.

## Webhook Inventory

| Provider | Direction | Endpoint | Authentication | Events Observed | Production Status |
|---|---|---|---|---|---|
| Razorpay | Inbound | `POST /api/payments/webhook` | `X-Razorpay-Signature` HMAC using `RAZORPAY_WEBHOOK_SECRET` | Payment captured, payment failed, refund processed | **Not ready:** secret absent, dashboard URL unverified, live delivery/replay tests absent, signature is logged |

No outbound webhook framework or additional inbound third-party webhook was found.

## MISSING API KEYS

This section uses **required deployment location**, not merely file presence. Every production credential is treated as missing until the hosting/provider dashboard is verified.

| API / Service | Variable Name | Required Location | Current Finding | Impact if Missing |
|---|---|---|---|---|
| Smart Krishi API | `VITE_API_BASE_URL` | Vercel Production/Preview settings | Only local development URL detected | Frontend calls localhost or wrong backend; all marketplace operations fail |
| Google Maps JavaScript/Places | `VITE_GOOGLE_MAPS_API_KEY` | Vercel Production/Preview settings | Non-placeholder local value only | Maps, autocomplete, drawing, and geometry fail to load |
| Google Geocoding/Directions | `GOOGLE_MAPS_API_KEY` | Render environment | Non-placeholder value wrongly stored under frontend | Backend returns approximate fallbacks instead of authoritative geocode/routes |
| OpenWeather | `OPENWEATHER_API_KEY` | Render environment | Non-placeholder value wrongly stored under frontend | Weather, forecast, rain, and AQI calls fail; cache cannot refresh |
| Razorpay | `RAZORPAY_KEY_ID` | Render environment | Placeholder only | Gateway order/checkout initialization fails |
| Razorpay | `RAZORPAY_KEY_SECRET` | Render secret environment | Placeholder only | Server cannot securely create/verify payment operations |
| Razorpay | `RAZORPAY_WEBHOOK_SECRET` | Render secret environment and matching Razorpay dashboard webhook | Placeholder only | Webhooks cannot be authenticated; payment/refund state becomes unreliable |
| Cloudinary | `CLOUDINARY_CLOUD_NAME` | Render environment | Non-placeholder value wrongly stored under frontend | Backend cannot address the correct media tenant |
| Cloudinary | `CLOUDINARY_API_KEY` | Render environment | Non-placeholder value wrongly stored under frontend | Upload/delete API authentication fails |
| Cloudinary | `CLOUDINARY_API_SECRET` | Render secret environment | Non-placeholder value wrongly stored under frontend | Upload/delete API authentication fails; exposed value permits account abuse |
| SMTP | `MAIL_USERNAME` | Render secret/environment; mapped to `spring.mail.username` | Placeholder only and namespace mismatch | Email is simulated or rejected |
| SMTP | `MAIL_PASSWORD` | Render secret environment; mapped to `spring.mail.password` | Placeholder only and namespace mismatch | SMTP authentication fails |
| JWT | `JWT_SECRET` | Render secret environment | Unsafe hardcoded default only | Predictable/shared signing key can enable token forgery or cross-environment trust |
| MySQL | `DATABASE_URL` | Render secret environment | Production value not verified; ignored profile | Backend cannot connect to production DB or falls back locally |
| MySQL | `DATABASE_USERNAME` | Render secret environment | Production value not verified | Database authentication fails or unsafe default account is used |
| MySQL | `DATABASE_PASSWORD` | Render secret environment | Production value not verified; conflicting `DB_PASSWORD` name | Database authentication fails or wrong value is consumed |

## Environment Checklist

### Required Vercel Variables

- [ ] `VITE_API_BASE_URL` - production HTTPS backend URL ending in `/api`.
- [ ] `VITE_GOOGLE_MAPS_API_KEY` - browser key restricted to exact production/preview referrers and enabled browser APIs.
- [ ] Confirm no Cloudinary secret, weather key, backend Google key, Razorpay secret, JWT secret, SMTP secret, or database credential exists in Vercel/frontend variables.
- [ ] Trigger a clean rebuild after variable changes; Vite injects values at build time.

### Required Render Variables

- [ ] `SPRING_PROFILES_ACTIVE`
- [ ] `PORT`
- [ ] `DATABASE_URL`
- [ ] `DATABASE_USERNAME`
- [ ] `DATABASE_PASSWORD`
- [ ] `JWT_SECRET`
- [ ] `CORS_ALLOWED_ORIGINS`
- [ ] `APP_BASE_URL`
- [ ] `FRONTEND_URL`
- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `OPENWEATHER_API_KEY`
- [ ] `GOOGLE_MAPS_API_KEY`
- [ ] `MAIL_HOST`
- [ ] `MAIL_PORT`
- [ ] `MAIL_USERNAME`
- [ ] `MAIL_PASSWORD`
- [ ] Resolve whether `DB_PASSWORD` remains needed; standardize on one database variable contract.

Conditional Redis names are present in the ignored local production profile (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`), but the Maven project has no Redis starter. Do not provision or claim Redis support until implementation and deployment configuration agree.

### Required Database Variables

- [ ] `DATABASE_URL` - supported MySQL JDBC URL or a documented normalized provider URL.
- [ ] `DATABASE_USERNAME` - least-privilege application account.
- [ ] `DATABASE_PASSWORD` - unique production secret.
- [ ] Remove/resolve `DB_PASSWORD` compatibility naming.
- [ ] Require TLS and validate CA/certificate policy.
- [ ] Confirm MySQL only unless a PostgreSQL driver and dialect/migrations are deliberately added.
- [ ] Resolve Flyway disabled versus Hibernate `ddl-auto: update` before launch.

### Required Payment Variables

- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] Dashboard webhook configured to the production HTTPS `/api/payments/webhook` endpoint.
- [ ] Live/test keys never mixed; KYC, settlements, refund rights, webhook events, and reconciliation verified.

### Required Cloudinary Variables

- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] Rotate local frontend-stored credentials and move them to Render.
- [ ] Confirm folder policy, signed operations, quotas, deletion authorization, backup/retention, and allowed content types.

### Required Weather Variables

- [ ] `OPENWEATHER_API_KEY`
- [ ] Move/rotate local frontend-stored key into Render.
- [ ] Confirm Current Weather, 5 Day Forecast, and Air Pollution product/API access.
- [ ] Configure quota and billing alerts; verify cache behavior during outage/quota exhaustion.

### Required Google Variables

- [ ] `VITE_GOOGLE_MAPS_API_KEY` in Vercel with HTTP-referrer restrictions.
- [ ] `GOOGLE_MAPS_API_KEY` in Render with server/IP restrictions.
- [ ] Enable only Maps JavaScript, Places, Geocoding, and Directions capabilities actually used.
- [ ] Configure budgets/quotas and separate staging/production keys.

### Required SMTP Variables

- [ ] `MAIL_HOST`
- [ ] `MAIL_PORT`
- [ ] `MAIL_USERNAME`
- [ ] `MAIL_PASSWORD`
- [ ] Map them under `spring.mail.*`, enable authenticated TLS, and verify sender identity plus SPF/DKIM/DMARC.

## Credential and Configuration Security Findings

### Critical

1. **Server credentials in frontend environment files.** Non-placeholder Cloudinary secret material, OpenWeather, and backend Google variables are stored in ignored `frontend/.env` and `frontend/.env.development`. Non-`VITE_` values are not normally bundled, but this is the wrong trust boundary, creates developer-machine exposure, and does not configure Render. Rotate and relocate all of them.
2. **Production configuration existed in Git history.** `backend/src/main/resources/application-prod.yml` has multiple historical commits and was later untracked explicitly to protect credentials. Deletion does not remove historical contents. Review history, rotate every credential ever present, and use an approved history-remediation process if the repository exposure warrants it.
3. **Generated production config remains tracked.** `backend/target/classes/application-prod.yml` is currently Git-tracked and has extensive history. Build outputs must not be source-controlled; inspect its history for secrets and rotate affected values. This report does not modify it.
4. **Unsafe JWT fallback.** The tracked base configuration supplies a hardcoded signing secret if `JWT_SECRET` is absent. A production mapping failure can silently activate a known/shared secret.
5. **Razorpay production secrets absent.** Online payment cannot be considered safe or operational; development simulation paths exist.

### High

1. **Ignored production profile breaks reproducible deployment.** Render builds from Git will not receive local `application-prod.yml`.
2. **SMTP namespace mismatch.** `mail.smtp.*` does not satisfy Spring Boot `spring.mail.*` and `EmailServiceImpl` reads `spring.mail.username`.
3. **Database configuration conflict.** Base YAML fixes local URL/user and `DB_PASSWORD`, while production guidance/profile names `DATABASE_*`. `DatabaseConfig` partially bypasses Spring properties by reading `System.getenv` directly.
4. **False PostgreSQL support.** `DatabaseConfig` accepts a PostgreSQL URL, but no PostgreSQL JDBC driver or PostgreSQL-specific schema/dialect path is installed.
5. **Google fallbacks can mask outage/misconfiguration.** Approximate coordinates/routes may look valid to users.
6. **Public WebSockets require authorization review.** `/ws/**` is permitted by Spring Security.
7. **Sensitive logging.** Razorpay webhook signatures, notification recipient/content, and Cloudinary URLs/public IDs are logged. Production logs must redact secrets and personal data.
8. **No CI/security automation.** No GitHub workflow verifies builds, tests, secret scanning, dependency vulnerabilities, or configuration drift.

### Medium

1. Swagger/OpenAPI is public in security configuration.
2. JWTs are stored in browser `localStorage`; XSS can steal them.
3. Dynamic Razorpay script loading has no documented CSP or supply-chain policy.
4. Cloudinary validates extension/size rather than decoded content.
5. Unowned Unsplash fallback creates external availability/privacy dependency.
6. Local `.env.example` is ignored rather than maintained as a safe tracked contract.

## Deployment Blockers

1. Rotate all non-placeholder credentials currently stored under `frontend/` and any value ever committed in production/generated configuration history.
2. Remove server credentials from the frontend trust boundary and configure them in Render's secret store.
3. Deliver a tracked, secret-free production Spring configuration contract; do not depend on ignored `application-prod.yml`.
4. Stop tracking generated `backend/target/` artifacts after reviewing their history for sensitive values.
5. Replace the JWT default with mandatory production environment configuration and rotate the signing key.
6. Configure and prove the Vercel API base and browser Google key restrictions.
7. Configure Razorpay credentials and dashboard webhook; pass create/success/failure/refund/replay/idempotency/reconciliation UAT.
8. Correct Spring Mail property binding and prove authenticated TLS delivery and domain authentication.
9. Standardize database variables, support only an installed database driver, enforce TLS, and resolve Flyway/Hibernate migration policy.
10. Authenticate/authorize WebSocket subscriptions and test cross-user/order access.
11. Add production log redaction, protected Swagger/Actuator exposure, rate limits, monitoring, and alerts.
12. Add CI with build/test, secret scanning, dependency scanning, and configuration validation.

## Recommended Credential Rotation Order

1. Cloudinary API secret/key and Google/OpenWeather keys found in frontend files.
2. Every database credential and JWT secret found in current or historical production/generated files.
3. Razorpay and webhook credentials if they were ever supplied outside the current workspace.
4. SMTP password/app token.
5. Rebuild/redeploy staging, validate each provider, then production; revoke old credentials only after successful cutover.

Record only credential identifier/fingerprint, owner, rotation date, approver, environments, and validation result. Never record the value in Git, tickets, or this report.

## Production Verification Gate

The readiness percentage may be recalculated only after evidence is attached for all applicable items:

- [ ] Vercel production variable names and masked status exported.
- [ ] Render production variable names and masked status exported.
- [ ] Provider account owner, billing owner, recovery admins, and MFA confirmed.
- [ ] API restrictions, allowlists, quotas, budgets, and alerts confirmed.
- [ ] Frontend/API/WSS URLs pass TLS, CORS, auth, and role smoke tests.
- [ ] OpenWeather, Maps, Places, Geocoding, Directions, Cloudinary, and SMTP production-like staging tests pass.
- [ ] Razorpay signed checkout, webhook, refund, duplicate, and reconciliation tests pass.
- [ ] JWT rotation and forced reauthentication procedure tested.
- [ ] Database backup/restore and migration procedure tested.
- [ ] Secret-history review and credential rotation completed.
- [ ] No critical/high secret, dependency, or authorization finding remains open.

## Final Assessment

The project has substantial API code and good breadth, but configuration provenance is not production-safe. The most important distinction is that **six keys are present locally, but zero are verified in their required production hosting locations**. Several of those local values are server credentials placed under the frontend directory, which increases exposure while failing to configure the backend.

**Production Readiness: 14%.**  
**Recommendation: NO-GO until every deployment blocker is closed and provider-dashboard evidence is reviewed.**

## Google OAuth and Email OTP Verification API Reference

### 1. Google OAuth API
- **Purpose**: Authenticate users using Google Identity Services (GIS). Handles both new user signup and linking existing local accounts by email.
- **Configuration Path**: `backend/src/main/resources/application.yml` and `backend/src/main/resources/application-dev.yml` under `google.client-id`
- **Environment Variables**:
  - `GOOGLE_CLIENT_ID`: Google Developer Console client ID.
  - `GOOGLE_CLIENT_SECRET`: Google Developer Console client secret.
- **Frontend Usage**:
  - Script load in `frontend/index.html`
  - Login/Register buttons and GIS callback handling in `frontend/src/Pages/Account.jsx` (POST `/api/auth/google` with ID token)
- **Backend Usage**:
  - `com.smartkrishi.controller.AuthController.googleLogin()`
  - `com.smartkrishi.service.auth.AuthServiceImpl.googleLogin()` (validates ID token, registers new users automatically or links Google identity to existing local email)

### 2. Email OTP Verification API
- **Purpose**: Expose OTP-based account activation during registration and resending verification codes.
- **Configuration Path**: `backend/src/main/resources/application.yml` and `backend/src/main/resources/application-dev.yml` under `spring.mail.*`
- **Environment Variables**:
  - `MAIL_HOST`: SMTP server host (e.g. `smtp.gmail.com`).
  - `MAIL_PORT`: SMTP server port (e.g. `587`).
  - `MAIL_USERNAME`: SMTP authenticated username.
  - `MAIL_PASSWORD`: SMTP authenticated password / app password.
- **Frontend Usage**:
  - `frontend/src/Pages/Account.jsx` (OTP entry screen, countdown timer, and calls to verify and resend APIs)
- **Backend Usage**:
  - `com.smartkrishi.controller.AuthController.verifyOtp()` and `resendOtp()`
  - `com.smartkrishi.service.auth.AuthServiceImpl.verifyOtp()` and `resendOtp()` (implements 6-digit secure OTP generation, 10-minute expiry, 5 max attempts limit, and 60-second resend cooldown check)
