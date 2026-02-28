import AuthService from "./auth.service.js";

console.log("[BG] Service Worker Loaded");

const API_BASE_URL = "http://localhost:5000";
const DASHBOARD_URL = "http://localhost:5175";

/* ===============================
   INITIALIZATION & ALARMS
================================ */

// Setup alarms on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("[BG] Extension Installed/Updated");

  // Create alarm that fires every 30 minutes for evening check
  chrome.alarms.create("EVENING_CHECK", {
    periodInMinutes: 30
  });

  console.log("[BG] Evening check alarm created (30 min interval)");
});

/* ===============================
   TRIGGER 1: MORNING - On Startup
================================ */
chrome.runtime.onStartup.addListener(async () => {
  console.log("[BG] 🌅 Browser Startup Detected");

  try {
    // Check if user is authenticated
    const isAuth = await AuthService.isAuthenticated();
    if (!isAuth) {
      console.log("[BG] User not authenticated. Skipping morning notification.");
      return;
    }

    // Check throttling
    const canSend = await checkThrottling();
    if (!canSend) {
      console.log("[BG] Morning notification throttled (< 6 hours since last)");
      return;
    }

    // Fetch due count (mock for now, replace with real API call)
    const dueCount = await fetchDueCountMock();

    if (dueCount > 0) {
      await sendNotification(
        "morning-briefing",
        "☀️ Ready to Code?",
        `You have ${dueCount} problem${dueCount > 1 ? 's' : ''} due today. Let's crush them!`
      );

      await updateThrottleTimestamp();
      console.log(`[BG] ✅ Morning notification sent (${dueCount} problems due)`);
    } else {
      console.log("[BG] No problems due, skipping notification");
    }

  } catch (err) {
    console.error("[BG] Morning trigger error:", err);
  }
});

/* ===============================
   TRIGGER 2: EVENING - 7 PM Check
================================ */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "EVENING_CHECK") {
    console.log("[BG] 🔔 Alarm fired - checking if evening");

    try {
      const now = new Date();
      const currentHour = now.getHours();

      // Only proceed if it's 7 PM or later
      if (currentHour < 19) {
        console.log(`[BG] Too early (${currentHour}:00), skipping evening check`);
        return;
      }

      // Check auth
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        console.log("[BG] User not authenticated. Skipping evening notification.");
        return;
      }

      // Check throttling
      const canSend = await checkThrottling();
      if (!canSend) {
        console.log("[BG] Evening notification throttled (< 6 hours since last)");
        return;
      }

      // Send streak protection reminder
      await sendNotification(
        "evening-streak",
        "🌙 Streak Protection",
        "Don't lose your streak! Take 10 minutes to review today."
      );

      await updateThrottleTimestamp();
      console.log("[BG] ✅ Evening notification sent");

    } catch (err) {
      console.error("[BG] Evening trigger error:", err);
    }
  }
});

/* ===============================
   NOTIFICATION CLICK HANDLER
================================ */
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log(`[BG] Notification clicked: ${notificationId}`);

  // Open dashboard
  chrome.tabs.create({ url: DASHBOARD_URL });

  // Clear the notification
  chrome.notifications.clear(notificationId);
});

/* ===============================
   THROTTLING LOGIC (6 Hour Rule)
================================ */

/**
 * Check if we can send a notification based on throttling rules
 * Returns true if >= 6 hours have passed since last notification
 */
async function checkThrottling() {
  const data = await chrome.storage.local.get(['lastNotificationTimestamp']);
  const lastTimestamp = data.lastNotificationTimestamp || 0;
  const now = Date.now();

  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const timeSinceLast = now - lastTimestamp;

  if (timeSinceLast >= SIX_HOURS_MS) {
    return true; // Can send
  }

  console.log(`[BG] Throttled: ${Math.round(timeSinceLast / 1000 / 60)} min since last (need 360 min)`);
  return false; // Throttled
}

/**
 * Update the last notification timestamp
 */
async function updateThrottleTimestamp() {
  await chrome.storage.local.set({
    lastNotificationTimestamp: Date.now()
  });
}

/* ===============================
   NOTIFICATION HELPER
================================ */

/**
 * Send a Chrome notification
 */
async function sendNotification(id, title, message) {
  return new Promise((resolve, reject) => {
    chrome.notifications.create(id, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: title,
      message: message,
      priority: 2,
      requireInteraction: false
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(notificationId);
      }
    });
  });
}

/* ===============================
   DATA FETCHING
================================ */

/**
 * Fetch due count from API (MOCK for now)
 * TODO: Replace with real API call to /api/problems/today
 */
async function fetchDueCountMock() {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 300));

  // Mock response - returns count of problems due
  return 3; // Change this to test different scenarios
}

/**
 * Fetch due count from real API (Uncomment when ready)
 */
async function fetchDueCount() {
  try {
    const data = await apiFetch("/api/problems/today");
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error("[BG] Failed to fetch due count:", err);
    return 0; // Fail silently
  }
}

/* ===============================
   EXISTING MESSAGE LISTENERS
================================ */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Check authentication status
  if (message.type === "AUTH_STATUS") {
    AuthService.isAuthenticated().then((isAuthenticated) => {
      sendResponse({ isAuthenticated });
    });
    return true; // Keep channel open for async response
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
    AuthService.clearAuth().then(() => {
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
      .then((res) => sendResponse(res))
      .catch((err) => {
        console.error("[BG] Save problem error:", err);
        sendResponse({ error: err.message || "SAVE_FAILED" });
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