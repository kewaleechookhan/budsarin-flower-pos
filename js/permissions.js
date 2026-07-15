import { defaultPermissionSettings, permissions } from './settings-data.js';

const PERMISSION_KEY = 'budsarin_permission_settings';
const CURRENT_USER_KEY = 'budsarin_current_user';

export function loadPermissionSettings() {
  try {
    return { ...defaultPermissionSettings, ...(JSON.parse(localStorage.getItem(PERMISSION_KEY)) || {}) };
  } catch {
    return { ...defaultPermissionSettings };
  }
}

export function savePermissionSettings(settings) {
  const next = { ...loadPermissionSettings(), ...settings };
  localStorage.setItem(PERMISSION_KEY, JSON.stringify(next));
  return next;
}

export function getRolePermissions(role) {
  return loadPermissionSettings()[role] || [];
}

export function hasPermission(user, permission) {
  if (!permission || !permissions.includes(permission)) return false;
  if (user?.role === 'owner') return true;
  return getRolePermissions(user?.role).includes(permission);
}

export function setCurrentUser(userId) {
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

export function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_KEY) || 'user-owner';
}
