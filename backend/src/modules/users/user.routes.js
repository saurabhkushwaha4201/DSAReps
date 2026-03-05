const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.middleware');
const userController = require('./user.controller');

router.use(auth);

router.get('/settings', userController.getSettings);
router.put('/settings', userController.updateSettings);

module.exports = router;
