import AuthService from "./auth.service.js";

console.log("[BG] Service Worker Loaded");


const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://extension-backend-mlcm.onrender.com").replace(/\/$/, "");
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5175";
const DIGEST_STATE_KEY = "dailyDigestState";
const INTERVALS_CACHE_KEY = "revisionIntervalsCache";
const DEFAULT_INTERVALS = { hard: 1, medium: 3, easy: 5 };

function getTodayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseNotifTime(notifTime = "09:00", now = new Date()) {
  const [hours, minutes] = String(notifTime).split(":").map(Number);
  const target = new Date(now);
  target.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return target;
}

async function getDigestState() {
  const data = await chrome.storage.local.get(DIGEST_STATE_KEY);
  return data?.[DIGEST_STATE_KEY] || {};
}

async function markDigestSent(meta = {}) {
  await chrome.storage.local.set({
    [DIGEST_STATE_KEY]: {
      lastSentDateKey: getTodayKey(),
      lastSentAt: Date.now(),
      ...meta,
    },
  });
}

async function alreadySentToday() {
  const state = await getDigestState();
  return state.lastSentDateKey === getTodayKey();
}

async function getNotificationSettings(enabled, time) {
  let notifEnabled = enabled;
  let notifTime = time;

  if (notifEnabled === undefined) {
    const isAuth = await AuthService.isAuthenticated();
    if (!isAuth) return { enabled: false, time: "09:00" };
    const data = await apiFetch("/api/user/settings");
    notifEnabled = data?.settings?.notificationEnabled;
    notifTime = data?.settings?.notificationTime || "09:00";
  }

  return { enabled: !!notifEnabled, time: notifTime || "09:00" };
}

async function maybeFireMissedDigest(trigger = "startup") {
  try {
    const { enabled, time } = await getNotificationSettings();
    if (!enabled) return;

    const now = new Date();
    const target = parseNotifTime(time, now);

    // Only attempt catch-up once today's configured time has passed.
    if (now < target) return;

    if (await alreadySentToday()) return;

    await fireDailyDigest(`catchup:${trigger}`);
  } catch (err) {
    console.warn("[BG] maybeFireMissedDigest failed:", err.message);
  }
}

/* 
   BADGE MANAGEMENT
 */

async function updateBadge(count) {
  try {
    if (count <= 0) {
      // Clear badge completely — no text, no color
      await chrome.action.setBadgeText({ text: "" });
      return;
    }
    const color = count >= 3 ? "#EF4444" : "#F59E0B";
    await chrome.action.setBadgeText({ text: String(count) });
    await chrome.action.setBadgeBackgroundColor({ color });
  } catch (err) {
    console.warn("[BG] Badge update failed:", err);
  }
}

async function fetchAndUpdateBadge() {
  try {
    const isAuth = await AuthService.isAuthenticated();
    if (!isAuth) {
      await updateBadge(0);
      return null;
    }

    const data = await apiFetch("/api/problems/today");
    const problems = data?.problems || [];
    await updateBadge(problems.length);

    // Persist to chrome.storage.local — all content scripts react via onChanged
    await chrome.storage.local.set({
      tasksState: { problems, count: problems.length, lastUpdated: Date.now() },
    });

    return problems;
  } catch (err) {
    console.warn("[BG] Badge fetch failed:", err);
    return null;
  }
}

/* ===============================
   ALARMS — Periodic badge refresh
================================ */

chrome.alarms.create("refreshTasks", { periodInMinutes: 120 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "refreshTasks") {
    fetchAndUpdateBadge();
    scheduleDigestAlarm(); // Re-read settings in case they changed
  }
  if (alarm.name === "dailyDigest") {
    fireDailyDigest("alarm");
  }
});

// Refresh badge and set up digest alarm on service worker startup
fetchAndUpdateBadge();
scheduleDigestAlarm();
maybeFireMissedDigest("service-worker-start");

// When browser starts, re-check missed digest delivery.
chrome.runtime.onStartup.addListener(() => {
  fetchAndUpdateBadge();
  scheduleDigestAlarm();
  maybeFireMissedDigest("runtime-startup");
});

// Catch-up trigger when system becomes active after idle/locked.
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener((state) => {
  if (state === "active") {
    maybeFireMissedDigest("idle-active");
  }
});

/* ===============================
   DAILY DIGEST NOTIFICATIONS
================================ */

async function scheduleDigestAlarm(enabled, time) {
  await chrome.alarms.clear("dailyDigest");

  // If values are passed directly (from UPDATE_ALARM), use them.
  // Otherwise, fetch from API.
  let notifEnabled = enabled;
  let notifTime = time;

  if (notifEnabled === undefined) {
    try {
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) return;
      const data = await apiFetch("/api/user/settings");
      notifEnabled = data.settings.notificationEnabled;
      notifTime = data.settings.notificationTime || "09:00";
    } catch (err) {
      console.warn("[BG] scheduleDigestAlarm fetch failed:", err.message);
      return;
    }
  }

  if (!notifEnabled) {
    console.log("[BG] Notifications disabled, alarm cleared.");
    return;
  }

  const [hours, minutes] = (notifTime || "09:00").split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If today's slot has already passed, aim for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  chrome.alarms.create("dailyDigest", {
    when: target.getTime(),
    periodInMinutes: 1440,
  });

  console.log(`[BG] Daily digest alarm set for ${target.toLocaleTimeString()}`);
}

function getDynamicGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

async function fireDailyDigest(reason = "manual") {
  try {
    const isAuth = await AuthService.isAuthenticated();
    if (!isAuth) return;

    if (await alreadySentToday()) return;

    const data = await apiFetch("/api/problems/today");
    const count = data?.problems?.length || 0;

    if (count === 0) return; // Nothing due — stay silent

    const greeting = getDynamicGreeting();

    chrome.notifications.create("dailyDigest", {
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: `${greeting}! Ready to code? 💻`,
      message: `We've queued up ${count} problem${count !== 1 ? "s" : ""} for you to review today. Let's get it done!`,
      priority: 1,
    });

    await markDigestSent({ reason, count });
  } catch (err) {
    console.warn("[BG] fireDailyDigest failed:", err.message);
  }
}

// Open Today's Focus page when user clicks the notification
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === "dailyDigest") {
    chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard` });
    chrome.notifications.clear(notificationId);
  }
});

/* ===============================
   MESSAGE LISTENERS
================================ */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Check authentication status
  if (message.type === "AUTH_STATUS") {
    AuthService.isAuthenticated().then((isAuthenticated) => {
      sendResponse({ isAuthenticated });
    });
    return true;
  }

  // Open dashboard via background so popup doesn't need hardcoded/env-injected URL logic
  if (message.type === "OPEN_DASHBOARD") {
    chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard` })
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error("[BG] Open dashboard error:", err);
        sendResponse({ success: false });
      });
    return true;
  }

  // Handle login
  if (message.type === "AUTH_LOGIN") {
    // getRedirectURL() returns the exact https://<id>.chromiumapp.org/ URL for this
    // extension build — avoids relying on a hardcoded EXTENSION_ID env var in the backend.
    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl = `${API_BASE_URL}/api/auth/google?source=extension&redirect_uri=${encodeURIComponent(redirectUri)}`;

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      async (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          console.error("[BG] Auth flow error:", chrome.runtime.lastError);
          sendResponse({ success: false });
          return;
        }

        try {
          const url = new URL(redirectUrl);
          const token = url.searchParams.get("token");

          if (token) {
            await AuthService.setAuth(token);
            // Refresh badge after login
            fetchAndUpdateBadge();
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false });
          }
        } catch (err) {
          console.error("[BG] Token extraction error:", err);
          sendResponse({ success: false });
        }
      }
    );
    return true;
  }

  // Handle logout
  if (message.type === "AUTH_LOGOUT") {
    AuthService.clearAuth().then(async () => {
      await updateBadge(0);
      sendResponse({ success: true });
    });
    return true;
  }

  // Handle problem save
  if (message.type === "SAVE_PROBLEM") {
    apiFetch("/api/problems", {
      method: "POST",
      body: JSON.stringify(message.data),
    })
      .then((res) => {
        fetchAndUpdateBadge();
        sendResponse(res);
      })
      .catch((err) => {
        console.error("[BG] Save problem error:", err);
        sendResponse({ error: err.message || "SAVE_FAILED" });
      });
    return true;
  }

  // Handle problem delete (called when user unsaves via bookmark icon)
  if (message.type === "REMOVE_PROBLEM") {
    const { dbId } = message.data;
    apiFetch(`/api/problems/${dbId}`, { method: "DELETE" })
      .then((res) => {
        fetchAndUpdateBadge();
        sendResponse(res);
      })
      .catch((err) => {
        console.error("[BG] Remove problem error:", err);
        sendResponse({ error: err.message || "REMOVE_FAILED" });
      });
    return true;
  }

  // ── NEW: Fetch daily tasks (max 3) for the capsule ────────
  if (message.type === "GET_DAILY_TASKS") {
    apiFetch("/api/problems/today")
      .then(async (data) => {
        const problems = data?.problems || [];
        await updateBadge(problems.length);
        sendResponse({ problems, count: problems.length });
      })
      .catch((err) => {
        console.error("[BG] Fetch daily tasks error:", err);
        sendResponse({ problems: [], count: 0, error: err.message });
      });
    return true;
  }

  // ── NEW: Rate a problem (revision with multiplier logic) ──
  if (message.type === "RATE_PROBLEM") {
    const { problemId, rating } = message.data;
    apiFetch(`/api/problems/${problemId}/revise`, {
      method: "POST",
      body: JSON.stringify({ rating, device: "Extension" }),
    })
      .then(async (res) => {
        // Refresh badge + write to storage (all tabs react via onChanged)
        await fetchAndUpdateBadge();
        sendResponse(res);
      })
      .catch((err) => {
        console.error("[BG] Rate problem error:", err);
        sendResponse({ error: err.message || "RATE_FAILED" });
      });
    return true;
  }

  // ── Instantly reschedule digest alarm when user saves settings ──
  if (message.type === "UPDATE_ALARM") {
    scheduleDigestAlarm(message.notifEnabled, message.notifTime);
    // If user enables/updates reminder after the configured time, deliver catch-up now.
    maybeFireMissedDigest("settings-update");
    sendResponse({ success: true });
    return true;
  }

  // ── Check if a specific URL is already saved in the backend ──
  if (message.type === "CHECK_PROBLEM_BY_URL") {
    const { url } = message.data;
    apiFetch(`/api/problems?url=${encodeURIComponent(url)}&limit=1`)
      .then((data) => {
        const problem = data?.problems?.[0] || null;
        sendResponse({ saved: !!problem, problem });
      })
      .catch(() => sendResponse({ saved: false, problem: null }));
    return true;
  }

  // ── Fetch user's revision intervals so popup/content can show correct labels ──
  if (message.type === "GET_INTERVALS") {
    apiFetch("/api/user/settings")
      .then(async (data) => {
        const intervals = data?.settings?.revisionIntervals || DEFAULT_INTERVALS;
        await chrome.storage.local.set({ [INTERVALS_CACHE_KEY]: intervals });
        sendResponse({ intervals, source: "api" });
      })
      .catch(async () => {
        const cached = await chrome.storage.local.get([INTERVALS_CACHE_KEY]);
        sendResponse({
          intervals: cached?.[INTERVALS_CACHE_KEY] || DEFAULT_INTERVALS,
          source: cached?.[INTERVALS_CACHE_KEY] ? "cache" : "default",
        });
      });
    return true;
  }
});

/* ===============================
   API FETCH HELPER
================================ */

async function apiFetch(endpoint, options = {}) {
  const auth = await AuthService.getAuth();

  if (!auth || !auth.token) {
    throw new Error("AUTH_REQUIRED");
  }

  // Check token expiry
  if (Date.now() > auth.expiresAt) {
    await AuthService.clearAuth();
    throw new Error("AUTH_REQUIRED");
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
      ...(options.headers || {}),
    },
  });

  // Handle 401 Unauthorized
  if (res.status === 401) {
    await AuthService.clearAuth();
    throw new Error("AUTH_REQUIRED");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "API_ERROR");
  }

  return data;
}