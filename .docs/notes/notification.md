How Desktop Notifications Work
The Full Flow
Condition-by-Condition Breakdown
1. User turns notification ON at 9:00 AM and saves

Dashboard calls chrome.runtime.sendMessage({ type: 'UPDATE_ALARM', notifEnabled: true, notifTime: '09:00' })
Service worker clears any old "dailyDigest" alarm, creates a new one
If 9:00 AM hasn't passed today → alarm fires today at 9:00 AM
If 9:00 AM already passed (say it's 10:00 AM) → alarm fires tomorrow at 9:00 AM
After that, it repeats every 1440 minutes (every 24 hours)
2. User turns notification OFF and saves

UPDATE_ALARM is sent with notifEnabled: false
scheduleDigestAlarm(false, ...) runs, clears the alarm, returns early
No notification ever fires
3. Alarm fires at 9:00 AM → fireDailyDigest() runs

Checks: is user logged in? If not → silent, does nothing
Calls /api/problems/today to get due problems count
If count is 0 → silent, does nothing (no spam on clean days)
If count ≥ 1 → shows OS desktop notification:
Title: "Good Morning! Ready to code? 💻" (or Afternoon/Evening based on hour)
Message: "We've queued up 3 problems for you to review today. Let's get it done!"
4. User clicks the notification

Opens `${DASHBOARD_URL}/dashboard` in a new tab
Clears the notification from the OS tray
5. Service worker restarts (browser restart / Chrome kills it)

On startup, scheduleDigestAlarm() is called without arguments
It fetches settings fresh from the backend (/api/user/settings)
Re-creates the alarm from the saved notificationEnabled + notificationTime
This is why fixing the backend to return those fields was critical — without it, the alarm would never be restored after a browser restart
6. Every 2 hours (refreshTasks alarm fires)

Badge is refreshed with latest due-problem count
scheduleDigestAlarm() is also called again — re-reads settings in case they changed
Edge Cases
Situation	Result
Logged out, alarm fires	Silent — auth check fails
0 problems due, alarm fires	Silent — no spam
Browser restarted	Alarm restored from backend settings
User changes time from 9:00 to 20:00	Old alarm cleared instantly, new one set for 8 PM
Token expired	isAuthenticated() clears auth, notification silenced