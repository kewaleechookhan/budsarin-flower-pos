import { calculateFixedExpenses, calculateProjectedCashBalance, calculateVariableExpenses, detectHighExpense, groupExpenseByCategory, groupIncomeByPaymentMethod } from './finance-calculations.js';
import { generateDailyCashFlow } from './cash-flow.js';
import { getBreakEvenAdvice } from './break-even.js';
import { expenseCategories, incomeCategories, paymentMethods, paymentStatuses } from './finance-data.js';
import { addExpense, addIncome, deleteExpense, deleteIncome, editExpense, editIncome, getFinanceSnapshot, loadFinanceSettings, recordPayablePayment, recordReceivablePayment, saveFinanceSettings, syncAllFinanceSources } from './finance-service.js';
import { renderIcon } from './icons.js';
import { currency, number, showToast, thaiDate } from './utils.js';

const state = { tab: 'overview', query: '', editing: null, snapshot: null };
const tabs = [
  ['overview', 'ภาพรวมการเงิน'],
  ['income', 'รายรับ'],
  ['expense', 'รายจ่าย'],
  ['cashflow', 'Cash Flow'],
  ['ar-ap', 'ลูกหนี้/เจ้าหนี้'],
  ['breakeven', 'จุดคุ้มทุน'],
  ['settings', 'ตั้งค่าการเงิน']
];

export function initFinance() {
  renderFinanceShell();
  state.snapshot = syncAllFinanceSources();
  renderFinance();
  bindFinanceEvents();
}

function renderFinanceShell() {
  document.getElementById('financeView').innerHTML = `
    <section class="finance-header panel">
      <div><p class="eyebrow">Phase 5 Finance</p><h3>รายรับรายจ่าย</h3><span>วิเคราะห์เงินเข้า เงินออก กำไร และจุดคุ้มทุนของร้าน</span></div>
      <div class="finance-header-actions">
        <button class="primary-button" data-finance-new="income" type="button">${renderIcon('plus')}เพิ่มรายรับ</button>
        <button class="primary-button expense-action" data-finance-new="expense" type="button">${renderIcon('plus')}เพิ่มรายจ่าย</button>
        <button class="soft-button" id="financeExportBtn" type="button">${renderIcon('download')}Export รายงาน</button>
      </div>
    </section>
    <nav class="finance-tabs panel" role="tablist" aria-label="Finance Tabs">
      ${tabs.map(([id, label]) => `<button class="${id === state.tab ? 'active' : ''}" data-finance-tab="${id}" type="button" role="tab">${label}</button>`).join('')}
    </nav>
    <section id="financeContent"></section>
  `;
  ensureFinanceModal();
}

function renderFinance() {
  state.snapshot = getFinanceSnapshot();
  document.querySelectorAll('[data-finance-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.financeTab === state.tab));
  const content = document.getElementById('financeContent');
  const views = {
    overview: renderOverview,
    income: () => renderTransactionTab('income'),
    expense: () => renderTransactionTab('expense'),
    cashflow: renderCashFlow,
    'ar-ap': renderReceivablePayable,
    breakeven: renderBreakEven,
    settings: renderSettings
  };
  content.innerHTML = views[state.tab]();
}

function renderOverview() {
  const s = state.snapshot;
  const incomeByMethod = groupIncomeByPaymentMethod(s.income);
  const expenseByCategory = groupExpenseByCategory(s.expenses);
  return `
    <section class="finance-kpis">
      ${kpi('รายรับวันนี้', s.todayIncome, 'trending-up')}
      ${kpi('รายจ่ายวันนี้', s.todayExpense, 'receipt')}
      ${kpi('กำไรสุทธิวันนี้', s.todayNetProfit, 'wallet')}
      ${kpi('รายรับเดือนนี้', s.monthlyRevenue, 'trending-up')}
      ${kpi('รายจ่ายเดือนนี้', s.monthlyExpenses, 'receipt')}
      ${kpi('กำไรสุทธิเดือนนี้', s.monthlyNetProfit, 'wallet')}
      ${kpi('เงินสดคงเหลือ', s.cashBalance, 'wallet')}
      ${kpi('ยอดค้างชำระจากลูกค้า', s.receivableTotal, 'users')}
      ${kpi('เจ้าหนี้ค้างจ่าย', s.payableTotal, 'truck')}
      ${kpi('จุดคุ้มทุนเดือนนี้', s.breakEven.breakEvenSales, 'bar-chart-3')}
    </section>
    <section class="finance-grid">
      <article class="panel finance-chart-panel"><div class="panel-heading"><div><p class="eyebrow">Income vs Expense</p><h3>รายรับเทียบรายจ่าย</h3></div></div>${barCompare(s.monthlyRevenue, s.monthlyExpenses)}</article>
      <article class="panel finance-chart-panel"><div class="panel-heading"><div><p class="eyebrow">Cash Flow</p><h3>เงินสดเข้าออก</h3></div></div>${cashFlowBars(generateDailyCashFlow(s.income, s.expenses, s.settings.openingBalance).slice(-7))}</article>
      <article class="panel finance-chart-panel"><div class="panel-heading"><div><p class="eyebrow">Expense by Category</p><h3>รายจ่ายตามหมวด</h3></div></div>${legendList(expenseByCategory)}</article>
      <article class="panel finance-chart-panel"><div class="panel-heading"><div><p class="eyebrow">Income by Channel</p><h3>รายรับตามช่องทาง</h3></div></div>${legendList(incomeByMethod, paymentMethods)}</article>
      <article class="panel recent-transactions"><div class="panel-heading"><div><p class="eyebrow">Recent Transactions</p><h3>รายการล่าสุด</h3></div></div>${transactionList(getRecentTransactions(), 'mixed')}</article>
      <article class="panel finance-alerts"><div class="panel-heading"><div><p class="eyebrow">Alerts</p><h3>สิ่งที่ควรดูวันนี้</h3></div></div>${renderAlerts()}</article>
    </section>
  `;
}

function renderTransactionTab(type) {
  const isIncome = type === 'income';
  const items = (isIncome ? state.snapshot.income : state.snapshot.expenses)
    .filter(item => !state.query || `${item.transactionNo} ${item.description} ${item.customerName || ''} ${item.supplierName || ''}`.toLowerCase().includes(state.query.toLowerCase()));
  return `
    <section class="finance-toolbar panel">
      <label class="finance-search">${renderIcon('search')}<input id="financeSearch" type="search" value="${escapeHtml(state.query)}" placeholder="ค้นหารายการ เลขเอกสาร ลูกค้า หรือ Supplier"></label>
      <button class="primary-button" data-finance-new="${type}" type="button">${renderIcon('plus')}${isIncome ? 'เพิ่มรายรับ' : 'เพิ่มรายจ่าย'}</button>
    </section>
    <section class="finance-grid two-col">
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">${isIncome ? 'Income' : 'Expense'}</p><h3>${isIncome ? 'รายการรายรับ' : 'รายการรายจ่าย'}</h3></div></div>${transactionList(items, type)}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Summary</p><h3>สรุปตามหมวด</h3></div></div>${legendList(isIncome ? groupIncomeByPaymentMethod(items) : groupExpenseByCategory(items), isIncome ? paymentMethods : null)}</article>
    </section>
  `;
}

function renderCashFlow() {
  const s = state.snapshot;
  const daily = generateDailyCashFlow(s.income, s.expenses, s.settings.openingBalance);
  const projection7 = calculateProjectedCashBalance(s.cashBalance, s.receivables.slice(0, 7), s.payables.slice(0, 7));
  const projection30 = calculateProjectedCashBalance(s.cashBalance, s.receivables, s.payables);
  return `
    <section class="finance-kpis compact">
      ${kpi('Opening Balance', s.settings.openingBalance, 'wallet')}
      ${kpi('Cash In', s.cashIn, 'trending-up')}
      ${kpi('Cash Out', s.cashOut, 'receipt')}
      ${kpi('Net Cash Flow', s.cashIn - s.cashOut, 'bar-chart-3')}
      ${kpi('Closing Balance', s.cashBalance, 'wallet')}
      ${kpi('Projection 7 วัน', projection7, 'calendar-days')}
      ${kpi('Projection 30 วัน', projection30, 'calendar-days')}
    </section>
    <section class="finance-grid two-col">
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Chart</p><h3>Cash Flow รายวัน</h3></div></div>${cashFlowBars(daily.slice(-12))}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Table</p><h3>Daily Cash Flow</h3></div></div>
        <div class="finance-table">${daily.slice(-12).map(row => `<div><span>${thaiDate(row.date)}</span><b>${currency(row.cashIn)}</b><b>${currency(row.cashOut)}</b><strong>${currency(row.closingBalance)}</strong></div>`).join('')}</div>
      </article>
    </section>
  `;
}

function renderReceivablePayable() {
  return `
    <section class="finance-grid two-col">
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Accounts Receivable</p><h3>ลูกหนี้</h3></div></div>${accountList(state.snapshot.receivables, 'receivable')}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Accounts Payable</p><h3>เจ้าหนี้</h3></div></div>${accountList(state.snapshot.payables, 'payable')}</article>
    </section>
  `;
}

function renderBreakEven() {
  const b = state.snapshot.breakEven;
  return `
    <section class="finance-grid two-col">
      <article class="panel break-even-finance">
        <div class="panel-heading"><div><p class="eyebrow">Break-even</p><h3>จุดคุ้มทุนเดือนนี้</h3></div><span class="badge ${b.progress >= 100 ? 'success' : 'warning'}">${number(b.progress.toFixed(1))}%</span></div>
        <div class="finance-progress"><span style="width:${Math.min(b.progress, 100)}%"></span></div>
        <div class="finance-metrics">
          ${metric('จุดคุ้มทุนเดือนนี้', b.breakEvenSales)}
          ${metric('ยอดขายปัจจุบัน', b.currentMonthlySales)}
          ${metric('ยอดที่ยังขาด', b.remainingToBreakEven)}
          ${metric('วันที่เหลือ', `${b.remainingDays} วัน`, false)}
          ${metric('ยอดเฉลี่ยต่อวัน', b.requiredDailySales)}
          ${metric('ระยะเวลาคืนทุน', `${number(b.paybackPeriod.toFixed(1))} เดือน`, false)}
          ${metric('คืนทุนแล้ว', `${number(b.investmentRecovery.toFixed(1))}%`, false)}
        </div>
        <div class="recommended-card"><p>${getBreakEvenAdvice(b)}</p></div>
      </article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Costs</p><h3>โครงสร้างค่าใช้จ่าย</h3></div></div>
        <div class="finance-metrics">${metric('ค่าใช้จ่ายคงที่', calculateFixedExpenses(state.snapshot.expenses))}${metric('ค่าใช้จ่ายผันแปร', calculateVariableExpenses(state.snapshot.expenses))}${metric('Gross Margin เป้าหมาย', `${state.snapshot.settings.targetGrossMargin}%`, false)}</div>
      </article>
    </section>
  `;
}

function renderSettings() {
  const s = loadFinanceSettings();
  return `
    <section class="panel finance-settings">
      <div class="panel-heading"><div><p class="eyebrow">Settings</p><h3>ตั้งค่าการเงิน</h3></div></div>
      <form id="financeSettingsForm">
        <label>เงินสดยกมาต้นเดือน<input name="openingBalance" type="number" min="0" value="${s.openingBalance}"></label>
        <label>เงินลงทุนเริ่มต้น<input name="initialInvestment" type="number" min="0" value="${s.initialInvestment}"></label>
        <label>ค่าใช้จ่ายคงที่รายเดือน<input name="fixedMonthlyCosts" type="number" min="0" value="${s.fixedMonthlyCosts}"></label>
        <label>Gross Margin เป้าหมาย %<input name="targetGrossMargin" type="number" min="0" max="95" value="${s.targetGrossMargin}"></label>
        <label>Net Profit เป้าหมาย<input name="targetNetProfit" type="number" min="0" value="${s.targetNetProfit}"></label>
        <label>Cash Balance ขั้นต่ำ<input name="minimumCashBalance" type="number" min="0" value="${s.minimumCashBalance}"></label>
        <label>วันที่เริ่มรอบบัญชี<input name="accountingCycleStartDay" type="number" min="1" max="28" value="${s.accountingCycleStartDay}"></label>
        <label class="check-label"><input name="syncPOS" type="checkbox" ${s.syncPOS ? 'checked' : ''}> เปิด sync จาก POS</label>
        <label class="check-label"><input name="syncOrders" type="checkbox" ${s.syncOrders ? 'checked' : ''}> เปิด sync จาก Orders</label>
        <button class="primary-button" type="submit">${renderIcon('save')}บันทึกตั้งค่า</button>
      </form>
    </section>
  `;
}

function transactionList(items, type) {
  return `<div class="finance-transaction-list">${items.slice(0, type === 'mixed' ? 10 : 80).map(item => {
    const isIncome = item.kind === 'income' || type === 'income' || item.transactionNo?.startsWith('INC');
    return `<article class="finance-transaction">
      <div><strong>${escapeHtml(item.transactionNo)}</strong><span>${thaiDate(item.date)} ${item.time || ''} • ${escapeHtml(item.description)}</span><small>${escapeHtml(item.customerName || item.supplierName || item.category)}</small></div>
      <span class="badge ${paymentStatuses[item.paymentStatus]?.tone || 'info'}">${paymentStatuses[item.paymentStatus]?.label || item.paymentStatus}</span>
      <b class="${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${currency(item.amount)}</b>
      ${type !== 'mixed' ? `<div class="finance-row-actions"><button class="soft-button" data-finance-edit="${type}:${item.id}" type="button">แก้ไข</button><button class="danger-button" data-finance-delete="${type}:${item.id}" type="button">ลบ</button></div>` : ''}
    </article>`;
  }).join('') || '<div class="empty-state">ยังไม่มีรายการ</div>'}</div>`;
}

function accountList(items, type) {
  return `<div class="finance-transaction-list">${items.map(item => `<article class="finance-transaction account-row">
    <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.description)} • ครบกำหนด ${thaiDate(item.dueDate)}</span><small>${item.agingDays > 0 ? `เกินกำหนด ${item.agingDays} วัน` : `เหลือ ${Math.abs(item.agingDays)} วัน`}</small></div>
    <span class="badge ${item.status === 'overdue' ? 'danger' : item.status === 'due_soon' ? 'warning' : 'success'}">${statusLabel(item.status)}</span>
    <b>${currency(item.balanceAmount)}</b>
    <button class="soft-button" data-record-${type}="${item.id}" type="button">${type === 'receivable' ? 'รับเงิน' : 'จ่ายเงิน'}</button>
  </article>`).join('') || '<div class="empty-state">ไม่มีรายการค้าง</div>'}</div>`;
}

function bindFinanceEvents() {
  document.getElementById('financeView').addEventListener('click', event => {
    const tab = event.target.closest('[data-finance-tab]')?.dataset.financeTab;
    const createType = event.target.closest('[data-finance-new]')?.dataset.financeNew;
    const edit = event.target.closest('[data-finance-edit]')?.dataset.financeEdit;
    const del = event.target.closest('[data-finance-delete]')?.dataset.financeDelete;
    const rec = event.target.closest('[data-record-receivable]')?.dataset.recordReceivable;
    const pay = event.target.closest('[data-record-payable]')?.dataset.recordPayable;
    if (tab) { state.tab = tab; state.query = ''; renderFinance(); }
    if (createType) openTransactionModal(createType);
    if (edit) openEditModal(edit);
    if (del) deleteTransaction(del);
    if (rec) { recordReceivablePayment(rec, 999999); showToast('บันทึกรับเงินแล้ว'); renderFinance(); }
    if (pay) { recordPayablePayment(pay, 999999); showToast('บันทึกจ่ายเงินแล้ว'); renderFinance(); }
  });
  document.getElementById('financeView').addEventListener('input', event => {
    if (event.target.id === 'financeSearch') {
      state.query = event.target.value;
      renderFinance();
    }
  });
  document.getElementById('financeView').addEventListener('submit', event => {
    if (event.target.id !== 'financeSettingsForm') return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    saveFinanceSettings({ ...data, syncPOS: event.target.elements.syncPOS.checked, syncOrders: event.target.elements.syncOrders.checked });
    showToast('บันทึกตั้งค่าการเงินแล้ว');
    renderFinance();
  });
  document.getElementById('financeExportBtn').addEventListener('click', () => showToast('Export รายงานจะเพิ่มใน Phase ถัดไป'));
}

function ensureFinanceModal() {
  if (document.getElementById('financeModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="financeModal" hidden>
      <section class="modal finance-modal" role="dialog" aria-modal="true" aria-labelledby="financeModalTitle">
        <button class="icon-button modal-close" data-close-finance-modal aria-label="ปิด" type="button">${renderIcon('x')}</button>
        <p class="eyebrow">Transaction</p><h3 id="financeModalTitle">เพิ่มรายการ</h3>
        <form id="financeForm" novalidate>
          <label>ประเภท<select name="type"><option value="income">รายรับ</option><option value="expense">รายจ่าย</option></select></label>
          <label>วันที่<input name="date" type="date" required></label>
          <label>เวลา<input name="time" type="time" required></label>
          <label>หมวดหมู่<select name="category" required></select></label>
          <label>รายละเอียด<input name="description" required></label>
          <label>จำนวนเงิน<input name="amount" type="number" min="1" required></label>
          <label>วิธีชำระเงิน<select name="paymentMethod" required>${Object.entries(paymentMethods).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label>
          <label>สถานะชำระเงิน<select name="paymentStatus">${Object.entries(paymentStatuses).map(([id, item]) => `<option value="${id}">${item.label}</option>`).join('')}</select></label>
          <label>ลูกค้า / Supplier<input name="partyName"></label>
          <label>วันครบกำหนด<input name="dueDate" type="date"></label>
          <label>หลักฐาน placeholder<input name="evidenceImage" placeholder="payment-placeholder"></label>
          <label class="span-2">หมายเหตุ<textarea name="note" rows="2"></textarea></label>
          <p class="form-error" id="financeFormError"></p>
          <button class="primary-button" type="submit">${renderIcon('save')}บันทึก</button>
        </form>
      </section>
    </div>
  `);
  document.body.addEventListener('click', event => {
    if (event.target.matches('#financeModal') || event.target.closest('[data-close-finance-modal]')) closeFinanceModal();
  });
  document.getElementById('financeForm').addEventListener('change', event => {
    if (event.target.name === 'type') fillCategoryOptions(event.target.value);
  });
  document.getElementById('financeForm').addEventListener('submit', submitFinanceForm);
}

function openTransactionModal(type) {
  state.editing = null;
  const form = document.getElementById('financeForm');
  form.reset();
  form.elements.type.value = type;
  form.elements.date.value = new Date().toISOString().slice(0, 10);
  form.elements.time.value = new Date().toTimeString().slice(0, 5);
  form.elements.evidenceImage.value = type === 'income' ? 'payment-placeholder' : 'receipt-placeholder';
  fillCategoryOptions(type);
  document.getElementById('financeModalTitle').textContent = type === 'income' ? 'เพิ่มรายรับ' : 'เพิ่มรายจ่าย';
  document.getElementById('financeModal').hidden = false;
}

function openEditModal(value) {
  const [type, id] = value.split(':');
  const list = type === 'income' ? state.snapshot.income : state.snapshot.expenses;
  const item = list.find(row => row.id === id);
  if (!item) return;
  openTransactionModal(type);
  state.editing = { type, id };
  const form = document.getElementById('financeForm');
  form.elements.category.value = item.category;
  form.elements.description.value = item.description;
  form.elements.amount.value = item.amount;
  form.elements.paymentMethod.value = item.paymentMethod;
  form.elements.paymentStatus.value = item.paymentStatus;
  form.elements.partyName.value = item.customerName || item.supplierName || '';
  form.elements.dueDate.value = item.dueDate || '';
  form.elements.evidenceImage.value = item.evidenceImage || '';
  form.elements.note.value = item.note || '';
  document.getElementById('financeModalTitle').textContent = 'แก้ไขรายการ';
  if (item.sourceType && item.sourceType !== 'manual') showToast('รายการนี้ sync จากระบบอื่น การแก้ไขมีผลต่อรายงาน');
}

function submitFinanceForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const payload = {
    ...data,
    customerName: data.type === 'income' ? data.partyName : '',
    supplierName: data.type === 'expense' ? data.partyName : ''
  };
  try {
    if (state.editing?.type === 'income') editIncome(state.editing.id, payload);
    else if (state.editing?.type === 'expense') editExpense(state.editing.id, payload);
    else if (data.type === 'income') addIncome(payload);
    else addExpense(payload);
    closeFinanceModal();
    showToast('บันทึกรายการการเงินแล้ว');
    renderFinance();
  } catch (error) {
    document.getElementById('financeFormError').textContent = error.message;
  }
}

function deleteTransaction(value) {
  const [type, id] = value.split(':');
  if (!confirm('ต้องการลบรายการนี้หรือไม่?')) return;
  try {
    if (type === 'income') deleteIncome(id, true);
    else deleteExpense(id, true);
    showToast('ลบรายการแล้ว');
    renderFinance();
  } catch (error) {
    showToast(error.message);
  }
}

function fillCategoryOptions(type) {
  const select = document.querySelector('#financeForm select[name="category"]');
  select.innerHTML = (type === 'income' ? incomeCategories : expenseCategories).map(item => `<option value="${item}">${item}</option>`).join('');
}

function closeFinanceModal() {
  document.getElementById('financeModal').hidden = true;
  document.getElementById('financeFormError').textContent = '';
}

function getRecentTransactions() {
  return [
    ...state.snapshot.income.map(item => ({ ...item, kind: 'income' })),
    ...state.snapshot.expenses.map(item => ({ ...item, kind: 'expense' }))
  ].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

function renderAlerts() {
  const high = detectHighExpense(state.snapshot.expenses).slice(0, 2).map(item => `ค่าใช้จ่ายสูง: ${item.description}`);
  const alerts = [
    ...high,
    ...(state.snapshot.receivables.some(item => item.status === 'overdue') ? ['ยอดค้างชำระเกินกำหนด'] : []),
    ...(state.snapshot.breakEven.progress < 100 ? ['เดือนนี้ยังไม่ถึงจุดคุ้มทุน'] : []),
    ...(state.snapshot.cashBalance < state.snapshot.settings.minimumCashBalance ? ['Cash Balance ต่ำกว่าเกณฑ์'] : [])
  ];
  return `<div class="finance-alert-list">${alerts.map(alert => `<div class="list-row"><div><strong>${escapeHtml(alert)}</strong><span>ตรวจสอบในแท็บที่เกี่ยวข้อง</span></div><b class="warning">!</b></div>`).join('') || '<div class="empty-state">ไม่มี alert สำคัญ</div>'}</div>`;
}

function kpi(label, value, icon) {
  return `<article class="finance-kpi"><span>${renderIcon(icon)}</span><small>${label}</small><strong>${typeof value === 'number' ? currency(value) : value}</strong></article>`;
}

function metric(label, value, money = true) {
  return `<div><span>${label}</span><strong>${money ? currency(value) : value}</strong></div>`;
}

function barCompare(income, expense) {
  const max = Math.max(income, expense, 1);
  return `<div class="finance-bars"><div><span>รายรับ</span><b style="width:${(income / max) * 100}%"></b><strong>${currency(income)}</strong></div><div><span>รายจ่าย</span><b class="expense-bar" style="width:${(expense / max) * 100}%"></b><strong>${currency(expense)}</strong></div></div>`;
}

function cashFlowBars(rows) {
  const max = Math.max(...rows.map(row => Math.max(row.cashIn, row.cashOut)), 1);
  return `<div class="cashflow-bars">${rows.map(row => `<div title="${thaiDate(row.date)}"><span style="height:${Math.max((row.cashIn / max) * 100, 4)}%"></span><b style="height:${Math.max((row.cashOut / max) * 100, 4)}%"></b><small>${row.date.slice(8)}</small></div>`).join('')}</div>`;
}

function legendList(data, labels = null) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
  return `<div class="finance-legend">${entries.map(([key, value]) => `<div><span>${labels?.[key] || key}</span><strong>${currency(value)}</strong><small>${number(((value / total) * 100).toFixed(1))}%</small></div>`).join('') || '<div class="empty-state">ยังไม่มีข้อมูล</div>'}</div>`;
}

function statusLabel(status) {
  return { normal: 'ปกติ', due_soon: 'ใกล้ครบกำหนด', overdue: 'เกินกำหนด', paid: 'ชำระแล้ว' }[status] || status;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}
