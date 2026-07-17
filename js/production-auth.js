import { apiHealth, apiImportLocalStorage, apiLoginWithPin, clearBackendSession, getBackendSession, localStorageSnapshotForBackend, saveBackendSession } from './api-client.js';
import { pullBackendToLocalStorage, pushLocalStorageToBackend } from './backend-sync.js';
import { getCurrentUserId, hasPermission, setCurrentUser } from './permissions.js';
import { loadUsers } from './settings-service.js';
import { showToast } from './utils.js';

const state = { mode: 'local', user: null };
const BADGE_POSITION_KEY = 'budsarin_auth_badge_position';

export function initProductionAuth() {
  renderAuthShell();
  bindAuthEvents();
  hydrateSession();
  decoratePermissionButtons();
}

export function getCurrentUser() {
  return state.user || loadUsers().find(user => user.id === getCurrentUserId()) || loadUsers()[0];
}

export function requireUiPermission(permission) {
  const user = getCurrentUser();
  return hasPermission(user, permission) || user?.permissions?.includes('*');
}

async function hydrateSession() {
  const session = getBackendSession();
  if (session?.user && new Date(session.expiresAt) > new Date()) {
    state.mode = 'backend';
    state.user = session.user;
    setCurrentUser(session.user.id);
    updateBadge('Backend', session.user.displayName);
    return;
  }
  const local = loadUsers().find(user => user.id === getCurrentUserId()) || loadUsers()[0];
  state.user = local;
  updateBadge('Local', local?.displayName || 'Owner');
}

function renderAuthShell() {
  if (document.getElementById('productionAuthPanel')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="production-auth-badge" id="productionAuthBadge">
      <button class="soft-button" id="openProductionAuth" type="button">Local • Owner</button>
    </div>
    <div class="modal-overlay" id="productionAuthPanel" hidden>
      <section class="modal production-auth-modal" role="dialog" aria-modal="true">
        <button class="icon-button modal-close" data-close-production-auth type="button" aria-label="ปิด">×</button>
        <p class="eyebrow">Production Access</p>
        <h3>Login / Backend Sync</h3>
        <form id="pinLoginForm" class="production-auth-form">
          <label>Username<input name="username" value="owner" autocomplete="username"></label>
          <label>PIN<input name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="1234"></label>
          <label>Device Name<input name="deviceName" value="${navigator.platform || 'iPad'}"></label>
          <button class="primary-button" type="submit">เข้าสู่ระบบ Backend</button>
        </form>
        <div class="production-auth-actions">
          <button class="soft-button" data-backend-health type="button">ตรวจ Backend</button>
          <button class="soft-button" data-import-localstorage type="button">ย้ายข้อมูล LocalStorage เข้า Backend</button>
          <button class="soft-button" data-pull-backend type="button">โหลดข้อมูล Backend เข้าเครื่องนี้</button>
          <button class="soft-button" data-push-backend type="button">ส่งข้อมูลเครื่องนี้ขึ้น Backend</button>
          <button class="danger-button" data-backend-logout type="button">ออกจากระบบ Backend</button>
        </div>
        <p class="settings-warning">สำหรับใช้จริง ให้เปิดผ่าน backend server บนเครื่องหลักของร้าน แล้วให้ iPad เข้า IP เครื่องนั้น</p>
      </section>
    </div>
  `);
}

function bindAuthEvents() {
  enableDraggableAuthBadge();
  document.getElementById('openProductionAuth').addEventListener('click', event => {
    if (event.currentTarget.dataset.dragged === '1') {
      event.currentTarget.dataset.dragged = '0';
      return;
    }
    document.getElementById('productionAuthPanel').hidden = false;
  });
  document.body.addEventListener('click', async event => {
    if (event.target.closest('[data-close-production-auth]') || event.target.id === 'productionAuthPanel') document.getElementById('productionAuthPanel').hidden = true;
    if (event.target.closest('[data-backend-health]')) {
      try { const health = await apiHealth(); showToast(`Backend ready: ${health.mode}`); }
      catch (error) { showToast(`Backend ยังไม่พร้อม: ${error.message}`); }
    }
    if (event.target.closest('[data-import-localstorage]')) {
      try { const result = await apiImportLocalStorage(localStorageSnapshotForBackend()); showToast(`ย้ายข้อมูลเข้า Backend แล้ว ${result.imported} keys`); }
      catch (error) { showToast(error.message); }
    }
    if (event.target.closest('[data-pull-backend]')) {
      try { await pullBackendToLocalStorage(); showToast('โหลดข้อมูล Backend เข้าเครื่องนี้แล้ว'); }
      catch (error) { showToast(error.message); }
    }
    if (event.target.closest('[data-push-backend]')) {
      try { await pushLocalStorageToBackend(); showToast('ส่งข้อมูลเครื่องนี้ขึ้น Backend แล้ว'); }
      catch (error) { showToast(error.message); }
    }
    if (event.target.closest('[data-backend-logout]')) {
      clearBackendSession();
      state.mode = 'local';
      hydrateSession();
      showToast('ออกจาก Backend session แล้ว');
    }
  });
  document.getElementById('pinLoginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const session = await apiLoginWithPin(payload);
      saveBackendSession(session);
      state.mode = 'backend';
      state.user = session.user;
      setCurrentUser(session.user.id);
      updateBadge('Backend', session.user.displayName);
      pullBackendToLocalStorage().catch(() => {});
      document.getElementById('productionAuthPanel').hidden = true;
      showToast('เข้าสู่ Backend สำเร็จ');
    } catch (error) {
      showToast(error.message);
    }
  });
}

function decoratePermissionButtons() {
  document.body.addEventListener('click', event => {
    const permission = event.target.closest('[data-requires-permission]')?.dataset.requiresPermission;
    if (permission && !requireUiPermission(permission)) {
      event.preventDefault();
      event.stopPropagation();
      showToast('ผู้ใช้นี้ไม่มีสิทธิ์ทำรายการนี้');
    }
  }, true);
}

function updateBadge(mode, name) {
  const btn = document.getElementById('openProductionAuth');
  if (btn) {
    btn.textContent = 'บัญชี';
    btn.title = `${mode} • ${name || '-'}`;
    btn.setAttribute('aria-label', `${mode} • ${name || '-'}`);
  }
}

function enableDraggableAuthBadge() {
  const badge = document.getElementById('productionAuthBadge');
  const button = document.getElementById('openProductionAuth');
  if (!badge || !button || badge.dataset.draggableReady === '1') return;
  badge.dataset.draggableReady = '1';
  applySavedBadgePosition(badge);

  let startX = 0;
  let startY = 0;
  let baseLeft = 0;
  let baseTop = 0;
  let dragging = false;

  const move = event => {
    if (!dragging) return;
    const point = event.touches?.[0] || event;
    const nextLeft = clamp(baseLeft + point.clientX - startX, 8, window.innerWidth - badge.offsetWidth - 8);
    const nextTop = clamp(baseTop + point.clientY - startY, 8, window.innerHeight - badge.offsetHeight - 8);
    badge.style.left = `${nextLeft}px`;
    badge.style.top = `${nextTop}px`;
    badge.style.right = 'auto';
    badge.style.bottom = 'auto';
    if (Math.abs(point.clientX - startX) + Math.abs(point.clientY - startY) > 8) button.dataset.dragged = '1';
  };

  const end = () => {
    if (!dragging) return;
    dragging = false;
    badge.classList.remove('dragging');
    localStorage.setItem(BADGE_POSITION_KEY, JSON.stringify({
      left: badge.offsetLeft,
      top: badge.offsetTop
    }));
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('touchmove', move);
    window.removeEventListener('touchend', end);
  };

  const start = event => {
    const point = event.touches?.[0] || event;
    startX = point.clientX;
    startY = point.clientY;
    const rect = badge.getBoundingClientRect();
    baseLeft = rect.left;
    baseTop = rect.top;
    dragging = true;
    button.dataset.dragged = '0';
    badge.classList.add('dragging');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  };

  badge.addEventListener('pointerdown', start);
  badge.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('resize', () => applySavedBadgePosition(badge));
}

function applySavedBadgePosition(badge) {
  try {
    const saved = JSON.parse(localStorage.getItem(BADGE_POSITION_KEY) || 'null');
    if (!saved) return;
    badge.style.left = `${clamp(Number(saved.left) || 16, 8, window.innerWidth - badge.offsetWidth - 8)}px`;
    badge.style.top = `${clamp(Number(saved.top) || 16, 8, window.innerHeight - badge.offsetHeight - 8)}px`;
    badge.style.right = 'auto';
    badge.style.bottom = 'auto';
  } catch {
    localStorage.removeItem(BADGE_POSITION_KEY);
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
