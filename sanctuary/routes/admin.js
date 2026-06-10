const express = require('express');
const router = express.Router();
const db = require('../db');

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

router.use(requireAdmin);

// GET /api/admin/users — list all users
router.get('/users', (req, res) => {
  res.json({ users: db.listUsers() });
});

// GET /api/admin/stats — dashboard stats
router.get('/stats', (req, res) => {
  const stats = db.getUserStats();
  const config = db.getStreamConfig();
  res.json({ ...stats, stream: config });
});

// PUT /api/admin/users/:id/tier — change user tier
router.put('/users/:id/tier', (req, res) => {
  const { tier } = req.body;
  if (!['free', 'sanctuary', 'vip'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }
  db.updateTier(req.params.id, tier);
  res.json({ ok: true });
});

// PUT /api/admin/users/:id/role — change user role
router.put('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['user', 'mod', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  db.updateRole(req.params.id, role);
  res.json({ ok: true });
});

// PUT /api/admin/users/:id/ban — ban/unban user
router.put('/users/:id/ban', (req, res) => {
  const { banned } = req.body;
  db.banUser(req.params.id, !!banned);
  res.json({ ok: true });
});

// PUT /api/admin/stream — update stream config
router.put('/stream', (req, res) => {
  const { stream_url, stream_title, stream_status, welcome_message } = req.body;
  if (stream_url !== undefined) db.setConfig('stream_url', stream_url);
  if (stream_title !== undefined) db.setConfig('stream_title', stream_title);
  if (stream_status !== undefined) db.setConfig('stream_status', stream_status);
  if (welcome_message !== undefined) db.setConfig('welcome_message', welcome_message);
  res.json({ ok: true, config: db.getStreamConfig() });
});

// DELETE /api/admin/chat — clear all chat messages
router.delete('/chat', (req, res) => {
  db.clearChat();
  res.json({ ok: true });
});

// DELETE /api/admin/chat/:id — delete single message
router.delete('/chat/:id', (req, res) => {
  db.deleteMessage(parseInt(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
