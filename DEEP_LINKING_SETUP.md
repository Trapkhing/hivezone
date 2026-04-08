# 🔗 HiveZone Deep Linking Setup Guide

Deep linking makes `https://hivezone.co/*` links open directly inside the HiveZone app when it's installed. If the app isn't installed, the link opens the website normally.

---

## 📋 What's Already Done (Code)

These changes are already in the codebase:

- ✅ `AndroidManifest.xml` — intent filter added for `https://hivezone.co`
- ✅ `CapacitorInit.jsx` — `appUrlOpen` + `getLaunchUrl` handlers wired to Next.js router
- ✅ `src/app/.well-known/assetlinks.json/route.js` — Android verification endpoint
- ✅ `src/app/.well-known/apple-app-site-association/route.js` — iOS verification endpoint

All that's left is getting your fingerprint, filling in the placeholders, and deploying.

---

## 🤖 Android Setup

### Step 1 — Get Your SHA256 Fingerprint

**Option A: Android Studio (recommended)**

1. Open Android Studio
2. Go to **View → Tool Windows → Gradle**
3. Expand: `HiveZone → android → Tasks → android → signingReport`
4. Double-click `signingReport`
5. Find this in the output:

```
Variant: debug
Store: C:\Users\<you>\.android\debug.keystore
Alias: AndroidDebugKey
SHA-256: AB:CD:EF:12:34:...   ← copy this
```

**Option B: Terminal (inside Android Studio's built-in terminal)**

```bash
keytool -list -v -keystore C:\Users\kumie\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

> ⚠️ The debug fingerprint is for testing only. When you build a release APK, repeat this step with your release keystore and add that fingerprint too.

---

### Step 2 — Add Fingerprint to assetlinks.json

Open `src/app/.well-known/assetlinks.json/route.js` and replace `YOUR_SHA256_FINGERPRINT`:

```js
sha256_cert_fingerprints: [
    'AB:CD:EF:12:34:...'   // your actual SHA-256 here
]
```

For both debug and release builds:

```js
sha256_cert_fingerprints: [
    'AB:CD:EF:...',   // debug
    'XX:YY:ZZ:...'   // release (add when you have it)
]
```

---

### Step 3 — Deploy to Vercel

Push your changes and deploy. Then verify the file is live:

```
https://hivezone.co/.well-known/assetlinks.json
```

You should see JSON like:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "co.hivezone.app",
      "sha256_cert_fingerprints": ["AB:CD:EF:..."]
    }
  }
]
```

> ⚠️ This file MUST be live before you install the app. Android fetches it at install time.

---

### Step 4 — Sync and Reinstall

```bash
npx cap sync
```

Then in Android Studio:
- **Build → Clean Project**
- **Build → Rebuild Project**
- Run on your test device

---

### Step 5 — Verify It Works

**Test a deep link:**
```bash
adb shell am start -a android.intent.action.VIEW -d "https://hivezone.co/dashboard/chat" co.hivezone.app
```

The app should open and navigate to `/dashboard/chat`.

**Check verification status:**
```bash
adb shell pm get-app-links co.hivezone.app
```

Look for `verified` in the output. If you see `none` or `failed`, the fingerprint or live JSON file is wrong.

**Force re-verification (if needed):**
```bash
adb shell pm verify-app-links --re-verify co.hivezone.app
```

---

## 🍎 iOS Setup

### Step 1 — Get Your Apple Team ID

1. Go to [developer.apple.com](https://developer.apple.com)
2. Sign in → **Account → Membership**
3. Copy your **Team ID** (looks like `ABC123DEF4`)

---

### Step 2 — Add Team ID to apple-app-site-association

Open `src/app/.well-known/apple-app-site-association/route.js` and replace `YOUR_TEAM_ID`:

```js
appIDs: ['ABC123DEF4.co.hivezone.app']
```

---

### Step 3 — Add Entitlement to iOS Project

Open `ios/App/App/App.entitlements` and add:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:hivezone.co</string>
</array>
```

---

### Step 4 — Deploy to Vercel

Push and deploy. Verify the file is live:

```
https://hivezone.co/.well-known/apple-app-site-association
```

---

### Step 5 — Build and Install

```bash
npx cap sync
npx cap open ios
```

In Xcode:
- Select your target device
- **Product → Clean Build Folder**
- **Product → Run**

---

### Step 6 — Verify It Works

Tap a `https://hivezone.co/*` link from Notes, Safari, or Messages. It should open inside the HiveZone app.

> iOS Universal Links don't work when you type the URL directly in Safari — they only trigger from tapped links in other apps.

---

## 🧪 Testing Deep Links Without a Physical Device

**Android Emulator:**
```bash
adb shell am start -a android.intent.action.VIEW -d "https://hivezone.co/dashboard/chat" co.hivezone.app
adb shell am start -a android.intent.action.VIEW -d "https://hivezone.co/dashboard/profile/testuser" co.hivezone.app
```

**iOS Simulator:**
```bash
xcrun simctl openurl booted "https://hivezone.co/dashboard/chat"
```

---

## 🔄 Flow Summary

```
User taps https://hivezone.co/dashboard/chat
            ↓
Android/iOS checks .well-known verification file
            ↓
Fingerprint/Team ID matches → open HiveZone app
            ↓
CapacitorInit.jsx catches the URL
            ↓
Path is /auth/*, /dashboard/*, /admin/*?
  YES → Next.js router navigates inside app
  NO  → Opens in device browser (Chrome/Safari)
```

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Installed app before deploying `assetlinks.json` | Deploy first, then reinstall |
| Wrong SHA256 format (missing colons) | Must be `AB:CD:EF:...` with colons |
| Using debug fingerprint for Play Store build | Add release fingerprint to the array |
| `assetlinks.json` returns 404 | Check Next.js route path is exactly `.well-known/assetlinks.json` |
| iOS links open Safari instead of app | Entitlements file not saved, or Team ID is wrong |
| Link works on Android but not iOS | Missing `App.entitlements` entry |

---

## 📦 Release Build Checklist

When you're ready for the Play Store:

- [ ] Generate a release keystore
- [ ] Run `signingReport` on the release variant
- [ ] Add release SHA256 to `assetlinks.json`
- [ ] Deploy updated `assetlinks.json`
- [ ] Build signed release APK/AAB
- [ ] Test deep links on the release build before submitting
