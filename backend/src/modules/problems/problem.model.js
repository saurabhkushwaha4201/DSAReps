const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ['leetcode', 'codeforces'],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
      index: true,
    },

    attemptType: {
      type: String,
      enum: ['solved', 'partial', 'watched'],
      required: true,
    },

    status: {
      type: String,
      enum: ['active', 'mastered', 'archived'],
      default: 'active',
      index: true,
    },

    notes: {
      type: String, // NEW: Store Markdown here
      default: '',
    },

    tags: {
      type: [String], // NEW: e.g., ["DP", "Arrays"]
      default: [],
      index: true,
    },

    // SRS Fields (The Algorithm State)
    srsInterval: {
      type: Number, // Current gap in days
      default: 0,
    },

    srsEaseFactor: {
      type: Number,
      default: 2.5,
    },

    nextReviewDate: {
      type: Date,
      required: true,
      index: true,
      default: Date.now,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * ✅ Unique per user + URL ONLY for non-deleted problems
 * This allows re-adding after soft delete
 */
problemSchema.index(

  { userId: 1, url: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

/**
 * Efficient queries for reminders & dashboards
 */
problemSchema.index({ userId: 1, nextReviewDate: 1 });
problemSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Problem', problemSchema);
