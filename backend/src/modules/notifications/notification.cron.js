const cron = require('node-cron');
const moment = require('moment-timezone');

const User = require('../users/user.model');
const Problem = require('../problems/problem.model'); // direct model access

/**
 * TEMP: Notification sender (replace with email/push later)
 */
const sendNotification = (user, count) => {
  console.log(
    `[NOTIFICATION] ${user.email} (${user.name}) has ${count} problems due for revision`
  );
};

/**
 * Check if it's reminder time for user's timezone
 */
const isReminderHour = (timezone, hour = 19) => {
  const tz = timezone || 'UTC';
  return moment().tz(tz).hour() === hour;
};

/**
 * Main cron job logic
 */
const runReminderJob = async () => {
  console.log('[CRON] Running hourly revision reminder job');

  const cursor = User.find({})
    .select('_id email name timezone')
    .cursor();

  for (
    let user = await cursor.next();
    user != null;
    user = await cursor.next()
  ) {
    try {
      if (!isReminderHour(user.timezone)) continue;


      console.log(
        "[CRON]",
        "User:", user._id,
        "Name:", user.name,
        "Timezone:", user.timezone
      );

      const dueCount = await Problem.countDocuments({
        userId: user._id,
        nextReviewDate: { $lte: new Date() },
        status: { $ne: 'mastered' },
        isDeleted: { $ne: true }
      });

      console.log("[CRON] Due count:", dueCount);

      if (dueCount > 0) {
        sendNotification(user, dueCount);
      }
    } catch (err) {
      console.error(
        `[CRON] Failed for user ${user._id}:`,
        err.message
      );
    }
  }
};

/**
 * Initialize cron
 */
const init = () => {
  cron.schedule('0 * * * *', runReminderJob);
  console.log('[CRON] Hourly reminder job scheduled');
};

module.exports = { init, runReminderJob };

