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

// ====== CONSTELLATION ANIMATION ======
(function initConstellation() {
  const canvas = document.getElementById('constellation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Named constellations as relative coordinate sets (0–1 range)
  const CONSTELLATIONS = [
    // Orion-like (7 stars)
    [[0.12,0.18],[0.18,0.22],[0.15,0.30],[0.10,0.38],[0.20,0.38],[0.13,0.46],[0.17,0.46]],
    // Ursa Minor-like (7 stars)
    [[0.72,0.12],[0.78,0.16],[0.82,0.22],[0.76,0.28],[0.70,0.24],[0.66,0.30],[0.60,0.26]],
    // Cassiopeia W-shape (5 stars)
    [[0.35,0.08],[0.42,0.14],[0.50,0.08],[0.58,0.14],[0.65,0.08]],
    // Southern Cross (5 stars)
    [[0.82,0.55],[0.82,0.68],[0.82,0.62],[0.76,0.62],[0.88,0.62]],
    // Scorpius tail (6 stars)
    [[0.20,0.65],[0.25,0.60],[0.30,0.62],[0.35,0.58],[0.38,0.63],[0.36,0.70]],
  ];

  let W, H, stars, mouseX = -999, mouseY = -999;
  let animId;
  let built = false;

  // Build star objects from constellation definitions
  function buildStars() {
    stars = [];
    CONSTELLATIONS.forEach((constellation, ci) => {
      constellation.forEach(([rx, ry], si) => {
        stars.push({
          // base position scaled to canvas
          bx: rx * W,
          by: ry * H,
          // current drifted position
          x: rx * W,
          y: ry * H,
          r: Math.random() * 1.5 + 0.8,
          alpha: Math.random() * 0.4 + 0.5,
          dalpha: (Math.random() - 0.5) * 0.006,
          // slow drift
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          // max wander from base
          wander: 18 + Math.random() * 14,
          constellation: ci,
          idx: si,
          // pulse phase offset
          phase: Math.random() * Math.PI * 2,
        });
      });
    });

    // Add extra background twinkle stars (no connections)
    const extra = Math.floor((W * H) / 9000);
    for (let i = 0; i < extra; i++) {
      stars.push({
        bx: Math.random() * W,
        by: Math.random() * H,
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 0.8 + 0.2,
        alpha: Math.random() * 0.35 + 0.1,
        dalpha: (Math.random() - 0.5) * 0.004,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        wander: 8,
        constellation: -1, // no constellation
        phase: Math.random() * Math.PI * 2,
      });
    }
    built = true;
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
    buildStars();
  }

  // Get accent color from CSS variable
  function getAccentRGB() {
    const s = getComputedStyle(document.body);
    const hex = s.getPropertyValue('--accent').trim();
    if (hex.startsWith('#')) {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return `${r},${g},${b}`;
    }
    return '232,213,163'; // fallback gold
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    if (!built) { animId = requestAnimationFrame(draw); return; }

    const rgb = getAccentRGB();

    // Update star positions (gentle drift, bounce back toward base)
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;

      const dx = s.x - s.bx, dy = s.y - s.by;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > s.wander) {
        // spring back
        s.vx -= dx * 0.0015;
        s.vy -= dy * 0.0015;
      }
      // tiny random nudge
      s.vx += (Math.random() - 0.5) * 0.02;
      s.vy += (Math.random() - 0.5) * 0.02;
      // dampen
      s.vx *= 0.99;
      s.vy *= 0.99;

      // twinkle
      s.alpha += s.dalpha;
      if (s.alpha < 0.15 || s.alpha > 0.95) s.dalpha *= -1;
    }

    // Draw constellation lines first (below stars)
    const groups = {};
    for (const s of stars) {
      if (s.constellation < 0) continue;
      if (!groups[s.constellation]) groups[s.constellation] = [];
      groups[s.constellation].push(s);
    }

    for (const ci in groups) {
      const group = groups[ci];
      // draw lines between consecutive stars in constellation
      for (let i = 0; i < group.length - 1; i++) {
        const a = group[i], b = group[i + 1];
        const lineAlpha = Math.min(a.alpha, b.alpha) * 0.28;

        // Check mouse proximity — glow the line if mouse is near
        const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
        const mdist = Math.hypot(mouseX - midX, mouseY - midY);
        const glowBoost = mdist < 120 ? (1 - mdist / 120) * 0.5 : 0;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0,   `rgba(${rgb},${lineAlpha + glowBoost})`);
        grad.addColorStop(0.5, `rgba(${rgb},${(lineAlpha + glowBoost) * 1.6})`);
        grad.addColorStop(1,   `rgba(${rgb},${lineAlpha + glowBoost})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = glowBoost > 0 ? 1.2 : 0.6;
        ctx.stroke();
      }
    }

    // Draw stars
    for (const s of stars) {
      const isConstellation = s.constellation >= 0;
      const mdist = Math.hypot(mouseX - s.x, mouseY - s.y);
      const hover = mdist < 80 ? (1 - mdist / 80) : 0;

      // Glow halo for constellation stars
      if (isConstellation && (s.alpha > 0.6 || hover > 0)) {
        const glowR = (s.r + 2) * (1 + hover * 1.5);
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR * 3);
        grd.addColorStop(0, `rgba(${rgb},${s.alpha * 0.25 + hover * 0.2})`);
        grd.addColorStop(1, `rgba(${rgb},0)`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowR * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Star core
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (1 + hover * 0.8), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${Math.min(1, s.alpha + hover * 0.4)})`;
      ctx.fill();

      // Cross sparkle for brighter constellation stars
      if (isConstellation && s.alpha > 0.65) {
        const len = s.r * 2.5 * s.alpha;
        ctx.strokeStyle = `rgba(${rgb},${s.alpha * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
      }
    }

    animId = requestAnimationFrame(draw);
  }

  // Mouse interaction
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouseX = -999; mouseY = -999; });

  // Start when home page is shown
  const origShowPage = window.showPage;
  window.showPage = function(page) {
    origShowPage(page);
    if (page === 'home') {
      if (!animId) {
        resize();
        animId = requestAnimationFrame(draw);
      }
    } else {
      // Pause when leaving home page to save resources
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    }
  };

  window.addEventListener('resize', () => {
    const page = document.querySelector('.page.active');
    if (page && page.id === 'page-home') resize();
  });

  // Initial start
  resize();
  animId = requestAnimationFrame(draw);
})();


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
