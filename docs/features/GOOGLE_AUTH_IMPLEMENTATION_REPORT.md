# Google OAuth 2.0 Sign-In & Sign-Up Implementation Report

This report documents the implementation, security considerations, and deployment details for the Google Sign-In and Google Sign-Up feature on the Smart Krishi Marketplace.

---

## 1. Files Modified / Added

### Backend (Spring Boot)
- **[User.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/entity/User.java)**:
  - Added the `google_picture` database column mapped via `googlePicture` field.
  - Keeps the existing `google_id`, `auth_provider`, and `email_verified` fields.
- **[AuthServiceImpl.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/service/auth/AuthServiceImpl.java)**:
  - Sets the `googlePicture` field in addition to `profileImage` during Google authentication.
  - Removed the `GOOGLE` auth provider login restriction in `login` method to support dual login methods (both Google SSO and standard Email/Password authentication).
- **[RegisterRequest.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/dto/auth/RegisterRequest.java)**:
  - Added the optional `profileImage` field to accept photo URLs during registration.
- **[ImageUploadController.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/controller/ImageUploadController.java)**:
  - Configured `@PreAuthorize("permitAll()")` to allow unregistered users to upload their profile photo during registration.
- **[SecurityConfig.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/config/SecurityConfig.java)**:
  - Permitted public access to `POST /api/images/upload`.
- **[application.yml](file:///PROJECT_ROOT/backend/src/main/resources/application.yml)**:
  - Mapped `google.client-secret` properties to the environment variable `GOOGLE_CLIENT_SECRET`.
- **[application-prod.yml](file:///PROJECT_ROOT/backend/src/main/resources/application-prod.yml)**:
  - Configured production overrides for Spring Datasource, Hibernate, and Google OAuth credentials.

### Frontend (React/Vite)
- **[Account.jsx](file:///PROJECT_ROOT/frontend/src/Pages/Account.jsx)**:
  - Rendered the Google Identity Services button labeled `"Continue with Google"` on both login and registration forms.
  - Linked the ID token callback to the backend `/api/auth/google` verification endpoint.
  - Added profile picture selector with Upload/Remove actions on the signup screen.
- **[ProfileSection.jsx](file:///PROJECT_ROOT/frontend/src/Pages/account/ProfileSection.jsx)**:
  - Integrated Cloudinary photo uploads and provided Upload/Replace/Remove actions.
- **[.env.example](file:///PROJECT_ROOT/frontend/.env.example)**:
  - Documented `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.

---

## 2. API Endpoints

- **`POST /api/auth/google`**:
  - **Purpose**: Authenticates Google users by validating ID tokens cryptographically.
  - **Payload**: `{ idToken: String, userType: String }`
  - **Response**: JWT session token, refresh token, and authenticated User details.
- **`POST /api/images/upload`**:
  - **Purpose**: Public Cloudinary upload endpoint for registration-time profile photo uploads.
  - **Payload**: Multipart form file.
  - **Response**: Cloudinary secure URL and public ID.

---

## 3. Required Environment Variables

### Frontend (.env)
```env
VITE_GOOGLE_CLIENT_ID=95917657297-nqan87ng5o9jh31vglp2u08ulnivm6u2.apps.googleusercontent.com
```

### Backend (System Env / Properties)
```env
GOOGLE_CLIENT_ID=95917657297-nqan87ng5o9jh31vglp2u08ulnivm6u2.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

---

## 4. Test Results Summary

1.  **Google Sign Up**: Verified. Signing up with a new Google account automatically creates a user in `users` table with status `ACTIVE`, `email_verified=true`, `auth_provider=GOOGLE`, default role `BUYER`, and downloads/links the Google profile picture.
2.  **Google Login**: Verified. Existing Google-registered users authenticate instantly, and a new secure JWT session is returned.
3.  **Existing Login compatibility**: Verified. Regular users logging in with email and password continue to work perfectly.
4.  **Linked Account Dual Login**: Verified. Users with `auth_provider=GOOGLE` can log in using either Google SSO or standard email/password form (if they set a password).
5.  **Profile Image Customization**: Verified. Users can change, upload a custom photo to Cloudinary, or remove it (which triggers initials-based avatar fallback).
6.  **Logout & Session Persistence**: Verified. Session storage token is cleared upon logout, terminating the WebSocket connection.
7.  **PWA/Mobile Compatibility**: Verified. The login interface is fully responsive and GIS callbacks function correctly on mobile viewports.

---

## 5. Deployment Instructions

1.  **GCP Console Setup**:
    - Configure Authorized JavaScript Origins on Google Cloud Console Credentials page to match the production frontend URL (e.g. `https://smartkrishi.com`).
2.  **Configure Environment Variables**:
    - Inject the frontend client ID (`VITE_GOOGLE_CLIENT_ID`) and backend credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) into your hosting provider settings (e.g. Vercel, AWS, Render).
3.  **Database Migration**:
    - On startup, Hibernate's `ddl-auto: update` automatically alters the `users` table to add the `google_picture` column.
