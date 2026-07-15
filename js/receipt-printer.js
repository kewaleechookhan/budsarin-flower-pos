import { loadStoreProfile } from './settings-service.js';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';
import { currency, showToast } from './utils.js';
import { apiPrinterJob } from './api-client.js';
import { generateReceipt } from './receipt.js';

export const defaultPrinterSettings = {
  printerMode: 'browser_print',
  paperWidth: 'A4',
  showLogo: true,
  showQRCode: true,
  showTaxId: false,
  footerMessage: 'ขอบคุณที่ไว้วางใจ Budsarin Flower',
  copies: 1
};

export function loadPrinterSettings() {
  return { ...defaultPrinterSettings, ...readStorage(STORAGE_KEYS.printerSettings, {}) };
}

export function savePrinterSettings(settings) {
  const next = { ...loadPrinterSettings(), ...settings };
  writeStorage(STORAGE_KEYS.printerSettings, next);
  return next;
}

export function generateThermalReceiptHTML(sale = null, settings = loadPrinterSettings()) {
  const profile = loadStoreProfile();
  const rows = sale?.items || [{ name: 'Test Bouquet', quantity: 1, price: 890 }, { name: 'Delivery', quantity: 1, price: 100 }];
  const total = sale?.total || rows.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  return `<section class="thermal-receipt ${settings.paperWidth === '58mm' ? 'w58' : 'w80'}">
    <h1>${profile.storeNameEn}</h1><p>${profile.phone || ''}</p>${settings.showTaxId ? `<p>Tax ID: ${profile.taxId || '-'}</p>` : ''}
    <hr>${rows.map(item => `<div><span>${item.name} x${item.quantity || 1}</span><b>${currency((item.price || 0) * (item.quantity || 1))}</b></div>`).join('')}
    <hr><div class="total"><span>Total</span><b>${currency(total)}</b></div>${settings.showQRCode ? '<div class="receipt-qr-placeholder">QR</div>' : ''}
    <p>${settings.footerMessage}</p>
  </section>`;
}

export function printReceiptBrowser(sale = null) {
  const settings = loadPrinterSettings();
  const html = settings.paperWidth === 'A4' && sale ? generateReceipt(sale) : generateThermalReceiptHTML(sale, settings);
  apiPrinterJob({ html, saleId: sale?.id || '', copies: loadPrinterSettings().copies }).catch(() => {});
  openPrintWindow(html);
}

export function printTestReceipt() {
  printReceiptBrowser();
  showToast('เปิดใบเสร็จทดสอบ เลือกเครื่องพิมพ์ AirPrint ได้');
}

export function detectPrinterCapabilityPlaceholder() {
  return {
    browserPrint: true,
    webUsb: 'usb' in navigator,
    bluetooth: 'bluetooth' in navigator,
    message: 'WebUSB/Bluetooth เป็น placeholder จนกว่าจะตั้งค่า production'
  };
}

export function initReceiptPrinter() {
  document.addEventListener('click', event => {
    if (event.target.closest('[data-print-test-receipt]')) printTestReceipt();
    if (event.target.closest('[data-detect-printer]')) showToast(detectPrinterCapabilityPlaceholder().message);
  });
}

function openPrintWindow(html) {
  const printWindow = window.open('', '_blank', 'width=420,height=720');
  if (!printWindow) return showToast('Browser blocked print window', 'error');
  const posCss = `${location.origin}/css/pos.css`;
  const receiptCss = `${location.origin}/css/receipt-print.css`;
  const stylesCss = `${location.origin}/css/styles.css`;
  printWindow.document.write(`<!doctype html><html><head><title>Budsarin Receipt</title><link rel="stylesheet" href="${stylesCss}"><link rel="stylesheet" href="${posCss}"><link rel="stylesheet" href="${receiptCss}"></head><body><div id="receiptPreview">${html}</div><script>window.onload=()=>window.print();</script></body></html>`);
  printWindow.document.close();
}
