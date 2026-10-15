import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SYLLABUS_DATA } from '../data/studyData';
import { Zap, Activity, CheckCircle2, Target, BookOpen, Brain, Clock3, TrendingUp } from 'lucide-react';

const ACTIVE_CATEGORIES = ['PYQ Practice', 'Problem Solving / DPP', 'Mock Test', 'Question Revision'];
const PASSIVE_CATEGORIES = ['Video Lecture', 'Notes / Textbook', 'Formula Revision', 'Concept Reading'];

function formatDuration(totalSec = 0) {
  const mins = Math.round(Math.max(0, totalSec) / 60);
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}

function localDateKey(value) {
  const d = value ? new Date(value) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Dashboard({ state }) {
  const { studySessions = [], questionLogs = [], completedSubtopics = [], completedPYQs = [] } = state;

  const analytics = useMemo(() => {
    const todayKey = localDateKey();
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);
    const activeByCategory = Object.fromEntries(ACTIVE_CATEGORIES.map(key => [key, 0]));
    const passiveByCategory = Object.fromEntries(PASSIVE_CATEGORIES.map(key => [key, 0]));
    const subjectTotals = { Physics: 0, Chemistry: 0, Maths: 0 };
    let activeSec = 0, passiveSec = 0, todayActive = 0, todayPassive = 0, weekSec = 0;

    studySessions.forEach(session => {
      const duration = Math.max(0, Number(session.durationSec) || 0);
      const timestamp = session.timestamp || session.completedAt;
      const dayKey = session.dateStr || (timestamp ? localDateKey(timestamp) : '');
      const category = session.category || session.tag || 'Other';
      if (session.type === 'active') {
        activeSec += duration;
        if (dayKey === todayKey) todayActive += duration;
        if (activeByCategory[category] !== undefined) activeByCategory[category] += duration;
      } else {
        passiveSec += duration;
        if (dayKey === todayKey) todayPassive += duration;
        if (passiveByCategory[category] !== undefined) passiveByCategory[category] += duration;
      }
      if (timestamp && new Date(timestamp) >= weekStart) weekSec += duration;
      if (subjectTotals[session.subject] !== undefined) subjectTotals[session.subject] += duration;
    });

    let todayQs = 0, totalQs = 0, totalCorrect = 0;
    questionLogs.forEach(log => {
      totalQs += Number(log.attempted) || 0;
      totalCorrect += Number(log.correct) || 0;
      if (log.dateStr === todayKey) todayQs += Number(log.attempted) || 0;
    });

    let totalSub = 0, totalPYQ = 0;
    ['physics', 'chemistry', 'math'].forEach(subject => {
      SYLLABUS_DATA[subject].forEach(chapter => {
        totalSub += chapter.sub.length;
        totalPYQ += 8;
      });
    });
    const totalSec = activeSec + passiveSec;
    return {
      activeSec, passiveSec, totalSec, todayActive, todayPassive, weekSec,
      activeRatio: totalSec ? Math.round(activeSec / totalSec * 100) : 0,
      accuracy: totalQs ? Math.round(totalCorrect / totalQs * 100) : 0,
      todayQs, totalQs, totalCorrect,
      pyqPct: totalPYQ ? Math.round(completedPYQs.length / totalPYQ * 100) : 0,
      totalPYQ, activeByCategory, passiveByCategory, subjectTotals,
    };
  }, [studySessions, questionLogs, completedPYQs]);

  const pieData = [
    { name: 'Active study', value: analytics.activeSec || 0, color: '#10b981' },
    { name: 'Passive study', value: analytics.passiveSec || 0, color: '#8b5cf6' },
  ];
  const categoryData = [
    ...ACTIVE_CATEGORIES.map(name => ({ name, minutes: Math.round(analytics.activeByCategory[name] / 60), type: 'Active' })),
    ...PASSIVE_CATEGORIES.map(name => ({ name, minutes: Math.round(analytics.passiveByCategory[name] / 60), type: 'Passive' })),
  ];
  const subjectData = Object.entries(analytics.subjectTotals).map(([subject, seconds]) => ({ subject, hours: Number((seconds / 3600).toFixed(2)) }));

  const StatCard = ({ title, value, hint, icon: Icon, color = 'text-white', progress }) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-2 flex items-start justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span><Icon className={`h-5 w-5 ${color}`} /></div>
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      {progress !== undefined && <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>}
    </div>
  );

  const CategoryList = ({ title, entries, icon: Icon, tone }) => {
    const max = Math.max(1, ...Object.values(entries));
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-center gap-2"><Icon className={`h-5 w-5 ${tone}`} /><h3 className="font-bold text-white">{title}</h3></div>
        <div className="space-y-4">
          {Object.entries(entries).map(([name, seconds]) => (
            <div key={name}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="text-slate-300">{name}</span><span className="shrink-0 font-bold text-slate-400">{formatDuration(seconds)}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${tone === 'text-emerald-400' ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${seconds ? Math.max(2, seconds / max * 100) : 0}%` }} /></div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">JEE 2027 Command Center 🚀</h2>
        <p className="mt-1 text-sm text-slate-400">Saumya's study time, practice quality and consistency at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Study" value={formatDuration(analytics.activeSec)} hint={`${analytics.activeRatio}% of all tracked study`} icon={Zap} color="text-emerald-400" progress={analytics.activeRatio} />
        <StatCard title="Passive Study" value={formatDuration(analytics.passiveSec)} hint="Lectures, notes, formulas & reading" icon={BookOpen} color="text-violet-400" />
        <StatCard title="Today's Focus" value={formatDuration(analytics.todayActive + analytics.todayPassive)} hint={`Active ${formatDuration(analytics.todayActive)} · Passive ${formatDuration(analytics.todayPassive)}`} icon={Clock3} color="text-cyan-400" />
        <StatCard title="Last 7 Days" value={formatDuration(analytics.weekSec)} hint="Tracked study time" icon={TrendingUp} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today's Questions" value={analytics.todayQs} hint="/ 100 daily goal" icon={Activity} color="text-cyan-400" progress={analytics.todayQs} />
        <StatCard title="Overall Accuracy" value={`${analytics.accuracy}%`} hint={`${analytics.totalCorrect} correct of ${analytics.totalQs} attempted`} icon={Target} color="text-rose-400" />
        <StatCard title="PYQ Mastery (19–26)" value={`${analytics.pyqPct}%`} hint={`${completedPYQs.length} of ${analytics.totalPYQ} chapter-year checkoffs`} icon={CheckCircle2} color="text-indigo-400" progress={analytics.pyqPct} />
        <StatCard title="Active Ratio Goal" value={analytics.activeRatio >= 70 ? 'On target' : 'Keep going'} hint="Aim for 70%+ active study" icon={Brain} color={analytics.activeRatio >= 70 ? 'text-emerald-400' : 'text-amber-400'} progress={analytics.activeRatio} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="flex h-80 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-3 font-bold text-white">Active vs Passive Study</h3>
          {analytics.totalSec === 0 ? <div className="flex flex-1 items-center justify-center text-center text-sm text-slate-500">Start and save a timer session to see your study split here.</div> : (
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={58} outerRadius={88} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip formatter={value => [formatDuration(value), 'Time']} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: '#cbd5e1' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
        <section className="flex h-80 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-3 font-bold text-white">Study Time by Subject</h3>
          {analytics.totalSec === 0 ? <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Your Physics, Chemistry and Maths time will appear here.</div> : (
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip formatter={value => [`${value} hrs`, 'Study time']} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 8 }} />
                  <Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CategoryList title="Active Study Breakdown" entries={analytics.activeByCategory} icon={Target} tone="text-emerald-400" />
        <CategoryList title="Passive Study Breakdown" entries={analytics.passiveByCategory} icon={BookOpen} tone="text-violet-400" />
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="mb-4 font-bold text-white">Recent Study Sessions</h3>
        {studySessions.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No saved sessions yet. Use the Study Timer to start building your analytics.</p> : (
          <div className="space-y-3">
            {[...studySessions].sort((a, b) => (b.timestamp || b.completedAt || 0) - (a.timestamp || a.completedAt || 0)).slice(0, 8).map(session => (
              <div key={session.id || `${session.timestamp}-${session.category}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase ${session.type === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-violet-500/10 text-violet-300'}`}>{session.type === 'active' ? 'Active' : 'Passive'}</span>
                    <span className="text-sm font-bold text-white">{session.category || session.tag || 'Study session'}</span>
                    <span className="text-xs text-slate-500">{session.subject || 'Subject not set'}</span>
                  </div>
                  {session.note && <p className="mt-1 truncate text-xs text-slate-400">{session.note}</p>}
                  <p className="mt-1 text-[11px] text-slate-500">{session.timestamp ? new Date(session.timestamp).toLocaleString() : session.dateStr || 'Saved session'}</p>
                </div>
                <span className="text-sm font-extrabold text-slate-200">{formatDuration(session.durationSec)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="mb-4 font-bold text-white">Recent Question Logs</h3>
        {questionLogs.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No question logs yet. Save an active study session and log your practice.</p> : (
          <div className="space-y-3">
            {questionLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <div><p className="text-sm font-bold text-white">{log.subject} <span className="ml-2 rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-normal text-indigo-300">{log.tag}</span></p><p className="mt-1 text-xs text-slate-500">{log.dateStr} · {log.timeMin} mins</p></div>
                <div className="text-right"><p className="text-sm font-extrabold text-emerald-400">{log.correct} / {log.attempted}</p><p className="text-[10px] text-slate-500">Correct</p></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
