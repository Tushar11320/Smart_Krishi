# Capacitor Deployment & Android packaging Guide

This guide provides step-by-step instructions to bundle the **Smart Krishi Frontend** as an installable Android Application package (`.apk` / `.aab`) using Ionic Capacitor, and prepare it for publishing on the Google Play Store.

---

## 1. Prerequisites
Ensure you have the following installed on your development machine:
- **Node.js** (v18+)
- **Android Studio** (for compilation, SDK managers, and emulator setup)
- **Java Development Kit (JDK)** v17 (required for modern Gradle builds)

---

## 2. Installation
To package the app, install Capacitor's core, CLI, and Android platform packages into your frontend project root directory:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

---

## 3. Initialization & Setup

### Step A: Initialize Capacitor Config
Initialize the project settings. Replace `com.smartkrishi.app` with your registered Google Play Developer application ID.

```bash
npx cap init "Smart Krishi" "com.smartkrishi.app" --web-dir=dist
```
This generates a `capacitor.config.json` (or `capacitor.config.ts`) file in the workspace root.

### Step B: Build Web Production Assets
Run the Vite production build to compile static HTML, JS, and CSS files under the `dist` folder:

```bash
npm run build
```

### Step C: Add Android Platform
Generate the native Android project folder containing Gradle configurations and Java scaffolding:

```bash
npx cap add android
```

---

## 4. Android Configurations & Permissions

Open the newly created `android` folder in **Android Studio** or navigate to:
`android/app/src/main/AndroidManifest.xml`

### Step A: Configure Android Permissions
To allow the map features, location search, and photo uploads to function correctly, add the following permissions within the `<manifest>` tag, above the `<application>` tag:

```xml
<!-- Internet Access (Required for API integrations) -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Geolocation (Required for Nearby Products map search) -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />

<!-- Camera & Storage (Required for Product image uploads) -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" /> <!-- Android 13+ -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
```

### Step B: Enable Cleartext Traffic (Optional)
If your staging backend API runs on HTTP (unsecured) instead of HTTPS, allow cleartext traffic by adding this attribute to the `<application>` tag:
```xml
android:usesCleartextTraffic="true"
```

---

## 5. Build Syncing & Native Workflow

Whenever you change your React source code, compile the code and sync the changes to the Android native directory:

1. **Re-build React files:**
   ```bash
   npm run build
   ```
2. **Sync web files with native Android app wrapper:**
   ```bash
   npx cap sync
   ```
3. **Open the project in Android Studio (for compilation/debugging):**
   ```bash
   npx cap open android
   ```

---

## 6. Compilation & Release Builds

### Building the Release APK via CLI
To quickly compile a debug or unsigned release APK using Gradle without opening Android Studio, navigate to the `android` subdirectory and run:

```bash
# Navigate to native folder
cd android

# Compile unsigned release APK
./gradlew assembleRelease
```
The compiled package will be located at:
`android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Creating a Signed Bundle (.aab) for Google Play
Google Play requires apps to be uploaded as **Android App Bundles (.aab)**.
1. Open the project in **Android Studio** (`npx cap open android`).
2. Go to **Build** > **Generate Signed Bundle / APK...**
3. Select **Android App Bundle** and click **Next**.
4. Generate a new keystore or select an existing secure key:
   - Save the keystore password and key alias securely!
5. Select the **release** build variant and click **Finish**.
6. Retrieve the signed bundle from:
   `android/app/release/app-release.aab`

---

## 7. Google Play Store Pre-Launch Checklist

Before uploading the compiled `.aab` file to the Google Play Console:
1. **Target SDK Level:** Ensure `compileSdk` and `targetSdk` inside `android/app/build.gradle` are set to at least the minimum version required by Google (currently **Android 14 (API level 34)**).
2. **Version Code & Name:** Increment `versionCode` (integer) and `versionName` (string, e.g., `"1.0.1"`) in `android/app/build.gradle` for every updates.
3. **Privacy Policy:** Prepare a valid Privacy Policy URL describing how user data (such as Geolocation and Camera) is used.
4. **App Content Questionnaire:** Complete the safety declarations (Data Safety section) inside the Google Play Console detailing usage of location and camera permissions.
