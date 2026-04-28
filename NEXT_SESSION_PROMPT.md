# Aettam — Continuation Prompt
## Open in: D:\Claw empire

---

You're picking up the Aettam project — a mystical/spiritual community site (We Are All Mattea) with a public landing page, password-gated members sanctuary, a Discord bot deployed on a VPS, and a Cloudflare Pages deployment.

---

## What's already built and live

**Site:** https://aettam-site.pages.dev (Cloudflare Pages, auto-deploys from main of GitHub repo Aettam/aettam-site)
**GitHub repo:** Aettam/aettam-site (private; PAT embedded in local git remote — `git push` just works)
**Discord bot:** systemd service `mattea-bot.service` on DigitalOcean droplet 146.190.119.77
- SSH: `ssh -i ~/.ssh/claw_empire_do root@146.190.119.77`
- Bot client ID: 1495789159686606908
- Aettam Server Discord invite: https://discord.gg/XSAKtNHKEG

---

## Project layout

```
D:\Claw empire\
├── aettam-site\             ← static website
│   ├── index.html           ← public landing
│   ├── private.html         ← password-gated sanctuary
│   ├── styles.css
│   ├── script.js            ← password gate, mirror card, sigil gen, ambient audio
│   ├── og-card.svg          ← 1200x630 OG image
│   └── favicon.svg          ← gold sigil on black
├── mattea-bot\              ← Discord bot (also at /opt/mattea-bot on VPS)
│   ├── bot.js               ← discord.js + DeepSeek, "Mattea-the-Queen" persona
│   ├── package.json
│   └── .env                 ← DISCORD_TOKEN, DEEPSEEK_API_KEY (do not commit)
└── CLAW_EMPIRE_CREDENTIALS.md  ← VPS SSH details (do not display, do not commit)
```

---

## Completed tasks (do NOT redo these)

- **Task 1** — Cloudflare Web Analytics beacon in both HTML files (token: 458ad40920b94fe29baba9dc8fb90cb5)
- **Task 2** — Daily Mirror Card section (between Manifesto and Rituals), rotates by UTC date, 13-card deck
- **Task 3** — Sigil Generator ("Receive Your Sigil"), deterministic 3-glyph hash from name input, copy + save CTA
- **Task 4** — Full SEO: refined meta description, OG tags, Twitter card, canonical, favicon.svg, og-card.svg
- **Task 5** — Ambient audio toggle (fixed bottom-right button, Tone.js CDN, two detuned sines at 110/110.3Hz, localStorage persist)
- **Task 6** — "The Short Version" elevator-pitch section above the fold (between hero and manifesto)
- **Task 7** — Discord invite https://discord.gg/XSAKtNHKEG wired into private.html button and index.html footer
- **All placeholder copy replaced** — gallery transformed to 8 named sacred image cards, devotionals rewritten, circle posts rewritten, resources rewritten with Discord channel callouts
- **Gender-inclusive language throughout** — members are anyone who carries Mattea in spirit, not literally women only; "X · MATTEA" member format used in circle feed

---

## Deployment workflow

**Site changes:**
```bash
cd "D:/Claw empire/aettam-site" && git add . && git commit -m "..." && git push
```
Cloudflare auto-rebuilds in ~30s. Do not change the remote URL. Do not commit .env.

**Bot changes:**
```bash
scp -i ~/.ssh/claw_empire_do "D:/Claw empire/mattea-bot/bot.js" root@146.190.119.77:/opt/mattea-bot/bot.js
ssh -i ~/.ssh/claw_empire_do root@146.190.119.77 'systemctl restart mattea-bot'
```

---

## Tech stack constraints

- Pure HTML/CSS/JS only for the site. Tailwind via CDN, custom CSS in styles.css. No build step.
- Aesthetic: dark, gold, forest, violet. Fonts: Cinzel (display), Cormorant Garamond (body), Inter (sans). Luxury cult — sex-positive, commanding, never cheesy.
- Mobile-responsive required.
- Bot: Node 22, ESM, discord.js v14, OpenAI SDK pointed at DeepSeek (baseURL: https://api.deepseek.com)

---

## REMAINING TASKS — do these in order

### Task 11 — Reflections form → Cloudflare Worker + Resend email

Replace Formspree with a Cloudflare Worker that:
1. Receives form POSTs from the Reflections modal on index.html
2. Sends a beautiful welcome email (via Resend free tier) to the visitor containing: manifesto pull-quote, their personal sigil (generated from email using the same hash as the sigil generator), the Discord invite https://discord.gg/XSAKtNHKEG, and a "She knows you now" closer
3. Relays a plain summary to firstbloodanivia@gmail.com
4. Logs to Cloudflare KV

**Steps:**
- Create `D:\Claw empire\aettam-worker\` with wrangler.toml, src/index.js, package.json. `npm install -D wrangler`.
- Single endpoint `POST /reflect`. CORS allow-list `aettam-site.pages.dev`.
- Bind KV namespace `REFLECTIONS_LOG`. Secrets: `RESEND_API_KEY`, `OWNER_EMAIL`, `DISCORD_INVITE_URL`.
- Worker logic: validate, generate sigil from email (same hash as sigil generator in script.js), send 2 emails via Resend, log to KV, return `{ ok: true }`.
- In script.js, swap `REFLECTIONS_ENDPOINT` from `https://formspree.io/f/mvzdjzpk` to the Worker URL.
- At session start, ask user: "Sign up free at https://resend.com → create an API key → paste it here."
- `wrangler deploy`. Test end-to-end with a real submission.

---

### Task 14 — Members Directory in Sanctuary (private.html)

New section in private.html called "The Circle" — avatars + display names + personal sigils for all members of Aettam Server with the Mattea role (role name contains the fleur-de-lis glyph).

**Architecture:**
- Extend `mattea-bot\bot.js`: every 15 min via node-cron, fetch guild members, filter to Mattea role, write members.json with `{ displayName, avatarURL, sigil, joinedAt, honorRoles }`. Generate sigil from member ID using same hash as sigil generator.
- Run a tiny http server inside the bot, bound to `127.0.0.1:8791`, serving members.json with permissive CORS.
- VPS Caddy reverse-proxy: edit `/etc/caddy/Caddyfile`, add path-based proxy `/aettam-members` pointing to `127.0.0.1:8791/members.json` under the existing `146-190-119-77.sslip.io` site. `Cache-Control: public, max-age=300`. `systemctl reload caddy`.
- private.html: new section between Devotional and Circle. Fetch JSON on load. Grid of cards (avatar + display name in Cormorant + sigil in gold). Hover glow. Empty state: "The circle keeps no center because every center is holy."

**Privacy:** never expose user IDs, real usernames, or emails. Display names + avatar URLs + sigil only.

Deploy bot via scp+systemctl. Verify `systemctl status mattea-bot` is active after restart. `curl https://146-190-119-77.sslip.io/aettam-members` should return JSON.

---

### Task 15 — Moon Phase Widget (index.html + private.html)

Live moon phase in the header/hero area, calculated client-side (no API needed — standard lunar cycle math).

- Display: phase name ("Waning Gibbous"), illumination %, and an SVG moon glyph that visually renders the correct phase (crescent, half, gibbous, full, new).
- On index.html: subtle gold glyph + phase name in the hero subtitle line, under the tagline.
- On private.html: larger moon widget in the sanctuary header with "The moon carries her light" caption.
- Purely client-side JS. No external API. Use a known reference new moon epoch + 29.53059 day cycle.
- Style: gold on dark, Cinzel for phase name, no borders — integrate with existing aesthetic.

---

### Task 16 — Ritual Calendar (private.html)

A members-only calendar section in private.html showing upcoming ritual events.

- Data source: a `rituals.json` file committed to the repo. Array of `{ date, title, description, type }` where type is one of: `new-moon`, `full-moon`, `solstice`, `equinox`, `custom`.
- Populate with the next 12 months of lunar and solar events pre-calculated.
- private.html: new "Upcoming Rites" section. Card per event, sorted chronologically, moon/sun icon by type, date in Cinzel, description in Cormorant. Past events fade/gray out client-side.
- Queen (Mattea) should be able to add custom events by editing rituals.json and pushing — no admin UI needed.

---

### Task 17 — Mattea Bot: `/oracle` Slash Command

New Discord slash command `/oracle [question]` — Mattea draws a card from the 13-card mirror deck and delivers a reading.

- Command: `/oracle` (question optional). Mattea picks a card deterministically from the current UTC date + user ID hash (same day = same card per user), or randomly if a question is provided.
- Response: EmbedBuilder card with card name in gold title, Mattea's 2–3 sentence reading in DeepSeek (system prompt: Mattea giving a tarot-style oracle reading, commanding and mystical, never cheesy), card symbol as thumbnail.
- The 13 cards are already defined in script.js — extract that deck into a shared `deck.js` module imported by bot.js.
- Rate-limit: one reading per user per day (track in a simple in-memory Map, reset at midnight UTC via node-cron).

---

### Task 18 — Mattea Bot: `/vow` Slash Command + Velvet Vow ceremony

Private ceremony command for the Queen to use in DM or private channel.

- `/vow @member` — Queen-only command (gated to QUEEN role). Sends the target member a DM with the Velvet Vow text (write something appropriately ceremonial), a ✅ Accept and ❌ Decline button.
- On Accept: bot assigns the `⚚ Velvet Vow Holder` decorative role to the member, posts a brief ceremony announcement in `#the-circle` ("A vow was sealed tonight. ⛤"), DMs the member their personal sigil (generated from member ID, same hash).
- On Decline: bot DMs the Queen only — "The vow was declined." No public post.
- Log accepted vows to a `vows.json` on the VPS (append-only, `{ memberId (hashed), date }`). Never log real IDs.

---

### Task 19 — Animated Sigil on Load (index.html)

The favicon/sigil SVG in the hero section animates on first page load — a draw-on effect where the sigil strokes appear to be drawn in gold.

- Use SVG `stroke-dasharray` / `stroke-dashoffset` CSS animation. No JS required beyond adding a class.
- Duration: ~2.5s, ease-in-out, plays once on load. No repeat.
- Also apply a subtle gold pulse glow on the hero sigil (already present in hero) using `filter: drop-shadow` keyframe animation that runs on loop, slow (8s cycle), barely perceptible.
- Must not impact LCP or CLS scores. Use `will-change: transform` and `prefers-reduced-motion` media query to disable for accessibility.

---

### Task 20 — `/reflect` Submissions Archive in private.html

The Cloudflare Worker (Task 11) logs reflections to KV. Expose a read-only view of recent submissions in the Sanctuary.

- Add a new Cloudflare Worker endpoint `GET /reflections` that reads the last 20 entries from KV (no email addresses — only first name, message, and timestamp). Protected by a static secret header `X-Sanctuary-Key` (store in Worker secret).
- private.html: new "The Mirror Speaks Back" section. On load, fetch from Worker with key in header. Display as a scrolling feed of submission cards: first name in Cinzel gold, message in Cormorant italic, relative timestamp. Newest first.
- Empty state: "No reflections yet. The mirror waits."
- Key is hardcoded in private.html (it's already password-gated, acceptable security posture).

---

### Task 21 — Custom 404 Page (Cloudflare Pages)

Cloudflare Pages supports a `404.html` file at the root.

- Create `404.html` — same dark/gold aesthetic. Centered layout. Large sigil. Headline: "You have wandered beyond the threshold." Subtext: "Some doors are not for everyone." Two buttons: "Return to Aettam" (→ index.html) and "Enter the Sanctuary" (→ private.html).
- Match fonts, colors, and ambient audio toggle from index.html.
- No nav bar. Full-screen centered layout.

---

### Task 22 — Mattea Bot: Daily Devotional improvement

The existing daily devotional posts a message at a configurable UTC hour. Upgrade it.

- Instead of plain text, post as a rich EmbedBuilder: gold sidebar color, "Daily Devotional" title in small caps style, Mattea's message as description, footer: current moon phase + date, thumbnail: one of 4–5 rotating sigil/symbol URLs (committed to repo as static assets, served via Cloudflare Pages).
- Add a `DEVOTIONAL_CHANNEL_ID` env var (currently it finds the channel by name — replace with ID lookup, more robust).
- Add `/devotional now` slash command (Queen-only) to trigger a devotional immediately without waiting for the cron. Useful for testing and special occasions.

---

## Rules

- Every change committed and pushed; verify auto-deploy on Cloudflare
- Do not modify global git config
- Do not commit .env files or display credential file contents in chat
- Do not refactor beyond what the tasks require
- Aesthetic stays cohesive — dark, gold, mystical, Cinzel/Cormorant
- Gender-inclusive throughout — members carry Mattea in spirit, not literally women only
- Start by asking for Resend API key before building Task 11

⛤
