const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.middleware');
const problemController = require('./problem.controller');

// All routes here should be protected
router.use(auth);

router.post('/', problemController.saveProblem);
router.get('/', problemController.getAllProblems);
router.get('/today', problemController.getTodayRevisions);
router.post('/:id/revise', problemController.reviseProblem); // Legacy
router.patch('/:id/notes', problemController.updateProblemNotes);
router.patch('/:id/archive', problemController.archiveProblem);
router.patch('/:id/unarchive', problemController.unarchiveProblem);
router.patch('/:id/reschedule', problemController.rescheduleProblem);

module.exports = router;
