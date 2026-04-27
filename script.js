/* ==========================================================
   AETTAM — script.js
   ----------------------------------------------------------
   ADMIN: change the password here.  This is client-side only
   so do not store anything truly sensitive behind it; it
   keeps casual visitors out of the members area, nothing more.
   ========================================================== */

const SANCTUARY_PASSWORD = "wearemattea";   // ← change me
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
const REFLECTIONS_ENDPOINT = "https://formspree.io/f/mvzdjzpk";

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

/* ----------  Reveal-on-scroll  ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(e => e.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
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

/* ----------  Boot  ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initSmoothScroll();
  initMirrorCard();
  initSigilGenerator();
  initAmbientButton();
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
