import AuthService from "./auth.service.js";

console.log("[BG] Service Worker Loaded");

const API_BASE_URL = "http://localhost:5000";
const DASHBOARD_URL = "http://localhost:5175";

/* ===============================
   BADGE MANAGEMENT
================================ */

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

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshTasks") {
    fetchAndUpdateBadge();
  }
});

// Also refresh on service worker startup
fetchAndUpdateBadge();

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

  // Handle login
  if (message.type === "AUTH_LOGIN") {
    const authUrl = `${API_BASE_URL}/api/auth/google?source=extension`;

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