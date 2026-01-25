'use client';

import { THEME_COLORS } from '@/libs/constants';
import { PaymentMethod } from '@/types/sale';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
}

const PAYMENT_METHODS = [
  { value: PaymentMethod.CASH, label: 'نقدی', icon: '💵' },
  { value: PaymentMethod.POS, label: 'کارتخوان', icon: '💳' },
  { value: PaymentMethod.CARD_TRANSFER, label: 'کارت', icon: '🏦' },
];

export function PaymentMethodSelector({
  paymentMethod,
  onMethodChange,
}: PaymentMethodSelectorProps) {
  return (
    <div>
      <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>
        روش پرداخت
      </div>
      <div
        className="grid grid-cols-3 gap-1 rounded p-1"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.value}
            onClick={() => onMethodChange(method.value)}
            className="py-3 rounded font-bold transition-all text-sm"
            style={{
              backgroundColor: paymentMethod === method.value ? THEME_COLORS.accent : 'transparent',
              color: paymentMethod === method.value ? '#fff' : THEME_COLORS.text,
            }}
          >
            <div>{method.icon}</div>
            <div>{method.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
