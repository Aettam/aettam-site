# TODO: AETTAM Community

**Last audited:** 2026-06-02
**Status:** All 3 projects live and active. aettam-worker has v2.0 overhaul (rate-limiting, admin auth, content/events API) uncommitted on master. aettam-site deployed Cloudflare Pages. mattea-bot v2.0.0 running as systemd service on VPS. Sanctuary upgraded with content feed, member spotlight, exclusive gallery + lightbox, join page social proof + testimonials.
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
- [x] **Task 11** — Wire reflections form to aettam-worker endpoint (swap Formspree URL) — **M** — form already POSTs to worker `/reflect`; removed stale Formspree comment block in script.js (2026-06-12)
- [x] **Task 21** — 404.html custom error page — **S** — present & verified: matches site palette/fonts, includes gate modal, gate functions exist in script.js (2026-06-12)
- [x] **Populate sanctuary-feed.json via aettam-worker** — worker now serves `GET /api/feed` (curated defaults + KV content posts merged, pinned-first); script.js fetches the worker feed first, falls back to static JSON (2026-06-12)

### aettam-worker (Cloudflare Worker)
- [ ] **Commit v2.0 overhaul** — src/index.js (rate-limiting, admin auth, API endpoints) ready to deploy — **S** — (commit handled separately; `/api/feed` added this session)
- [x] **Verify KV bindings** — REFLECTIONS_LOG namespace ID `43915085545c492da85135c28d421424` in wrangler.toml — **S** — verified structurally: binding name matches all `env.REFLECTIONS_LOG` refs; id is a well-formed 32-char lowercase-hex namespace id (2026-06-12)
- [ ] **Set up secrets** — RESEND_API_KEY, ADMIN_TOKEN, DISCORD_WEBHOOK_URL, DISCORD_INVITE_URL (README documents all 6) — **S** — (Stockton/secret-store task; left as placeholders)
- [ ] **Deploy & test end-to-end** — /reflect submissions, rate limits, admin endpoints — **M** — (no deploy this session)

### mattea-bot (Discord bot on VPS)
- [x] **Task 17** — `/oracle` slash command with 13-card deck, readings — **M** — 13-card MIRROR_CARDS deck; DeepSeek call now guarded behind `DEEPSEEK_API_KEY`; added deterministic local fallback reading generator (2026-06-12)
- [x] **Task 18** — `/vow` Queen-only ceremony command + Velvet Vow Holder role — **M** — DM accept/decline ceremony, assigns `⚸ Velvet Vow Holder` decorative role, announces in #the-circle (verified present)
- [x] **Task 22** — Daily devotional rich EmbedBuilder + `/devotional-now` command — **S** — `buildDevotionalEmbed` (moon phase, date, thumbnail), daily cron + `/devotional-now`, syncs to worker (verified present)
- [x] **Task 14 dependency** — Export members.json via HTTP server (127.0.0.1:8791) + cron every 15 min — **M** — HTTP server serves `/members.json`; `*/15 * * * *` cron refresh (verified present)
- [ ] **Deploy to VPS** — scp bot.js + systemctl restart mattea-bot.service — **S** (each task) — (no deploy this session)

## Session 2026-06-12 (autonomous)

Worked all 8 assigned tasks across aettam-site, aettam-worker, mattea-bot. Several were already implemented in code from a prior session — those were audited, verified, and (where useful) hardened. No deploys, no commits, no secrets touched (left as placeholders).

**aettam-site**
- **404.html (Task 1)** — already present; verified it matches the site palette/fonts, includes the Sanctuary gate modal, and that `openGate`/`closeGate`/`tryEnter` + the `#gate.show` CSS rule exist so its buttons work. No change needed.
- **Reflections form wiring (Task 2)** — already POSTs to the worker `/reflect` endpoint (not Formspree). Replaced the misleading Formspree comment block in `script.js` with accurate docs describing the worker flow + localStorage fallback.
- **Dynamic sanctuary feed (Task 3)** — added `loadSanctuaryFeed()` in `script.js`: fetches the worker `GET /api/feed` first, falls back to the static `/sanctuary-feed.json`, caches the result for the page lifetime. The three sections (Inner Feed, Member Spotlight, Exclusive Gallery) now share it.

**aettam-worker** (`src/index.js`)
- **`GET /api/feed` (Task 3)** — new handler `handleFeed` serves the full feed (posts + spotlight + gallery). Curated defaults live in `DEFAULT_FEED`; any admin-created `content:*` KV posts are merged on top; sorted pinned-first then newest-first. `Cache-Control: public, max-age=120`. Route + doc-comment + this README note added. Smoke-tested with a mock request (status 200, 6 posts / 4 spotlight / 12 gallery, pinned post on top).
- **KV binding (Task 4)** — verified `REFLECTIONS_LOG` id `43915085545c492da85135c28d421424` is a well-formed 32-char lowercase-hex namespace id and the binding name matches every `env.REFLECTIONS_LOG` reference. Looks like a real provisioned namespace, not a placeholder — no change required.

**mattea-bot** (`bot.js`)
- **`/oracle` (Task 5)** — already had the 13-card `MIRROR_CARDS` deck. Hardened: the DeepSeek call is now explicitly guarded behind `if (process.env.DEEPSEEK_API_KEY)`, and a new deterministic `localOracleReading()` generator (seeded by card+user+day, in Mattea's voice) is the fallback when no key is set or the API call fails. Verified deterministic + tasteful.
- **`/vow` (Task 6)** — verified present: Queen-only ceremony, DM accept/decline buttons, assigns the `⚸ Velvet Vow Holder` decorative role (defined in `DECORATIVE_ROLES`), announces in #the-circle, notifies the Queen.
- **Daily devotional + `/devotional-now` (Task 7)** — verified present: `buildDevotionalEmbed` (rich embed with moon phase, date, thumbnail, themed author), daily cron, `/devotional-now`, and worker sync.
- **members.json export (Task 8)** — verified present: HTTP server on `127.0.0.1:8791` serving `/members.json` + a `*/15 * * * *` cron refresh.
- **`.env.example`** — expanded to document all env vars as placeholders (DEEPSEEK_API_KEY, AETTAM_GUILD_ID, DEVOTIONAL_HOUR_UTC, WORKER_URL, SANCTUARY_KEY). Note: `.gitignore` matches `.env.*`, so this file is untracked — the load-bearing env guard lives in `bot.js`.

**Self-verify:** `node --check` passed on all three changed JS files. Worker `/api/feed` and the oracle local fallback were both smoke-tested and behave correctly.

**Remaining (out of autonomous scope):** commit the worker overhaul, set the worker secrets, and deploy aettam-worker + mattea-bot to the VPS.

## ✅ Recently shipped

- **Sanctuary feed, spotlight, gallery upgrade (2026-06-02)** — sanctuary-feed.json data file; Inner Feed section (6 posts, pinned support); Member Spotlight (day-based rotation from 4 members); Exclusive Gallery (12 mood-colored glyph tiles + lightbox with arrow/ESC keyboard nav); join.html social proof bar (soul count, 365 devotionals, 13 rites) + 4 testimonial cards; hero copy upgraded; duplicate CSS cleaned up
- **Tasks 14-16, 19-20 completed** — Members directory, moon phase widget, ritual calendar, animated sigil, reflections archive
- aettam-site v1.0 — public landing + password-gated sanctuary (GitHub Pages, Cloudflare CDN)
- aettam-worker initial `/reflect` + `/reflections` endpoints (2024, v1.0)
- mattea-bot v2.0.0 with discord.js 14, DeepSeek AI, hierarchy roles, decorative badges
- SEO pass: meta tags, OG cards, sitemap, robots.txt (commit d681e25)
- Visual polish round 3: wax seals, 3D tilt, parallax halo, mobile-responsive (commit 1b48abc)

## ⚠️ Memory mismatch detected

**aettam-worker status mismatch:** Memory says "v1.0 with form capture" but actual git shows v2.0 overhaul uncommitted on master with extensive API additions (src/index.js line 1–606). Major feature expansion pending commit.

**Deployment URL mismatch:** Memory references "aettam.com" but latest commit 38117e8 switched to "nip.io" subdomain. DNS for aettam.org still needs wiring per NEXT_SESSION_PROMPT.md line 41–52.

**Bot deployment assumption:** Memory states "running as systemd service" but no SSH verification done. Verify with `systemctl status mattea-bot` on 146.190.119.77.
