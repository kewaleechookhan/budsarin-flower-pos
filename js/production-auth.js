import { apiHealth, apiImportLocalStorage, apiLoginWithPin, clearBackendSession, getBackendSession, localStorageSnapshotForBackend, saveBackendSession } from './api-client.js';
import { pullBackendToLocalStorage, pushLocalStorageToBackend } from './backend-sync.js';
import { getCurrentUserId, hasPermission, setCurrentUser } from './permissions.js';
import { loadUsers } from './settings-service.js';
import { showToast } from './utils.js';

const state = { mode: 'local', user: null };

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
  document.getElementById('openProductionAuth').addEventListener('click', () => document.getElementById('productionAuthPanel').hidden = false);
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
  if (btn) btn.textContent = `${mode} • ${name || '-'}`;
}
