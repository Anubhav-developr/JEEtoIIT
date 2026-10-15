import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_TESTS } from '../data/studyData';
import { Wand2 } from 'lucide-react';

export default function MockTestPlanner({ state, toggleMockStatus, saveMockScore, sendToAnalyzer }) {
  const [filterMonth, setFilterMonth] = useState('oct');

  const filteredTests = useMemo(() => MOCK_TESTS.filter(t => t.month === filterMonth), [filterMonth]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">88 Mock Test Goals</h2>
          <p className="text-sm text-slate-400 mt-1">Oct 2026 to Jan 2027 daily mock strategy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           {['oct', 'nov', 'dec', 'jan'].map(m => (
             <button key={m} onClick={() => setFilterMonth(m)} className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filterMonth === m ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
               {m}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map(t => {
          const status = state.mockTestStatus[t.id] || { completed: false, score: '' };
          const isDone = status.completed;

          return (
            <div key={t.id} className={`bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between border ${isDone ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'} space-y-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{t.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t.date}</p>
                </div>
                <button onClick={() => toggleMockStatus(t.id)} className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {isDone ? 'Done' : 'Pending'}
                </button>
              </div>
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/60">
                <input type="number" placeholder="Score /300" defaultValue={status.score} onBlur={(e) => saveMockScore(t.id, e.target.value)} className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500" />
                <button onClick={() => sendToAnalyzer(t.id)} className="w-1/2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center space-x-1">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- AI Analyzer Component ---
