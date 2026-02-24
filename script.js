// ====== EMAILJS INIT ======
emailjs.init("YdalPlh-x2bdL6eFV");

// ====== STORAGE HELPERS ======
const storage = {
  get: (k) => { try { return localStorage.getItem(k); } catch(e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} },
  remove: (k) => { try { localStorage.removeItem(k); } catch(e) {} }
};

// ====== NAVIGATION ======
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('onclick') && a.getAttribute('onclick').includes("'" + page + "'")) {
      a.classList.add('active');
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Refresh blog comments and login state on page switch
  if (page === 'blog') renderAllCommentForms();
  if (page === 'login') refreshLoginPage();
}

// ====== TOAST ======
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(() => { t.className = ''; }, 3000);
}

// ====== CONTACT FORM ======
function submitContactForm(e) {
  e.preventDefault();
  const btn = document.getElementById("cf-submit-btn");
  btn.textContent = "Sending...";
  btn.disabled = true;
  const params = {
    name:    document.getElementById("cf-name").value,
    email:   document.getElementById("cf-email").value,
    subject: document.getElementById("cf-subject").value,
    message: document.getElementById("cf-message").value,
  };
  emailjs.send("service_gfc52dt", "template_onqwv1l", params)
    .then(() => {
      document.getElementById("contact-form").style.display = "none";
      document.getElementById("cf-success").style.display = "block";
    })
    .catch((error) => {
      alert("Failed to send message. Please try again.");
      btn.textContent = "Send Message";
      btn.disabled = false;
      console.error(error);
    });
}

function resetContactForm() {
  document.getElementById('contact-form').reset();
  document.getElementById('contact-form').style.display = 'flex';
  document.getElementById('cf-success').style.display = 'none';
  const btn = document.getElementById('cf-submit-btn');
  btn.textContent = 'Send Message';
  btn.disabled = false;
}

// ====== THEME SWITCHER ======
const themeIcons = {
  dark: '🌙', light: '☀️', retro: '📺',
  love: '💗', ocean: '🌊', forest: '🌿'
};

function setTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
  if (theme !== 'dark') document.body.classList.add('theme-' + theme);
  const iconEl = document.getElementById('theme-icon');
  if (iconEl) iconEl.textContent = themeIcons[theme];
  document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  storage.set('portfolio-theme', theme);
  closeThemePanel();
}

function toggleThemePanel() {
  document.getElementById('theme-panel').classList.toggle('open');
}

function closeThemePanel() {
  document.getElementById('theme-panel').classList.remove('open');
}

document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.theme-wrapper');
  if (wrapper && !wrapper.contains(e.target)) closeThemePanel();
});

// Load saved theme on startup
(function() {
  const saved = storage.get('portfolio-theme') || 'dark';
  setTheme(saved);
})();

// ====== AUTH HELPERS ======
function getUsers() {
  try { return JSON.parse(storage.get('portfolio-users') || '{}'); } catch(e) { return {}; }
}

function saveUsers(users) {
  storage.set('portfolio-users', JSON.stringify(users));
}

function getCurrentUser() {
  try { return JSON.parse(storage.get('portfolio-current-user') || 'null'); } catch(e) { return null; }
}

function setCurrentUser(user) {
  storage.set('portfolio-current-user', JSON.stringify(user));
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

// ====== AUTH UI ======
function switchAuthTab(tab) {
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabReg = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.style.display = '';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    document.getElementById('login-error').style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = '';
    tabLogin.classList.remove('active');
    tabReg.classList.add('active');
    document.getElementById('reg-error').style.display = 'none';
  }
}

function showAuthError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = 'block';
}

function refreshLoginPage() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById('auth-panel').style.display = 'none';
    document.getElementById('auth-loggedin').style.display = 'block';
    document.getElementById('loggedin-username-display').textContent = user.username;
    document.getElementById('loggedin-name-display').textContent = user.username;
    document.getElementById('loggedin-email-display').textContent = user.email;
    document.getElementById('loggedin-avatar').textContent = user.username.charAt(0).toUpperCase();
  } else {
    document.getElementById('auth-panel').style.display = 'block';
    document.getElementById('auth-loggedin').style.display = 'none';
  }
  updateNavLoginBtn();
}

function updateNavLoginBtn() {
  const btn = document.getElementById('nav-login-btn');
  if (!btn) return;
  const user = getCurrentUser();
  if (user) {
    btn.textContent = user.username.charAt(0).toUpperCase() + ' Account';
    btn.classList.add('logged-in');
  } else {
    btn.textContent = 'Login';
    btn.classList.remove('logged-in');
  }
}

// ====== REGISTER ======
function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (username.length < 3) return showAuthError('reg-error', 'Username must be at least 3 characters.');
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return showAuthError('reg-error', 'Username can only contain letters, numbers, and underscores.');
  if (password.length < 6) return showAuthError('reg-error', 'Password must be at least 6 characters.');
  if (password !== confirm) return showAuthError('reg-error', 'Passwords do not match.');

  const users = getUsers();
  if (users[username.toLowerCase()]) return showAuthError('reg-error', 'This username is already taken.');

  // Check email not already used
  const emailTaken = Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailTaken) return showAuthError('reg-error', 'An account with this email already exists.');

  // Save user (simple hash simulation — NOT secure for production)
  users[username.toLowerCase()] = {
    username,
    email,
    password: btoa(password), // basic encoding, not real security
    joined: new Date().toISOString()
  };
  saveUsers(users);

  // Auto-login
  const userObj = { username, email };
  setCurrentUser(userObj);
  refreshLoginPage();
  renderAllCommentForms();
  showToast('Account created! Welcome, ' + username + ' 🎉', 'success');
  document.getElementById('reg-error').style.display = 'none';
}

// ====== LOGIN ======
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const users = getUsers();
  const record = users[username.toLowerCase()];

  if (!record) return showAuthError('login-error', 'No account found with that username.');
  if (atob(record.password) !== password) return showAuthError('login-error', 'Incorrect password.');

  const userObj = { username: record.username, email: record.email };
  setCurrentUser(userObj);
  refreshLoginPage();
  renderAllCommentForms();
  showToast('Welcome back, ' + record.username + '!', 'success');
  document.getElementById('login-error').style.display = 'none';
}

// ====== LOGOUT ======
function handleLogout() {
  storage.remove('portfolio-current-user');
  refreshLoginPage();
  renderAllCommentForms();
  showToast('Logged out successfully.', 'success');
}

// ====== COMMENTS ======
function getComments(postId) {
  try { return JSON.parse(storage.get('blog-comments-' + postId) || '[]'); } catch(e) { return []; }
}

function saveComments(postId, comments) {
  storage.set('blog-comments-' + postId, JSON.stringify(comments));
}

function formatCommentDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderComments(postId) {
  const list = document.getElementById('comments-' + postId);
  const countEl = document.getElementById('count-' + postId);
  if (!list) return;

  const comments = getComments(postId);
  countEl.textContent = comments.length + (comments.length === 1 ? ' Comment' : ' Comments');

  if (comments.length === 0) {
    list.innerHTML = '';
    list.style.background = 'none';
    return;
  }

  list.style.background = 'var(--border)';
  list.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-header">
        <div class="comment-avatar">${c.author.charAt(0)}</div>
        <span class="comment-author">${escapeHtml(c.author)}</span>
        <span class="comment-date">${formatCommentDate(c.date)}</span>
      </div>
      <div class="comment-text">${escapeHtml(c.text)}</div>
    </div>
  `).join('');
}

function renderCommentForm(postId) {
  const area = document.getElementById('comment-form-' + postId);
  if (!area) return;
  const user = getCurrentUser();

  if (user) {
    area.innerHTML = `
      <div class="comment-form-box">
        <textarea id="comment-input-${postId}" placeholder="Share your thoughts..."></textarea>
        <div class="comment-form-footer">
          <span class="comment-logged-as">Commenting as <strong>${escapeHtml(user.username)}</strong></span>
          <button class="btn btn-accent" onclick="submitComment(${postId})">Post Comment</button>
        </div>
      </div>
    `;
  } else {
    area.innerHTML = `
      <div class="comment-login-prompt">
        <p>Login or create an account to leave a comment.</p>
        <button class="btn btn-accent" onclick="showPage('login')">Login / Register</button>
      </div>
    `;
  }
}

function renderAllCommentForms() {
  [1, 2, 3].forEach(id => {
    renderComments(id);
    renderCommentForm(id);
  });
}

function submitComment(postId) {
  const user = getCurrentUser();
  if (!user) { showToast('Please log in to comment.', 'error'); return; }

  const input = document.getElementById('comment-input-' + postId);
  const text = (input ? input.value : '').trim();
  if (!text) { showToast('Comment cannot be empty.', 'error'); return; }
  if (text.length > 1000) { showToast('Comment too long (max 1000 chars).', 'error'); return; }

  const comments = getComments(postId);
  comments.push({
    author: user.username,
    text,
    date: new Date().toISOString()
  });
  saveComments(postId, comments);

  renderComments(postId);
  renderCommentForm(postId);
  showToast('Comment posted!', 'success');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ====== INIT ======
(function init() {
  refreshLoginPage();
  renderAllCommentForms();
})();
