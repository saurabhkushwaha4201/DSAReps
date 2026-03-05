const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.middleware');
const problemController = require('./problem.controller');

// All routes here should be protected
router.use(auth);

// ── Static routes BEFORE parameterized /:id routes ────────
router.get('/today', problemController.getTodayProblems); // Anti-Avalanche triage (max 3)
router.get('/stats', problemController.getStats);         // Dashboard stats (heatmap, clusters, streak)

router.post('/', problemController.saveProblem);
router.get('/', problemController.getAllProblems);

// ── Parameterized routes ───────────────────────────────────
router.post('/:id/revise', problemController.reviseProblem);
router.put('/:id/reschedule', problemController.rescheduleProblem);
router.patch('/:id/notes', problemController.updateProblemNotes);
router.patch('/:id/archive', problemController.archiveProblem);
router.patch('/:id/unarchive', problemController.unarchiveProblem);

module.exports = router;
