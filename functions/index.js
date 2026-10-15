const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const crypto = require("node:crypto");
const { defineSecret } = require("firebase-functions/params");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { Resend } = require("resend");

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
const MAIL_FROM = defineSecret("MAIL_FROM");
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

exports.approveStudentRegistration = onCall(
  {
    enforceAppCheck: true,
    secrets: [RESEND_API_KEY, MAIL_FROM],
    maxInstances: 3,
  },
  async (request) => {
    // Only an authenticated admin can approve registrations.
    if (!request.auth || request.auth.token.admin !== true) {
      throw new HttpsError(
        "permission-denied",
        "Only an authorized admin can approve registrations.",
      );
    }

    const uid = String(request.data?.uid || "").trim();

    if (!uid) {
      throw new HttpsError("invalid-argument", "Student UID is required.");
    }

    const auth = getAuth();
    const student = await auth.getUser(uid);
    const registrationRef = db.collection("pendingRegistrations").doc(uid);

    if (!student.emailVerified || !student.email) {
      throw new HttpsError(
        "failed-precondition",
        "Student email must be verified before approval.",
      );
    }

    const registrationSnap = await registrationRef.get();

    if (
      !registrationSnap.exists ||
      registrationSnap.data().status !== "pending"
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Registration does not exist or is not pending.",
      );
    }

    const registration = registrationSnap.data();

    if (
      String(registration.email || "").toLowerCase() !==
      student.email.toLowerCase()
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Registration email does not match the verified account.",
      );
    }

    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const resend = new Resend(RESEND_API_KEY.value());

    let code;
    let codeRef;

    // Reserve a unique code before sending the email.
    for (let attempt = 0; attempt < 10; attempt++) {
      code = Array.from(
        { length: 5 },
        () => alphabet[crypto.randomInt(alphabet.length)],
      ).join("");

      codeRef = db.collection("accessCodes").doc(code);

      const created = await db.runTransaction(async (tx) => {
        const existing = await tx.get(codeRef);
        const currentRegistration = await tx.get(registrationRef);

        if (
          !currentRegistration.exists ||
          currentRegistration.data().status !== "pending"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Registration has already been processed.",
          );
        }

        if (existing.exists) return false;

        tx.create(codeRef, {
          uid,
          active: false,
          displayName: String(registration.name || student.displayName || ""),
          createdAt: Timestamp.now(),
        });

        tx.update(registrationRef, {
          status: "processing",
          updatedAt: Timestamp.now(),
        });

        return true;
      });

      if (created) break;
      code = null;
    }

    if (!code) {
      throw new HttpsError(
        "internal",
        "Could not generate a unique access code. Try again.",
      );
    }

    try {
      const { data, error } = await resend.emails.send({
        from: MAIL_FROM.value(),
        to: [student.email],
        subject: "Your Saumya's JEE 2027 Portal access code",
        text:
          `Hello ${registration.name || student.displayName || "Student"},\n\n` +
          `Your registration has been approved.\n` +
          `Your 5-character access code is: ${code}\n\n` +
          `Keep this code private.`,
      });

      if (error || !data?.id) {
        throw new Error(error?.message || "Email delivery request failed.");
      }

      await db.runTransaction(async (tx) => {
        const current = await tx.get(registrationRef);

        if (!current.exists || current.data().status !== "processing") {
          throw new Error("Registration state changed during approval.");
        }

        tx.update(codeRef, {
          active: true,
          emailSentAt: Timestamp.now(),
        });

        tx.update(registrationRef, {
          status: "approved",
          approvedAt: Timestamp.now(),
          accessCode: code,
          emailMessageId: data.id,
        });
      });

      return { success: true };
    } catch (error) {
      // Disable the reserved code if sending or finalization fails.
      await codeRef.update({
        active: false,
        emailFailedAt: Timestamp.now(),
      });

      await registrationRef.update({
        status: "pending",
        updatedAt: Timestamp.now(),
      });

      console.error("Approval email failed:", error.message);

      throw new HttpsError(
        "internal",
        "Approval email could not be completed. Check server logs before retrying.",
      );
    }
  },
);


exports.submitStudentRegistration = onCall(
  {
    enforceAppCheck: true,
    secrets: [RESEND_API_KEY, MAIL_FROM],
    maxInstances: 10,
    timeoutSeconds: 30,
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

    let student = null;
    let userCreated = false;
    let registrationCreated = false;
    let requestRef = null;

    try {
      // Create a Firebase Auth account without a client-supplied password.
      student = await getAuth().createUser({
        email,
        displayName: name,
        emailVerified: false,
        disabled: false,
      });
      userCreated = true;

      // Generate a genuine Firebase email-verification action link.
      const verificationLink =
        await getAuth().generateEmailVerificationLink(email);

      // IMPORTANT: Use the UID as the document ID.
      // approveStudentRegistration expects pendingRegistrations/{uid}.
      requestRef = db.collection("pendingRegistrations").doc(student.uid);

      await requestRef.create({
        uid: student.uid,
        name,
        targetExam,
        email,
        status: "pending",
        emailVerified: false,
        createdAt: Timestamp.now(),
      });
      registrationCreated = true;

      const resend = new Resend(RESEND_API_KEY.value());

      const delivery = await resend.emails.send({
        from: MAIL_FROM.value(),
        to: [email],
        subject: "Verify your email — Saumya's JEE 2027 Portal",
        text:
          `Hello ${name},\n\n` +
          "Please verify your email address to complete your registration:\n\n" +
          `${verificationLink}\n\n` +
          "After verification, your registration will be reviewed by the portal admin. " +
          "Your access code will be sent only after approval.\n\n" +
          "If you did not request registration, you can ignore this email.",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;line-height:1.6;color:#172033">
            <h2>Verify your email address</h2>
            <p>Hello ${name.replace(
              /[&<>"']/g,
              (c) =>
                ({
                  "&": "&amp;",
                  "<": "&lt;",
                  ">": "&gt;",
                  '"': "&quot;",
                  "'": "&#39;",
                })[c],
            )},</p>
            <p>Click the button below to verify your email and continue your registration.</p>
            <p>
              <a href="${verificationLink}"
                 style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
                Verify email
              </a>
            </p>
            <p>After verification, the portal admin will review your registration.
            Your access code will be sent only after approval.</p>
            <p style="font-size:12px;color:#64748b">
              If you did not request registration, you can ignore this email.
            </p>
          </div>
        `,
      });

      if (delivery?.error) {
        throw new Error(
          delivery.error.message || "Verification email delivery failed.",
        );
      }

      return {
        success: true,
        message:
          "Verification email sent. Please verify your email before admin approval.",
      };
    } catch (error) {
      // Roll back only resources created by this invocation.
      if (registrationCreated && requestRef) {
        try {
          await requestRef.delete();
        } catch (cleanupError) {
          console.error("Registration cleanup failed:", cleanupError);
        }
      }

      if (userCreated && student?.uid) {
        try {
          await getAuth().deleteUser(student.uid);
        } catch (cleanupError) {
          console.error("Auth-user cleanup failed:", cleanupError);
        }
      }

      if (error instanceof HttpsError) {
        throw error;
      }

      // Do not expose internal Firebase or email-provider errors to clients.
      if (error?.code === "auth/email-already-exists") {
        throw new HttpsError(
          "already-exists",
          "An account already exists for this email. Contact the portal admin if you need help.",
        );
      }

      console.error("Student registration failed:", error);
      throw new HttpsError(
        "internal",
        "Registration or verification email delivery failed. Please try again later.",
      );
    }
  },
);

