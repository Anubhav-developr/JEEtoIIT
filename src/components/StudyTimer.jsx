import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, Square, RotateCcw, Timer, Clock3, BookOpen,
  Brain, Target, FileText, Video, Calculator, ClipboardCheck,
  Coffee, CheckCircle2, AlertCircle
} from 'lucide-react';

const STUDY_TYPES = {
  active: [
    { value: 'PYQ Practice', label: 'PYQ Practice', description: 'Previous-year questions', icon: Target },
    { value: 'Problem Solving / DPP', label: 'Problem Solving / DPP', description: 'DPPs and practice sets', icon: Calculator },
    { value: 'Mock Test', label: 'Mock Test', description: 'Full or sectional tests', icon: ClipboardCheck },
    { value: 'Question Revision', label: 'Question Revision', description: 'Redo marked / wrong questions', icon: Brain },
  ],
  passive: [
    { value: 'Video Lecture', label: 'Video Lecture', description: 'Online or recorded classes', icon: Video },
    { value: 'Notes / Textbook', label: 'Notes / Textbook', description: 'Read notes or theory', icon: BookOpen },
    { value: 'Formula Revision', label: 'Formula Revision', description: 'Formula sheets and flashcards', icon: Calculator },
    { value: 'Concept Reading', label: 'Concept Reading', description: 'Review concepts without solving', icon: FileText },
  ],
};

const SUBJECTS = ['Physics', 'Chemistry', 'Maths'];
const POMODORO_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(safe / 3600)).padStart(2, '0');
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const s = String(safe % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function StudyTimer({ addSession, addQuestionLog }) {
  const [mode, setMode] = useState('stopwatch'); // stopwatch | countdown | pomodoro
  const [studyType, setStudyType] = useState('active');
  const [category, setCategory] = useState('PYQ Practice');
  const [subject, setSubject] = useState('Physics');
  const [customMinutes, setCustomMinutes] = useState(45);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [attempted, setAttempted] = useState('');
  const [correct, setCorrect] = useState('');
  const [notice, setNotice] = useState('');
  const startedAtRef = useRef(null);
  const accumulatedRef = useRef(0);
  const sessionMetaRef = useRef(null);

  const selectedCategory = useMemo(
    () => STUDY_TYPES[studyType].find(item => item.value === category) || STUDY_TYPES[studyType][0],
    [studyType, category]
  );

  const targetSeconds = mode === 'pomodoro'
    ? (isBreak ? BREAK_SECONDS : POMODORO_SECONDS)
    : mode === 'countdown' ? Math.max(1, Number(customMinutes) || 1) * 60 : 0;

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = window.setInterval(() => {
      if (mode === 'stopwatch') {
        const elapsed = accumulatedRef.current + (Date.now() - (startedAtRef.current || Date.now())) / 1000;
        setSeconds(Math.floor(elapsed));
      } else {
        setSeconds(current => {
          if (current <= 1) {
            window.setTimeout(() => finishCountdown(), 0);
            return 0;
          }
          return current - 1;
        });
      }
    }, 250);
    return () => window.clearInterval(interval);
  // finishCountdown is intentionally stable through refs/state and timer lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode]);

  const finishCountdown = () => {
    setIsRunning(false);
    if (mode === 'pomodoro' && !isBreak) {
      saveCurrentSession(POMODORO_SECONDS, true);
      setIsBreak(true);
      setSeconds(BREAK_SECONDS);
      setNotice('Focus block complete! Your session was saved. Take a 5-minute break.');
      return;
    }
    if (mode === 'pomodoro' && isBreak) {
      setIsBreak(false);
      setSeconds(POMODORO_SECONDS);
      setNotice('Break complete. Ready for another focus block.');
      return;
    }
    if (mode === 'countdown') {
      const elapsed = Math.max(0, targetSeconds - 0);
      saveCurrentSession(elapsed, true);
      setNotice('Countdown complete! Your study session was saved.');
      setSeconds(targetSeconds);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    accumulatedRef.current = 0;
    startedAtRef.current = null;
    setSeconds(mode === 'stopwatch' ? 0 : targetSeconds);
    setNotice('');
  };

  const changeMode = (nextMode) => {
    setIsRunning(false);
    accumulatedRef.current = 0;
    startedAtRef.current = null;
    setMode(nextMode);
    setIsBreak(false);
    setSeconds(nextMode === 'stopwatch' ? 0 : nextMode === 'pomodoro' ? POMODORO_SECONDS : Math.max(1, Number(customMinutes) || 1) * 60);
    setNotice('');
  };

  const changeStudyType = (nextType) => {
    setStudyType(nextType);
    setCategory(STUDY_TYPES[nextType][0].value);
    setNotice('');
  };

  const startTimer = () => {
    if (mode !== 'stopwatch' && seconds <= 0) setSeconds(targetSeconds);
    if (mode === 'stopwatch') startedAtRef.current = Date.now();
    sessionMetaRef.current = { studyType, category, subject, sessionNote };
    setNotice('');
    setIsRunning(true);
  };

  const pauseTimer = () => {
    if (mode === 'stopwatch' && startedAtRef.current) {
      accumulatedRef.current += (Date.now() - startedAtRef.current) / 1000;
      startedAtRef.current = null;
      setSeconds(Math.floor(accumulatedRef.current));
    }
    setIsRunning(false);
  };

  const saveCurrentSession = (durationSec, askQuestions = true) => {
    const meta = sessionMetaRef.current || { studyType, category, subject, sessionNote };
    sessionMetaRef.current = { ...meta, durationSec: Math.round(durationSec) };
    if (durationSec >= 15) {
      addSession({
        durationSec: Math.round(durationSec),
        type: meta.studyType,
        category: meta.category,
        tag: meta.category,
        subject: meta.subject,
        note: meta.sessionNote?.trim() || '',
        mode,
        completedAt: Date.now(),
      });
      if (meta.studyType === 'active' && askQuestions) setShowQuestionModal(true);
    }
  };

  const stopAndSave = () => {
    if (!isRunning && seconds === 0) return;
    let elapsed;
    if (mode === 'stopwatch') {
      elapsed = startedAtRef.current
        ? accumulatedRef.current + (Date.now() - startedAtRef.current) / 1000
        : accumulatedRef.current;
    } else {
      elapsed = Math.max(0, targetSeconds - seconds);
    }
    setIsRunning(false);
    startedAtRef.current = null;
    accumulatedRef.current = 0;
    if (elapsed >= 15) {
      saveCurrentSession(elapsed, true);
      setNotice(`Saved ${formatTime(elapsed)} of ${sessionMetaRef.current?.category || category}.`);
      setShowQuestionModal(sessionMetaRef.current?.studyType === 'active');
    } else {
      setNotice('Session was too short to save (minimum 15 seconds).');
    }
    setSeconds(mode === 'stopwatch' ? 0 : targetSeconds);
  };

  const saveQuestionLog = () => {
    const total = Math.max(0, Number.parseInt(attempted, 10) || 0);
    const right = Math.min(total, Math.max(0, Number.parseInt(correct, 10) || 0));
    if (total > 0) {
      addQuestionLog({
        subject: sessionMetaRef.current?.subject || subject,
        tag: sessionMetaRef.current?.category || category,
        attempted: total,
        correct: right,
        timeMin: Math.max(1, Math.round((sessionMetaRef.current?.durationSec || seconds) / 60)),
      });
    }
    setAttempted('');
    setCorrect('');
    setShowQuestionModal(false);
  };

  const displayedSeconds = mode === 'stopwatch' ? seconds : Math.max(0, seconds);
  const progress = mode === 'stopwatch'
    ? Math.min(100, (seconds / 3600) * 100)
    : Math.min(100, ((targetSeconds - displayedSeconds) / Math.max(1, targetSeconds)) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white">Study Timer & Session Lab</h2>
        <p className="text-sm text-slate-400 mt-1">Track how you study, not just how long you sit at your desk.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-500" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Current session</p>
              <h3 className="mt-1 text-lg font-bold text-white">{isBreak ? 'Recovery break' : selectedCategory.label}</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${studyType === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-violet-500/15 text-violet-300'}`}>
              {isBreak ? 'BREAK' : studyType === 'active' ? 'ACTIVE STUDY' : 'PASSIVE STUDY'}
            </span>
          </div>

          <div className="my-6 flex flex-wrap justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-1.5">
            {[
              { id: 'stopwatch', label: 'Stopwatch', icon: Clock3 },
              { id: 'countdown', label: 'Custom Timer', icon: Timer },
              { id: 'pomodoro', label: 'Pomodoro 25/5', icon: Coffee },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => changeMode(item.id)} disabled={isRunning}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${mode === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <Icon className="h-4 w-4" />{item.label}
                </button>
              );
            })}
          </div>

          {mode === 'countdown' && (
            <div className="mb-3 flex items-center justify-center gap-3 text-xs text-slate-400">
              <label htmlFor="custom-minutes">Countdown length</label>
              <select id="custom-minutes" value={customMinutes} disabled={isRunning}
                onChange={e => { setCustomMinutes(Number(e.target.value)); setSeconds(Number(e.target.value) * 60); }}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
                {[15, 25, 30, 45, 50, 60, 90, 120].map(min => <option key={min} value={min}>{min} minutes</option>)}
              </select>
            </div>
          )}

          <div className="py-5 text-center">
            <div className="font-mono text-6xl font-black tracking-tight text-white sm:text-8xl" aria-live="polite">
              {formatTime(displayedSeconds)}
            </div>
            <div className="mx-auto mt-5 h-2 max-w-md overflow-hidden rounded-full bg-slate-800">
              <div className={`h-full rounded-full transition-all duration-300 ${studyType === 'active' ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-violet-500 to-fuchsia-400'}`}
                style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{mode === 'stopwatch' ? 'Elapsed focus time' : `${Math.round(progress)}% complete`}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 border-t border-slate-800 pt-6">
            {!isRunning ? (
              <button onClick={startTimer} className="inline-flex items-center rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500">
                <Play className="mr-2 h-4 w-4 fill-current" /> {seconds > 0 && mode !== 'stopwatch' ? 'Resume / Start' : 'Start Focus'}
              </button>
            ) : (
              <button onClick={pauseTimer} className="inline-flex items-center rounded-xl bg-amber-500 px-7 py-3 font-bold text-slate-950 transition hover:bg-amber-400">
                <Pause className="mr-2 h-4 w-4 fill-current" /> Pause
              </button>
            )}
            <button onClick={stopAndSave} className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 font-bold text-rose-300 transition hover:border-rose-500/50 hover:bg-slate-700">
              <Square className="mr-2 h-4 w-4 fill-current" /> Stop & Save
            </button>
            <button onClick={resetTimer} className="inline-flex items-center rounded-xl border border-slate-700 px-4 py-3 font-bold text-slate-300 transition hover:bg-slate-800" title="Reset timer">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          <div>
            <h3 className="font-bold text-white">Classify your study</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Choose the activity before starting. Dashboard analytics use these categories.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
            <button onClick={() => changeStudyType('active')} disabled={isRunning}
              className={`rounded-lg px-3 py-3 text-sm font-extrabold transition disabled:opacity-50 ${studyType === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Target className="mx-auto mb-1 h-5 w-5" />Active study
            </button>
            <button onClick={() => changeStudyType('passive')} disabled={isRunning}
              className={`rounded-lg px-3 py-3 text-sm font-extrabold transition disabled:opacity-50 ${studyType === 'passive' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <BookOpen className="mx-auto mb-1 h-5 w-5" />Passive study
            </button>
          </div>

          <div className="space-y-2">
            {STUDY_TYPES[studyType].map(item => {
              const Icon = item.icon;
              const selected = category === item.value;
              return (
                <button key={item.value} onClick={() => { setCategory(item.value); setNotice(''); }} disabled={isRunning}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-50 ${selected ? studyType === 'active' ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-violet-500/60 bg-violet-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}`}>
                  <span className={`rounded-lg p-2 ${selected ? studyType === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-violet-500/15 text-violet-300' : 'bg-slate-800 text-slate-400'}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-100">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
                  </span>
                  {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          <div>
            <label htmlFor="study-subject" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Subject</label>
            <div className="grid grid-cols-3 gap-2">
              {SUBJECTS.map(name => <button key={name} onClick={() => setSubject(name)} disabled={isRunning}
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition disabled:opacity-50 ${subject === name ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'}`}>{name}</button>)}
            </div>
          </div>
          <div>
            <label htmlFor="session-note" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Session note (optional)</label>
            <input id="session-note" value={sessionNote} onChange={e => setSessionNote(e.target.value)} disabled={isRunning}
              placeholder="e.g. Electrostatics: Gauss law" maxLength={120}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 disabled:opacity-50" />
          </div>
        </section>
      </div>

      {notice && <div className="flex items-start gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-sm text-indigo-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}

      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300"><Target className="h-5 w-5" /></div>
              <div><h3 className="text-lg font-bold text-white">Log your practice</h3><p className="text-xs text-slate-400">Optional, but useful for accuracy analytics.</p></div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-400">Questions attempted</label>
              <input type="number" min="0" value={attempted} onChange={e => setAttempted(e.target.value)} placeholder="e.g. 30"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-400">Correct answers</label>
              <input type="number" min="0" max={attempted || undefined} value={correct} onChange={e => setCorrect(e.target.value)} placeholder="e.g. 24"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowQuestionModal(false)} className="flex-1 rounded-xl bg-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700">Skip</button>
              <button onClick={saveQuestionLog} className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500">Save question log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
