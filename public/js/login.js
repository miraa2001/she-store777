// public/js/login.js
const API_BASE = '/api';
const TOKEN_KEY = 'she_store_token';
const USER_KEY = 'she_store_user';

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// إذا فيه توكن موجود أصلاً، دخليه مباشرة على الداشبورد
const existingToken = localStorage.getItem(TOKEN_KEY);
if (existingToken) {
  window.location.replace('index.html');
}
// لو رجعنا للصفحة عن طريق Back وفيه توكن، رجّعيه للدashboard
window.addEventListener('pageshow', () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    window.location.replace('index.html');
  }
});


async function handleLogin() {
  loginError.textContent = '';

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    loginError.textContent = 'رجاءً أدخلي اسم المستخدم وكلمة المرور.';
    return;
  }

  loginBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      loginError.textContent = data.error || 'فشل تسجيل الدخول.';
      loginBtn.disabled = false;
      return;
    }

    // حفظ التوكن واليوزر
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    // تحويل للداشبورد
    window.location.replace('index.html');
  } catch (err) {
    console.error(err);
    loginError.textContent = 'حدث خطأ غير متوقع.';
    loginBtn.disabled = false;
  }
}

loginBtn.addEventListener('click', handleLogin);

passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleLogin();
  }
});
