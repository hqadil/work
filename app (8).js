// ============================================================
// app.js — Handy sQuad Shared Utilities
// ============================================================

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth Helpers ─────────────────────────────────────────────

async function requireAuth(allowedRoles = []) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return null; }

  const { data: user } = await db.from('users').select('*').eq('id', session.user.id).single();
  if (!user) { await db.auth.signOut(); window.location.href = 'index.html'; return null; }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    alert('Access denied for your role.');
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

async function logout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

function renderUserBadge(user, containerId) {
  const el = document.getElementById(containerId);
  if (!el || !user) return;
  const roleColor = { admin: '#ef4444', sales: '#22c55e', scheduling: '#3b82f6', technician: '#f59e0b' };
  el.innerHTML = `
    <div class="user-badge">
      <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <span class="user-name">${user.name}</span>
        <span class="user-role" style="background:${roleColor[user.role] || '#6b7280'}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
      </div>
      <button onclick="logout()" class="btn-logout" title="Logout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </div>`;
}

// ── Formatting Helpers ────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function formatCurrency(n) {
  if (n === null || n === undefined) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

// ── Toast Notifications ───────────────────────────────────────

function toast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.style.cssText = `padding:12px 20px;border-radius:10px;color:#fff;font-size:14px;font-weight:500;
    box-shadow:0 4px 20px rgba(0,0,0,0.15);animation:slideIn 0.3s ease;max-width:320px;
    background:${type === 'success' ? '#1d4ed8' : type === 'error' ? '#dc2626' : '#d97706'};`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Modal Helpers ─────────────────────────────────────────────

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// Click outside to close
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ── Generate Copy-Paste Text Block ────────────────────────────

function generateCopyBlock(booking) {
  const balance = (Number(booking.total_amount) - Number(booking.advance_amount || 0)).toFixed(0);
  return `Customer: ${booking.customer_name}
Phone: ${booking.customer_phone}
Alt: ${booking.customer_alt_phone || ''}
Place: ${booking.customer_place}
Address: ${booking.customer_address || ''}
Location: ${booking.location_link || ''}
Service: ${booking.segment_name}
Date: ${formatDate(booking.slot_date)}
Time: ${formatTime(booking.slot_time)}
Amount: ₹${booking.total_amount}
Advance: ₹${booking.advance_amount || 0}
Balance: ₹${balance}
Work Details: ${booking.service_details || ''}
Attachments: ${booking.attachment_link || ''}`;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard!');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    toast('Copied!');
  }
}

// ── Shared CSS injected once ──────────────────────────────────
(function injectSharedStyles() {
  if (document.getElementById('shared-styles')) return;
  const s = document.createElement('style');
  s.id = 'shared-styles';
  s.textContent = `
    @keyframes slideIn { from { transform: translateX(100px); opacity:0; } to { transform: translateX(0); opacity:1; } }
    .user-badge { display:flex;align-items:center;gap:10px; }
    .user-avatar { width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#3b82f6);
      color:#fff;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center; }
    .user-info { display:flex;flex-direction:column;gap:2px; }
    .user-name { font-size:14px;font-weight:600;color:#1e293b; }
    .user-role { font-size:10px;font-weight:700;color:#fff;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:.5px;width:fit-content; }
    .btn-logout { background:none;border:none;cursor:pointer;color:#94a3b8;padding:4px;border-radius:6px;transition:color .2s,background .2s; }
    .btn-logout:hover { color:#dc2626;background:#fee2e2; }
    .modal-overlay { display:none;position:fixed;inset:0;background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);
      z-index:1000;align-items:center;justify-content:center;padding:20px; }
    .modal-overlay.open { display:flex; }
    .modal-box { background:#fff;border-radius:16px;padding:28px;width:100%;max-width:520px;
      box-shadow:0 20px 60px rgba(0,0,0,0.2);max-height:90vh;overflow-y:auto; }
    .modal-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:20px; }
    .modal-title { font-size:18px;font-weight:700;color:#1e293b; }
    .modal-close { background:none;border:none;cursor:pointer;color:#94a3b8;font-size:22px;line-height:1; }
    .modal-close:hover { color:#1e293b; }
    .form-group { margin-bottom:16px; }
    .form-label { display:block;font-size:13px;font-weight:600;color:#475569;margin-bottom:6px; }
    .form-input,.form-select,.form-textarea { width:100%;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;
      font-size:14px;color:#1e293b;background:#f8fafc;transition:border .2s,box-shadow .2s;box-sizing:border-box;
      font-family:inherit; }
    .form-input:focus,.form-select:focus,.form-textarea:focus { outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15);background:#fff; }
    .form-textarea { resize:vertical;min-height:80px; }
    .btn { padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:none;
      transition:all .2s;display:inline-flex;align-items:center;gap:8px; }
    .btn-primary { background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;box-shadow:0 4px 12px rgba(59,130,246,.3); }
    .btn-primary:hover { transform:translateY(-1px);box-shadow:0 6px 16px rgba(59,130,246,.4); }
    .btn-secondary { background:#f1f5f9;color:#475569; }
    .btn-secondary:hover { background:#e2e8f0;color:#1e293b; }
    .btn-danger { background:#fee2e2;color:#dc2626; }
    .btn-danger:hover { background:#fecaca; }
    .btn-sm { padding:6px 14px;font-size:12px; }
    .badge { display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px; }
    .badge-booked { background:#dbeafe;color:#1d4ed8; }
    .badge-completed { background:#dcfce7;color:#16a34a; }
    .badge-cancelled { background:#fee2e2;color:#dc2626; }
    .badge-rescheduled { background:#fef3c7;color:#d97706; }
    .badge-pending { background:#f1f5f9;color:#64748b; }
    .badge-paid { background:#dcfce7;color:#16a34a; }
  `;
  document.head.appendChild(s);
})();
