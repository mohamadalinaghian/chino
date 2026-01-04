// TODO: REFACTOR - This file is 700+ lines with repetitive HTML generation
// Recommended refactoring:
// 1. Extract common styles into a separate CSS template or constant
// 2. Create a ReceiptTemplateBuilder class to reduce HTML string concatenation
// 3. Split into separate files: printReceiptStandard.ts, printReceiptEdit.ts, printReceiptTable.ts
// 4. Consider using a template engine or JSX-to-string for cleaner HTML generation
// 5. Extract common receipt sections (header, footer, items) into reusable functions
// 6. Add unit tests for receipt generation logic

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

/**
 * Edit mode print item with diff status
 */
export interface PrintEditItem extends PrintSaleItem {
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  oldQuantity?: number;
  quantityDiff?: number;
}

/**
 * Edit mode print data with changes
 */
export interface PrintEditData extends Omit<PrintSaleData, 'items'> {
  items: PrintEditItem[];
  tableChanged?: boolean;
  oldTableName?: string;
  newTableName?: string;
}

/**
 * Format edit receipt HTML showing only differences
 */
export function formatEditReceiptHTML(data: PrintEditData): string {
  const jalaliDate = jalaliMoment(data.timestamp).locale('fa').format('jYYYY/jMM/jDD');
  const time = jalaliMoment(data.timestamp).locale('fa').format('HH:mm:ss');

  // Filter to show only changed items
  const changedItems = data.items.filter(item => item.status !== 'unchanged');

  // If table changed but no item changes, show table change only
  if (data.tableChanged && changedItems.length === 0) {
    return formatTableChangeReceipt(data, jalaliDate, time);
  }

  let receiptHTML = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رسید تغییرات</title>
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
    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9pt;
      font-weight: bold;
      margin-left: 5px;
    }
    .status-added {
      background: #d4edda;
      color: #155724;
    }
    .status-removed {
      background: #f8d7da;
      color: #721c24;
      text-decoration: line-through;
    }
    .status-modified {
      background: #fff3cd;
      color: #856404;
    }
    .table-change {
      padding: 10px;
      margin: 10px 0;
      background: #e7f3ff;
      border-radius: 5px;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px dashed #000;
      font-size: 10pt;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>کافه چینو</h1>
    <div class="subtitle">تغییرات سفارش</div>
  </div>

  <div class="info-row">
    <span>تاریخ: ${jalaliDate}</span>
    <span>ساعت: ${toPersianDigits(time)}</span>
  </div>

  ${data.sale_id ? `<div class="info-row"><span>شماره فروش: ${toPersianDigits(data.sale_id)}</span></div>` : ''}

  ${data.tableChanged ? `
  <div class="table-change">
    <strong>تغییر میز:</strong><br/>
    ${data.oldTableName || 'بیرون‌بر'} ← ${data.newTableName || 'بیرون‌بر'}
  </div>
  ` : ''}

  <div class="section">
    <strong>تغییرات اقلام:</strong>
  </div>
`;

  // Add changed items
  changedItems.forEach((item) => {
    const statusClass = `status-${item.status}`;
    const statusText = item.status === 'added' ? '+ اضافه شد' :
                      item.status === 'removed' ? '- حذف شد' :
                      '✎ تغییر کرد';

    receiptHTML += `
  <div class="item">
    <div class="item-header">
      <span>
        <span class="status-badge ${statusClass}">${statusText}</span>
        ${item.name}
      </span>
      <span>${item.status !== 'removed' ? formatPersianMoney(item.total) : ''}</span>
    </div>
    <div class="item-details">
`;

    if (item.status === 'modified' && item.oldQuantity !== undefined && item.quantityDiff !== undefined) {
      const diffSymbol = item.quantityDiff > 0 ? '+' : '';
      receiptHTML += `
      تعداد: ${toPersianDigits(item.oldQuantity)} → ${toPersianDigits(item.quantity)} (${diffSymbol}${toPersianDigits(item.quantityDiff)})
`;
    } else {
      receiptHTML += `
      ${toPersianDigits(item.quantity)} × ${formatPersianMoney(item.unit_price)}
`;
    }

    receiptHTML += `
    </div>
  </div>
`;
  });

  receiptHTML += `
  <div class="footer">
    <div>لطفاً این رسید را نگه دارید</div>
  </div>
</body>
</html>
`;

  return receiptHTML;
}

/**
 * Format table change only receipt
 */
function formatTableChangeReceipt(data: PrintEditData, jalaliDate: string, time: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تغییر میز</title>
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
      text-align: center;
      width: 80mm;
      background: white;
      padding: 20px;
    }
    .header {
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .header h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .table-change-box {
      padding: 20px;
      margin: 20px 0;
      background: #e7f3ff;
      border: 2px solid #0066cc;
      border-radius: 8px;
    }
    .table-change-box h2 {
      font-size: 14pt;
      margin-bottom: 15px;
      color: #0066cc;
    }
    .table-change-box .tables {
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
    }
    .arrow {
      font-size: 20pt;
      color: #0066cc;
      margin: 5px 0;
    }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 2px dashed #000;
      font-size: 10pt;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>کافه چینو</h1>
  </div>

  <div>تاریخ: ${jalaliDate} - ${toPersianDigits(time)}</div>
  ${data.sale_id ? `<div>شماره فروش: ${toPersianDigits(data.sale_id)}</div>` : ''}

  <div class="table-change-box">
    <h2>تغییر میز</h2>
    <div class="tables">${data.oldTableName || 'بیرون‌بر'}</div>
    <div class="arrow">↓</div>
    <div class="tables">${data.newTableName || 'بیرون‌بر'}</div>
  </div>

  <div class="footer">
    <div>تغییری در اقلام سفارش انجام نشده است</div>
  </div>
</body>
</html>
`;
}

/**
 * Print edit receipt with differences
 */
export function printEditReceipt(data: PrintEditData): void {
  const receiptHTML = formatEditReceiptHTML(data);

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

        // Clean up iframe after printing
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

// =====================================================================
// PRINT QUEUE FUNCTIONS (Option B: Mobile-to-PC Print Queue System)
// =====================================================================

/**
 * Queue a standard receipt for printing
 *
 * Instead of triggering browser print, this adds the receipt to a queue
 * that the cafe PC will monitor and auto-print from.
 *
 * @param data - Receipt data
 * @param saleId - Optional sale ID for tracking
 */
export async function queueReceipt(data: PrintSaleData, saleId?: number): Promise<void> {
  try {
    // Dynamically import to avoid circular dependencies
    const { addPrintJob } = await import('@/service/printQueue');

    await addPrintJob({
      sale_id: saleId,
      print_type: 'STANDARD',
      print_data: data,
    });
  } catch (error) {
    console.error('Error queueing receipt:', error);
    throw error;
  }
}

/**
 * Queue an edit diff receipt for printing
 *
 * @param data - Edit diff receipt data
 * @param saleId - Optional sale ID for tracking
 */
export async function queueEditReceipt(data: PrintEditData, saleId?: number): Promise<void> {
  try {
    // Dynamically import to avoid circular dependencies
    const { addPrintJob } = await import('@/service/printQueue');

    await addPrintJob({
      sale_id: saleId,
      print_type: 'EDIT_DIFF',
      print_data: data,
    });
  } catch (error) {
    console.error('Error queueing edit receipt:', error);
    throw error;
  }
}
