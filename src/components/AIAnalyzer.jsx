import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';

export default function AIAnalyzer({ prefillScore }) {
  const [scoreTotal, setScoreTotal] = useState(prefillScore || '');
  const [scoreP, setScoreP] = useState('');
  const [scoreC, setScoreC] = useState('');
  const [scoreM, setScoreM] = useState('');
  const [accuracy, setAccuracy] = useState('');
  const [report, setReport] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  useEffect(() => {
    if (prefillScore) setScoreTotal(prefillScore);
  }, [prefillScore]);

  const handleAnalyze = async () => {
    if (!scoreTotal && !report) return alert("Please provide at least a Total Score or Report summary.");
    
    setLoading(true);
    setOutput(null);

    const prompt = `Act as an elite IIT JEE Main coach for Saumya.
Analyze her mock test:
- Physics: ${scoreP || 'N/A'}/100
- Chemistry: ${scoreC || 'N/A'}/100
- Maths: ${scoreM || 'N/A'}/100
- Total: ${scoreTotal || 'N/A'}/300
- Accuracy: ${accuracy || 'N/A'}%
- Testbook Weak Areas/Notes: "${report || 'None'}"

Provide a practical action plan in English (with a motivational Hindi touch):
1. Executive Analysis.
2. Subject-wise Diagnosis.
3. Recommended Active PYQ Practice.
Keep it strictly formatted with clear bullet points.`;

    try {
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        setOutput(rawText);
      } else {
        throw new Error("No response");
      }
    } catch (e) {
      console.error(e);
      setOutput("⚠️ Failed to generate AI strategy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white">AI Testbook Report Analyzer</h2>
        <p className="text-sm text-slate-400 mt-1">Get personalized strategy from Gemini API based on your mock results.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 lg:col-span-5 space-y-4">
           <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Test Metrics</h3>
           <div className="grid grid-cols-3 gap-3">
             <div><label className="text-xs text-slate-400">Physics</label><input type="number" value={scoreP} onChange={e=>setScoreP(e.target.value)} placeholder="/100" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mt-1" /></div>
             <div><label className="text-xs text-slate-400">Chemistry</label><input type="number" value={scoreC} onChange={e=>setScoreC(e.target.value)} placeholder="/100" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mt-1" /></div>
             <div><label className="text-xs text-slate-400">Maths</label><input type="number" value={scoreM} onChange={e=>setScoreM(e.target.value)} placeholder="/100" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mt-1" /></div>
           </div>
           <div className="grid grid-cols-2 gap-3">
             <div><label className="text-xs text-slate-400">Total Score</label><input type="number" value={scoreTotal} onChange={e=>setScoreTotal(e.target.value)} placeholder="/300" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-indigo-500 mt-1" /></div>
             <div><label className="text-xs text-slate-400">Accuracy %</label><input type="number" value={accuracy} onChange={e=>setAccuracy(e.target.value)} placeholder="e.g. 85%" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mt-1" /></div>
           </div>
           <div>
             <label className="text-xs text-slate-400">Testbook Weak Areas Summary (Paste here)</label>
             <textarea rows="4" value={report} onChange={e=>setReport(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 mt-1 resize-none" placeholder="Paste your negative marking analysis or weak topics..."></textarea>
           </div>
           <button onClick={handleAnalyze} disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50">
             <Sparkles className="w-5 h-5" /> <span>{loading ? 'Analyzing...' : 'Generate AI Strategy'}</span>
           </button>
        </div>

        {/* AI Output */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 lg:col-span-7 flex flex-col min-h-[400px]">
           <h3 className="text-sm font-bold text-indigo-400 border-b border-slate-800 pb-2 mb-4 flex items-center"><BrainCircuit className="w-4 h-4 mr-2"/> Saumya's Action Plan</h3>
           
           {!output && !loading && (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
               <BrainCircuit className="w-16 h-16 mb-4 text-slate-800" />
               <p className="text-sm">Submit your test details to receive a personalized AI strategy.</p>
             </div>
           )}

           {loading && (
             <div className="flex-1 flex flex-col items-center justify-center text-indigo-400 text-center animate-pulse">
               <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="text-sm font-bold">Gemini AI is processing your metrics...</p>
             </div>
           )}

           {output && !loading && (
             <div className="flex-1 overflow-y-auto pr-2 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
               {/* Simple markdown parsing for bolding */}
               {output.split('**').map((part, i) => (
                  i % 2 === 1 ? <strong key={i} className="text-indigo-300 font-bold">{part}</strong> : part
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
