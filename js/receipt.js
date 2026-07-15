import { currency, thaiDate } from './utils.js';
import { loadBrandSettings, loadStoreProfile, loadSystemFinanceSettings } from './settings-service.js';

const paymentLabel = {
  cash: 'เงินสด',
  transfer: 'โอนเงิน',
  qr: 'QR Payment',
  card: 'บัตร',
  split: 'แบ่งชำระ',
  deposit: 'มัดจำ'
};

export function generateReceipt(sale) {
  const profile = loadStoreProfile();
  const brand = loadBrandSettings();
  const finance = loadSystemFinanceSettings();
  const meta = documentMeta(sale.documentType, brand);
  const vat = calculateVat(sale.total, finance);
  const rows = sale.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${currency(item.price)}</td>
      <td>${currency(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <div class="receipt-paper a4-document ${brand.showBackgroundOnPrint ? 'with-bg' : ''}">
      <header class="document-header">
        <div class="document-brand">
          <div>
            <h3>${profile.storeNameTh || profile.storeNameEn}</h3>
            <p>${profile.businessName || profile.storeNameEn}</p>
            <p>${profile.address || ''} ${profile.district || ''} ${profile.province || ''} ${profile.postalCode || ''}</p>
            <p>โทร ${profile.phone || '-'} ${profile.lineId ? `• LINE ${profile.lineId}` : ''} ${profile.taxId ? `• Tax ID ${profile.taxId}` : ''}</p>
          </div>
        </div>
        <div class="document-title">
          ${brand.showLogoOnDocuments && profile.logoDataUrl ? `<img class="document-corner-logo" src="${profile.logoDataUrl}" alt="${profile.storeNameTh}">` : ''}
          <strong>${meta.title}</strong>
          <span>เลขที่ ${sale.saleNo}</span>
          <span>วันที่ ${thaiDate(sale.createdAt)}</span>
        </div>
      </header>
      <section class="document-customer">
        <div><span>ลูกค้า / บริษัท / หน่วยงาน</span><strong>${sale.customerName || 'ลูกค้าหน้าร้าน'}</strong></div>
        <div><span>${brand.customerTaxLabel}</span><strong>${sale.customerTaxId || '-'}</strong></div>
        <div class="span-2"><span>ที่อยู่ลูกค้า</span><strong>${sale.customerAddress || '-'}</strong></div>
      </section>
      <table>
        <thead><tr><th>รายการ</th><th>จำนวน</th><th>ราคา</th><th>รวม</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <dl>
        <div><dt>Subtotal</dt><dd>${currency(sale.subtotal)}</dd></div>
        <div><dt>Discount</dt><dd>${currency(sale.discountAmount)}</dd></div>
        <div><dt>Delivery Fee</dt><dd>${currency(sale.deliveryFee)}</dd></div>
        ${finance.vatEnabled ? `<div><dt>มูลค่าก่อน VAT</dt><dd>${currency(vat.base)}</dd></div><div><dt>VAT ${finance.vatRate}%</dt><dd>${currency(vat.vat)}</dd></div>` : ''}
        <div class="receipt-total"><dt>Total</dt><dd>${currency(sale.total)}</dd></div>
        ${meta.showPayment ? `<div><dt>Payment Method</dt><dd>${paymentLabel[sale.paymentMethod] || sale.paymentMethod}</dd></div><div><dt>Paid Amount</dt><dd>${currency(sale.paidAmount)}</dd></div><div><dt>Balance</dt><dd>${currency(sale.balance)}</dd></div>` : ''}
      </dl>
      <section class="document-note"><strong>${meta.detailTitle}</strong><p>${meta.detail}</p></section>
      <section class="document-signatures">
        <div><span>${meta.signerLeft}</span></div>
        <div><span>${meta.signerRight}</span></div>
      </section>
      <p class="thanks">${brand.receiptThankYouMessage}</p>
      <footer>${brand.documentFooterText}</footer>
    </div>
  `;
}

function documentMeta(type, brand) {
  const map = {
    quotation: {
      title: brand.quotationTitle || 'ใบเสนอราคา',
      detailTitle: 'เงื่อนไขใบเสนอราคา',
      detail: brand.quotationTerms || 'ใบเสนอราคานี้มีอายุตามที่ร้านกำหนด และราคายังไม่รวมรายการเพิ่มเติมนอกเหนือจากที่ระบุ',
      signerLeft: 'ผู้เสนอราคา',
      signerRight: 'ผู้อนุมัติ / ลูกค้า',
      showPayment: false
    },
    delivery_note: {
      title: brand.deliveryNoteTitle || 'ใบส่งของ',
      detailTitle: 'รายละเอียดการส่งมอบ',
      detail: 'เอกสารนี้ใช้ยืนยันการส่งมอบสินค้า/บริการตามรายการข้างต้น ผู้รับควรตรวจสอบรายการก่อนลงนามรับของ',
      signerLeft: 'ผู้ส่งของ / ผู้ขาย',
      signerRight: 'ผู้รับของ / ลูกค้า',
      showPayment: false
    },
    receipt: {
      title: brand.receiptTitle || 'ใบเสร็จรับเงิน',
      detailTitle: 'หมายเหตุการชำระเงิน',
      detail: 'ได้รับชำระเงินตามรายการข้างต้นเรียบร้อยแล้ว เว้นแต่มีการระบุยอดคงเหลือในเอกสาร',
      signerLeft: 'เจ้าของร้าน / ผู้ขาย',
      signerRight: 'ลูกค้า',
      showPayment: true
    }
  };
  return map[type] || map.receipt;
}

function calculateVat(total, finance) {
  if (!finance.vatEnabled) return { base: total, vat: 0 };
  const rate = Number(finance.vatRate || 0) / 100;
  const base = total / (1 + rate);
  return { base, vat: total - base };
}

export function downloadReceiptText(sale) {
  const profile = loadStoreProfile();
  const brand = loadBrandSettings();
  const meta = documentMeta(sale.documentType, brand);
  const lines = [
    profile.storeNameEn,
    `${meta.title} ${sale.saleNo}`,
    `วันที่ ${thaiDate(sale.createdAt)}`,
    ...sale.items.map(item => `${item.name} x${item.quantity} ${currency(item.price * item.quantity)}`),
    `Subtotal ${currency(sale.subtotal)}`,
    `Discount ${currency(sale.discountAmount)}`,
    `Delivery Fee ${currency(sale.deliveryFee)}`,
    `Total ${currency(sale.total)}`,
    ...(meta.showPayment ? [`Paid ${currency(sale.paidAmount)}`, `Balance ${currency(sale.balance)}`] : [meta.detail])
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sale.saleNo}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
