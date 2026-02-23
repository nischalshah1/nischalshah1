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
emailjs.init("YdalPlh-x2bdL6eFV");

function submitContactForm(e) {
  e.preventDefault();

  const btn = document.getElementById("cf-submit-btn");
  btn.textContent = "Sending...";
  btn.disabled = true;

  const params = {
    name: document.getElementById("cf-name").value,
    email: document.getElementById("cf-email").value,
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
}

function resetContactForm() {
  document.getElementById('contact-form').reset();
  document.getElementById('contact-form').style.display = 'flex';
  document.getElementById('cf-success').style.display = 'none';
  const btn = document.getElementById('cf-submit-btn');
  btn.textContent = 'Send Message';
  btn.classList.remove('btn-loading');

}
