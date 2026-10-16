import React, { useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import {
  BrainCircuit,
  KeyRound,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";

import { getToken } from "firebase/app-check";
import { auth, appCheck, functions, firebaseReady } from "../lib/firebase";
import StudentRegistration from "./StudentRegistration";

export default function CodeLogin() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const normalized = code.trim().toUpperCase();

    if (!/^[A-Z0-9]{5}$/.test(normalized)) {
      setError("Code exactly 5 characters ka hona chahiye: A–Z aur 0–9.");
      return;
    }
    if (!firebaseReady || !auth || !functions) {
      setError(
        "Firebase configuration missing hai. Project root ki .env file setup karke dev server restart karein.",
      );
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

      console.info("[App Check] Login token acquired");
      const loginWithAccessCode = httpsCallable(
        functions,
        "loginWithAccessCode",
      );
      const result = await loginWithAccessCode({ code: normalized });
      const customToken = result.data?.customToken;
      if (!customToken) throw new Error("Login token receive nahi hua.");
      await signInWithCustomToken(auth, customToken);
    } catch (err) {
      console.error("Code login failed:", err);
      const codeName = err?.code || "";
      if (codeName.includes("resource-exhausted")) {
        setError(
          "Bahut zyada attempts hue hain. 15 minutes baad dobara try karein.",
        );
      } else if (
        codeName.includes("failed-precondition") ||
        codeName.includes("app-check")
      ) {
        setError(
          "Security verification fail hui. Firebase App Check configuration check karein.",
        );
      } else {
        setError(
          "Code invalid, disabled, ya server setup incomplete hai. Code check karke dobara try karein.",
        );
      }
    } finally {
      setBusy(false);
    }
  };
  if (showRegistration) {
    return <StudentRegistration onBack={() => setShowRegistration(false)} />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
      <section className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl sm:p-9">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-3 shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
              JEE 2027
            </p>
            <h1 className="text-xl font-extrabold text-white">
              Saumya's Portal
            </h1>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-white">
          Enter your access code
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Apna 5-character code enter karein. Aapka saved syllabus, study timer,
          mock tests aur dashboard load ho jayega.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label
            htmlFor="access-code"
            className="block text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            5-character code
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              id="access-code"
              autoComplete="one-time-code"
              autoCapitalize="characters"
              maxLength={5}
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 5),
                )
              }
              placeholder="A7K2Q"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-4 pl-12 pr-4 text-center font-mono text-2xl font-extrabold tracking-[0.35em] text-white outline-none transition placeholder:tracking-[0.2em] placeholder:text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              aria-describedby="code-help"
              required
            />
          </div>
          <p id="code-help" className="text-xs text-slate-500">
            Allowed: English letters A–Z and digits 0–9.
          </p>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || code.length !== 5}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" /> Verifying
                code...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" /> Login securely
              </>
            )}
          </button>
        </form>
        <div className="mt-5 text-center">
          <p className="text-sm text-slate-400">
            New student?{" "}
            <button
              type="button"
              onClick={() => setShowRegistration(true)}
              className="font-bold text-indigo-300 hover:text-indigo-200"
            >
              Register here
            </button>
          </p>
        </div>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
          Code login is verified by a Firebase Cloud Function. Codes are not
          checked directly in the browser.
        </p>
      </section>
    </main>
  );
}
