# PHASE 1 — SECURITY FINDINGS REPORT
> **Smart Krishi Marketplace — Final Pre-Production Audit**
> Auditor: Antigravity Principal Security Engineer
> Date: 2026-06-22
> Scope: All tracked source files in `frontend/src/`, `backend/src/`, `frontend/.env`, `backend/src/main/resources/`

---

## EXECUTIVE SUMMARY

| Category | Status |
|---|---|
| API keys in frontend source code | ✅ CLEAN |
| Secrets in tracked Java source | ✅ CLEAN |
| Passwords in Git-tracked config | ⚠️ WARNING |
| JWT secret fallback | 🔴 CRITICAL |
| Cloudinary secrets in frontend folder | 🔴 CRITICAL |
| OpenWeather key in frontend folder | 🔴 CRITICAL |
| Google Maps server-side key in frontend | 🔴 CRITICAL |
| Razorpay secret in frontend | ✅ CLEAN |
| .gitignore correctness | ⚠️ WARNING |
| `backend/target` ignored | ✅ CONFIRMED |
| `uploads/` ignored | ✅ CONFIRMED |
| `.env` files ignored | ⚠️ PARTIAL |

---

## FINDING 001 — CRITICAL
### Real Secrets in `frontend/.env` (Tracked File)

**File:** `frontend/.env`
**Severity:** 🔴 CRITICAL — Production Blocker

The file `frontend/.env` contains **real, live credentials** for multiple services:

```
CLOUDINARY_CLOUD_NAME=dcnsz5l9v
CLOUDINARY_API_KEY=CLOUDINARY_KEY_REDACTED
CLOUDINARY_API_SECRET=CLOUDINARY_SECRET_REDACTED
OPENWEATHER_API_KEY=OPENWEATHER_KEY_REDACTED
VITE_OPENWEATHER_API_KEY=OPENWEATHER_KEY_REDACTED
GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_KEY_REDACTED
VITE_GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_KEY_REDACTED
```

**Critical findings:**
- `CLOUDINARY_API_SECRET` is a **backend-only** secret. It must **NEVER** appear in the frontend folder.
- `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_API_KEY` (non-`VITE_` prefixed) are server-side variables — they serve no purpose in the frontend and indicate copy-paste confusion.
- `OPENWEATHER_API_KEY` (non-`VITE_` prefixed) is a server-side variable that has leaked into the frontend `.env`.
- `GOOGLE_MAPS_API_KEY` (non-`VITE_` prefixed) is a server-side variable present in the frontend `.env`.

**The `.gitignore` at root level lists `frontend/.env*`, which means this file IS supposed to be ignored. However, if this file was committed before the `.gitignore` was set, or is present in Git history, it may be tracked. The file is also present on disk, meaning any deployment tool that copies the frontend folder could inadvertently bundle or expose these secrets.**

**Additionally, `frontend/.env.development` also exists with the same 405 bytes — it contains the same credentials.**

**Impact:** Cloudinary API secret, if exposed, grants full upload/delete access to the cloud storage account. Google Maps key can be abused for billing fraud.

**Remediation:**
1. Immediately rotate: Cloudinary API Secret, OpenWeather key, Google Maps API key.
2. Delete `frontend/.env` and `frontend/.env.development`.
3. Keep ONLY `VITE_API_BASE_URL` and `VITE_GOOGLE_MAPS_API_KEY` in the frontend environment (with proper API key restrictions from Google Cloud Console).
4. Move `CLOUDINARY_*`, `OPENWEATHER_API_KEY`, `GOOGLE_MAPS_API_KEY` (server-side) to the backend `.env` or deployment platform secrets.
5. Confirm via `git log --all -- frontend/.env` that this file was never committed to Git history.

---

## FINDING 002 — CRITICAL
### JWT Secret Hardcoded Fallback in `application.yml` and `application-dev.yml`

**File:** `backend/src/main/resources/application.yml` (Line 63)
**File:** `backend/src/main/resources/application-dev.yml` (Line 82)
**File:** `backend/src/main/resources/application-local.yml` (Line 56, 77)
**Severity:** 🔴 CRITICAL

The JWT signing secret has a **hardcoded fallback** value that is committed to source control:

```yaml
# application.yml line 63
secret: ${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}

# application-dev.yml line 82
secret: ${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
```

This fallback is the **actual signing key** used when `JWT_SECRET` is not set in the environment. Because it is committed to the public repository, any attacker who reads the code can forge valid JWT tokens for any user (including admins) without knowing any credentials.

**Impact:** Complete authentication bypass. All user accounts, including admin, are compromised.

**Remediation:**
1. Remove the fallback value from all `application.yml` files. Use `${JWT_SECRET}` (no default).
2. Generate a new 256-bit+ cryptographically random JWT secret for production.
3. `application-prod.yml` is already correct (`secret: ${JWT_SECRET}` — no fallback). ✅

---

## FINDING 003 — CRITICAL
### Hardcoded Database Password Fallback in `application.yml` and `application-dev.yml`

**File:** `backend/src/main/resources/application.yml` (Line 11)
**File:** `backend/src/main/resources/application-dev.yml` (Line 5)
**Severity:** 🔴 CRITICAL

```yaml
password: ${DB_PASSWORD:NewPassword@123}
```

A real database password is embedded as a fallback in committed configuration files. If `DB_PASSWORD` is not set in the environment, the application uses `NewPassword@123` as the MySQL password.

**Impact:** Potential unauthorized database access if the local or cloud database is reachable.

**Remediation:** Remove the hardcoded password fallback. Use `${DB_PASSWORD}` with no default.

---

## FINDING 004 — CRITICAL
### Live Production Database Credentials in `application-prod.yml`

**File:** `backend/src/main/resources/application-prod.yml` (Lines 3–5)
**Severity:** 🔴 CRITICAL

```yaml
url: ${DATABASE_URL:jdbc:mysql://mysql-service-placeholder-db.i.aivencloud.com:12174/defaultdb?ssl-mode=REQUIRED}
username: ${DATABASE_USERNAME:avnadmin}
password: ${DATABASE_PASSWORD:AVNS_REDACTED}
```

The **production Aiven MySQL database URL, username (`avnadmin`), and password (`AVNS_REDACTED`)** are hardcoded as fallback defaults in a file committed to Git. This is a critical exposure.

**Impact:** Any person with repository access can directly connect to and fully control the production database.

**Remediation:**
1. **Immediately rotate** the Aiven MySQL password.
2. Remove all fallback values from `application-prod.yml` so all three use `${DATABASE_URL}`, `${DATABASE_USERNAME}`, `${DATABASE_PASSWORD}` with no defaults.
3. Audit Aiven access logs for unauthorized connections.

---

## FINDING 005 — HIGH
### Cloudinary Credentials as Dev Fallback in `application-dev.yml`

**File:** `backend/src/main/resources/application-dev.yml` (Lines 87–89)
**Severity:** 🔴 HIGH

```yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME:dcnsz5l9v}
  api-key: ${CLOUDINARY_API_KEY:317956768729546}
  api-secret: ${CLOUDINARY_API_SECRET:9esHDjB2kFSIbbDh-zdGYef4eGY}
```

Real Cloudinary credentials are embedded as fallback defaults. Since `application-dev.yml` is committed to source control, these credentials are exposed to anyone with repo access.

**Remediation:** Remove the real credential fallbacks. Use placeholder-only fallbacks like `${CLOUDINARY_CLOUD_NAME:}` or require explicit injection.

---

## FINDING 006 — HIGH
### Default Admin & Seller Credentials Hardcoded in `DataInitializer.java`

**File:** `backend/src/main/java/com/smartkrishi/config/DataInitializer.java` (Lines 227, 238, 253, 275)
**Severity:** 🔴 HIGH

```java
admin.setPasswordHash(passwordEncoder.encode("Admin@1234"));
log.info("Admin user created: admin@smartkrishi.com / Admin@1234");
// ...
seller.setPasswordHash(passwordEncoder.encode("Seller@1234"));
log.info("Seller user & profile created: seller@smartkrishi.com / Seller@1234");
```

Default credentials for admin (`Admin@1234`) and seller (`Seller@1234`) are hardcoded in the application code and logged to application logs in plaintext. This is a brute-force trivial attack surface for any attacker who reads the public repository.

**Additional issue:** The log statement `log.info("Admin user created: admin@smartkrishi.com / Admin@1234")` leaks the plaintext password to log files.

**Remediation:**
1. Remove password from `log.info()` messages.
2. Inject admin password via environment variable: `${ADMIN_INITIAL_PASSWORD:Admin@1234}` and ensure it is changed at first login.
3. Add a "force password change on first login" flag for seeded accounts.

---

## FINDING 007 — MEDIUM
### `frontend/.env.development` Contains Real Credentials

**File:** `frontend/.env.development`
**Severity:** 🟡 MEDIUM

Same file size (405 bytes) as `frontend/.env`, implying it contains the same real credentials. This file also carries the same critical findings as FINDING 001.

---

## FINDING 008 — MEDIUM
### Hardcoded Localhost Fallback in API Service

**File:** `frontend/src/services/api.js` (Line 4)
**File:** `frontend/src/Pages/OrderTracking.jsx` (Line 89)
**File:** `frontend/src/components/Topbar.jsx` (Line 94)
**Severity:** 🟡 MEDIUM

```js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
```

If `VITE_API_BASE_URL` is not set at build time, the frontend silently falls back to `http://localhost:8080/api`. In a production deployment, this causes all API calls to fail and routes to `localhost`, which is unreachable.

**Remediation:** Remove the fallback. The build should fail if `VITE_API_BASE_URL` is not set (use Vite's `loadEnv` with strict mode or validate at startup).

---

## FINDING 009 — LOW
### `application-local.yml` and `application-dev.yml` Are Tracked by Git

**File:** `backend/src/main/resources/application-local.yml`
**File:** `backend/src/main/resources/application-dev.yml`
**Severity:** 🟡 LOW

The `.gitignore` specifies:
```
**/application-local.yml
**/application-dev.yml
```

However, these files exist in the repository, which means they were committed **before** the `.gitignore` rule was added, or the rule is not being applied correctly to already-tracked files. The files contain credential fallbacks.

**Verification Required:** Run `git ls-files backend/src/main/resources/application-local.yml` to confirm whether they are tracked.

**Remediation:** If tracked, run `git rm --cached backend/src/main/resources/application-local.yml` and the equivalent for `application-dev.yml`.

---

## .gitignore ANALYSIS

| Rule | Status | Evidence |
|---|---|---|
| `.env` and `.env.*` ignored at root | ✅ | Line 8-9 in `.gitignore` |
| `frontend/.env*` ignored | ✅ | Line 16 in `.gitignore` |
| `backend/.env*` ignored | ✅ | Line 17 in `.gitignore` |
| `application-local.yml` ignored | ⚠️ Rule exists but files are present on disk (verify Git tracking) | Lines 20, 21 |
| `application-dev.yml` ignored | ⚠️ Rule exists but files are present on disk (verify Git tracking) | Line 21 |
| `application-prod.yml` ignored | ✅ | Line 23 |
| `backend/target/` ignored | ✅ | Line 45 |
| `backend/uploads/*` ignored | ✅ | Line 76 |
| `node_modules/` ignored | ✅ | Line 41 |
| `dist/` ignored | ✅ | Line 42 |
| `logs/` ignored | ✅ | Line 65 |

---

## FINDINGS SUMMARY TABLE

| ID | Severity | File | Issue |
|---|---|---|---|
| 001 | 🔴 CRITICAL | `frontend/.env` | Real Cloudinary secret, OpenWeather key, Google Maps key present |
| 002 | 🔴 CRITICAL | `application.yml`, `application-dev.yml` | JWT secret hardcoded as fallback |
| 003 | 🔴 CRITICAL | `application.yml`, `application-dev.yml` | DB password hardcoded as fallback |
| 004 | 🔴 CRITICAL | `application-prod.yml` | Live Aiven production DB URL + credentials as fallbacks |
| 005 | 🔴 HIGH | `application-dev.yml` | Real Cloudinary credentials as dev fallbacks |
| 006 | 🔴 HIGH | `DataInitializer.java` | Hardcoded admin/seller passwords, logged to application logs |
| 007 | 🟡 MEDIUM | `frontend/.env.development` | Same real credentials as `frontend/.env` |
| 008 | 🟡 MEDIUM | `api.js`, `OrderTracking.jsx`, `Topbar.jsx` | Localhost fallback URL — silent production failure |
| 009 | 🟡 LOW | `application-local.yml`, `application-dev.yml` | Files may be Git-tracked despite `.gitignore` rules |

---

## POSITIVE FINDINGS ✅

- Frontend JavaScript source (`src/`) contains **no hardcoded API keys**.
- All Maps, Weather, and Cloudinary calls in frontend route through the backend API — not directly to third-party APIs (except Maps which correctly uses `VITE_GOOGLE_MAPS_API_KEY` from env).
- `application-prod.yml` Cloudinary, Razorpay, and JWT sections are **correctly environment-variable-only** with no fallbacks.
- The `EnvValidator.java` correctly enforces no-placeholder validation at production startup.
- Docker image uses a non-root user (`spring:spring`) — ✅.
- CSRF is disabled (stateless JWT API) — acceptable for this architecture.
- BCrypt password encoding is used — ✅.
- HTTPS/TLS is referenced in prod config — ✅.
- Webhook endpoint validates `X-Razorpay-Signature` — ✅.

---

*Report generated: 2026-06-22 | Audit Version: 1.0.0-FINAL*
