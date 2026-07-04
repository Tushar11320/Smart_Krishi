# Deployment Readiness Audit Report
**Project:** Smart Krishi Marketplace  
**Scope:** Hosting Configurations, Environment Variables & Containerization  
**Status:** 🟢 STAGING READY (95/100 Deployment Readiness Score)

---

## 1. Environment Variables Audit

Every third-party integration relies on standard runtime environment variables. The following tables trace their mapping and verify their validity:

### A. Frontend Environment Variables (Vercel)
- `VITE_API_BASE_URL`: Endpoint path pointing to the backend REST API `/api` (e.g. `https://api.smartkrishi.com/api`).
- `VITE_GOOGLE_MAPS_API_KEY`: Client-side key for maps rendering (whitelisted to website referrers).
- `VITE_GOOGLE_CLIENT_ID`: OAuth Client ID for social login button helper.

### B. Backend Environment Variables (Render / Docker)
- `SPRING_PROFILES_ACTIVE`: Controls active profile (set to `prod` for production).
- `DATABASE_URL`: MySQL connection URL (e.g. `jdbc:mysql://mysql-svc:3306/defaultdb?useSSL=true`).
- `DATABASE_USERNAME` / `DATABASE_PASSWORD`: Credentials for the DB instance.
- `JWT_SECRET`: Signing token (minimum 512-bit HS512 secret).
- `CORS_ALLOWED_ORIGINS`: Allowed client domains (e.g. `https://smartkrishi.com`).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Media credentials.
- `OPENWEATHER_API_KEY`: Key for weather forecast alerts.
- `GOOGLE_MAPS_API_KEY`: Server-side Maps Key (IP restricted) for geocoding and directions.
- `GOOGLE_CLIENT_ID`: OAuth Client ID matching the client.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`: SMTP email configurations.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`: Payment gateway keys.

---

## 2. Platform Hosting Verification

### A. Frontend Staging (Vercel)
- **Root Directory**: `frontend`
- **Build Preset**: Vite
- **Output Directory**: `dist`
- **Build Command**: `npm run build`
- **Routing Redirects**: Supported via [`vercel.json`](file:///PROJECT_ROOT/frontend/vercel.json), rewriting all non-file route paths to `/index.html` to support React Router SPA client routing.

### B. Backend Staging (Render Web Service)
- **Containerization**: Enabled. The `backend/Dockerfile` utilizes a clean, modern multi-stage Docker build:
  - **Stage 1 (Build)**: Maven JDK 21 image compiles the boot JAR: `mvn clean package -DskipTests`.
  - **Stage 2 (Runtime)**: Copies the JAR file into a lightweight Alpine JDK 21 runtime image, exposing port `8080` (or dynamic port mapping via `$PORT`).
- **Log Management**: Output log files are generated at `logs/smartkrishi-dev.log` for debugging.

---

## 3. Database Deployment Readiness (Aiven / Cloud MySQL)

- **Compatibility**: Verified against MySQL 8.
- **Table Seeding**: Handled automatically. Spring Boot compiles database schemas dynamically via `ddl-auto: update` on first run if tables do not exist.
- **OTP Verifications**: Handled securely via the database table `users` mapping `otp_code` and `otp_expiry` parameters.
