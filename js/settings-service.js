import { defaultBrandSettings, defaultModuleSettings, defaultStoreProfile, defaultSystemFinanceSettings, defaultUsers } from './settings-data.js';
import { savePermissionSettings } from './permissions.js';

const STORE_KEY = 'budsarin_store_profile';
const BRAND_KEY = 'budsarin_brand_settings';
const FINANCE_KEY = 'budsarin_finance_settings';
const USERS_KEY = 'budsarin_users';
const MODULE_KEY = 'budsarin_module_settings';
const SYSTEM_KEY = 'budsarin_system_settings';

export function loadStoreProfile() {
  return loadObject(STORE_KEY, defaultStoreProfile);
}

export function saveStoreProfile(profile) {
  const next = { ...loadStoreProfile(), ...profile, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORE_KEY, JSON.stringify(next));
  applyBrandSettings(loadBrandSettings());
  window.dispatchEvent(new CustomEvent('settings:store-updated', { detail: next }));
  return next;
}

export function loadBrandSettings() {
  return loadObject(BRAND_KEY, defaultBrandSettings);
}

export function saveBrandSettings(settings) {
  const next = { ...loadBrandSettings(), ...settings };
  localStorage.setItem(BRAND_KEY, JSON.stringify(next));
  applyBrandSettings(next);
  return next;
}

export function applyBrandSettings(settings = loadBrandSettings()) {
  const profile = loadStoreProfile();
  document.documentElement.style.setProperty('--pink', settings.primaryColor);
  document.documentElement.style.setProperty('--gold', settings.accentColor);
  document.documentElement.style.setProperty('--cream', settings.creamColor);
  document.documentElement.style.setProperty('--deep', settings.textColor);
  document.documentElement.style.setProperty('--store-logo-url', profile.logoDataUrl ? `url("${profile.logoDataUrl}")` : 'none');
  document.documentElement.style.setProperty('--store-cover-url', profile.coverImageDataUrl ? `url("${profile.coverImageDataUrl}")` : 'none');
  document.documentElement.style.setProperty('--store-bg-url', profile.backgroundImageDataUrl ? `url("${profile.backgroundImageDataUrl}")` : 'none');
}

export function loadSystemFinanceSettings() {
  return loadObject(FINANCE_KEY, defaultSystemFinanceSettings);
}

export function validateFinanceSettings(settings) {
  const errors = [];
  if (Number(settings.vatRate) < 0 || Number(settings.vatRate) > 100) errors.push('VAT Rate ต้องอยู่ระหว่าง 0–100');
  if (Number(settings.serviceChargeRate) < 0 || Number(settings.serviceChargeRate) > 100) errors.push('Service Charge Rate ต้องอยู่ระหว่าง 0–100');
  if (Number(settings.targetGrossMargin) < 0 || Number(settings.targetGrossMargin) > 95) errors.push('Target Margin ต้องอยู่ระหว่าง 0–95');
  ['openingBalance', 'initialInvestment', 'fixedMonthlyCosts', 'targetNetProfit', 'minimumCashBalance'].forEach(key => {
    if (Number(settings[key]) < 0) errors.push(`${key} ห้ามติดลบ`);
  });
  return errors;
}

export function saveSystemFinanceSettings(settings) {
  const next = { ...loadSystemFinanceSettings(), ...settings };
  const errors = validateFinanceSettings(next);
  if (errors.length) throw new Error(errors.join(', '));
  localStorage.setItem(FINANCE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('settings:finance-updated', { detail: next }));
  return next;
}

export function loadUsers() {
  return loadArray(USERS_KEY, defaultUsers);
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

export function addUser(data) {
  const users = loadUsers();
  const user = { id: crypto.randomUUID(), status: 'active', allowedModules: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
  users.unshift(user);
  saveUsers(users);
  return user;
}

export function updateUser(id, data) {
  const users = loadUsers();
  const index = users.findIndex(user => user.id === id);
  if (index < 0) throw new Error('ไม่พบผู้ใช้งาน');
  users[index] = { ...users[index], ...data, updatedAt: new Date().toISOString() };
  saveUsers(users);
  return users[index];
}

export function loadModuleSettings() {
  return loadObject(MODULE_KEY, defaultModuleSettings);
}

export function saveModuleSettings(settings) {
  const next = { ...loadModuleSettings(), ...settings };
  localStorage.setItem(MODULE_KEY, JSON.stringify(next));
  return next;
}

export function loadSystemSettings() {
  return loadObject(SYSTEM_KEY, { lastBackupAt: '', allowBrandColorOverride: true });
}

export function saveSystemSettings(settings) {
  const next = { ...loadSystemSettings(), ...settings };
  localStorage.setItem(SYSTEM_KEY, JSON.stringify(next));
  return next;
}

export function initializeSettingsDefaults() {
  if (!localStorage.getItem(STORE_KEY)) localStorage.setItem(STORE_KEY, JSON.stringify(defaultStoreProfile));
  if (!localStorage.getItem(BRAND_KEY)) localStorage.setItem(BRAND_KEY, JSON.stringify(defaultBrandSettings));
  if (!localStorage.getItem(FINANCE_KEY)) localStorage.setItem(FINANCE_KEY, JSON.stringify(defaultSystemFinanceSettings));
  if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  if (!localStorage.getItem(MODULE_KEY)) localStorage.setItem(MODULE_KEY, JSON.stringify(defaultModuleSettings));
  applyBrandSettings();
}

export function saveRolePermissions(settings) {
  return savePermissionSettings(settings);
}

function loadObject(key, fallback) {
  try {
    return { ...fallback, ...(JSON.parse(localStorage.getItem(key)) || {}) };
  } catch {
    return { ...fallback };
  }
}

function loadArray(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}
