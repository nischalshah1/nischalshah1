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

  // ── Ursa Major (Big Dipper) + Ursa Minor (Little Dipper) ──
  // Normalised 0–1 coords, matching the reference image layout:
  // Ursa Major fills the lower-left, Ursa Minor upper-right,
  // with Dubhe (UMa tip) connecting up toward Polaris (UMi tail).

  // ── Cassiopeia — proper W shape ──
  const STARS_DEF = [
    { x: 0.10, y: 0.60, name: 'Caph',      r: 2.6 }, // 0  far left
    { x: 0.30, y: 0.35, name: 'Schedar',   r: 3.2 }, // 1  up
    { x: 0.50, y: 0.55, name: 'Gamma Cas', r: 3.8 }, // 2  down (centre)
    { x: 0.70, y: 0.30, name: 'Ruchbah',   r: 2.8 }, // 3  up
    { x: 0.90, y: 0.55, name: 'Segin',     r: 2.4 }, // 4  far right
  ];

  const EDGES_DEF = [
    [0, 1], [1, 2], [2, 3], [3, 4],
  ];

  // timings (ms)
  const STAR_INTERVAL  = 120;
  const STAR_FADE_DUR  = 300;
  const LINE_DELAY     = 80;
  const LINE_DUR       = 300;
  const HOLD_MS        = 1800;
  const FADE_OUT_MS    = 900;

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
  let fadingOut = false;
  let currentPageKey = 'home';

  /* ── Netflix-style text reveal ── */
  function startNetflixText(text) {
    if (!labelEl) return;
    labelEl.innerHTML = '';
    labelEl.style.opacity = '1';
    labelEl.style.transform = 'none';
    labelEl.style.perspective = '800px';

    // Split into letters
    const letters = [...text];
    letters.forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.cssText = `
        display: inline-block;
        opacity: 0;
        transform: scale(4) translateZ(120px);
        filter: blur(12px) brightness(3);
        text-shadow: 0 0 40px var(--accent), 0 0 80px var(--accent);
        transition:
          opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms,
          transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms,
          filter 0.6s ease ${i * 80}ms,
          text-shadow 0.6s ease ${i * 80}ms;
      `;
      labelEl.appendChild(span);

      // Trigger zoom-in on next frame
      requestAnimationFrame(() => requestAnimationFrame(() => {
        span.style.opacity = '1';
        span.style.transform = 'scale(1) translateZ(0)';
        span.style.filter = 'blur(0) brightness(1.4)';
        span.style.textShadow = '0 0 20px var(--accent), 0 0 40px var(--accent)';
      }));
    });

    // After fully revealed, fade out the whole label with the overlay
    // (no need for separate dissolve — overlay itself fades)
  }

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
    const scale = Math.min(W, H) * 0.72;
    const ox = W * 0.50, oy = H * 0.44;

    stars = STARS_DEF.map(s => ({
      x: ox + (s.x - 0.3) * scale,
      y: oy + (s.y - 0.5) * scale,
      r: (s.r || 2) * Math.min(W, H) / 700,
      alpha: 0,
      born: null,
    }));

    edges = EDGES_DEF.map(([a, b]) => ({
      a, b,
      progress: 0,
      born: null,
    }));

    // Lots of small background stars for atmosphere
    bgStars = Array.from({ length: 320 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.0 + 0.1,
      base: Math.random() * 0.22 + 0.04,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 1.3 + 0.3,
    }));
  }

  /* ── draw one frame ── */
  function drawFrame(now) {
    ctx.clearRect(0, 0, W, H);
    const [r, g, b] = accentRGB();

    // background twinkle stars
    for (const s of bgStars) {
      const a = s.base + 0.10 * Math.sin(now * 0.001 * s.speed + s.phase);
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
      g2.addColorStop(0.5, `rgba(${r},${g},${b},${la * 1.6})`);
      g2.addColorStop(1,   `rgba(${r},${g},${b},${la})`);
      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = g2;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // constellation stars
    for (const s of stars) {
      if (!s.born) continue;
      const t = Math.min(1, (now - s.born) / STAR_FADE_DUR);
      s.alpha = easeOut(t);
      if (s.alpha <= 0) continue;

      // glow halo
      const glowRadius = s.r * 5.5;
      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowRadius);
      grd.addColorStop(0, `rgba(${r},${g},${b},${s.alpha * 0.45})`);
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

    // Phase 2 — draw lines
    if (allStarsDone && !allEdgesDone) {
      const linesBase = (stars.length - 1) * STAR_INTERVAL + 100;
      edges.forEach((e, i) => {
        if (!e.born && elapsed >= linesBase + i * LINE_DELAY) e.born = now;
      });
      const lastLineEnd = linesBase + (edges.length - 1) * LINE_DELAY + LINE_DUR;
      if (elapsed >= lastLineEnd) allEdgesDone = true;
    }

    // Phase 3 — hold then Netflix-style text + fade out
    if (allEdgesDone && !fadingOut) {
      if (!holdStart) {
        holdStart = now;
        // Trigger Netflix-style letter-by-letter reveal
        startNetflixText(PAGE_LABELS[currentPageKey] || '');
      }
      if (now - holdStart >= HOLD_MS) {
        fadingOut = true;
        overlay.classList.add('cl-hidden');
        setTimeout(() => {
          overlay.style.display = 'none';
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        }, FADE_OUT_MS + 50);
      }
    }

    drawFrame(now);
    if (!fadingOut || (holdStart && now - holdStart < HOLD_MS + FADE_OUT_MS)) {
      rafId = requestAnimationFrame(tick);
    }
  }

  /* ── public: play the loader ── */
  function play(pageKey) {
    if (!overlay && !setup()) return;

    // cancel any running animation
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    // reset state
    sequenceStart = null;
    allStarsDone  = false;
    allEdgesDone  = false;
    holdStart     = null;
    fadingOut     = false;
    currentPageKey = pageKey;

    // reset label
    if (labelEl) { labelEl.innerHTML = ''; labelEl.style.opacity = '0'; }

    resize();
    buildScene();

    // make overlay visible
    overlay.style.display = 'flex';
    overlay.classList.remove('cl-hidden', 'cl-label-in');

    // force reflow so CSS transitions reset properly
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
  // small delay so overlay is visible before page content switches
  setTimeout(() => _origShowPage(page), 80);
};

// ── Play on initial page load ──
window.addEventListener('DOMContentLoaded', () => {
  ConstellationLoader.play('home');
});


// ====== STARFIELD CANVAS ======
const starfieldInstances = {};

function startStarfield(canvasId) {
  if (starfieldInstances[canvasId]) return;
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
  const lf = document.getElementById('auth-login-form');
  const rf = document.getElementById('auth-register-form');
  const tl = document.getElementById('tab-login');
  const tr = document.getElementById('tab-register');
  const pill = document.getElementById('auth-pill-bg');

  if (tab === 'login') {
    lf.style.display = ''; rf.style.display = 'none';
    tl.classList.add('active'); tr.classList.remove('active');
    if (pill) pill.classList.remove('right');
    document.getElementById('login-error').style.display = 'none';
  } else {
    lf.style.display = 'none'; rf.style.display = '';
    tl.classList.remove('active'); tr.classList.add('active');
    if (pill) pill.classList.add('right');
    document.getElementById('reg-error').style.display = 'none';
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

// ====== LOGIN ======
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

// ====== NEWSPAPER: SELECT STORY ======
function selectPost(id) {
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
  count.textContent = comments.length + (comments.length === 1 ? ' Comment' : ' Comments');

  if (comments.length === 0) {
    list.innerHTML = '';
    list.style.background = 'none';
    return;
  }
  list.style.background = 'var(--border)';
  list.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-header">
        <div class="comment-avatar">${escHtml(c.author.charAt(0))}</div>
        <span class="comment-author">${escHtml(c.author)}</span>
        <span class="comment-date">${formatDate(c.date)}</span>
      </div>
      <div class="comment-text">${escHtml(c.text)}</div>
    </div>
  `).join('');
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
// GAMES HUB — Tab switcher
// ====================================================
function switchGame(name) {
  document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.getElementById('game-' + name).classList.add('active');
}

// ====================================================
// GAME 1 — STAR MAPPER
// Player sees stars appear one by one and must click
// them in the correct constellation order.
// ====================================================
const StarMapper = (function () {

  const CONSTELLATIONS = [
    {
      name: 'Cassiopeia',
      stars: [
        { x: 0.12, y: 0.52 },
        { x: 0.30, y: 0.32 },
        { x: 0.50, y: 0.50 },
        { x: 0.70, y: 0.30 },
        { x: 0.88, y: 0.50 },
      ],
      edges: [[0,1],[1,2],[2,3],[3,4]],
    },
    {
      name: 'Orion Belt',
      stars: [
        { x: 0.25, y: 0.50 },
        { x: 0.50, y: 0.45 },
        { x: 0.75, y: 0.50 },
        { x: 0.22, y: 0.30 },
        { x: 0.78, y: 0.30 },
        { x: 0.30, y: 0.72 },
        { x: 0.72, y: 0.72 },
      ],
      edges: [[0,1],[1,2],[3,0],[2,4],[0,5],[2,6]],
    },
    {
      name: 'Big Dipper',
      stars: [
        { x: 0.10, y: 0.75 },
        { x: 0.24, y: 0.70 },
        { x: 0.26, y: 0.55 },
        { x: 0.12, y: 0.60 },
        { x: 0.05, y: 0.47 },
        { x: 0.00, y: 0.36 },
        { x: 0.06, y: 0.25 },
      ],
      edges: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
    },
    {
      name: 'Southern Cross',
      stars: [
        { x: 0.50, y: 0.20 },
        { x: 0.50, y: 0.80 },
        { x: 0.20, y: 0.50 },
        { x: 0.80, y: 0.50 },
        { x: 0.62, y: 0.35 },
      ],
      edges: [[0,1],[2,3],[0,4]],
    },
    {
      name: 'Leo',
      stars: [
        { x: 0.25, y: 0.55 },
        { x: 0.35, y: 0.38 },
        { x: 0.50, y: 0.33 },
        { x: 0.62, y: 0.42 },
        { x: 0.58, y: 0.58 },
        { x: 0.40, y: 0.65 },
        { x: 0.82, y: 0.50 },
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[3,6]],
    },
  ];

  let canvas, ctx, W, H;
  let raf, gameActive = false;
  let constellation, stars, edges;
  let nextToClick = 0;
  let score = 0, timeLeft = 60;
  let timerInterval;
  let completedEdges = [];
  let bgStars = [];
  let clickFlashes = [];
  let wrongFlash = 0;
  let correctFlash = 0;
  let round = 0;

  function init() {
    canvas = document.getElementById('sm-canvas');
    if (!canvas) return false;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', onCanvasClick);
    return true;
  }

  function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width  = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
    if (constellation) buildStars();
  }

  function buildBgStars() {
    bgStars = Array.from({ length: 180 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 0.9 + 0.1,
      a: Math.random() * 0.3 + 0.05,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() + 0.3,
    }));
  }

  function buildStars() {
    const pad = 60;
    stars = constellation.stars.map((s, i) => ({
      x: pad + s.x * (W - pad * 2),
      y: pad + s.y * (H - pad * 2),
      r: 6,
      alpha: 0,
      born: null,
      index: i,
      clicked: false,
    }));
    edges = constellation.edges.map(([a, b]) => ({ a, b, drawn: false, progress: 0 }));
    completedEdges = [];
  }

  function pickConstellation() {
    const idx = round % CONSTELLATIONS.length;
    constellation = CONSTELLATIONS[idx];
    round++;
    document.getElementById('sm-name').textContent = constellation.name;
    nextToClick = 0;
    buildStars();
  }

  function startRound() {
    pickConstellation();
    // Reveal stars one by one
    stars.forEach((s, i) => {
      setTimeout(() => { s.born = performance.now(); }, i * 300 + 500);
    });
    updateStarsLeft();
  }

  function updateStarsLeft() {
    const rem = stars.filter(s => !s.clicked).length;
    document.getElementById('sm-stars-left').textContent = rem;
  }

  function onCanvasClick(e) {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const cx = mx * scaleX, cy = my * scaleY;

    // Check if clicked the next expected star
    const expected = stars[nextToClick];
    if (!expected || !expected.born) return;

    const dist = Math.hypot(cx - expected.x, cy - expected.y);
    if (dist < 28) {
      // Correct!
      expected.clicked = true;
      correctFlash = 1;
      clickFlashes.push({ x: expected.x, y: expected.y, alpha: 1, r: 8 });

      // Draw edges connecting to this star
      edges.forEach(edge => {
        if (!edge.drawn &&
          ((edge.a === nextToClick && stars[edge.b].clicked) ||
           (edge.b === nextToClick && stars[edge.a].clicked))) {
          edge.drawn = true;
          completedEdges.push({ ...edge, progress: 0, born: performance.now() });
        }
      });
      // Also start edges where the other star is next to be clicked
      edges.forEach(edge => {
        if (!edge.drawn && (edge.a === nextToClick || edge.b === nextToClick)) {
          const other = edge.a === nextToClick ? edge.b : edge.a;
          if (stars[other].clicked) {
            edge.drawn = true;
            completedEdges.push({ ...edge, progress: 0, born: performance.now() });
          }
        }
      });

      nextToClick++;
      score += 10;
      document.getElementById('sm-score').textContent = score;
      updateStarsLeft();

      if (nextToClick >= stars.length) {
        // All stars clicked — next constellation
        score += Math.floor(timeLeft * 2);
        document.getElementById('sm-score').textContent = score;
        setTimeout(() => {
          startRound();
        }, 1200);
      }
    } else {
      // Wrong click — check if they clicked a wrong star
      const anyStarHit = stars.some(s => s.born && !s.clicked && Math.hypot(cx - s.x, cy - s.y) < 28);
      if (anyStarHit) {
        wrongFlash = 1;
        score = Math.max(0, score - 5);
        document.getElementById('sm-score').textContent = score;
      }
    }
  }

  function drawFrame(now) {
    ctx.clearRect(0, 0, W, H);
    const [r, g, b] = [232, 213, 163];

    // Bg stars
    for (const s of bgStars) {
      const a = s.a + 0.08 * Math.sin(now * 0.001 * s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fill();
    }

    // Wrong flash
    if (wrongFlash > 0) {
      wrongFlash -= 0.05;
      ctx.fillStyle = `rgba(200,60,60,${wrongFlash * 0.15})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Completed edges
    for (const e of completedEdges) {
      const t = Math.min(1, (now - e.born) / 400);
      e.progress = 1 - Math.pow(1 - t, 3);
      const sa = stars[e.a], sb = stars[e.b];
      const ex = sa.x + (sb.x - sa.x) * e.progress;
      const ey = sa.y + (sb.y - sa.y) * e.progress;
      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Stars
    for (const s of stars) {
      if (!s.born) continue;
      const t = Math.min(1, (now - s.born) / 500);
      s.alpha = 1 - Math.pow(1 - t, 3);

      const pulse = s.clicked ? 0 : 0.15 * Math.sin(now * 0.003 + s.index);
      const rr = s.r + pulse;

      // Glow
      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rr * 5);
      grd.addColorStop(0, `rgba(${r},${g},${b},${s.alpha * (s.clicked ? 0.15 : 0.3)})`);
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(s.x, s.y, rr * 5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(s.x, s.y, rr, 0, Math.PI * 2);
      ctx.fillStyle = s.clicked
        ? `rgba(${r},${g},${b},${s.alpha * 0.4})`
        : `rgba(${r},${g},${b},${s.alpha})`;
      ctx.fill();

      // Order number
      if (!s.clicked) {
        ctx.fillStyle = `rgba(${r},${g},${b},${s.alpha * 0.6})`;
        ctx.font = `${Math.round(9 * (W / 600))}px "DM Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.index + 1, s.x, s.y - rr - 10);
      }

      // Highlight next target
      if (s.index === nextToClick && !s.clicked && s.born) {
        const pulse2 = 0.5 + 0.5 * Math.sin(now * 0.005);
        ctx.beginPath();
        ctx.arc(s.x, s.y, rr + 8 + pulse2 * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.5 * pulse2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Click flashes
    clickFlashes = clickFlashes.filter(f => f.alpha > 0);
    for (const f of clickFlashes) {
      f.alpha -= 0.04; f.r += 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${f.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function tick(now) {
    if (!gameActive) return;
    drawFrame(now);
    raf = requestAnimationFrame(tick);
  }

  function endGame(reason) {
    gameActive = false;
    clearInterval(timerInterval);
    if (raf) { cancelAnimationFrame(raf); raf = null; }

    const icon = document.getElementById('sm-result-icon');
    const title = document.getElementById('sm-result-title');
    const desc = document.getElementById('sm-result-desc');
    const gameover = document.getElementById('sm-gameover');

    icon.textContent = score > 50 ? '🌟' : '✦';
    title.textContent = score > 100 ? 'Stellar!' : score > 50 ? 'Nice Work!' : 'Keep Stargazing';
    desc.textContent = `You mapped ${round - 1} constellation${round - 1 !== 1 ? 's' : ''} and scored ${score} points.`;
    gameover.style.display = 'flex';
  }

  function start() {
    if (!canvas && !init()) return;
    // hide overlays
    document.getElementById('sm-overlay').style.display = 'none';
    document.getElementById('sm-gameover').style.display = 'none';

    // reset
    score = 0; timeLeft = 60; round = 0; gameActive = true;
    clickFlashes = []; wrongFlash = 0; completedEdges = [];
    document.getElementById('sm-score').textContent = '0';
    document.getElementById('sm-time').textContent = '60';

    buildBgStars();
    startRound();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      document.getElementById('sm-time').textContent = timeLeft;
      if (timeLeft <= 0) endGame('time');
    }, 1000);

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  return { start };
})();

function startStarMapper() { StarMapper.start(); }


// ====================================================
// GAME 2 — ASTEROID DEFENDER
// Asteroids fall from space. Click them to observe.
// Miss 3 and Earth is doomed.
// ====================================================
const AsteroidDefender = (function () {

  let canvas, ctx, W, H;
  let raf, gameActive = false;
  let score = 0, missed = 0, level = 1;
  let asteroids = [], particles = [], bgStars = [];
  let spawnInterval, spawnRate = 2200;
  let frameCount = 0;

  const MAX_MISS = 3;

  function init() {
    canvas = document.getElementById('ad-canvas');
    if (!canvas) return false;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    return true;
  }

  function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width  = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
    buildBg();
  }

  function buildBg() {
    bgStars = Array.from({ length: 160 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 0.8 + 0.1,
      a: Math.random() * 0.25 + 0.05,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() + 0.3,
    }));
  }

  function spawnAsteroid() {
    const size = 10 + Math.random() * 18 + level * 2;
    const speed = (0.8 + Math.random() * 0.8 + level * 0.15) * (H / 420);
    const x = size + Math.random() * (W - size * 2);
    const drift = (Math.random() - 0.5) * 0.4;
    const sides = 5 + Math.floor(Math.random() * 4);
    const offsets = Array.from({ length: sides }, () => 0.75 + Math.random() * 0.5);
    asteroids.push({ x, y: -size, size, speed, drift, sides, offsets, alpha: 0, rot: 0, rotSpeed: (Math.random() - 0.5) * 0.04, clicked: false, clickAlpha: 1 });
  }

  function onClick(e) {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    handleHit((e.clientX - rect.left) * (W / rect.width), (e.clientY - rect.top) * (H / rect.height));
  }
  function onTouch(e) {
    if (!gameActive) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    handleHit((t.clientX - rect.left) * (W / rect.width), (t.clientY - rect.top) * (H / rect.height));
  }

  function handleHit(cx, cy) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.clicked) continue;
      if (Math.hypot(cx - a.x, cy - a.y) < a.size * 1.5) {
        // Hit!
        a.clicked = true;
        score++;
        document.getElementById('ad-score').textContent = score;
        // Level up every 10
        if (score % 10 === 0) {
          level++;
          spawnRate = Math.max(700, spawnRate - 180);
          resetSpawnInterval();
          document.getElementById('ad-level').textContent = level;
        }
        // Spawn particles
        for (let p = 0; p < 12; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 3;
          particles.push({ x: a.x, y: a.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 1.5 + Math.random() * 3, alpha: 1, color: Math.random() > 0.5 ? '#e8d5a3' : '#c4956a' });
        }
        break;
      }
    }
  }

  function resetSpawnInterval() {
    clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnAsteroid, spawnRate);
  }

  function drawAsteroid(a, now) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.globalAlpha = a.alpha * (a.clicked ? a.clickAlpha : 1);

    const col = a.clicked ? '#e8d5a3' : '#8a9bb5';
    ctx.beginPath();
    for (let i = 0; i < a.sides; i++) {
      const angle = (i / a.sides) * Math.PI * 2;
      const rr = a.size * a.offsets[i];
      const px = Math.cos(angle) * rr, py = Math.sin(angle) * rr;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = col + '33';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Glow when clicked
    if (a.clicked) {
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, a.size * 2.5);
      grd.addColorStop(0, `rgba(232,213,163,${0.4 * a.clickAlpha})`);
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(0, 0, a.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    ctx.restore();
  }

  function drawFrame(now) {
    ctx.clearRect(0, 0, W, H);

    // Earth glow at bottom
    const earthGrd = ctx.createRadialGradient(W / 2, H + 30, 0, W / 2, H + 30, W * 0.6);
    earthGrd.addColorStop(0, 'rgba(30,80,160,0.35)');
    earthGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = earthGrd;
    ctx.fillRect(0, 0, W, H);

    // Bg stars
    for (const s of bgStars) {
      const a = s.a + 0.06 * Math.sin(now * 0.001 * s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,213,163,${a})`;
      ctx.fill();
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.05;
      p.alpha -= 0.03;
      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.rot += a.rotSpeed;
      a.alpha = Math.min(1, a.alpha + 0.04);

      if (a.clicked) {
        a.clickAlpha -= 0.05;
        if (a.clickAlpha <= 0) { asteroids.splice(i, 1); continue; }
      } else {
        a.y += a.speed;
        a.x += a.drift;
        if (a.y > H + a.size) {
          // Missed!
          asteroids.splice(i, 1);
          missed++;
          const livesEl = document.getElementById('ad-missed').parentElement.querySelector('.game-info-val');
          document.getElementById('ad-missed').textContent = missed;
          const lives = MAX_MISS - missed;
          document.getElementById('ad-lives').textContent = '🔭'.repeat(Math.max(0, lives));
          if (missed >= MAX_MISS) { endGame(); return; }
          continue;
        }
      }

      drawAsteroid(a, now);
    }

    // Danger line at bottom
    ctx.strokeStyle = 'rgba(30,80,160,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(0, H - 2);
    ctx.lineTo(W, H - 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(30,80,160,0.5)';
    ctx.font = '9px "DM Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('EARTH ATMOSPHERE', 6, H - 4);
  }

  function tick(now) {
    if (!gameActive) return;
    drawFrame(now);
    raf = requestAnimationFrame(tick);
  }

  function endGame() {
    gameActive = false;
    clearInterval(spawnInterval);
    if (raf) { cancelAnimationFrame(raf); raf = null; }

    document.getElementById('ad-result-desc').textContent =
      `You observed ${score} asteroid${score !== 1 ? 's' : ''} across ${level} level${level !== 1 ? 's' : ''} before the telescopes went dark.`;
    document.getElementById('ad-gameover').style.display = 'flex';
  }

  function start() {
    if (!canvas && !init()) return;

    document.getElementById('ad-overlay').style.display = 'none';
    document.getElementById('ad-gameover').style.display = 'none';

    score = 0; missed = 0; level = 1; spawnRate = 2200;
    asteroids = []; particles = []; gameActive = true;

    document.getElementById('ad-score').textContent = '0';
    document.getElementById('ad-missed').textContent = '0';
    document.getElementById('ad-level').textContent = '1';
    document.getElementById('ad-lives').textContent = '🔭🔭🔭';

    buildBg();
    clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnAsteroid, spawnRate);
    spawnAsteroid(); // spawn one immediately

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  return { start };
})();

function startAsteroidDefender() { AsteroidDefender.start(); }

// ====================================================
// GAMES MODULE
// Game 1: Star Mapper — connect constellation dots
// Game 3: Asteroid Defender — click to observe asteroids
// ====================================================
const Games = (function () {

  let currentGame = null;

  function open(gameId) {
    const hub = document.getElementById('games-hub');
    const container = document.getElementById('game-container');
    if (!hub || !container) return;
    hub.style.display = 'none';
    container.style.display = 'block';
    container.innerHTML = '';
    currentGame = gameId;
    if (gameId === 'starmapper') startStarMapper(container);
    if (gameId === 'asteroid')  startAsteroidDefender(container);
  }

  function back() {
    if (currentGame === 'starmapper') stopStarMapper();
    if (currentGame === 'asteroid')  stopAsteroid();
    currentGame = null;
    const hub = document.getElementById('games-hub');
    const container = document.getElementById('game-container');
    if (hub) hub.style.display = '';
    if (container) { container.style.display = 'none'; container.innerHTML = ''; }
  }

  // ====================================================
  // GAME 1: STAR MAPPER
  // A constellation is shown as unlabelled dots.
  // Player clicks dots in correct order to draw lines.
  // ====================================================
  const CONSTELLATIONS = [
    {
      name: 'Cassiopeia',
      hint: 'The Queen — shaped like a W',
      stars: [
        { x: 0.12, y: 0.55, label: 'Caph' },
        { x: 0.30, y: 0.32, label: 'Schedar' },
        { x: 0.50, y: 0.50, label: 'Gamma Cas' },
        { x: 0.70, y: 0.28, label: 'Ruchbah' },
        { x: 0.88, y: 0.50, label: 'Segin' },
      ],
      order: [0, 1, 2, 3, 4],
    },
    {
      name: 'Orion\'s Belt',
      hint: 'The Hunter\'s Belt — three stars in a row',
      stars: [
        { x: 0.25, y: 0.50, label: 'Alnitak' },
        { x: 0.50, y: 0.50, label: 'Alnilam' },
        { x: 0.75, y: 0.50, label: 'Mintaka' },
      ],
      order: [0, 1, 2],
    },
    {
      name: 'Big Dipper',
      hint: 'The Plough — a bowl with a handle',
      stars: [
        { x: 0.12, y: 0.75, label: 'Phad' },
        { x: 0.28, y: 0.70, label: 'Merak' },
        { x: 0.28, y: 0.52, label: 'Dubhe' },
        { x: 0.12, y: 0.57, label: 'Megrez' },
        { x: 0.42, y: 0.42, label: 'Alioth' },
        { x: 0.58, y: 0.30, label: 'Mizar' },
        { x: 0.74, y: 0.22, label: 'Alkaid' },
      ],
      order: [0, 1, 2, 3, 0, 3, 4, 5, 6],
    },
    {
      name: 'Southern Cross',
      hint: 'Crux — a cross pointing south',
      stars: [
        { x: 0.50, y: 0.18, label: 'Gacrux' },
        { x: 0.50, y: 0.82, label: 'Acrux' },
        { x: 0.22, y: 0.50, label: 'Mimosa' },
        { x: 0.78, y: 0.50, label: 'Delta Cru' },
      ],
      order: [0, 1, 2, 3],
    },
  ];

  let smCanvas, smCtx, smData = null, smRaf = null;

  function stopStarMapper() {
    if (smRaf) { cancelAnimationFrame(smRaf); smRaf = null; }
  }

  function startStarMapper(container) {
    container.innerHTML = `
      <div class="game-wrap">
        <div class="game-topbar">
          <button class="game-back-btn" onclick="Games.back()">← Back</button>
          <div class="game-title-bar">⭐ Star Mapper</div>
          <div class="game-score-display">Score: <span id="sm-score">0</span></div>
        </div>
        <div class="game-info-bar">
          <span id="sm-constellation-name">—</span>
          <span class="game-hint" id="sm-hint">—</span>
          <span id="sm-progress">Click stars in order</span>
        </div>
        <canvas id="sm-canvas" class="game-canvas"></canvas>
        <div class="game-message" id="sm-message"></div>
      </div>
    `;

    smCanvas = document.getElementById('sm-canvas');
    smCtx = smCanvas.getContext('2d');

    function resize() {
      const wrap = smCanvas.parentElement;
      smCanvas.width  = wrap.clientWidth;
      smCanvas.height = wrap.clientHeight - 110;
    }
    resize();
    window.addEventListener('resize', resize);

    smData = {
      score: 0,
      round: 0,
      bgStars: [],
      constellation: null,
      stars: [],
      nextIdx: 0,
      drawnLines: [],
      phase: 'playing', // playing | success | fail
      particles: [],
      pulseTime: 0,
    };

    smData.bgStars = Array.from({ length: 180 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.3 + 0.05,
      speed: Math.random() * 0.8 + 0.3,
      phase: Math.random() * Math.PI * 2,
    }));

    loadSMRound();

    smCanvas.addEventListener('click', onSMClick);
    smRaf = requestAnimationFrame(smLoop);
  }

  function loadSMRound() {
    const d = smData;
    const c = CONSTELLATIONS[d.round % CONSTELLATIONS.length];
    d.constellation = c;
    d.nextIdx = 0;
    d.drawnLines = [];
    d.phase = 'playing';
    d.particles = [];
    d.stars = c.stars.map((s, i) => ({
      ...s,
      px: s.x * smCanvas.width,
      py: s.y * smCanvas.height,
      r: 7, alpha: 1, hit: false, idx: i,
    }));
    document.getElementById('sm-constellation-name').textContent = c.name;
    document.getElementById('sm-hint').textContent = '🔭 ' + c.hint;
    document.getElementById('sm-progress').textContent = `Step 1 of ${c.order.length}`;
    document.getElementById('sm-message').textContent = '';
  }

  function onSMClick(e) {
    const d = smData;
    if (d.phase !== 'playing') return;
    const rect = smCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const targetIdx = d.constellation.order[d.nextIdx];
    const target = d.stars[targetIdx];
    const dist = Math.hypot(mx - target.px, my - target.py);

    if (dist < 30) {
      // Correct!
      if (d.nextIdx > 0) {
        const prevIdx = d.constellation.order[d.nextIdx - 1];
        d.drawnLines.push({ a: d.stars[prevIdx], b: target, alpha: 0 });
      }
      target.hit = true;
      spawnParticles(d, target.px, target.py, '#e8d5a3');
      d.nextIdx++;

      if (d.nextIdx >= d.constellation.order.length) {
        // Done!
        d.phase = 'success';
        d.score += 100 + d.constellation.stars.length * 10;
        document.getElementById('sm-score').textContent = d.score;
        document.getElementById('sm-message').textContent = '✦ Constellation mapped! +' + (100 + d.constellation.stars.length * 10) + ' pts';
        document.getElementById('sm-message').className = 'game-message success';
        setTimeout(() => { d.round++; loadSMRound(); }, 2000);
      } else {
        document.getElementById('sm-progress').textContent = `Step ${d.nextIdx + 1} of ${d.constellation.order.length}`;
      }
    } else {
      // Check if any wrong star was clicked
      for (const s of d.stars) {
        if (Math.hypot(mx - s.px, my - s.py) < 28) {
          spawnParticles(d, mx, my, '#c0392b');
          document.getElementById('sm-message').textContent = '✗ Wrong star! Try again.';
          document.getElementById('sm-message').className = 'game-message fail';
          setTimeout(() => {
            if (document.getElementById('sm-message'))
              document.getElementById('sm-message').textContent = '';
          }, 800);
          break;
        }
      }
    }
  }

  function spawnParticles(d, x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 0.5;
      d.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
    }
  }

  function smLoop(now) {
    const d = smData;
    if (!smCtx) return;
    const W = smCanvas.width, H = smCanvas.height;
    smCtx.clearRect(0, 0, W, H);

    // bg stars
    for (const s of d.bgStars) {
      const a = s.alpha + 0.06 * Math.sin(now * 0.001 * s.speed + s.phase);
      smCtx.beginPath();
      smCtx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      smCtx.fillStyle = `rgba(232,213,163,${a})`;
      smCtx.fill();
    }

    // drawn lines
    for (const l of d.drawnLines) {
      l.alpha = Math.min(1, l.alpha + 0.06);
      smCtx.beginPath();
      smCtx.moveTo(l.a.px, l.a.py);
      smCtx.lineTo(l.b.px, l.b.py);
      smCtx.strokeStyle = `rgba(232,213,163,${l.alpha * 0.7})`;
      smCtx.lineWidth = 1.5;
      smCtx.stroke();
    }

    // stars
    const nextTargetIdx = d.constellation ? d.constellation.order[d.nextIdx] : -1;
    for (const s of d.stars) {
      const isNext = s.idx === nextTargetIdx && d.phase === 'playing';
      const pulse = isNext ? 1 + 0.3 * Math.sin(now * 0.005) : 1;
      const r = s.r * pulse;

      // glow
      const grd = smCtx.createRadialGradient(s.px, s.py, 0, s.px, s.py, r * 5);
      grd.addColorStop(0, s.hit ? 'rgba(232,213,163,0.5)' : isNext ? 'rgba(232,213,163,0.35)' : 'rgba(232,213,163,0.12)');
      grd.addColorStop(1, 'rgba(232,213,163,0)');
      smCtx.beginPath();
      smCtx.arc(s.px, s.py, r * 5, 0, Math.PI * 2);
      smCtx.fillStyle = grd;
      smCtx.fill();

      smCtx.beginPath();
      smCtx.arc(s.px, s.py, r, 0, Math.PI * 2);
      smCtx.fillStyle = s.hit ? '#e8d5a3' : isNext ? 'rgba(232,213,163,0.9)' : 'rgba(232,213,163,0.5)';
      smCtx.fill();

      // Next star hint ring
      if (isNext) {
        smCtx.beginPath();
        smCtx.arc(s.px, s.py, r * 3 + 4 * Math.sin(now * 0.004), 0, Math.PI * 2);
        smCtx.strokeStyle = 'rgba(232,213,163,0.3)';
        smCtx.lineWidth = 1;
        smCtx.stroke();
      }
    }

    // particles
    d.particles = d.particles.filter(p => p.life > 0);
    for (const p of d.particles) {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.05;
      p.life -= 0.04;
      smCtx.beginPath();
      smCtx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
      smCtx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2,'0');
      smCtx.fill();
    }

    smRaf = requestAnimationFrame(smLoop);
  }

  // ====================================================
  // GAME 3: ASTEROID DEFENDER
  // Asteroids fall from the top; click them before they hit.
  // ====================================================
  let adCanvas, adCtx, adData = null, adRaf = null;

  function stopAsteroid() {
    if (adRaf) { cancelAnimationFrame(adRaf); adRaf = null; }
  }

  function startAsteroidDefender(container) {
    container.innerHTML = `
      <div class="game-wrap">
        <div class="game-topbar">
          <button class="game-back-btn" onclick="Games.back()">← Back</button>
          <div class="game-title-bar">☄️ Asteroid Defender</div>
          <div class="game-score-display">Score: <span id="ad-score">0</span></div>
        </div>
        <div class="game-info-bar">
          <span>❤️ <span id="ad-lives">3</span> lives remaining</span>
          <span id="ad-level-label">Level 1</span>
          <span id="ad-combo"></span>
        </div>
        <canvas id="ad-canvas" class="game-canvas"></canvas>
        <div class="game-message" id="ad-message"></div>
      </div>
    `;

    adCanvas = document.getElementById('ad-canvas');
    adCtx = adCanvas.getContext('2d');

    function resize() {
      const wrap = adCanvas.parentElement;
      adCanvas.width  = wrap.clientWidth;
      adCanvas.height = wrap.clientHeight - 110;
    }
    resize();
    window.addEventListener('resize', resize);

    adData = {
      score: 0,
      lives: 3,
      level: 1,
      asteroids: [],
      explosions: [],
      bgStars: [],
      combo: 0,
      lastClick: 0,
      spawnTimer: 0,
      spawnRate: 120, // frames
      gameOver: false,
      telescope: { x: 0.5, targetX: 0.5 },
      beams: [],
    };

    adData.bgStars = Array.from({ length: 200 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.1 + 0.15,
      alpha: Math.random() * 0.25 + 0.05,
      speed: Math.random() * 0.6 + 0.3,
      phase: Math.random() * Math.PI * 2,
    }));

    adCanvas.addEventListener('click', onADClick);
    adCanvas.addEventListener('mousemove', e => {
      const rect = adCanvas.getBoundingClientRect();
      adData.telescope.targetX = (e.clientX - rect.left) / adCanvas.width;
    });

    adRaf = requestAnimationFrame(adLoop);
  }

  function onADClick(e) {
    const d = adData;
    if (d.gameOver) { restartAD(); return; }
    const rect = adCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let hit = false;
    for (let i = d.asteroids.length - 1; i >= 0; i--) {
      const a = d.asteroids[i];
      if (Math.hypot(mx - a.x, my - a.y) < a.r + 12) {
        // Hit!
        d.asteroids.splice(i, 1);
        spawnExplosion(d, a.x, a.y, a.r);
        const now = Date.now();
        if (now - d.lastClick < 800) d.combo++;
        else d.combo = 1;
        d.lastClick = now;
        const pts = 10 * d.level * Math.min(d.combo, 5);
        d.score += pts;
        document.getElementById('ad-score').textContent = d.score;
        document.getElementById('ad-combo').textContent = d.combo > 1 ? `🔥 x${d.combo} Combo!` : '';
        // beam flash
        d.beams.push({ x: a.x, y: a.y, life: 1 });
        hit = true;
        break;
      }
    }
    if (!hit) d.combo = 0;
  }

  function restartAD() {
    const d = adData;
    d.score = 0; d.lives = 3; d.level = 1; d.combo = 0;
    d.asteroids = []; d.explosions = []; d.beams = [];
    d.spawnRate = 120; d.gameOver = false;
    d.spawnTimer = 0;
    document.getElementById('ad-score').textContent = '0';
    document.getElementById('ad-lives').textContent = '3';
    document.getElementById('ad-level-label').textContent = 'Level 1';
    document.getElementById('ad-message').textContent = '';
  }

  function spawnExplosion(d, x, y, r) {
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const speed = Math.random() * 3 + 1;
      d.explosions.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        r: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#e8d5a3' : '#c4956a',
      });
    }
  }

  let adFrame = 0;
  function adLoop(now) {
    const d = adData;
    if (!adCtx) return;
    const W = adCanvas.width, H = adCanvas.height;
    adCtx.clearRect(0, 0, W, H);
    adFrame++;

    // bg stars
    for (const s of d.bgStars) {
      const a = s.alpha + 0.05 * Math.sin(now * 0.001 * s.speed + s.phase);
      adCtx.beginPath();
      adCtx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      adCtx.fillStyle = `rgba(232,213,163,${a})`;
      adCtx.fill();
    }

    if (d.gameOver) {
      adCtx.fillStyle = 'rgba(232,213,163,0.9)';
      adCtx.font = `bold ${Math.min(W,H) * 0.08}px 'Playfair Display', serif`;
      adCtx.textAlign = 'center';
      adCtx.fillText('TELESCOPE DOWN', W / 2, H / 2 - 30);
      adCtx.font = `${Math.min(W,H) * 0.04}px 'DM Mono', monospace`;
      adCtx.fillStyle = 'rgba(232,213,163,0.6)';
      adCtx.fillText(`Final Score: ${d.score}`, W / 2, H / 2 + 20);
      adCtx.fillText('Click to retry', W / 2, H / 2 + 60);
      adRaf = requestAnimationFrame(adLoop);
      return;
    }

    // spawn asteroids
    d.spawnTimer++;
    if (d.spawnTimer >= d.spawnRate) {
      d.spawnTimer = 0;
      const r = Math.random() * 18 + 12;
      d.asteroids.push({
        x: Math.random() * (W - 60) + 30,
        y: -r,
        r,
        speed: (Math.random() * 0.8 + 0.4) * (1 + d.level * 0.15),
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04,
        wobble: Math.random() * Math.PI * 2,
        type: Math.random() > 0.7 ? 'fast' : 'normal',
      });
    }

    // level up
    if (d.score > d.level * 300) {
      d.level++;
      d.spawnRate = Math.max(45, 120 - d.level * 10);
      document.getElementById('ad-level-label').textContent = `Level ${d.level}`;
    }

    // move + draw asteroids
    for (let i = d.asteroids.length - 1; i >= 0; i--) {
      const a = d.asteroids[i];
      a.y += a.speed;
      a.angle += a.spin;

      // Draw rocky asteroid shape
      adCtx.save();
      adCtx.translate(a.x, a.y);
      adCtx.rotate(a.angle);
      adCtx.beginPath();
      const pts = 7;
      for (let j = 0; j < pts; j++) {
        const ang = (j / pts) * Math.PI * 2;
        const jitter = a.r * (0.75 + 0.25 * Math.sin(j * 2.3 + a.wobble));
        if (j === 0) adCtx.moveTo(Math.cos(ang) * jitter, Math.sin(ang) * jitter);
        else adCtx.lineTo(Math.cos(ang) * jitter, Math.sin(ang) * jitter);
      }
      adCtx.closePath();
      adCtx.fillStyle = a.type === 'fast' ? 'rgba(192,57,43,0.8)' : 'rgba(150,130,100,0.85)';
      adCtx.strokeStyle = a.type === 'fast' ? '#ff6b6b' : '#e8d5a3';
      adCtx.lineWidth = 1.5;
      adCtx.fill();
      adCtx.stroke();
      adCtx.restore();

      // Glow
      const grd = adCtx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r * 2.5);
      grd.addColorStop(0, a.type === 'fast' ? 'rgba(192,57,43,0.25)' : 'rgba(232,213,163,0.1)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      adCtx.beginPath();
      adCtx.arc(a.x, a.y, a.r * 2.5, 0, Math.PI * 2);
      adCtx.fillStyle = grd;
      adCtx.fill();

      // Hit ground
      if (a.y > H + a.r) {
        d.asteroids.splice(i, 1);
        d.lives--;
        d.combo = 0;
        document.getElementById('ad-lives').textContent = d.lives;
        document.getElementById('ad-combo').textContent = '';
        if (d.lives <= 0) d.gameOver = true;
      }
    }

    // telescope cursor
    d.telescope.x += (d.telescope.targetX - d.telescope.x) * 0.1;
    const tx = d.telescope.x * W;
    const ty = H - 30;
    adCtx.save();
    adCtx.strokeStyle = 'rgba(232,213,163,0.7)';
    adCtx.lineWidth = 2;
    adCtx.beginPath();
    adCtx.moveTo(tx - 18, ty + 10);
    adCtx.lineTo(tx,      ty - 10);
    adCtx.lineTo(tx + 18, ty + 10);
    adCtx.lineTo(tx - 18, ty + 10);
    adCtx.stroke();
    // scope lens
    adCtx.beginPath();
    adCtx.arc(tx, ty - 10, 6, 0, Math.PI * 2);
    adCtx.fillStyle = 'rgba(232,213,163,0.9)';
    adCtx.fill();
    adCtx.restore();

    // beams
    d.beams = d.beams.filter(b => b.life > 0);
    for (const b of d.beams) {
      adCtx.beginPath();
      adCtx.moveTo(tx, ty - 10);
      adCtx.lineTo(b.x, b.y);
      adCtx.strokeStyle = `rgba(232,213,163,${b.life * 0.6})`;
      adCtx.lineWidth = 1.5;
      adCtx.stroke();
      b.life -= 0.12;
    }

    // explosions
    d.explosions = d.explosions.filter(p => p.life > 0);
    for (const p of d.explosions) {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.08;
      p.life -= 0.035;
      adCtx.beginPath();
      adCtx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      adCtx.fillStyle = p.color + Math.floor(p.life * 200).toString(16).padStart(2,'0');
      adCtx.fill();
    }

    adRaf = requestAnimationFrame(adLoop);
  }

  return { open, back };
})();
