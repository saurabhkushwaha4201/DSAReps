const User = require('./user.model');

/**
 * GET /api/user/settings
 * Returns the user's revision intervals + daily cap
 */
const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('revisionIntervals dailyGoal notificationEnabled notificationTime')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      settings: {
        revisionIntervals: user.revisionIntervals || { hard: 1, medium: 3, easy: 5 },
        dailyGoal: user.dailyGoal || 3,
        notificationEnabled: user.notificationEnabled ?? true,
        notificationTime: user.notificationTime || '09:00',
      },
    });
  } catch (err) {
    console.error('[USER] Get settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

/**
 * PUT /api/user/settings
 * Updates revision intervals + daily cap with guardrails
 *
 * Validation:
 * - All intervals: min 1, max 30
 * - hard <= medium <= easy (enforced ordering)
 * - dailyGoal: min 1, max 10
 */
const updateSettings = async (req, res) => {
  try {
    const { revisionIntervals, dailyGoal, notificationEnabled, notificationTime } = req.body;
    const update = {};

    // ── Validate dailyGoal ──────────────────────────────────
    if (dailyGoal !== undefined) {
      const cap = parseInt(dailyGoal);
      if (isNaN(cap) || cap < 1 || cap > 10) {
        return res.status(400).json({
          message: 'Daily cap must be between 1 and 10.',
        });
      }
      update.dailyGoal = cap;
    }

    // ── Validate revisionIntervals ──────────────────────────
    if (revisionIntervals) {
      const { hard, medium, easy } = revisionIntervals;
      const h = parseInt(hard);
      const m = parseInt(medium);
      const e = parseInt(easy);

      if ([h, m, e].some((v) => isNaN(v) || v < 1 || v > 30)) {
        return res.status(400).json({
          message: 'All intervals must be between 1 and 30 days.',
        });
      }

      // Enforce ordering: hard <= medium <= easy
      if (h > m || m > e) {
        return res.status(400).json({
          message: 'Intervals must follow: Hard ≤ Medium ≤ Easy.',
        });
      }

      update.revisionIntervals = { hard: h, medium: m, easy: e };
    }

    // ── Validate notification settings ──────────────────────
    if (notificationEnabled !== undefined) {
      if (typeof notificationEnabled === 'string') {
        update.notificationEnabled = notificationEnabled.toLowerCase() === 'true';
      } else {
        update.notificationEnabled = Boolean(notificationEnabled);
      }
    }

    if (notificationTime !== undefined) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(notificationTime)) {
        return res.status(400).json({
          message: 'Invalid time format. Use HH:MM (24-hour).',
        });
      }
      update.notificationTime = notificationTime;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No valid settings provided.' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    }).select('revisionIntervals dailyGoal notificationEnabled notificationTime');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      settings: {
        revisionIntervals: user.revisionIntervals,
        dailyGoal: user.dailyGoal,
        notificationEnabled: user.notificationEnabled,
        notificationTime: user.notificationTime,
      },
    });
  } catch (err) {
    console.error('[USER] Update settings error:', err);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

module.exports = { getSettings, updateSettings };
