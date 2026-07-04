# Deployment Environment Variables & Startup Verification Guide

This guide details the required environment variable configurations, validation checks, and startup failure safeguards for deploying **Smart Krishi** to production (Render for the Spring Boot backend and Vercel for the React frontend).

---

## 1. Required Render Variables (Backend Settings)
Configure these variables in your **Render Web Service** or **Docker Service** dashboard settings:

| Variable Name | Description | Example / Required Format |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Dictates the active configuration profile. | `prod` (Required for strict production rules) |
| `PORT` | The port the Spring Boot server binds to. | `8080` (or leave empty, Render binds dynamically) |
| `DATABASE_URL` | MySQL connection string. | `jdbc:mysql://<host>:<port>/<dbname>?useSSL=true&requireSSL=true` |
| `DATABASE_USERNAME` | Username for the production database. | `production_db_admin` |
| `DATABASE_PASSWORD` | Password for the production database. | `secure_database_password_here` |
| `JWT_SECRET` | 256-bit cryptographic signing key for JWT tokens. | *At least 32 random characters* |
| `RAZORPAY_KEY_ID` | Production key ID for payment checkouts. | `rzp_live_xxxxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Production key secret for verifying transactions. | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Production webhook secret for capture events. | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `OPENWEATHER_API_KEY` | Key for real-time weather analytics. | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name for image uploads. | `smartkrishicloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key. | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret. | `xxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `MAIL_USERNAME` | SMTP sender email username. | `notifications@smartkrishi.com` |
| `MAIL_PASSWORD` | SMTP app password. | `xxxx xxxx xxxx xxxx` |

---

## 2. Required Vercel Variables (Frontend Settings)
Configure these variables in your **Vercel Project Dashboard** before building the static production frontend:

| Variable Name | Description | Example / Required Format |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base API route pointing to the running backend. | `https://api.smartkrishi.com/api` (Must end in `/api`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Public maps API key for client rendering. | `AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

*Note: In PWA client environments, weather metrics are retrieved directly via the backend proxies, so the OpenWeather key is not exposed on the frontend.*

---

## 3. Automated Validation Checks on Startup
To prevent the application from running in a vulnerable or degraded state, an automated environment validation interceptor (`EnvValidator`) checks the environment configuration during startup.

### Validation Rules:
1. **Prod-Only Execution**: Checks are only enforced when the active profile is set to `prod`.
2. **Missing Keys Check**: Boot crashes immediately if a required key is empty or undefined.
3. **Placeholder Prevention**: Checks values against development templates. Startup will fail if any key contains:
   - `your-` or `your_`
   - `demo-`
   - Default fallback strings (like `key_secret`, `cloud_name`, `api_key`).

---

## 4. Startup Verification & Testing

### How to Test Failures Locally
You can test the startup blocker validation rules on your development machine by executing the JAR with the `prod` profile active:

```bash
# Compile the backend
cd backend
.\mvnw.cmd clean package -DskipTests

# Run package in prod mode
java -jar -Dspring.profiles.active=prod target/smart-krishi-backend-1.0.0.jar
```

If variables are missing or contain mock placeholders, the application will terminate immediately and print the following logs:

```text
2026-06-20 23:38:00 - Active profile is 'prod'. Executing strict production environment variable checks...
2026-06-20 23:38:00 - =========================================================================
2026-06-20 23:38:00 - PRODUCTION DEPLOYMENT FAILED: Missing or placeholder environment variables:
2026-06-20 23:38:00 -  - spring.datasource.username (DATABASE_USERNAME) is missing or empty.
2026-06-20 23:38:00 -  - spring.security.jwt.secret (JWT_SECRET) is missing or empty.
2026-06-20 23:38:00 -  - razorpay.key-id (RAZORPAY_KEY_ID) contains an invalid default placeholder value: 'your-key-id'
2026-06-20 23:38:00 - =========================================================================
Exception in thread "main" java.lang.IllegalStateException: Production environment variable validation failed. Please set required secrets in Render settings.
```

If verification succeeds, the boot log will print:
```text
2026-06-20 23:38:00 - Production environment variable validation completed successfully. All keys are set.
```
This guarantees that Render will cancel the deployment and roll back if any key is missing or set incorrectly.

---

## 5. Enterprise Monorepo Deployment Configurations

Because the repository has been organized into a clean enterprise layout, hosting providers must be configured to build from the appropriate subdirectories:

### A. Vercel Frontend Configuration
Ensure the following configurations are set in your **Vercel Project Settings**:
1. **Root Directory**: Set to `frontend` (This tells Vercel to look inside the `frontend` folder for `package.json`, `index.html`, and `vite.config.js`).
2. **Build Command**: `npm run build` (Executed automatically inside the `frontend` directory).
3. **Output Directory**: `dist` (Vite's default relative build target).

### B. Render Backend Configuration
Ensure the following configurations are set in your **Render Web Service Settings**:
1. **Root Directory**: Set to `backend` (This points Render to compile the Spring Boot application using the multi-stage `Dockerfile` and `pom.xml` located inside `backend/`).
2. **Runtime**: **Docker** (Render compiles from `backend/Dockerfile` automatically).
3. **Build Context**: Render sets the build context to the specified Root Directory (`backend/`), ensuring all paths in the multi-stage Dockerfile execute correctly.

