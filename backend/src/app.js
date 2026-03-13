const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');
const problemRoutes = require('./modules/problems/problem.routes');
const revisionRoutes = require('./modules/revisions/revision.routes');
const userRoutes = require('./modules/users/user.routes');

const app = express();


// Allowed origins
const allowedOrigins = [
  "http://localhost:5175",
  process.env.DASHBOARD_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests without origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // allow Chrome extension service workers (origin = chrome-extension://<id>)
      if (origin.startsWith('chrome-extension://')) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('DSA Revision Backend is running');
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/revisions', revisionRoutes);
app.use('/api/user', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);

  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

module.exports = app;
