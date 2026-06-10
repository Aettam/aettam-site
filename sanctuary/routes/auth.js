const express = require('express');
const router = express.Router();
const db = require('../db');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
};

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (displayName.length > 30) {
    return res.status(400).json({ error: 'Display name too long (max 30 chars)' });
  }

  const existing = db.getUserByEmail(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  try {
    const user = db.createUser(email.toLowerCase(), password, displayName.trim(), 'free');
    const sessionId = db.createSession(user.id);
    res.cookie('sid', sessionId, COOKIE_OPTS);
    res.json({
      user: { id: user.id, email: user.email, displayName: user.display_name, tier: user.tier, avatar: user.avatar_emoji }
    });
  } catch (err) {
    console.error('[auth] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email.toLowerCase());
  if (!user || !db.verifyPassword(user, password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.banned) {
    return res.status(403).json({ error: 'This account has been suspended' });
  }

  const sessionId = db.createSession(user.id);
  res.cookie('sid', sessionId, COOKIE_OPTS);
  res.json({
    user: { id: user.id, email: user.email, displayName: user.display_name, tier: user.tier, role: user.role, avatar: user.avatar_emoji }
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const sid = req.cookies.sid;
  if (sid) db.deleteSession(sid);
  res.clearCookie('sid', { path: '/' });
  res.json({ ok: true });
});

// GET /api/auth/me — check current session
router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.display_name,
      tier: req.user.tier,
      role: req.user.role,
      avatar: req.user.avatar_emoji,
    }
  });
});

module.exports = router;
