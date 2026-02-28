const Problem = require('./problem.model');
const spacedRepetition = require('./spaced-Repetition.service');

const daysBetween = (futureDate) => {
  const now = new Date();
  const diff = futureDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

// GET /api/problems/today
const getTodayRevisions = async (req, res) => {
  try {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const problems = await Problem.find({
      userId: req.user.id,
      nextReviewDate: { $lte: endOfToday },
      status: { $ne: 'mastered' },
      isDeleted: { $ne: true },
    }).sort({ nextReviewDate: 1 });

    res.json(problems);
  } catch (err) {
    console.error('[PROBLEM] Fetch today error:', err);
    res.status(500).json({ message: 'Failed to fetch today revisions' });
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
        nextRevisionInDays: daysBetween(problem.nextReviewDate),
        problem,
      });
    }

    // New Problem Defaults
    // No need to call SRS service for initial state, just defaults:
    const nextReviewDate = new Date(); // Ready for review immediately or tomorrow?
    // "InitialNextRevisionDate" logic was: solved->7, partial->3, watched->1
    // We can keep this simple initial mapping if we want, or just set to Now.
    // Let's keep a simple mapping for initial "snooze" if relevant, or start at 0.
    // Prompt "Problems (Live State)" just says "next_review_date".
    // Let's default to "Tomorrow" (1 day) if solved, else 0?
    // Let's stick to the prompt's implied simple flow. Review creates history.
    // I will set it to NOW so it appears in "Due".

    // Actually, let's keep the old loose logic for initial date just to be nice, 
    // or just default to 1 day.
    // I'll set it to Date.now() so it shows up in "Today" list immediately if they want to review it.

    problem = await Problem.create({
      userId,
      platform,
      title,
      url,
      difficulty,
      attemptType,
      notes: notes || '', // Save notes from extension
      timeSpent: timeSpent || 0, // Save time spent
      srsInterval: 0,
      srsEaseFactor: 2.5,
      nextReviewDate: new Date(),
    });

    res.status(201).json({
      success: true,
      nextRevisionInDays: 0,
      problem,
    });
  } catch (err) {
    console.error('[PROBLEM] Save error:', err);
    res.status(500).json({ message: 'Failed to save problem' });
  }
};

// POST /api/problems/:id/revise (Legacy wrapper for Reviews)
const reviseProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { solvedComfortably } = req.body; // boolean
    const userId = req.user.id;

    const problem = await Problem.findOne({ _id: id, userId });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Map legacy boolean to new Rating
    const rating = solvedComfortably ? 'GOOD' : 'AGAIN';

    const { interval, easeFactor, nextReviewDate } = spacedRepetition.calculateSRS(
      problem.srsInterval || 0,
      problem.srsEaseFactor || 2.5,
      rating
    );

    problem.srsInterval = interval;
    problem.srsEaseFactor = easeFactor;
    problem.nextReviewDate = nextReviewDate;
    problem.lastRevisedAt = new Date(); // Keep if we want, but RevisionLog is better

    await problem.save();

    // Ideally we should also create a RevisionLog here for consistency, 
    // but this is a legacy endpoint. Let's just update the problem.

    res.status(200).json({
      success: true,
      status: problem.status, // legacy field
      nextRevisionInDays: daysBetween(nextReviewDate),
    });
  } catch (err) {
    console.error('[PROBLEM] Revise error:', err);
    res.status(500).json({ message: 'Failed to revise problem' });
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

// PATCH /api/problems/:id/reschedule
const rescheduleProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { nextReviewDate } = req.body;
    const userId = req.user.id;

    if (!nextReviewDate) {
      return res.status(400).json({ message: 'nextReviewDate is required' });
    }

    const problem = await Problem.findOneAndUpdate(
      { _id: id, userId, isDeleted: { $ne: true } },
      { nextReviewDate: new Date(nextReviewDate) },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({
      success: true,
      problem,
      nextRevisionInDays: daysBetween(problem.nextReviewDate),
    });
  } catch (err) {
    console.error('[PROBLEM] Reschedule error:', err);
    res.status(500).json({ message: 'Failed to reschedule problem' });
  }
};

module.exports = {
  saveProblem,
  reviseProblem,
  getAllProblems,
  getTodayRevisions,
  updateProblemNotes,
  archiveProblem,
  unarchiveProblem,
  rescheduleProblem,
};
