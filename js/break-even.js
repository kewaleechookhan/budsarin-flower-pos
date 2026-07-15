import { calculateBreakEven } from './finance-calculations.js';

export { calculateBreakEven };

export function getBreakEvenAdvice(result) {
  if (!result.breakEvenSales) return 'ตั้งค่า Gross Margin และค่าใช้จ่ายคงที่เพื่อเริ่มวิเคราะห์จุดคุ้มทุน';
  if (result.progress >= 100) return `เดือนนี้ร้านทำยอดเกินจุดคุ้มทุนแล้ว ${result.progress.toFixed(1)}% รักษา cash flow ให้พอจ่ายค่าใช้จ่ายคงที่`;
  return `เดือนนี้ร้านทำยอดถึง ${result.progress.toFixed(1)}% ของจุดคุ้มทุนแล้ว ควรทำยอดเฉลี่ยวันละ ${Math.ceil(result.requiredDailySales).toLocaleString('th-TH')} บาทในวันที่เหลือ`;
}
