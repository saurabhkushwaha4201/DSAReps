const express = require('express');
const { googleAuth, initiateGoogleLogin, googleCallback } = require('./auth.controller');

const router = express.Router();

router.post('/google', googleAuth);
router.get('/google', initiateGoogleLogin);
router.get('/google/callback', googleCallback);

module.exports = router;
