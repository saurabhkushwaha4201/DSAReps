# 🚀 DSAReps — DSA Revision Tracker
### Master Your Problem-Solving Reps with Spaced Repetition

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest_V3-%234285F4.svg?style=for-the-badge&logo=google-chrome&logoColor=white)

## 🔗 Live Demo
- 🌐 **Dashboard:** [https://dsareps.vercel.app/](https://dsareps.vercel.app/)
- 🧩 **Chrome Extension:** [Download from Releases](https://github.com/saurabhkushwaha4201/Extension/releases)

---

DSAReps is a full-stack system designed to improve DSA retention through structured revision. It allows you to capture problems directly from coding platforms, automatically schedules revisions using spaced repetition, and provides a dashboard to track progress and consistency.

---

## 🎯 Problem It Solves

Most developers solve DSA problems once and forget them due to lack of structured revision.

This leads to:
- Poor retention of patterns
- Re-solving the same problems repeatedly
- Inefficient interview preparation

DSAReps addresses this by introducing a spaced-repetition-based workflow for DSA practice, ensuring consistent revision and long-term retention.

---

## 🚀 Why DSAReps?

- Combines **Chrome Extension + Dashboard + Backend** into one workflow
- Focuses on **revision**, not just problem tracking
- Uses **spaced repetition**, not random practice
- Designed for **real interview preparation**, not just logging progress

---

## ✨ Core Features

- **⚡ 1-Click Capture:** Save problems instantly from platforms like LeetCode, Codeforces, CSES, and GeeksForGeeks using the Chrome Extension.

- **🧠 Spaced Repetition Engine:** Automatically schedules revisions so problems are revisited at the right time for long-term retention.

- **📊 Progress & Analytics Dashboard:** Track consistency, visualize activity with heatmaps, and identify weak algorithmic areas.

- **📅 Daily Revision Queue:** Get a clear "what to solve today" view so you always know your next step.

---

## 📸 See it in Action

<table>
  <tr>
    <td valign="top" width="50%">
      <b>🧩 Frictionless Capture</b><br>
      <em>Injected UI lets you save and tag problems without leaving your LeetCode flow.</em><br><br>
      <video src="https://github.com/user-attachments/assets/4ff394fc-e9d6-4f5d-b712-39251e7ae7cc" width="100%" autoplay loop muted playsinline></video>
    </td>
    <td valign="top" width="50%">
      <b>🖥️ Command Center</b><br>
      <em>Track your algorithmic mastery, daily tasks, and historical consistency.</em><br><br>
      <img src="/.docs/assets/dashboard-home.png" alt="Dashboard Overview" width="100%">
    </td>
  </tr>
  <tr>
    <td valign="top" width="50%">
      <b>⚡ In-Context Revision</b><br>
      <em>Review scheduled spaced-repetition tasks directly on coding platforms.</em><br><br>
      <img src="/.docs/assets/in-browser-review.png" alt="In Browser Review" width="100%">
    </td>
    <td valign="top" width="50%">
      <b>🗂️ Data Management</b><br>
      <em>Filter, organize, and manage all your tracked problems across multiple platforms.</em><br><br>
      <img src="/.docs/assets/problem-list.png" alt="Problem List" width="100%">
    </td>
  </tr>
</table>

## 🧩 Installing the Extension (For Users)

> No local setup required! The dashboard and backend are already deployed.

1. Go to the **[Releases](/releases)** page.
2. Download the **`Extension.zip`** file attached to the latest release (you can ignore the "Source code" files).
3. Extract the downloaded zip file to your computer.
4. Open Google Chrome and navigate to `chrome://extensions/`.
5. Enable **Developer Mode** (toggle in the top-right corner).
6. Click **Load Unpacked**.
7. Select the **`dist`** folder located *inside* the extracted `Extension` folder.

✅ **The extension is now ready to use.**

> *Tip: Refresh any open LeetCode or Codeforces tabs if the extension doesn't appear immediately.*

---

## 🧩 System Architecture

DSAReps is built as a three-layer system where data flows from the browser to the backend and is visualized in the dashboard.

- **🧩 Chrome Extension**
    - Captures problem metadata directly from coding platforms (LeetCode, Codeforces)
    - Sends structured data to the backend via REST APIs

- **⚙️ Backend (Node.js + Express)**
    - Handles authentication (JWT + Google OAuth)
    - Stores problems and revision schedules in MongoDB
    - Implements spaced repetition logic for scheduling

- **📊 Dashboard (React)**
    - Fetches user data and scheduled tasks from the backend
    - Displays daily revision queue and analytics
    - Visualizes consistency using heatmaps and charts

> 🧠 **Under the Hood: Technical Highlights**<br>
> DSAReps is engineered to handle complex state, background processing, and accurate data tracking. Want to see the Spaced Repetition math, Shadow DOM isolation, Chrome Service Worker lifecycles, and our Daily Triage algorithm?<br>
> 👉 **[Read the comprehensive System Design & Architecture Deep Dive](/.docs/SYSTEM_DESIGN.MD)**

---

## 🗂️ Project Structure

```
.
├── Frontend/
│   └── Chrome Extension (Manifest V3) for capturing problems and managing revision actions.
├── dashboard/
│   └── React + Vite web dashboard for analytics, task views, settings, and exports.
├── backend/
│   └── Node.js + Express API with MongoDB for auth, problems, revisions, and user settings.
└── .docs/
    ├── SYSTEM_DESIGN.md
    └── assets/
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

## ⚙️ Local Development Setup

### Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- Google Chrome

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Install dependencies
```bash
# Server
cd backend
npm install
```

```bash
# Client
cd ../dashboard
npm install
```

```bash
# Extension
cd ../Frontend
npm install
```

### 3. Configure environment variables

Create `.env` files (see the **Environment Variables** section below).

### 4. Run local development apps

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

## 🔐 Environment Variables

Use the provided `.env.example` files in each folder as a reference. Use the following as a starter checklist.

### `backend/.env`

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `PORT` | No | `5000` | Backend server port |
| `NODE_ENV` | No | `development` | Runtime mode |
| `MONGO_URI` | Yes | `mongodb+srv://<host>/<dbname>?retryWrites=true&w=majority` | MongoDB connection string template; username/password can be injected from env |
| `MONGODB_USER_NAME` | No | `your_mongo_username` | Optional MongoDB username used to build the final connection URI |
| `MONGODB_PASSWORD` | No | `your_mongo_password` | Optional MongoDB password used to build the final connection URI |
| `JWT_SECRET` | Yes | `generate_a_32+_char_random_secret` | JWT signing/verification key |
| `GOOGLE_CLIENT_ID` | Yes | `xxxxx.apps.googleusercontent.com` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | `your_google_client_secret` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | No | `http://localhost:5000/api/auth/google/callback` | Optional explicit OAuth callback URL |
| `DASHBOARD_URL` | No | `http://localhost:5175` | Allowed frontend origin + redirect target |
| `EXTENSION_ID` | No | `your_extension_id` | Optional extension redirect support |

### `dashboard/.env`

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | `xxxxx.apps.googleusercontent.com` | Google Sign-In configuration |
| `VITE_API_URL` | No | `http://localhost:5000` | Backend API base URL |
| `VITE_BACKEND_URL` | No | `http://localhost:5000` | Legacy/alternate backend URL key for older setups |
| `VITE_WEB3FORM_ACCESS_KEY` | No | `your_access_key` | Feedback form integration |

> At least one of `VITE_API_URL` or `VITE_BACKEND_URL` should be set.

### `Frontend/.env` (Extension)

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `VITE_API_URL` | No | `http://localhost:5000` | API base URL used by extension service worker |
| `VITE_DASHBOARD_URL` | No | `http://localhost:5175` | URL opened when launching dashboard from extension |

---

## 🤝 Contributing

Contributions, issues, and feature ideas are welcome! If you'd like to improve tracking accuracy, scheduling logic, or UX polish, feel free to dive in.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

