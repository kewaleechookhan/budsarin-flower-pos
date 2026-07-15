export const safeNumber = (value, fallback = 0) => {
  const parsed = typeof value === 'string' ? Number(value.replace(/,/g, '')) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const safeDivide = (numerator, denominator, fallback = 0) => {
  const bottom = safeNumber(denominator);
  if (bottom === 0) return fallback;
  return safeNumber(numerator) / bottom;
};

export const safeDate = (value, fallback = new Date()) => {
  const date = value ? new Date(value) : new Date(fallback);
  return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
};

export const formatCurrency = value => new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0
}).format(safeNumber(value));

export const currency = formatCurrency;

export const number = value => new Intl.NumberFormat('th-TH').format(safeNumber(value));

export const formatPercent = (value, digits = 1) => `${safeNumber(value).toFixed(digits)}%`;

export const thaiDate = (date = new Date()) => new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(safeDate(date));

export const daysLeftThisMonth = (date = new Date()) => {
  const d = safeDate(date);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return Math.max(last.getDate() - d.getDate() + 1, 1);
};

export function showToast(message, tone = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

export function closeOnOutside(root, trigger, callback) {
  document.addEventListener('click', event => {
    if (!root.contains(event.target) && !trigger.contains(event.target)) callback();
  });
}
