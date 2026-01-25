'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { ISaleDetailResponse } from '@/types/sale';

interface PaymentSummaryBarProps {
  sale: ISaleDetailResponse;
  selectedTotal: number;
  selectAllItems: boolean;
  finalAmount: number;
}

export function PaymentSummaryBar({
  sale,
  selectedTotal,
  selectAllItems,
  finalAmount,
}: PaymentSummaryBarProps) {
  return (
    <div
      className="flex-shrink-0 px-4 py-3 border-b grid grid-cols-5 gap-2 text-center"
      style={{ borderColor: THEME_COLORS.border }}
    >
      <div>
        <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>مجموع کل</div>
        <div className="font-bold text-base" style={{ color: THEME_COLORS.text }}>
          {formatPersianMoney(sale.total_amount)}
        </div>
      </div>
      <div>
        <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>پرداخت شده</div>
        <div className="font-bold text-base" style={{ color: THEME_COLORS.green }}>
          {formatPersianMoney(sale.total_paid || 0)}
        </div>
      </div>
      <div>
        <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>مانده</div>
        <div className="font-bold text-base" style={{ color: THEME_COLORS.orange }}>
          {formatPersianMoney(sale.balance_due ?? sale.total_amount)}
        </div>
      </div>
      <div>
        <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>قابل پرداخت</div>
        <div className="font-bold text-base" style={{ color: THEME_COLORS.accent }}>
          {formatPersianMoney(finalAmount)}
        </div>
      </div>
    </div>
  );
}
