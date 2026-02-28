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
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata', // Prompt example default
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
