const mongoose = require('mongoose');
const RevisionLog = require('./revision.model');
const Problem = require('../problems/problem.model');
const { calculateSRS } = require('../problems/spaced-Repetition.service');

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { problemId, rating, timeTaken, device } = req.body;
    const userId = req.user.id;

    // 1. Get the problem
    const problem = await Problem.findOne({ _id: problemId, userId });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // 2. Calculate new SRS state
    const { interval, easeFactor, nextReviewDate } = calculateSRS(
      problem.srsInterval || 0,
      problem.srsEaseFactor || 2.5,
      rating
    );

    // 3. Update Problem (The "State")
    problem.srsInterval = interval;
    problem.srsEaseFactor = easeFactor;
    problem.nextReviewDate = nextReviewDate;
    await problem.save();

    // 4. Create RevisionLog (The "History")
    await RevisionLog.create({
      userId,
      problemId,
      rating,
      timeTaken,
      device,
      reviewedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      nextReviewDate,
      interval,
    });
  } catch (err) {
    console.error('[REVIEW] Create error:', err);
    res.status(500).json({ message: 'Failed to submit review' });
  }
};

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    // A. Streak (Simplified: check if revised today, then check yesterday, etc. - complex query, or just simplified for now)
    // For MVP, we can just return total revisions and today's count.
    // Or implementing a robust streak calculation:

    // Get all unique dates of revision
    const revisions = await RevisionLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt" } }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Calculate streak
    let streak = 0;
    // ... (Streak logic would go here. For now returning simple stats)

    const totalRevisions = await RevisionLog.countDocuments({ userId });
    const problemsMastered = await Problem.countDocuments({ userId, srsInterval: { $gt: 20 } }); // Example threshold

    res.json({
      totalRevisions,
      problemsMastered,
      streak: revisions.length, // Rough proxy for "days active"
    });
  } catch (err) {
    console.error('[STATS] Fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

module.exports = {
  createReview,
  getDashboardStats
};
