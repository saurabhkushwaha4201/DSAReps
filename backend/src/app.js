const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');
const problemRoutes = require('./modules/problems/problem.routes');
const revisionRoutes = require('./modules/revisions/revision.routes');
const userRoutes = require('./modules/users/user.routes');

const app = express();

// Core middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5175'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('DSA Revision Backend is running');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/revisions', revisionRoutes);
app.use('/api/user', userRoutes);

// Custom Requested Routes
const revisionController = require('./modules/revisions/revision.controller');
const protect = require('./middleware/auth.middleware');

// POST /api/reviews -> Creates a review/log
app.post('/api/reviews', protect, revisionController.createReview);

// GET /api/dashboard/stats -> Stats
app.get('/api/dashboard/stats', protect, revisionController.getDashboardStats);


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
