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

// ====== CONTACT FORM SUBMISSION ======
async function submitContactForm(e) {
  e.preventDefault();

  const btn = document.getElementById('cf-submit-btn');
  btn.textContent = 'Sending...';
  btn.classList.add('btn-loading');

  const payload = {
    name:    document.getElementById('cf-name').value.trim(),
    email:   document.getElementById('cf-email').value.trim(),
    subject: document.getElementById('cf-subject').value.trim(),
    message: document.getElementById('cf-message').value.trim()
  };

  try {
    const res = await fetch('contact_handler.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      document.getElementById('contact-form').style.display = 'none';
      document.getElementById('cf-success').style.display = 'block';
    } else {
      showToast(data.message || 'Something went wrong. Try again.', 'error');
      btn.textContent = 'Send Message';
      btn.classList.remove('btn-loading');
    }
  } catch (err) {
    showToast('Could not reach the server. Check your connection.', 'error');
    btn.textContent = 'Send Message';
    btn.classList.remove('btn-loading');
  }
}

function resetContactForm() {
  document.getElementById('contact-form').reset();
  document.getElementById('contact-form').style.display = 'flex';
  document.getElementById('cf-success').style.display = 'none';
  const btn = document.getElementById('cf-submit-btn');
  btn.textContent = 'Send Message';
  btn.classList.remove('btn-loading');
}