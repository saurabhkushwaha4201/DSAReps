require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1️⃣ Connect DB first
    await connectDB();
    console.log('[DB] Connected');

    // 2️⃣ Start server
    app.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[BOOT] Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
