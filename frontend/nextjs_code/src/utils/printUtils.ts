import { formatPersianMoney, toPersianDigits } from './persianUtils';
import jalaliMoment from 'jalali-moment';

export interface PrintSaleItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  extras?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

export interface PrintSaleData {
  sale_id?: number;
  invoice_number?: string;
  sale_type: string;
  table_name?: string;
  guest_name?: string;
  guest_count?: number;
  items: PrintSaleItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  note?: string;
  timestamp: Date;
}

/**
 * Format sale data into thermal printer-style HTML receipt
 */
export function formatReceiptHTML(data: PrintSaleData): string {
  const jalaliDate = jalaliMoment(data.timestamp).locale('fa').format('jYYYY/jMM/jDD');
  const time = jalaliMoment(data.timestamp).locale('fa').format('HH:mm:ss');

  let receiptHTML = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رسید فروش</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 5mm;
      }
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Tahoma, Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.4;
      direction: rtl;
      text-align: right;
      width: 80mm;
      background: white;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .header h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .header .subtitle {
      font-size: 10pt;
      color: #333;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 11pt;
    }
    .section {
      margin: 10px 0;
      padding: 8px 0;
      border-top: 1px dashed #666;
    }
    .item {
      margin: 8px 0;
      padding: 5px 0;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .item-details {
      font-size: 10pt;
      color: #333;
      padding-right: 10px;
    }
    .extra {
      padding: 2px 0 2px 15px;
      font-size: 10pt;
      display: flex;
      justify-content: space-between;
      color: #555;
    }
    .totals {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 2px solid #000;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 11pt;
    }
    .total-row.final {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px dashed #000;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px dashed #000;
      font-size: 10pt;
      color: #666;
    }
    .note {
      margin: 8px 0;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>کافه چینو</h1>
    <div class="subtitle">Chino Cafe</div>
  </div>

  <div class="info-row">
    <span>تاریخ: ${jalaliDate}</span>
    <span>ساعت: ${toPersianDigits(time)}</span>
  </div>

  ${data.sale_id ? `<div class="info-row"><span>شماره فروش: ${toPersianDigits(data.sale_id)}</span></div>` : ''}
  ${data.invoice_number ? `<div class="info-row"><span>شماره فاکتور: ${data.invoice_number}</span></div>` : ''}

  <div class="info-row">
    <span>نوع: ${data.sale_type === 'DINE_IN' ? 'سرو در محل' : 'بیرون بر'}</span>
  </div>

  ${data.table_name ? `<div class="info-row"><span>میز: ${data.table_name}</span></div>` : ''}
  ${data.guest_name ? `<div class="info-row"><span>مهمان: ${data.guest_name}</span></div>` : ''}
  ${data.guest_count ? `<div class="info-row"><span>تعداد نفرات: ${toPersianDigits(data.guest_count)}</span></div>` : ''}

  <div class="section">
    <strong>اقلام سفارش:</strong>
  </div>
`;

  // Add items
  data.items.forEach((item) => {
    receiptHTML += `
  <div class="item">
    <div class="item-header">
      <span>${item.name}</span>
      <span>${formatPersianMoney(item.total)}</span>
    </div>
    <div class="item-details">
      ${toPersianDigits(item.quantity)} × ${formatPersianMoney(item.unit_price)}
    </div>
`;

    // Add extras if any
    if (item.extras && item.extras.length > 0) {
      item.extras.forEach((extra) => {
        receiptHTML += `
    <div class="extra">
      <span>+ ${extra.name} (×${toPersianDigits(extra.quantity)})</span>
      <span>${formatPersianMoney(extra.total)}</span>
    </div>
`;
      });
    }

    receiptHTML += `  </div>`;
  });

  // Add note if exists
  if (data.note && data.note.trim()) {
    receiptHTML += `
  <div class="note">
    <strong>یادداشت:</strong><br/>
    ${data.note}
  </div>
`;
  }

  // Add totals
  receiptHTML += `
  <div class="totals">
    <div class="total-row">
      <span>جمع جزء:</span>
      <span>${formatPersianMoney(data.subtotal)}</span>
    </div>
`;

  if (data.discount && data.discount > 0) {
    receiptHTML += `
    <div class="total-row">
      <span>تخفیف:</span>
      <span>-${formatPersianMoney(data.discount)}</span>
    </div>
`;
  }

  if (data.tax && data.tax > 0) {
    receiptHTML += `
    <div class="total-row">
      <span>مالیات:</span>
      <span>${formatPersianMoney(data.tax)}</span>
    </div>
`;
  }

  receiptHTML += `
    <div class="total-row final">
      <span>جمع کل:</span>
      <span>${formatPersianMoney(data.total)}</span>
    </div>
  </div>

  <div class="footer">
    <div>با تشکر از حضور شما</div>
    <div>Thank you for your visit</div>
  </div>
</body>
</html>
`;

  return receiptHTML;
}

/**
 * Trigger browser print dialog with formatted receipt
 * Uses hidden iframe approach to auto-close after printing
 */
export function printReceipt(data: PrintSaleData): void {
  const receiptHTML = formatReceiptHTML(data);

  // Create hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '80mm';
  iframe.style.height = '100vh';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Failed to access iframe document');
    document.body.removeChild(iframe);
    return;
  }

  // Write receipt HTML to iframe
  iframeDoc.open();
  iframeDoc.write(receiptHTML);
  iframeDoc.close();

  // Wait for content to load, then print
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        // Clean up iframe after printing (or user closes dialog)
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        document.body.removeChild(iframe);
      }
    }, 250);
  };
}

/**
 * Alternative print method using window.open
 * More compatible with some browsers
 */
export function printReceiptWindow(data: PrintSaleData): void {
  const receiptHTML = formatReceiptHTML(data);

  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) {
    console.error('Failed to open print window. Check popup blocker.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(receiptHTML);
  printWindow.document.close();

  // Wait for content to load, then print and close
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Auto-close after print dialog is dismissed
      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 250);
  };
}
