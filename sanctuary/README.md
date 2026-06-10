# AETTAM Sanctuary — Livestream + Chat + Members

The Inner Temple of the Order. A members-only live stream of the Queen (Mattea)
with real-time chat ("The Circle"), accounts, tiers, and an admin dashboard.

## Live URLs
- **Public:** https://sanctuary.24-199-123-34.nip.io
  (will become https://sanctuary.aettam.com once DNS is pointed — Caddy vhost already configured)
- **Admin dashboard:** /admin-dashboard

## Admin login
- Email: `admin@aettam.com`
- Password: in the server `.env` (`ADMIN_PASSWORD`)

## Stack
- **Backend:** Node.js + Express + `ws` (WebSocket chat) + better-sqlite3
- **Frontend:** vanilla HTML/CSS/JS, HLS.js video player
- **Reverse proxy:** Caddy (auto-HTTPS) on naughty-alliance-prod VPS (24.199.123.34)
- **Process:** systemd service `sanctuary` (auto-restart, survives reboots)
- **Port:** 3800 (bound to 127.0.0.1, fronted by Caddy)

## Tiers
| Tier | Name | Access |
|------|------|--------|
| free | Seeker | Account only — no stream/chat |
| sanctuary | Initiate | Full stream + Circle chat + Oath Wall |
| vip | Anointed | Initiate + VIP badge + priority |

The admin grants tiers from the dashboard (or change them via the API).

## Pages
- `/` — landing (The Sanctuary)
- `/login` — Speak the Word
- `/signup` — Take the Oath
- `/upgrade` — Initiation (tier request)
- `/sanctuary` — the Inner Temple (stream + Circle) — Initiate+ only
- `/admin-dashboard` — The Queen's Hand (admin) — admin only

## API
- `POST /api/auth/register` `{email, password, displayName}`
- `POST /api/auth/login` `{email, password}`
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `GET  /api/stream` — stream status (URL only sent to Initiate+)
- `WS   /ws/chat` — real-time Circle chat (Initiate+ only)
- `GET  /api/admin/stats` — admin
- `GET  /api/admin/users` — admin
- `PUT  /api/admin/users/:id/tier` `{tier}` — admin
- `PUT  /api/admin/users/:id/role` `{role}` — admin
- `PUT  /api/admin/users/:id/ban` `{banned}` — admin
- `PUT  /api/admin/stream` `{stream_url, stream_title, stream_status, welcome_message}` — admin
- `DELETE /api/admin/chat` — clear chat — admin

## Deploy / manage
```bash
ssh root@24.199.123.34
cd /opt/sanctuary
systemctl restart sanctuary     # restart
journalctl -u sanctuary -f      # logs (or tail -f /var/log/sanctuary.log)
```

To redeploy frontend: `scp public/* root@24.199.123.34:/opt/sanctuary/public/`
To redeploy backend: `scp server.js db.js routes/* root@...` then `systemctl restart sanctuary`

## Streaming (the Raspberry Pi → the stream)
See `PI-STREAMING-SETUP.md` for the full camera setup.
