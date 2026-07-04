# PHASE 2 — ENVIRONMENT VARIABLES CHECKLIST
> **Smart Krishi Marketplace — Final Pre-Production Audit**
> Auditor: Antigravity DevOps Engineer
> Date: 2026-06-22

---

## FRONTEND (Vite/React — Vercel Deployment)

| Variable | Required | Current Value in `.env` | Status | Notes |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | ✅ YES | `http://localhost:8080/api` | ⚠️ MUST CHANGE | Must be updated to production URL before deployment |
| `VITE_GOOGLE_MAPS_API_KEY` | ✅ YES | `GOOGLE_MAPS_KEY_REDACTED` | ⚠️ SET (Rotate Key) | Key exposed in `.env` file — rotate and restrict via Google Cloud Console referrer restrictions |

**Extra variables present in `frontend/.env` that should NOT be there:**

| Variable | In frontend/.env | Should Be Here | Action |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | ✅ Present | ❌ BACKEND ONLY | REMOVE immediately |
| `CLOUDINARY_API_KEY` | ✅ Present | ❌ BACKEND ONLY | REMOVE immediately |
| `CLOUDINARY_API_SECRET` | ✅ Present | ❌ BACKEND ONLY (SECRET) | REMOVE + ROTATE immediately |
| `OPENWEATHER_API_KEY` | ✅ Present | ❌ BACKEND ONLY | REMOVE immediately |
| `GOOGLE_MAPS_API_KEY` | ✅ Present | ❌ BACKEND ONLY | REMOVE immediately |

---

## BACKEND (Spring Boot — Render/Docker Deployment)

### Database

| Variable | Env Config Key | Present in `application-prod.yml` | Status | Evidence |
|---|---|---|---|---|
| `DATABASE_URL` | `spring.datasource.url` | ✅ `${DATABASE_URL:jdbc:mysql://...}` | 🔴 CRITICAL — has hardcoded fallback | Line 3, `application-prod.yml` |
| `DATABASE_USERNAME` | `spring.datasource.username` | ✅ `${DATABASE_USERNAME:avnadmin}` | 🔴 CRITICAL — has hardcoded fallback | Line 4, `application-prod.yml` |
| `DATABASE_PASSWORD` | `spring.datasource.password` | ✅ `${DATABASE_PASSWORD:AVNS_REDACTED}` | 🔴 CRITICAL — real production password exposed | Line 5, `application-prod.yml` |

### JWT Authentication

| Variable | Env Config Key | Present in `application-prod.yml` | Status | Evidence |
|---|---|---|---|---|
| `JWT_SECRET` | `spring.security.jwt.secret` | ✅ `${JWT_SECRET}` (no fallback) | ✅ CORRECT in prod config | Line 74, `application-prod.yml` |
| **Warning** | `application.yml` | ✅ `${JWT_SECRET:404E6352...}` | 🔴 CRITICAL — fallback exposes signing key | Line 63, `application.yml` |
| **Warning** | `application-dev.yml` | ✅ `${JWT_SECRET:404E6352...}` | 🔴 CRITICAL — fallback exposes signing key | Line 82, `application-dev.yml` |

### Payment (Razorpay)

| Variable | Env Config Key | Present in `application-prod.yml` | Status |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | `razorpay.key-id` | ✅ `${RAZORPAY_KEY_ID}` | ✅ CORRECT — no fallback in prod |
| `RAZORPAY_KEY_SECRET` | `razorpay.key-secret` | ✅ `${RAZORPAY_KEY_SECRET}` | ✅ CORRECT — no fallback in prod |
| `RAZORPAY_WEBHOOK_SECRET` | `razorpay.webhook-secret` | ✅ `${RAZORPAY_WEBHOOK_SECRET}` | ✅ CORRECT — no fallback in prod |

> ⚠️ **Note:** Razorpay keys are currently using dev/mock values. `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` must be live production keys before go-live. Frontend `PaymentModal.jsx` handles mock key detection gracefully (falls back to sandbox simulation), which is good for development but not acceptable in production.

### Weather

| Variable | Env Config Key | Present in `application-prod.yml` | Status |
|---|---|---|---|
| `OPENWEATHER_API_KEY` | `openweather.api-key` | ✅ `${OPENWEATHER_API_KEY}` | ✅ CORRECT — no fallback in prod |

### Google Maps

| Variable | Env Config Key | Present in `application-prod.yml` | Status |
|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | `google.maps.api-key` | ✅ `${GOOGLE_MAPS_API_KEY:}` | ✅ Acceptable (empty fallback — maps degrade gracefully) |

### Cloudinary

| Variable | Env Config Key | Present in `application-prod.yml` | Status |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | `cloudinary.cloud-name` | ✅ `${CLOUDINARY_CLOUD_NAME}` | ✅ CORRECT — no fallback in prod |
| `CLOUDINARY_API_KEY` | `cloudinary.api-key` | ✅ `${CLOUDINARY_API_KEY}` | ✅ CORRECT — no fallback in prod |
| `CLOUDINARY_API_SECRET` | `cloudinary.api-secret` | ✅ `${CLOUDINARY_API_SECRET}` | ✅ CORRECT — no fallback in prod |

### Email (SMTP)

| Variable | Env Config Key | Present in `application-prod.yml` | Status |
|---|---|---|---|
| `MAIL_HOST` | `spring.mail.host` | ✅ `${MAIL_HOST:smtp.gmail.com}` | ✅ Acceptable (smtp.gmail.com is a safe default) |
| `MAIL_PORT` | `spring.mail.port` | ✅ `${MAIL_PORT:587}` | ✅ Acceptable (587 is standard TLS STARTTLS) |
| `MAIL_USERNAME` | `spring.mail.username` | ✅ `${MAIL_USERNAME}` | ✅ CORRECT — no fallback in prod |
| `MAIL_PASSWORD` | `spring.mail.password` | ✅ `${MAIL_PASSWORD}` | ✅ CORRECT — no fallback in prod |

### Optional (Redis Cache — Production only)

| Variable | Env Config Key | Present in `application-prod.yml` | Status |
|---|---|---|---|
| `REDIS_HOST` | `spring.redis.host` | ✅ `${REDIS_HOST:localhost}` | ⚠️ MUST SET if using Redis in prod |
| `REDIS_PORT` | `spring.redis.port` | ✅ `${REDIS_PORT:6379}` | ⚠️ Verify port |
| `REDIS_PASSWORD` | `spring.redis.password` | ✅ `${REDIS_PASSWORD:}` | ⚠️ Set if Redis is password-protected |

> **Note:** Production profile enables Redis cache (`type: redis`). Without a running Redis instance, the backend will fail to start. Either set `REDIS_*` variables or change cache type to `simple` in prod.

### CORS / URLs

| Variable | Env Config Key | Present in `application-prod.yml` | Status |
|---|---|---|---|
| `CORS_ALLOWED_ORIGINS` | `cors.allowed-origins` | ✅ `${CORS_ALLOWED_ORIGINS:https://smartkrishi.com,...}` | ✅ Has sensible default |
| `APP_BASE_URL` | `app.base-url` | ✅ `${APP_BASE_URL:https://api.smartkrishi.com}` | ✅ Has sensible default |
| `FRONTEND_URL` | `app.frontend-url` | ✅ `${FRONTEND_URL:https://smartkrishi.com}` | ✅ Has sensible default |
| `SPRING_PROFILES_ACTIVE` | (set via `-Dspring.profiles.active`) | ✅ Must be set to `prod` | ⚠️ Must verify on Render |

---

## ENV VARIABLE CHECKLIST — PRODUCTION DEPLOYMENT

Use this as the final checklist before going live:

### Render (Backend) — Required Variables

- [ ] `SPRING_PROFILES_ACTIVE` = `prod`
- [ ] `DATABASE_URL` = `jdbc:mysql://<host>:<port>/<db>?ssl-mode=REQUIRED`
- [ ] `DATABASE_USERNAME` = `<production db user>`
- [ ] `DATABASE_PASSWORD` = `<strong password>`
- [ ] `JWT_SECRET` = `<256-bit random hex string>`
- [ ] `RAZORPAY_KEY_ID` = `rzp_live_XXXXXXXXXXXX`
- [ ] `RAZORPAY_KEY_SECRET` = `<live secret>`
- [ ] `RAZORPAY_WEBHOOK_SECRET` = `<live webhook secret>`
- [ ] `OPENWEATHER_API_KEY` = `<real key>`
- [ ] `CLOUDINARY_CLOUD_NAME` = `<prod cloud name>`
- [ ] `CLOUDINARY_API_KEY` = `<prod api key>`
- [ ] `CLOUDINARY_API_SECRET` = `<prod api secret>`
- [ ] `MAIL_USERNAME` = `<prod smtp email>`
- [ ] `MAIL_PASSWORD` = `<gmail app password>`
- [ ] `REDIS_HOST` = `<redis host>` (if using Redis)
- [ ] `GOOGLE_MAPS_API_KEY` = `<server-side maps key>` (for geocoding)
- [ ] `PORT` = `8080`

### Vercel (Frontend) — Required Variables

- [ ] `VITE_API_BASE_URL` = `https://api.smartkrishi.com/api` (or your Render URL)
- [ ] `VITE_GOOGLE_MAPS_API_KEY` = `<client-side restricted maps key>`

---

## STATUS SUMMARY

| Component | Variables Correct | Status |
|---|---|---|
| Frontend env (VITE_ only) | Partial — extra backend vars present | 🔴 NEEDS CLEANUP |
| Database credentials | Fallbacks expose real prod credentials | 🔴 CRITICAL |
| JWT Secret | Fallback exposes real key in base config | 🔴 CRITICAL |
| Razorpay | Prod config correct; mock keys in use | ⚠️ NOT PRODUCTION READY |
| OpenWeather | Prod config correct | ✅ READY |
| Cloudinary (backend) | Dev config exposes real credentials | 🔴 HIGH |
| Mail | Prod config correct | ✅ READY |
| Redis | May cause startup failure if not set | ⚠️ MUST CONFIGURE |
| CORS / URL vars | Acceptable defaults in prod config | ✅ READY |

---

*Report generated: 2026-06-22 | Audit Version: 1.0.0-FINAL*
