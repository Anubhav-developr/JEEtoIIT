import React, { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { ArrowLeft, UserPlus, LoaderCircle } from "lucide-react";

import { getToken } from "firebase/app-check";
import { appCheck, functions, firebaseReady } from "../lib/firebase";

export default function StudentRegistration({ onBack }) {
  const [name, setName] = useState("");
  const [targetExam, setTargetExam] = useState("JEE 2027");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!firebaseReady || !functions) {
      setError("Firebase configuration is missing.");
      return;
    }

    setBusy(true);

    try {
      if (!appCheck) {
        throw new Error("APP_CHECK_NOT_INITIALIZED");
      }

      const appCheckResult = await getToken(appCheck, false);

      if (!appCheckResult.token) {
        throw new Error("APP_CHECK_TOKEN_MISSING");
      }

      console.info("[App Check] Registration token acquired");
      const submitRegistration = httpsCallable(
        functions,
        "submitStudentRegistration",
      );

      const result = await submitRegistration({
        name: name.trim(),
        targetExam: targetExam.trim(),
        email: email.trim().toLowerCase(),
      });

      setMessage(
        result.data?.message || "Request submitted. Wait for admin approval.",
      );
      setName("");
      setEmail("");
      setTargetExam("JEE 2027");
    } catch (err) {
      console.error("Registration failed:", err);

      if (err?.code === "functions/already-exists") {
        setError(
          "Is email se registration request pehle hi submit ho chuki hai.",
        );
      } else if (
        err?.code === "functions/failed-precondition" ||
        err?.code === "functions/app-check"
      ) {
        setError("Security verification failed. Please refresh and try again.");
      } else if (err?.code === "functions/resource-exhausted") {
        setError("Too many attempts. Please try again after 15 minutes.");
      } else {
        setError(
          "Request submit nahi hui. Details check karke dobara try karein.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl sm:p-9">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
          JEE 2027
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-white">
          Student Registration
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Form submit karein. Portal access admin approval ke baad milega.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label
              htmlFor="student-name"
              className="mb-2 block text-sm text-slate-300"
            >
              Student name
            </label>
            <input
              id="student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
              required
              minLength={2}
              placeholder="Enter full name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="target-exam"
              className="mb-2 block text-sm text-slate-300"
            >
              Class / target exam
            </label>
            <select
              id="target-exam"
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
            >
              <option>JEE 2027</option>
              <option>JEE 2028</option>
              <option>Class 11</option>
              <option>Class 12</option>
              <option>Dropper</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="student-email"
              className="mb-2 block text-sm text-slate-300"
            >
              Email address
            </label>
            <input
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              autoComplete="email"
              required
              placeholder="student@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 font-bold text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            {busy ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Request registration
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
          Submitting this form does not grant portal access automatically.
          Access is provided only after approval.
        </p>
      </div>
    </main>
  );
}
