import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

let app = null;
let auth = null;
let db = null;
let functions = null;
let appCheck = null;

if (firebaseReady) {
  app = initializeApp(firebaseConfig);

  // Initialize App Check BEFORE using Firebase services.
  const siteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;

  if (!siteKey) {
    throw new Error(
      "App Check site key missing. Check VITE_RECAPTCHA_V3_SITE_KEY in Vercel.",
    );
  }

  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  // Initialize Firebase services only after App Check.
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, "us-central1");
}

export { app, auth, db, functions, appCheck };
