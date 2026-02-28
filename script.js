// ====== EMAILJS ======
emailjs.init("YdalPlh-x2bdL6eFV");

// ====== STORAGE ======
const store = {
  get: k => { try { return localStorage.getItem(k); } catch(e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} },
  del: k => { try { localStorage.removeItem(k); } catch(e) {} }
};

// ====== NAVIGATION ======
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('onclick') && a.getAttribute('onclick').includes("'" + page + "'"));
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'login') { refreshLoginPage(); startStarfield('star-canvas'); }
  if (page === 'blog') updateCardCounts();
}

// ====== TOAST ======
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.className = ''; }, 3000);
}

// ====== CONTACT FORM ======
function submitContactForm(e) {
  e.preventDefault();
  const btn = document.getElementById('cf-submit-btn');
  btn.textContent = 'Sending...'; btn.disabled = true;
  const p = {
    name:    document.getElementById('cf-name').value,
    email:   document.getElementById('cf-email').value,
    subject: document.getElementById('cf-subject').value,
    message: document.getElementById('cf-message').value,
  };
  emailjs.send('service_gfc52dt', 'template_onqwv1l', p)
    .then(() => {
      document.getElementById('contact-form').style.display = 'none';
      document.getElementById('cf-success').style.display = 'block';
    })
    .catch(err => {
      alert('Failed to send. Please try again.');
      btn.textContent = 'Send Message'; btn.disabled = false;
      console.error(err);
    });
}

function resetContactForm() {
  document.getElementById('contact-form').reset();
  document.getElementById('contact-form').style.display = 'flex';
  document.getElementById('cf-success').style.display = 'none';
  const btn = document.getElementById('cf-submit-btn');
  btn.textContent = 'Send Message'; btn.disabled = false;
}

// ====== THEME ======
const themeIcons = { dark:'🌙', light:'☀️', retro:'📺', love:'💗', ocean:'🌊', forest:'🌿' };

function setTheme(t) {
  document.body.className = document.body.className.replace(/theme-\S+/g,'').trim();
  if (t !== 'dark') document.body.classList.add('theme-' + t);
  const el = document.getElementById('theme-icon');
  if (el) el.textContent = themeIcons[t];
  document.querySelectorAll('.theme-opt').forEach(b => b.classList.toggle('active', b.dataset.theme === t));
  store.set('portfolio-theme', t);
  closeThemePanel();
}

function toggleThemePanel() { document.getElementById('theme-panel').classList.toggle('open'); }
function closeThemePanel()  { document.getElementById('theme-panel').classList.remove('open'); }

document.addEventListener('click', e => {
  const w = document.querySelector('.theme-wrapper');
  if (w && !w.contains(e.target)) closeThemePanel();
});

(function() { setTheme(store.get('portfolio-theme') || 'dark'); })();

// ====================================================
// CONSTELLATION LOADER
// Shows on page load + every tab switch.
// Stars pop in one by one → lines draw between them
// → brief hold → overlay fades away revealing the page.
// ====================================================
const ConstellationLoader = (function () {

  // ── Cassiopeia — classic W shape ──
  // 5 main stars forming a clean upright W, centred on screen
  const STARS_DEF = [
    { x: 0.18, y: 0.68, name: 'Segin',     r: 2.2 }, // 0  ε Cas — far left, lower
    { x: 0.34, y: 0.32, name: 'Ruchbah',   r: 2.6 }, // 1  δ Cas — left peak
    { x: 0.50, y: 0.62, name: 'Gamma Cas', r: 3.2 }, // 2  γ Cas — centre valley (brightest)
    { x: 0.66, y: 0.32, name: 'Schedar',   r: 2.8 }, // 3  α Cas — right peak
    { x: 0.82, y: 0.68, name: 'Caph',      r: 2.4 }, // 4  β Cas — far right, lower
  ];

  const EDGES_DEF = [
    [0, 1],  // left base to left peak
    [1, 2],  // left peak down to centre
    [2, 3],  // centre up to right peak
    [3, 4],  // right peak down to right base
  ];

  // timings (ms)
  const STAR_INTERVAL  = 50;   // delay between each star appearing
  const STAR_FADE_DUR  = 180;  // how long each star fades in
  const LINE_DELAY     = 38;   // delay between each line starting to draw
  const LINE_DUR       = 170;  // how long each line takes to draw
  const HOLD_MS        = 480;  // hold after everything drawn
  const FADE_OUT_MS    = 600;  // CSS transition duration

  const PAGE_LABELS = {
    home: 'Home', achievements: 'Achievements', skills: 'Skills & Tools',
    about: 'About Me', contact: 'Contact', blog: 'The Nischal Times', login: 'Account'
  };

  let overlay, canvas, ctx, labelEl;
  let W, H;
  let rafId = null;
  let stars = [], edges = [], bgStars = [];
  let sequenceStart = null;
  let allStarsDone = false, allEdgesDone = false;
  let holdStart = null;

  /* ── helpers ── */
  function accentRGB() {
    const hex = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    if (hex.startsWith('#')) {
      return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    }
    return [232, 213, 163];
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* ── setup ── */
  function setup() {
    overlay  = document.getElementById('cl-overlay');
    canvas   = document.getElementById('cl-canvas');
    labelEl  = document.getElementById('cl-page-name');
    if (!canvas) return false;
    ctx = canvas.getContext('2d');
    return true;
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function buildScene() {
    const scale = Math.min(W, H) * 0.75;
    const ox = W * 0.5, oy = H * 0.48;

    stars = STARS_DEF.map(s => ({
      x: ox + (s.x - 0.5) * scale,
      y: oy + (s.y - 0.5) * scale,
      r: (s.r || 2) * Math.min(W, H) / 700, // scale radius with screen
      alpha: 0,
      born: null,
    }));

    edges = EDGES_DEF.map(([a, b]) => ({
      a, b,
      progress: 0,
      born: null,
    }));

    // scattered background micro-stars — more of them for atmosphere
    bgStars = Array.from({ length: 200 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 0.9 + 0.15,
      base: Math.random() * 0.22 + 0.04,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 1.2 + 0.4,
    }));
  }

  /* ── draw one frame ── */
  function drawFrame(now) {
    ctx.clearRect(0, 0, W, H);
    const [r, g, b] = accentRGB();

    // background twinkle stars
    for (const s of bgStars) {
      const a = s.base + 0.12 * Math.sin(now * 0.001 * s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fill();
    }

    // edges
    for (const e of edges) {
      if (!e.born) continue;
      const t = Math.min(1, (now - e.born) / LINE_DUR);
      e.progress = easeOut(t);

      const sa = stars[e.a], sb = stars[e.b];
      const ex = sa.x + (sb.x - sa.x) * e.progress;
      const ey = sa.y + (sb.y - sa.y) * e.progress;

      const g2 = ctx.createLinearGradient(sa.x, sa.y, ex, ey);
      const la = 0.5 * Math.min(sa.alpha, sb.alpha);
      g2.addColorStop(0,   `rgba(${r},${g},${b},${la})`);
      g2.addColorStop(0.5, `rgba(${r},${g},${b},${la * 1.5})`);
      g2.addColorStop(1,   `rgba(${r},${g},${b},${la})`);
      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = g2;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    // constellation stars
    for (const s of stars) {
      if (!s.born) continue;
      const t = Math.min(1, (now - s.born) / STAR_FADE_DUR);
      s.alpha = easeOut(t);
      if (s.alpha <= 0) continue;

      // glow halo — scales with star size
      const glowRadius = s.r * 5.5;
      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowRadius);
      grd.addColorStop(0, `rgba(${r},${g},${b},${s.alpha * 0.4})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // core dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${s.alpha})`;
      ctx.fill();

      // 4-point sparkle
      if (s.alpha > 0.5) {
        const len = s.r * 3.5 * s.alpha;
        ctx.strokeStyle = `rgba(${r},${g},${b},${s.alpha * 0.55})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
      }
    }
  }

  /* ── animation loop ── */
  function tick(now) {
    if (!sequenceStart) sequenceStart = now;
    const elapsed = now - sequenceStart;

    // Phase 1 — reveal stars one by one
    if (!allStarsDone) {
      stars.forEach((s, i) => {
        if (!s.born && elapsed >= i * STAR_INTERVAL) s.born = now;
      });
      if (elapsed >= (stars.length - 1) * STAR_INTERVAL) allStarsDone = true;
    }

    // Phase 2 — draw lines (starts after last star is born)
    if (allStarsDone && !allEdgesDone) {
      const linesBase = (stars.length - 1) * STAR_INTERVAL + 120;
      edges.forEach((e, i) => {
        if (!e.born && elapsed >= linesBase + i * LINE_DELAY) e.born = now;
      });
      const lastLineEnd = linesBase + (edges.length - 1) * LINE_DELAY + LINE_DUR;
      if (elapsed >= lastLineEnd) allEdgesDone = true;
    }

    // Phase 3 — hold then fade out
    if (allEdgesDone) {
      if (!holdStart) {
        holdStart = now;
        // show label now
        // label hidden per user request
        // overlay.classList.add('cl-label-in');
      }
      if (now - holdStart >= HOLD_MS) {
        // trigger CSS fade-out
        overlay.classList.add('cl-hidden');
        cancelAnimationFrame(rafId);
        rafId = null;
        return;
      }
    }

    drawFrame(now);
    rafId = requestAnimationFrame(tick);
  }

  /* ── public: play the loader ── */
  function play(pageKey) {
    if (!overlay && !setup()) return;

    // reset state
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    sequenceStart = null;
    allStarsDone  = false;
    allEdgesDone  = false;
    holdStart     = null;

    resize();
    buildScene();

    // set label
    if (labelEl) labelEl.textContent = PAGE_LABELS[pageKey] || pageKey;

    // make overlay visible instantly
    overlay.classList.remove('cl-hidden', 'cl-label-in');

    // force reflow so transition resets properly
    void overlay.offsetWidth;

    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => {
    if (rafId) { resize(); buildScene(); }
  });

  return { play };
})();

// ── Hook loader into showPage ──
const _origShowPage = showPage;
showPage = function(page) {
  ConstellationLoader.play(page);
  // small delay so overlay is visible before page switches
  setTimeout(() => _origShowPage(page), 80);
};

// ── Play on initial page load ──
ConstellationLoader.play('home');



// ====== STARFIELD CANVAS ======
const starfieldInstances = {};

function startStarfield(canvasId) {
  if (starfieldInstances[canvasId]) return; // already running
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, stars;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeStars(n) {
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.15 + 0.03,
      alpha: Math.random(),
      dalpha: (Math.random() - 0.5) * 0.008,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.alpha += s.dalpha;
      if (s.alpha <= 0 || s.alpha >= 1) s.dalpha *= -1;
      s.alpha = Math.max(0, Math.min(1, s.alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 213, 163, ${s.alpha * 0.9})`;
      ctx.fill();
    }
    // Draw a few connecting lines for constellation effect
    for (let i = 0; i < stars.length; i += 12) {
      const a = stars[i], b = stars[(i + 7) % stars.length];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(232, 213, 163, ${0.06 * (1 - dist / 120)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
    starfieldInstances[canvasId] = requestAnimationFrame(draw);
  }

  const ro = new ResizeObserver(() => { resize(); makeStars(180); });
  ro.observe(canvas);
  resize();
  makeStars(180);
  starfieldInstances[canvasId] = requestAnimationFrame(draw);
}

// ====== AUTH HELPERS ======
function getUsers() {
  try { return JSON.parse(store.get('portfolio-users') || '{}'); } catch(e) { return {}; }
}
function saveUsers(u) { store.set('portfolio-users', JSON.stringify(u)); }
function getCurrentUser() {
  try { return JSON.parse(store.get('portfolio-current-user') || 'null'); } catch(e) { return null; }
}
function setCurrentUser(u) { store.set('portfolio-current-user', JSON.stringify(u)); }
function isLoggedIn() { return getCurrentUser() !== null; }

function updateNavLoginBtn() {
  const btn = document.getElementById('nav-login-btn');
  if (!btn) return;
  const u = getCurrentUser();
  if (u) {
    btn.textContent = u.username.charAt(0).toUpperCase() + u.username.slice(1, 5) + '…';
    btn.classList.add('logged-in');
  } else {
    btn.textContent = 'Login';
    btn.classList.remove('logged-in');
  }
}

function refreshLoginPage() {
  const u = getCurrentUser();
  const panel = document.getElementById('auth-panel');
  const loggedIn = document.getElementById('auth-loggedin');
  if (!panel || !loggedIn) return;

  if (u) {
    panel.style.display = 'none';
    loggedIn.style.display = 'block';
    const el = id => document.getElementById(id);
    el('loggedin-username-display').textContent = u.username;
    el('loggedin-email-display').textContent = u.email;
    el('loggedin-avatar').textContent = u.username.charAt(0).toUpperCase();
    startStarfield('star-canvas-li');
  } else {
    panel.style.display = '';
    loggedIn.style.display = 'none';
    startStarfield('star-canvas');
  }
  updateNavLoginBtn();
}

// ====== AUTH TABS ======
function switchAuthTab(tab) {
  const lf   = document.getElementById('auth-login-form');
  const rf   = document.getElementById('auth-register-form');
  const ff   = document.getElementById('auth-forgot-form');
  const tl   = document.getElementById('tab-login');
  const tr   = document.getElementById('tab-register');
  const pill = document.getElementById('auth-pill-bg');
  const pillRow = document.getElementById('auth-pill-row');

  // Hide all panels
  [lf, rf, ff].forEach(el => { if (el) el.style.display = 'none'; });

  if (tab === 'login') {
    lf.style.display = '';
    tl.classList.add('active'); tr.classList.remove('active');
    if (pill) pill.classList.remove('right');
    if (pillRow) pillRow.style.display = '';
    const err = document.getElementById('login-error');
    if (err) err.style.display = 'none';

  } else if (tab === 'register') {
    rf.style.display = '';
    tl.classList.remove('active'); tr.classList.add('active');
    if (pill) pill.classList.add('right');
    if (pillRow) pillRow.style.display = '';
    const err = document.getElementById('reg-error');
    if (err) err.style.display = 'none';

  } else if (tab === 'forgot') {
    // Forgot gets its own clean panel — hide the pill entirely
    if (pillRow) pillRow.style.display = 'none';
    if (ff) ff.style.display = '';
    const err = document.getElementById('forgot-error');
    const ok  = document.getElementById('forgot-success');
    if (err) err.style.display = 'none';
    if (ok)  ok.style.display  = 'none';
    // Clear forgot fields
    ['forgot-username','forgot-newpass','forgot-confirm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }
}

// ====== EYE TOGGLE ======
function toggleEye(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.classList.toggle('visible', isHidden);
  // Swap icon
  const icon = btn.querySelector('.eye-icon');
  if (isHidden) {
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function showAuthErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = 'block';
}

// ====== REGISTER ======
function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;

  if (username.length < 3)                  return showAuthErr('reg-error', 'Username must be at least 3 characters.');
  if (!/^[a-zA-Z0-9_]+$/.test(username))   return showAuthErr('reg-error', 'Username: letters, numbers, underscores only.');
  if (password.length < 6)                  return showAuthErr('reg-error', 'Password must be at least 6 characters.');
  if (password !== confirm)                 return showAuthErr('reg-error', 'Passwords do not match.');

  const users = getUsers();
  if (users[username.toLowerCase()])        return showAuthErr('reg-error', 'That username is already taken.');
  if (Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase()))
                                             return showAuthErr('reg-error', 'An account with this email exists.');

  users[username.toLowerCase()] = { username, email, password: btoa(password), joined: new Date().toISOString() };
  saveUsers(users);
  setCurrentUser({ username, email });
  refreshLoginPage();
  updateModalCommentForm();
  updateCardCounts();
  showToast('Account created! Welcome, ' + username + ' 🎉', 'success');
}

// ====== FORGOT PASSWORD ======
function handleForgotPassword(e) {
  e.preventDefault();
  const username = document.getElementById('forgot-username').value.trim();
  const newpass  = document.getElementById('forgot-newpass').value;
  const confirm  = document.getElementById('forgot-confirm').value;
  const errEl    = document.getElementById('forgot-error');
  const okEl     = document.getElementById('forgot-success');

  errEl.style.display = 'none';
  okEl.style.display  = 'none';

  const users = getUsers();
  const key   = username.toLowerCase();

  if (!users[key])          { errEl.textContent = 'No account found with that username.'; errEl.style.display = 'block'; return; }
  if (newpass.length < 6)   { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
  if (newpass !== confirm)  { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; return; }

  users[key].password = btoa(newpass);
  saveUsers(users);

  okEl.style.display = 'block';
  document.getElementById('forgot-username').value = '';
  document.getElementById('forgot-newpass').value  = '';
  document.getElementById('forgot-confirm').value  = '';

  // Auto-switch back to login after 2s
  setTimeout(() => switchAuthTab('login'), 2000);
}


function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const users    = getUsers();
  const rec      = users[username.toLowerCase()];

  if (!rec)                        return showAuthErr('login-error', 'No account found with that username.');
  if (atob(rec.password) !== password) return showAuthErr('login-error', 'Incorrect password.');

  setCurrentUser({ username: rec.username, email: rec.email });
  refreshLoginPage();
  updateModalCommentForm();
  updateCardCounts();
  showToast('Welcome back, ' + rec.username + '!', 'success');
  document.getElementById('login-error').style.display = 'none';
}

// ====== LOGOUT ======
function handleLogout() {
  store.del('portfolio-current-user');
  refreshLoginPage();
  updateModalCommentForm();
  showToast('Logged out.', 'success');
}

// ====== DELETE ACCOUNT ======
function confirmDeleteAccount() {
  const u = getCurrentUser();
  if (!u) return;
  const confirmed = window.confirm(
    `Delete account "${u.username}"?\n\nThis will permanently remove your account. Your comments will remain but show as posted. This cannot be undone.`
  );
  if (confirmed) handleDeleteAccount();
}

function handleDeleteAccount() {
  const u = getCurrentUser();
  if (!u) return;
  const users = getUsers();
  delete users[u.username.toLowerCase()];
  saveUsers(users);
  store.del('portfolio-current-user');
  refreshLoginPage();
  updateModalCommentForm();
  showToast('Account deleted. Sorry to see you go.', 'success');
}

// ====== BLOG POST DATA ======
const POSTS = {
  1: {
    tag: 'Astronomy', date: 'Jan 12, 2025',
    title: 'Why I Fell in Love with the Stars',
    body: `<p>Ever since I was a child in Dharan, I would lie on the roof and stare up at the Milky Way stretching across the sky. Nepal's clear mountain air gives you something most city-dwellers never experience — a genuinely dark sky. That's where it started. The moment I realized those faint smudges weren't just stars but entire galaxies billions of light-years away, something clicked. Physics stopped being equations and became a language the universe was speaking directly to me.</p>
<p>Qualifying for IJSO opened my eyes to how competitive and beautiful the world of science olympiads is. But more than the competition, it was the conversations — with peers who cared about dark matter, neutron stars, and gravitational waves the same way I did. Science is lonely until it isn't.</p>
<p>I still remember the first time I looked through a proper telescope. The rings of Saturn didn't look real — they looked like a sticker someone had placed on the eyepiece. That cognitive dissonance, that clash between what you know intellectually and what your eyes refuse to accept, is the purest feeling I've ever had in science. I've been chasing it ever since.</p>`
  },
  2: {
    tag: 'Reflection', date: 'Feb 3, 2025',
    title: 'What NYPT Taught Me About Arguing',
    body: `<p>The Nepal Young Physicists' Tournament is unlike any science competition I'd been in. You don't just solve problems — you defend solutions in front of opponents who actively try to dismantle your reasoning. It's brutal and brilliant in equal measure. My first fight, I stumbled. My physics was correct but my communication was scattered. I learned that knowing something and being able to explain it under pressure are completely different skills.</p>
<p>What I took from NYPT wasn't just physics intuition. It was intellectual humility. Sometimes your opponent points out a flaw in your model and the honest thing to do is concede. That's not weakness — that's science.</p>
<p>There's also something uniquely satisfying about winning an argument with a better physical model. Not winning because you spoke louder or longer, but because your framework genuinely captured more of reality. NYPT trained me to care about that distinction. I think every student who wants to be a scientist should go through something like it.</p>`
  },
  3: {
    tag: 'Life', date: 'Feb 20, 2025',
    title: 'Moving to Kathmandu: A Culture Shock',
    body: `<p>Leaving Dharan for Trinity International College in Kathmandu felt like jumping from a quiet lake into an ocean. The pace is different, the people are different, and the expectations are different. For the first few weeks I missed the slow mornings, the familiar streets, the mountains that framed every sunrise. Kathmandu doesn't give you that — it gives you chaos and opportunity in the same breath.</p>
<p>But I'm adapting. I've found pockets of calm in the city — rooftops, small coffee shops, early-morning walks before the traffic wakes up. And I've found that ambition is contagious when you're surrounded by people who take their futures seriously. I'm grateful for the discomfort. It means I'm growing.</p>
<p>Dharan shaped who I am. But Kathmandu is shaping who I'm becoming. Both cities live in me now, and I think that dual citizenship — quiet roots, loud ambitions — is exactly the kind of tension that makes a person interesting.</p>`
  }
};

// ====== NEWSPAPER: SELECT STORY (index switching) ======
function selectPost(id) {
  // Update active index item
  document.querySelectorAll('.np-index-list li').forEach((li, i) => {
    li.classList.toggle('active', i + 1 === id);
  });

  const postData = {
    1: {
      kicker: 'Lead Story · Astronomy',
      date: 'Jan 12, 2025',
      title: 'Why I Fell in Love with the Stars',
      body: `<p class="np-story-body np-dropcap">Ever since I was a child in Dharan, I would lie on the roof and stare up at the Milky Way stretching across the sky. Nepal's clear mountain air gives you something most city-dwellers never experience — a genuinely dark sky. That's where it started. The moment I realized those faint smudges weren't just stars but entire galaxies billions of light-years away, something clicked entirely.</p><p class="np-story-body">Physics stopped being equations and became a language the universe was speaking directly to me. Qualifying for IJSO opened my eyes to how competitive and beautiful the world of science olympiads truly is.</p>`,
      commentId: 'card-count-1',
      headlineClass: 'np-headline-lead',
      readLabel: 'Continue Reading →',
      belowVisible: true
    },
    2: {
      kicker: 'Reflection · Physics',
      date: 'Feb 3, 2025',
      title: 'What NYPT Taught Me About Arguing',
      body: `<p class="np-story-body np-dropcap">The Nepal Young Physicists' Tournament is unlike any science competition I'd been in. You don't just solve problems — you defend solutions in front of opponents who actively try to dismantle your reasoning. It's brutal and brilliant in equal measure.</p><p class="np-story-body">What I took from NYPT wasn't just physics intuition. It was intellectual humility. Sometimes your opponent points out a flaw in your model and the honest thing to do is concede. That's not weakness — that's science.</p>`,
      commentId: 'card-count-2',
      headlineClass: 'np-headline-lead',
      readLabel: 'Continue Reading →',
      belowVisible: false
    },
    3: {
      kicker: 'Life · Kathmandu',
      date: 'Feb 20, 2025',
      title: 'Moving to Kathmandu: A Culture Shock',
      body: `<p class="np-story-body np-dropcap">Leaving Dharan for Trinity International College in Kathmandu felt like jumping from a quiet lake into an ocean. The pace is different, the people are different, and the expectations are entirely different. For the first few weeks I missed the slow mornings, the familiar streets, the mountains that framed every sunrise.</p><p class="np-story-body">But I'm adapting. I've found pockets of calm in the city — rooftops, small coffee shops, early-morning walks. Ambition is contagious when you're surrounded by people who take their futures seriously.</p>`,
      commentId: 'card-count-3',
      headlineClass: 'np-headline-lead',
      readLabel: 'Continue Reading →',
      belowVisible: false
    }
  };

  const p = postData[id];
  const n = getComments(id).length;
  const commentText = n + (n === 1 ? ' comment' : ' comments');

  const leadStory = document.querySelector('.np-story-lead');
  if (leadStory) {
    leadStory.setAttribute('data-post', id);
    leadStory.setAttribute('onclick', `openPost(${id})`);
    leadStory.innerHTML = `
      <div class="np-story-kicker">${p.kicker}</div>
      <h2 class="np-story-headline ${p.headlineClass}">${p.title}</h2>
      <div class="np-story-rule"></div>
      ${p.body}
      <div class="np-story-footer">
        <span class="np-story-date">${p.date}</span>
        <span class="np-story-read">${p.readLabel}</span>
        <span class="np-story-comments">${commentText}</span>
      </div>
    `;
  }

  // Show/hide the below-grid row
  const belowRule = document.querySelector('.np-below-rule');
  const belowGrid = document.getElementById('np-below-grid');
  if (belowRule) belowRule.style.display = p.belowVisible ? '' : 'none';
  if (belowGrid) belowGrid.style.display = p.belowVisible ? '' : 'none';
}


// ====== BLOG GRID ======
function updateCardCounts() {
  let total = 0;
  [1, 2, 3].forEach(id => {
    const n = getComments(id).length;
    total += n;
    const el = document.getElementById('card-count-' + id);
    if (el) el.textContent = n + (n === 1 ? ' comment' : ' comments');
  });
  const ticker = document.getElementById('ticker-total');
  if (ticker) ticker.textContent = total + (total === 1 ? ' comment' : ' comments');
}

// ====== OPEN / CLOSE POST MODAL ======
let currentPostId = null;

function openPost(id) {
  currentPostId = id;
  const post = POSTS[id];
  if (!post) return;

  const overlay = document.getElementById('blog-modal-overlay');
  const panel   = document.getElementById('blog-modal-panel');
  const content = document.getElementById('blog-modal-content');
  const scroll  = document.getElementById('blog-modal-scroll');

  content.innerHTML = `
    <span class="modal-post-tag">${post.tag}</span>
    <span class="modal-post-date">${post.date}</span>
    <h2 class="modal-post-title">${post.title}</h2>
    <div class="modal-post-body">${post.body}</div>
  `;

  renderModalComments(id);
  renderModalCommentForm(id);

  overlay.classList.add('open');
  panel.classList.add('open');
  scroll.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closePost() {
  const overlay = document.getElementById('blog-modal-overlay');
  const panel   = document.getElementById('blog-modal-panel');
  overlay.classList.remove('open');
  panel.classList.remove('open');
  document.body.style.overflow = '';
  currentPostId = null;
  updateCardCounts();
}

function closePostOverlay(e) {
  // Only close if clicking directly on the dark overlay, not the panel
  if (e.target === document.getElementById('blog-modal-overlay')) {
    closePost();
  }
}

// ====== COMMENTS ======
function getComments(postId) {
  try { return JSON.parse(store.get('blog-comments-' + postId) || '[]'); } catch(e) { return []; }
}
function saveComments(postId, arr) { store.set('blog-comments-' + postId, JSON.stringify(arr)); }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function renderModalComments(postId) {
  const list  = document.getElementById('modal-comments-list');
  const count = document.getElementById('modal-comment-count');
  if (!list) return;
  const comments = getComments(postId);
  const me = getCurrentUser();
  count.textContent = comments.length + (comments.length === 1 ? ' Comment' : ' Comments');

  if (comments.length === 0) {
    list.innerHTML = '<div style="padding:1.5rem;font-size:0.72rem;color:var(--muted);font-style:italic;">No comments yet — be the first to share your thoughts.</div>';
    list.style.background = 'var(--surface)';
    list.style.border = '1px solid var(--border)';
    return;
  }
  list.style.background = 'var(--border)';
  list.style.border = 'none';
  list.innerHTML = comments.map(c => {
    const isMe = me && me.username.toLowerCase() === c.author.toLowerCase();
    return `
    <div class="comment-item${isMe ? ' comment-mine' : ''}">
      <div class="comment-header">
        <div class="comment-avatar" style="${isMe ? 'background:var(--surface2);border-color:var(--accent);' : ''}">${escHtml(c.author.charAt(0).toUpperCase())}</div>
        <span class="comment-author">${escHtml(c.author)}</span>
        ${isMe ? '<span class="comment-you-badge">you</span>' : ''}
        <span class="comment-date">${formatDate(c.date)}</span>
      </div>
      <div class="comment-text">${escHtml(c.text)}</div>
    </div>
  `}).join('');
}

function renderModalCommentForm(postId) {
  const area = document.getElementById('modal-comment-form');
  if (!area) return;
  const user = getCurrentUser();

  if (user) {
    area.innerHTML = `
      <div class="comment-form-box">
        <textarea id="modal-comment-textarea" placeholder="Share your thoughts on this post..."></textarea>
        <div class="comment-form-footer">
          <span class="comment-logged-as">Commenting as <strong>${escHtml(user.username)}</strong></span>
          <button class="btn btn-accent" onclick="submitModalComment(${postId})">Post Comment</button>
        </div>
        <p class="comment-local-note">💡 Comments are stored in this browser. Other accounts on this same browser can see them, but not visitors on other devices.</p>
      </div>
    `;
  } else {
    area.innerHTML = `
      <div class="comment-login-prompt">
        <p>Login or register to join the discussion.</p>
        <button class="btn btn-accent" onclick="closePost(); showPage('login')">Login / Register</button>
      </div>
    `;
  }
}

function updateModalCommentForm() {
  if (currentPostId) renderModalCommentForm(currentPostId);
}

function submitModalComment(postId) {
  const user = getCurrentUser();
  if (!user) { showToast('Please log in to comment.', 'error'); return; }

  const ta   = document.getElementById('modal-comment-textarea');
  const text = ta ? ta.value.trim() : '';
  if (!text)          { showToast('Comment cannot be empty.', 'error'); return; }
  if (text.length > 1000) { showToast('Comment too long (max 1000 chars).', 'error'); return; }

  const comments = getComments(postId);
  comments.push({ author: user.username, text, date: new Date().toISOString() });
  saveComments(postId, comments);

  renderModalComments(postId);
  renderModalCommentForm(postId);
  showToast('Comment posted!', 'success');
}

// ====== ESC KEY to close modal ======
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && currentPostId !== null) closePost();
});

// ====== INIT ======
(function init() {
  refreshLoginPage();
  updateCardCounts();
})();

// ====================================================
// TIMELINE SCROLL ANIMATION
// ====================================================
const TimelineAnimator = (function () {

  let observed = false;

  function init() {
    const tl = document.getElementById('timeline');
    if (!tl || observed) return;
    observed = true;

    // Kick off the vertical line grow
    tl.classList.add('tl-animate');

    const items    = tl.querySelectorAll('.tl-item');
    const years    = tl.querySelectorAll('.tl-year-marker');
    const endCap   = tl.querySelector('.tl-end-cap');

    // Collect everything in DOM order with type tagging
    const allEls = [...tl.children].map(el => {
      if (el.classList.contains('tl-item'))        return { el, type: 'item' };
      if (el.classList.contains('tl-year-marker')) return { el, type: 'year' };
      if (el.classList.contains('tl-end-cap'))     return { el, type: 'end' };
      return null;
    }).filter(Boolean);

    // IntersectionObserver — fire when each element enters viewport
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('tl-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    allEls.forEach(({ el }) => io.observe(el));
  }

  // Re-run when switching to achievements tab
  function reset() {
    observed = false;
    const tl = document.getElementById('timeline');
    if (!tl) return;
    tl.classList.remove('tl-animate');
    tl.querySelectorAll('.tl-item, .tl-year-marker, .tl-end-cap')
      .forEach(el => el.classList.remove('tl-visible'));
    // Small delay so CSS resets before re-animating
    setTimeout(init, 80);
  }

  return { init, reset };
})();

// Hook into showPage to trigger timeline when navigating to achievements
const _tlOrigShowPage = showPage;
showPage = function (page) {
  _tlOrigShowPage(page);
  if (page === 'achievements') {
    setTimeout(() => TimelineAnimator.reset(), 120);
  }
};

// Also fire on first load if starting on achievements (unlikely but safe)
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-achievements').classList.contains('active')) {
    TimelineAnimator.init();
  }
});
