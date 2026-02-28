const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const connectDB = require('../../config/db');
const { runReminderJob } = require('./notification.cron');

(async () => {
  try {
    await connectDB();
    await runReminderJob();
    console.log('Reminder job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running reminder job:', error);
    process.exit(1);
  }
})();
