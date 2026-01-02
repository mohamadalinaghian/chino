/**
 * Invoice Header Component
 * Displays invoice number, status, and summary information
 */

import { formatPersianMoney } from '@/libs/tools/persianMoney';
import { InvoiceStatus } from '@/types/invoiceType';
import { SaleDetailResponse } from '@/types/saleType';

interface Props {
  invoiceNumber: string;
  invoiceStatus: InvoiceStatus;
  saleId: number;
  sale: SaleDetailResponse | null;
  totalAmount: number;
  balanceDue: number;
  onBack: () => void;
}

export function InvoiceHeader({
  invoiceNumber,
  invoiceStatus,
  saleId,
  sale,
  totalAmount,
  balanceDue,
  onBack,
}: Props) {
  const isPaid = invoiceStatus === InvoiceStatus.PAID;
  const isPartiallyPaid = invoiceStatus === InvoiceStatus.PARTIALLY_PAID;

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-900 to-gray-900/95 border-b-2 border-purple-500 shadow-xl backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-lg transition-all"
            >
              ←
            </button>
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                💳 فاکتور #{invoiceNumber}
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium border
                  ${isPaid ? 'bg-green-600/20 text-green-400 border-green-500' :
                    isPartiallyPaid ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500' :
                      'bg-red-600/20 text-red-400 border-red-500'}
                `}>
                  {isPaid ? 'پرداخت شده' : isPartiallyPaid ? 'پرداخت جزئی' : 'پرداخت نشده'}
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                فروش #{saleId} • {sale?.table_number ? `میز ${sale.table_number}` : 'بیرون‌بر'}
              </p>
            </div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400 mb-0.5">جمع کل فاکتور</p>
            <p className="text-base font-bold text-white">{formatPersianMoney(totalAmount)}</p>
          </div>
          <div className={`rounded-lg p-3 border ${balanceDue > 0 ? 'bg-red-900/20 border-red-800' : 'bg-green-900/20 border-green-800'}`}>
            <p className="text-xs text-gray-400 mb-0.5">مانده پرداخت</p>
            <p className={`text-base font-bold ${balanceDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatPersianMoney(balanceDue)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
