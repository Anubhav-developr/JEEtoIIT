const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const crypto = require("node:crypto");

initializeApp();
const db = getFirestore();

const CODE_PATTERN = /^[A-Z0-9]{5}$/;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function hashIp(ip) {
  // Avoid storing a raw IP address in Firestore.
  return crypto
    .createHash("sha256")
    .update(String(ip || "unknown"))
    .digest("hex");
}

async function enforceRateLimit(ip) {
  const key = hashIp(ip);
  const ref = db.collection("loginRateLimits").doc(key);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const windowStart = Number(data.windowStart || 0);
    const attempts =
      now - windowStart > WINDOW_MS ? 0 : Number(data.attempts || 0);

    if (attempts >= MAX_ATTEMPTS) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many attempts. Try again later.",
      );
    }

    tx.set(
      ref,
      {
        windowStart: attempts === 0 ? now : windowStart,
        attempts: attempts + 1,
        expiresAt: Timestamp.fromMillis(now + WINDOW_MS * 2),
      },
      { merge: true },
    );
  });
}

exports.loginWithAccessCode = onCall(
  {
    enforceAppCheck: true,
    maxInstances: 10,
    timeoutSeconds: 15,
  },
  async (request) => {
    const ip =
      request.rawRequest?.ip ||
      request.rawRequest?.headers?.["x-forwarded-for"] ||
      "unknown";

    console.log("[LOGIN] Step 1: checking rate limit");

    try {
      await enforceRateLimit(ip);
      console.log("[LOGIN] Step 2: rate limit passed");
    } catch (error) {
      console.error("[LOGIN] RATE_LIMIT_FAILED", error);
      throw new HttpsError("internal", "Login database check failed.");
    }

    const code = String(request.data?.code || "")
      .trim()
      .toUpperCase();

    console.log("[LOGIN] Step 3: reading access code document");

    let codeSnap;

    try {
      codeSnap = await db.collection("accessCodes").doc(code).get();
      console.log("[LOGIN] Step 4: access code read completed");
    } catch (error) {
      console.error("[LOGIN] ACCESS_CODE_READ_FAILED", error);
      throw new HttpsError("internal", "Access code database lookup failed.");
    }

    if (!CODE_PATTERN.test(code)) {
      throw new HttpsError("unauthenticated", "Invalid access code.");
    }

    // The browser cannot read accessCodes. Only this Admin SDK function can verify it.
    codeSnap = await db.collection("accessCodes").doc(code).get();
    if (!codeSnap.exists) {
      throw new HttpsError("unauthenticated", "Invalid access code.");
    }

    const record = codeSnap.data();
    if (
      record.active !== true ||
      typeof record.uid !== "string" ||
      !record.uid.trim()
    ) {
      throw new HttpsError("unauthenticated", "Invalid access code.");
    }

    try {
      const customToken = await getAuth().createCustomToken(record.uid, {
        accessCodeLogin: true,
      });
      return {
        customToken,
        displayName:
          typeof record.displayName === "string" ? record.displayName : "",
      };
    } catch (error) {
      console.error("Could not create custom token:", error);
      throw new HttpsError("internal", "Unable to complete login.");
    }
  },
);


exports.submitStudentRegistration = onCall(
  {
    enforceAppCheck: true,
    maxInstances: 10,
    timeoutSeconds: 15,
  },
  async (request) => {
    const ip =
      request.rawRequest?.ip ||
      request.rawRequest?.headers?.["x-forwarded-for"] ||
      "unknown";

    await enforceRateLimit(ip);

    const name = String(request.data?.name || "").trim();
    const targetExam = String(request.data?.targetExam || "").trim();
    const email = String(request.data?.email || "")
      .trim()
      .toLowerCase();

    if (name.length < 2 || name.length > 80) {
      throw new HttpsError("invalid-argument", "Enter a valid student name.");
    }

    if (targetExam.length < 2 || targetExam.length > 80) {
      throw new HttpsError(
        "invalid-argument",
        "Enter a valid class or target exam.",
      );
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError("invalid-argument", "Enter a valid email address.");
    }

    // Deterministic document ID prevents duplicate requests for the same email.
    const emailHash = crypto.createHash("sha256").update(email).digest("hex");

    const requestRef = db.collection("pendingRegistrations").doc(emailHash);

    try {
      await db.runTransaction(async (tx) => {
        const existing = await tx.get(requestRef);

        if (existing.exists) {
          throw new HttpsError(
            "already-exists",
            "A registration request for this email already exists.",
          );
        }

        tx.create(requestRef, {
          name,
          targetExam,
          email,
          status: "pending",
          createdAt: Timestamp.now(),
        });
      });

      return {
        success: true,
        message: "Registration request submitted for admin approval.",
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      console.error("Student registration failed:", error);
      throw new HttpsError(
        "internal",
        "Registration could not be submitted. Please try again later.",
      );
    }
  },
);

