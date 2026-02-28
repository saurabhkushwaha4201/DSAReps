const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const Problem = require("../problems/problem.model");

router.get("/due-count", auth, async (req, res) => {
  const count = await Problem.countDocuments({
    userId: req.user.id,
    nextReviewDate: { $lte: new Date() },
    status: { $ne: "mastered" },
    isDeleted: { $ne: true },
  });

  res.json({ count });
});

module.exports = router;
