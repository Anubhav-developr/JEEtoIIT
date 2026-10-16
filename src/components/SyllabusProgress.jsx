import React, { useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, Circle, ChevronDown, Target, ListChecks } from 'lucide-react';
import { SYLLABUS_DATA } from '../data/studyData';

const SUBJECTS = [
  { key: 'physics', label: 'Physics', accent: 'text-cyan-300', bar: 'bg-cyan-400' },
  { key: 'chemistry', label: 'Chemistry', accent: 'text-emerald-300', bar: 'bg-emerald-400' },
  { key: 'math', label: 'Mathematics', accent: 'text-violet-300', bar: 'bg-violet-400' },
];

function ProgressBar({ percent, color = 'bg-indigo-400' }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-800"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Syllabus completion ${percent}%`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

export default function SyllabusProgress({ completedSubtopics = [] }) {
  const [showAllChapters, setShowAllChapters] = useState(false);

  const report = useMemo(() => {
    const completedSet = new Set(completedSubtopics);
    const subjects = SUBJECTS.map((subject) => {
      const chapters = (SYLLABUS_DATA[subject.key] || []).map((chapter) => {
        const total = chapter.sub.length;
        const completed = chapter.sub.filter((subtopic) => completedSet.has(subtopic.id)).length;
        const pending = chapter.sub.filter((subtopic) => !completedSet.has(subtopic.id));
        return {
          ...chapter,
          total,
          completed,
          pending,
          percent: total ? Math.round((completed / total) * 100) : 0,
          status: completed === total ? 'complete' : completed > 0 ? 'in-progress' : 'not-started',
        };
      });
      const total = chapters.reduce((sum, chapter) => sum + chapter.total, 0);
      const completed = chapters.reduce((sum, chapter) => sum + chapter.completed, 0);
      const completeChapters = chapters.filter((chapter) => chapter.status === 'complete').length;
      const inProgressChapters = chapters.filter((chapter) => chapter.status === 'in-progress').length;
      return {
        ...subject,
        chapters,
        total,
        completed,
        remaining: Math.max(0, total - completed),
        percent: total ? Math.round((completed / total) * 100) : 0,
        completeChapters,
        inProgressChapters,
      };
    });

    const total = subjects.reduce((sum, subject) => sum + subject.total, 0);
    const completed = subjects.reduce((sum, subject) => sum + subject.completed, 0);
    const chapters = subjects.flatMap((subject) =>
      subject.chapters.map((chapter) => ({ ...chapter, subjectLabel: subject.label, subjectAccent: subject.accent }))
    );
    const pending = chapters
      .filter((chapter) => chapter.pending.length > 0)
      .flatMap((chapter) =>
        chapter.pending.map((subtopic) => ({
          ...subtopic,
          chapterName: chapter.name,
          subjectLabel: chapter.subjectLabel,
        }))
      );

    return {
      subjects,
      total,
      completed,
      remaining: Math.max(0, total - completed),
      percent: total ? Math.round((completed / total) * 100) : 0,
      completeChapters: chapters.filter((chapter) => chapter.status === 'complete').length,
      totalChapters: chapters.length,
      inProgressChapters: chapters.filter((chapter) => chapter.status === 'in-progress').length,
      notStartedChapters: chapters.filter((chapter) => chapter.status === 'not-started').length,
      pending,
      chapters,
    };
  }, [completedSubtopics]);

  const visibleChapters = showAllChapters ? report.chapters : report.chapters.slice(0, 8);

  return (
    <section className="space-y-5 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-indigo-300">
            <BookOpenCheck className="h-5 w-5" />
            <span className="text-xs font-extrabold uppercase tracking-[0.16em]">Syllabus intelligence</span>
          </div>
          <h3 className="text-xl font-extrabold text-white sm:text-2xl">Syllabus Completion Analysis</h3>
          <p className="mt-1 text-sm text-slate-400">Live analysis from the topics and subtopics checked in your Syllabus Tracker.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-indigo-400/20 bg-slate-950/60 px-4 py-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-indigo-400/30 text-lg font-black text-white">
            {report.percent}%
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall done</p>
            <p className="text-sm font-bold text-white">{report.completed} / {report.total} subtopics</p>
            <p className="text-xs text-amber-300">{report.remaining} remaining</p>
          </div>
        </div>
      </div>

      <ProgressBar percent={report.percent} color="bg-gradient-to-r from-indigo-500 via-violet-400 to-cyan-300" />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" /><span className="text-xs font-bold">Subtopics completed</span></div>
          <p className="text-2xl font-extrabold text-white">{report.completed}</p>
          <p className="mt-1 text-[11px] text-slate-500">Out of {report.total} listed</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-300"><Circle className="h-4 w-4" /><span className="text-xs font-bold">Still to complete</span></div>
          <p className="text-2xl font-extrabold text-white">{report.remaining}</p>
          <p className="mt-1 text-[11px] text-slate-500">{100 - report.percent}% of listed subtopics</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-cyan-300"><BookOpenCheck className="h-4 w-4" /><span className="text-xs font-bold">Chapters completed</span></div>
          <p className="text-2xl font-extrabold text-white">{report.completeChapters}<span className="text-sm font-semibold text-slate-500"> / {report.totalChapters}</span></p>
          <p className="mt-1 text-[11px] text-slate-500">Every listed subtopic ticked</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-violet-300"><Target className="h-4 w-4" /><span className="text-xs font-bold">In progress</span></div>
          <p className="text-2xl font-extrabold text-white">{report.inProgressChapters}</p>
          <p className="mt-1 text-[11px] text-slate-500">{report.notStartedChapters} chapters not started</p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-slate-300" />
          <h4 className="font-bold text-white">Subject-wise progress</h4>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {report.subjects.map((subject) => (
            <div key={subject.key} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className={`font-bold ${subject.accent}`}>{subject.label}</span>
                <span className="text-lg font-extrabold text-white">{subject.percent}%</span>
              </div>
              <ProgressBar percent={subject.percent} color={subject.bar} />
              <div className="mt-3 flex justify-between gap-2 text-xs">
                <span className="text-slate-400">{subject.completed}/{subject.total} done</span>
                <span className="font-semibold text-slate-300">{subject.remaining} left</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {subject.completeChapters} chapters complete · {subject.inProgressChapters} in progress
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/15 bg-slate-950/40 p-4">
          <h4 className="mb-3 flex items-center gap-2 font-bold text-white">
            <Target className="h-4 w-4 text-amber-300" /> Suggested next topics
          </h4>
          {report.pending.length === 0 ? (
            <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">Excellent! All currently listed subtopics are marked complete.</p>
          ) : (
            <div className="space-y-2">
              {report.pending.slice(0, 8).map((item) => (
                <div key={`${item.id}-${item.chapterName}`} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200">{item.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.subjectLabel} · {item.chapterName}</p>
                  </div>
                </div>
              ))}
              {report.pending.length > 8 && <p className="pt-1 text-xs text-slate-500">And {report.pending.length - 8} more subtopics remaining below.</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="font-bold text-white">Chapter-by-chapter status</h4>
            <span className="text-xs text-slate-500">{report.totalChapters} chapters</span>
          </div>
          <div className="space-y-3">
            {visibleChapters.map((chapter) => (
              <div key={`${chapter.id}-${chapter.subjectLabel}`} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200">{chapter.name}</p>
                    <p className="text-[11px] text-slate-500">{chapter.subjectLabel}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${
                    chapter.status === 'complete'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : chapter.status === 'in-progress'
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {chapter.status === 'complete' ? 'Complete' : chapter.status === 'in-progress' ? 'In progress' : 'Not started'}
                  </span>
                </div>
                <ProgressBar percent={chapter.percent} color={chapter.status === 'complete' ? 'bg-emerald-400' : chapter.status === 'in-progress' ? 'bg-amber-400' : 'bg-slate-700'} />
                <p className="mt-2 text-right text-[11px] text-slate-500">{chapter.completed}/{chapter.total} subtopics · {chapter.percent}%</p>
              </div>
            ))}
          </div>
          {report.chapters.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllChapters((value) => !value)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:border-indigo-400/50 hover:text-white"
            >
              {showAllChapters ? 'Show fewer chapters' : `Show all ${report.totalChapters} chapters`}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllChapters ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Calculation is based on the subtopics currently listed in this portal's syllabus data. Checking a subtopic updates this analysis automatically; no extra progress data is stored separately.
      </p>
    </section>
  );
}
