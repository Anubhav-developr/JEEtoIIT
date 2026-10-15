# Saumya's JEE 2027 Portal

React + Vite project split into reusable components.

## Run locally
1. Install Node.js (LTS).
2. Extract the ZIP and open this folder in a terminal.
3. Run `npm install`
4. Run `npm run dev`
5. Open the local URL printed by Vite.

## Production build
Run `npm run build`; output is written to `dist/`.

## Structure
- `src/App.jsx` — app shell, navigation state, Firebase data sync
- `src/components/` — Intro animation, sidebar, dashboard, timer, syllabus tracker, mock planner, AI analyzer
- `src/data/studyData.js` — syllabus and mock-test constants
- `src/index.css` — Tailwind directives and global styles

## Important configuration notes
- The uploaded source expects Firebase configuration globals (`__firebase_config`, `__app_id`, `__initial_auth_token`) from its original host. For a standalone deployment, configure Firebase Authentication (Anonymous sign-in) and Firestore, then update the initialization in `src/App.jsx` to use your Firebase project's config. Without that, cloud-synced checklists, logs, and mock scores won't persist.
- AI Analyzer currently has an empty Gemini API key placeholder. Do not place a private Gemini key in frontend code. For production, route Gemini requests through a backend/serverless function and keep the key in server-side environment variables.
- The syllabus and mock-test dates are preserved from the supplied source.
