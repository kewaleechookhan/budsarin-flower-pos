import { costCategories, jobTypes, unitOptions } from './cost-data.js';
import { calculateCategorySubtotal, calculateGrossMargin, calculateGrossProfit, calculateMarkup, calculateSuggestedPriceByMargin, calculateSuggestedPriceByMarkup, calculateTotalCost, evaluateProfitStatus } from './cost-calculations.js';
import { applyCostToOrder, deleteTemplate, loadCostHistory, loadCostTemplates, saveHistory, saveTemplate } from './cost-service.js';
import { starterTemplate } from './cost-templates.js?v=20260717c';
import { renderIcon } from './icons.js';
import { loadInventoryItems } from './inventory-service.js';
import { currency, number, showToast } from './utils.js';

const state = structuredClone(starterTemplate);
state.applyOrderId = '';
state.lastTotals = null;

export function initCostCalculator() {
  renderCostShell();
  renderCostCalculator();
  bindCostEvents();
}

export function openCostCalculator(prefill = {}) {
  Object.assign(state, prefill);
  window.dispatchEvent(new CustomEvent('route:open', { detail: 'cost' }));
  renderCostCalculator();
}

function renderCostShell() {
  document.getElementById('costView').innerHTML = `
    <section class="cost-header panel">
      <div><p class="eyebrow">Phase 4 Cost Calculator</p><h3>คำนวณต้นทุนช่อดอกไม้</h3><span>วิเคราะห์ต้นทุน กำไร และราคาขายแนะนำ</span></div>
      <div class="cost-header-actions">
        <button class="soft-button" id="newCostBtn" type="button">${renderIcon('plus')}เริ่มคำนวณใหม่</button>
        <button class="primary-button" id="saveTemplateBtn" type="button">${renderIcon('save')}บันทึก Template</button>
        <button class="soft-button" id="applyOrderBtn" type="button">${renderIcon('package')}ผูกกับออร์เดอร์</button>
      </div>
    </section>
    <section class="cost-layout">
      <main class="cost-input panel">
        <div class="cost-basic-grid">
          <label>ประเภทงาน<select id="costJobType"></select></label>
          <label>ชื่อสูตรต้นทุน<input id="costTemplateName"></label>
          <label>ราคาขายที่ต้องการ<input id="costSellingPrice" type="number" min="0"></label>
          <label>เป้าหมาย Gross Margin %<input id="costTargetMargin" type="number" min="0" max="95"></label>
          <label>เป้าหมาย Markup %<input id="costTargetMarkup" type="number" min="0"></label>
          <label>Waste %<input id="costWasteRate" type="number" min="0" max="100"></label>
          <label>Waste คงที่<input id="costFixedWaste" type="number" min="0"></label>
          <label>Overhead %<input id="costOverheadRate" type="number" min="0" max="100"></label>
          <label>Overhead คงที่<input id="costFixedOverhead" type="number" min="0"></label>
        </div>
        <div class="cost-toolbar">
          <select id="quickCostItem" aria-label="เลือกวัตถุดิบเร็ว"></select>
          <button class="primary-button" id="addCostItemBtn" type="button">${renderIcon('plus')}เพิ่มรายการต้นทุน</button>
          <button class="danger-button" id="clearCostItemsBtn" type="button">${renderIcon('trash')}Clear รายการ</button>
        </div>
        <div class="cost-items" id="costItems"></div>
      </main>
      <aside class="cost-summary panel" id="costSummary"></aside>
      <aside class="cost-history panel">
        <div class="panel-heading"><div><p class="eyebrow">Templates & History</p><h3>สูตรที่บันทึกไว้</h3></div></div>
        <div id="costTemplates"></div>
        <div class="panel-heading compact"><div><p class="eyebrow">History</p><h3>ประวัติคำนวณ</h3></div></div>
        <div id="costHistory"></div>
      </aside>
    </section>
  `;
  document.getElementById('costJobType').innerHTML = Object.entries(jobTypes).map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
  const inventoryOptions = loadInventoryItems().map(item => `<option value="inventory:${item.id}">${item.itemName} - ${currency(item.averageCost || item.costPerUnit)}</option>`).join('');
  document.getElementById('quickCostItem').innerHTML = '<option value="">เพิ่มรายการว่าง</option>' + inventoryOptions;
  ensureCostModals();
}

function renderCostCalculator() {
  syncInputs();
  renderCostItems();
  renderCostSummary();
  renderTemplates();
}

function syncInputs() {
  setValue('costJobType', state.jobType);
  setValue('costTemplateName', state.templateName);
  setValue('costSellingPrice', state.sellingPrice);
  setValue('costTargetMargin', state.targetMargin);
  setValue('costTargetMarkup', state.targetMarkup);
  setValue('costWasteRate', state.wasteRate);
  setValue('costFixedWaste', state.fixedWasteCost);
  setValue('costOverheadRate', state.overheadRate);
  setValue('costFixedOverhead', state.fixedOverheadCost);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

function renderCostItems() {
  const grouped = costCategories.map(category => ({
    category,
    items: state.items.filter(item => item.category === category)
  })).filter(group => group.items.length);
  document.getElementById('costItems').innerHTML = grouped.map(group => `
    <section class="cost-category">
      <div class="cost-category-head"><h4>${group.category}</h4><strong>${currency(calculateCategorySubtotal(state.items, group.category))}</strong></div>
      ${group.items.map(costItemRow).join('')}
    </section>
  `).join('') || '<div class="empty-state">ยังไม่มีรายการต้นทุน</div>';
}

function costItemRow(item) {
  return `
    <div class="cost-row" data-cost-id="${item.id}">
      <select data-field="category">${costCategories.map(cat => `<option ${cat === item.category ? 'selected' : ''}>${cat}</option>`).join('')}</select>
      <input data-field="itemName" value="${item.itemName || ''}" aria-label="ชื่อรายการ">
      <div class="qty-stepper"><button data-dec="${item.id}" type="button">${renderIcon('minus')}</button><input data-field="quantity" type="number" min="0" value="${item.quantity}"><button data-inc="${item.id}" type="button">${renderIcon('plus')}</button></div>
      <select data-field="unit">${unitOptions.map(unit => `<option ${unit === item.unit ? 'selected' : ''}>${unit}</option>`).join('')}</select>
      <input data-field="unitCost" type="number" min="0" value="${item.unitCost}" aria-label="ราคาทุนต่อหน่วย">
      <strong data-row-total>${currency((Number(item.quantity) || 0) * (Number(item.unitCost) || 0))}</strong>
      <input data-field="supplier" value="${item.supplier || ''}" aria-label="ซัพพลายเออร์">
      <button class="icon-button" data-dup="${item.id}" type="button" aria-label="Duplicate">${renderIcon('plus')}</button>
      <button class="icon-button remove-button" data-del="${item.id}" type="button" aria-label="ลบ">${renderIcon('trash')}</button>
    </div>
  `;
}

function renderCostSummary() {
  const totals = calculateTotalCost(state);
  const suggestedByMargin = calculateSuggestedPriceByMargin(totals.totalCost, state.targetMargin);
  const suggestedByMarkup = calculateSuggestedPriceByMarkup(totals.totalCost, state.targetMarkup);
  const grossProfit = calculateGrossProfit(state.sellingPrice, totals.totalCost);
  const grossMargin = calculateGrossMargin(state.sellingPrice, totals.totalCost);
  const markup = calculateMarkup(state.sellingPrice, totals.totalCost);
  const status = evaluateProfitStatus(grossMargin, state.targetMargin);
  state.lastTotals = { ...totals, suggestedPrice: suggestedByMargin, grossProfit, grossMargin, markup };
  document.getElementById('costSummary').innerHTML = `
    <div class="panel-heading"><div><p class="eyebrow">Summary</p><h3>สรุปต้นทุน</h3></div><span class="badge ${status.level}">${status.label}</span></div>
    <div class="cost-metrics">
      ${metric('ต้นทุนวัตถุดิบ', totals.materialCost)}
      ${metric('Waste', totals.wasteCost)}
      ${metric('Overhead', totals.overheadCost)}
      ${metric('ต้นทุนรวม', totals.totalCost, true)}
      ${metric('ราคาขาย', state.sellingPrice)}
      ${metric('กำไรขั้นต้น', grossProfit)}
      <div><span>Gross Margin</span><strong>${number(grossMargin.toFixed(2))}%</strong></div>
      <div><span>Markup</span><strong>${number(markup.toFixed(2))}%</strong></div>
    </div>
    <div class="recommended-card">
      <span>ราคาขายแนะนำตาม Margin ${state.targetMargin}%</span>
      <strong>${currency(suggestedByMargin)}</strong>
      <small>ตาม Markup ${state.targetMarkup}%: ${currency(suggestedByMarkup)}</small>
      <p>${status.message}</p>
    </div>
    <button class="primary-button" id="saveHistoryBtn" type="button">${renderIcon('save')}Save Calculation</button>
  `;
  document.getElementById('saveHistoryBtn').addEventListener('click', () => {
    saveHistory({ ...state, suggestedPrice: suggestedByMargin }, state.lastTotals);
    renderTemplates();
    showToast('บันทึกประวัติการคำนวณแล้ว');
  });
}

function metric(label, value, highlight = false) {
  return `<div class="${highlight ? 'highlight' : ''}"><span>${label}</span><strong>${currency(value)}</strong></div>`;
}

function renderTemplates() {
  const templates = loadCostTemplates();
  const history = loadCostHistory();
  document.getElementById('costTemplates').innerHTML = templates.length ? templates.map(template => `
    <article class="template-card">
      <div><strong>${template.templateName}</strong><span>${jobTypes[template.jobType]} • ${currency(template.sellingPrice)}</span></div>
      <button class="soft-button" data-use-template="${template.id}" type="button">ใช้สูตรซ้ำ</button>
      <button class="danger-button" data-delete-template="${template.id}" type="button">ลบ</button>
    </article>
  `).join('') : '<div class="empty-state">ยังไม่มี Template</div>';
  document.getElementById('costHistory').innerHTML = history.length ? history.slice(0, 5).map(item => `
    <button class="history-item" type="button"><strong>${item.calculationNo}</strong><span>${item.templateName} • ${currency(item.totalCost)} • Margin ${number(item.grossMargin.toFixed(1))}%</span></button>
  `).join('') : '<div class="empty-state">ยังไม่มีประวัติ</div>';
}

function bindCostEvents() {
  document.getElementById('costView').addEventListener('input', event => {
    const map = {
      costJobType: 'jobType',
      costTemplateName: 'templateName',
      costSellingPrice: 'sellingPrice',
      costTargetMargin: 'targetMargin',
      costTargetMarkup: 'targetMarkup',
      costWasteRate: 'wasteRate',
      costFixedWaste: 'fixedWasteCost',
      costOverheadRate: 'overheadRate',
      costFixedOverhead: 'fixedOverheadCost'
    };
    if (map[event.target.id]) {
      state[map[event.target.id]] = event.target.type === 'number' ? Math.max(Number(event.target.value) || 0, 0) : event.target.value;
      if (state.targetMargin > 95) state.targetMargin = 95;
      if (state.wasteRate > 100) state.wasteRate = 100;
      if (state.overheadRate > 100) state.overheadRate = 100;
      renderCostSummary();
    }
    const row = event.target.closest('.cost-row');
    if (row && event.target.dataset.field) updateCostItem(row.dataset.costId, event.target.dataset.field, event.target.value);
  });
  document.getElementById('costView').addEventListener('click', event => {
    const del = event.target.closest('[data-del]')?.dataset.del;
    const dup = event.target.closest('[data-dup]')?.dataset.dup;
    const inc = event.target.closest('[data-inc]')?.dataset.inc;
    const dec = event.target.closest('[data-dec]')?.dataset.dec;
    const use = event.target.closest('[data-use-template]')?.dataset.useTemplate;
    const removeTemplate = event.target.closest('[data-delete-template]')?.dataset.deleteTemplate;
    if (del) removeCostItem(del);
    if (dup) duplicateCostItem(dup);
    if (inc) stepQuantity(inc, 1);
    if (dec) stepQuantity(dec, -1);
    if (use) useTemplate(use);
    if (removeTemplate) confirmDeleteTemplate(removeTemplate);
  });
  document.getElementById('addCostItemBtn').addEventListener('click', addCostItem);
  document.getElementById('clearCostItemsBtn').addEventListener('click', clearCostItems);
  document.getElementById('newCostBtn').addEventListener('click', resetCalculator);
  document.getElementById('saveTemplateBtn').addEventListener('click', saveCurrentTemplate);
  document.getElementById('applyOrderBtn').addEventListener('click', openApplyModal);
}

function updateCostItem(id, field, value) {
  const item = state.items.find(row => row.id === id);
  if (!item) return;
  item[field] = ['quantity', 'unitCost'].includes(field) ? Math.max(Number(value) || 0, 0) : value;
  const row = document.querySelector(`.cost-row[data-cost-id="${id}"]`);
  const total = row?.querySelector('[data-row-total]');
  if (total) total.textContent = currency((Number(item.quantity) || 0) * (Number(item.unitCost) || 0));
  renderCostSummary();
}

function addCostItem() {
  const value = document.getElementById('quickCostItem').value;
  const inventory = value.startsWith('inventory:') ? loadInventoryItems().find(item => item.id === value.replace('inventory:', '')) : null;
  state.items.push({
    id: crypto.randomUUID(),
    inventoryItemId: inventory?.id || '',
    category: inventory?.category || 'อื่น ๆ',
    itemName: inventory?.itemName || '',
    quantity: 1,
    unit: inventory?.unit || 'ชิ้น',
    unitCost: inventory?.averageCost || inventory?.costPerUnit || 0,
    supplier: inventory?.supplierName || '',
    note: ''
  });
  renderCostCalculator();
  showToast('เพิ่มรายการต้นทุนแล้ว');
}

function removeCostItem(id) {
  state.items = state.items.filter(item => item.id !== id);
  renderCostCalculator();
  showToast('ลบรายการต้นทุนแล้ว');
}

function duplicateCostItem(id) {
  const item = state.items.find(row => row.id === id);
  if (!item) return;
  state.items.push({ ...item, id: crypto.randomUUID(), itemName: `${item.itemName} (copy)` });
  renderCostCalculator();
  showToast('Duplicate รายการแล้ว');
}

function stepQuantity(id, delta) {
  const item = state.items.find(row => row.id === id);
  if (!item) return;
  item.quantity = Math.max((Number(item.quantity) || 0) + delta, 0);
  renderCostCalculator();
}

function clearCostItems() {
  if (!confirm('ต้องการล้างรายการต้นทุนทั้งหมดหรือไม่?')) return;
  state.items = [];
  renderCostCalculator();
  showToast('ล้างรายการต้นทุนแล้ว');
}

function resetCalculator() {
  Object.assign(state, structuredClone(starterTemplate));
  state.applyOrderId = '';
  state.lastTotals = null;
  renderCostCalculator();
  showToast('เริ่มคำนวณใหม่แล้ว');
}

function saveCurrentTemplate() {
  try {
    saveTemplate({ ...state });
    renderTemplates();
    showToast('บันทึก Template แล้ว');
  } catch (error) {
    showToast(error.message);
  }
}

function useTemplate(id) {
  const template = loadCostTemplates().find(item => item.id === id);
  if (!template) return;
  Object.assign(state, structuredClone(template), { items: structuredClone(template.items) });
  renderCostCalculator();
  showToast('ใช้สูตรซ้ำแล้ว');
}

function confirmDeleteTemplate(id) {
  if (!confirm('ต้องการลบ Template นี้หรือไม่?')) return;
  deleteTemplate(id);
  renderTemplates();
  showToast('ลบ Template แล้ว');
}

function openApplyModal() {
  const orders = JSON.parse(localStorage.getItem('budsarin_orders') || '[]');
  document.getElementById('applyOrderSelect').innerHTML = orders.map(order => `<option value="${order.id}">${order.orderNo} - ${order.title}</option>`).join('');
  if (state.applyOrderId) document.getElementById('applyOrderSelect').value = state.applyOrderId;
  document.getElementById('applyCostModal').hidden = false;
}

function ensureCostModals() {
  if (document.getElementById('applyCostModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="applyCostModal" hidden>
      <section class="modal" role="dialog" aria-modal="true">
        <button class="icon-button modal-close" data-close-cost-modal aria-label="ปิด" type="button">${renderIcon('x')}</button>
        <p class="eyebrow">Apply to Order</p>
        <h3>ผูกต้นทุนกับออร์เดอร์</h3>
        <label>เลือกออร์เดอร์<select id="applyOrderSelect"></select></label>
        <p class="form-error" id="applyCostError"></p>
        <button class="primary-button" id="confirmApplyCostBtn" type="button">${renderIcon('save')}ผูกกับออร์เดอร์</button>
      </section>
    </div>
  `);
  document.body.addEventListener('click', event => {
    if (event.target.matches('#applyCostModal') || event.target.closest('[data-close-cost-modal]')) document.getElementById('applyCostModal').hidden = true;
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') document.getElementById('applyCostModal').hidden = true; });
  document.getElementById('confirmApplyCostBtn').addEventListener('click', () => {
    try {
      applyCostToOrder(document.getElementById('applyOrderSelect').value, { ...state }, state.lastTotals || calculateTotalCost(state));
      document.getElementById('applyCostModal').hidden = true;
      showToast('ผูกต้นทุนกับออร์เดอร์แล้ว');
    } catch (error) {
      document.getElementById('applyCostError').textContent = error.message;
    }
  });
}
