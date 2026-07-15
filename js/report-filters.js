import { defaultReportFilters } from './reports-data.js';

const DAY = 24 * 60 * 60 * 1000;

export function resolveDateRange(filters = {}) {
  const now = new Date();
  const dateRange = filters.dateRange || defaultReportFilters.dateRange;
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (dateRange === 'today') start = end;
  if (dateRange === 'last7days') start = new Date(end.getTime() - (6 * DAY));
  if (dateRange === 'lastMonth') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  }
  if (dateRange === 'thisQuarter') {
    start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  }
  if (dateRange === 'thisYear') start = new Date(now.getFullYear(), 0, 1);
  if (dateRange === 'custom') {
    start = parseDate(filters.startDate) || start;
    end = parseDate(filters.endDate) || end;
  }
  return { startDate: toDateKey(start), endDate: toDateKey(end) };
}

export function applyReportFilters(items = [], filters = {}, options = {}) {
  const range = resolveDateRange(filters);
  const dateField = options.dateField || 'date';
  return items.filter(item => {
    const date = getItemDate(item, dateField);
    if (date && (date < range.startDate || date > range.endDate)) return false;
    if (!matches(filters.channel, item.channel || item.sourceType || item.saleChannel)) return false;
    if (!matches(filters.category, item.category || item.orderType || item.eventType)) return false;
    if (!matches(filters.status, item.status || item.orderStatus || item.paymentStatus || item.poStatus)) return false;
    if (!matches(filters.customerSegment, item.customerSegment)) return false;
    if (!matches(filters.supplierId, item.supplierId)) return false;
    if (!matches(filters.eventType, item.eventType)) return false;
    if (!matches(filters.paymentMethod, item.paymentMethod)) return false;
    return true;
  });
}

export function resetReportFilters() {
  return { ...defaultReportFilters, ...resolveDateRange(defaultReportFilters) };
}

export function saveFilterPreset(name, filters) {
  const presets = loadReportPreset();
  const preset = {
    id: crypto.randomUUID(),
    presetName: name || `Preset ${presets.length + 1}`,
    reportType: filters.reportType || 'executive',
    dateRange: filters.dateRange || 'thisMonth',
    filters,
    createdAt: new Date().toISOString()
  };
  presets.unshift(preset);
  localStorage.setItem('budsarin_report_presets', JSON.stringify(presets));
  return preset;
}

export function loadReportPreset() {
  try {
    return JSON.parse(localStorage.getItem('budsarin_report_presets')) || [];
  } catch {
    return [];
  }
}

export function deleteReportPreset(id) {
  const next = loadReportPreset().filter(item => item.id !== id);
  localStorage.setItem('budsarin_report_presets', JSON.stringify(next));
  return next;
}

export function validateDateRange(filters) {
  const range = resolveDateRange(filters);
  if (range.startDate > range.endDate) return 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด';
  return '';
}

function matches(filterValue, itemValue) {
  return !filterValue || filterValue === 'all' || String(itemValue || '') === String(filterValue);
}

function getItemDate(item, field) {
  const value = item[field] || item.date || item.createdAt || item.orderDate || item.dueDate || item.eventDate;
  return value ? String(value).slice(0, 10) : '';
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}
