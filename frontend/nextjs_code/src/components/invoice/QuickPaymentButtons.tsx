/**
 * Quick Payment Buttons Component
 * Provides quick payment options (full, half, custom)
 */

import { formatPersianMoney } from '@/libs/tools/persianMoney';

interface Props {
  balanceDue: number;
  onFullPayment: () => void;
  onHalfPayment: () => void;
  onCustomPayment: () => void;
}

export function QuickPaymentButtons({
  balanceDue,
  onFullPayment,
  onHalfPayment,
  onCustomPayment,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-700 rounded-xl p-4">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span>⚡</span> پرداخت سریع
      </h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={onFullPayment}
          className="py-3 px-4 bg-gradient-to-br from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-lg font-medium text-sm text-white shadow-lg active:scale-95 transition-all"
        >
          💯 پرداخت کامل
          <div className="text-xs mt-0.5 opacity-90">{formatPersianMoney(balanceDue)}</div>
        </button>
        <button
          onClick={onHalfPayment}
          className="py-3 px-4 bg-gradient-to-br from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 rounded-lg font-medium text-sm text-white shadow-lg active:scale-95 transition-all"
        >
          50% پرداخت نصف
          <div className="text-xs mt-0.5 opacity-90">{formatPersianMoney(balanceDue * 0.5)}</div>
        </button>
      </div>
      <button
        onClick={onCustomPayment}
        className="w-full py-3 px-5 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <span className="text-lg">💰</span> پرداخت با مبلغ دلخواه
      </button>
    </div>
  );
}
