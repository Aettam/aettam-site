# AETTAM Sanctuary — TODO

## ✅ Done (2026-06-03)
- [x] Full Node/Express + WebSocket backend (auth, chat, admin, stream API)
- [x] SQLite database (users, sessions, messages, config)
- [x] Auth: register / login / logout / sessions (bcrypt, 30-day cookies)
- [x] 3 tiers (Seeker / Initiate / Anointed) with tier-gated stream access
- [x] Real-time chat ("The Circle") — WebSocket, persists, viewer count
- [x] Admin dashboard ("The Queen's Hand") — users, tiers, stream config, moderation
- [x] HLS.js video player (tier-gated stream URL)
- [x] AETTAM theme (gold/black, Cinzel+Inter, matches aettam.com)
- [x] Deployed live: VPS + Caddy auto-HTTPS + systemd service
- [x] MediaMTX RTMP→HLS relay running (ready for the Pi camera)
- [x] HLS wired same-origin through Caddy (/hls/*)
- [x] All flows verified working

## ⏳ Pending — needs human / next session

### Connect to aettam.com (the 2 connection steps)
- [ ] **Add DNS record:** in Cloudflare, `sanctuary.aettam.com` → A record → `24.199.123.34`
      (proxy can be on or off; if off/grey, Caddy gets its own cert instantly).
      Then on the VPS: `cat /etc/caddy/Caddyfile.aettam-pending >> /etc/caddy/Caddyfile && systemctl reload caddy`
      → sanctuary.aettam.com goes live with auto-SSL.
- [ ] **Wire the button:** aettam.com's "ENTER THE SANCTUARY" password gate → point it at
      `https://sanctuary.aettam.com` (or the nip.io URL for now). aettam.com is a Cloudflare
      Pages site — source not found locally; need the repo or Pages project to edit the button.
      (Blocked on: Cloudflare access / locating the aettam.com source.)

### Camera (tomorrow — when the Pi arrives)
- [ ] Set up the Pi per `PI-STREAMING-SETUP.md` (install ffmpeg, push RTMP)
- [ ] Flip stream to "Live" in the admin dashboard with the HLS URL
- [ ] (Before public) lock down RTMP publish with user/pass in mediamtx.yml

### Hardening (before going fully public)
- [ ] Change the admin password from the default in `.env`
- [ ] Decide payment/initiation flow (currently "request via Discord")
- [ ] Consider rate-limiting chat messages per user
