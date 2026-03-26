# 🚀 DSA Revision Tracker — Master Your Problem-Solving Reps

A full-stack productivity system that helps you capture, schedule, and revisit DSA problems so your interview prep improves through consistent spaced-repetition reps.

---

## 🧩 System Architecture

The **Chrome Extension** captures problems directly from coding platforms and sends them to the API. The **Backend** handles authentication, persistence, revision logic, and scheduling. The **React Dashboard** consumes backend APIs to visualize progress, today’s tasks, and revision insights in one place.

---

## 🗂️ Project Structure

> Logical names shown first (`extension/client/server`), with current repo folder names in parentheses.

```text
.
├── extension/   (Frontend/)
│   └── Chrome Extension (Manifest V3) for capturing problems and triggering revision actions.
├── client/      (dashboard/)
│   └── React + Vite web dashboard for analytics, task views, settings, and exports.
└── server/      (backend/)
    └── Node.js + Express API with MongoDB for auth, problems, revisions, and user settings.
```

---

## 🛠️ Tech Stack

- **Frontend (Web):** React, Vite, React Router, Axios, Tailwind CSS, Recharts
- **Browser Extension:** Chrome Extension Manifest V3, Service Worker, Content Scripts, React + Vite build pipeline
- **Backend API:** Node.js, Express, JWT auth, Google OAuth (`google-auth-library`)
- **Database:** MongoDB with Mongoose
- **Tooling:** ESLint, Nodemon
- **Deployment-ready setup:** Vercel config for dashboard; backend/extension can be hosted on cloud platforms (e.g., Render or similar)

---

## ⚙️ Installation & Setup (For Developers)

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2) Install dependencies

```bash
# Server
cd backend
npm install

# Client
cd ../dashboard
npm install

# Extension
cd ../Frontend
npm install
```

### 3) Configure environment variables

Create `.env` files (see the **Environment Variables** section below).

### 4) Run local development apps

Open separate terminals from repo root:

```bash
# Terminal 1 - Backend API (http://localhost:5000)
cd backend
npm run dev
```

```bash
# Terminal 2 - Dashboard client (Vite dev server)
cd dashboard
npm run dev
```

```bash
# Terminal 3 - Extension build watch (optional for active extension dev)
cd Frontend
npm run dev
```

---

## 🧩 Installing the Extension (For Users)

1. Go to the project’s **GitHub Releases** page.
2. Download the latest extension `.zip` artifact.
3. Extract the `.zip` to a local folder.
4. Open Chrome and navigate to `chrome://extensions/`.
5. Enable **Developer mode** (top-right toggle).
6. Click **Load unpacked**.
7. Select the extracted extension folder.
8. Pin the extension (optional) and start saving problems from supported platforms.

---

## 🔐 Environment Variables

Use the following as a starter checklist.

### `backend/.env`

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `PORT` | No | `5000` | Backend server port |
| `NODE_ENV` | No | `development` | Runtime mode |
| `MONGO_URI` | Yes | `mongodb://localhost:27017/dsa-tracker` | MongoDB connection string |
| `JWT_SECRET` | Yes | `your_jwt_secret` | JWT signing/verification key |
| `GOOGLE_CLIENT_ID` | Yes | `xxxxx.apps.googleusercontent.com` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | `your_google_client_secret` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | No | `http://localhost:5000/api/auth/google/callback` | Optional explicit OAuth callback URL |
| `DASHBOARD_URL` | No | `http://localhost:5175` | Allowed frontend origin + redirect target |
| `EXTENSION_ID` | No | `your_extension_id` | Optional extension redirect support |

### `dashboard/.env`

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Yes | `xxxxx.apps.googleusercontent.com` | Google Sign-In configuration |
| `VITE_API_URL` | Yes* | `http://localhost:5000` | Backend API base URL |
| `VITE_BACKEND_URL` | No | `http://localhost:5000` | Alternate backend URL key used by Axios |
| `VITE_WEB3FORM_ACCESS_KEY` | No | `your_access_key` | Feedback form integration |

> `*` At least one of `VITE_API_URL` or `VITE_BACKEND_URL` should be set.

### `Frontend/.env` (Extension)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `VITE_BACKEND_URL` | No | `http://localhost:5000` | API base URL used by extension service worker |
| `VITE_DASHBOARD_URL` | No | `http://localhost:5175` | URL opened when launching dashboard from extension |

---

## 📸 Screenshots

### 🖥️ Dashboard Overview
_Main dashboard showing progress, stats, and revision insights._

![Dashboard](./docs/dashboard.png)

---

### 🔥 Activity Heatmap
_Visual representation of consistency and revision frequency._

![Heatmap](./docs/heatmap.png)

---

### 📅 Daily Revision Queue
_Today’s scheduled problems based on spaced repetition._

![Tasks](./docs/tasks.png)

---

### 🧩 Chrome Extension Popup
_Save problems directly while browsing coding platforms._

![Extension](./docs/extension.png)

---

### 🔄 Problem Capture Flow
_Capture a problem via extension and see it reflected in the dashboard._

![Flow](./docs/flow.png)

## 🤝 Contributing

Contributions, issues, and feature ideas are welcome. If you’d like to improve tracking accuracy, scheduling logic, or UX polish, feel free to open an issue or submit a PR.
