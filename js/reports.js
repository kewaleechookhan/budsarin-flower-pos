import { reportTabs, dateRangePresets, reportTypes, defaultReportFilters } from './reports-data.js';
import { generateAllReports } from './reports-service.js';
import { exportReportToCSV, downloadCSV, printReport, saveReportPreset, loadReportPresets, deleteReportPreset } from './report-export.js';
import { resetReportFilters, validateDateRange } from './report-filters.js';
import { loadBrandSettings, loadStoreProfile } from './settings-service.js';
import { renderIcon } from './icons.js';
import { currency, number, showToast } from './utils.js';

const state = {
  tab: 'executive',
  filters: resetReportFilters(),
  reports: null,
  loading: false
};

export function initReports() {
  renderReportsShell();
  refreshReports();
  bindReportsEvents();
}

function renderReportsShell() {
  const profile = loadStoreProfile();
  const brand = loadBrandSettings();
  document.getElementById('reportsView').innerHTML = `
    ${profile.coverImageDataUrl ? `<section class="report-cover" style="background-image:linear-gradient(90deg, rgba(63,42,45,.68), rgba(63,42,45,.18)), url('${profile.coverImageDataUrl}')"><div><p class="eyebrow">Store Report</p><h2>${profile.storeNameTh || profile.storeNameEn}</h2><span>${profile.businessName || ''}</span></div></section>` : ''}
    <section class="reports-header panel">
      <div class="report-print-brand">
        ${brand.showLogoOnDocuments && profile.logoDataUrl ? `<img src="${profile.logoDataUrl}" alt="${profile.storeNameTh}">` : ''}
        <div><p class="eyebrow">Phase 10 BI Reports</p><h3>รายงานผู้บริหาร</h3><span>${profile.storeNameTh || profile.storeNameEn} • Executive dashboard, export, profit analytics และ performance intelligence</span></div>
      </div>
      <div class="reports-header-actions">
        <button class="primary-button" id="reportExportCSVBtn" type="button">${renderIcon('download')}Export CSV</button>
        <button class="soft-button" id="reportPrintBtn" type="button">${renderIcon('printer')}Print</button>
        <button class="soft-button" id="reportPdfBtn" type="button">PDF</button>
      </div>
    </section>
    <section class="report-filter-bar panel" aria-label="ตัวกรองรายงาน">
      <label>ช่วงเวลา<select id="reportDateRange">${Object.entries(dateRangePresets).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label>
      <label>เริ่ม<input id="reportStartDate" type="date"></label>
      <label>สิ้นสุด<input id="reportEndDate" type="date"></label>
      <label>ช่องทาง<select id="reportChannel"><option value="all">ทุกช่องทาง</option><option value="pos_sale">POS</option><option value="order">Orders</option><option value="events">Events</option></select></label>
      <label>สถานะ<select id="reportStatus"><option value="all">ทุกสถานะ</option><option value="paid">ชำระแล้ว</option><option value="partial">บางส่วน</option><option value="unpaid">ค้างชำระ</option><option value="completed">เสร็จสิ้น</option></select></label>
      <button class="primary-button" id="applyReportFilterBtn" type="button">${renderIcon('search')}Apply</button>
      <button class="soft-button" id="resetReportFilterBtn" type="button">Reset</button>
      <button class="soft-button" id="saveReportPresetBtn" type="button">${renderIcon('save')}Save Preset</button>
    </section>
    <nav class="report-tabs panel" role="tablist">${reportTabs.map(([id, label]) => `<button class="${id === state.tab ? 'active' : ''}" data-report-tab="${id}" type="button">${label}</button>`).join('')}</nav>
    <section id="reportsContent" aria-live="polite"></section>
  `;
  fillFilterInputs();
}

function refreshReports() {
  const error = validateDateRange(state.filters);
  if (error) return showToast(error);
  state.loading = true;
  renderReports();
  state.reports = generateAllReports(state.filters);
  state.loading = false;
  renderReports();
}

function renderReports() {
  document.querySelectorAll('[data-report-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.reportTab === state.tab));
  const content = document.getElementById('reportsContent');
  if (state.loading || !state.reports) {
    content.innerHTML = '<section class="panel report-loading">กำลังคำนวณรายงาน...</section>';
    return;
  }
  const views = {
    executive: renderExecutive,
    sales: renderSales,
    profit: renderProfit,
    finance: renderFinance,
    inventory: renderInventory,
    events: renderEvents,
    customers: renderCustomers,
    suppliers: renderSuppliers,
    breakeven: renderBreakEven,
    export: renderExportCenter
  };
  content.innerHTML = views[state.tab]();
}

function renderExecutive() {
  const r = state.reports;
  return `
    <section class="report-kpis">
      ${kpi('ยอดขายรวมเดือนนี้', r.sales.totalSales, 'receipt')}
      ${kpi('กำไรขั้นต้น', r.profit.grossProfit, 'trending-up')}
      ${kpi('กำไรสุทธิประมาณการ', r.profit.netProfit, 'wallet')}
      ${kpi('Gross Margin เฉลี่ย', `${number(r.profit.grossMargin.toFixed(1))}%`, 'bar-chart-3', false)}
      ${kpi('รายรับรวม', r.finance.totalIncome, 'credit-card')}
      ${kpi('รายจ่ายรวม', r.finance.totalExpense, 'wallet')}
      ${kpi('Cash Balance', r.finance.closingBalance, 'wallet')}
      ${kpi('ยอดค้างชำระ', r.finance.receivables.amount, 'credit-card')}
      ${kpi('เจ้าหนี้ค้างจ่าย', r.finance.payables.amount, 'truck')}
      ${kpi('จุดคุ้มทุน', `${number(r.breakeven.progress.toFixed(1))}%`, 'calculator', false)}
      ${kpi('Waste Cost', r.inventory.wasteCost, 'leaf')}
      ${kpi('ลูกค้าใหม่', r.customers.newCustomers, 'users', false)}
      ${kpi('ลูกค้า VIP', r.customers.vipCustomers.length, 'sparkles', false)}
      ${kpi('งานจัดสถานที่เดือนนี้', r.events.eventCount, 'calendar-days', false)}
    </section>
    <section class="executive-summary panel"><div><p class="eyebrow">Auto Insight</p><h3>สรุปผู้บริหารอัตโนมัติ</h3></div><p>${r.executiveSummary}</p></section>
    <section class="report-grid">
      ${chartCard('Revenue Trend', r.sales.dailyTrend, 'line')}
      ${chartCard('Profit Trend', r.profit.profitTrend, 'line')}
      ${chartCard('Income vs Expense', [{ label: 'Income', value: r.finance.totalIncome }, { label: 'Expense', value: r.finance.totalExpense }])}
      ${chartCard('Sales by Channel', r.sales.byChannel, 'donut')}
      ${chartCard('Gross Margin by Service Type', r.profit.byServiceType)}
      ${chartCard('Waste Cost Trend', r.inventory.wasteByReason, 'donut')}
      ${chartCard('Customer Segment Donut', segmentRows(r.customers), 'donut')}
      ${chartCard('Event Profit Ranking', r.events.highProfitEvents.map(item => ({ label: item.label, value: item.grossProfit })))}
    </section>
  `;
}

function renderSales() {
  const s = state.reports.sales;
  return reportSection('Sales Report', [
    ['ยอดขายรวม', currency(s.totalSales)], ['จำนวนบิล POS', number(s.posBills)], ['จำนวน Orders', number(s.orderCount)], ['จำนวน Events', number(s.eventCount)], ['Average Order Value', currency(s.averageOrderValue)]
  ], [chartCard('ยอดขายตามช่องทาง', s.byChannel, 'donut'), chartCard('ยอดขายตามประเภทสินค้า/บริการ', s.byCategory), chartCard('ยอดขายแยกวิธีชำระเงิน', s.byPaymentMethod, 'donut'), tableCard('Top Selling Products', s.topProducts, ['label', 'qty', 'value'])]);
}

function renderProfit() {
  const p = state.reports.profit;
  return reportSection('Profit Report', [
    ['Revenue', currency(p.revenue)], ['Cost', currency(p.cost)], ['Gross Profit', currency(p.grossProfit)], ['Gross Margin', `${number(p.grossMargin.toFixed(1))}%`], ['Net Profit Estimate', currency(p.netProfit)], ['Markup', `${number(p.markup.toFixed(1))}%`]
  ], [chartCard('กำไรตามสินค้า/บริการ', p.byServiceType), tableCard('งานที่กำไรสูงสุด', p.highProfitItems, ['label', 'grossProfit', 'grossMargin']), tableCard('Low Margin Alert', p.lowMarginItems, ['label', 'grossProfit', 'grossMargin'])]);
}

function renderFinance() {
  const f = state.reports.finance;
  return reportSection('Finance Report', [
    ['รายรับรวม', currency(f.totalIncome)], ['รายจ่ายรวม', currency(f.totalExpense)], ['Net Cash Flow', currency(f.netCashFlow)], ['Opening Balance', currency(f.openingBalance)], ['Closing Balance', currency(f.closingBalance)], ['Cash Balance Projection', currency(f.cashBalanceProjection)], ['ลูกหนี้', currency(f.receivables.amount)], ['เจ้าหนี้', currency(f.payables.amount)]
  ], [chartCard('รายจ่ายตามหมวด', f.expensesByCategory, 'donut'), chartCard('รายรับตามช่องทาง', f.incomeByChannel, 'donut'), tableCard('รายการเกินกำหนด', f.overdueItems, ['description', 'customerName', 'amount'])]);
}

function renderInventory() {
  const i = state.reports.inventory;
  return reportSection('Inventory & Waste', [
    ['มูลค่าสต็อก', currency(i.inventoryValue)], ['Stock In', currency(i.stockMovement.stockIn)], ['Stock Out', currency(i.stockMovement.stockOut)], ['Stock Turnover', number(i.stockMovement.turnover.toFixed(1))], ['Waste Cost', currency(i.wasteCost)], ['Waste Rate', `${number(i.wasteRate.toFixed(1))}%`]
  ], [chartCard('Waste by Reason', i.wasteByReason, 'donut'), tableCard('รายการใกล้หมด/ควรสั่งซื้อ', i.reorderItems, ['itemName', 'quantity', 'reorderPoint']), tableCard('รายการควรรีบใช้', i.expiringItems, ['itemName', 'quantity', 'expiryDate']), tableCard('สินค้าที่สูญเสียสูงสุด', i.topWasteItems, ['label', 'value'])]);
}

function renderEvents() {
  const e = state.reports.events;
  return reportSection('Events Report', [
    ['จำนวน Events', number(e.eventCount)], ['มูลค่างานรวม', currency(e.revenue)], ['ยอดมัดจำรวม', currency(e.deposits)], ['ยอดคงเหลือ', currency(e.balance)], ['ต้นทุนรวม', currency(e.costs)], ['กำไรรวม', currency(e.profit)], ['Gross Margin เฉลี่ย', `${number(e.grossMargin.toFixed(1))}%`]
  ], [chartCard('งานตามสถานะ', e.byStatus, 'donut'), chartCard('งานตามประเภท', e.byType), tableCard('งานที่กำไรสูงสุด', e.highProfitEvents, ['label', 'grossProfit', 'grossMargin']), tableCard('งานใกล้ถึงกำหนด', e.upcomingEvents, ['eventName', 'customerName', 'eventDate'])]);
}

function renderCustomers() {
  const c = state.reports.customers;
  return reportSection('Customer Report', [
    ['ลูกค้าทั้งหมด', number(c.totalCustomers)], ['ลูกค้าใหม่', number(c.newCustomers)], ['ลูกค้าประจำ', number(c.regularCustomers)], ['ลูกค้า VIP', number(c.vipCustomers.length)], ['ไม่ได้ซื้อซ้ำนาน', number(c.inactiveCustomers.length)], ['Customer Lifetime Value', currency(c.customerLifetimeValue)], ['Average Customer Spend', currency(c.averageCustomerSpend)], ['Repeat Purchase Rate', `${number(c.repeatPurchaseRate.toFixed(1))}%`]
  ], [tableCard('Top Customers', c.topCustomers, ['customerName', 'totalSpent', 'totalOrders']), tableCard('Upcoming Important Dates', c.upcomingDates, ['customerName', 'dateType', 'date']), tableCard('Follow-up Overdue', c.overdueFollowUps, ['customerName', 'title', 'dueDate'])]);
}

function renderSuppliers() {
  const s = state.reports.suppliers;
  return reportSection('Supplier Report', [
    ['จำนวน Supplier', number(s.supplierCount)], ['ยอดซื้อรวม', currency(s.totalPurchases)], ['เจ้าหนี้ Supplier', currency(s.payables.amount)], ['PO ค้างรับ', number(s.pendingPOs.length)], ['PO ค้างจ่าย', number(s.payables.count)]
  ], [chartCard('Purchase by Supplier', s.purchaseBySupplier), tableCard('Supplier ที่ซื้อบ่อยที่สุด', s.mostUsedSuppliers, ['label', 'value']), tableCard('Supplier Performance', s.bestSuppliers, ['label', 'value', 'rating']), tableCard('PO ค้างรับ', s.pendingPOs, ['poNo', 'supplierName', 'totalAmount'])]);
}

function renderBreakEven() {
  const b = state.reports.breakeven;
  return reportSection('Break-even Report', [
    ['Fixed Monthly Costs', currency(b.fixedMonthlyCosts)], ['Gross Margin Rate', `${number((b.grossMarginRate * 100).toFixed(1))}%`], ['Break-even Sales', currency(b.breakEvenSales)], ['Current Monthly Sales', currency(b.currentMonthlySales)], ['Remaining to Break-even', currency(b.remainingToBreakEven)], ['Break-even Progress', `${number(b.progress.toFixed(1))}%`], ['Required Daily Sales', currency(b.requiredDailySales)], ['Initial Investment', currency(b.initialInvestment)], ['Accumulated Net Profit', currency(b.accumulatedNetProfit)], ['Payback Period', `${number(b.paybackPeriod.toFixed(1))} เดือน`], ['Investment Recovery', `${number(b.investmentRecovery.toFixed(1))}%`]
  ], [`<article class="panel breakeven-visual"><div class="progress-ring" style="--value:${Math.min(b.progress, 100) * 3.6}deg"><strong>${number(b.progress.toFixed(1))}%</strong></div><p>ยอดที่ต้องทำเพิ่ม ${currency(b.remainingToBreakEven)} หรือเฉลี่ย ${currency(b.requiredDailySales)} ต่อวัน</p></article>`]);
}

function renderExportCenter() {
  const presets = loadReportPresets();
  return `
    <section class="export-center panel">
      <div class="panel-heading"><div><p class="eyebrow">Export Center</p><h3>ส่งออกรายงาน</h3></div></div>
      <div class="export-grid">${reportTypes.map(([id, label]) => `<button class="export-card" data-export-report="${id}" type="button"><strong>${label}</strong><span>CSV</span></button>`).join('')}</div>
    </section>
    <section class="report-grid">
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Presets</p><h3>Report Presets</h3></div></div>${presets.map(preset => `<div class="report-table-row"><div><strong>${preset.presetName}</strong><span>${preset.reportType} • ${preset.dateRange}</span></div><button class="soft-button" data-delete-preset="${preset.id}" type="button">ลบ</button></div>`).join('') || '<div class="empty-state">ยังไม่มี Preset</div>'}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">PDF</p><h3>PDF Export</h3></div></div><button class="soft-button" id="pdfExportBtn" type="button">Save as PDF</button><p class="muted">เปิดหน้าพิมพ์รายงาน แล้วเลือก Save as PDF ได้ทันที</p></article>
    </section>
  `;
}

function reportSection(title, metrics, blocks) {
  return `<section class="report-metric-grid">${metrics.map(([label, value]) => `<article class="report-metric"><span>${label}</span><strong>${value}</strong></article>`).join('')}</section><section class="report-grid">${blocks.join('')}</section>`;
}

function chartCard(title, rows = [], mode = 'bar') {
  const max = Math.max(...rows.map(row => Number(row.value || row.grossProfit || 0)), 1);
  return `<article class="panel report-chart ${mode}"><div class="panel-heading"><div><p class="eyebrow">Chart</p><h3>${title}</h3></div></div><div class="chart-fallback">${rows.slice(0, 8).map((row, index) => `<div class="chart-row"><span>${row.label}</span><div><i style="width:${Math.max(((Number(row.value || row.grossProfit || 0) / max) * 100), 6)}%"></i></div><strong>${formatValue(row.value ?? row.grossProfit)}</strong></div>`).join('') || '<div class="empty-state">ไม่มีข้อมูล</div>'}</div></article>`;
}

function tableCard(title, rows = [], fields = []) {
  return `<article class="panel report-table-card"><div class="panel-heading"><div><p class="eyebrow">Table</p><h3>${title}</h3></div></div><div class="report-table">${rows.slice(0, 8).map(row => `<div class="report-table-row">${fields.map(field => `<span>${formatCell(field, row[field])}</span>`).join('')}</div>`).join('') || '<div class="empty-state">ไม่มีข้อมูล</div>'}</div></article>`;
}

function kpi(label, value, icon, money = true) {
  return `<article class="report-kpi"><span>${renderIcon(icon)}</span><small>${label}</small><strong>${money && typeof value === 'number' ? currency(value) : value}</strong></article>`;
}

function bindReportsEvents() {
  document.getElementById('reportsView').addEventListener('click', event => {
    const tab = event.target.closest('[data-report-tab]')?.dataset.reportTab;
    const exportType = event.target.closest('[data-export-report]')?.dataset.exportReport;
    const deletePresetId = event.target.closest('[data-delete-preset]')?.dataset.deletePreset;
    if (tab) { state.tab = tab; renderReports(); }
    if (exportType) exportCSV(exportType);
    if (deletePresetId) { deleteReportPreset(deletePresetId); showToast('ลบ Report Preset แล้ว'); renderReports(); }
    if (event.target.closest('#pdfExportBtn') || event.target.closest('#reportPdfBtn')) exportPDF();
  });
  document.getElementById('applyReportFilterBtn').addEventListener('click', () => { readFilterInputs(); refreshReports(); showToast('อัปเดตรายงานแล้ว'); });
  document.getElementById('resetReportFilterBtn').addEventListener('click', () => { state.filters = { ...defaultReportFilters, ...resetReportFilters() }; fillFilterInputs(); refreshReports(); showToast('รีเซ็ตตัวกรองแล้ว'); });
  document.getElementById('saveReportPresetBtn').addEventListener('click', () => { readFilterInputs(); saveReportPreset(`Preset ${new Date().toLocaleTimeString('th-TH')}`, state.tab, state.filters); showToast('บันทึก Report Preset แล้ว'); if (state.tab === 'export') renderReports(); });
  document.getElementById('reportExportCSVBtn').addEventListener('click', () => exportCSV(state.tab === 'executive' ? 'sales' : state.tab));
  document.getElementById('reportPrintBtn').addEventListener('click', () => { printReport(state.tab); showToast('เปิดหน้าพิมพ์รายงาน'); });
}

function exportCSV(type) {
  const key = type === 'waste' ? 'inventory' : type;
  const data = state.reports[key] || state.reports;
  downloadCSV(`budsarin-${type}-report.csv`, exportReportToCSV(type, data));
  showToast(`Export ${type} CSV แล้ว`);
}

function exportPDF() {
  printReport(state.tab);
  showToast('เปิดหน้าพิมพ์รายงาน เลือก Save as PDF ได้');
}

function readFilterInputs() {
  state.filters = {
    ...state.filters,
    dateRange: document.getElementById('reportDateRange').value,
    startDate: document.getElementById('reportStartDate').value,
    endDate: document.getElementById('reportEndDate').value,
    channel: document.getElementById('reportChannel').value,
    status: document.getElementById('reportStatus').value
  };
}

function fillFilterInputs() {
  document.getElementById('reportDateRange').value = state.filters.dateRange;
  document.getElementById('reportStartDate').value = state.filters.startDate;
  document.getElementById('reportEndDate').value = state.filters.endDate;
  document.getElementById('reportChannel').value = state.filters.channel;
  document.getElementById('reportStatus').value = state.filters.status;
}

function segmentRows(report) {
  return [
    { label: 'VIP', value: report.vipCustomers.length },
    { label: 'Regular', value: report.regularCustomers },
    { label: 'New', value: report.newCustomers },
    { label: 'Inactive', value: report.inactiveCustomers.length }
  ];
}

function formatCell(field, value) {
  if (field.toLowerCase().includes('amount') || field.toLowerCase().includes('spent') || field.toLowerCase().includes('profit') || field === 'value') return currency(Number(value) || 0);
  if (field.toLowerCase().includes('margin')) return `${number((Number(value) || 0).toFixed(1))}%`;
  return value ?? '-';
}

function formatValue(value) {
  const numeric = Number(value) || 0;
  return numeric > 999 ? currency(numeric) : number(numeric.toFixed(numeric % 1 ? 1 : 0));
}
