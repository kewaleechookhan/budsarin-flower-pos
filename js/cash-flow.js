import { calculateCashIn, calculateCashOut, calculateClosingBalance, calculateNetCashFlow, calculateProjectedCashBalance } from './finance-calculations.js';

export { calculateCashIn, calculateCashOut, calculateNetCashFlow, calculateClosingBalance, calculateProjectedCashBalance };

export function generateDailyCashFlow(income = [], expenses = [], openingBalance = 0) {
  const dates = [...new Set([...income.map(item => item.date), ...expenses.map(item => item.date)])].filter(Boolean).sort();
  let runningBalance = Number(openingBalance) || 0;
  return dates.map(date => {
    const dayIncome = income.filter(item => item.date === date);
    const dayExpenses = expenses.filter(item => item.date === date);
    const cashIn = calculateCashIn(dayIncome);
    const cashOut = calculateCashOut(dayExpenses);
    runningBalance += cashIn - cashOut;
    return { date, cashIn, cashOut, netCashFlow: cashIn - cashOut, closingBalance: runningBalance };
  });
}

export function generateMonthlyCashFlow(income = [], expenses = [], openingBalance = 0) {
  const months = [...new Set([...income.map(item => item.date?.slice(0, 7)), ...expenses.map(item => item.date?.slice(0, 7))])].filter(Boolean).sort();
  let runningBalance = Number(openingBalance) || 0;
  return months.map(month => {
    const monthIncome = income.filter(item => item.date?.startsWith(month));
    const monthExpenses = expenses.filter(item => item.date?.startsWith(month));
    const cashIn = calculateCashIn(monthIncome);
    const cashOut = calculateCashOut(monthExpenses);
    runningBalance += cashIn - cashOut;
    return { month, cashIn, cashOut, netCashFlow: cashIn - cashOut, closingBalance: runningBalance };
  });
}
