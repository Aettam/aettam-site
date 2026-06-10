# Sanctuary Livestream — Review Branch

This branch (`sanctuary-livestream`) adds a **live video + real-time chat + member
accounts** system in the new `sanctuary/` folder. It does NOT change any existing
files on `main` — it's purely additive, here for review.

## What's already on `main` (the current Sanctuary)
The existing Sanctuary on aettam.com is a **password-gated static page**:

| Piece | File | What it does |
|-------|------|--------------|
| Gate | `index.html` "ENTER THE SANCTUARY" button → `openGate('sanctuary')` | Opens a password modal |
| Password | `script.js` → `SANCTUARY_PASSWORD = "goldandflame"` | Client-side check, shared in Discord |
| Members page | `private.html` | Queen's letters, Oath Wall, reflections, moon calendar |
| Backend | Cloudflare Worker (`workerBase`, `X-Sanctuary-Key`) | Stores reflections + oaths |

**It cannot do:** live video, real user accounts, real-time chat, paid tiers.

## What this branch adds (`sanctuary/` folder)
A full Node.js app that delivers the **"watch the Queen live + talk to her"** experience:

| Capability | How |
|------------|-----|
| Live video stream | HLS player, fed by a Raspberry Pi camera → MediaMTX relay on the VPS |
| Real accounts | register / login / sessions (bcrypt, SQLite) |
| Real-time chat ("The Circle") | WebSocket, persists, live viewer count |
| Membership tiers | Seeker (free) / Initiate (full access) / Anointed (VIP) |
| Admin dashboard | manage members, grant tiers, set the stream live, moderate chat |
| Theme | matches aettam.com exactly (gold #c9a227 / black #07080a, Cinzel + Inter) |

## How they fit together
- The existing `private.html` = the **written** inner temple (letters, oaths).
- The new `sanctuary/` app = the **live** inner temple (the Queen on camera + the Circle).
- Both are "the Sanctuary," gated to members.

## To connect them (not done on this branch — for review first)
The "ENTER THE SANCTUARY" button in `index.html` (and the gate in `script.js`)
could, after the password, offer two doors: **"The Letters"** (`private.html`,
existing) and **"The Live Temple"** (`https://sanctuary.aettam.com`, this app).
Or the button can link straight to the livestream login.

## Where the live app runs
- **Live now:** https://sanctuary.24-199-123-34.nip.io (VPS, auto-HTTPS)
- **Target:** https://sanctuary.aettam.com (needs one DNS record → 24.199.123.34;
  Caddy is already configured and waiting)
- Admin: `/admin-dashboard` · see `sanctuary/README.md` for the login + full docs
- Camera setup for the Pi: `sanctuary/PI-STREAMING-SETUP.md`

## Not included in git (by design)
`node_modules/`, the SQLite `data/`, and `.env` (secrets) are gitignored.
`sanctuary/.env.example` shows the config shape.
