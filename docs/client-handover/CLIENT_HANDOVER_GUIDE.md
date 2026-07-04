# Smart Krishi Marketplace - Client Handover Guide

**Document status:** Delivery baseline  
**Assessment date:** 22 June 2026  
**Repository assessed:** `rhythmgupta19/Smart_Krishi`  
**Intended production architecture:** Vercel frontend, Render Docker backend, managed MySQL database  
**Confidentiality:** This document names configuration keys but intentionally contains no credentials or secret values.

> **Important delivery status:** Live URLs, domain/DNS records, provider account owners, subscription plans, and backup/monitoring evidence are not present in the repository. They are marked **TBC by client/delivery owner**. Do not interpret intended deployment settings as evidence that production is already deployed.

## Readiness Summary

| Measure | Score | Assessment |
|---|---:|---|
| Project Readiness | **72/100** | Broad buyer, seller, admin, marketplace, payment, map, weather, and notification code exists. Frontend production build succeeds and 47 backend tests pass. Some UI areas and notification channels remain placeholders/stubs. |
| Deployment Readiness | **48/100** | Docker and Vercel definitions exist, but no live endpoints are documented, no CI/CD workflow exists, and the production Spring profile is ignored/untracked. A Git-based backend deploy therefore lacks the production property mappings documented elsewhere. |
| Client Handover Readiness | **63/100** | Architecture and deployment notes exist and this runbook closes the main operational gap. Account ownership, access transfer, live service evidence, backup restore evidence, monitoring contacts, and support SLAs remain unconfirmed. |

### Go-Live Recommendation

**NO-GO for public production launch at this assessment point.** A controlled staging/UAT deployment is appropriate. Change to **GO** only after all P0 items below and the Section 10 checklist are completed and evidenced:

1. Commit a secret-free production configuration or move every production mapping into the tracked base configuration. The local `application-prod.yml` is ignored and is not available to a Git-based Render build.
2. Verify `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `PORT`, production CORS, SMTP, and URL properties are actually consumed in the deployed artifact.
3. Enable and test a single database migration strategy. The checked-in base config has Flyway disabled and Hibernate `ddl-auto: update`, while deployment documentation claims Flyway runs automatically.
4. Complete live Razorpay checkout/webhook/refund UAT with live-mode controls, idempotency checks, and reconciliation.
5. Correct and test Spring Mail binding; the checked-in YAML uses `mail.smtp.*`, while Spring Boot and `EmailServiceImpl` expect `spring.mail.*`.
6. Provision and prove backups, restore testing, monitoring/alerts, SSL, DNS, and client-owned access.
7. Run role-based end-to-end UAT for buyer, seller, and admin workflows. Do not treat SMS, WhatsApp, or push as delivered integrations; their current implementations only log messages.

---

## 1. Project Overview

### What Smart Krishi Does

Smart Krishi is an agricultural marketplace and progressive web application (PWA). It brings together buyers and agricultural sellers for crops, fertilizers, milk, machinery, farming equipment, land, and building materials. The system also includes cart and checkout, orders and tracking, reviews, wishlists, weather data, maps/location features, image upload, seller operations, administrative oversight, and event notifications.

### Buyer Features

- Register and sign in; manage profile and password.
- Browse and search agricultural product categories and specialized listings.
- View product images, details, prices, inventory, seller information, and reviews.
- Maintain cart, saved-for-later items, wishlist, and multiple delivery addresses.
- Checkout and create orders; use Razorpay or configured offline methods such as COD/bank transfer.
- View order history and real-time tracking information.
- Book machinery/equipment rentals and request land visits.
- Submit and manage product/seller reviews.
- Use weather forecasts, nearby products, location selection, route/farm maps, and notification preferences.
- Install the PWA and access cached pages where the service worker supports them.

### Seller Features

- Apply for a seller profile and submit business, tax, bank, and location information.
- Await admin verification before normal marketplace operations.
- Create and maintain listings across products, crops, fertilizers, milk, machinery, equipment, land, and materials, subject to role and ownership controls.
- Upload listing images through Cloudinary.
- Manage stock, listing status, inventory, and bulk updates.
- View and process seller orders and update fulfillment status.
- View dashboard, earnings, inventory, sales, and analytics data.
- Configure seller location/delivery reach and receive in-app/order notifications.

### Admin Features

- Access role-protected admin pages.
- View dashboard statistics, commission/revenue analytics, platform analytics, and fraud alerts.
- Manage users and user status.
- Review, approve, reject, or suspend seller applications.
- Moderate products and product status.
- Manage categories, orders, payment/refund operations, feedback, reviews, and system/payment settings exposed by the application.
- Monitor seller/product/order activity through administrative views.

**Scope caution:** Several report, support, settings, and advisory pages are generic/placeholder implementations. Admin capabilities should be validated endpoint by endpoint during UAT rather than inferred from navigation labels.

---

## 2. Tech Stack

| Layer | Technology / Service | Delivery Notes |
|---|---|---|
| Frontend | React 19, Vite 7, React Router, Axios, Tailwind CSS 4, Framer Motion, PWA manifest/service worker | Static SPA; Vercel rewrite sends non-asset routes to `index.html`. |

| Backend | Java 21, Spring Boot 3.3, Spring MVC/WebFlux, Spring Security, Spring Data JPA, WebSocket, Bean Validation, Maven | REST API under `/api`; Swagger/OpenAPI and Actuator included. |

| Database | MySQL 8 / MySQL Connector-J, Hibernate/JPA, HikariCP | MySQL is the implemented database. Repository documentation that mentions another database must not override runtime configuration. |

| Schema Management | Hibernate plus Flyway dependency and `V1__init_schema.sql` | Current tracked base config: `ddl-auto: update`, Flyway disabled. Must be resolved before production. |

| Hosting | Intended: Vercel (frontend), Render Docker Web Service (backend) | No live deployment evidence or URLs in repository. |

| Payment Gateway | Razorpay Java SDK 1.4.4 | Server creates orders, verifies signatures/webhooks, and supports refund flow; live UAT required. |
| Weather APIs | OpenWeather REST API, proxied by backend | API key remains server-side. |

| Maps APIs | Google Maps JavaScript API and backend Google Maps service | Frontend and backend keys/configuration are separate variables; apply API/domain/IP restrictions. |
| Notifications | Database + WebSocket in-app; SMTP email; SMS/WhatsApp/push interfaces | SMS, WhatsApp, and push implementations are logging stubs. SMTP property binding requires correction/verification. |

| Storage | Cloudinary for managed image storage; local `uploads/` fallback | Container-local storage is ephemeral and must not be relied on in production. |

| Observability | Spring Boot Actuator, Micrometer Prometheus endpoint, application file/console logs | Monitoring stack and alert delivery are not provisioned by this repository. |

| Container | Multi-stage Eclipse Temurin Java 21 Dockerfile, non-root runtime user | JVM uses G1GC and container-aware memory percentage. |

---

## 3. Deployment Details

### Deployment Register

| Item | Intended/Known Detail | Handover Status |
|---|---|---|
| Frontend URL | Vercel URL or client custom domain | **TBC by client/delivery owner** |
| Backend URL | Render service URL or API custom domain; frontend variable must include `/api` | **TBC by client/delivery owner** |
| Database Provider | Managed MySQL 8 provider | **Provider/instance TBC** |
| Primary Domain | Client-owned domain | **TBC** |
| Frontend DNS | Usually apex/`www` CNAME/A records per Vercel instructions | **TBC** |
| API DNS | Usually `api.<domain>` CNAME per Render/custom-domain instructions | **TBC** |
| Registrar / DNS Owner | Client legal entity or authorized client administrator | **TBC** |
| Frontend Hosting | Vercel, root directory `frontend`, build `npm run build`, output `dist` | Intended; deployment not evidenced |
| Backend Hosting | Render Docker Web Service, root directory `backend` | Intended; deployment not evidenced |
| Source Repository | GitHub `rhythmgupta19/Smart_Krishi` | Repository remote is configured; client ownership/access transfer TBC |

### Required Production Topology

1. Browser loads the HTTPS frontend from Vercel/custom domain.
2. Frontend calls the HTTPS backend defined by `VITE_API_BASE_URL` and opens WebSockets using that base host.
3. Backend connects to managed MySQL over TLS, Cloudinary, Razorpay, OpenWeather, Google Maps, and SMTP.
4. Vercel and the custom frontend domain must be included in backend CORS allowed origins.
5. Razorpay sends signed events to `https://<backend-host>/api/payments/webhook`.
6. Actuator health is available at `/actuator/health`; metrics must be protected or network-restricted in production.

### Deployment Configuration Warning

The intended production mappings exist in a local `backend/src/main/resources/application-prod.yml`, but that file is ignored by Git and is not tracked. A Render build from Git will only receive tracked resources. Do not deploy with `SPRING_PROFILES_ACTIVE=prod` until a tracked, secret-free production property file or equivalent tracked mappings have been delivered. Secrets themselves remain in provider environment-variable stores.

---

## 4. Required Environment Variables

No values are included below. Store backend variables in Render (or the selected server platform) and frontend variables in Vercel for all applicable environments. Vite variables are compiled into public browser assets and must never contain secrets.

### Backend - Core and Database

| Variable | Requirement | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Required | Selects runtime profile; production must use `prod` after tracked production mappings are fixed. |
| `PORT` | Required by dynamic hosting | Port assigned by hosting provider. The tracked base config currently fixes `8080`; verify binding before deploy. |
| `DATABASE_URL` | Required in production | Full JDBC MySQL URL, including TLS requirements and database name. |
| `DATABASE_USERNAME` | Required in production | Least-privilege application database user. |
| `DATABASE_PASSWORD` | Required in production | Password for the production application database user. |
| `DB_PASSWORD` | Current base/dev compatibility key | The tracked base and dev configuration reference this different key. Remove ambiguity or set only as required by the final tracked configuration. |
| `JWT_SECRET` | Required | HMAC signing secret for access and refresh JWTs; use high-entropy secret of sufficient length. |
| `CORS_ALLOWED_ORIGINS` | Required in production | Comma-separated exact HTTPS frontend origins. Do not use wildcard with credentialed requests. |
| `APP_BASE_URL` | Required where referenced | Public backend/application base URL used by production configuration. |
| `FRONTEND_URL` | Required where referenced | Canonical public frontend URL for links and cross-origin configuration. |

### Backend - External Services

| Variable | Requirement | Purpose |
|---|---|---|
| `RAZORPAY_KEY_ID` | Required for online payments | Public account key identifier used by backend/checkout response. |
| `RAZORPAY_KEY_SECRET` | Required and secret | Creates gateway operations and verifies payment signatures. |
| `RAZORPAY_WEBHOOK_SECRET` | Required and secret | Verifies Razorpay webhook authenticity. |
| `CLOUDINARY_CLOUD_NAME` | Required for managed uploads | Identifies the Cloudinary tenant. |
| `CLOUDINARY_API_KEY` | Required | Cloudinary API key identifier. |
| `CLOUDINARY_API_SECRET` | Required and secret | Authorizes server-side uploads/deletions. |
| `OPENWEATHER_API_KEY` | Required | Authorizes server-side weather and forecast requests. |
| `GOOGLE_MAPS_API_KEY` | Required for backend map functions | Authorizes backend map/geocoding service calls; use server/IP restrictions. |
| `MAIL_HOST` | Required for real email | SMTP hostname. |
| `MAIL_PORT` | Required for real email | SMTP submission port, normally TLS-enabled. |
| `MAIL_USERNAME` | Required for real email | Authenticated SMTP account and sender identity. |
| `MAIL_PASSWORD` | Required and secret | SMTP password/app password/API credential. |

### Backend - Optional/Conditional Cache

| Variable | Requirement | Purpose |
|---|---|---|
| `REDIS_HOST` | Conditional | Redis hostname if the final production profile enables Redis. |
| `REDIS_PORT` | Conditional | Redis service port. |
| `REDIS_PASSWORD` | Conditional and secret | Redis authentication credential. |

Redis is described in architecture material and referenced by the ignored local production profile, but the Maven project does not currently include a Redis starter. Treat Redis as a future/conditional capability until a deployed build proves otherwise.

### Frontend Build Variables

| Variable | Requirement | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Required in production | Public backend base URL ending in `/api`. Also used to derive WebSocket host URLs. |
| `VITE_GOOGLE_MAPS_API_KEY` | Required for browser maps | Browser-visible Google Maps JavaScript API key. Restrict to approved HTTP referrers and APIs. |

### Variable Change Control

- Maintain separate development, staging, and production values.
- Restrict access to named client administrators and delivery/operations personnel.
- Record change ticket, approver, timestamp, affected environment, and validation result.
- Never place values in Git, screenshots, support tickets, chat, or this handover document.
- After a change, redeploy/restart the affected service and run health plus workflow smoke tests.

---

## 5. Third-Party Services

Account owner means the legal/client-controlled account that owns billing and recovery access. No ownership evidence was found, so all owners require confirmation.

| Service | Purpose | Account Owner | Renewal Requirement | Configuration Location |
|---|---|---|---|---|
| Razorpay | Online checkout orders, signature verification, webhooks, refunds, reconciliation | **TBC; must be client-controlled business account** | Maintain KYC/account activation; review pricing; rotate keys; renew/verify webhook secrets and settlement bank details as required | Render environment variables; Razorpay Dashboard webhook points to backend `/api/payments/webhook`; backend payment service |
| Cloudinary | Product, seller, and listing image upload/storage/delivery | **TBC; should be client-controlled** | Monitor monthly quota/billing, transformations, storage, and bandwidth; renew paid plan if used | Render environment variables; backend Cloudinary config/service |
| OpenWeather | Current weather and forecast data | **TBC; should be client-controlled** | Monitor request quota and plan expiry/billing; rotate key if exposed | Render `OPENWEATHER_API_KEY`; backend weather configuration/service |
| Google Maps Platform | Browser maps, autocomplete, geocoding/location and route features | **TBC; should be client-owned Google Cloud project** | Active billing profile; monitor quota/cost; restrict and rotate keys; review API enablement | Vercel `VITE_GOOGLE_MAPS_API_KEY`, Render `GOOGLE_MAPS_API_KEY`, Google Cloud API restrictions |
| SMTP Provider | Transactional email notifications | **TBC**; Gmail is only a default hint, not a confirmed provider | Maintain mailbox/provider subscription, sender/domain verification, SPF/DKIM/DMARC, and app password/API credential | Render mail variables; final settings must bind to Spring `spring.mail.*` properties |

### Handover Evidence Required Per Service

- Client account owner and two recovery administrators.
- Billing owner, renewal date/plan, and spending/quota alerts.
- Production and staging project/account separation.
- Key restrictions and last rotation date.
- Dashboard access tested by client representative.
- Exported configuration evidence with all secret values masked.

---

## 6. Client Operation Guide

### Buyer Workflow

1. Open the marketplace and register as a buyer using a unique email/phone and an 8+ character password.
2. Sign in and complete profile and delivery addresses.
3. Browse categories or use nearby, search, weather, and map features to discover products/services.
4. Open a listing, confirm seller/listing details, price, stock, delivery/rental conditions, and reviews.
5. Add items to cart, adjust quantities, or save items for later/wishlist.
6. Open checkout, select/enter an address, verify totals, and create the order.
7. Choose an enabled payment method. For Razorpay, complete the hosted checkout; do not close the page until server verification finishes.
8. Confirm the order appears in order history and retain the order number.
9. Track fulfillment from the order tracking page and review in-app/email notifications.
10. After completion, submit a genuine review or contact support with the order number if resolution is needed.

### Seller Workflow

1. Register/sign in, then open the seller application area.
2. Submit business identity, tax/registration, bank/UPI, address, and location details accurately.
3. Wait for admin approval; respond to rejection/clarification notes through the agreed support channel.
4. After approval, configure shop/location and delivery coverage.
5. Create listings with correct category, title, description, price, stock, specifications, and optimized images.
6. Review listing status; correct rejected or inactive listings before republishing.
7. Maintain inventory promptly. Pause listings that cannot be fulfilled.
8. Review incoming orders, accept/process them, and update fulfillment/tracking status at each real-world milestone.
9. Monitor sales, earnings, commission, stock, and analytics dashboards.
10. Reconcile payouts/orders daily and escalate payment discrepancies with order/payment IDs, never card or secret data.

### Admin Workflow

1. Sign in with a dedicated named admin account; never share credentials.
2. Review dashboard health indicators and outstanding fraud, seller, product, feedback, and order queues.
3. Verify seller documents and bank/business data using approved client policy. Approve, reject with a reason, or suspend as appropriate.
4. Moderate listings for prohibited content, correctness, image quality, pricing anomalies, and seller ownership.
5. Manage categories and user status carefully; record the business reason for suspension or status changes.
6. Review orders, payment states, webhook outcomes, refunds, commissions, and gateway settlements daily.
7. Investigate fraud alerts before acting; retain an audit trail and use least privilege.
8. Review feedback/reviews and resolve or moderate them under published policy.
9. Check operational dashboards: Render health/logs, Vercel deployments, database capacity/backups, gateway webhooks, API quotas, and alerts.
10. Escalate incidents using Section 11 and document every recovery or configuration change.

---

## 7. Maintenance Guide

### Database Backup

**Recommended baseline:** managed MySQL automated daily backups, point-in-time recovery where the plan supports it, 30-day retention, encrypted off-provider copy, and a monthly restore test.

1. Enable automated backups in the selected MySQL provider before go-live.
2. Record timezone, schedule, retention, encryption, region, and responsible owner.
3. Take an on-demand snapshot before migrations or risky releases.
4. Export a logical backup with a least-privilege backup account when an off-provider copy is required.
5. Store backups encrypted in client-controlled storage; restrict and log access.
6. Restore into an isolated non-production database monthly, run row-count/integrity checks and application smoke tests, then record RTO/RPO achieved.
7. Never test a restore over the production database.

### Log Monitoring

- Primary sources: Render deployment/runtime logs, application console/file logs, Vercel deployment/function logs, MySQL logs/metrics, Razorpay webhook logs, and third-party quota dashboards.
- Health checks: `/actuator/health`; metrics: `/actuator/metrics` and `/actuator/prometheus`. Restrict detailed health/metrics from public access.
- Alert at minimum on: 5xx rate, failed health checks, restart loops, high latency, JVM memory, DB connections/storage/CPU, backup failure, payment webhook failure, email failure, and API quota exhaustion.
- Production log levels should be `INFO`/`WARN`; the checked-in base config enables verbose application/web/Hibernate logging and must be overridden to avoid sensitive/noisy logs.
- Set log retention and redact tokens, passwords, payment signatures, personal data, and message bodies. Current notification logging should be reviewed because it logs recipient/content.

### Server Restart

1. Confirm database and third-party status; capture current deployment ID and recent logs.
2. Prefer Render's controlled restart/redeploy of the last known-good image. Avoid deleting/recreating the service.
3. Watch startup logs for environment validation and database errors.
4. Verify `/actuator/health`, one public GET endpoint, authenticated login, and database read/write.
5. Verify WebSocket connection and one staging notification/payment smoke test where appropriate.
6. If restart fails, roll back to the last known-good deployment and follow Section 11.

### Environment Variable Updates

1. Open a change ticket and obtain approval.
2. Update only the target environment in Render/Vercel; never edit secrets into repository files.
3. Vercel `VITE_*` changes require a new frontend build/deployment.
4. Backend variable changes require restart/redeploy.
5. Validate health, CORS, login, and the feature affected by the variable.
6. Record the change without recording the value.

### API Key Rotation

1. Create a second/new credential where the provider supports overlap.
2. Apply correct scopes, IP/referrer restrictions, quotas, and alerts.
3. Update staging and validate, then update production during a change window.
4. Redeploy/restart and run provider-specific smoke tests.
5. Revoke the old key only after successful validation and webhook/traffic confirmation.
6. Record owner, date, reason, and next rotation date. Rotate immediately after suspected exposure or staff/vendor offboarding.

### Release and Schema Maintenance

- Add CI that runs `npm run build` and `mvnw test` on pull requests and protected branches.
- Use immutable release tags and retain last known-good artifacts.
- Choose Flyway as the production schema authority, validate `V1__init_schema.sql`, enable it deliberately, and change Hibernate to `ddl-auto: validate`/`none` for production. Never combine uncontrolled `update` with claimed migration governance.
- Apply schema migrations once per release, back up first, and document rollback/forward-fix procedure.

---

## 8. Security Guide

### Password Policies

- Current API validation enforces a minimum of 8 characters and BCrypt storage.
- Production policy should require 12+ characters/passphrases, block common/compromised passwords, rate-limit login, and avoid forced periodic rotation unless compromise is suspected.
- Require MFA for Vercel, Render, GitHub, database, Razorpay, Cloudinary, Google Cloud, DNS, SMTP, and all admin/operator accounts.
- Use named accounts; prohibit shared admin credentials. Remove access immediately on offboarding.

### JWT Usage

- The backend is stateless and signs JWTs with HMAC; configured access lifetime is 24 hours and refresh lifetime is 7 days.
- Keep `JWT_SECRET` server-side, high entropy, unique per environment, and rotate after exposure. Rotation invalidates existing tokens unless a key-version strategy is implemented.
- Frontend currently reads the token from `localStorage`, which increases impact of XSS. Prioritize CSP/XSS hardening and consider secure, `HttpOnly`, `SameSite` cookies in a future security change.
- Enforce HTTPS only. Do not place tokens in URLs or logs.
- Logout is not a server-side revocation mechanism unless token denylisting/versioning is added.

### Seller Verification

- Admin approval/rejection/status controls and verification UI exist.
- Client must define acceptable KYC/business documents, reviewer authority, evidence retention, rejection reasons, re-verification interval, appeal process, and privacy/deletion policy.
- Verify business identity, tax details, bank account ownership, location, prohibited categories, and duplicate/fraud indicators before approval.
- Sensitive KYC/bank data requires encryption, masking, restricted access, audit logs, and retention controls. Do not use ordinary product-image storage policy for identity documents without a formal review.

### Payment Security

- Card/UPI credentials must be collected by Razorpay, not Smart Krishi servers.
- Backend derives payment amount from the stored order, creates a Razorpay order, verifies checkout signatures, verifies webhook HMAC, and restricts refunds/admin actions.
- Use live keys only in production, validate webhook replay/idempotency behavior, and reconcile application records against Razorpay settlements daily.
- Never log keys, signatures, full gateway payloads with personal data, card data, OTPs, or bank credentials.
- Confirm applicable Razorpay requirements, KYC, refund policy, tax invoicing, and PCI responsibilities with the client/payment provider.

### API Key Protection

- Backend keys belong only in the hosting secret store. Restrict access by role and audit changes.
- `VITE_GOOGLE_MAPS_API_KEY` is public by design; protect it with exact HTTPS referrer and API restrictions, quota, and billing alerts.
- Use separate keys/projects for frontend/backend and staging/production.
- Enable secret scanning and branch protection. Do not commit `application-prod.yml`, `.env`, logs, or exported dashboards containing values.
- Review Swagger, Actuator, health detail, CORS, and WebSocket exposure before launch. Public production Swagger should be disabled or access-controlled.

---

## 9. Known Limitations

### Pending Features / Delivery Gaps

- Live deployment, URLs, DNS, SSL, and provider ownership are unconfirmed.
- The ignored/untracked production Spring profile prevents reproducible Git-based production configuration.
- SMTP configuration namespaces do not align; real email delivery is not proven.
- SMS, WhatsApp, and push notification services only log; they do not call providers.
- Reports, weather advisories, payment methods/settings, app settings, help/FAQ, and some admin/settings screens include placeholder/generic UI behavior.
- `frontend/src/data/mockData.js` exists but is currently not imported; remove or clearly quarantine before future work to avoid accidental production use.
- No automated CI/CD workflow is present in `.github/workflows`.
- No end-to-end browser, live gateway, load, accessibility, disaster-recovery, or penetration-test evidence is present.
- Backend unit tests pass but mocked notification dependencies produce caught `NullPointerException` log noise; tests do not fail because notification errors are swallowed.
- Frontend has no test script/test suite in `package.json`.
- Service worker/offline behavior requires UAT; transactional operations should never imply success while offline unless a durable sync design exists.

### Configuration and Documentation Conflicts

- Deployment documentation says Flyway automatically migrates; tracked base configuration disables Flyway.
- Tracked base configuration uses Hibernate `ddl-auto: update`, unsuitable as an uncontrolled production migration process.
- Deployment documentation names production database variables, but those mappings live only in the ignored local production profile.
- Base configuration uses fixed DB URL/user and `DB_PASSWORD`; production guide uses `DATABASE_*`.
- Base server port is fixed at `8080`; dynamic `PORT` mapping is only in the ignored profile.
- README/deployment/architecture completion claims are not proof of a live production deployment.

### Future Enhancements

- Implement real SMS/WhatsApp/push providers with consent, delivery status, retry, opt-out, and cost controls.
- Add MFA for admin/seller, session/device management, token revocation/rotation, login throttling, and account recovery.
- Add CI/CD, dependency/security scanning, SAST/DAST, browser E2E, accessibility, contract, load, and resilience tests.
- Add mature audit trail, centralized structured logs, tracing, error tracking, dashboards, paging, and SLOs.
- Add inventory reservation, payment/order idempotency keys, dead-letter/retry handling, and formal settlement reconciliation.
- Optimize large images and main JavaScript bundles; add CDN/cache policy and performance budgets.

### Scalability Notes

- Current backend is a single Spring Boot service with MySQL and in-process/simple caching. Horizontal scale requires stateless WebSocket strategy/shared broker, shared cache, coordinated jobs, and externalized file storage.
- Hikari pool is configured up to 20 connections per instance; total connections multiply with replicas. Size against database limits.
- Container-local `uploads/` and log files are ephemeral and instance-specific. Use Cloudinary and centralized logs.
- Add database indexes based on measured queries, slow-query monitoring, pagination, connection/load testing, and read replicas only when evidence justifies them.
- Redis is architectural intent, not a proven current runtime dependency.
- Establish capacity thresholds for API latency, concurrent WebSockets, order volume, image bandwidth, weather/maps quotas, and payment webhooks before scaling.

---

## 10. Client Checklist

### Before Go Live

- [ ] Domain Connected
- [ ] SSL Enabled and HTTPS redirect/HSTS verified
- [ ] Database Running over TLS with least-privilege user
- [ ] Payment Gateway Activated and live KYC/settlement account verified
- [ ] Weather API Active with quota alerts
- [ ] Maps API Active with API/referrer/IP restrictions and billing alerts
- [ ] Backups Configured and restore test evidenced
- [ ] Monitoring Enabled with named on-call recipients

### Delivery Acceptance Addendum

- [ ] Frontend URL, backend URL, database provider, region, and all domains recorded in Section 3
- [ ] Client owns GitHub, Vercel, Render, database, DNS, Razorpay, Cloudinary, OpenWeather, Google Cloud, and SMTP accounts
- [ ] At least two client recovery administrators have tested MFA access
- [ ] Production configuration is tracked without secrets and `application-prod.yml` issue is resolved
- [ ] Production migration strategy is tested; Flyway/Hibernate conflict is resolved
- [ ] All required/conditional variables in Section 4 are configured and masked
- [ ] CORS allows only approved production/staging origins
- [ ] SMTP test email succeeds; SPF, DKIM, and DMARC are checked
- [ ] Razorpay create, success, failure, webhook, refund, duplicate, and reconciliation cases pass UAT
- [ ] Buyer, seller, and admin UAT scripts pass with signed acceptance
- [ ] Seller verification/privacy policy and payment/refund terms are approved
- [ ] Monitoring alerts, support contacts, severity matrix, SLA, RTO, and RPO are approved
- [ ] Rollback and database recovery rehearsal completed
- [ ] Vulnerability/dependency scan and security review completed with no unresolved critical/high findings
- [ ] Legal pages, privacy/consent, retention, tax, marketplace, and support policies are approved by client counsel/business owner

---

## 11. Support Information

### Support Register

| Role | Named Contact | Channel | Responsibility |
|---|---|---|---|
| Client Product Owner | **TBC** | **TBC** | Business decisions, priority, acceptance |
| Client Technical Owner | **TBC** | **TBC** | Account access, architecture, change approval |
| Operations / On-Call | **TBC** | **TBC** | Monitoring, incident response, restart/rollback |
| Payment Escalation | **TBC** | **TBC** | Razorpay settlement/refund cases |
| Database Escalation | **TBC** | **TBC** | Backup, restore, performance, availability |
| Delivery Vendor | **TBC** | **TBC** | Warranty scope and defect resolution |

Do not place credentials, JWTs, API keys, full payment data, KYC documents, or database exports in support messages. Use incident IDs and masked user/order/payment identifiers.

### First Response Troubleshooting

1. Record UTC/local time, environment, URL, user role, affected order/payment ID, steps, expected/actual behavior, and correlation/request ID if available.
2. Check provider status pages and recent deployment/change history.
3. Check Vercel deployment, Render health/restarts, `/actuator/health`, database availability/connections/storage, and third-party quotas.
4. Reproduce in staging where possible; do not experiment on production data.
5. Preserve logs/evidence with secrets and personal data redacted.
6. Classify severity: P0 security/data loss/payment integrity/outage; P1 major workflow; P2 partial/degraded; P3 cosmetic/question.
7. Use rollback for release regressions; use provider recovery for infrastructure failure; never manually alter payment/order state without approved reconciliation.

### Common Errors

| Symptom | Likely Cause | Resolution |
|---|---|---|
| Frontend loads but API calls use localhost/fail | Missing or incorrect `VITE_API_BASE_URL`; frontend not rebuilt | Set full HTTPS URL ending `/api`, redeploy frontend, inspect browser network calls |
| Browser shows CORS error | Frontend origin absent from `CORS_ALLOWED_ORIGINS` | Add exact scheme/host, restart backend, retest preflight; never use broad wildcard with credentials |
| Backend fails on prod startup | Missing/placeholder required variable or ignored production mappings | Inspect first startup error; deliver tracked mappings and configure variables; do not disable validator |
| Backend cannot connect to database | Wrong JDBC URL/user/password, TLS/network rule, DB paused, connection limit | Test provider health/network, credentials, TLS, capacity; rotate credential if needed |
| Tables differ/missing | Flyway disabled and/or uncontrolled Hibernate update | Stop writes if integrity risk; snapshot DB; compare migration history/schema; execute approved migration plan |
| Login returns 401 | Wrong credentials, expired/invalid token, changed JWT secret, disabled user | Re-login; check user status and server logs; confirm secret consistency; use recovery flow |
| User gets 403 | Correct authentication but wrong role/ownership/status | Confirm user roles and seller verification; do not bypass authorization |
| Upload fails | Cloudinary credentials/quota, file >10 MB, unsupported content, network failure | Check masked config/quota and file policy; retry safe upload; do not rely on container local storage |
| Weather fails | OpenWeather key/quota/network/location problem | Check provider response/quota/key and backend logs/cache; degrade UI gracefully |
| Map blank/autocomplete unavailable | Missing key, API/billing disabled, wrong referrer restriction | Check browser console, enabled APIs, billing, correct frontend key restrictions |
| Email is only simulated/not delivered | SMTP variables mapped to wrong Spring namespace, sender not verified, provider rejection | Correct `spring.mail.*` mapping, verify sender/DNS, inspect SMTP/provider logs, send staging test |
| SMS/WhatsApp/push appears sent but user receives nothing | Current implementations are logging stubs | Treat channel as unavailable until a provider integration is delivered |
| Razorpay checkout creation fails | Wrong mode/key, inactive account, network/API error | Confirm account activation and matching live/test keys; inspect gateway/backend logs; never fabricate success |
| Payment completed but order remains pending | Webhook URL/signature failure, delayed event, verification failure | Check Razorpay event delivery and app payment record; replay signed webhook if supported; reconcile before approved update |
| Duplicate charge/order concern | User retry/timeouts or insufficient idempotency | Stop further retries, search gateway by payment/order/receipt, reconcile; refund only through approved workflow |
| WebSocket tracking/notifications fail | Incorrect derived WS host, proxy upgrade issue, instance/local-session limitation | Inspect WS handshake, HTTPS/WSS URL, Render proxy logs; validate scale topology |
| High latency/5xx | DB saturation, external API latency, JVM pressure, connection exhaustion | Check Actuator/hosting/DB metrics, slow queries and recent changes; scale only after bottleneck is identified |

### Recovery Procedures

#### Failed Application Deployment

1. Freeze further deployments and capture failed release logs.
2. Roll back Vercel/Render to the last known-good deployment.
3. Verify health, public browse, login, and a read-only admin check.
4. If a schema change occurred, do not blindly downgrade. Restore/forward-fix according to the approved migration plan.
5. Open incident/postmortem and fix in staging before retry.

#### Database Outage or Corruption

1. Declare P0; disable/maintenance-mode write traffic if data integrity is uncertain.
2. Confirm provider status and preserve current instance/snapshot.
3. Identify last consistent backup/PITR timestamp and business-approved recovery point.
4. Restore to a new isolated instance, validate schema, row counts, critical orders/payments/users, and application smoke tests.
5. Switch the application connection during an approved window; monitor closely.
6. Reconcile Razorpay events/orders created around the recovery gap.
7. Record actual RPO/RTO and complete root-cause review.

#### Compromised API Key or JWT Secret

1. Declare security incident, restrict access, and preserve audit evidence.
2. Create and deploy replacement credential using the rotation process.
3. Revoke the exposed key. For `JWT_SECRET`, force all users to authenticate again.
4. Review provider usage, logs, billing, repository history, CI logs, and access list for abuse.
5. Notify affected stakeholders under the approved incident/privacy process.

#### Payment Incident

1. Prevent additional risky retries; keep storefront messaging factual.
2. Compare Smart Krishi order/payment records with Razorpay order, payment, webhook, refund, and settlement records.
3. Do not mark a payment successful solely from a screenshot or client callback; require verified gateway evidence.
4. Replay valid webhooks or perform an approved idempotent reconciliation job/process.
5. Issue refunds only through Razorpay/admin-authorized workflow and record the reason.
6. Confirm customer communication and settlement reconciliation before closure.

#### Third-Party API Outage

1. Confirm provider status/quota and isolate whether the failure is credentials, network, billing, or service outage.
2. Preserve core marketplace operation where safe; display degraded-state messaging for maps/weather/notifications.
3. Do not bypass payment signature checks or seller authorization to restore availability.
4. Monitor recovery, run smoke tests, and close the incident with impact/duration recorded.

---

## Verification Record

The following checks were run during preparation of this handover:

| Check | Result |
|---|---|
| Frontend `npm run build` | **Passed**; Vite production bundle generated successfully |
| Backend `mvnw.cmd test` | **Passed**; 47 tests, 0 failures/errors/skips |
| Git deployment workflow | **Not present** under `.github/workflows` |
| Live frontend/backend check | **Not possible**; URLs not recorded |
| Database backup/restore test | **Not evidenced** |
| Live Razorpay/SMTP/maps/weather test | **Not evidenced** |

Passing builds/tests demonstrate compilation and covered unit/service behavior only. They do not replace staging UAT, production configuration validation, load/security testing, or disaster-recovery proof.

## Handover Sign-Off

| Party | Name | Date | Signature/Approval Reference |
|---|---|---|---|
| Client Product Owner |  |  |  |
| Client Technical Owner |  |  |  |
| Delivery Lead |  |  |  |
| Operations Owner |  |  |  |

Signing confirms receipt of repository access, provider accounts, masked configuration register, operational procedures, known limitations, support terms, and the outstanding go-live actions in this document.
