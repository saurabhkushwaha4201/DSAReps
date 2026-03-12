const Problem = require('./problem.model');

/**
 * Anti-Avalanche Daily Triage Service — 2-Phase
 *
 * Phase A: Manual/pinned overrides due today or earlier are always included
 *          and can exceed the user's dailyCap/dailyGoal.
 * Phase B: Algorithmic picks sorted by lowest stabilityScore, trimmed to
 *          respect the remaining dailyCap slots after overrides are counted.
 * The returned array may therefore be larger than dailyCap when overrides exist.
 *
 * Overrides persist until the user actually rates the problem
 * (manualOverrideDate is only cleared on a rating call).
 */

/**
 * Get the daily triage list for a user.
 *
 * @param {string} userId - The user's ObjectId
 * @param {number} dailyCap - Max tasks to return (from user.dailyGoal)
 * @returns {Promise<Array>} - Array of up to dailyCap problem documents
 */
async function getDailyTriage(userId, dailyCap = 3) {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const baseFilter = {
    userId,
    isDeleted: false,
    status: 'active',
  };

  // ── Phase A: Manual overrides due today or earlier ────────
  // Pinned problems always bypass the daily cap — the user explicitly
  // requested them, so limiting them would cause frustration.
  const overrides = await Problem.find({
    ...baseFilter,
    isManualOverride: true,
    manualOverrideDate: { $lte: endOfToday, $ne: null },
  })
    .sort({ manualOverrideDate: 1 }) // Earliest override first
    .lean();

  const remainingSlots = dailyCap - overrides.length;

  if (remainingSlots <= 0) {
    // All slots consumed by pinned problems — still return ALL pinned
    // (they override the cap), but no algorithmic picks added.
    return overrides;
  }

  // Collect override IDs so we don't duplicate them in Phase B
  const overrideIds = overrides.map((p) => p._id);

  // ── Phase B: Algorithmic picks (lowest stability first) ──
  const algorithmic = await Problem.find({
    ...baseFilter,
    isManualOverride: { $ne: true },
    nextReviewDate: { $lte: endOfToday, $ne: null },
    _id: { $nin: overrideIds },
  })
    .sort({ stabilityScore: 1 })
    .limit(remainingSlots)
    .lean();

  return [...overrides, ...algorithmic];
}

module.exports = { getDailyTriage };
