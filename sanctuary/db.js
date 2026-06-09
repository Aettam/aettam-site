require('dotenv').config();
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'sanctuary.db');

// Ensure data directory exists
require('fs').mkdirSync(path.join(__dirname, 'data'), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ── Schema ───────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    tier TEXT DEFAULT 'free' CHECK(tier IN ('free','sanctuary','vip')),
    role TEXT DEFAULT 'user' CHECK(role IN ('user','mod','admin')),
    avatar_emoji TEXT DEFAULT '🦢',
    created_at TEXT DEFAULT (datetime('now')),
    last_seen TEXT DEFAULT (datetime('now')),
    banned INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    text TEXT NOT NULL,
    tier TEXT DEFAULT 'sanctuary',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
`);

// ── Seed admin user if not exists ─────────────────────────────────────
const adminEmail = process.env.ADMIN_EMAIL || 'admin@aettam.com';
const adminPass = process.env.ADMIN_PASSWORD || 'changeme123';
const existing = sqlite.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existing) {
  const hash = bcrypt.hashSync(adminPass, 12);
  sqlite.prepare(
    'INSERT INTO users (id, email, password_hash, display_name, tier, role, avatar_emoji) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(uuidv4(), adminEmail, hash, 'AETTAM', 'vip', 'admin', '👑');
  console.log(`[db] Admin user created: ${adminEmail}`);
}

// Seed default config
const seedConfig = sqlite.prepare('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)');
seedConfig.run('stream_url', process.env.STREAM_URL || '');
seedConfig.run('stream_title', process.env.STREAM_TITLE || 'AETTAM Sanctuary Live');
seedConfig.run('stream_status', process.env.STREAM_STATUS || 'offline');
seedConfig.run('welcome_message', 'Welcome to the Sanctuary. Be kind, be real. 🦢');

// ── Prepared statements ──────────────────────────────────────────────
const stmts = {
  getUserByEmail: sqlite.prepare('SELECT * FROM users WHERE email = ?'),
  getUserById: sqlite.prepare('SELECT * FROM users WHERE id = ?'),
  createUser: sqlite.prepare('INSERT INTO users (id, email, password_hash, display_name, tier, avatar_emoji) VALUES (?, ?, ?, ?, ?, ?)'),
  updateTier: sqlite.prepare('UPDATE users SET tier = ? WHERE id = ?'),
  updateRole: sqlite.prepare('UPDATE users SET role = ? WHERE id = ?'),
  banUser: sqlite.prepare('UPDATE users SET banned = ? WHERE id = ?'),
  updateLastSeen: sqlite.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?"),
  listUsers: sqlite.prepare('SELECT id, email, display_name, tier, role, avatar_emoji, created_at, last_seen, banned FROM users ORDER BY created_at DESC'),
  userCount: sqlite.prepare('SELECT COUNT(*) as count FROM users'),
  tierCount: sqlite.prepare('SELECT tier, COUNT(*) as count FROM users GROUP BY tier'),

  createSession: sqlite.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'),
  getSession: sqlite.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')"),
  deleteSession: sqlite.prepare('DELETE FROM sessions WHERE id = ?'),
  deleteExpiredSessions: sqlite.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')"),
  deleteUserSessions: sqlite.prepare('DELETE FROM sessions WHERE user_id = ?'),

  addMessage: sqlite.prepare('INSERT INTO messages (user_id, display_name, text, tier) VALUES (?, ?, ?, ?)'),
  getRecentMessages: sqlite.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT ?'),
  deleteMessage: sqlite.prepare('DELETE FROM messages WHERE id = ?'),
  clearChat: sqlite.prepare('DELETE FROM messages'),

  getConfig: sqlite.prepare('SELECT value FROM config WHERE key = ?'),
  setConfig: sqlite.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)'),
};

// ── Exports ──────────────────────────────────────────────────────────
module.exports = {
  getUserByEmail(email) { return stmts.getUserByEmail.get(email); },
  getUserById(id) { return stmts.getUserById.get(id); },

  createUser(email, password, displayName, tier = 'free') {
    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 12);
    const emoji = ['🦢','🌸','✨','💜','🎨','🌙','🦋','🔮'][Math.floor(Math.random() * 8)];
    stmts.createUser.run(id, email, hash, displayName, tier, emoji);
    return { id, email, display_name: displayName, tier, avatar_emoji: emoji };
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  },

  createSession(userId) {
    const id = uuidv4();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    stmts.createSession.run(id, userId, expires);
    stmts.updateLastSeen.run(userId);
    return id;
  },

  getSession(id) { return stmts.getSession.get(id); },
  deleteSession(id) { stmts.deleteSession.run(id); },

  addMessage(userId, displayName, text, tier) {
    const info = stmts.addMessage.run(userId, displayName, text, tier);
    return {
      id: info.lastInsertRowid,
      user_id: userId,
      display_name: displayName,
      text,
      tier,
      created_at: new Date().toISOString(),
    };
  },

  getRecentMessages(limit = 50) {
    return stmts.getRecentMessages.all(limit).reverse();
  },

  deleteMessage(id) { stmts.deleteMessage.run(id); },
  clearChat() { stmts.clearChat.run(); },

  // Admin
  listUsers() { return stmts.listUsers.all(); },
  updateTier(id, tier) { stmts.updateTier.run(tier, id); },
  updateRole(id, role) { stmts.updateRole.run(role, id); },
  banUser(id, banned) { stmts.banUser.run(banned ? 1 : 0, id); },
  getUserStats() {
    return {
      total: stmts.userCount.get().count,
      byTier: stmts.tierCount.all(),
    };
  },

  // Config
  getStreamConfig() {
    return {
      stream_url: stmts.getConfig.get('stream_url')?.value || '',
      stream_title: stmts.getConfig.get('stream_title')?.value || 'AETTAM Sanctuary Live',
      stream_status: stmts.getConfig.get('stream_status')?.value || 'offline',
      welcome_message: stmts.getConfig.get('welcome_message')?.value || '',
    };
  },
  setConfig(key, value) { stmts.setConfig.run(key, value); },

  // Cleanup
  cleanExpiredSessions() { stmts.deleteExpiredSessions.run(); },
};

// Clean expired sessions every hour
setInterval(() => module.exports.cleanExpiredSessions(), 60 * 60 * 1000);
