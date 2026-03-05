const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    notificationTime: {
      type: String,
      default: '09:00', // Default as per prompt example, though prompt usage says 09:00
    },
    notificationEnabled: {
      type: Boolean,
      default: true,
    },
    dailyGoal: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    revisionIntervals: {
      hard: { type: Number, default: 1, min: 1, max: 30 },
      medium: { type: Number, default: 3, min: 1, max: 30 },
      easy: { type: Number, default: 5, min: 1, max: 30 },
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },

    // ── Silent Streak Tracking ──────────────────────────────
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
