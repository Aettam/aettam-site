require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./db');
const auth = require('./routes/auth');
const admin = require('./routes/admin');
const chat = require('./routes/chat');

const app = express();
// Behind Caddy reverse proxy — trust the first proxy hop so rate-limiting
// and req.ip read the real client IP from X-Forwarded-For.
app.set('trust proxy', 1);
const server = http.createServer(app);

// ── WebSocket server for real-time chat ──────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws/chat' });
const chatClients = new Set();

wss.on('connection', (ws, req) => {
  // Parse session cookie from upgrade request
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const [k, v] = c.trim().split('=');
    if (k && v) cookies[k] = decodeURIComponent(v);
  });

  const sessionId = cookies.sid;
  const session = sessionId ? db.getSession(sessionId) : null;

  if (!session) {
    ws.close(4001, 'Not authenticated');
    return;
  }

  const user = db.getUserById(session.user_id);
  if (!user || user.tier === 'free') {
    ws.close(4003, 'Sanctuary access required');
    return;
  }

  ws.userId = user.id;
  ws.displayName = user.display_name;
  ws.tier = user.tier;
  chatClients.add(ws);

  // Send recent messages on connect
  const recent = db.getRecentMessages(50);
  ws.send(JSON.stringify({ type: 'history', messages: recent }));

  // Broadcast viewer count
  broadcastViewers();

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'chat' && msg.text && msg.text.trim().length > 0) {
        const text = msg.text.trim().slice(0, 500); // max 500 chars
        const saved = db.addMessage(user.id, user.display_name, text, user.tier);
        broadcast({ type: 'chat', message: saved });
      }
    } catch (e) { /* ignore malformed messages */ }
  });

  ws.on('close', () => {
    chatClients.delete(ws);
    broadcastViewers();
  });
});

function broadcast(data) {
  const json = JSON.stringify(data);
  for (const client of chatClients) {
    if (client.readyState === 1) client.send(json);
  }
}

function broadcastViewers() {
  broadcast({ type: 'viewers', count: chatClients.size });
}

// ── Express middleware ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:", "http:"],
      workerSrc: ["'self'", "blob:"],
    }
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts, try again later' } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

// Auth middleware — attaches req.user if session valid
app.use((req, res, next) => {
  const sid = req.cookies.sid;
  if (sid) {
    const session = db.getSession(sid);
    if (session) {
      req.user = db.getUserById(session.user_id);
    }
  }
  next();
});

// ── Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, auth);
app.use('/api/admin', admin);
app.use('/api/chat', apiLimiter, chat);

// Stream config endpoint (public — just returns status + title)
app.get('/api/stream', (req, res) => {
  const config = db.getStreamConfig();
  // Only send stream URL to authenticated sanctuary members
  const streamUrl = (req.user && req.user.tier !== 'free') ? config.stream_url : null;
  res.json({
    title: config.stream_title || 'AETTAM Sanctuary',
    status: config.stream_status || 'offline',
    streamUrl,
    viewers: chatClients.size,
  });
});

// Clean-URL page routes — serve the matching HTML file
const pageRoutes = {
  '/login': 'login.html',
  '/signup': 'signup.html',
  '/upgrade': 'upgrade.html',
};
for (const [route, file] of Object.entries(pageRoutes)) {
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', file)));
}

// Sanctuary page — must be logged in with sanctuary tier
app.get('/sanctuary', (req, res) => {
  if (!req.user) return res.redirect('/login');
  if (req.user.tier === 'free') return res.redirect('/upgrade');
  res.sendFile(path.join(__dirname, 'public', 'sanctuary.html'));
});

// Admin dashboard — must be admin
app.get('/admin-dashboard', (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Catch-all: serve index (landing)
app.get('*', (req, res) => {
  if (req.path.includes('.')) return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3800;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[sanctuary] Server running on port ${PORT}`);
  console.log(`[sanctuary] Admin: ${process.env.ADMIN_EMAIL || 'admin@aettam.com'}`);
});
