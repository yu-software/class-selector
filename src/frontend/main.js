// Simple vanilla JS login handler for /api/auth/login
const form = document.getElementById("login-form");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const errEl = document.getElementById("login-error");
const loggedEl = document.getElementById("logged");
const userInfoEl = document.getElementById("user-info");
const logoutBtn = document.getElementById("logout");

function showError(msg) {
  errEl.textContent = msg;
  errEl.style.display = "block";
}

function hideError() {
  errEl.style.display = "none";
}

function showLogged(user) {
  userInfoEl.textContent = user?.nombre || user?.name || user?.email || "";
  loggedEl.style.display = "block";
  form.style.display = "none";
}

function showForm() {
  loggedEl.style.display = "none";
  form.style.display = "block";
}

async function doLogin(e) {
  e.preventDefault();
  hideError();
  const email = emailEl.value.trim();
  const password = passEl.value;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    // store token (existing backend returns token in body)
    if (data.token) localStorage.setItem("token", data.token);

    // try to fetch debug me
    try {
      const meRes = await fetch("/debug/me", {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        showLogged(me.user || me);
        return;
      }
    } catch (err) {
      // ignore
    }

    showLogged({ email });
  } catch (err) {
    showError(err.message);
  }
}

function doLogout() {
  localStorage.removeItem("token");
  showForm();
}

form.addEventListener("submit", doLogin);
logoutBtn.addEventListener("click", doLogout);

// If token present, try to show logged state
const token = localStorage.getItem("token");
if (token) {
  (async () => {
    try {
      const res = await fetch("/debug/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const me = await res.json();
        showLogged(me.user || me);
      } else {
        showForm();
      }
    } catch (err) {
      showForm();
    }
  })();
}
