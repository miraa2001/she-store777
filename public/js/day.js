// public/js/day.js
// public/js/day.js
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

// فعل الثيم مباشرة
initTheme();
initUserHeader();
const params = new URLSearchParams(window.location.search);

const dayId = params.get('id');

const dayTitleEl = document.getElementById('dayTitle');
const daySubtitleEl = document.getElementById('daySubtitle');
const summaryDateEl = document.getElementById('summaryDate');
const summaryQtyEl = document.getElementById('summaryQty');
const summaryTotalEl = document.getElementById('summaryTotal');
const summaryPickedEl = document.getElementById('summaryPicked');
const summaryPaidEl = document.getElementById('summaryPaid');
const summaryUnpaidCountEl = document.getElementById('summaryUnpaidCount');
const summaryUnpaidAmountEl = document.getElementById('summaryUnpaidAmount');
const summaryNeedsChangeEl = document.getElementById('summaryNeedsChange');

const actualSpentInput = document.getElementById('actualSpentInput');
const saveActualSpentBtn = document.getElementById('saveActualSpentBtn');

const searchInput = document.getElementById('searchInput');
const filterNotPicked = document.getElementById('filterNotPicked');
const filterNotPaid = document.getElementById('filterNotPaid');

const entriesBody = document.getElementById('entriesBody');
const totalsQtyEl = document.getElementById('totalsQty');
const totalsTotalEl = document.getElementById('totalsTotal');
const entriesMessage = document.getElementById('entriesMessage');

const newNameInput = document.getElementById('newName');
const newQtyInput = document.getElementById('newQty');
const newTotalInput = document.getElementById('newTotal');
const newNotesInput = document.getElementById('newNotes');
const addEntryBtn = document.getElementById('addEntryBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');


let allEntries = [];
let currentDay = null;

function formatDateOnly(value) {
  if (!value) return '';

  // If it's a string that looks like a date/time, try to parse it
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      // en-CA gives YYYY-MM-DD (nice for your UI)
      return d.toLocaleDateString('en-CA');
    }
  } catch (e) {
    // ignore and fall back
  }

  // Fallback: original behavior (just in case)
  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }

  return value;
}

if (!dayId) {
  entriesMessage.textContent = 'المسار لا يحتوي على رقم اليوم.';
}

async function loadDay() {
  try {
    const res = await fetch(`${API_BASE}/order-days/${dayId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) throw new Error('فشل في تحميل بيانات اليوم');

    const day = await res.json();
    currentDay = day;

    const dStr = formatDateOnly(day.order_date);

    dayTitleEl.textContent = day.title || `يوم رقم ${day.id}`;
    daySubtitleEl.textContent = `التاريخ: ${dStr}`;
    summaryDateEl.textContent = dStr;
    summaryQtyEl.textContent = day.total_quantity;
    summaryTotalEl.textContent = `₪${Number(day.total_ils || 0).toFixed(2)}`;
    summaryPickedEl.textContent = day.picked_up_count;
    summaryPaidEl.textContent = day.paid_count;
    if (actualSpentInput) {
      actualSpentInput.value = Number(day.actual_spent_ils || 0).toFixed(2);
    }
  } catch (err) {
    console.error(err);
    entriesMessage.textContent = 'حدث خطأ أثناء تحميل تفاصيل اليوم.';
  }
}

async function saveActualSpent() {
  if (!actualSpentInput) return;
  const value = parseFloat(actualSpentInput.value || '0');

  try {
    const res = await fetch(`${API_BASE}/order-days/${dayId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ actual_spent_ils: value })
    });

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace('login.html');
      return;
    }

    if (!res.ok) {
      throw new Error('Failed to update actual spent.');
    }

    // optionally reload day summary to refresh everything
    await loadDay();
  } catch (err) {
    console.error(err);
    entriesMessage.textContent = 'Failed to update actual spent.';
  }
}

async function loadEntries() {
  try {
    const res = await fetch(`${API_BASE}/order-days/${dayId}/entries`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) throw new Error('فشل في تحميل السطور');

    allEntries = await res.json();
    renderEntries();
    recalcExtraSummary();
  } catch (err) {
    console.error(err);
    entriesMessage.textContent = 'حدث خطأ أثناء تحميل السطور.';
  }
}


function recalcExtraSummary() {
  let unpaidCount = 0;
  let unpaidAmount = 0;
  let needsChangeCount = 0;

  for (const e of allEntries) {
    const total = Number(e.total_ils || 0);

    if (!e.paid) {
      unpaidCount++;
      unpaidAmount += total;
    }

    if (e.needs_change) {
      needsChangeCount++;
    }
  }

  summaryUnpaidCountEl.textContent = unpaidCount;
  summaryUnpaidAmountEl.textContent = `₪${unpaidAmount.toFixed(2)}`;
  summaryNeedsChangeEl.textContent = needsChangeCount;
}

function renderEntries() {
  entriesBody.innerHTML = '';
  entriesMessage.textContent = '';

  const searchTerm = (searchInput.value || '').toLowerCase().trim();
  const onlyNotPicked = filterNotPicked.checked;
  const onlyNotPaid = filterNotPaid.checked;

  let totalQty = 0;
  let totalTotal = 0;

  const filtered = allEntries.filter(e => {
    if (searchTerm && !e.customer_name.toLowerCase().includes(searchTerm)) {
      return false;
    }
    if (onlyNotPicked && e.picked_up) return false;
    if (onlyNotPaid && e.paid) return false;
    return true;
  });

  for (const e of filtered) {
    totalQty += Number(e.quantity || 0);
    totalTotal += Number(e.total_ils || 0);

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="editable" data-field="customer_name" data-id="${e.id}">${e.customer_name}</td>
      <td class="editable" data-field="quantity" data-id="${e.id}">${e.quantity}</td>
      <td class="editable" data-field="total_ils" data-id="${e.id}">${Number(e.total_ils || 0).toFixed(2)}</td>
      <td class="checkbox-cell"><input type="checkbox" data-field="picked_up" data-id="${e.id}" ${e.picked_up ? 'checked' : ''}></td>
      <td class="checkbox-cell"><input type="checkbox" data-field="paid" data-id="${e.id}" ${e.paid ? 'checked' : ''}></td>
      <td class="checkbox-cell"><input type="checkbox" data-field="needs_change" data-id="${e.id}" ${e.needs_change ? 'checked' : ''}></td>
      <td class="editable" data-field="notes" data-id="${e.id}">${e.notes || ''}</td>
      <td><button class="danger" data-action="delete" data-id="${e.id}">حذف</button></td>
    `;

    entriesBody.appendChild(tr);
  }

  totalsQtyEl.textContent = totalQty;
  totalsTotalEl.textContent = `₪${totalTotal.toFixed(2)}`;

  attachEntryHandlers();
}

function attachEntryHandlers() {
  // inline edits
  const editableCells = entriesBody.querySelectorAll('td.editable');
  editableCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const entryId = cell.dataset.id;
      const field = cell.dataset.field;
      const oldValue = cell.textContent;

      if (cell.querySelector('input,textarea')) return;

      const isNotes = field === 'notes';
      const input = document.createElement(isNotes ? 'textarea' : 'input');
      input.className = 'inline-input';
      input.value = oldValue;
      if (field === 'quantity') input.type = 'number';
      if (field === 'total_ils') {
        input.type = 'number';
        input.step = '0.01';
      }

      cell.innerHTML = '';
      cell.appendChild(input);
      input.focus();
      input.select();

      const save = async () => {
        let newValue = input.value;
        if (field === 'quantity') {
          newValue = parseInt(newValue || '0', 10);
        }
        if (field === 'total_ils') {
          newValue = parseFloat(newValue || '0');
        }

        try {
          await updateEntry(entryId, { [field]: newValue });
          const entry = allEntries.find(e => e.id === Number(entryId));
          if (entry) entry[field] = newValue;
          renderEntries();
          loadDay();
          recalcExtraSummary();
        } catch (err) {
          console.error(err);
          entriesMessage.textContent = 'فشل تعديل السطر.';
          cell.textContent = oldValue;
        }
      };

      input.addEventListener('blur', save);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isNotes) {
          e.preventDefault();
          input.blur();
        }
      });
    });
  });

  // checkbox changes
  const checkboxes = entriesBody.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', async () => {
      const entryId = cb.dataset.id;
      const field = cb.dataset.field;
      const value = cb.checked;

      let payload = { [field]: value };

      // إذا استلم → اعتبره دفع أيضاً
      if (field === 'picked_up' && value) {
        payload = { picked_up: true, paid: true };
      }

      try {
        await updateEntry(entryId, payload);

        const entry = allEntries.find(e => e.id === Number(entryId));
        if (entry) {
          if (payload.hasOwnProperty('picked_up')) entry.picked_up = payload.picked_up;
          if (payload.hasOwnProperty('paid')) entry.paid = payload.paid;
          if (payload.hasOwnProperty('needs_change')) entry.needs_change = payload.needs_change;
        }

        // تحديث واجهة "دفع" عند اختيار "استلم"
        if (field === 'picked_up' && value) {
          const paidCheckbox = entriesBody.querySelector(
            `input[type="checkbox"][data-field="paid"][data-id="${entryId}"]`
          );
          if (paidCheckbox) paidCheckbox.checked = true;
        }

        renderEntries();
        loadDay();
        recalcExtraSummary();
      } catch (err) {
        console.error(err);
        entriesMessage.textContent = 'فشل تعديل الحالة.';
        cb.checked = !value;
      }
    });
  });

  // delete buttons
  const deleteButtons = entriesBody.querySelectorAll('button[data-action="delete"]');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const entryId = btn.dataset.id;
      const ok = confirm('هل أنتِ متأكدة من حذف هذا السطر؟');
      if (!ok) return;

      try {
        await deleteEntry(entryId);
        allEntries = allEntries.filter(e => e.id !== Number(entryId));
        renderEntries();
        loadDay();
        recalcExtraSummary();
      } catch (err) {
        console.error(err);
        entriesMessage.textContent = 'فشل حذف السطر.';
      }
    });
  });
}

async function updateEntry(entryId, fields) {
  const res = await fetch(`${API_BASE}/entries/${entryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(fields)
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
    return;
  }

  if (!res.ok) {
    throw new Error('فشل في التعديل');
  }

  return res.json();
}

async function deleteEntry(entryId) {
  const res = await fetch(`${API_BASE}/entries/${entryId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
    return;
  }

  if (!res.ok) {
    throw new Error('فشل في الحذف');
  }
}

function buildFilename(extension) {
  const datePart = currentDay ? formatDateOnly(currentDay.order_date) : 'day';
  const titlePart = currentDay && currentDay.title
    ? currentDay.title.replace(/[^\w\-]+/g, '_')
    : `day_${dayId}`;
  return `she-store-${datePart}-${titlePart}.${extension}`;
}

function exportCsv() {
  if (!allEntries.length) {
    alert('لا يوجد سطور لتصديرها.');
    return;
  }

  const header = [
    'Name',
    'Quantity',
    'Total ILS',
    'Picked',
    'Paid',
    'Needs Change',
    'Notes'
  ];

  const rows = allEntries.map(e => [
    e.customer_name,
    e.quantity,
    Number(e.total_ils || 0).toFixed(2),
    e.picked_up ? 'Yes' : 'No',
    e.paid ? 'Yes' : 'No',
    e.needs_change ? 'Yes' : 'No',
    (e.notes || '').replace(/\r?\n/g, ' ')
  ]);

  const csvLines = [];
  csvLines.push(header.join(','));
  rows.forEach(row => {
    const escaped = row.map(value => {
      const v = String(value ?? '');
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    });
    csvLines.push(escaped.join(','));
  });

  // 👉 IMPORTANT: add UTF-8 BOM so Excel shows Arabic correctly
  const csvContent = '\uFEFF' + csvLines.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = buildFilename('csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function exportPdf() {
  if (!allEntries.length) {
    alert('لا يوجد سطور لتصديرها.');
    return;
  }

  const dateStr = currentDay ? formatDateOnly(currentDay.order_date) : '';
  const titleStr = currentDay && currentDay.title ? currentDay.title : `اليوم رقم ${dayId}`;

  // نحسب الإجمالي فقط للعرض في أسفل الجدول
  let totalQty = 0;
  let totalTotal = 0;
  allEntries.forEach(e => {
    totalQty += Number(e.quantity || 0);
    totalTotal += Number(e.total_ils || 0);
  });

  const rowsHtml = allEntries.map(e => `
    <tr>
      <td>${e.customer_name}</td>
      <td>${e.quantity}</td>
      <td>${Number(e.total_ils || 0).toFixed(2)}</td>
      <td>${e.picked_up ? '✓' : ''}</td>
      <td>${e.paid ? '✓' : ''}</td>
      <td>${e.needs_change ? '✓' : ''}</td>
      <td>${e.notes || ''}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير اليوم</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 20px;
    }
    h1, h2, p {
      margin: 0 0 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #999;
      padding: 4px 6px;
      text-align: right;
    }
    th {
      background: #f0f0f0;
    }
    tfoot td {
      font-weight: bold;
      background: #f7f7f7;
    }
  </style>
</head>
<body>
  <h1>شي ستور – تقرير الطلبات</h1>
  <p>التاريخ: ${dateStr}</p>
  <p>العنوان: ${titleStr}</p>

  <table>
    <thead>
      <tr>
        <th>الاسم</th>
        <th>القطع</th>
        <th>الإجمالي (₪)</th>
        <th>استلم</th>
        <th>دفع</th>
        <th>يحتاج فكة</th>
        <th>ملاحظات</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td>الإجمالي</td>
        <td>${totalQty}</td>
        <td>${totalTotal.toFixed(2)}</td>
        <td colspan="4"></td>
      </tr>
    </tfoot>
  </table>

  <script>
    // طباعة تلقائياً عند الفتح
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

async function addEntry() {
  entriesMessage.textContent = '';

  const name = newNameInput.value.trim();
  const qty = parseInt(newQtyInput.value || '0', 10);
  const total = parseFloat(newTotalInput.value || '0');
  const notes = newNotesInput.value.trim();

  if (!name) {
    entriesMessage.textContent = 'الاسم مطلوب.';
    return;
  }

  addEntryBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/order-days/${dayId}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        customer_name: name,
        quantity: qty,
        total_ils: total,
        notes
      })
    });

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) throw new Error('فشل في إضافة السطر');

    const newEntry = await res.json();
    allEntries.push(newEntry);
    newNameInput.value = '';
    newQtyInput.value = '0';
    newTotalInput.value = '0';
    newNotesInput.value = '';
    renderEntries();
    loadDay();
    recalcExtraSummary();
  } catch (err) {
    console.error(err);
    entriesMessage.textContent = err.message;
  } finally {
    addEntryBtn.disabled = false;
  }
}

addEntryBtn.addEventListener('click', addEntry);
searchInput.addEventListener('input', renderEntries);
filterNotPicked.addEventListener('change', renderEntries);
filterNotPaid.addEventListener('change', renderEntries);
if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', exportCsv);
}
if (exportPdfBtn) {
  exportPdfBtn.addEventListener('click', exportPdf);
}
if (saveActualSpentBtn) {
  saveActualSpentBtn.addEventListener('click', saveActualSpent);
}

if (actualSpentInput) {
  actualSpentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveActualSpent();
    }
  });
}

if (dayId) {
  loadDay();
  loadEntries();
}
