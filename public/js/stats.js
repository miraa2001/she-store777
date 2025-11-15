// public/js/stats.js

const API_BASE = '/api';
const TOKEN_KEY = 'she_store_token';
const USER_KEY = 'she_store_user';

// --- Auth Helpers ---
function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Redirect to login if not logged in
(function ensureLoggedIn() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.replace('login.html');
  }
})();

// --- DOM Elements ---
const summaryCardsEl = document.getElementById('summaryCards');
const topCustomersTable = document.querySelector('#topCustomersTable tbody');
const dailyRevenueTable = document.querySelector('#dailyRevenueTable tbody');
const statsErrorEl = document.getElementById('statsError');
const topCustomersCountBadge = document.getElementById('topCustomersCountBadge');
const dailyRevenueCountBadge = document.getElementById('dailyRevenueCountBadge');

const currentUserLabel = document.getElementById('currentUserLabel');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggleBtn = document.getElementById('themeToggle');

// --- Header User Display ---
function initUserHeader() {
  const json = localStorage.getItem(USER_KEY);
  if (!json) return;

  try {
    const user = JSON.parse(json);
    if (user?.username) {
      currentUserLabel.textContent = `Welcome, ${user.username}`;
    }
  } catch (err) {
    console.error('Failed to parse user:', err);
  }
}

// --- Logout ---
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.replace('login.html');
  });
}

// --- Theme ---
function applyTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark');
    if (themeToggleBtn) themeToggleBtn.textContent = '☀️ Light Mode';
  } else {
    body.classList.remove('dark');
    if (themeToggleBtn) themeToggleBtn.textContent = '🌙 Dark Mode';
  }
}

function initTheme() {
  const saved = localStorage.getItem('she_store_theme') || 'light';
  applyTheme(saved);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    localStorage.setItem('she_store_theme', next);
    applyTheme(next);
  });
}

// --- Load Stats ---
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats/summary`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace('login.html');
      return;
    }

    if (!res.ok) throw new Error('Failed to load stats');

    const stats = await res.json();
    renderSummaryCards(stats);
    renderTopCustomers(stats.top_customers);
    renderDailyRevenue(stats.daily_revenue);

  } catch (err) {
    console.error(err);
    statsErrorEl.textContent = 'Failed to load statistics.';
  }
}

function renderSummaryCards(stats) {
  summaryCardsEl.innerHTML = `
    <div class="card">
      <h3>Total Revenue</h3>
      <div class="big-number">₪${stats.total_revenue.toFixed(2)}</div>
    </div>

    <div class="card">
      <h3>Total Pieces</h3>
      <div class="big-number">${stats.total_pieces}</div>
    </div>

    <div class="card">
      <h3>Unpaid Amount</h3>
      <div class="big-number">₪${stats.total_unpaid_amount.toFixed(2)}</div>
      <div class="sub">${stats.total_unpaid_orders} orders</div>
    </div>

    <div class="card">
      <h3>Unique Customers</h3>
      <div class="big-number">${stats.total_customers}</div>
    </div>

    <div class="card">
      <h3>Total Days</h3>
      <div class="big-number">${stats.total_days}</div>
    </div>
  `;
}

function renderTopCustomers(customers) {
  topCustomersTable.innerHTML = '';

  customers.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.customer_name}</td>
      <td>₪${c.total_ils.toFixed(2)}</td>
      <td>${c.total_quantity}</td>
    `;
    topCustomersTable.appendChild(tr);
  });

  topCustomersCountBadge.textContent = `${customers.length} customers`;
}

function renderDailyRevenue(rows) {
  dailyRevenueTable.innerHTML = '';

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.order_date}</td>
      <td>₪${r.total_ils.toFixed(2)}</td>
    `;
    dailyRevenueTable.appendChild(tr);
  });

  dailyRevenueCountBadge.textContent = `${rows.length} days`;
}

// --- Init ---
initTheme();
initUserHeader();
loadStats();
