# TODO: AETTAM Community

**Last audited:** 2026-05-24
**Status:** All 3 projects live and active. aettam-worker has v2.0 overhaul (rate-limiting, admin auth, content/events API) uncommitted on master. aettam-site deployed Cloudflare Pages. mattea-bot v2.0.0 running as systemd service on VPS.
**Path:** naughty-alliance/{aettam-site, aettam-worker, mattea-bot}

## 🚧 BOTTLENECKS — Need from Stockton

- [ ] **Secrets for aettam-worker deployment** — RESEND_API_KEY (https://resend.com/api-keys), ADMIN_TOKEN (generate), DISCORD_WEBHOOK_URL to push to Cloudflare secret store
- [ ] **DeepSeek API key status** — Verify it's funded/active (mattea-bot uses it for oracle readings) — check at https://platform.deepseek.com/api_keys
- [ ] **Decision: Commit aettam-worker v2.0** — 606-line overhaul in src/index.js (rate-limiting, admin auth, /api/content, /api/events, /api/logs endpoints) is uncommitted on master. Commit or squash?

## 👤 Stockton's tasks

- [ ] Provide and manage Resend, DeepSeek, and Cloudflare Worker secrets
- [ ] Add custom DNS for aettam.org to GitHub Pages (currently deploying via nip.io subdomain per latest commit 38117e8)
- [ ] Verify Discord webhook for member notifications is wired and functional
- [ ] Monitor VPS mattea-bot.service systemd status; check logs if devotional posts fail

## 🤖 Claude's tasks

### aettam-site (Static HTML)
- [ ] **Task 11** — Wire reflections form to aettam-worker endpoint (swap Formspree URL) — **M**
- [ ] **Task 14** — Members directory in private.html (requires bot members.json export + Caddy proxy) — **L**
- [ ] **Task 15** — Moon phase widget (client-side lunar calc, SVG glyph) — **S**
- [ ] **Task 16** — Ritual calendar from rituals.json (12 months lunar/solar events) — **M**
- [ ] **Task 19** — Animated sigil on load (SVG stroke-dasharray animation) — **S**
- [ ] **Task 20** — /reflections archive viewer in sanctuary (Worker endpoint + feed UI) — **M**
- [ ] **Task 21** — 404.html custom error page — **S**

### aettam-worker (Cloudflare Worker)
- [ ] **Commit v2.0 overhaul** — src/index.js (606 lines, rate-limiting, admin auth, API endpoints) ready to deploy — **S**
- [ ] **Verify KV bindings** — REFLECTIONS_LOG namespace ID 43915085545c492da85135c28d421424 in wrangler.toml — **S**
- [ ] **Set up secrets** — RESEND_API_KEY, ADMIN_TOKEN, DISCORD_WEBHOOK_URL, DISCORD_INVITE_URL (README documents all 6) — **S**
- [ ] **Deploy & test end-to-end** — /reflect submissions, rate limits, admin endpoints — **M**

### mattea-bot (Discord bot on VPS)
- [ ] **Task 17** — `/oracle` slash command with 13-card deck, DeepSeek readings — **M**
- [ ] **Task 18** — `/vow` Queen-only ceremony command + Velvet Vow Holder role — **M**
- [ ] **Task 22** — Daily devotional rich EmbedBuilder + `/devotional now` command — **S**
- [ ] **Task 14 dependency** — Export members.json via HTTP server (127.0.0.1:8791) + cron every 15 min — **M**
- [ ] **Deploy to VPS** — scp bot.js + systemctl restart mattea-bot.service — **S** (each task)

## ✅ Recently shipped

- aettam-site v1.0 — public landing + password-gated sanctuary (GitHub Pages, Cloudflare CDN)
- aettam-worker initial `/reflect` + `/reflections` endpoints (2024, v1.0)
- mattea-bot v2.0.0 with discord.js 14, DeepSeek AI, hierarchy roles, decorative badges
- SEO pass: meta tags, OG cards, sitemap, robots.txt (commit d681e25)
- Visual polish round 3: wax seals, 3D tilt, parallax halo, mobile-responsive (commit 1b48abc)

## ⚠️ Memory mismatch detected

**aettam-worker status mismatch:** Memory says "v1.0 with form capture" but actual git shows v2.0 overhaul uncommitted on master with extensive API additions (src/index.js line 1–606). Major feature expansion pending commit.

**Deployment URL mismatch:** Memory references "aettam.com" but latest commit 38117e8 switched to "nip.io" subdomain. DNS for aettam.org still needs wiring per NEXT_SESSION_PROMPT.md line 41–52.

**Bot deployment assumption:** Memory states "running as systemd service" but no SSH verification done. Verify with `systemctl status mattea-bot` on 146.190.119.77.
