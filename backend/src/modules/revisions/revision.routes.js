const express = require('express');
const router = express.Router();
const revisionController = require('./revision.controller');
const protect = require('../../middleware/auth.middleware');

// Protect all revision routes
router.use(protect);

router.post('/', revisionController.createReview); // POST /api/revisions (aka /api/reviews)
router.get('/stats', revisionController.getDashboardStats); // GET /api/revisions/stats

module.exports = router;
