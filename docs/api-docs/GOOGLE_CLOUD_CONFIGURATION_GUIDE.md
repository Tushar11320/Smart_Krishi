# Google Cloud Console Configuration Guide
**Project:** Smart Krishi Marketplace  
**Domain:** Google Cloud Platform Integration  
**Scope:** Developer ConsoleSetup & Credentials Provisioning

This manual details the exact Google Cloud Console configurations required to deploy and maintain the Smart Krishi Marketplace application.

---

## 1. Google APIs Library Checklist

Ensure that the following Google APIs are explicitly enabled inside your Google Cloud Project:

### 🌐 Google Maps Suite
- [x] **Maps JavaScript API** (Powers client-side interactive maps, marker placements, and route render overlays).
- [x] **Places API** (Enables postal address autocomplete input fields on customer checkouts).
- [x] **Geocoding API** (Resolves street addresses to latitude/longitude coordinates on the backend).
- [x] **Directions API** (Traces driving directions, routes, mileage, and travel time logs between farmers and buyers).

### 🔑 Authentication Suite
- [x] **Identity Toolkit API** (Ensures support for Google Identity Services / GIS).
- [x] **People API** (Optional; required if retrieving detailed user profile attributes).

---

## 2. OAuth 2.0 Credentials Setup

To configure Google Social Logins, you must establish an OAuth Consent Screen and generate a Client ID.

### Step A: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen** in the GCP Console.
2. Select **External** User Type and click **Create**.
3. Input App Details:
   - App Name: `Smart Krishi Marketplace`
   - User support email: `support@smartkrishi.com`
   - Developer contact email: `admin@smartkrishi.com`
4. Add Scopes: Select `.../auth/userinfo.email` and `.../auth/userinfo.profile`.
5. Under **Test Users**, add your testing email accounts to allow login prior to production publishing.

### Step B: Create Credentials (OAuth Client ID)
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Choose Application Type: **Web application**.
4. Configure URLs:

#### 🌐 Authorized JavaScript Origins
Add the following origins (No trailing slashes):
- `http://localhost:5173` (Frontend local dev server)
- `http://localhost:3000` (Alternative local dev port)
- `https://your-frontend-domain.vercel.app` (Vercel production domain)
- `https://smartkrishi.com` (Custom production domain)

#### 🔄 Authorized Redirect URIs
Add the following redirect URIs (if configuring server-side authorization redirections):
- `http://localhost:8080/login/oauth2/code/google`
- `https://your-backend-domain.onrender.com/login/oauth2/code/google`

5. Click **Create** to receive your **Client ID** (e.g. `95917657297-nqan87ng5o9jh31vglp2u08ulnivm6u2.apps.googleusercontent.com`) and **Client Secret**.

---

## 3. Google Maps API Keys & Restrictions

To safeguard against billing theft and unauthorized quota exploitation, you **MUST** create two separate API keys with tight restrictions.

### 💻 Key A: Client-Side (Vite Frontend Key)
1. Navigate to **Credentials** > **Create Credentials** > **API key**.
2. Rename the key: `smartkrishi-frontend-maps`.
3. Set **Application Restrictions** to: **Websites (HTTP referrers)**.
4. Add Website Restrictions (Allow all pages):
   - `http://localhost:5173/*`
   - `http://127.0.0.1:5173/*`
   - `https://*.vercel.app/*`
   - `https://smartkrishi.com/*`
5. Set **API Restrictions**: Restrict this key to only call **Maps JavaScript API** and **Places API**.
6. Bind this key to: `VITE_GOOGLE_MAPS_API_KEY` on Vercel.

### 🖥️ Key B: Server-Side (Spring Boot Backend Key)
1. Navigate to **Credentials** > **Create Credentials** > **API key**.
2. Rename the key: `smartkrishi-backend-maps`.
3. Set **Application Restrictions** to: **IP Addresses**.
4. Add IP Restrictions: Enter the static Egress/Outbound IP addresses of your Render backend container cluster.
5. Set **API Restrictions**: Restrict this key to only call **Geocoding API** and **Directions API**.
6. Bind this key to: `GOOGLE_MAPS_API_KEY` on Render environment settings.

---

## 4. Troubleshooting & Deployment Summary

| Variable Name | Environment | Target Value | Action / Verification |
| :--- | :--- | :--- | :--- |
| `VITE_GOOGLE_CLIENT_ID` | Vercel (Frontend) | `your-oauth-client-id.apps.googleusercontent.com` | Bind to Vercel dashboard prior to building. |
| `VITE_GOOGLE_MAPS_API_KEY`| Vercel (Frontend) | `AIzaSyCsXyz...` (Restricted Key A) | Verify in browser developer tools console. |
| `GOOGLE_CLIENT_ID` | Render (Backend) | `your-oauth-client-id.apps.googleusercontent.com` | Ensure matches frontend value exactly. |
| `GOOGLE_MAPS_API_KEY` | Render (Backend) | `AIzaSyBcd...` (Restricted Key B) | Verify in Spring logs that fallbacks are inactive. |
