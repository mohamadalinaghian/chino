/**
 * Payment Progress Component
 * Shows progress bar for payment completion
 */

import { formatPersianMoney } from '@/libs/tools/persianMoney';

interface Props {
  totalPaid: number;
  totalAmount: number;
}

export function PaymentProgress({ totalPaid, totalAmount }: Props) {
  if (totalPaid <= 0) return null;

  const percentage = Math.min((totalPaid / totalAmount) * 100, 100);

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-400">پرداخت شده</span>
        <span className="text-sm font-bold text-green-400">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-600 to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-3 text-sm">
        <span className="text-green-400 font-bold">{formatPersianMoney(totalPaid)}</span>
        <span className="text-gray-400">از {formatPersianMoney(totalAmount)}</span>
      </div>
    </div>
  );
}
