# CONTINUE PROMPT — AETTAM Sanctuary (for Claude Fable 5.0)

Paste this whole file as your first message. You are picking up a **working,
deployed** members-only livestream platform and taking it to the next level.
Be ambitious. Build big. Ship end-to-end. Don't stop at "good enough."

---

## 0. Who you are / how to work
- The owner is a 28-year-old realtor with **zero coding knowledge**. Explain
  everything in plain, no-jargon, explain-like-I'm-15 language — every response.
- This is an **adult/creator** project for the AETTAM order. The "Queen" is the
  model **Mattea**. **Anonymity rule: stage names only, never real names** anywhere
  in code, commits, or UI.
- Do the work **end-to-end**. Don't hand back homework you could do yourself.
  Commit + push your work. Verify before claiming done.
- Read the auto-loaded memory first: `project_aettam_sanctuary.md`,
  `infrastructure_vps_map.md`, `credentials_vps_passwords.md`.

## 1. What this is
A live video + real-time chat + member-accounts platform: members watch Mattea
live (a Raspberry Pi camera in her room) and talk to her in real time ("The Circle").
It complements the existing aettam.com static "Sanctuary" (`private.html` — the
Queen's letters + Oath Wall). This app is the **live** temple.

## 2. Current state — IT WORKS, IT'S LIVE
- **Live:** https://sanctuary.24-199-123-34.nip.io (auto-HTTPS)
- **Admin:** `/admin-dashboard` — login `admin@aettam.com` / password in
  `/opt/sanctuary/.env` on the VPS (also in memory `credentials_vps_passwords.md`)
- **Verified working:** signup, login, sessions, logout, 3 tiers
  (Seeker/Initiate/Anointed), tier-gated stream, real-time WebSocket chat
  (persists + viewer count), full admin (users/tiers/stream/moderation).
- **Theme:** matches aettam.com exactly — gold `#c9a227` on black `#07080a`,
  cream text `#ede7d6`, Cinzel headings + Inter body. Mystical order language.

## 3. Where everything lives (so you don't get blocked)
| Thing | Where |
|---|---|
| Code (local) | `D:\Claw Empire\sanctuary` (git repo, branch `master`) |
| Code (deployed) | VPS `/opt/sanctuary`, systemd service `sanctuary`, port 3800 (localhost) |
| VPS | `ssh root@24.199.123.34` (key already authorized) = naughty-alliance-prod, DigitalOcean SFO3, 4 vCPU / 8 GB |
| Stream relay | docker `sanctuary-stream` (MediaMTX): RTMP `:1935` (public), HLS `:8888` (local) → Caddy `/hls/*` |
| Reverse proxy | Caddy `/etc/caddy/Caddyfile` (auto-HTTPS). aettam.com block waiting at `/etc/caddy/Caddyfile.aettam-pending` |
| GitHub | `Aettam/aettam-site`, branch `sanctuary-livestream`, PR #1 (the app is in the `sanctuary/` folder there) |
| Pi camera setup | `PI-STREAMING-SETUP.md` |

**Deploy a change:** edit locally → `scp <file> root@24.199.123.34:/opt/sanctuary/...`
→ `ssh root@24.199.123.34 "systemctl restart sanctuary"`. Logs: `tail -f /var/log/sanctuary.log`.

**Push to GitHub:** the repo is Mattea's account. `gh auth switch --user Aettam`
before pushing, then `gh auth switch --user stocktonsassistant-web` after. Push to
a branch, never her `main` — open/append a PR.

## 4. Known gotchas (learned the hard way — don't repeat these)
- `db.js` must `require('dotenv').config()` itself (else admin seeds with the wrong pw).
- `app.set('trust proxy', 1)` is required (Caddy sends X-Forwarded-For).
- **Never `head file > samefile`** — it truncates to empty. Use a `/tmp` intermediary.
  Always `caddy validate` before `systemctl reload caddy`. Backups: `/etc/caddy/Caddyfile.bak-*`.
- Video looks black ONLY in the automation/test browser (media decode is disabled there).
  The player is correct — it works in real browsers.

---

## 5. YOUR MISSION — make it massive. Build in this order.

### PHASE 1 — Bulletproof the foundation (do first, it's quick)
1. **`/health` endpoint** in `server.js` returning `{ ok: true, uptime }`, then point
   an uptime monitor at it (Uptime Kuma may already be on the VPS — check) so a crash
   pages the owner.
2. **Dedicated private GitHub repo** for the app itself (`gh repo create` under
   stocktonsassistant-web), push it, so there's a real off-machine backup + history.
3. **Automated tests** (add a `test` script): "free Seeker can't reach the stream,"
   "wrong password rejected," "banned user can't chat," "non-admin can't hit /api/admin/*."
4. **Deploy + rollback script** (`deploy.sh`, `rollback.sh`) so a bad update mid-stream
   is undone in one command, and write it into the README.
5. **Lock down RTMP** — set `publishUser`/`publishPass` in `mediamtx.yml` so randoms
   can't hijack the stream. Rotate the admin password off the default.

### PHASE 2 — Connect to aettam.com (the owner has been waiting on this)
1. **DNS:** `sanctuary.aettam.com` → `24.199.123.34` (Cloudflare). If you can get a
   Cloudflare API token (ask the owner — they made DigitalOcean ones the same way),
   do it via API. Then on the VPS:
   `cat /etc/caddy/Caddyfile.aettam-pending >> /etc/caddy/Caddyfile && caddy validate ... && systemctl reload caddy`.
2. **Wire the "ENTER THE SANCTUARY" button** (in `Aettam/aettam-site`, `index.html` +
   `script.js` `openGate`/`SANCTUARY_PASSWORD`). After the password, offer two doors:
   **"The Letters"** (`private.html`, existing) and **"The Live Temple"**
   (`https://sanctuary.aettam.com`). Or single sign-on between them.

### PHASE 3 — Make it a real product (go BIG here)
- **💰 Payments (Stripe):** real paid memberships. Initiate = monthly sub, Anointed =
  premium. Webhook auto-grants/revokes the tier. This turns the project into revenue.
- **🎁 Live tributes/tipping:** viewers send "gold" during the stream → on-screen
  alert + chat highlight + leaderboard ("Top Patrons"). Huge for a creator stream.
- **🔔 "She's going live" notifications:** email + web-push (PWA) + Discord webhook the
  moment the admin flips the stream live. Add a stream **schedule/countdown** on the page.
- **📼 VOD archive:** record each stream (MediaMTX can), list past rites for members to rewatch.
- **💬 Chat 2.0:** emotes/reactions, slow mode, pin a message, polls, timeouts/bans from
  the chat UI, a highlighted **"The Queen speaks"** style, and member-to-Queen whispers.
- **⛤ Member identity:** pull the **sigil generator** the static site already has
  (3 glyphs from your name) into profiles; badges, avatars, devotion streaks, a live
  **"souls who crossed"** count.
- **👑 The Anointing:** an admin action that publicly anoints a member in the Circle
  (matches the existing AETTAM lore) — upgrades them to Anointed with a ceremony message.
- **📿 Bring the Oath Wall into the app** so the written + live temples share one members system.
- **📱 Installable PWA** with offline shell + push notifications.
- **📊 Admin analytics:** concurrent viewers over time, revenue, retention, top chatters,
  one-click broadcast announcement to all members.

### PHASE 4 — Scale & harden
- Adaptive-bitrate HLS (multiple qualities) so phones don't buffer; consider a CDN in
  front of HLS if viewers grow. Load-test concurrent WebSocket + HLS.
- Security pass: CSP review, rate-limit chat per-user, session rotation, secrets audit,
  age-gate/ToS for the adult context. Accessibility pass.

---

## 6. Definition of done for each thing you build
Deployed to the VPS, tested in a real flow (not just code), committed + pushed to the
branch/PR, and explained to the owner in plain language with the live URL to click.
Track new ideas/blockers in `TODO.md`. Update the memory file when state changes.

**Now: read the memory + `README.md` + `TODO.md`, confirm the live site is up
(`curl https://sanctuary.24-199-123-34.nip.io/`), then start Phase 1 and keep going.**
