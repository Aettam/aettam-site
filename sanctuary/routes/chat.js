const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/chat/messages — get recent messages (fallback for non-WS clients)
router.get('/messages', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  const messages = db.getRecentMessages(50);
  res.json({ messages });
});

// GET /api/chat/config — get chat welcome message
router.get('/config', (req, res) => {
  const config = db.getStreamConfig();
  res.json({ welcome_message: config.welcome_message });
});

module.exports = router;
