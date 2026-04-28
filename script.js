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
   To start receiving emails:
     1. Sign up free at https://formspree.io
     2. Create a new form, copy the endpoint URL
        (looks like: https://formspree.io/f/abcdwxyz)
     3. Paste it below replacing the placeholder.
   Until then, submissions are saved to localStorage as a
   fallback so nothing is lost.
   ---------------------------------------------------------- */
// After deploying the Cloudflare Worker (aettam-worker/), replace this with your worker URL.
const REFLECTIONS_ENDPOINT = "https://aettam-worker.firstbloodanivia.workers.dev/reflect";
// Sanctuary key must match the SANCTUARY_KEY worker secret (default: mattea-sanctuary-2026)
const SANCTUARY_KEY = "mattea-sanctuary-2026";
const MEMBERS_URL   = "https://146-190-119-77.sslip.io/aettam-members";

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

/* close on ESC */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeGate(); closeReflections(); }
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
  document.querySelectorAll('.ritual-card').forEach(card => {
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
  initSoulCounter();
  if (document.getElementById('ritual-calendar'))   initRitualCalendar();
  if (document.getElementById('members-grid'))      initMembersDirectory();
  if (document.getElementById('reflections-feed'))  initReflectionsFeed();
  if (document.getElementById('oath-wall'))         initOathWall();
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
`;
document.head.appendChild(_styleTag);
