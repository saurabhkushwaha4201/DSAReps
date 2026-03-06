# DSA Revision Tracker

## 1. Project Title
DSA Revision Tracker

## 2. Problem Statement
Keeping track of algorithm and data-structure problems across multiple platforms is scattered and manual. This project provides a structured way to capture problems, schedule revisions with spaced repetition, and track progress over time from a single workflow.

## 3. Project Overview
DSA Revision Tracker is a full-stack system consisting of:
- A Chrome Extension for capturing problems directly from supported platforms.
- A Web Dashboard for reviewing daily tasks, managing problems, and viewing analytics.
- A Backend API that handles authentication, scheduling logic, and persistence.

The system centers on a revision workflow that schedules problems based on stability scoring and user ratings, while providing a daily triage list to prevent overload.

## 4. Architecture Explanation
- **Browser Extension (MV3)**
  - Content scripts detect problem pages (LeetCode, Codeforces, CSES, GeeksforGeeks) and inject a capture UI.
  - Popup UI allows users to authenticate, save problems, and manually add problems when page detection fails.
  - Background service worker manages Google OAuth via `chrome.identity`, stores the JWT in `chrome.storage`, calls backend APIs, and updates the badge count for daily tasks.

- **Web Dashboard (React + Vite)**
  - Provides login via Google OAuth and stores the JWT in `localStorage`.
  - Uses a shared API layer (Axios) to call backend endpoints.
  - Routes include dashboard overview, problems list, focus mode, focus session, and settings.

- **Backend API (Express + MongoDB)**
  - Handles Google OAuth and issues a backend JWT for session management.
  - Protects API routes with JWT middleware.
  - Stores Users, Problems, and Revision Logs in MongoDB using Mongoose.
  - Implements the "Anti-Avalanche" daily triage algorithm and stability-based scheduling.

## 5. Tech Stack
- **Backend**: Node.js, Express, Mongoose, MongoDB, JWT, Google OAuth, dotenv, cors
- **Web Dashboard**: React, React Router, Vite, Tailwind CSS (via Vite plugin), Axios, React Toastify, Framer Motion, Recharts, Lucide Icons
- **Extension**: Chrome Extension Manifest V3, React (content UI), vanilla JS popup, Vite build pipeline

## 6. Folder Structure Explanation
- `backend/` - Express API, MongoDB models, auth, and scheduling logic.
- `Frontend/` - Chrome extension (service worker, content scripts, popup).
- `dashboard/` - Web dashboard app (Vite + React).
- `.docs/` - Project documentation.

## 7. Setup Instructions
1. **Backend**
   - `cd backend`
   - `npm install`
   - Create `backend/.env` (see Environment Variables section)
   - Start the server: `npm run dev`

2. **Web Dashboard**
  - `cd dashboard`
  - `npm install`
  - Create `dashboard/.env` (see Environment Variables section)
  - Start the dashboard: `npm run dev` (Vite runs on port 5175)

3. **Chrome Extension**
   - `cd Frontend`
   - `npm install`
   - Build in watch mode: `npm run dev` (outputs to `Frontend/dist`)
   - Load unpacked extension in Chrome from `Frontend/dist`

4. **Google OAuth Configuration**
   - Authorized redirect URIs must include:
     - `http://localhost:5000/api/auth/google/callback`
    - `http://localhost:5175/login`
     - `https://<EXTENSION_ID>.chromiumapp.org/auth`

## 8. Environment Variables Explanation
**Backend (`backend/.env`)**
- `PORT` - API port (defaults to 5000).
- `MONGO_URI` - MongoDB connection string.
- `MONGODB_USER_NAME` / `MONGODB_PASSWORD` - Optional DB credentials (used for reference in local env).
- `JWT_SECRET` - Secret for signing backend JWTs.
- `GOOGLE_CLIENT_ID` - Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret.
- `EXTENSION_ID` - Chrome extension ID for OAuth redirect.
- `NODE_ENV` - Optional; controls error payload verbosity.

**Web Dashboard (`dashboard/.env`)**
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID (frontend).
- `VITE_API_URL` - Backend base URL (e.g., `http://localhost:5000`).

**Extension**
- API and dashboard URLs are currently hardcoded in the service worker:
  - `API_BASE_URL` (defaults to `http://localhost:5000`)
  - `DASHBOARD_URL` (defaults to `http://localhost:5175`)

## 9. API Overview
**Auth**
- `POST /api/auth/google` - Exchange Google credential for backend JWT.
- `GET /api/auth/google` - Start Google OAuth flow.
- `GET /api/auth/google/callback` - OAuth callback handler.

**Problems**
- `POST /api/problems` - Save a problem.
- `GET /api/problems` - List problems (paginated).
- `GET /api/problems/today` - Daily triage tasks.
- `GET /api/problems/stats` - Heatmap + weak clusters + streak.
- `POST /api/problems/:id/revise` - Submit a revision rating.
- `PUT /api/problems/:id/reschedule` - Manual review date override.
- `PATCH /api/problems/:id/notes` - Update notes.
- `PATCH /api/problems/:id/archive` - Archive a problem.
- `PATCH /api/problems/:id/unarchive` - Restore archived problem.

**Revisions**
- `POST /api/revisions` - Create a revision log.
- `GET /api/revisions/stats` - Dashboard stats summary.
- `POST /api/reviews` - Alternate revision log route.
- `GET /api/dashboard/stats` - Alternate stats route.

**User**
- `GET /api/user/settings` - Fetch revision intervals and daily goal.
- `PUT /api/user/settings` - Update revision intervals and daily goal.

## 10. Key Features
- One-click problem capture from supported platforms via Chrome extension.
- Daily triage to cap revision load ("Anti-Avalanche" scheduling).
- Stability-based scheduling and revision ratings (FORGOT/SLOW/CLEAN).
- Focus mode and focus session screens for dedicated revision flow.
- Dashboard analytics: heatmap, weak clusters, totals, streak tracking.
- Per-user settings for revision intervals and daily goals.
- Archive/unarchive and notes for problem management.

## 11. Design Decisions
- **Google OAuth + JWT**: reduces onboarding friction and keeps API stateless.
- **MongoDB + Mongoose**: flexible schema fits evolving problem metadata.
- **Chrome Extension MV3**: first-class integration with problem sites.
- **Vite + React**: fast iteration and shared component model across dashboard/extension UI.
- **Stability Score Scheduling**: more adaptive than fixed intervals, with manual override support.

## 12. Future Improvements
- Add a backend endpoint for user data export (UI already calls `/api/user/export`).
- Make extension API base and dashboard URLs configurable instead of hardcoded.
- Expand platform detection to additional practice sites.
- Add richer analytics (per-tag trends, long-term retention curves).

## 13. License
No top-level LICENSE file was found. The backend package lists **ISC** as its license; add a repository license file if a different license is intended.
