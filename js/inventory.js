import { calculateItemValue, calculateReorderQuantity } from './inventory-calculations.js';
import { inventoryCategories, movementTypes, qualityStatuses, referenceTypes, wasteReasons } from './inventory-data.js';
import { adjustStock, deductStock, getInventoryAlerts, getInventoryKpis, loadInventoryItems, loadInventorySettings, receiveStock, recordWaste, saveInventoryItem, saveInventorySettings } from './inventory-service.js?v=20260713b';
import { loadStockMovements } from './stock-movements.js?v=20260713b';
import { renderIcon } from './icons.js?v=20260713b';
import { loadSuppliers } from './suppliers-service.js';
import { currency, number, showToast, thaiDate } from './utils.js';
import { loadWasteItems } from './waste-management.js?v=20260713b';

const state = { tab: 'overview', query: '', category: 'all', quality: 'all', supplier: 'all' };
const tabs = [
  ['overview', 'ภาพรวมสต็อก'],
  ['items', 'รายการสต็อก'],
  ['stock-in', 'รับเข้าสินค้า'],
  ['stock-out', 'ตัดสต็อก'],
  ['waste', 'Waste / ของเสีย'],
  ['alerts', 'ใกล้หมด / ควรรีบใช้'],
  ['supplier', 'Supplier Sync'],
  ['settings', 'ตั้งค่าสต็อก']
];

export function initInventory() {
  renderInventoryShell();
  renderInventory();
  bindInventoryEvents();
}

function renderInventoryShell() {
  document.getElementById('inventoryView').innerHTML = `
    <section class="inventory-header panel">
      <div><p class="eyebrow">Phase 7 Inventory</p><h3>สต็อกดอกไม้และวัสดุ</h3><span>ติดตามของสด วันควรใช้ Waste และ Supplier Sync</span></div>
      <div class="inventory-actions">
        <button class="primary-button" data-inventory-tab-shortcut="stock-in" type="button">${renderIcon('plus')}รับเข้า</button>
        <button class="soft-button" data-inventory-tab-shortcut="stock-out" type="button">${renderIcon('minus')}ตัดสต็อก</button>
        <button class="danger-button" data-inventory-tab-shortcut="waste" type="button">${renderIcon('trash')}บันทึก Waste</button>
      </div>
    </section>
    <nav class="inventory-tabs panel" role="tablist">${tabs.map(([id, label]) => `<button class="${state.tab === id ? 'active' : ''}" data-inventory-tab="${id}" type="button">${label}</button>`).join('')}</nav>
    <section id="inventoryContent"></section>
  `;
}

function renderInventory() {
  document.querySelectorAll('[data-inventory-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.inventoryTab === state.tab));
  const views = { overview: renderOverview, items: renderItems, 'stock-in': renderStockIn, 'stock-out': renderStockOut, waste: renderWaste, alerts: renderAlerts, supplier: renderSupplierSync, settings: renderSettings };
  document.getElementById('inventoryContent').innerHTML = views[state.tab]();
}

function renderOverview() {
  const items = loadInventoryItems();
  const waste = loadWasteItems();
  const movements = loadStockMovements();
  const k = getInventoryKpis(items, waste, movements);
  const categoryValue = Object.entries(inventoryCategories).map(([id, label]) => ({ label, value: items.filter(item => item.category === id).reduce((sum, item) => sum + calculateItemValue(item), 0) })).filter(row => row.value);
  return `
    <section class="inventory-kpis">
      ${kpi('จำนวนรายการทั้งหมด', k.totalItems, 'boxes', false)}
      ${kpi('มูลค่าสต็อกปัจจุบัน', k.stockValue, 'wallet')}
      ${kpi('รายการใกล้หมด', k.lowStock, 'alert-circle', false)}
      ${kpi('รายการควรรีบใช้', k.useSoon, 'bell', false)}
      ${kpi('Waste Cost เดือนนี้', k.wasteCost, 'trash')}
      ${kpi('Stock Turnover', k.turnover.toFixed(2), 'rotate-ccw', false)}
    </section>
    <section class="inventory-grid">
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Stock Value</p><h3>มูลค่าตามหมวด</h3></div></div>${barList(categoryValue)}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Waste</p><h3>Waste Cost รายเดือน</h3></div><span class="badge ${k.wasteRate > loadInventorySettings().targetWasteRate ? 'danger' : 'success'}">${number(k.wasteRate.toFixed(1))}%</span></div>${barList(groupWaste(waste))}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">In vs Out</p><h3>Stock In / Out ล่าสุด</h3></div></div>${movementRows(movements.slice(0, 6))}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Alerts</p><h3>รายการใกล้หมด</h3></div></div>${itemRows(getInventoryAlerts(items).lowStock.slice(0, 6))}</article>
    </section>
    <section class="panel inventory-summary-strip"><div><span>ใช้มากที่สุด</span><strong>${k.topUsedItem}</strong></div><div><span>Supplier ซื้อบ่อย</span><strong>${k.topSupplier}</strong></div><div><span>รายการควรรีบใช้</span><strong>${k.useSoon}</strong></div></section>
  `;
}

function renderItems() {
  const rows = filteredItems();
  return `
    ${filterBar()}
    <section class="inventory-table panel">
      <div class="inventory-table-head"><span>รายการ</span><span>คงเหลือ</span><span>ต้นทุนเฉลี่ย</span><span>Supplier</span><span>วันควรใช้</span><span>สถานะ</span><span>Action</span></div>
      ${rows.map(itemTableRow).join('') || empty('ไม่พบรายการสต็อก')}
    </section>
    <section class="panel"><div class="panel-heading"><div><p class="eyebrow">Add / Edit</p><h3>เพิ่มรายการสต็อก</h3></div></div>${itemForm()}</section>
  `;
}

function renderStockIn() {
  return `<section class="panel inventory-form-panel"><div class="panel-heading"><div><p class="eyebrow">Stock In</p><h3>รับเข้าสินค้า</h3></div></div>${stockInForm()}</section>${movementPanel('stock_in')}`;
}

function renderStockOut() {
  return `<section class="panel inventory-form-panel"><div class="panel-heading"><div><p class="eyebrow">Stock Out</p><h3>ตัดสต็อก</h3></div></div>${stockOutForm()}</section>${movementPanel('stock_out')}`;
}

function renderWaste() {
  const rows = loadWasteItems();
  return `<section class="inventory-grid two">
    <article class="panel inventory-form-panel"><div class="panel-heading"><div><p class="eyebrow">Waste</p><h3>บันทึกของเสีย</h3></div></div>${wasteForm()}</article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Waste Report</p><h3>รายการของเสียล่าสุด</h3></div></div>${rows.map(wasteRow).join('') || empty('ยังไม่มี Waste')}</article>
  </section>`;
}

function renderAlerts() {
  const alerts = getInventoryAlerts();
  return `<section class="inventory-grid two">
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Low Stock</p><h3>ใกล้หมด</h3></div></div>${itemRows(alerts.lowStock, true)}</article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Use Soon</p><h3>ควรรีบใช้</h3></div></div>${itemRows(alerts.useSoon, true)}</article>
  </section>`;
}

function renderSupplierSync() {
  const items = loadInventoryItems();
  const suppliers = Object.values(items.reduce((map, item) => {
    const id = item.supplierId || item.supplierName || 'unknown';
    map[id] ||= { supplierId: item.supplierId, supplierName: item.supplierName || 'ไม่ระบุ', items: 0, value: 0, lastPurchasePrice: 0 };
    map[id].items += 1;
    map[id].value += calculateItemValue(item);
    map[id].lastPurchasePrice = item.costPerUnit;
    return map;
  }, {}));
  return `<section class="inventory-grid two">
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Supplier Sync</p><h3>เชื่อมซัพพลายเออร์</h3></div></div>${suppliers.map(supplierCard).join('')}</article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Purchase Hooks</p><h3>พร้อมต่อ PO Phase 8</h3></div></div>
      <div class="inventory-hook-list">
        <button class="soft-button" data-open-route="suppliers" type="button">${renderIcon('rotate-ccw')}สั่งซื้อซ้ำ</button>
        <button class="soft-button" data-open-route="suppliers" type="button">${renderIcon('bar-chart-3')}ดูประวัติราคา</button>
        <button class="primary-button" data-inventory-tab-shortcut="stock-in" type="button">${renderIcon('plus')}สร้างรายการซื้อเข้า</button>
        <button class="soft-button" data-open-route="finance" type="button">${renderIcon('wallet')}สร้างรายจ่ายจากการซื้อ</button>
      </div>
    </article>
  </section>`;
}

function renderSettings() {
  const s = loadInventorySettings();
  return `<section class="panel inventory-form-panel"><div class="panel-heading"><div><p class="eyebrow">Inventory Settings</p><h3>ตั้งค่าสต็อก</h3></div></div>
    <form id="inventorySettingsForm" class="inventory-form">
      ${checkboxField('allowNegativeStock', 'อนุญาตติดลบสต็อก', s.allowNegativeStock)}
      ${inputField('useSoonWarningDays', 'จำนวนวันก่อนเตือน use soon', 'number', s.useSoonWarningDays)}
      ${inputField('expiryWarningDays', 'จำนวนวันก่อนเตือน expiry', 'number', s.expiryWarningDays)}
      ${checkboxField('autoDeductPOS', 'เปิด auto deduct จาก POS', s.autoDeductPOS)}
      ${checkboxField('autoDeductOrders', 'เปิด auto deduct จาก Orders', s.autoDeductOrders)}
      ${checkboxField('autoFinanceExpenseStockIn', 'สร้างรายจ่าย Finance จาก Stock In อัตโนมัติ', s.autoFinanceExpenseStockIn)}
      ${inputField('targetWasteRate', 'ค่า Waste Rate เป้าหมาย %', 'number', s.targetWasteRate)}
      <button class="primary-button" type="submit">${renderIcon('save')}บันทึก Settings</button>
    </form></section>`;
}

function bindInventoryEvents() {
  document.getElementById('inventoryView').addEventListener('click', event => {
    const tab = event.target.closest('[data-inventory-tab], [data-inventory-tab-shortcut]')?.dataset.inventoryTab || event.target.closest('[data-inventory-tab-shortcut]')?.dataset.inventoryTabShortcut;
    const edit = event.target.closest('[data-edit-inventory]')?.dataset.editInventory;
    const stockOut = event.target.closest('[data-quick-stock-out]')?.dataset.quickStockOut;
    const waste = event.target.closest('[data-quick-waste]')?.dataset.quickWaste;
    const adjust = event.target.closest('[data-adjust-stock]')?.dataset.adjustStock;
    if (tab) { state.tab = tab; renderInventory(); }
    if (edit) loadItemIntoForm(edit);
    if (stockOut) { state.tab = 'stock-out'; renderInventory(); setValue('stockOutItemId', stockOut); }
    if (waste) { state.tab = 'waste'; renderInventory(); setValue('wasteItemId', waste); }
    if (adjust) quickAdjust(adjust);
    const openRoute = event.target.closest('[data-open-route]')?.dataset.openRoute;
    if (openRoute) window.dispatchEvent(new CustomEvent('route:open', { detail: openRoute }));
  });
  document.getElementById('inventoryView').addEventListener('input', event => {
    if (event.target.id === 'inventorySearch') state.query = event.target.value;
    if (event.target.id === 'inventoryCategoryFilter') state.category = event.target.value;
    if (event.target.id === 'inventoryQualityFilter') state.quality = event.target.value;
    if (event.target.id === 'inventorySupplierFilter') state.supplier = event.target.value;
    if (['inventorySearch', 'inventoryCategoryFilter', 'inventoryQualityFilter', 'inventorySupplierFilter'].includes(event.target.id)) renderInventory();
  });
  document.getElementById('inventoryView').addEventListener('submit', event => {
    event.preventDefault();
    try {
      if (event.target.id === 'inventoryItemForm') { saveInventoryItem(Object.fromEntries(new FormData(event.target).entries())); event.target.reset(); showToast('บันทึกรายการสต็อกแล้ว'); }
      if (event.target.id === 'stockInForm') { receiveStock(Object.fromEntries(new FormData(event.target).entries()), event.target.elements.syncExpense.checked); showToast('รับเข้าสินค้าแล้ว'); }
      if (event.target.id === 'stockOutForm') { deductStock(Object.fromEntries(new FormData(event.target).entries())); showToast('ตัดสต็อกแล้ว'); }
      if (event.target.id === 'wasteForm') { recordWaste(Object.fromEntries(new FormData(event.target).entries())); showToast('บันทึก Waste แล้ว'); }
      if (event.target.id === 'inventorySettingsForm') { saveInventorySettings(Object.fromEntries(new FormData(event.target).entries())); showToast('บันทึก Inventory Settings แล้ว'); }
      renderInventory();
    } catch (error) {
      showToast(error.message);
    }
  });
}

function filterBar() {
  const suppliers = [...new Set(loadInventoryItems().map(item => item.supplierName).filter(Boolean))];
  return `<section class="inventory-toolbar panel">
    <label>${renderIcon('search')}<input id="inventorySearch" type="search" value="${escapeHtml(state.query)}" placeholder="ค้นหารายการ สถานที่ หรือ Supplier"></label>
    <select id="inventoryCategoryFilter"><option value="all">ทุกหมวด</option>${optionMap(inventoryCategories, state.category)}</select>
    <select id="inventoryQualityFilter"><option value="all">ทุกคุณภาพ</option>${Object.entries(qualityStatuses).map(([id, item]) => `<option value="${id}" ${id === state.quality ? 'selected' : ''}>${item.label}</option>`).join('')}</select>
    <select id="inventorySupplierFilter"><option value="all">ทุก Supplier</option>${suppliers.map(name => `<option value="${name}" ${name === state.supplier ? 'selected' : ''}>${name}</option>`).join('')}</select>
  </section>`;
}

function itemForm(item = {}) {
  return `<form id="inventoryItemForm" class="inventory-form">
    <input type="hidden" name="id" value="${item.id || ''}">
    ${inputField('itemName', 'ชื่อรายการ', 'text', item.itemName)}
    <label>หมวด<select name="category">${optionMap(inventoryCategories, item.category || 'fresh_flower')}</select></label>
    ${inputField('subCategory', 'หมวดย่อย', 'text', item.subCategory)}
    ${inputField('unit', 'หน่วยนับ', 'text', item.unit || 'ก้าน')}
    ${inputField('quantityOnHand', 'คงเหลือ', 'number', item.quantityOnHand || 0)}
    ${inputField('minimumStock', 'ขั้นต่ำ', 'number', item.minimumStock || 0)}
    ${inputField('maximumStock', 'สูงสุด', 'number', item.maximumStock || 0)}
    ${inputField('costPerUnit', 'ทุน/หน่วย', 'number', item.costPerUnit || 0)}
    ${supplierSelect(item.supplierId, item.supplierName)}
    ${inputField('expiryDate', 'วันหมดอายุ', 'date', item.expiryDate)}
    ${inputField('useByDate', 'วันควรใช้', 'date', item.useByDate)}
    ${inputField('storageLocation', 'ที่เก็บ', 'text', item.storageLocation)}
    ${checkboxField('isPerishable', 'เป็นของสด/เน่าเสียง่าย', item.isPerishable)}
    ${checkboxField('stockTracking', 'เปิด stock tracking', item.stockTracking !== false)}
    <label class="full">หมายเหตุ<textarea name="note">${escapeHtml(item.note || '')}</textarea></label>
    <button class="primary-button" type="submit">${renderIcon('save')}บันทึกรายการ</button>
  </form>`;
}

function stockInForm() {
  return `<form id="stockInForm" class="inventory-form">
    <label>เลือกรายการ<select name="itemId">${itemOptions()}</select></label>
    ${inputField('itemName', 'หรือชื่อรายการใหม่', 'text', '')}
    <label>หมวดใหม่<select name="category">${optionMap(inventoryCategories, 'fresh_flower')}</select></label>
    ${inputField('quantity', 'จำนวนรับเข้า', 'number', 1)}
    ${inputField('unit', 'หน่วยนับ', 'text', 'ก้าน')}
    ${inputField('unitCost', 'ราคาทุน/หน่วย', 'number', 0)}
    ${supplierSelect()}
    ${inputField('receivedDate', 'วันที่รับเข้า', 'date', new Date().toISOString().slice(0, 10))}
    ${inputField('expiryDate', 'วันหมดอายุ', 'date', '')}
    ${inputField('useByDate', 'วันควรใช้', 'date', '')}
    ${inputField('storageLocation', 'สถานที่เก็บ', 'text', '')}
    ${checkboxField('syncExpense', 'สร้างรายจ่ายใน Finance', false)}
    <label class="full">หมายเหตุ<textarea name="note"></textarea></label>
    <button class="primary-button" type="submit">${renderIcon('save')}บันทึกรับเข้า</button>
  </form>`;
}

function stockOutForm() {
  return `<form id="stockOutForm" class="inventory-form">
    <label>รายการ<select id="stockOutItemId" name="itemId">${itemOptions(false)}</select></label>
    ${inputField('quantity', 'จำนวนตัดออก', 'number', 1)}
    <label>Reference Type<select name="referenceType">${referenceTypes.map(id => `<option value="${id}">${id}</option>`).join('')}</select></label>
    ${inputField('referenceId', 'Reference ID', 'text', '')}
    ${inputField('reason', 'เหตุผล', 'text', 'ใช้งานผลิตงาน')}
    <label class="full">หมายเหตุ<textarea name="note"></textarea></label>
    <button class="primary-button" type="submit">${renderIcon('minus')}ตัดสต็อก</button>
  </form>`;
}

function wasteForm() {
  return `<form id="wasteForm" class="inventory-form">
    <label>รายการ<select id="wasteItemId" name="itemId">${itemOptions(false)}</select></label>
    ${inputField('quantity', 'จำนวนของเสีย', 'number', 1)}
    <label>เหตุผล<select name="reason">${Object.entries(wasteReasons).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label>
    ${inputField('wasteDate', 'วันที่บันทึก Waste', 'date', new Date().toISOString().slice(0, 10))}
    ${checkboxField('markDisposed', 'ทำเครื่องหมายตัดจำหน่าย', false)}
    <label class="full">หมายเหตุ<textarea name="note"></textarea></label>
    <button class="danger-button" type="submit">${renderIcon('trash')}บันทึก Waste</button>
  </form>`;
}

function filteredItems() {
  const q = state.query.trim().toLowerCase();
  return loadInventoryItems().filter(item => {
    const text = `${item.itemName} ${item.itemCode} ${item.supplierName} ${item.storageLocation}`.toLowerCase();
    return (!q || text.includes(q)) && (state.category === 'all' || item.category === state.category) && (state.quality === 'all' || item.qualityStatus === state.quality) && (state.supplier === 'all' || item.supplierName === state.supplier);
  });
}

function itemTableRow(item) {
  return `<div class="inventory-table-row">
    <div><strong>${item.itemName}</strong><small>${item.itemCode} • ${inventoryCategories[item.category]}</small></div>
    <div><strong>${number(item.quantityOnHand)} ${item.unit}</strong><small>ขั้นต่ำ ${number(item.minimumStock)} • สั่งเพิ่ม ${number(calculateReorderQuantity(item.maximumStock, item.quantityOnHand))}</small></div>
    <div>${currency(item.averageCost)}<small>มูลค่า ${currency(calculateItemValue(item))}</small></div>
    <div>${item.supplierName || '-'}<small>${item.storageLocation || '-'}</small></div>
    <div>${item.useByDate ? thaiDate(item.useByDate) : '-'}<small>${item.expiryDate ? `หมดอายุ ${thaiDate(item.expiryDate)}` : ''}</small></div>
    <div>${qualityBadge(item.qualityStatus)}</div>
    <div class="inventory-row-actions"><button class="soft-button" data-edit-inventory="${item.id}" type="button">แก้ไข</button><button class="soft-button" data-quick-stock-out="${item.id}" type="button">ตัด</button><button class="danger-button" data-quick-waste="${item.id}" type="button">Waste</button></div>
  </div>`;
}

function itemRows(items, actions = false) {
  return items.map(item => `<div class="inventory-alert-row"><div><strong>${item.itemName}</strong><span>${number(item.quantityOnHand)} ${item.unit} • ${inventoryCategories[item.category]}</span></div>${qualityBadge(item.qualityStatus)}${actions ? `<button class="soft-button" data-quick-stock-out="${item.id}" type="button">ตัดสต็อก</button>` : ''}</div>`).join('') || empty('ไม่มีรายการ');
}

function movementPanel(type) {
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">Movements</p><h3>${movementTypes[type]}ล่าสุด</h3></div></div>${movementRows(loadStockMovements().filter(item => item.movementType === type).slice(0, 8))}</section>`;
}

function movementRows(rows) {
  return rows.map(item => `<div class="inventory-movement-row"><div><strong>${item.itemName}</strong><span>${movementTypes[item.movementType]} • ${item.referenceType}</span></div><b>${number(item.quantity)} ${item.unit}</b><small>${currency(item.totalCost)}</small></div>`).join('') || empty('ยังไม่มี movement');
}

function wasteRow(item) {
  return `<div class="inventory-movement-row"><div><strong>${item.itemName}</strong><span>${wasteReasons[item.reason] || item.reason} • ${item.wasteDate}</span></div><b>${number(item.quantity)} ${item.unit}</b><small>${currency(item.totalWasteCost)}</small></div>`;
}

function supplierCard(item) {
  return `<article class="inventory-supplier-card"><div><strong>${item.supplierName}</strong><span>${item.items} รายการ • มูลค่า ${currency(item.value)}</span></div><div class="inventory-row-actions"><button class="soft-button" data-open-route="suppliers" type="button">สั่งซื้อซ้ำ</button><button class="soft-button" data-open-route="suppliers" type="button">ประวัติราคา</button></div></article>`;
}

function groupWaste(waste) {
  return Object.entries(waste.reduce((map, item) => {
    const key = item.wasteDate?.slice(0, 7) || 'unknown';
    map[key] = (map[key] || 0) + Number(item.totalWasteCost || 0);
    return map;
  }, {})).map(([label, value]) => ({ label, value }));
}

function barList(rows) {
  const max = Math.max(...rows.map(item => item.value), 1);
  return `<div class="inventory-bars">${rows.map(item => `<div><span>${item.label}</span><strong>${currency(item.value)}</strong><em style="width:${Math.max((item.value / max) * 100, 8)}%"></em></div>`).join('') || empty('ยังไม่มีข้อมูล')}</div>`;
}

function kpi(label, value, icon, money = true) {
  return `<article class="inventory-kpi"><span>${renderIcon(icon)}</span><small>${label}</small><strong>${money ? currency(value) : number(value)}</strong></article>`;
}

function itemOptions(allowBlank = true) {
  return `${allowBlank ? '<option value="">เพิ่มรายการใหม่</option>' : ''}${loadInventoryItems().map(item => `<option value="${item.id}">${item.itemName} (${number(item.quantityOnHand)} ${item.unit})</option>`).join('')}`;
}

function supplierSelect(selectedId = '', selectedName = '') {
  let suppliers = [];
  try { suppliers = loadSuppliers(); } catch { suppliers = []; }
  if (!suppliers.length) {
    return `${inputField('supplierId', 'Supplier ID', 'text', selectedId)}${inputField('supplierName', 'Supplier Name', 'text', selectedName)}`;
  }
  return `<label>Supplier<select name="supplierId">${suppliers.map(item => `<option value="${item.id}" ${item.id === selectedId ? 'selected' : ''}>${item.supplierName}</option>`).join('')}</select></label><input type="hidden" name="supplierName" value="${escapeHtml(selectedName || suppliers[0]?.supplierName || '')}">`;
}

function loadItemIntoForm(id) {
  const item = loadInventoryItems().find(row => row.id === id);
  if (!item) return;
  const panel = document.querySelector('#inventoryItemForm')?.parentElement;
  if (panel) panel.innerHTML = `<div class="panel-heading"><div><p class="eyebrow">Edit</p><h3>แก้ไขรายการสต็อก</h3></div></div>${itemForm(item)}`;
}

function quickAdjust(id) {
  const item = loadInventoryItems().find(row => row.id === id);
  if (!item) return;
  const value = prompt(`ปรับยอด ${item.itemName}`, item.quantityOnHand);
  if (value == null) return;
  try { adjustStock({ itemId: id, quantityOnHand: value, reason: 'ปรับยอดจาก Inventory UI' }); showToast('ปรับยอดแล้ว'); renderInventory(); }
  catch (error) { showToast(error.message); }
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function optionMap(options, value) {
  return Object.entries(options).map(([id, label]) => `<option value="${id}" ${id === value ? 'selected' : ''}>${label}</option>`).join('');
}

function qualityBadge(id) {
  const item = qualityStatuses[id] || qualityStatuses.good;
  return `<span class="badge ${item.tone}">${item.label}</span>`;
}

function inputField(name, label, type = 'text', value = '') {
  return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value ?? '')}"></label>`;
}

function checkboxField(name, label, checked = false) {
  return `<label class="inventory-check"><input name="${name}" type="hidden" value="false"><input name="${name}" type="checkbox" value="true" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
}

function empty(text) {
  return `<div class="empty-state">${text}</div>`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}
