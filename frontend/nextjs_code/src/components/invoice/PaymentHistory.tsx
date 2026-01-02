/**
 * Payment History Component
 * Displays list of previous payments
 */

import { formatPersianMoney } from '@/libs/tools/persianMoney';
import { formatJalaliLong } from '@/libs/tools/jalaliDate';
import { PaymentDetail } from '@/types/invoiceType';

interface Props {
  payments: PaymentDetail[];
}

export function PaymentHistory({ payments }: Props) {
  if (payments.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>📜</span> تاریخچه پرداخت‌ها
      </h3>
      <div className="space-y-3">
        {payments.map((payment, index) => (
          <div
            key={payment.id}
            className="bg-gray-750 rounded-xl p-4 border border-gray-600"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-white">#{index + 1}</span>
                <span className="text-sm text-gray-400 mr-3">{payment.method}</span>
              </div>
              <span className="text-lg font-bold text-green-400">
                {formatPersianMoney(parseFloat(payment.amount_applied))}
              </span>
            </div>
            {parseFloat(payment.tip_amount) > 0 && (
              <p className="text-sm text-gray-400">
                انعام: {formatPersianMoney(parseFloat(payment.tip_amount))}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {formatJalaliLong(payment.received_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
