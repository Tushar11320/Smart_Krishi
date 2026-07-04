# Authentication Implementation Report - Google Sign-In and Email OTP

This report details the implementation of enterprise-grade authentication for the Smart Krishi Marketplace platform, supporting Google OAuth 2.0 and Email + Password registration with Email OTP verification.

## Modified Files

### Backend Components

1. **Entity**:
   - [User.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/entity/User.java): Added columns for `verificationToken`, `authProvider`, `googleId`, `otpCode`, `otpExpiry`, and `otpAttempts`.
2. **DTOs**:
   - [GoogleLoginRequest.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/dto/auth/GoogleLoginRequest.java): Payload for Google ID token login.
   - [GoogleTokenPayload.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/dto/auth/GoogleTokenPayload.java): Google Token validation payload structure.
   - [VerifyOtpRequest.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/dto/auth/VerifyOtpRequest.java): Code verification payload.
   - [ResendOtpRequest.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/dto/auth/ResendOtpRequest.java): Code resend payload.
   - [UserResponse.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/dto/auth/UserResponse.java): Included `authProvider` field.
3. **Security**:
   - [JwtTokenProvider.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/security/JwtTokenProvider.java): Overloaded `generateTokenFromEmail` to include the user's role list in the JWT claim structure.
4. **Service**:
   - [AuthService.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/service/auth/AuthService.java): Declared interface methods.
   - [AuthServiceImpl.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/service/auth/AuthServiceImpl.java): Implemented Google login token validation, automatic registration, account linking, random 6-digit OTP code creation, 10-minute expiry validation, 5 attempts restriction, and 60-second resend cooldown.
5. **Controller**:
   - [AuthController.java](file:///PROJECT_ROOT/backend/src/main/java/com/smartkrishi/controller/AuthController.java): Exposed `/api/auth/google`, `/api/auth/verify-otp`, and `/api/auth/resend-otp` endpoints.

---

### Frontend Components

1. **Markup & Shell**:
   - [index.html](file:///PROJECT_ROOT/frontend/index.html): Injected Google Identity Services client script.
2. **Page Views**:
   - [Account.jsx](file:///PROJECT_ROOT/frontend/src/Pages/Account.jsx): Integrated GIS login callback and rendered the "Continue with Google" button. Extended basic registration flow to display the new OTP verification screen with countdown timer, resend button, and redirect transitions.

---

## Required Environment Variables

### Backend Configuration

Place these variables in your Render environment configurations or local system variables:

- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 client ID from Google Cloud Console.
- `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 client secret.
- `MAIL_HOST`: Outgoing SMTP email host (e.g. `smtp.gmail.com`).
- `MAIL_PORT`: Outgoing SMTP port (e.g. `587`).
- `MAIL_USERNAME`: Authorized email address used by `JavaMailSender`.
- `MAIL_PASSWORD`: Mapped password or App Password for the SMTP email account.
- `JWT_SECRET`: Signing secret used by `JwtTokenProvider` to generate and verify JWTs.

### Frontend Configuration

Place this variable in Vercel configuration or local `.env`:

- `VITE_GOOGLE_CLIENT_ID`: Google Client ID required by Google Identity Services client script to initialize the button.

---

## Security Compliance & Audit

- **Password Hashing**: Retained BCrypt hashing for local passwords.
- **JWT Integrity**: Standardized role claims across standard logins, token refreshing, and Google OAuth sign-in.
- **OTP Protection**: Limit of 5 maximum validation attempts prevents brute-force OTP attacks. Expiry of 10 minutes prevents replay attacks. Cooldown of 60 seconds rate-limits OTP email generation requests.
- **Account Linking**: Automatically links Google logins to existing local accounts if the email matches, preventing duplicate registrations.
