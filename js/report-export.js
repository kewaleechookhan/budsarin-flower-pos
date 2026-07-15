import { loadReportPreset, saveFilterPreset, deleteReportPreset as deletePreset } from './report-filters.js';

export function exportReportToCSV(reportType, data) {
  const rows = flattenReport(data);
  return toCSV(rows.length ? rows : [{ section: reportType, label: 'empty', value: 0 }]);
}

export function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printReport(reportType) {
  document.body.dataset.printReport = reportType;
  window.print();
}

export function saveReportPreset(presetName, reportType, filters) {
  return saveFilterPreset(presetName, { ...filters, reportType });
}

export function loadReportPresets() {
  return loadReportPreset();
}

export function deleteReportPreset(id) {
  return deletePreset(id);
}

function flattenReport(data, section = 'report') {
  if (Array.isArray(data)) {
    return data.flatMap((item, index) => flattenReport(item, `${section}.${index + 1}`));
  }
  if (data && typeof data === 'object') {
    return Object.entries(data).flatMap(([key, value]) => {
      if (Array.isArray(value) || (value && typeof value === 'object')) return flattenReport(value, `${section}.${key}`);
      return [{ section, label: key, value }];
    });
  }
  return [{ section, label: 'value', value: data ?? '' }];
}

function toCSV(rows) {
  const headers = ['section', 'label', 'value'];
  const body = rows.map(row => headers.map(header => csvCell(row[header])).join(','));
  return [headers.join(','), ...body].join('\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
