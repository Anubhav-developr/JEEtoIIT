import React, { useState, useEffect } from 'react';
import { getIdTokenResult, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { BrainCircuit, ListTodo, LogOut, LoaderCircle } from 'lucide-react';
import IntroAnimation from './components/IntroAnimation';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudyTimer from './components/StudyTimer';
import SyllabusTracker from './components/SyllabusTracker';
import MockTestPlanner from './components/MockTestPlanner';
import AIAnalyzer from './components/AIAnalyzer';
import CodeLogin from './components/CodeLogin';
import { auth, db, firebaseReady } from './lib/firebase';

const EMPTY_STATE = {
  completedSubtopics: [],
  completedPYQs: [],
  mockTestStatus: {},
  studySessions: [],
  questionLogs: [],
};
const adminMode =
  new URLSearchParams(window.location.search).get("admin") === "1";

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [state, setState] = useState(EMPTY_STATE);
  const [prefillScoreForAI, setPrefillScoreForAI] = useState("");
  const [saveError, setSaveError] = useState("");

  const appId = import.meta.env.VITE_APP_ID || "saumya-jee-2027";

  useEffect(() => {
    if (adminMode) {
      setAuthReady(true);
      return undefined;
    }
    if (!firebaseReady || !auth) {
      setAuthReady(true);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Reject any legacy anonymous session; only server-issued code-login tokens are accepted.
      if (currentUser) {
        try {
          const tokenInfo = await getIdTokenResult(currentUser);
          if (tokenInfo.claims.accessCodeLogin !== true) {
            await signOut(auth);
            setUser(null);
            setState(EMPTY_STATE);
            setAuthReady(true);
            return;
          }
        } catch (error) {
          console.error("Could not validate login token:", error);
          await signOut(auth);
          setUser(null);
          setState(EMPTY_STATE);
          setAuthReady(true);
          return;
        }
      }
      setUser(currentUser);
      setState(EMPTY_STATE);
      setAuthReady(true);
    });
    return unsubscribe;
  }, [adminMode]);

  useEffect(() => {
    if (adminMode || !user || !db) return undefined;
    const baseRef = doc(db, "artifacts", appId, "users", user.uid);

    const unsubSyllabus = onSnapshot(
      doc(baseRef, "userData", "syllabus"),
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        setState((s) => ({
          ...s,
          completedSubtopics: data.subtopics || [],
          completedPYQs: data.pyqs || [],
        }));
      },
      handleFirestoreError,
    );

    const unsubMocks = onSnapshot(
      doc(baseRef, "userData", "mocks"),
      (snap) => {
        setState((s) => ({
          ...s,
          mockTestStatus: snap.exists() ? snap.data().tests || {} : {},
        }));
      },
      handleFirestoreError,
    );

    const unsubSessions = onSnapshot(
      doc(baseRef, "userData", "studySessions"),
      (snap) => {
        setState((s) => ({
          ...s,
          studySessions: snap.exists() ? snap.data().logs || [] : [],
        }));
      },
      handleFirestoreError,
    );

    const unsubQs = onSnapshot(
      doc(baseRef, "userData", "questionLogs"),
      (snap) => {
        setState((s) => ({
          ...s,
          questionLogs: snap.exists() ? snap.data().logs || [] : [],
        }));
      },
      handleFirestoreError,
    );

    function handleFirestoreError(error) {
      console.error("Firestore read failed:", error);
      setSaveError(
        "Firestore access failed. Firebase rules aur login setup check karein.",
      );
    }

    return () => {
      unsubSyllabus();
      unsubMocks();
      unsubSessions();
      unsubQs();
    };
  }, [user, appId]);

  const saveDoc = async (collectionName, payload) => {
    if (!user || !db) {
      setSaveError(
        "Data save nahi hua: login/Firebase connection available nahi hai.",
      );
      return;
    }
    try {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "userData",
          collectionName,
        ),
        payload,
        { merge: true },
      );
      setSaveError("");
    } catch (error) {
      console.error("Firestore write failed:", error);
      setSaveError(
        "Data save nahi hua. Firestore rules aur internet connection check karein.",
      );
    }
  };

  const toggleSubtopic = async (id, isChecked) => {
    const curr = [...state.completedSubtopics];
    const next = isChecked
      ? curr.includes(id)
        ? curr
        : [...curr, id]
      : curr.filter((item) => item !== id);
    await saveDoc("syllabus", { subtopics: next });
  };

  const togglePYQ = async (key) => {
    const next = state.completedPYQs.includes(key)
      ? state.completedPYQs.filter((item) => item !== key)
      : [...state.completedPYQs, key];
    await saveDoc("syllabus", { pyqs: next });
  };

  const toggleMockStatus = async (id) => {
    const mocks = { ...state.mockTestStatus };
    const previous = mocks[id] || { completed: false, score: "" };
    mocks[id] = { ...previous, completed: !previous.completed };
    await saveDoc("mocks", { tests: mocks });
  };

  const saveMockScore = async (id, score) => {
    const mocks = { ...state.mockTestStatus };
    const previous = mocks[id] || { completed: false, score: "" };
    mocks[id] = { ...previous, score };
    await saveDoc("mocks", { tests: mocks });
  };

  const sendToAnalyzer = (id) => {
    setPrefillScoreForAI(state.mockTestStatus[id]?.score || "");
    setActiveView("ai");
  };

  const addSession = async (sessionData) => {
    const now = new Date();
    const newLog = {
      id: `s_${Date.now()}`,
      timestamp: now.getTime(),
      dateStr: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      ...sessionData,
    };
    await saveDoc("studySessions", {
      logs: [newLog, ...state.studySessions].slice(0, 1500),
    });
  };

  const addQuestionLog = async (qData) => {
    const now = new Date();
    const newLog = {
      id: `q_${Date.now()}`,
      timestamp: now.getTime(),
      dateStr: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      ...qData,
    };
    await saveDoc("questionLogs", {
      logs: [newLog, ...state.questionLogs].slice(0, 1500),
    });
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setActiveView("dashboard");
    setIsMobileOpen(false);
    setState(EMPTY_STATE);
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard state={state} />;
      case "timer":
        return (
          <StudyTimer
            addSession={addSession}
            addQuestionLog={addQuestionLog}
            questionLogs={state.questionLogs}
          />
        );
      case "syllabus":
        return (
          <SyllabusTracker
            state={state}
            toggleSubtopic={toggleSubtopic}
            togglePYQ={togglePYQ}
          />
        );
      case "mocks":
        return (
          <MockTestPlanner
            state={state}
            toggleMockStatus={toggleMockStatus}
            saveMockScore={saveMockScore}
            sendToAnalyzer={sendToAnalyzer}
          />
        );
      case "ai":
        return <AIAnalyzer prefillScore={prefillScoreForAI} />;
      default:
        return <Dashboard state={state} />;
    }
  };

  // Admin mode must be handled before student login guards.
  if (adminMode) {
    return <AdminPanel />;
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
        Checking login...
      </div>
    );
  }

  if (!user) return <CodeLogin />;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30">
      {!introDone ? (
        <IntroAnimation onComplete={() => setIntroDone(true)} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            activeView={activeView}
            setActiveView={setActiveView}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            onLogout={handleLogout}
          />
          <main className="relative flex h-screen flex-1 flex-col overflow-hidden bg-slate-950">
            <header className="z-20 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 p-3 backdrop-blur-md lg:justify-end lg:px-6">
              <div className="flex items-center gap-2 lg:hidden">
                <BrainCircuit className="h-5 w-5 text-indigo-400" />
                <span className="text-sm font-bold text-white">
                  Saumya's Portal
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-slate-500 sm:inline">
                  Signed in · {user.uid.slice(0, 12)}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
                <button
                  onClick={() => setIsMobileOpen(true)}
                  className="text-slate-300 lg:hidden"
                  aria-label="Open navigation"
                >
                  <ListTodo className="h-6 w-6" />
                </button>
              </div>
            </header>
            {saveError && (
              <div
                role="status"
                className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-200"
              >
                {saveError}
              </div>
            )}
            <div className="custom-scrollbar relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
              {renderView()}
            </div>
            <div className="pointer-events-none absolute bottom-0 right-0 z-0 h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[100px]" />
          </main>
        </div>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        details > summary::-webkit-details-marker { display: none; }
      `,
        }}
      />
    </div>
  );
}
