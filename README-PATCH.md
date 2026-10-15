# Saumya JEE Portal — Study Timer patch

This is a **partial patch**, not a full project ZIP. It contains the upgraded timer and dashboard analytics.

## Files to replace

Copy these files into your existing project and overwrite the originals:

- `src/components/StudyTimer.jsx`
- `src/components/Dashboard.jsx`

No `App.jsx` change is required: the existing `addSession` handler already stores arbitrary session fields, and the dashboard receives `state`.

## What changed

### Timer
- Stopwatch, custom countdown (15–120 minutes), and 25/5 Pomodoro modes.
- Pause/resume, stop-and-save, reset, progress bar, and optional session note.
- Active categories: PYQ Practice, Problem Solving / DPP, Mock Test, Question Revision.
- Passive categories: Video Lecture, Notes / Textbook, Formula Revision, Concept Reading.
- Subject selection for Physics, Chemistry, and Maths.
- Optional question attempted/correct logging after active study sessions.

### Dashboard
- Total active vs passive time and today's breakdown.
- Last 7 days of tracked time.
- Active ratio goal (70%+).
- Active and passive category-wise breakdown.
- Subject-wise study time chart.
- Recent saved study sessions and question logs.

## Run and test

From the root of your existing project:

```bash
npm run dev
```

Then save a short test session in each study type and verify that the dashboard updates.

## Important notes
- This patch uses the same Firebase persistence flow as the existing app. If Firebase is not configured/authenticated, the existing `addSession` and `addQuestionLog` handlers return without saving.
- Existing old session records with `tag` but no `category` are supported using `tag` as a fallback.
- The timer uses a 15-second minimum before a session is saved.
