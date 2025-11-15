// public/js/index.js
const API_BASE = '/api';
const TOKEN_KEY = 'she_store_token';
const USER_KEY = 'she_store_user';

// 🔐 Helper to add Authorization header
function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 🔐 Redirect to login if no token
(function ensureLoggedIn() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.href = 'login.html';
  }
})();

const currentUserLabel = document.getElementById('currentUserLabel');
const logoutBtn = document.getElementById('logoutBtn');

function initUserHeader() {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) {
    if (currentUserLabel) currentUserLabel.textContent = '';
    return;
  }

  try {
    const user = JSON.parse(userJson);
    if (currentUserLabel && user?.username) {
      currentUserLabel.textContent = `مرحباً، ${user.username}`;
    }
  } catch (e) {
    console.error('Failed to parse user from storage', e);
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
  });
}


const THEME_KEY = 'she_store_theme';
const themeToggleBtn = document.getElementById('themeToggle');

function applyTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark');
    if (themeToggleBtn) themeToggleBtn.textContent = '☀️ الوضع الفاتح';
  } else {
    body.classList.remove('dark');
    if (themeToggleBtn) themeToggleBtn.textContent = '🌙 الوضع الداكن';
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// تفعيل الثيم عند تحميل الصفحة
initTheme();
initUserHeader();

const orderDateInput = document.getElementById('orderDate');
const orderTitleInput = document.getElementById('orderTitle');
const createDayBtn = document.getElementById('createDayBtn');
const createDayMessage = document.getElementById('createDayMessage');
const daysTableBody = document.getElementById('daysTableBody');
const noDaysMsg = document.getElementById('noDaysMsg');

// التاريخ الافتراضي = اليوم
const today = new Date().toISOString().slice(0, 10);
orderDateInput.value = today;

function formatDateOnly(value) {
  // if it's like "2025-11-13T22:00:00.000Z" -> slice first 10 chars
  if (!value) return '';
  if (value.length >= 10) return value.slice(0, 10);
  return value;
}

async function fetchOrderDays() {
  try {
    const res = await fetch(`${API_BASE}/order-days`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    if (res.status === 401) {
      // التوكن بايظة / منتهية
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) throw new Error('فشل في تحميل الأيام');

    const days = await res.json();

    daysTableBody.innerHTML = '';

    if (days.length === 0) {
      noDaysMsg.style.display = 'block';
      return;
    } else {
      noDaysMsg.style.display = 'none';
    }

    for (const day of days) {
      const tr = document.createElement('tr');

      const totalIls = Number(day.total_ils || 0).toFixed(2);
      const createdAt = new Date(day.created_at).toLocaleString('ar-EG');
      const dateOnly = formatDateOnly(day.order_date);

      tr.innerHTML = `
        <td>${dateOnly}</td>
        <td>${day.title || ''}</td>
        <td>${day.total_quantity}</td>
        <td>${createdAt}</td>
        <td class="text-left">₪${totalIls}</td>
        <td>
          <span class="badge green">${day.picked_up_count} استلموا</span>
          <span class="badge red">${day.paid_count} دافعين</span>
        </td>
        <td>
          <a href="day.html?id=${day.id}">
            <button>فتح</button>
          </a>
        </td>
      `;

      daysTableBody.appendChild(tr);
    }
  } catch (err) {
    console.error(err);
    createDayMessage.textContent = 'حدث خطأ أثناء تحميل الأيام.';
  }
}

async function createOrderDay() {
  createDayMessage.textContent = '';

  const orderDate = orderDateInput.value;
  const title = orderTitleInput.value.trim();

  if (!orderDate) {
    createDayMessage.textContent = 'من فضلك اختاري التاريخ.';
    return;
  }

  createDayBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/order-days`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ order_date: orderDate, title })
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
    return;
  }


  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'فشل في إنشاء اليوم');
  }

  orderTitleInput.value = '';
  await fetchOrderDays();
  } catch (err) {
    console.error(err);
    createDayMessage.textContent = err.message;
  } finally {
    createDayBtn.disabled = false;
  }
}

createDayBtn.addEventListener('click', createOrderDay);

// تحميل الأيام عند فتح الصفحة
fetchOrderDays();
