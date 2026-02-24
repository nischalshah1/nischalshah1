// ====== EMAILJS INIT ======
emailjs.init("YdalPlh-x2bdL6eFV");

// ====== NAVIGATION ======
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('onclick').includes("'" + page + "'")) a.classList.add('active');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

// ====== RESET FORM ======
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

const storage = {
  get: (k) => { try { return localStorage.getItem(k); } catch(e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} }
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
