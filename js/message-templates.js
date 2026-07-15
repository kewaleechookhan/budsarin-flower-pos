const TEMPLATE_KEY = 'budsarin_message_templates';

export const defaultMessageTemplates = {
  birthday_offer: 'สวัสดีค่ะคุณ {customerName} ทางร้าน Budsarin Flower ขออวยพรวันเกิดล่วงหน้านะคะ หากต้องการช่อดอกไม้โทนพิเศษสำหรับวันสำคัญ ทางร้านยินดีดูแลค่ะ',
  anniversary_offer: 'สวัสดีค่ะคุณ {customerName} ใกล้ถึงวันครบรอบแล้วนะคะ ทางร้านมีช่อดอกไม้โทนโรแมนติกสำหรับโอกาสพิเศษ พร้อมจัดส่งค่ะ',
  after_sale: 'ขอบคุณที่ไว้วางใจ Budsarin Flower นะคะ หากมีโอกาสพิเศษครั้งต่อไป ทางร้านยินดีดูแลอีกครั้งค่ะ',
  inactive_customer: 'สวัสดีค่ะคุณ {customerName} คิดถึงลูกค้าคนพิเศษของ Budsarin Flower นะคะ ช่วงนี้ทางร้านมีแบบช่อดอกไม้โทนใหม่ ๆ พร้อมจัดให้ตามงบค่ะ'
};

export function loadMessageTemplates() {
  try {
    return { ...defaultMessageTemplates, ...(JSON.parse(localStorage.getItem(TEMPLATE_KEY)) || {}) };
  } catch {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(defaultMessageTemplates));
    return defaultMessageTemplates;
  }
}

export function renderMessageTemplate(type, customer) {
  const templates = loadMessageTemplates();
  return (templates[type] || templates.after_sale).replaceAll('{customerName}', customer.customerName || 'ลูกค้า');
}

export function saveMessageTemplates(templates) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify({ ...loadMessageTemplates(), ...templates }));
}
