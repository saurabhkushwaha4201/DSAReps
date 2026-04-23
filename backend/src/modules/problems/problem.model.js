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
      enum: ['leetcode', 'codeforces', 'cses', 'gfg', 'other'],
      required: true,
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
    },

    attemptType: {
      type: String,
      enum: ['solved', 'partial', 'watched'],
      default: 'solved',
    },

    status: {
      type: String,
      enum: ['active', 'mastered', 'archived'],
      default: 'active',
    },

    notes: {
      type: String, // NEW: Store Markdown here
      default: '',
    },

    tags: {
      type: [String], // NEW: e.g., ["DP", "Arrays"]
      default: [],
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    // ── Anti-Avalanche SRS Fields ──────────────────────────
    stabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 30,
    },

    lastAttemptRating: {
      type: String,
      enum: ['FORGOT', 'SLOW', 'CLEAN'],
      default: null,
    },

    nextReviewType: {
      type: String,
      enum: ['MICRO_RECALL', 'PATTERN_REBUILD', 'FULL_RECODE'],
      default: 'FULL_RECODE',
    },

    currentIntervalDays: {
      type: Number,
      default: 0,
    },

    nextReviewDate: {
      type: Date,
      default: null,
    },

    revisedCount: {
      type: Number,
      default: 0,
    },

    lastRevised: {
      type: Date,
      default: null,
    },

    // ── Manual Override (Dashboard Reschedule) ─────────────
    isManualOverride: {
      type: Boolean,
      default: false,
    },

    manualOverrideDate: {
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
 * Manual override triage index
 */
problemSchema.index({ userId: 1, isManualOverride: 1, manualOverrideDate: 1 });

/**
 * Anti-Avalanche triage query index
 * Supports: find due problems, sort by lowest stability
 */
problemSchema.index({ userId: 1, isDeleted: 1, status: 1, nextReviewDate: 1, stabilityScore: 1 });

module.exports = mongoose.model('Problem', problemSchema);
