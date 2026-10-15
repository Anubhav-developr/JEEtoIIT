import React from 'react';
import { BarChart3, Clock, BookOpen, Target, Sparkles, BrainCircuit, X, Flame, LogOut } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, isMobileOpen, setIsMobileOpen, onLogout }) {
  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', color: 'text-indigo-400' },
    { id: 'timer', icon: Clock, label: 'Study Timer & Logs', color: 'text-amber-400' },
    { id: 'syllabus', icon: BookOpen, label: 'Syllabus & PYQs', color: 'text-blue-400' },
    { id: 'mocks', icon: Target, label: '88 Mock Tests Goal', color: 'text-rose-400' },
    { id: 'ai', icon: Sparkles, label: 'AI Test Analyzer', color: 'text-purple-400' },
  ];

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 shadow-lg shadow-indigo-500/20"><BrainCircuit className="h-6 w-6 text-white" /></div>
            <div><h1 className="text-sm font-extrabold tracking-wide text-white">JEE 2027</h1><p className="text-[11px] font-semibold text-indigo-400">Saumya's Portal</p></div>
          </div>
          <button className="text-slate-400 hover:text-white lg:hidden" onClick={() => setIsMobileOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveView(item.id); setIsMobileOpen(false); }}
              className={`flex w-full items-center space-x-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${activeView === item.id ? 'border-indigo-500/30 bg-indigo-600/20 text-indigo-300' : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <item.icon className={`h-5 w-5 ${activeView === item.id ? item.color : 'text-slate-500'}`} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="space-y-3 border-t border-slate-800 p-4">
          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-indigo-950/60 p-4 text-center">
            <p className="mb-1 flex items-center justify-center text-xs font-bold text-indigo-300"><Flame className="mr-1 h-4 w-4 text-amber-400" /> Active = Rank</p>
            <p className="text-[10px] text-slate-400">Target 70%+ Active Study!</p>
          </div>
          <button onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
