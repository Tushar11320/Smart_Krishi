# Smart Krishi Marketplace - Client Setup and Operations Guide
## Production Release & Post-Delivery Handover Manual

---

## SECTION 1: PROJECT OVERVIEW

### What Smart Krishi Marketplace Is
Smart Krishi Marketplace is an agricultural e-commerce platform and Progressive Web Application (PWA). It connects farmers, agricultural merchants, and consumers to trade crops, fertilizers, milk, machinery rentals, and building materials. The platform bridges the gap between rural sellers and urban buyers, providing features such as real-time pricing telemetry, weather alerts, Google Maps location tracking, and secure online payments.

---

### Key Feature Directory

#### 1. Buyer Features
* **Authentication**: Email/password registration and Google OAuth Single-Sign-On (SSO).
* **Browsing**: Category filtering, keyword search, and location-aware nearby product discovery.
* **Shopping Cart**: Real-time price calculation, tax computation, and "Save for Later" wishlists.
* **Direct Checkout**: Payment sheet with UPI, Debit/Credit Card, Net Banking, and Mobile Wallets.
* **Order Tracking**: Interactive tracking panel with route visualization via Google Maps.
* **Reviews**: Product and seller rating forms with moderation workflows.
* **Weather & Advisories**: Real-time localized forecast dashboards showing crop and heavy rainfall alerts.



#### 2. Seller Features
* **Seller Application**: Registration form for tax, business identity, bank details, and coordinates.
* **Inventory Management**: Inventory tables with controls to add, edit, and toggle active listings.
* **Fulfillment Management**: Operations page to update order statuses (e.g. ACCEPTED, SHIPPED, DELIVERED).
* **Seller Analytics**: Earnings telemetry showing monthly revenue, order counts, and product analytics.
* **Asset Uploads**: Photo attachments managed via secure backend-proxied Cloudinary uploads.



#### 3. Administrative Features
* **Admin Verification Console**: Portal to approve, reject, or suspend seller applications.
* **Moderation Console**: Management tools for user bans, product moderations, and review deletions.
* **Analytics**: Core dashboards tracking total transactions, platform fees, and tax disbursements.

---

## SECTION 2: SYSTEM REQUIREMENTS


### Minimum Server Requirements (Backend REST API)
* **Processor**: Dual-Core 2.0 GHz CPU (64-bit AMD/Intel) or ARM equivalents (e.g. AWS Graviton).
* **RAM**: 2 GB Minimum (4 GB Recommended to comfortably accommodate JVM heap allocation).
* **Disk Space**: 10 GB of solid-state storage (SSD) for logging, caching, and local files.
* **Bandwidth**: 100 Mbps connection with a static IP or dynamic DNS mapping.


### Operating Systems
* **Windows**: Windows 10/11 or Windows Server 2019/2022.
* **Linux**: Ubuntu 20.04/22.04 LTS, Red Hat Enterprise Linux 8/9, or Alpine Linux (in containers).
* **Cloud Deployment**: Render Web Services, AWS Elastic Beanstalk, Heroku, or GCP App Engine.

---

## SECTION 3: ACCOUNTS REQUIRED

To operate the production environment, the client must establish ownership of the following accounts:

| Service / Account | Purpose | Billing Info & Quotas | Estimated Cost (USD/Month) |
| :--- | :--- | :--- | :--- |
| **Google Cloud Project** | Authenticates SSO and powers Maps/Places/Directions APIs. | Pay-as-you-go. Google gives a $200 free credit monthly (approx 28,000 map loads). | **$0.00** (under free tier limits) |
| **Vercel Account** | Hosts the compiled React 19 SPA frontend. | Free Hobby tier. Pro plan costs $20/month for team features. | **$0.00** (Hobby Plan) |
| **Render Account** | Hosts the Java 21 Spring Boot Backend Docker container. | Individual instance starts at $7/month (starter tier). | **$7.00 - $15.00** |
| **Aiven (or managed MySQL)** | Managed database cluster running MySQL 8. | Free sandbox tier available. Startup plans start at $9/month. | **$9.00** |
| **Cloudinary Account** | Hosts and optimizes user and product images. | Free tier offers 25 Credits (approx 25,000 images or 25 GB storage). | **$0.00** (Free Tier) |
| **Razorpay Business** | Validates checkouts, processes payments, and routes refunds. | No setup fees. 2.0% transaction fee on standard cards/UPI. | **$0.00** (Transaction percentage only) |
| **OpenWeatherMap** | Feeds the Farmer Advisory weather forecasts. | Free tier permits 1,000 calls/day. One Call API 3.0 starts at $0.0015/call. | **$0.00** |
| **SMTP Service (e.g., SendGrid)**| Delivers email registration OTPs. | SendGrid Free tier allows 100 emails/day. Starter plan is $19.95/month. | **$0.00 - $20.00** |
| **GitHub Account** | Private source code custody and Git-based CD hooks. | Free private repositories for unlimited users. | **$0.00** |

---

## SECTION 4: THIRD PARTY APIS

| Service | Purpose | Required | Account Owner | Renewal Needed | Monthly Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Maps JS API** | Renders maps on buyer tracker | Yes | Client | Annual (Automatic) | Pay-as-you-go |
| **Google Directions API**| Traces route distances | Yes | Client | Annual (Automatic) | Pay-as-you-go |
| **Google Places API** | Address autocomplete | Yes | Client | Annual (Automatic) | Pay-as-you-go |
| **Google OAuth 2.0** | Secure social login | Yes | Client | None | Free |
| **OpenWeather API** | Current weather telemetry | Yes | Client | Annual (Automatic) | Pay-as-you-go |
| **Cloudinary Media** | Photo host uploads | Yes | Client | Annual (Automatic) | Pay-as-you-go |
| **Razorpay Gateway** | Customer checkouts | Yes | Client | None | Transaction percentage |
| **SMTP Mail Gateway** | Registration OTP emails | Yes | Client | Annual | Subscription based |

---

## SECTION 5: ENVIRONMENT VARIABLES

### Frontend Variables (Vercel)

| Variable Name | Purpose | Example Value | Required |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Endpoint path pointing to backend `/api` | `https://api.smartkrishi.com/api` | Yes |
| `VITE_GOOGLE_MAPS_API_KEY` | Public Google Maps client-side key | `AIzaSyCsXyz...` | Yes |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID for GIS buttons | `95917657297-...apps.googleusercontent.com` | Yes |

### Backend Variables (Render)

| Variable Name | Purpose | Example Value | Required |
| :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `prod` | Yes |
| `DATABASE_URL` | MySQL JDBC Connection URL | `jdbc:mysql://mysql-svc:12174/defaultdb` | Yes |
| `DATABASE_USERNAME` | MySQL Database user identifier | `avnadmin` | Yes |
| `DATABASE_PASSWORD` | MySQL Database authentication token | `AVNS_...` | Yes |
| `JWT_SECRET` | 512-bit HS512 JWT Signature Secret | `JWT_SECRET_REDACTED` | Yes |
| `CORS_ALLOWED_ORIGINS` | Whitelisted frontend host domains | `https://smartkrishi.com` | Yes |
| `RAZORPAY_KEY_ID` | Razorpay public Key ID | `rzp_live_abc123` | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay private Secret | `secret123abc` | Yes |
| `RAZORPAY_WEBHOOK_SECRET` | Signature token for inbound hook verifications| `webhook_secret_xyz` | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary target tenant | `dcnsz5l9v` | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary access key | `CLOUDINARY_KEY_REDACTED` | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary upload secret token | `CLOUDINARY_SECRET_REDACTED` | Yes |
| `OPENWEATHER_API_KEY` | OpenWeatherMap auth key | `OPENWEATHER_KEY_REDACTED` | Yes |
| `GOOGLE_MAPS_API_KEY` | Server-side Google Maps API key | `GOOGLE_MAPS_KEY_REDACTED` | Yes |
| `MAIL_HOST` | Transactional email provider host address | `smtp.sendgrid.net` | Yes |
| `MAIL_PORT` | Transactional email port (TLS) | `587` | Yes |
| `MAIL_USERNAME` | SMTP authorization account | `apikey` | Yes |
| `MAIL_PASSWORD` | SMTP API key or password | `SMTP_PASSWORD_REDACTED` | Yes |

---

## SECTION 6: DEPLOYMENT GUIDE

### Step 1: Deploy Database
1. Provision a MySQL 8 server on a cloud provider (e.g. Aiven or AWS RDS).
2. Create a clean database schema named `defaultdb` (or `smartkrishi`).
3. Retain the database connection host, port, username, and password.

### Step 2: Deploy Backend (Render)
1. Log in to Render and create a **Web Service**.
2. Connect the Git repository and select the subfolder `backend` or use the root directory Dockerfile.
3. Choose **Docker** as the Runtime.
4. Add all environment variables listed in Section 5 in the Render Environment tab.
5. Deploy. The backend will boot, run database initialization scripts, and expose a secure HTTPS URL.

### Step 3: Deploy Frontend (Vercel)
1. Log in to Vercel and import the Git repository.
2. Select `frontend` as the root directory.
3. Choose **Vite** as the framework preset.
4. Input all frontend variables in the Environment variables tab.
5. Click **Deploy**. Vercel will compile the assets and serve them on a secure HTTPS subdomain.

### Step 4: Configure Domain and HTTPS
1. Map your custom domain names (e.g. `smartkrishi.com` and `api.smartkrishi.com`) to Vercel and Render in your DNS registrar (e.g. GoDaddy or Cloudflare).
2. Both Vercel and Render automatically provision and renew Let's Encrypt SSL certificates, securing all traffic via HTTPS.

---

## SECTION 7: HOW TO RUN LOCALLY

### Prerequisites
Install the following dependencies on your developer computer:
* **Java SDK**: Version 21 (LTS).
* **Node.js**: Version 18 or newer (comes with `npm`).
* **Maven**: Version 3.8+ (or use the packaged wrapper `./mvnw`).
* **MySQL Server**: Version 8.0.

### 1. Database Setup
Log in to your local MySQL CLI or MySQL Workbench and run:
```sql
CREATE DATABASE defaultdb;
```

### 2. Run Backend
Navigate to the `backend/` directory in your terminal:
```bash
# Set local variables
$env:SPRING_PROFILES_ACTIVE="dev"
$env:JWT_SECRET="404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
$env:DB_PASSWORD="YourLocalMySQLPassword"

# Run Spring Boot
.\mvnw.cmd spring-boot:run
```

### 3. Run Frontend
Navigate to the `frontend/` directory in your terminal:
```bash
# Install local packages
npm install

# Launch developer live-reload server
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

---

## SECTION 8: ADMIN OPERATIONS GUIDE

### User and Seller Management
1. Log in to the Admin Dashboard using admin credentials.
2. Navigate to the **User Management** section to review user records, freeze active accounts, or restore suspended users.
3. Access the **Seller Applications** panel to review business documents (GSTIN/business registration proofs). Approve applications to activate the seller's storefront or reject with specific feedback.

### Products and Orders Oversight
1. Select **Product Moderation** to review listings reported for pricing errors or prohibited products. Toggle visibility to suspend listings.
2. Open the **Order Logs** to view order progressions, tracking updates, and delivery timestamps.

### Payments, Refunds, and Webhooks
1. Open the **Payment Logs** tab to match Smart Krishi transaction records against Razorpay payment states (`SUCCESS`, `PENDING`, `FAILED`).
2. To issue refunds for cancellations, click **Process Refund**. The server makes a secure call to Razorpay to refund the transaction.

---

## SECTION 9: SELLER GUIDE

### Onboarding
1. Sign up on the marketplace and select **Apply as Seller**.
2. Fill out the shop name, business address, and bank/UPI payment information. Upload registration documentation and select coordinates using the map.
3. Once approved by the administrator, the seller portal will unlock.

### Shop Operations
1. **Add Products**: Go to the Inventory panel, click **Add Product**, enter pricing, upload photos (saved to Cloudinary), and specify stock quantities.
2. **Order Fulfillment**: Review incoming notifications for orders. Click **Accept Order** once verified. Package the items, ship them, and update the status to **SHIPPED** to send live updates to the buyer.

---

## SECTION 10: BUYER GUIDE

### Account Registration and SSO
1. Click **Sign Up** to create an account, or select **Continue with Google** to register instantly.
2. Update delivery addresses in the account settings page.

### Ordering and Payments
1. Browse products, add items to the cart, and proceed to checkout.
2. Choose **Pay Now** to open the payment modal. Select a payment option (UPI, Credit/Debit card, Net Banking, or Wallet) and complete the secure transaction.
3. Monitor fulfillment from the **Track Order** panel.

---

## SECTION 11: BACKUP PROCEDURES

### 1. Database Backups
* **Automatic Cloud Backups**: Configure Aiven/AWS RDS to trigger daily snapshots with a 30-day retention period.
* **Manual Backups**: To export a backup before major updates, run:
  ```bash
  mysqldump -h <host> -u <user> -p --databases defaultdb > backup_file.sql
  ```

### 2. Image Assets (Cloudinary)
All listings and avatars reside in Cloudinary. No local server storage backup is required. Enable Cloudinary's built-in **Backup and Versioning** feature in the Cloudinary Console to protect media files.

### 3. Restore Procedures
To restore the database from a backup file:
```bash
mysql -h <host> -u <user> -p defaultdb < backup_file.sql
```

---

## SECTION 12: MAINTENANCE PROCEDURES

### Security Key Rotation
* **JWT Secret**: Rotate the secret annually. Replacing `JWT_SECRET` in the env variables will instantly invalidate active browser sessions, requiring users to log in again.
* **API Keys**: If a key (OpenWeather, Google Cloud, Cloudinary) is compromised, generate a replacement key in the service provider's console, update the backend environment variables, and delete the compromised key.

### Domain and SSL Renewals
* Domains must be renewed annually at the registrar.
* Vercel and Render manage SSL certificates automatically; no manual SSL renewal is required.

---

## SECTION 13: COMMON ISSUES

| Symptom | Probable Cause | Action |
| :--- | :--- | :--- |
| **Backend fails to start** | Missing environment variable in Render | Check the Render deployment logs for missing key validations. |
| **Database connection failed**| Incorrect JDBC URL or closed firewall ports | Verify database host coordinates and confirm that Render's egress IP is whitelisted on the database server. |
| **Google Login fails** | Mismatched Authorized Origins in GCP | Update the Authorized JavaScript Origins in GCP Credentials Console to match the production frontend domain. |
| **Payments fail** | Mock credentials active in production environment | Confirm that live Razorpay API keys (`rzp_live_...`) are mapped to the server environment variables. |
| **Images do not load** | Invalid Cloudinary credentials | Check the Cloudinary configuration properties on the server. |

---

## SECTION 14: SECURITY GUIDE

1. **Authentication Controls**: spring Security BCrypt hashes user passwords. The server enforces a minimum password length of 8 characters.
2. **Key Security**: Never commit api keys, passwords, or secrets to Git. Maintain variables exclusively in secure environments (Vercel/Render).
3. **Data Security**: Secure all communication channels with TLS (HTTPS/WSS) in production.
4. **Least-Privilege Database Management**: Ensure the database user account used by the Spring Boot application possesses permissions only for DML operations on the application database schema.

---

## SECTION 15: GO LIVE CHECKLIST

* [ ] Database instance online and running over TLS.
* [ ] Spring Boot backend deployed to Render with `SPRING_PROFILES_ACTIVE=prod`.
* [ ] React frontend deployed to Vercel with HTTPS.
* [ ] Razorpay account activated and set to live mode.
* [ ] Weather API configured.
* [ ] Google Maps client and server keys configured.
* [ ] SMTP service configured.
* [ ] Google Client ID configured in GCP console and mapped in env.
* [ ] Automated database backups enabled.

---

## SECTION 16: CLIENT HANDOVER PACKAGE

Upon completion, the client must receive the following assets:
1. **Source Code Repository**: Transfer of ownership for the GitHub repository.
2. **Production URL Register**: Live URLs for the Vercel frontend and Render backend.
3. **Environment Reference Register**: Masked lists of all environment variables.
4. **Administrative Credentials**: Login credentials for the default admin user.
5. **API Provider Access**: Recovery credentials for Google Cloud, Razorpay, Cloudinary, OpenWeather, and SMTP accounts.
