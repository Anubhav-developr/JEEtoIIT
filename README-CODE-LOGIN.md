# Saumya JEE Portal — 5-character access-code login patch

This is a partial patch for the existing React/Vite project. It does not recreate the full app.

## Files to copy/replace

Copy these paths into your existing project:

- Replace `src/App.jsx`
- Replace `src/components/Sidebar.jsx`
- Add `src/components/CodeLogin.jsx`
- Add `src/lib/firebase.js`
- Add `functions/index.js`
- Add `functions/package.json`
- Add `firebase.json`
- Add `firestore.rules`
- Copy `.env.example` to `.env`, then fill your Firebase values.

Do not overwrite your current `StudyTimer.jsx`, `Dashboard.jsx`, or other components. The updated `App.jsx` remains compatible with the existing component props.

## Security design

The 5-character code is verified by a Firebase Cloud Function, not directly from the browser. The function issues a Firebase custom token. Firestore rules then restrict each user to their own UID path, so entering a code loads that UID's saved syllabus, mock tests, study sessions, question logs and dashboard.

**Security caveat:** five characters are a short credential, not equivalent to a strong password. This patch adds Firebase App Check and server-side per-IP throttling (10 attempts per 15-minute window), but a code can still be shared or guessed. Use this for a controlled, low-risk portal; for sensitive personal data, use a longer code or Firebase Email/Password authentication. Never put access codes in URLs.

## Firebase setup — do these steps in order

### 1. Register/confirm the Web app
1. Open Firebase Console: https://console.firebase.google.com/
2. Select the project.
3. Open Project settings (gear) → General → Your apps.
4. Add a Web app if one does not exist.
5. Copy its Firebase config values into `.env` using `.env.example` as a template.
6. Ensure `.env` is in `.gitignore`. Never commit service-account JSON or Admin credentials.

### 2. Enable Authentication
1. Firebase Console → Build → Authentication → Get started.
2. Open Sign-in method / Sign-in providers. This code-only flow uses Firebase custom-token sign-in, so you do not need to enable Email/Password or create a password for each student.
3. The Cloud Function creates Firebase custom tokens with the Admin SDK; do not create email/password users for this code-only flow.

### 3. Create Firestore
1. Firebase Console → Build → Firestore Database → Create database.
2. Choose a location and create the database.
3. In Rules, deploy the included `firestore.rules` (Firebase CLI steps below).
4. Do not make `accessCodes` publicly readable. Its rules must stay denied to clients.

### 4. Set up App Check (required by the callable function)
1. Firebase Console → Build → App Check.
2. Register your Web app and choose **reCAPTCHA v3** (or use a supported web provider and update the client code accordingly).
3. Add your production domain and `localhost` for development to the provider's allowed domains, as applicable.
4. Copy the reCAPTCHA v3 **site key** (not secret key) into `VITE_RECAPTCHA_V3_SITE_KEY` in `.env`.
5. Restart Vite after editing `.env`.
6. The function uses `enforceAppCheck: true`; without working App Check, login calls will be rejected.

### 5. Install Firebase CLI and deploy rules/function
Install Node.js 20+ first. Then in a terminal:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

Choose the same Firebase project that is configured in `.env`. Then from the project root:

```bash
npm install
cd functions
npm install
cd ..
firebase deploy --only firestore:rules,functions
```

If Firebase asks to enable Cloud Functions APIs or billing, follow the console prompts. Cloud Functions deployment may require the Blaze (pay-as-you-go) plan; set budget alerts in Google Cloud Billing.

### 6. Create a user's code in Firestore
After deploying the function and rules:
1. Firebase Console → Firestore Database → Data.
2. Create a top-level collection named `accessCodes`.
3. Create a document whose **document ID is exactly five uppercase letters/digits**, e.g. `A7K2Q` (example only; do not use this public example for a real account).
4. Add fields:
   - `uid` (string): a unique, stable ID for this user, e.g. `saumya_student_001`
   - `active` (boolean): `true`
   - `displayName` (string): `Saumya` (optional)
5. Repeat with a different 5-character code and unique UID for each separate user's private data.
6. To revoke a code, set `active` to `false`. If you rotate a code for the same user, create the new code document with the same `uid` and disable the old code.

Only the Cloud Function/Admin SDK can read these records because the rules deny all client access. Optional: configure Firestore TTL on the `loginRateLimits.expiresAt` field to automatically clean up old throttle records.

### 7. Run the website
Copy `.env.example` to `.env`, fill in the values, then:

```bash
npm run dev
```

Enter the code you created in Firestore. The first time that UID logs in, the portal starts with empty data. Subsequent logins with the same code/UID retrieve the same saved data.

## Existing data migration note
The earlier prototype used anonymous Firebase UIDs. A code maps to a different UID, so it will not automatically see data saved under an old anonymous UID. If you already have important data, migrate it with a trusted Admin SDK script or manually map the old data to the intended stable UID before relying on code login. Do not open Firestore rules to public access as a workaround.

## Troubleshooting
- `functions/not-found`: function not deployed to the Firebase project/region expected by the client.
- App Check / `failed-precondition`: reCAPTCHA site key/domain or App Check setup is incomplete.
- `permission-denied`: deploy the included rules and verify the signed-in UID matches the data path.
- `.env` changes not picked up: stop and restart `npm run dev`.
- Keep `VITE_APP_ID=saumya-jee-2027` unchanged if existing data uses that app namespace.
