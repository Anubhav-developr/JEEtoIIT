import React, { useEffect, useState } from "react";
import { BrainCircuit, CheckCircle2, AlertTriangle, Target, TrendingUp, BookOpenCheck } from "lucide-react";
import { analyzeJeeTest } from "../lib/testAnalysisEngine";

const Metric = ({ label, value, hint }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

export default function AIAnalyzer({ prefillScore }) {
  const [scoreTotal, setScoreTotal] = useState(prefillScore || "");
  const [scoreP, setScoreP] = useState("");
  const [scoreC, setScoreC] = useState("");
  const [scoreM, setScoreM] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [report, setReport] = useState("");
  const [output, setOutput] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (prefillScore !== undefined && prefillScore !== null && prefillScore !== "") {
      setScoreTotal(String(prefillScore));
    }
  }, [prefillScore]);

  const handleAnalyze = (event) => {
    event.preventDefault();
    setError("");

    const numericFields = [
      ["Physics", scoreP, 100],
      ["Chemistry", scoreC, 100],
      ["Mathematics", scoreM, 100],
      ["Total score", scoreTotal, 300],
      ["Accuracy", accuracy, 100],
    ];
    for (const [label, value, max] of numericFields) {
      if (value === "") continue;
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > max) {
        setError(`${label} must be between 0 and ${max}.`);
        return;
      }
    }

    if (![scoreP, scoreC, scoreM, scoreTotal, accuracy].some((v) => v !== "") && !report.trim()) {
      setError("Enter at least one score or paste your test report/weak-area notes.");
      return;
    }

    setOutput(analyzeJeeTest({
      physics: scoreP,
      chemistry: scoreC,
      maths: scoreM,
      total: scoreTotal,
      accuracy,
      report,
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white">Local JEE Test Analyzer</h2>
        <p className="mt-1 text-sm text-slate-400">
          Mathematical analysis runs in this browser. No Gemini API, API key, or external AI request.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form onSubmit={handleAnalyze} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md lg:col-span-5">
          <h3 className="border-b border-slate-800 pb-2 text-sm font-bold text-white">Test Metrics</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Physics", scoreP, setScoreP],
              ["Chemistry", scoreC, setScoreC],
              ["Maths", scoreM, setScoreM],
            ].map(([label, value, setter]) => (
              <label key={label} className="text-xs text-slate-400">
                {label} (/100)
                <input type="number" min="0" max="100" step="any" value={value}
                  onChange={(e) => setter(e.target.value)} placeholder="0–100"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-400">
              Total Score (/300)
              <input type="number" min="0" max="300" step="any" value={scoreTotal}
                onChange={(e) => setScoreTotal(e.target.value)} placeholder="0–300"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none" />
            </label>
            <label className="text-xs text-slate-400">
              Accuracy (%)
              <input type="number" min="0" max="100" step="any" value={accuracy}
                onChange={(e) => setAccuracy(e.target.value)} placeholder="0–100"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </label>
          </div>

          <label className="block text-xs text-slate-400">
            Test report / weak topics
            <textarea rows="5" value={report} onChange={(e) => setReport(e.target.value)}
              className="mt-1 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              placeholder={"Paste weak chapters, common mistakes, or Testbook analysis notes…"} />
          </label>

          {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

          <button type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-purple-500 active:scale-[.99]">
            <Target className="h-5 w-5" /> Analyze Test Locally
          </button>
          <p className="text-xs leading-relaxed text-slate-500">This version uses transparent rules and calculations, not a trained language model. Your inputs are not sent to an API.</p>
        </form>

        <section className="flex min-h-[420px] flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-7">
          <h3 className="mb-4 flex items-center border-b border-slate-800 pb-2 text-sm font-bold text-indigo-300">
            <BrainCircuit className="mr-2 h-4 w-4" /> Test Analysis & Action Plan
          </h3>

          {!output && (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-500">
              <BrainCircuit className="mb-4 h-14 w-14 text-slate-700" />
              <p className="text-sm">Enter your test details and select “Analyze Test Locally”.</p>
            </div>
          )}

          {output && (
            <div className="space-y-5 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Metric label="Total score" value={output.total === null ? "—" : `${output.total}/300`} />
                <Metric label="Score percentage" value={output.scorePercent === null ? "—" : `${output.scorePercent}%`} hint="Based on 300 marks" />
                <Metric label="Accuracy" value={output.accuracy === null ? "Not entered" : `${output.accuracy}%`} />
              </div>

              <div>
                <h4 className="mb-3 flex items-center gap-2 font-bold text-white"><TrendingUp className="h-4 w-4 text-indigo-300" /> Subject-wise diagnosis</h4>
                <div className="space-y-3">
                  {output.subjects.map((subject) => (
                    <div key={subject.key} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{subject.label}</span>
                        <span className="text-sm text-slate-300">{subject.score === null ? "Score not entered" : `${subject.score}/100 · ${subject.status}`}</span>
                      </div>
                      {subject.score !== null && (
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${subject.score}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-3 flex items-center gap-2 font-bold text-white"><Target className="h-4 w-4 text-amber-300" /> Recommended next actions</h4>
                <ol className="space-y-2">
                  {output.recommendations.map((item, index) => (
                    <li key={index} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {item}
                    </li>
                  ))}
                </ol>
              </div>

              {output.weakAreas.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-white"><BookOpenCheck className="h-4 w-4 text-cyan-300" /> Topics from your report</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                    {output.weakAreas.map((topic, index) => <li key={`${topic}-${index}`}>{topic}</li>)}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-200"><AlertTriangle className="h-4 w-4" /> Analysis limitations</h4>
                <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-slate-400">
                  {output.dataLimitations.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
