const mongoose = require('mongoose');
const Problem = require('./problem.model');
const RevisionLog = require('../revisions/revision.model');
const User = require('../users/user.model');
const { getDailyTriage } = require('./triage.service');

const DEFAULT_INTERVALS = { hard: 1, medium: 3, easy: 5 };
const MAX_INTERVAL_DAYS = 90;

const clampStability = (v) => Math.max(0, Math.min(100, v));

const computeReviewType = (stabilityScore) => {
  if (stabilityScore >= 70) return 'MICRO_RECALL';
  if (stabilityScore >= 40) return 'PATTERN_REBUILD';
  return 'FULL_RECODE';
};

const getStartOfDayInTimezone = (date, timezone) => {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = Number(dateParts.find((part) => part.type === 'year')?.value || '0');
  const month = Number(dateParts.find((part) => part.type === 'month')?.value || '0');
  const day = Number(dateParts.find((part) => part.type === 'day')?.value || '0');
  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const zonedParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(utcMidnight);
  const hour = Number(zonedParts.find((part) => part.type === 'hour')?.value || '0');
  const minute = Number(zonedParts.find((part) => part.type === 'minute')?.value || '0');
  const second = Number(zonedParts.find((part) => part.type === 'second')?.value || '0');

  return new Date(Date.UTC(year, month - 1, day, -hour, -minute, -second));
};

const updateUserStreak = async (userId, timezone = 'UTC') => {
  const startOfToday = getStartOfDayInTimezone(new Date(), timezone);
  const completedToday = await RevisionLog.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: startOfToday },
  });

  const user = await User.findById(userId).select('dailyGoal streak');
  const dailyGoal = user?.dailyGoal || 3;
  if (completedToday < dailyGoal) {
    return;
  }

  const streak = user?.streak || { current: 0, longest: 0, lastActiveDate: null };
  const lastActive = streak.lastActiveDate
    ? getStartOfDayInTimezone(new Date(streak.lastActiveDate), timezone)
    : null;
  const yesterday = new Date(startOfToday);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  if (lastActive && lastActive.getTime() === startOfToday.getTime()) {
    return;
  }

  if (lastActive && lastActive.getTime() === yesterday.getTime()) {
    streak.current += 1;
  } else {
    streak.current = 1;
  }

  streak.longest = Math.max(streak.longest || 0, streak.current);
  streak.lastActiveDate = startOfToday;
  await User.updateOne({ _id: userId }, { $set: { streak } });
};

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

const getAllProblems = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    // Cap limit to prevent abuse (e.g., ?limit=999999)
    limit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * limit;

    const query = {
      userId: req.user.id,
      isDeleted: { $ne: true },
    };

    if (req.query.url) {
      query.url = req.query.url;
    }

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

const saveProblem = async (req, res) => {
  try {
    const { platform, title, url, difficulty, notes } = req.body;
    const userId = req.user.id;
    const timezone = req.body.timezone || req.query.tz || 'UTC';

    // ── Validate inputs ────────────────────────────────────
    const VALID_PLATFORMS = ['leetcode', 'codeforces', 'cses', 'gfg', 'other'];
    if (!VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform.' });
    }

    const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ message: 'Invalid difficulty.' });
    }

    // Validate URL is actually a URL
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return res.status(400).json({ message: 'URL must start with http:// or https://' });
      }
    } catch {
      return res.status(400).json({ message: 'Invalid URL format.' });
    }

    // Validate notes length (max 50KB)
    if (notes && notes.length > 50000) {
      return res.status(400).json({ message: 'Notes must be less than 50KB.' });
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    let problem = await Problem.findOne({ userId, url });

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
      notes: notes || '',
      stabilityScore: 30,
      nextReviewType: 'FULL_RECODE',
      currentIntervalDays: interval,
      nextReviewDate: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
    });

    await RevisionLog.create({
      userId,
      problemId: problem._id,
      rating: 'INITIAL',
      device: req.body.device === 'Extension' ? 'Extension' : 'Web',
    });

    try {
      await updateUserStreak(userId, timezone);
    } catch (streakErr) {
      console.warn('[STREAK] Initial save streak update failed:', streakErr.message);
    }

    res.status(201).json({
      success: true,
      problem,
    });
  } catch (err) {
    console.error('[PROBLEM] Save error:', err);
    res.status(500).json({ message: 'Failed to save problem' });
  }
};

const updateProblemNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const problem = await Problem.findOneAndUpdate(
      { _id: id, userId },
      { notes },
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

const reviseProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, device } = req.body;
    const userId = req.user.id;
    const timezone = req.body.timezone || req.query.tz || 'UTC';

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
      newInterval = Math.max(1, Math.round(baseInterval));
      newInterval = Math.min(MAX_INTERVAL_DAYS, newInterval);
      newStability = clampStability(
        (problem.stabilityScore || 30) + rule.stabilityDelta
      );
    }

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
    problem.isManualOverride = false;
    problem.manualOverrideDate = null;

    if (problem.stabilityScore >= 90 && problem.revisedCount >= 5) {
      problem.status = 'mastered';
    }

    await problem.save();

    await RevisionLog.create({
      userId,
      problemId: problem._id,
      rating,
      device: device || 'Web',
    });

    try {
      await updateUserStreak(userId, timezone);
    } catch (streakErr) {
      console.warn('[STREAK] Silent update failed:', streakErr.message);
    }

    res.json({ success: true, problem });
  } catch (err) {
    console.error('[REVISE] Revision error:', err);
    res.status(500).json({ message: 'Failed to revise problem' });
  }
};

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

const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const timezone = req.query.tz || 'UTC';

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const heatmap = await RevisionLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: oneYearAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone,
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const problems = await Problem.find(
      { userId, isDeleted: { $ne: true }, status: { $ne: 'archived' } },
      'difficulty stabilityScore revisedCount'
    ).lean();

    const tagMap = {};
    problems.forEach((p) => {
      const tag = p.difficulty || 'unknown';
      if (!tagMap[tag]) tagMap[tag] = { total: 0, revisedCount: 0, totalCount: 0 };
      tagMap[tag].totalCount += 1;
      if ((p.revisedCount || 0) >= 1) {
        tagMap[tag].total += p.stabilityScore || 0;
        tagMap[tag].revisedCount += 1;
      }
    });

    const weakClusters = Object.entries(tagMap).map(([tag, data]) => ({
      tag,
      avgStability: data.revisedCount > 0 ? Math.round(data.total / data.revisedCount) : 0,
      revisedCount: data.revisedCount,
      totalCount: data.totalCount,
    }));

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

const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Use soft delete: mark as isDeleted: true
    // This prevents the URL from being re-added immediately and maintains history
    const problem = await Problem.findOneAndUpdate(
      { _id: id, userId },
      { isDeleted: true },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[PROBLEM] Delete error:', err);
    res.status(500).json({ message: 'Failed to delete problem' });
  }
};

module.exports = {
  saveProblem,
  getAllProblems,
  updateProblemNotes,
  archiveProblem,
  unarchiveProblem,
  deleteProblem,
  getTodayProblems,
  reviseProblem,
  rescheduleProblem,
  getStats,
};
