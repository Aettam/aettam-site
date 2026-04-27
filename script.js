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

/* ----------  Boot  ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initSmoothScroll();
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
