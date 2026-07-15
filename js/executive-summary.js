import { currency, number } from './utils.js';

export function generateExecutiveSummary(reportData) {
  const sales = reportData.sales;
  const profit = reportData.profit;
  const finance = reportData.finance;
  const inventory = reportData.inventory;
  const customers = reportData.customers;
  const suppliers = reportData.suppliers;
  const breakeven = reportData.breakeven;
  const topChannel = sales.byChannel[0]?.label || 'ช่องทางขายหลัก';
  const topExpense = finance.expensesByCategory[0]?.label || 'ค่าใช้จ่ายหลัก';
  const topCustomer = customers.topCustomers[0]?.customerName || 'ลูกค้าหลัก';
  const progress = Math.min(breakeven.progress, 999);
  return `เดือนนี้ Budsarin Flower มียอดขายรวม ${currency(sales.totalSales)} จาก ${number(sales.posBills)} บิล POS, ${number(sales.orderCount)} Orders และ ${number(sales.eventCount)} Events โดยช่องทางที่ทำรายได้สูงสุดคือ ${topChannel}. กำไรขั้นต้นอยู่ที่ ${currency(profit.grossProfit)} หรือ Margin เฉลี่ย ${number(profit.grossMargin.toFixed(1))}% และกำไรสุทธิประมาณการ ${currency(profit.netProfit)}. รายรับรวม ${currency(finance.totalIncome)} รายจ่ายรวม ${currency(finance.totalExpense)} โดยหมวดค่าใช้จ่ายหลักคือ ${topExpense}. ร้านทำยอดได้ ${number(progress.toFixed(1))}% ของจุดคุ้มทุน เหลือยอดที่ต้องทำเพิ่ม ${currency(breakeven.remainingToBreakEven)}. Waste Cost เดือนนี้อยู่ที่ ${currency(inventory.wasteCost)} และมีลูกค้า VIP ${number(customers.vipCustomers.length)} ราย โดยลูกค้ามูลค่าสูงสุดคือ ${topCustomer}. ด้าน Supplier มียอดซื้อรวม ${currency(suppliers.totalPurchases)} และเจ้าหนี้ค้างจ่าย ${currency(suppliers.payables.amount)}.`;
}
