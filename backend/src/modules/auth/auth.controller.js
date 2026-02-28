const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');

/**
 * Generate backend JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Create OAuth client per request (IMPORTANT)
 */
const createOAuthClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5000/api/auth/google/callback'
  );
};

/**
 * GET /auth/google
 * Initiates Google OAuth (used by extension + optional web redirect flow)
 */
const initiateGoogleLogin = (req, res) => {
  const source = req.query.source || 'web';

  const oauthClient = createOAuthClient();
  console.log('HIT /auth/google');

  const authorizeUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: JSON.stringify({ source }),
  });

  res.redirect(authorizeUrl);
};

/**
 * GET /auth/google/callback
 * Handles Google OAuth redirect
 */
const googleCallback = async (req, res) => {
  const { code, state } = req.query;
  console.log('[Backend] Google Callack Hit. Code present:', !!code, 'State:', state);

  try {
    const oauthClient = createOAuthClient();

    // Exchange auth code for tokens
    const { tokens } = await oauthClient.getToken(code);
    console.log('[Backend] Tokens received from Google');
    oauthClient.setCredentials(tokens);

    // Verify ID token
    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      picture: avatar,
    } = payload;

    console.log('[Backend] Authenticated User:', email);

    // Find or create user
    let user = await User.findOne({ googleId });
    if (!user) {
      console.log('[Backend] Creating new user');
      user = await User.create({
        googleId,
        email,
        name,
        avatar,
      });
    }

    // Generate backend JWT
    const token = generateToken(user);
    console.log('[Backend] JWT Generated');

    // Parse source safely
    let source = 'web';
    try {
      const parsedState = JSON.parse(state);
      source = parsedState.source || 'web';
    } catch {
      // ignore invalid state
      console.warn('[Backend] Could not parse state JSON');
    }

    console.log('[Backend] Auth Source:', source);

    // Extension flow
    if (source === "extension") {
      const redirectUrl =
        `https://${process.env.EXTENSION_ID}.chromiumapp.org/auth?token=${token}`;

      return res.redirect(redirectUrl);
    }






    // Default web fallback
    console.log('[Backend] Redirecting to Web Login');
    return res.redirect(
      `http://localhost:5175/login?token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    return res.redirect(
      'http://localhost:5175/login?error=auth_failed'
    );
  }
};

/**
 * POST /auth/google
 * Web frontend Google One Tap / ID token flow
 */
const googleAuth = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res
      .status(400)
      .json({ message: 'Google credential is required' });
  }

  try {
    const oauthClient = createOAuthClient();

    const ticket = await oauthClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      picture: avatar,
    } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        avatar,
      });
    }

    // Issue backend JWT
    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        notificationTime: user.notificationTime,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    return res
      .status(401)
      .json({ message: 'Invalid or expired Google token' });
  }
};

module.exports = {
  initiateGoogleLogin,
  googleCallback,
  googleAuth,
};
