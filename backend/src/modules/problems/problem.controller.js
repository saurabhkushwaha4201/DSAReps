const Problem = require('./problem.model');
const RevisionLog = require('../revisions/revision.model');
const User = require('../users/user.model');
const { getDailyTriage } = require('./triage.service');

// ── Constants ──────────────────────────────────────────────
const DEFAULT_INTERVALS = { hard: 1, medium: 3, easy: 5 };
const MAX_INTERVAL_DAYS = 90; // 90-day ceiling

// ── Helpers ────────────────────────────────────────────────
const clampStability = (v) => Math.max(0, Math.min(100, v));

/**
 * Dynamically compute next review type from stability score.
 * Replaces the static lookup from RATING_RULES.
 */
const computeReviewType = (stabilityScore) => {
  if (stabilityScore >= 70) return 'MICRO_RECALL';
  if (stabilityScore >= 40) return 'PATTERN_REBUILD';
  return 'FULL_RECODE';
};

// ── Multiplier Logic ───────────────────────────────────────
const RATING_RULES = {
  CLEAN: {
    stabilityDelta: 20,
    intervalMultiplier: 2.5,
  },
  SLOW: {
    stabilityDelta: 5,
    intervalMultiplier: 1.5,
  },
  FORGOT: {
    stabilityReset: 10,
    intervalReset: 1,
  },
};

// GET /api/problems (with pagination)
const getAllProblems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {
      userId: req.user.id,
      isDeleted: { $ne: true },
    };

    const [problems, total] = await Promise.all([
      Problem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Problem.countDocuments(query),
    ]);

    res.json({
      problems,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (err) {
    console.error('[PROBLEM] Fetch all error:', err);
    res.status(500).json({ message: 'Failed to fetch problems' });
  }
};

// POST /api/problems
const saveProblem = async (req, res) => {
  try {
    const { platform, title, url, difficulty, attemptType, notes, timeSpent } = req.body;
    const userId = req.user.id;
    console.log("REQ BODY", req.body);

    let problem = await Problem.findOne({ userId, url });

    // Idempotent save
    if (problem) {
      if (problem.isDeleted) {
        problem.isDeleted = false;
        await problem.save();
      }

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        problem,
      });
    }

    // Fetch user's custom intervals (or use defaults)
    const user = await User.findById(userId)
      .select('revisionIntervals')
      .lean();
    const intervals = user?.revisionIntervals || DEFAULT_INTERVALS;
    const interval = intervals[difficulty] || DEFAULT_INTERVALS[difficulty] || 3;

    problem = await Problem.create({
      userId,
      platform,
      title,
      url,
      difficulty,
      attemptType,
      notes: notes || '',
      timeSpent: timeSpent || 0,
      // Anti-Avalanche SRS initialization — uses user's intervals
      stabilityScore: 30,
      nextReviewType: 'FULL_RECODE',
      currentIntervalDays: interval,
      nextReviewDate: new Date(
        Date.now() + interval * 24 * 60 * 60 * 1000
      ),
    });

    res.status(201).json({
      success: true,
      problem,
    });
  } catch (err) {
    console.error('[PROBLEM] Save error:', err);
    res.status(500).json({ message: 'Failed to save problem' });
  }
};

// PATCH /api/problems/:id/notes
const updateProblemNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const problem = await Problem.findOneAndUpdate(
      { _id: id, userId },
      { notes: notes },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ success: true, notes: problem.notes });
  } catch (err) {
    console.error('[PROBLEM] Update notes error:', err);
    res.status(500).json({ message: 'Failed to update notes' });
  }
};

// PATCH /api/problems/:id/archive
const archiveProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const problem = await Problem.findOneAndUpdate(
      { _id: id, userId, isDeleted: { $ne: true } },
      {
        status: 'archived',
        archivedAt: new Date(),
      },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ success: true, problem });
  } catch (err) {
    console.error('[PROBLEM] Archive error:', err);
    res.status(500).json({ message: 'Failed to archive problem' });
  }
};

// PATCH /api/problems/:id/unarchive
const unarchiveProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const problem = await Problem.findOneAndUpdate(
      { _id: id, userId },
      {
        status: 'active',
        archivedAt: null,
      },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ success: true, problem });
  } catch (err) {
    console.error('[PROBLEM] Unarchive error:', err);
    res.status(500).json({ message: 'Failed to unarchive problem' });
  }
};

// ── GET /api/problems/today ────────────────────────────────
// Anti-Avalanche triage: respects manual overrides first,
// then fills remaining slots with algorithmic picks
const getTodayProblems = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('dailyGoal')
      .lean();
    const dailyCap = user?.dailyGoal || 3;

    const problems = await getDailyTriage(req.user.id, dailyCap);
    res.json({ success: true, problems, count: problems.length });
  } catch (err) {
    console.error('[TRIAGE] Daily triage error:', err);
    res.status(500).json({ message: 'Failed to fetch daily tasks' });
  }
};

// ── POST /api/problems/:id/revise ──────────────────────────
// Applies multiplier logic based on user's self-rating
const reviseProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, device } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (!['FORGOT', 'SLOW', 'CLEAN'].includes(rating)) {
      return res.status(400).json({
        message: 'Invalid rating. Must be FORGOT, SLOW, or CLEAN.',
      });
    }

    const problem = await Problem.findOne({
      _id: id,
      userId,
      isDeleted: false,
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const rule = RATING_RULES[rating];
    let newInterval;
    let newStability;

    if (rating === 'FORGOT') {
      newStability = rule.stabilityReset;
      newInterval = rule.intervalReset;
    } else {
      const currentInterval = problem.currentIntervalDays || 1;
      const baseInterval = currentInterval * rule.intervalMultiplier;
      // Floor guard: interval must be at least 1 day
      newInterval = Math.max(1, Math.round(baseInterval));
      // Ceiling guard: cap at 90 days
      newInterval = Math.min(MAX_INTERVAL_DAYS, newInterval);
      newStability = clampStability(
        (problem.stabilityScore || 30) + rule.stabilityDelta
      );
    }

    // Dynamic review type from stability, not static lookup
    const nextReviewType = computeReviewType(newStability);

    const nextReviewDate = new Date(
      Date.now() + newInterval * 24 * 60 * 60 * 1000
    );

    problem.stabilityScore = newStability;
    problem.lastAttemptRating = rating;
    problem.nextReviewType = nextReviewType;
    problem.currentIntervalDays = newInterval;
    problem.nextReviewDate = nextReviewDate;
    problem.revisedCount = (problem.revisedCount || 0) + 1;
    problem.lastRevised = new Date();

    // Reset manual override — algorithm takes control again
    problem.isManualOverride = false;
    problem.manualOverrideDate = null;

    // Auto-master after high stability + many revisions
    if (problem.stabilityScore >= 90 && problem.revisedCount >= 5) {
      problem.status = 'mastered';
    }

    await problem.save();

    // Log the revision
    await RevisionLog.create({
      userId,
      problemId: problem._id,
      rating,
      device: device || 'Web',
    });

    // ── Silent Streak Update ────────────────────────────────
    // Only increment streak when daily goal is exactly met (threshold crossing)
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const completedToday = await RevisionLog.countDocuments({
        userId: require('mongoose').Types.ObjectId(userId),
        createdAt: { $gte: startOfDay },
      });

      const user = await User.findById(userId).select('dailyGoal streak');
      const dailyGoal = user?.dailyGoal || 3;

      if (completedToday === dailyGoal) {
        const streak = user.streak || { current: 0, longest: 0, lastActiveDate: null };
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastActive = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null;
        if (lastActive) lastActive.setHours(0, 0, 0, 0);

        const diffDays = lastActive
          ? Math.round((today - lastActive) / (24 * 60 * 60 * 1000))
          : -1;

        if (diffDays === 0) {
          // Already counted today — no-op
        } else if (diffDays === 1) {
          // Consecutive day — increment
          streak.current += 1;
          if (streak.current > streak.longest) streak.longest = streak.current;
          streak.lastActiveDate = today;
          await User.updateOne({ _id: userId }, { $set: { streak } });
        } else {
          // Gap > 1 day (or first ever) — reset to 1
          streak.current = 1;
          if (streak.current > streak.longest) streak.longest = streak.current;
          streak.lastActiveDate = today;
          await User.updateOne({ _id: userId }, { $set: { streak } });
        }
      }
    } catch (streakErr) {
      // Streak failures must never block the revision response
      console.warn('[STREAK] Silent update failed:', streakErr.message);
    }

    res.json({ success: true, problem });
  } catch (err) {
    console.error('[REVISE] Revision error:', err);
    res.status(500).json({ message: 'Failed to revise problem' });
  }
};

// ── PUT /api/problems/:id/reschedule ────────────────────────
// Manual override — sets a specific review date for this problem.
// Does NOT touch stabilityScore or intervals — scheduling priority only.
const rescheduleProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      return res.status(400).json({ message: 'Date must be today or in the future.' });
    }

    // Max 90 days out
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 90);
    if (targetDate > maxDate) {
      return res.status(400).json({ message: 'Date cannot be more than 90 days out.' });
    }

    const problem = await Problem.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      {
        isManualOverride: true,
        manualOverrideDate: targetDate,
      },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ success: true, problem });
  } catch (err) {
    console.error('[RESCHEDULE] Error:', err);
    res.status(500).json({ message: 'Failed to reschedule problem' });
  }
};

// ── GET /api/problems/stats ─────────────────────────────────
// Returns heatmap data, weak clusters, and streak for dashboard
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── Heatmap: revision counts per day (last 365 days) ────
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const heatmap = await RevisionLog.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId), createdAt: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── Weak clusters: avg stability per tag ────────────────
    const problems = await Problem.find(
      { userId, isDeleted: { $ne: true }, status: { $ne: 'archived' } },
      'difficulty stabilityScore'
    ).lean();

    const tagMap = {};
    problems.forEach((p) => {
      const tag = p.difficulty || 'unknown';
      if (!tagMap[tag]) tagMap[tag] = { total: 0, count: 0 };
      tagMap[tag].total += p.stabilityScore || 0;
      tagMap[tag].count += 1;
    });

    const weakClusters = Object.entries(tagMap).map(([tag, data]) => ({
      tag,
      avgStability: Math.round(data.total / data.count),
      count: data.count,
    }));

    // ── Streak: read persistent streak from user model ─────
    const user = await User.findById(userId).select('streak').lean();
    const streak = user?.streak || { current: 0, longest: 0, lastActiveDate: null };

    res.json({
      success: true,
      heatmap: heatmap.map((h) => ({ date: h._id, count: h.count })),
      weakClusters,
      streak: streak.current,
      longestStreak: streak.longest,
      totalProblems: problems.length,
    });
  } catch (err) {
    console.error('[STATS] Error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

module.exports = {
  saveProblem,
  getAllProblems,
  updateProblemNotes,
  archiveProblem,
  unarchiveProblem,
  getTodayProblems,
  reviseProblem,
  rescheduleProblem,
  getStats,
};
