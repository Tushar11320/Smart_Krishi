# Smart Krishi Marketplace - Handover Checklist
## Final Project Handover and Client Acceptance Sign-off

---

## 1. Deliverables Checklist

The following items must be verified, signed off, and transferred to the client prior to final project completion:

### 1. Repository and Source Code
* [ ] Transfer of primary ownership for the GitHub repository (`rhythmgupta19/Smart_Krishi`).
* [x] Verification that all dead code, duplicates, and temporary folder bloat (~87 MB) have been deleted.
* [x] Verification of root [.gitignore](file:///PROJECT_ROOT/.gitignore) enforcing isolation of build targets and backup files.

### 2. Live Hosting Environments
* [ ] Vercel account ownership transferred to the client (Frontend deploy environment).
* [ ] Render account ownership transferred to the client (Backend container service environment).
* [ ] Aiven or cloud MySQL server billing profiles and user accounts transferred.
* [ ] Custom apex domain and API subdomain DNS configurations confirmed active.

### 3. API Accounts & Keys
* [ ] Google Cloud Platform Console billing profile and API key restrictions configured.
* [ ] Cloudinary account access transferred to the client.
* [ ] Razorpay Merchant Dashboard access and active webhook configurations verified.
* [ ] OpenWeatherMap API account credentials transferred.
* [ ] SMTP Transactional Email account credentials transferred.

### 4. Admin Credentials
* [ ] Default Administrator Login: `admin@smartkrishi.com` (Requires password reset at first sign-in).
* [ ] Default Merchant Manager Login: `seller@smartkrishi.com` (Requires password reset at first sign-in).

---

## 2. Configuration Approval

| Section | Component Checked | Mapped Environment Variables | Status |
| :--- | :--- | :--- | :--- |
| **Database** | MySQL 8 Managed Instance | `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | [ ] Approved |
| **Authentication** | Google OAuth & JJWT | `GOOGLE_CLIENT_ID`, `JWT_SECRET` | [ ] Approved |
| **Payments** | Razorpay Live Gateway | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | [ ] Approved |
| **Images** | Cloudinary API | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | [ ] Approved |
| **Weather** | OpenWeather API | `OPENWEATHER_API_KEY` | [ ] Approved |
| **Maps** | Google Maps JS SDK | `VITE_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_API_KEY` | [ ] Approved |
| **Notifications** | SMTP Email Provider | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | [ ] Approved |

---

## 3. Maintenance Sign-Off

* [ ] Daily database automated backup snapshots schedule verified.
* [ ] Automated SSL renewal checks on Vercel and Render verified.
* [ ] Health endpoint (`/actuator/health`) monitoring schedule confirmed.
* [ ] Recovery playbook rehearsed (including backup database restoration scripts).

---

## 4. Handover Signatures

We hereby sign off on the delivery of the Smart Krishi Marketplace platform, source repositories, documentation, and cloud configuration variables:

```
For the Client:
Name: _______________________________
Title: ______________________________
Date: _______________________________
Signature: __________________________

For the Delivery Vendor:
Name: Antigravity Solutions
Title: Lead Handover Coordinator
Date: 02 July 2026
Signature: __________________________
```
