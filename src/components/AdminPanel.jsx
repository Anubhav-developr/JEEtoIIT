import React, { useCallback, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  getIdTokenResult,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { getToken } from 'firebase/app-check';
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogIn,
  LogOut,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
import { appCheck, auth, firebaseReady, functions } from '../lib/firebase';

const ADMIN_EMAIL = 'anubhavm1234@gmail.com';

async function ensureAppCheckToken() {
  if (!appCheck) {
    throw new Error(
      'App Check initialize nahi hua. Vercel Production mein VITE_RECAPTCHA_V3_SITE_KEY check karein.',
    );
  }
  const result = await getToken(appCheck, false);
  if (!result?.token) throw new Error('App Check token receive nahi hua.');
}

function friendlyError(error) {
  const code = String(error?.code || '');
  if (code.includes('permission-denied')) {
    return 'Admin permission reject hui. Confirm karein ki Google account exactly anubhavm1234@gmail.com hai aur function deployment successful hai.';
  }
  if (code.includes('unauthenticated')) {
    return 'Firebase login session verify nahi hui. Google account se dobara sign in karein.';
  }
  if (code.includes('app-check') || code.includes('failed-precondition')) {
    return error?.message || 'App Check ya precondition fail hui. Firebase/Cloud Functions logs check karein.';
  }
  if (code.includes('auth/account-exists-with-different-credential')) {
    return 'Is email ka Firebase account kisi doosre sign-in provider se bana hai. Firebase Authentication → Users mein provider check karein; duplicate account create na karein.';
  }
  return error?.message || 'Request complete nahi hui. Cloud Functions logs check karein.';
}

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [adminReady, setAdminReady] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [legacyRecordsSkipped, setLegacyRecordsSkipped] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [actingUid, setActingUid] = useState('');
  const [busySignIn, setBusySignIn] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setError('Firebase configuration available nahi hai.');
      setAuthReady(true);
      return undefined;
    }
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      setAdminReady(false);
      setRegistrations([]);
      setError('');
      setNotice('');
    });
  }, []);

  const loadPending = useCallback(async () => {
    if (!functions) throw new Error('Firebase Functions initialize nahi hua.');
    await ensureAppCheckToken();
    const listPending = httpsCallable(functions, 'listPendingStudentRegistrations');
    const result = await listPending({});
    const data = result.data || {};
    setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
    setLegacyRecordsSkipped(Number(data.legacyRecordsSkipped || 0));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function authorizeAndLoad() {
      setAdminReady(false);
      setRegistrations([]);
      setLegacyRecordsSkipped(0);
      if (!user) return;

      if (
        String(user.email || "")
          .trim()
          .toLowerCase() !== ADMIN_EMAIL
      ) {
        setError(
          `Wrong Google account. Admin login ke liye ${ADMIN_EMAIL} use karein.`,
        );
        return;
      }
      if (!user.emailVerified) {
        setError(
          "Google account ka email verified nahi dikh raha. Sahi account se sign in karein.",
        );
        return;
      }
      if (!functions) {
        setError("Firebase Functions initialize nahi hua.");
        return;
      }

      setBootstrapping(true);
      setError("");
      try {
        await ensureAppCheckToken();
        // This callable is allowlisted server-side to one verified Google identity.
        const bootstrap = httpsCallable(functions, "bootstrapAdmin");
        await bootstrap({});

        // Custom claims appear in the ID token only after refreshing it.
        await user.getIdToken(true);
        const tokenInfo = await getIdTokenResult(user);
        if (tokenInfo.claims.admin !== true) {
          throw new Error(
            "Admin claim refresh ke baad bhi token mein admin=true nahi mila.",
          );
        }
        if (cancelled) return;

        setAdminReady(true);
        await loadPending();
        if (cancelled) return;
        setNotice(
          "Admin verified. Pending students ab review ke liye available hain.",
        );
      } catch (cause) {
        console.error("[AdminPanel] Admin bootstrap/list failed:", cause);
        if (!cancelled) setError(friendlyError(cause));
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }

    authorizeAndLoad();
    return () => {
      cancelled = true;
    };
  }, [user, loadPending, retryNonce]);

  async function handleGoogleSignIn() {
    if (!auth) {
      setError('Firebase Auth initialize nahi hua.');
      return;
    }
    setBusySignIn(true);
    setError('');
    setNotice('');
    try {
      // Clear any student custom-token session before switching to the admin Google identity.
      if (auth.currentUser) await signOut(auth);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account', login_hint: ADMIN_EMAIL });
      await signInWithPopup(auth, provider);
    } catch (cause) {
      console.error('[AdminPanel] Google sign-in failed:', cause);
      setError(friendlyError(cause));
    } finally {
      setBusySignIn(false);
    }
  }

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    setAdminReady(false);
    setRegistrations([]);
    setNotice('Signed out. Student access-code login aur admin login alag hain.');
  }

  async function handleRefresh() {
    setLoadingList(true);
    setError('');
    try {
      await loadPending();
      setNotice('Pending registrations refresh ho gayi hain.');
    } catch (cause) {
      console.error('[AdminPanel] Refresh failed:', cause);
      setError(friendlyError(cause));
    } finally {
      setLoadingList(false);
    }
  }

  async function handleApprove(registration) {
    if (!functions || !registration?.uid) return;
    const confirmed = window.confirm(
      `${registration.name || 'This student'} (${registration.email}) ko approve karke access code email bhejna hai?`,
    );
    if (!confirmed) return;

    setActingUid(registration.uid);
    setError('');
    setNotice('');
    try {
      await ensureAppCheckToken();
      const approve = httpsCallable(functions, 'approveStudentRegistration');
      const result = await approve({ uid: registration.uid });
      if (result.data?.success !== true) {
        throw new Error('Approval function ne success confirm nahi kiya.');
      }
      setRegistrations((current) => current.filter((item) => item.uid !== registration.uid));
      setNotice(`Approved: access-code email request ${registration.email} ke liye complete hui. Student ko Inbox/Spam check karne ko kahen.`);
    } catch (cause) {
      console.error('[AdminPanel] Student approval failed:', cause);
      setError(friendlyError(cause));
    } finally {
      setActingUid('');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-3 shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
                JEE 2027 · Secure console
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                Admin approval
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Verified email ke baad approve karein; code server generate
                karke Resend se bhejega.
              </p>
            </div>
          </div>
          {user && (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          )}
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
          >
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="mb-5 flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {!authReady ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-slate-300">
            <LoaderCircle className="mr-3 h-5 w-5 animate-spin" /> Checking
            Firebase session…
          </div>
        ) : !user ||
          String(user.email || "")
            .trim()
            .toLowerCase() !== ADMIN_EMAIL ? (
          <section className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl sm:p-9">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
              <UserRound className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">
              Sign in with the designated admin Google account
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Is console ka admin identity fixed hai:{" "}
              <span className="font-semibold text-slate-200">
                {ADMIN_EMAIL}
              </span>
              . Student access code se admin permission nahi milti.
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={busySignIn}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {busySignIn ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              {busySignIn ? "Opening Google sign-in…" : "Continue with Google"}
            </button>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Google sign-in ke baad server email allowlist aur verified
              identity check karega; browser apne aap admin claim set nahi kar
              sakta.
            </p>
          </section>
        ) : bootstrapping ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-slate-300">
            <LoaderCircle className="mr-3 h-5 w-5 animate-spin" /> Verifying
            admin claim securely…
          </div>
        ) : !adminReady ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-sm text-slate-300">
              Admin identity abhi verify nahi hui. Error message dekhkar
              required configuration fix karein.
            </p>
            <button
              onClick={() => setRetryNonce((n) => n + 1)}
              disabled={bootstrapping}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {bootstrapping ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {bootstrapping
                ? "Verifying admin..."
                : "Retry admin verification"}
            </button>
          </section>
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Signed in as</p>
                <p className="mt-2 break-all font-semibold text-white">
                  {user.email}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-300">
                  <ShieldCheck className="h-4 w-4" /> Admin claim verified
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Pending registrations</p>
                <p className="mt-2 text-3xl font-extrabold text-white">
                  {registrations.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Approval process</p>
                <p className="mt-2 flex items-center gap-2 font-semibold text-white">
                  <MailCheck className="h-5 w-5 text-indigo-300" /> Verify →
                  Approve → Email
                </p>
              </div>
            </section>

            {legacyRecordsSkipped > 0 && (
              <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
                {legacyRecordsSkipped} legacy/invalid pending record(s) list se
                skip kiye gaye kyunki unka document ID Auth UID se match nahi
                karta. In records ko is panel se approve nahi kiya jayega.
              </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-5">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Users className="h-5 w-5 text-indigo-300" /> Student
                    registrations
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Sirf UID-based pending records dikhte hain. Approval
                    server-side verification karta hai.
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={loadingList || actingUid !== ""}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {loadingList ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}{" "}
                  Refresh
                </button>
              </div>

              {loadingList ? (
                <div className="flex items-center justify-center p-10 text-slate-400">
                  <LoaderCircle className="mr-3 h-5 w-5 animate-spin" /> Loading
                  registrations…
                </div>
              ) : registrations.length === 0 ? (
                <div className="p-10 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
                  <h3 className="mt-3 font-semibold text-white">
                    No eligible pending registrations
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Student ko email verify karna hoga. Nayi registration ke
                    baad Refresh dabayein.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {registrations.map((registration) => (
                    <article
                      key={registration.uid}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white">
                            {registration.name || "Unnamed student"}
                          </h3>
                          <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-200">
                            Pending
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${registration.emailVerified ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-rose-500/25 bg-rose-500/10 text-rose-200"}`}
                          >
                            {registration.emailVerified
                              ? "Email verified"
                              : "Email not verified"}
                          </span>
                        </div>
                        <p className="mt-1 break-all text-sm text-slate-300">
                          {registration.email}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {registration.targetExam ||
                            "Target exam not specified"}
                        </p>
                        {registration.createdAt && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" /> Submitted{" "}
                            {new Date(registration.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleApprove(registration)}
                        disabled={
                          actingUid !== "" ||
                          loadingList ||
                          !registration.emailVerified
                        }
                        title={
                          !registration.emailVerified
                            ? "Student must verify their email first"
                            : "Approve registration and send access code"
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-bold text-white hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actingUid === registration.uid ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <MailCheck className="h-4 w-4" />
                        )}
                        {actingUid === registration.uid
                          ? "Approving…"
                          : registration.emailVerified
                            ? "Approve & email code"
                            : "Verify email first"}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Approval function code email bhejne se pehle Firebase Auth ka
              emailVerified status check karta hai. Agar approval fail ho,
              student record ya code manually activate na karein—server error
              logs check karein.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
