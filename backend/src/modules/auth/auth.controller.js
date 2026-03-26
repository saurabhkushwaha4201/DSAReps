const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');

/**
 * Generate backend JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const upsertGoogleUser = async ({ googleId, email, name, avatar }) => {
  const existingUser = await User.findOne({ googleId });

  if (!existingUser) {
    return User.create({
      googleId,
      email,
      name,
      avatar,
    });
  }

  const shouldUpdate =
    existingUser.email !== email ||
    existingUser.name !== name ||
    existingUser.avatar !== avatar;

  if (!shouldUpdate) {
    return existingUser;
  }

  existingUser.email = email;
  existingUser.name = name;
  existingUser.avatar = avatar;
  await existingUser.save();

  return existingUser;
};

/**
 * Create OAuth client per request (IMPORTANT)
 */
const getRequestOrigin = (req) => {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol || 'https';
  const host = forwardedHost || req.get('host');
  return `${protocol}://${host}`;
};

const resolveCallbackUrl = (req) => {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  return `${getRequestOrigin(req)}/api/auth/google/callback`;
};

const createOAuthClient = (callbackUrl) => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl
  );
};

/**
 * GET /auth/google
 * Initiates Google OAuth (used by extension + optional web redirect flow)
 */
const initiateGoogleLogin = (req, res) => {
  const source = req.query.source || 'web';
  const redirectUri = req.query.redirect_uri || null;

  const callbackUrl = resolveCallbackUrl(req);
  const oauthClient = createOAuthClient(callbackUrl);
  console.log('HIT /auth/google');

  const authorizeUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: JSON.stringify({ source, redirectUri }),
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
    const callbackUrl = resolveCallbackUrl(req);
    const oauthClient = createOAuthClient(callbackUrl);

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

    // Find, create, or refresh user profile fields
    const user = await upsertGoogleUser({ googleId, email, name, avatar });

    // Generate backend JWT
    const token = generateToken(user);
    console.log('[Backend] JWT Generated');

    // Parse source safely
    let source = 'web';
    let redirectUri = null;
    try {
      const parsedState = JSON.parse(state);
      source = parsedState.source || 'web';
      redirectUri = parsedState.redirectUri || null;
    } catch {
      // ignore invalid state
      console.warn('[Backend] Could not parse state JSON');
    }

    console.log('[Backend] Auth Source:', source);

    // Extension flow
    if (source === "extension") {
      // Prefer the dynamic redirect_uri sent by the extension (chrome.identity.getRedirectURL)
      // so the backend doesn't need a hardcoded EXTENSION_ID env var.
      // Validate it is a chromiumapp.org URL to prevent open-redirect attacks.
      let finalRedirectBase = `https://${process.env.EXTENSION_ID}.chromiumapp.org/`;
      if (redirectUri) {
        try {
          const parsed = new URL(redirectUri);
          if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.chromiumapp.org')) {
            finalRedirectBase = redirectUri;
          } else {
            console.warn('[Backend] Untrusted redirect_uri ignored:', redirectUri);
          }
        } catch {
          console.warn('[Backend] Invalid redirect_uri, falling back to env EXTENSION_ID');
        }
      }

      const sep = finalRedirectBase.includes('?') ? '&' : '?';
      return res.redirect(`${finalRedirectBase}${sep}token=${token}`);
    }






    // Default web fallback
    const webUrl = process.env.DASHBOARD_URL || 'http://localhost:5175';
    console.log('[Backend] Redirecting to Web Login');
    return res.redirect(
      `${webUrl}/login?token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    const webUrl = process.env.DASHBOARD_URL || 'http://localhost:5175';
    return res.redirect(
      `${webUrl}/login?error=auth_failed`
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
    const oauthClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID
      );

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

    // Find, create, or refresh user profile fields
    const user = await upsertGoogleUser({ googleId, email, name, avatar });

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
