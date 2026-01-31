/**
 * PaymentHistory Component
 *
 * Displays the history of payments made for a sale.
 * Shows payment details, method, amount, and void functionality.
 */

'use client';

import { useState } from 'react';
import { formatPersianMoney } from '@/utils/persianUtils';
import type { PaymentRecord } from '@/types/payment';
import { PAYMENT_METHOD_CONFIG } from '@/libs/paymentConstants';

interface PaymentHistoryProps {
  payments: PaymentRecord[];
  voidingPaymentId: number | null;
  onVoidPayment: (paymentId: number) => void;
  THEME_COLORS: any;
}

/**
 * Single payment record item with void functionality
 */
interface PaymentRecordItemProps {
  payment: PaymentRecord;
  isVoiding: boolean;
  onVoid: () => void;
  THEME_COLORS: any;
}

function PaymentRecordItem({
  payment,
  isVoiding,
  onVoid,
  THEME_COLORS,
}: PaymentRecordItemProps) {
  const [confirmVoid, setConfirmVoid] = useState(false);

  const handleVoidClick = () => {
    if (confirmVoid) {
      onVoid();
      setConfirmVoid(false);
    } else {
      setConfirmVoid(true);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmVoid(false), 3000);
    }
  };

  const isVoid = payment.status === 'VOID';
  const config = PAYMENT_METHOD_CONFIG[payment.method as keyof typeof PAYMENT_METHOD_CONFIG] || {
    label: payment.method,
    color: THEME_COLORS.text,
  };

  return (
    <div
      className="p-4 rounded-xl transition-all duration-200"
      style={{
        backgroundColor: isVoid ? `${THEME_COLORS.red}10` : THEME_COLORS.surface,
        opacity: isVoid ? 0.6 : 1,
      }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-lg font-bold number-display ${isVoid ? 'line-through' : ''}`}
              style={{ color: THEME_COLORS.text }}
            >
              {formatPersianMoney(payment.amount_applied)}
            </span>
            <span
              className="px-2 py-0.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: `${config.color}20`,
                color: config.color,
              }}
            >
              {config.label}
            </span>
            {isVoid && (
              <span
                className="px-2 py-0.5 rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: `${THEME_COLORS.red}20`,
                  color: THEME_COLORS.red,
                }}
              >
                لغو شده
              </span>
            )}
          </div>

          {payment.tip_amount > 0 && (
            <div className="text-xs mb-1" style={{ color: THEME_COLORS.green }}>
              + انعام {formatPersianMoney(payment.tip_amount)}
            </div>
          )}

          <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
            {payment.received_by_name} -{' '}
            {new Date(payment.received_at).toLocaleString('fa-IR')}
          </div>

          {payment.destination_card_number && (
            <div className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
              کارت: {payment.destination_card_number}
              {payment.destination_account_owner &&
                ` - ${payment.destination_account_owner}`}
            </div>
          )}
        </div>

        {!isVoid && (
          <button
            onClick={handleVoidClick}
            disabled={isVoiding}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: confirmVoid ? THEME_COLORS.red : `${THEME_COLORS.red}20`,
              color: confirmVoid ? '#fff' : THEME_COLORS.red,
            }}
          >
            {isVoiding ? '...' : confirmVoid ? 'تایید لغو' : 'لغو'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Payment history list component
 */
export function PaymentHistory({
  payments,
  voidingPaymentId,
  onVoidPayment,
  THEME_COLORS,
}: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div
        className="p-8 rounded-2xl text-center"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        <p className="text-sm" style={{ color: THEME_COLORS.subtext }}>
          هنوز پرداختی ثبت نشده است
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map(payment => (
        <PaymentRecordItem
          key={payment.id}
          payment={payment}
          isVoiding={voidingPaymentId === payment.id}
          onVoid={() => onVoidPayment(payment.id)}
          THEME_COLORS={THEME_COLORS}
        />
      ))}
    </div>
  );
}
