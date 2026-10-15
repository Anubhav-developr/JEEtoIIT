import React, { useState, useEffect } from 'react';
import { PYQ_YEARS, SYLLABUS_DATA } from '../data/studyData';
import { ChevronRight } from 'lucide-react';

export default function SyllabusTracker({ state, toggleSubtopic, togglePYQ }) {
  const [activeTab, setActiveTab] = useState('physics');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Syllabus & PYQ Tracker</h2>
          <p className="text-sm text-slate-400 mt-1">Check off subtopics and yearly PYQs (2019-2026).</p>
        </div>
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {['physics', 'chemistry', 'math'].map(sub => (
            <button key={sub} onClick={() => setActiveTab(sub)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${activeTab === sub ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {sub}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {SYLLABUS_DATA[activeTab].map(chap => (
          <details key={chap.id} className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors list-none">
              <div className="flex items-center space-x-3">
                <ChevronRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition-transform" />
                <span className="text-sm font-bold text-white">{chap.name}</span>
              </div>
              <div className="flex space-x-2">
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-400">
                  {chap.sub.filter(s => state.completedSubtopics.includes(s.id)).length}/{chap.sub.length} Topics
                </span>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-900/30 text-indigo-300">
                  {PYQ_YEARS.filter(y => state.completedPYQs.includes(`${chap.id}-${y}`)).length}/8 PYQs
                </span>
              </div>
            </summary>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-5">
              {/* Subtopics */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sub-topics Checklist</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {chap.sub.map(subt => (
                    <label key={subt.id} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-800/40 cursor-pointer transition-colors border border-transparent hover:border-slate-800">
                      <input type="checkbox" checked={state.completedSubtopics.includes(subt.id)} onChange={(e) => toggleSubtopic(subt.id, e.target.checked)} className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700" />
                      <span className="text-xs text-slate-300 font-medium">{subt.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* PYQs */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Yearly PYQs (2019 - 2026)</h4>
                <div className="flex flex-wrap gap-2">
                  {PYQ_YEARS.map(year => {
                    const pyqKey = `${chap.id}-${year}`;
                    const isDone = state.completedPYQs.includes(pyqKey);
                    return (
                      <button key={year} onClick={() => togglePYQ(pyqKey)} className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${isDone ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'}`}>
                        {year}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

// --- Mock Test Planner Component ---
