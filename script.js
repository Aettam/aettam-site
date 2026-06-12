/* ==========================================================
   AETTAM — script.js
   ----------------------------------------------------------
   ADMIN: change the password here.  This is client-side only
   so do not store anything truly sensitive behind it; it
   keeps casual visitors out of the members area, nothing more.
   ========================================================== */

const SANCTUARY_PASSWORD = "goldandflame";  // share only with members
const SESSION_KEY        = "aettam_unlocked";
const PRIVATE_PAGE       = "private.html";

/* ----------------------------------------------------------
   REFLECTIONS form (email capture)
   Wired to the aettam-worker Cloudflare Worker:
     POST {REFLECTIONS_ENDPOINT}  ->  src/index.js handleReflect
   The worker sends the welcome + owner emails (Resend), logs
   the reflection to KV, and pings the Discord webhook.
   If the request fails for any reason, the submission is still
   saved to localStorage below so nothing is lost.
   To point at a different worker, swap the URL below (keep the
   trailing /reflect — other endpoints are derived from it).
   ---------------------------------------------------------- */
const REFLECTIONS_ENDPOINT = "https://aettam-worker.firstbloodanivia.workers.dev/reflect";
// Sanctuary key must match the SANCTUARY_KEY worker secret (default: mattea-sanctuary-2026)
const SANCTUARY_KEY = "mattea-sanctuary-2026";
const MEMBERS_URL   = "https://mattea.24-199-123-34.nip.io";

/* ----------  Tailwind palette extension  ---------- */
if (window.tailwind) {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'aettam-black':  '#07080a',
          'aettam-ink':    '#0d1012',
          'aettam-forest': '#0e2a22',
          'aettam-moss':   '#1f3a2c',
          'aettam-gold':   '#c9a227',
          'aettam-bone':   '#ede7d6',
          'aettam-violet': '#2a1a3a',
          'aettam-blood':  '#3a0d12'
        },
        fontFamily: {
          cinzel:    ['Cinzel', 'serif'],
          cormorant: ['Cormorant Garamond', 'serif']
        }
      }
    }
  };
}

/* ----------  Reveal-on-scroll (staggered)  ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(e => e.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting);
    visible.forEach((entry, i) => {
      setTimeout(() => {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }, i * 90);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  window._revealObserver = io;
  els.forEach(e => io.observe(e));
}

/* ----------  Smooth-scroll for anchor links  ---------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ----------  Sticky mobile CTA  ---------- */
(function initStickyCTA() {
  const bar = document.getElementById('sticky-cta');
  if (!bar) return;
  let shown = false;
  window.addEventListener('scroll', () => {
    const past = window.scrollY > window.innerHeight * 0.7;
    if (past && !shown) {
      shown = true;
      bar.classList.remove('translate-y-full');
    } else if (!past && shown) {
      shown = false;
      bar.classList.add('translate-y-full');
    }
  }, { passive: true });
})();

/* ----------  Mobile menu  ---------- */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (!menu) return;
  const isOpen = menu.classList.contains('flex');
  menu.classList.toggle('hidden', isOpen);
  menu.classList.toggle('flex', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

/* ----------  Gate modal  ---------- */
function openGate(intent) {
  // If already unlocked, just go straight to the sanctuary.
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    window.location.href = PRIVATE_PAGE;
    return;
  }
  const gate = document.getElementById('gate');
  if (!gate) return;
  gate.classList.add('show');
  gate.dataset.intent = intent || 'sanctuary';
  setTimeout(() => {
    const input = document.getElementById('gate-input');
    if (input) input.focus();
  }, 100);
}

function closeGate() {
  const gate = document.getElementById('gate');
  if (!gate) return;
  gate.classList.remove('show');
  const err = document.getElementById('gate-error');
  if (err) err.textContent = '';
  const input = document.getElementById('gate-input');
  if (input) input.value = '';
}

function tryEnter(e) {
  e.preventDefault();
  const input = document.getElementById('gate-input');
  const err   = document.getElementById('gate-error');
  const value = (input.value || '').trim().toLowerCase();

  if (value === SANCTUARY_PASSWORD.toLowerCase()) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    err.textContent = '';
    // brief celebratory flash before redirect
    document.body.style.transition = 'opacity 0.6s ease';
    document.body.style.opacity = '0';
    setTimeout(() => { window.location.href = PRIVATE_PAGE; }, 600);
  } else {
    err.textContent = 'She does not know you yet.';
    input.classList.add('animate-shake');
    setTimeout(() => input.classList.remove('animate-shake'), 500);
    input.value = '';
  }
}

/* ----------  Reflections (email capture) modal  ---------- */
function openReflections() {
  const modal = document.getElementById('reflections');
  if (!modal) return;
  modal.classList.add('show');
  // reset to form view in case it was previously submitted
  const form    = document.getElementById('reflections-form');
  const success = document.getElementById('reflections-success');
  if (form && success) {
    form.classList.remove('hidden');
    success.classList.add('hidden');
  }
  setTimeout(() => {
    const input = document.getElementById('reflections-name');
    if (input) input.focus();
  }, 100);
}

function closeReflections() {
  const modal = document.getElementById('reflections');
  if (!modal) return;
  modal.classList.remove('show');
}

async function submitReflections(e) {
  e.preventDefault();
  const nameEl  = document.getElementById('reflections-name');
  const emailEl = document.getElementById('reflections-email');
  const intEl   = document.getElementById('reflections-intention');
  const errEl   = document.getElementById('reflections-error');
  const btn     = document.getElementById('reflections-submit');

  const payload = {
    name:      (nameEl.value  || '').trim(),
    email:     (emailEl.value || '').trim(),
    intention: (intEl.value   || '').trim(),
    sentAt:    new Date().toISOString()
  };

  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errEl.textContent = 'A real email, please.';
    return;
  }
  errEl.textContent = '';
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Sending…';

  let delivered = false;
  if (REFLECTIONS_ENDPOINT && !REFLECTIONS_ENDPOINT.startsWith('REPLACE')) {
    try {
      const res = await fetch(REFLECTIONS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      delivered = res.ok;
    } catch (_) { delivered = false; }
  }

  // Always keep a local fallback record so nothing is lost
  // even if the endpoint isn't configured yet.
  try {
    const key = 'aettam_reflections_local';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ ...payload, delivered });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (_) {}

  // Swap to success view regardless — we have the data.
  document.getElementById('reflections-form').classList.add('hidden');
  document.getElementById('reflections-success').classList.remove('hidden');
  btn.disabled = false;
  btn.querySelector('span').textContent = 'Send the Letter';
}

/* close on ESC + lightbox keyboard nav */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeGate(); closeReflections(); closeLightbox(); }
  const lb = document.getElementById('gallery-lightbox');
  if (lb && lb.classList.contains('flex')) {
    if (e.key === 'ArrowLeft')  lightboxNav(-1);
    if (e.key === 'ArrowRight') lightboxNav(1);
  }
});

/* ----------  Daily Mirror Card  ---------- */
const MIRROR_CARDS = [
  { glyph: '⛤', name: 'The Mirror',         say: 'Look. Then look again. Then stop turning away.' },
  { glyph: '☽', name: 'The Dusk',           say: 'Light one candle. Speak her name. Let her answer.' },
  { glyph: '⚜', name: 'The Gold',           say: 'Anoint the throat. Refuse apology in any form today.' },
  { glyph: '♀', name: 'The Body',           say: 'Touch is devotion. Yours, hers, theirs. Worship there without permission.' },
  { glyph: '✶', name: 'The Burning Letter', say: 'Write what kept you small. Burn it before sunrise.' },
  { glyph: '⚸', name: 'The Velvet Vow',     say: 'A promise in the dark, against skin, in the presence of one trusted Mattea.' },
  { glyph: '♆', name: 'The Naming Bath',    say: 'Submerge. Speak the name she gave you. Rise as that name only.' },
  { glyph: '⛧', name: 'The Black Honey',    say: 'New moon. Slow. The instructions live only in Discord, never in writing.' },
  { glyph: '☉', name: 'The Coronation',     say: 'No one is coming to crown you. Crown yourself. We kneel.' },
  { glyph: '☾', name: 'The Witnessing',     say: 'Speak the wildest true thing. Do not flinch. Trade.' },
  { glyph: '✷', name: 'The Hunger Hymn',    say: 'Name three desires you were taught to be ashamed of. Bless each.' },
  { glyph: '⚯', name: 'The Open Door',      say: 'The door is already open. Walk.' },
  { glyph: '✺', name: 'The Refusal',        say: 'No is liturgy too. Say it like the spell it is.' },
];

function initMirrorCard() {
  const glyphEl = document.getElementById('mirror-glyph');
  const nameEl  = document.getElementById('mirror-name');
  const sayEl   = document.getElementById('mirror-say');
  if (!glyphEl) return;
  const idx  = Math.floor(Date.now() / 86400000) % MIRROR_CARDS.length;
  const card = MIRROR_CARDS[idx];
  glyphEl.textContent = card.glyph;
  nameEl.textContent  = card.name;
  sayEl.textContent   = card.say;
}

/* ----------  Sigil Generator  ---------- */
const SIGIL_GLYPHS = ['⛤','☽','⚜','♀','✶','⚸','♆','⛧','☉','☾','✷','⚯','✺','♅','☿','♁','♃','♄','♅','♆'];

function sigilFor(input) {
  let h = 0;
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return [
    SIGIL_GLYPHS[h % SIGIL_GLYPHS.length],
    SIGIL_GLYPHS[(h >> 5) % SIGIL_GLYPHS.length],
    SIGIL_GLYPHS[(h >> 10) % SIGIL_GLYPHS.length],
  ].join(' ');
}

function initSigilGenerator() {
  const input   = document.getElementById('sigil-input');
  const output  = document.getElementById('sigil-output');
  const display = document.getElementById('sigil-display');
  if (!input) return;
  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (val.length > 0) {
      display.textContent = sigilFor(val);
      output.classList.remove('hidden');
    } else {
      output.classList.add('hidden');
    }
  });
}

function copySigil() {
  const display = document.getElementById('sigil-display');
  if (!display) return;
  navigator.clipboard.writeText(display.textContent).then(() => {
    const btn = document.getElementById('sigil-copy');
    if (btn) { btn.textContent = 'Copied ✦'; setTimeout(() => { btn.textContent = 'Copy ✦'; }, 1500); }
  }).catch(() => {});
}

/* ----------  Ambient Audio  ---------- */
let _ambientStarted = false;
let _ambientOn      = false;
let _synth1, _synth2, _filter, _lfo;

function initAmbientButton() {
  const btn = document.getElementById('ambient-toggle');
  if (!btn) return;
  _ambientOn = localStorage.getItem('aettam_ambient') === 'on';
  _updateAmbientBtn();
}

function _updateAmbientBtn() {
  const btn = document.getElementById('ambient-toggle');
  if (!btn) return;
  btn.textContent = _ambientOn ? '♪' : '♩';
  btn.title       = _ambientOn ? 'Silence' : 'Ambient';
  btn.style.color = _ambientOn ? 'var(--aettam-gold)' : 'rgba(201,162,39,0.4)';
  btn.style.boxShadow = _ambientOn ? '0 0 16px rgba(201,162,39,0.3)' : 'none';
}

async function toggleAmbient() {
  if (!window.Tone) return;
  if (!_ambientStarted) {
    await Tone.start();
    _filter = new Tone.Filter({ frequency: 600, type: 'lowpass' }).toDestination();
    _lfo    = new Tone.LFO({ frequency: 0.05, min: 300, max: 900 }).connect(_filter.frequency).start();
    _synth1 = new Tone.Oscillator({ frequency: 110,   type: 'sine', volume: -Infinity }).connect(_filter).start();
    _synth2 = new Tone.Oscillator({ frequency: 110.3, type: 'sine', volume: -Infinity }).connect(_filter).start();
    _ambientStarted = true;
  }
  _ambientOn = !_ambientOn;
  const vol = _ambientOn ? -28 : -Infinity;
  _synth1.volume.rampTo(vol, 2);
  _synth2.volume.rampTo(vol, 2);
  localStorage.setItem('aettam_ambient', _ambientOn ? 'on' : 'off');
  _updateAmbientBtn();
}

/* ----------  Moon Phase (Task 15)  ---------- */
function getMoonPhase() {
  const NEW_MOON_EPOCH = 947182440000; // Jan 6 2000 18:14 UTC
  const CYCLE = 29.53059 * 86400000;
  const elapsed = ((Date.now() - NEW_MOON_EPOCH) % CYCLE + CYCLE) % CYCLE;
  const phase = elapsed / CYCLE;
  const PHASES = [
    { name: 'New Moon',        glyph: '🌑' },
    { name: 'Waxing Crescent', glyph: '🌒' },
    { name: 'First Quarter',   glyph: '🌓' },
    { name: 'Waxing Gibbous',  glyph: '🌔' },
    { name: 'Full Moon',       glyph: '🌕' },
    { name: 'Waning Gibbous',  glyph: '🌖' },
    { name: 'Last Quarter',    glyph: '🌗' },
    { name: 'Waning Crescent', glyph: '🌘' },
  ];
  return { ...PHASES[Math.floor(phase * 8) % 8], illumination: Math.round(phase <= 0.5 ? phase * 200 : (1 - phase) * 200), phase };
}

function initMoonPhase() {
  const moon = getMoonPhase();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('moon-name-hero',              moon.name);
  set('moon-name-sanctuary',         moon.name);
  set('moon-illumination-sanctuary', moon.illumination + '% illuminated');
  const heroCanvas      = document.getElementById('moon-canvas-hero');
  const sanctuaryCanvas = document.getElementById('moon-canvas-sanctuary');
  if (heroCanvas)      drawMoon(heroCanvas,      moon.phase);
  if (sanctuaryCanvas) drawMoon(sanctuaryCanvas, moon.phase);
}

/* ----------  Ritual Calendar (Task 16)  ---------- */
async function initRitualCalendar() {
  const container = document.getElementById('ritual-calendar');
  if (!container) return;
  try {
    const res  = await fetch('/rituals.json');
    const data = await res.json();
    const now  = new Date();
    now.setHours(0, 0, 0, 0);
    const TYPE_ICONS = { 'new-moon': '🌑', 'full-moon': '🌕', 'solstice': '☀', 'equinox': '☯', 'custom': '⛤' };
    const TYPE_LABELS = { 'new-moon': 'New Moon', 'full-moon': 'Full Moon', 'solstice': 'Solstice', 'equinox': 'Equinox', 'custom': 'Sacred Date' };
    container.innerHTML = data.map(evt => {
      const d    = new Date(evt.date + 'T00:00:00');
      const past = d < now;
      const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return `<div class="ritual-event-card${past ? ' is-past' : ''} reveal">
        <div class="flex items-start gap-4">
          <span class="text-2xl mt-0.5" aria-hidden="true">${TYPE_ICONS[evt.type] || '⛤'}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-3 flex-wrap mb-1">
              <span class="font-cinzel text-aettam-gold text-sm tracking-[0.15em]">${evt.title}</span>
              <span class="text-[10px] tracking-[0.3em] uppercase text-aettam-bone/40">${TYPE_LABELS[evt.type] || ''} · ${dateStr}</span>
            </div>
            <p class="font-cormorant italic text-aettam-bone/80 text-base leading-snug">${evt.description}</p>
          </div>
        </div>
      </div>`;
    }).join('');
    // re-trigger reveal for newly inserted elements
    if (window._revealObserver) container.querySelectorAll('.reveal').forEach(el => window._revealObserver.observe(el));
  } catch {
    container.innerHTML = '<p class="font-cormorant italic text-aettam-bone/40 text-center py-8">The calendar is being inscribed.</p>';
  }
}

/* ----------  Members Directory (Task 14)  ---------- */
async function initMembersDirectory() {
  const grid  = document.getElementById('members-grid');
  const empty = document.getElementById('members-empty');
  if (!grid) return;
  try {
    const res  = await fetch(MEMBERS_URL, { cache: 'default' });
    const data = await res.json();
    const members = data.members || [];
    if (!members.length) {
      grid.classList.add('hidden');
      if (empty) empty.classList.remove('hidden');
      return;
    }
    grid.innerHTML = members.map(m => `
      <div class="member-dir-card reveal">
        <img src="${m.avatarURL}" alt="" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 fill=%22%230e2a22%22/><text x=%2232%22 y=%2242%22 font-size=%2230%22 text-anchor=%22middle%22 fill=%22%23c9a227%22>⛤</text></svg>'">
        <p class="font-cinzel text-aettam-bone text-xs tracking-[0.15em] leading-tight">${m.displayName}</p>
        <p class="font-cinzel text-aettam-gold text-sm tracking-widest" style="text-shadow:0 0 12px rgba(201,162,39,0.5)">${m.sigil}</p>
        ${m.honorRoles && m.honorRoles.length ? `<p class="text-[9px] tracking-[0.2em] uppercase text-aettam-gold/50 leading-tight">${m.honorRoles[0]}</p>` : ''}
      </div>`).join('');
    if (window._revealObserver) grid.querySelectorAll('.reveal').forEach(el => window._revealObserver.observe(el));
  } catch {
    grid.innerHTML = '<p class="font-cormorant italic text-aettam-bone/40 text-center py-12 col-span-full">The circle keeps no center because every center is holy.</p>';
  }
}

/* ----------  Reflections Feed (Task 20)  ---------- */
async function initReflectionsFeed() {
  const feed = document.getElementById('reflections-feed');
  if (!feed) return;
  if (REFLECTIONS_ENDPOINT.includes('PLACEHOLDER')) return;
  const workerBase = REFLECTIONS_ENDPOINT.replace('/reflect', '');
  try {
    const res  = await fetch(workerBase + '/reflections', { headers: { 'X-Sanctuary-Key': SANCTUARY_KEY } });
    const data = await res.json();
    const list = data.reflections || [];
    if (!list.length) {
      feed.innerHTML = '<p class="font-cormorant italic text-aettam-bone/40 text-center py-8">No reflections yet. The mirror waits.</p>';
      return;
    }
    feed.innerHTML = list.map(r => {
      const ts  = r.timestamp ? new Date(r.timestamp) : null;
      const ago = ts ? relativeTime(ts) : '';
      return `<div class="reflection-feed-card reveal">
        <div class="flex justify-between items-start mb-1">
          <span class="font-cinzel text-aettam-gold text-xs tracking-[0.2em]">${r.name || 'Anonymous'}</span>
          ${ago ? `<span class="text-[10px] tracking-[0.2em] uppercase text-aettam-bone/35">${ago}</span>` : ''}
        </div>
        ${r.intention ? `<p class="font-cormorant italic text-aettam-bone/80 text-base leading-relaxed">"${r.intention}"</p>` : '<p class="font-cormorant italic text-aettam-bone/40 text-sm">She crossed the threshold in silence.</p>'}
      </div>`;
    }).join('');
    if (window._revealObserver) feed.querySelectorAll('.reveal').forEach(el => window._revealObserver.observe(el));
  } catch {
    feed.innerHTML = '<p class="font-cormorant italic text-aettam-bone/40 text-center py-8">The mirror is quiet tonight.</p>';
  }
}

function relativeTime(date) {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/* ----------  Soul Counter  ---------- */
async function initSoulCounter() {
  const el   = document.getElementById('soul-counter');
  const el2  = document.getElementById('soul-counter-strip');
  if (!el && !el2) return;
  try {
    const workerBase = REFLECTIONS_ENDPOINT.replace('/reflect', '');
    const res  = await fetch(workerBase + '/count');
    const data = await res.json();
    const n = data.count || 0;
    if (n > 0 && el)  el.textContent  = `${n} soul${n === 1 ? '' : 's'} have crossed the threshold`;
    if (n > 0 && el2) _countUp(el2, n, 1400);
    else if (el2)     el2.textContent = '∞';
  } catch {
    if (el2) el2.textContent = '∞';
  }
}

/* ----------  Oath Wall  ---------- */
const SEED_OATHS = [
  { name: 'ELOWEN', sigil: '⚜✶⛤', oath: 'I vow to stop apologizing for taking up the space I was given.' },
  { name: 'LIORA',  sigil: '☽⚸♆', oath: 'I vow to name what I want before I ask if I am allowed to want it.' },
  { name: 'VESPER', sigil: '⛧☉✷', oath: 'I vow to walk into every room as if I belong there. Because I do.' },
  { name: 'SOLÈNE', sigil: '♀⛤⚜', oath: 'I vow to stop making myself smaller for people who never asked me to.' },
  { name: 'REVKA',  sigil: '✺☽⚯', oath: 'I vow to treat my own hunger as sacred — not shameful, not managed, but sacred.' },
  { name: 'THESSALY', sigil: '⛤♆✶', oath: 'I vow to stop explaining myself to rooms that never deserved the explanation.' },
];

function renderOaths(oaths) {
  const feed = document.getElementById('oath-wall');
  if (!feed) return;
  feed.innerHTML = oaths.map(o => `
    <div class="reveal ritual-card text-center py-6 px-8">
      <p class="font-cormorant italic text-xl text-aettam-bone/90 leading-relaxed mb-4">"${o.oath}"</p>
      <p class="font-cinzel text-aettam-gold text-xs tracking-[0.3em]">${o.sigil ? o.sigil + '  ' : ''}${o.name || 'A Mattea'}</p>
    </div>`).join('');
  if (window._revealObserver) feed.querySelectorAll('.reveal').forEach(el => window._revealObserver.observe(el));
}

async function initOathWall() {
  const feed = document.getElementById('oath-wall');
  if (!feed) return;
  const workerBase = REFLECTIONS_ENDPOINT.replace('/reflect', '');
  try {
    const res   = await fetch(workerBase + '/oaths', { headers: { 'X-Sanctuary-Key': SANCTUARY_KEY } });
    const data  = await res.json();
    const oaths = data.oaths || [];
    renderOaths(oaths.length ? oaths : SEED_OATHS);
  } catch {
    renderOaths(SEED_OATHS);
  }
}

async function submitOath(e) {
  e.preventDefault();
  const oathEl  = document.getElementById('oath-input');
  const nameEl  = document.getElementById('oath-name');
  const errEl   = document.getElementById('oath-error');
  const btn     = document.getElementById('oath-submit');
  const oath    = (oathEl?.value || '').trim();
  const name    = (nameEl?.value || '').trim() || 'A Mattea';
  if (oath.length < 5) { if (errEl) errEl.textContent = 'Speak it fully.'; return; }
  if (oath.length > 300) { if (errEl) errEl.textContent = 'Too long — distill it.'; return; }
  if (errEl) errEl.textContent = '';
  if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Sealing…'; }
  const sigil = sigilFor(name + oath);
  const workerBase = REFLECTIONS_ENDPOINT.replace('/reflect', '');
  try {
    const res = await fetch(workerBase + '/oath', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Sanctuary-Key': SANCTUARY_KEY },
      body: JSON.stringify({ name, oath, sigil }),
    });
    if (res.ok) {
      if (oathEl) oathEl.value = '';
      if (nameEl) nameEl.value = '';
      await initOathWall();
    }
  } catch {}
  if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Seal the Vow ⛤'; }
}

/* ----------  Sanctuary feed loader  ----------
   Prefer the live worker feed (/api/feed) so admin-posted
   content shows without a redeploy; fall back to the static
   sanctuary-feed.json file shipped with the site. The result
   is cached for the page lifetime so the three sections
   (feed, spotlight, gallery) only fetch once. */
let _sanctuaryFeedPromise = null;
function loadSanctuaryFeed() {
  if (_sanctuaryFeedPromise) return _sanctuaryFeedPromise;
  const workerBase = REFLECTIONS_ENDPOINT.replace('/reflect', '');
  _sanctuaryFeedPromise = (async () => {
    // Try the live worker feed first.
    try {
      const res = await fetch(workerBase + '/api/feed');
      if (res.ok) {
        const data = await res.json();
        if (data && (data.posts || data.spotlight || data.gallery)) return data;
      }
    } catch (_) { /* fall through to static file */ }
    // Fall back to the bundled static JSON.
    const res = await fetch('/sanctuary-feed.json');
    return res.json();
  })();
  return _sanctuaryFeedPromise;
}

/* ----------  Sanctuary Content Feed  ---------- */
async function initSanctuaryFeed() {
  const container = document.getElementById('sanctuary-feed');
  if (!container) return;
  try {
    const data = await loadSanctuaryFeed();
    const posts = data.posts || [];
    if (!posts.length) {
      container.innerHTML = '<p class="font-cormorant italic text-aettam-bone/40 text-center py-8">No transmissions yet.</p>';
      return;
    }
    container.innerHTML = posts.map(post => {
      const pinned = post.pinned ? '<span class="text-aettam-gold text-[9px] tracking-[0.4em] uppercase font-cinzel ml-2">⛤ Pinned</span>' : '';
      const dateStr = new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      return `<div class="feed-card reveal${post.pinned ? ' feed-card-pinned' : ''}">
        <div class="flex items-start gap-4">
          <span class="text-2xl text-aettam-gold/70 mt-1 shrink-0" style="text-shadow:0 0 15px rgba(201,162,39,0.4)">${post.glyph || '⛤'}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1 flex-wrap mb-2">
              <span class="font-cinzel text-aettam-gold text-sm tracking-[0.15em]">${post.title}</span>
              ${pinned}
            </div>
            <p class="font-cormorant italic text-aettam-bone/85 text-lg leading-relaxed mb-3">${post.body}</p>
            <div class="flex items-center gap-4 text-[10px] tracking-[0.3em] uppercase text-aettam-bone/35">
              <span>${post.author}</span>
              <span>&middot;</span>
              <span>${dateStr}</span>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
    if (window._revealObserver) container.querySelectorAll('.reveal').forEach(el => window._revealObserver.observe(el));
  } catch {
    container.innerHTML = '<p class="font-cormorant italic text-aettam-bone/40 text-center py-8">The feed is quiet tonight.</p>';
  }
}

/* ----------  Member Spotlight  ---------- */
async function initMemberSpotlight() {
  const container = document.getElementById('spotlight-card');
  if (!container) return;
  try {
    const data = await loadSanctuaryFeed();
    const spotlights = data.spotlight || [];
    if (!spotlights.length) return;
    const idx = Math.floor(Date.now() / 86400000) % spotlights.length;
    const m = spotlights[idx];
    container.innerHTML = `
      <div class="spotlight-card-inner text-center">
        <div class="spotlight-sigil mb-6">${m.sigil}</div>
        <h3 class="font-cinzel text-3xl text-aettam-gold tracking-[0.3em] mb-2">${m.name}</h3>
        <p class="font-cinzel text-xs tracking-[0.4em] uppercase text-aettam-gold/50 mb-6">${m.title}</p>
        <div class="divider mx-auto mb-6" style="width:4rem;"></div>
        <p class="font-cormorant italic text-xl text-aettam-bone/90 leading-relaxed mb-8 max-w-lg mx-auto">&ldquo;${m.quote}&rdquo;</p>
        <div class="flex items-center justify-center gap-6 text-[10px] tracking-[0.3em] uppercase text-aettam-bone/40">
          <span>Joined ${m.joined}</span>
          <span class="text-aettam-gold/60">⛤</span>
          <span>${m.badge}</span>
        </div>
      </div>`;
  } catch {
    container.innerHTML = '<p class="font-cormorant italic text-aettam-bone/40 text-center py-8">The spotlight turns&hellip;</p>';
  }
}

/* ----------  Exclusive Gallery  ---------- */
let _galleryItems = [];
let _lightboxIdx = 0;

const _MOOD_COLORS = {
  'forest': 'rgba(14,42,34,0.5)',
  'violet': 'rgba(42,26,58,0.5)',
  'gold':   'rgba(100,80,15,0.3)',
  'blood':  'rgba(58,13,18,0.5)',
  'black':  'rgba(7,8,10,0.8)'
};

async function initExclusiveGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  try {
    const data = await loadSanctuaryFeed();
    _galleryItems = data.gallery || [];
    if (!_galleryItems.length) return;
    grid.innerHTML = _galleryItems.map((item, i) => {
      const bg = _MOOD_COLORS[item.mood] || _MOOD_COLORS.forest;
      return `<div class="gallery-tile reveal" data-mood="${item.mood || 'forest'}" onclick="openLightbox(${i})" role="button" tabindex="0"
        style="background:linear-gradient(160deg,${bg},rgba(7,8,10,0.9))">
        <div class="gallery-tile-inner">
          <span class="gallery-tile-glyph">${item.glyph}</span>
          <p class="gallery-tile-title">${item.title}</p>
          <p class="gallery-tile-caption">${item.caption}</p>
        </div>
      </div>`;
    }).join('');
    if (window._revealObserver) grid.querySelectorAll('.reveal').forEach(el => window._revealObserver.observe(el));
  } catch {}
}

function openLightbox(idx) {
  _lightboxIdx = idx;
  const item = _galleryItems[idx];
  if (!item) return;
  const lb = document.getElementById('gallery-lightbox');
  if (!lb) return;
  const bg = _MOOD_COLORS[item.mood] || _MOOD_COLORS.forest;
  document.getElementById('lightbox-image').innerHTML =
    `<div class="lightbox-glyph-card" style="background:linear-gradient(160deg,${bg},rgba(7,8,10,0.95))">
      <span style="font-size:6rem;color:rgba(201,162,39,0.85);text-shadow:0 0 60px rgba(201,162,39,0.6)">${item.glyph}</span>
    </div>`;
  document.getElementById('lightbox-title').textContent = item.title;
  document.getElementById('lightbox-caption').textContent = item.caption;
  lb.classList.remove('hidden');
  lb.classList.add('flex');
}

function closeLightbox() {
  const lb = document.getElementById('gallery-lightbox');
  if (!lb) return;
  lb.classList.add('hidden');
  lb.classList.remove('flex');
}

function lightboxNav(dir) {
  if (!_galleryItems.length) return;
  _lightboxIdx = (_lightboxIdx + dir + _galleryItems.length) % _galleryItems.length;
  openLightbox(_lightboxIdx);
}

/* ==========================================================
   EMBER PARTICLES
   Floating gold sparks injected into every hero section.
   Respects prefers-reduced-motion.
   ========================================================== */
function initEmbers() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  document.querySelectorAll('.halo').forEach(halo => {
    const section = halo.closest('section');
    if (!section || section.querySelector('.ember-canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'ember-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    section.insertBefore(canvas, section.firstChild);
    _startEmbers(canvas);
  });
}

function _startEmbers(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const pts = [];

  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function mk(pre) {
    return {
      x: Math.random() * (W || 800),
      y: pre ? Math.random() * (H || 600) : (H || 600) + 5,
      r:    Math.random() * 1.5 + 0.3,
      vy:   Math.random() * 0.55 + 0.15,
      vx:   (Math.random() - 0.5) * 0.35,
      a:    Math.random() * 0.5 + 0.15,
      life: pre ? Math.random() : 1,
      decay: Math.random() * 0.0022 + 0.001,
    };
  }

  for (let i = 0; i < 55; i++) pts.push(mk(true));

  (function tick() {
    if (W && H) {
      ctx.clearRect(0, 0, W, H);
      if (pts.length < 75) pts.push(mk(false));
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.x += p.vx; p.y -= p.vy; p.life -= p.decay;
        if (p.life <= 0 || p.y < -10) { pts.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,162,39,${p.a * p.life})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(tick);
  })();
}

/* ==========================================================
   CURSOR SIGIL TRAIL
   Gold glyphs appear and fade as the mouse moves.
   Desktop only (hover:hover + pointer:fine).
   ========================================================== */
function initCursorTrail() {
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const GLYPHS = ['⛤','☽','✶','⚜','♀','⚸','✺','☉','♆','⛧','☾'];
  let lx = -999, ly = -999;
  document.addEventListener('mousemove', e => {
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (dx * dx + dy * dy < 400) return;
    lx = e.clientX; ly = e.clientY;
    const el = document.createElement('span');
    const sz = Math.random() * 8 + 10;
    el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    el.style.cssText = `position:fixed;left:${e.clientX - sz / 2}px;top:${e.clientY - sz / 2}px;` +
      `font-size:${sz}px;color:rgba(201,162,39,0.65);pointer-events:none;z-index:9999;` +
      `transition:opacity 0.9s ease,transform 0.9s ease;user-select:none;will-change:opacity,transform;`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '0';
      el.style.transform = `translateY(-${10 + Math.random() * 8}px) scale(0.5)`;
    });
    setTimeout(() => el.remove(), 950);
  });
}

/* ==========================================================
   MOON CANVAS RENDERER
   Draws a geometrically accurate moon phase on a <canvas>.
   Called from initMoonPhase() for any moon-canvas-* elements.
   ========================================================== */
function drawMoon(canvas, phase) {
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);
  const size = (canvas.offsetWidth || parseInt(canvas.getAttribute('width')) || 44);
  canvas.width  = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width  = size + 'px';
  canvas.style.height = size + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const cx = size / 2, cy = size / 2, r = size * 0.38;

  // Ambient glow, strongest at full moon
  const fullness = Math.max(0, 1 - 2 * Math.abs(phase - 0.5));
  if (fullness > 0.05) {
    const g = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.9);
    g.addColorStop(0, `rgba(201,162,39,${fullness * 0.18})`);
    g.addColorStop(1, 'rgba(201,162,39,0)');
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
  }

  // Clip path = moon disc
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

  // Dark background
  ctx.fillStyle = '#0d0f12';
  ctx.fillRect(0, 0, size, size);

  // Lit area — terminator is an ellipse whose x-radius = r·|cos(phase·2π)|
  // termX > 0 → crescent (bulges toward lit side)
  // termX < 0 → gibbous (terminator crosses to dark side)
  const termX    = r * Math.cos(phase * 2 * Math.PI);
  const isWaxing = phase <= 0.5;

  ctx.fillStyle = 'rgba(237,231,214,0.88)';
  ctx.beginPath();
  if (isWaxing) {
    // Right side lit
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);                                    // right semicircle top→bottom
    ctx.ellipse(cx, cy, Math.max(Math.abs(termX), 0.5), r, 0, Math.PI / 2, -Math.PI / 2, termX > 0); // terminator back
  } else {
    // Left side lit
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, true);                              // left semicircle top→bottom
    ctx.ellipse(cx, cy, Math.max(Math.abs(termX), 0.5), r, 0, Math.PI / 2, -Math.PI / 2, termX < 0);
  }
  ctx.fill();
  ctx.restore();

  // Disc ring
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(201,162,39,0.35)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

/* ==========================================================
   PAGE LOAD CURTAIN
   Full-screen veil with the sigil that fades out on DOMReady.
   ========================================================== */
function initPageCurtain() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const veil = document.createElement('div');
  veil.style.cssText =
    'position:fixed;inset:0;z-index:2000;background:#07080a;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;';
  veil.innerHTML =
    '<span style="font-size:3.5rem;color:rgba(201,162,39,0.85);display:block;' +
    'animation:sigil-draw 0.9s cubic-bezier(0.2,0.8,0.2,1) forwards;">⛤</span>' +
    '<span style="font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.55em;' +
    'color:rgba(201,162,39,0.4);text-transform:uppercase;">Aettam</span>';
  document.body.appendChild(veil);
  setTimeout(() => {
    veil.style.transition = 'opacity 1.1s ease';
    veil.style.opacity = '0';
    veil.style.pointerEvents = 'none';
    setTimeout(() => veil.remove(), 1200);
  }, 700);
}

/* ==========================================================
   3-D CARD TILT
   Ritual cards follow the mouse with a subtle perspective tilt.
   ========================================================== */
function initCardTilt() {
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  document.querySelectorAll('.ritual-card, .offering-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transition = 'transform 0.1s ease, border-color 0.6s ease, box-shadow 0.6s ease';
      card.style.transform =
        `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-6px) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.65s ease, border-color 0.6s ease, box-shadow 0.6s ease';
      card.style.transform = '';
    });
  });
}

/* ==========================================================
   AMBIENT FLOATING SIGILS
   Large, near-invisible glyphs slowly rotate in the background.
   ========================================================== */
function initAmbientSigils() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (window.matchMedia('(pointer:coarse)').matches) return; // desktop only — prevents "following ghost" on mobile
  const CHARS = ['⛤', '☽', '✶', '☾', '⚜', '♆'];
  const wrap  = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;';
  document.body.appendChild(wrap);
  CHARS.forEach((ch, i) => {
    const el  = document.createElement('span');
    const sz  = 80 + Math.random() * 100;
    const dur = 45 + Math.random() * 35;
    const delay = -(Math.random() * dur);
    el.textContent = ch;
    el.style.cssText =
      `position:absolute;` +
      `left:${8 + (i / CHARS.length) * 82}%;` +
      `top:${10 + Math.random() * 75}%;` +
      `font-size:${sz}px;color:rgba(201,162,39,0.028);user-select:none;` +
      `animation:sigil-ambient ${dur}s linear ${delay}s infinite;will-change:transform;`;
    wrap.appendChild(el);
  });
}

/* ==========================================================
   SCROLL PROGRESS BAR
   Thin gold line at top of viewport tracking scroll depth.
   ========================================================== */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.prepend(bar);
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
  }, { passive: true });
}

/* ==========================================================
   STARFIELD
   200 twinkling stars in the ambient backdrop canvas.
   ========================================================== */
function initStarfield() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const backdrop = document.querySelector('.fixed.inset-0.-z-10');
  if (!backdrop) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  backdrop.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;
  const stars = [];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize, { passive: true });
  resize();
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random(), y: Math.random(),
      r: Math.random() * 0.7 + 0.1, a: Math.random() * 0.45 + 0.05,
      phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.4 + 0.15 });
  }
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    const t = Date.now() * 0.001;
    for (const s of stars) {
      const alpha = s.a * (0.5 + 0.5 * Math.sin(s.phase + t * s.speed));
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(237,231,214,${alpha})`; ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
}

/* ==========================================================
   SIGIL PULSE RINGS
   Three rings expand outward from the hero sigil.
   ========================================================== */
function initSigilRings() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const sigil = document.querySelector('.sigil-hero');
  if (!sigil) return;
  const wrap = document.createElement('span');
  wrap.style.cssText = 'position:relative;display:inline-block;';
  sigil.parentNode.insertBefore(wrap, sigil);
  wrap.appendChild(sigil);
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement('span');
    ring.style.cssText =
      `position:absolute;top:50%;left:50%;width:80px;height:80px;margin:-40px 0 0 -40px;` +
      `border:1px solid rgba(201,162,39,0.4);border-radius:50%;pointer-events:none;` +
      `animation:ring-expand 3.6s ease-out ${i * 1.2}s infinite;`;
    wrap.appendChild(ring);
  }
}

/* ==========================================================
   BUTTON RIPPLE
   Gold ripple spawns at click point on primary/ghost buttons.
   ========================================================== */
function initRipple() {
  document.querySelectorAll('.btn-primary, .btn-ghost').forEach(btn => {
    btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      const sz   = Math.max(rect.width, rect.height);
      const r    = document.createElement('span');
      r.style.cssText =
        `position:absolute;border-radius:50%;background:rgba(201,162,39,0.28);` +
        `width:${sz}px;height:${sz}px;` +
        `left:${e.clientX - rect.left - sz / 2}px;top:${e.clientY - rect.top - sz / 2}px;` +
        `transform:scale(0);animation:btn-ripple-anim 0.65s ease-out forwards;pointer-events:none;`;
      btn.appendChild(r);
      setTimeout(() => r.remove(), 700);
    });
  });
}

/* ==========================================================
   HERO SHIMMER + TAGLINE GLOW
   Gold light sweeps the AETTAM title; tagline softly pulses.
   ========================================================== */
function initHeroShimmer() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const h1 = document.querySelector('#top h1');
  if (h1) {
    h1.style.background           = 'linear-gradient(90deg,#ede7d6 0%,#ede7d6 35%,#e6c66a 50%,#ede7d6 65%,#ede7d6 100%)';
    h1.style.backgroundSize       = '300% auto';
    h1.style.webkitBackgroundClip = 'text';
    h1.style.webkitTextFillColor  = 'transparent';
    h1.style.backgroundClip      = 'text';
    h1.style.animation            = 'shimmer-sweep 5s ease-in-out infinite';
  }
  const tagline = document.querySelector('#top .font-cormorant.italic');
  if (tagline) tagline.style.animation = 'tagline-pulse 4s ease-in-out infinite';
}

/* ==========================================================
   COUNT-UP HELPER  (used by initSoulCounter)
   ========================================================== */
function _countUp(el, target, duration) {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    el.textContent = target.toString(); return;
  }
  const start = Date.now();
  (function tick() {
    const p    = Math.min((Date.now() - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target).toString();
    if (p < 1) requestAnimationFrame(tick);
  })();
}

/* ==========================================================
   PARALLAX HALO
   Hero halo wrapper drifts opposite scroll direction for depth.
   ========================================================== */
function initParallaxHalo() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;
  const wrappers = Array.from(document.querySelectorAll('.halo')).map(h => h.parentElement);
  if (!wrappers.length) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    wrappers.forEach(w => {
      w.style.transform = `translateY(${y * -0.14}px)`;
    });
  }, { passive: true });
}

/* ==========================================================
   GATE TYPING INDICATOR
   Three animated dots appear below the password input while typing.
   ========================================================== */
function initGateTypingIndicator() {
  const input = document.getElementById('gate-input');
  if (!input) return;
  const dots = document.createElement('div');
  dots.setAttribute('aria-hidden', 'true');
  dots.style.cssText = 'display:flex;justify-content:center;gap:5px;height:14px;margin-top:6px;' +
    'opacity:0;transition:opacity 0.3s ease;pointer-events:none;';
  for (let i = 0; i < 3; i++) {
    const d = document.createElement('span');
    d.style.cssText = `width:4px;height:4px;border-radius:50%;background:rgba(201,162,39,0.65);` +
      `display:inline-block;animation:typing-dot 1.1s ease-in-out ${i * 0.18}s infinite;`;
    dots.appendChild(d);
  }
  input.parentNode.insertBefore(dots, input.nextSibling);
  input.addEventListener('input', () => {
    dots.style.opacity = input.value.length > 0 ? '1' : '0';
  });
}

/* ==========================================================
   LETTER CARD WAX SEALS
   Inject a decorative wax-seal disc into each letter card.
   CSS handles show/hide based on .expanded state.
   ========================================================== */
function initLetterCards() {
  document.querySelectorAll('.letter-card.open-letter').forEach(card => {
    const seal = document.createElement('div');
    seal.className = 'wax-seal';
    seal.setAttribute('aria-hidden', 'true');
    seal.innerHTML = '<span class="wax-seal-inner">⛤</span>';
    const toggle = card.querySelector('.read-toggle');
    if (toggle) card.insertBefore(seal, toggle);
  });
  // 3D tilt on letter cards too
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  document.querySelectorAll('.letter-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transition = 'transform 0.1s ease, border-color 0.6s ease';
      card.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.65s ease, border-color 0.6s ease';
      card.style.transform = '';
    });
  });
}

/* ==========================================================
   SACRED GEOMETRY CANVAS
   Rotating Flower of Life + Metatron's Cube overlay.
   Fixed behind all content — felt more than seen.
   ========================================================== */
function initSacredGeometry() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'sacred-geometry-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  function arc(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }

  (function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const t = Date.now() * 0.00004;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.19;
    const breath = 0.5 + Math.sin(Date.now() * 0.0003) * 0.35;

    // Outer containment rings
    ctx.strokeStyle = `rgba(201,162,39,${0.035 * breath})`;
    ctx.lineWidth = 0.5;
    arc(cx, cy, r * 2.8);
    arc(cx, cy, r * 3.05);

    // Flower of Life — clockwise
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t);
    ctx.strokeStyle = `rgba(201,162,39,${0.032 * breath})`;
    ctx.lineWidth = 0.5;
    arc(0, 0, r);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      arc(Math.cos(a) * r, Math.sin(a) * r, r);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const d = r * 1.732;
      arc(Math.cos(a) * d, Math.sin(a) * d, r);
    }
    ctx.restore();

    // Metatron's Cube — counter-clockwise
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-t * 1.4);
    const mr = r * 0.52;
    const pts = [{ x: 0, y: 0 }];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push({ x: Math.cos(a) * mr, y: Math.sin(a) * mr });
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      pts.push({ x: Math.cos(a) * mr * 1.732, y: Math.sin(a) * mr * 1.732 });
    }
    ctx.strokeStyle = `rgba(201,162,39,${0.02 * breath})`;
    ctx.lineWidth = 0.3;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = `rgba(201,162,39,${0.04 * breath})`;
    for (const p of pts) arc(p.x, p.y, mr * 0.07);
    ctx.restore();

    // Inner pulsing ring
    const pulseR = r * 0.35 + Math.sin(Date.now() * 0.001) * r * 0.03;
    ctx.strokeStyle = `rgba(201,162,39,${0.05 * breath})`;
    ctx.lineWidth = 0.4;
    arc(cx, cy, pulseR);

    requestAnimationFrame(draw);
  })();
}

/* ==========================================================
   GOLDEN ORBS — floating warm light sources
   ========================================================== */
function initGoldenOrbs() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;

  const wrap = document.createElement('div');
  wrap.className = 'golden-orb-wrap';
  wrap.setAttribute('aria-hidden', 'true');
  document.body.prepend(wrap);

  const ORBS = [
    { x: '15%', y: '20%', size: 220, anim: 'orb-float-1', dur: 28 },
    { x: '75%', y: '35%', size: 180, anim: 'orb-float-2', dur: 34 },
    { x: '50%', y: '65%', size: 260, anim: 'orb-float-3', dur: 40 },
    { x: '25%', y: '80%', size: 160, anim: 'orb-float-2', dur: 32 },
    { x: '85%', y: '70%', size: 200, anim: 'orb-float-1', dur: 36 },
  ];

  ORBS.forEach((o, i) => {
    const el = document.createElement('div');
    el.className = 'golden-orb';
    el.style.cssText =
      `left:${o.x};top:${o.y};width:${o.size}px;height:${o.size}px;` +
      `animation:${o.anim} ${o.dur}s ease-in-out ${-i * 5}s infinite;`;
    wrap.appendChild(el);
  });
}

/* ==========================================================
   SHOOTING STARS — occasional golden streaks
   ========================================================== */
function initShootingStars() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  function spawn() {
    const el = document.createElement('div');
    el.className = 'shooting-star';
    el.style.left = (10 + Math.random() * 60) + '%';
    el.style.top  = (5 + Math.random() * 30) + '%';
    el.style.transform = `rotate(${25 + Math.random() * 20}deg)`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  (function scheduleNext() {
    setTimeout(() => { spawn(); scheduleNext(); }, 4000 + Math.random() * 6000);
  })();
}

/* ==========================================================
   INCENSE SMOKE — drifting wisps rising through the page
   ========================================================== */
function initIncenseSmoke() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;

  const wrap = document.createElement('div');
  wrap.className = 'smoke-wrap';
  wrap.setAttribute('aria-hidden', 'true');
  document.body.prepend(wrap);

  const ANIMS = ['smoke-rise-1', 'smoke-rise-2', 'smoke-rise-3'];

  function spawnWisp() {
    const el = document.createElement('div');
    el.className = 'smoke-wisp';
    const size = 200 + Math.random() * 300;
    const dur = 18 + Math.random() * 14;
    el.style.cssText =
      `width:${size}px;height:${size * 1.4}px;` +
      `left:${Math.random() * 100}%;bottom:-${size}px;` +
      `animation:${ANIMS[Math.floor(Math.random() * ANIMS.length)]} ${dur}s ease-out forwards;`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 100);
  }

  setInterval(spawnWisp, 3000);
  for (let i = 0; i < 4; i++) setTimeout(spawnWisp, i * 800);
}

/* ==========================================================
   SECTION VEILS — golden curtain dividers (sanctuary only)
   ========================================================== */
function initSectionVeils() {
  if (!document.body.classList.contains('sanctuary-bg')) return;
  const SIGILS = ['⛤', '☽', '✶', '⚜', '♆', '☉', '⛧', '☾'];
  const sections = document.querySelectorAll('section');
  let si = 0;
  sections.forEach((sec, i) => {
    if (i === 0) return;
    if (sec.previousElementSibling && sec.previousElementSibling.tagName === 'SECTION') {
      const veil = document.createElement('div');
      veil.className = 'section-veil';
      veil.setAttribute('aria-hidden', 'true');
      veil.innerHTML = `<span class="veil-sigil">${SIGILS[si++ % SIGILS.length]}</span>`;
      sec.parentNode.insertBefore(veil, sec);
    }
  });
}

/* ==========================================================
   AURORA BOREALIS — ethereal colored light bands
   ========================================================== */
function initAurora() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;
  const wrap = document.createElement('div');
  wrap.className = 'aurora-wrap';
  wrap.setAttribute('aria-hidden', 'true');
  const BANDS = [
    { color: 'rgba(201,162,39,0.07)', top: '5%',  left: '-10%', w: '65%', h: '160px', anim: 1, dur: 22 },
    { color: 'rgba(100,40,140,0.05)', top: '20%', left: '25%',  w: '55%', h: '140px', anim: 2, dur: 30 },
    { color: 'rgba(100,18,25,0.04)',  top: '10%', left: '45%',  w: '60%', h: '180px', anim: 1, dur: 26 },
    { color: 'rgba(20,80,55,0.04)',   top: '28%', left: '5%',   w: '50%', h: '130px', anim: 2, dur: 34 },
    { color: 'rgba(201,162,39,0.05)', top: '15%', left: '60%',  w: '45%', h: '150px', anim: 1, dur: 28 },
  ];
  BANDS.forEach((b, i) => {
    const el = document.createElement('div');
    el.className = 'aurora-band';
    el.style.cssText = `top:${b.top};left:${b.left};width:${b.w};height:${b.h};` +
      `background:${b.color};animation:aurora-drift-${b.anim} ${b.dur}s ease-in-out ${-i*4}s infinite;`;
    wrap.appendChild(el);
  });
  document.body.prepend(wrap);
}

/* ==========================================================
   GOLDEN RAIN — gentle falling gold drops
   ========================================================== */
function initGoldenRain() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  function drop() {
    const el = document.createElement('div');
    el.className = 'gold-drop';
    const h = 12 + Math.random() * 22;
    const dur = 4 + Math.random() * 5;
    el.style.cssText = `left:${Math.random()*100}%;top:-30px;height:${h}px;` +
      `animation-duration:${dur}s;opacity:${0.1 + Math.random()*0.2};`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 200);
  }
  (function schedule() {
    setTimeout(() => { drop(); schedule(); }, 250 + Math.random() * 150);
  })();
  for (let i = 0; i < 12; i++) setTimeout(drop, i * 200);
}

/* ==========================================================
   CLICK RITUAL — sigil + sparks burst on click
   ========================================================== */
function initClickRitual() {
  const GLYPHS = ['⛤','☽','✶','⚜','♀','⚸','♆','⛧','☉','☾','✷','⚯','✺'];
  document.addEventListener('click', (e) => {
    if (e.target.closest('a,button,input,textarea,select,[onclick]')) return;
    const g = document.createElement('span');
    g.className = 'click-sigil';
    g.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    g.style.left = (e.clientX - 12) + 'px';
    g.style.top = (e.clientY - 12) + 'px';
    document.body.appendChild(g);
    setTimeout(() => g.remove(), 900);
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('div');
      s.style.cssText = 'position:fixed;width:3px;height:3px;border-radius:50%;' +
        'background:rgba(201,162,39,0.75);pointer-events:none;z-index:9998;' +
        'box-shadow:0 0 6px rgba(201,162,39,0.5);' +
        `left:${e.clientX}px;top:${e.clientY}px;transition:all 0.55s ease-out;`;
      document.body.appendChild(s);
      const a = (i / 7) * Math.PI * 2;
      const d = 22 + Math.random() * 28;
      requestAnimationFrame(() => {
        s.style.left = (e.clientX + Math.cos(a) * d) + 'px';
        s.style.top = (e.clientY + Math.sin(a) * d - 12) + 'px';
        s.style.opacity = '0';
        s.style.transform = 'scale(0.15)';
      });
      setTimeout(() => s.remove(), 600);
    }
  });
}

/* ==========================================================
   CURSOR GOLDEN THREAD — trail of fading dots
   ========================================================== */
function initCursorThread() {
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  let lx = -99, ly = -99;
  document.addEventListener('mousemove', (e) => {
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (dx * dx + dy * dy < 100) return;
    lx = e.clientX; ly = e.clientY;
    const d = document.createElement('div');
    d.className = 'cursor-dot';
    d.style.left = e.clientX + 'px';
    d.style.top = e.clientY + 'px';
    document.body.appendChild(d);
    requestAnimationFrame(() => { d.style.opacity = '0'; d.style.transform = 'scale(0.3)'; });
    setTimeout(() => d.remove(), 750);
  });
}

/* ==========================================================
   CARD CORNER ORNAMENTS — golden filigree on every card
   ========================================================== */
function initCardCornerOrnaments() {
  document.querySelectorAll('.ritual-card, .member-card').forEach(card => {
    if (card.querySelector('.corner-ornament')) return;
    ['tl','tr','bl','br'].forEach(pos => {
      const c = document.createElement('div');
      c.className = 'corner-ornament corner-ornament-' + pos;
      c.setAttribute('aria-hidden', 'true');
      card.appendChild(c);
    });
  });
}

/* ==========================================================
   EDGE GLOW — golden light framing the viewport
   ========================================================== */
function initEdgeGlow() {
  const el = document.createElement('div');
  el.className = 'edge-glow';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
}

/* ==========================================================
   PENTAGRAM SVG DRAW — hero sacred geometry on load
   ========================================================== */
function initPentagramDraw() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const hero = document.querySelector('section:first-of-type');
  if (!hero) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('class', 'pentagram-svg');
  svg.style.cssText = 'width:min(450px,80vw);height:min(450px,80vw);position:absolute;top:50%;left:50%;' +
    'transform:translate(-50%,-50%);opacity:0.35;';
  svg.innerHTML =
    '<circle cx="100" cy="100" r="92"/>' +
    '<circle cx="100" cy="100" r="80"/>' +
    '<path d="M100,8 L155.9,172.6 L12.2,70.5 L187.8,70.5 L44.1,172.6 Z"/>' +
    '<circle cx="100" cy="100" r="36"/>';
  const anchor = hero.querySelector('.halo')?.parentElement;
  if (anchor) anchor.appendChild(svg);
  else hero.prepend(svg);
}

/* ==========================================================
   ACTIVE NAV INDICATOR — highlights current section
   ========================================================== */
function initActiveNavIndicator() {
  const links = document.querySelectorAll('nav a[href^="#"]');
  if (!links.length) return;
  const map = [];
  links.forEach(l => {
    const el = document.querySelector(l.getAttribute('href'));
    if (el) map.push({ el, link: l });
  });
  if (!map.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(ent => {
      const m = map.find(s => s.el === ent.target);
      if (m) m.link.classList.toggle('nav-active', ent.isIntersecting);
    });
  }, { threshold: 0.15, rootMargin: '-80px 0px -35% 0px' });
  map.forEach(s => io.observe(s.el));
}

/* ==========================================================
   CANDLE FLICKER — ambient light near section headings
   ========================================================== */
function initCandleFlicker() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;
  document.querySelectorAll('section h2').forEach(h2 => {
    const glow = document.createElement('div');
    glow.className = 'candle-glow';
    glow.setAttribute('aria-hidden', 'true');
    const sz = 100 + Math.random() * 80;
    glow.style.cssText = `width:${sz}px;height:${sz}px;top:-${sz*0.4}px;left:50%;margin-left:-${sz/2}px;`;
    h2.style.position = 'relative';
    h2.appendChild(glow);
  });
}

/* ==========================================================
   NAV BLUR INTENSITY — darkens on scroll
   ========================================================== */
function initNavBlurIntensity() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  let scrolled = false;
  window.addEventListener('scroll', () => {
    const past = window.scrollY > 80;
    if (past !== scrolled) { scrolled = past; nav.classList.toggle('nav-scrolled', past); }
  }, { passive: true });
}

/* ==========================================================
   CARD HOVER PARTICLE BURST — sparks erupt on hover
   ========================================================== */
function initCardParticleBurst() {
  if (window.matchMedia('(pointer:coarse)').matches) return;
  document.querySelectorAll('.ritual-card, .member-card, .feed-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const rect = card.getBoundingClientRect();
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'card-particle';
        const startX = Math.random() * rect.width;
        const startY = rect.height * 0.3 + Math.random() * rect.height * 0.4;
        p.style.cssText = `left:${startX}px;top:${startY}px;` +
          `transition:all 0.7s ease-out ${i*0.03}s;`;
        card.appendChild(p);
        requestAnimationFrame(() => {
          p.style.top = (startY - 25 - Math.random() * 20) + 'px';
          p.style.left = (startX + (Math.random() - 0.5) * 40) + 'px';
          p.style.opacity = '0';
          p.style.transform = 'scale(0.2)';
        });
        setTimeout(() => p.remove(), 800);
      }
    });
  });
}

/* ==========================================================
   GALLERY WAVE — neighbor tiles react to hover
   ========================================================== */
function initGalleryWave() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;
  const tiles = () => Array.from(grid.querySelectorAll('.gallery-tile'));
  grid.addEventListener('mouseenter', (e) => {
    const tile = e.target.closest('.gallery-tile');
    if (!tile) return;
    const all = tiles();
    const idx = all.indexOf(tile);
    const cols = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 2;
    [idx-1, idx+1, idx-cols, idx+cols].forEach(ni => {
      if (ni >= 0 && ni < all.length) {
        all[ni].style.transition = 'transform 0.4s ease, border-color 0.4s ease';
        all[ni].style.transform = 'translateY(-3px) scale(1.01)';
        all[ni].style.borderColor = 'rgba(201,162,39,0.35)';
      }
    });
  }, true);
  grid.addEventListener('mouseleave', () => {
    tiles().forEach(t => { t.style.transform = ''; t.style.borderColor = ''; });
  }, true);
}

/* ==========================================================
   DYNAMIC FOG DENSITY — thickens as you scroll deeper
   ========================================================== */
function initDynamicFog() {
  const wrap = document.querySelector('.smoke-wrap');
  if (!wrap) return;
  window.addEventListener('scroll', () => {
    const maxS = document.documentElement.scrollHeight - window.innerHeight;
    const depth = maxS > 0 ? Math.min(window.scrollY / maxS, 1) : 0;
    wrap.style.opacity = (0.4 + depth * 0.6).toFixed(2);
  }, { passive: true });
}

/* ==========================================================
   MORPHING BACKDROP — gradients shift over time
   ========================================================== */
function initMorphingBackdrop() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const isSanctuary = document.body.classList.contains('sanctuary-bg');
  if (!isSanctuary) return;
  let t = 0;
  (function tick() {
    t += 0.0006;
    const x1 = 50 + Math.sin(t * 0.7) * 18;
    const y1 = Math.sin(t * 0.4) * 12;
    const x2 = 50 + Math.sin(t * 0.3 + 1.5) * 22;
    const y2 = 60 + Math.sin(t * 0.55) * 15;
    document.body.style.backgroundPosition = `${x1}% ${y1}%, ${x2}% ${y2}%, 100% 80%`;
    requestAnimationFrame(tick);
  })();
}

/* ==========================================================
   FEED CARD STAGGER — assign delay indices for entrance
   ========================================================== */
function initFeedCardStagger() {
  document.querySelectorAll('.feed-card.reveal').forEach((c, i) => {
    c.style.setProperty('--feed-i', i);
  });
}

/* ==========================================================
   MAGNETIC CURSOR — elements subtly pull toward mouse
   ========================================================== */
function initMagneticCursor() {
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.querySelectorAll('.btn-primary, .btn-ghost').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.12;
      const dy = (e.clientY - r.top - r.height / 2) * 0.12;
      el.style.transform = `translate(${dx}px, ${dy}px) translateY(-2px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.4s ease';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 400);
    });
  });
}

/* ==========================================================
   SCROLL PROGRESS DOT — golden orb at end of progress bar
   ========================================================== */
function initScrollProgressDot() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const dot = document.createElement('div');
  dot.style.cssText = 'position:absolute;right:-4px;top:-3px;width:8px;height:8px;border-radius:50%;' +
    'background:var(--aettam-gold);box-shadow:0 0 12px rgba(201,162,39,0.9),0 0 25px rgba(201,162,39,0.4);';
  bar.appendChild(dot);
}

/* ----------  Boot  ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initSmoothScroll();
  initMirrorCard();
  initSigilGenerator();
  initAmbientButton();
  initMoonPhase();
  initEmbers();
  initCursorTrail();
  initPageCurtain();
  initScrollProgress();
  initStarfield();
  initAmbientSigils();
  initSigilRings();
  initRipple();
  initHeroShimmer();
  initCardTilt();
  initParallaxHalo();
  initGateTypingIndicator();
  initLetterCards();
  initSoulCounter();
  initSacredGeometry();
  initGoldenOrbs();
  initShootingStars();
  initIncenseSmoke();
  initSectionVeils();
  initAurora();
  initGoldenRain();
  initClickRitual();
  initCursorThread();
  initEdgeGlow();
  initPentagramDraw();
  initActiveNavIndicator();
  initCandleFlicker();
  initNavBlurIntensity();
  initCardParticleBurst();
  initDynamicFog();
  initMorphingBackdrop();
  initFeedCardStagger();
  initMagneticCursor();
  initScrollProgressDot();
  if (document.getElementById('ritual-calendar'))   initRitualCalendar();
  if (document.getElementById('members-grid'))      initMembersDirectory();
  if (document.getElementById('reflections-feed'))  initReflectionsFeed();
  if (document.getElementById('oath-wall'))         initOathWall();
  if (document.getElementById('sanctuary-feed'))    initSanctuaryFeed();
  if (document.getElementById('spotlight-card'))    initMemberSpotlight();
  if (document.getElementById('gallery-grid'))      initExclusiveGallery();
  setTimeout(() => {
    initCardCornerOrnaments();
    initGalleryWave();
  }, 2000);
});

/* small shake animation injected so we don't need another file */
const _styleTag = document.createElement('style');
_styleTag.textContent = `
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
.animate-shake { animation: shake 0.45s ease; border-color: rgba(248, 113, 113, 0.7) !important; }
@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0) scale(1);   opacity: 0.35; }
  30%            { transform: translateY(-4px) scale(1.2); opacity: 1;    }
}
`;
document.head.appendChild(_styleTag);
