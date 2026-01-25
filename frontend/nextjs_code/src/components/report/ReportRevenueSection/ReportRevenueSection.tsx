'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';

interface ReportRevenueSectionProps {
  totalSales: number;
  totalRefunds: number;
  totalDiscount: number;
  totalTax: number;
  cogs: number;
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
}

export function ReportRevenueSection({
  totalSales,
  totalRefunds,
  totalDiscount,
  totalTax,
  cogs,
  totalExpenses,
  totalRevenue,
  netProfit,
}: ReportRevenueSectionProps) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      <h2 className="text-lg font-bold mb-4" style={{ color: THEME_COLORS.text }}>
        جزئیات درآمد و هزینه
      </h2>

      <div className="space-y-3">
        {/* Revenue Section */}
        <div className="pb-3 border-b" style={{ borderColor: THEME_COLORS.border }}>
          <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.green }}>
            درآمد
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>فروش کل</span>
              <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(totalSales)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>مالیات</span>
              <span style={{ color: THEME_COLORS.text }}>+{formatPersianMoney(totalTax)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>استرداد</span>
              <span style={{ color: THEME_COLORS.red }}>-{formatPersianMoney(totalRefunds)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>تخفیف</span>
              <span style={{ color: THEME_COLORS.red }}>-{formatPersianMoney(totalDiscount)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="pb-3 border-b" style={{ borderColor: THEME_COLORS.border }}>
          <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.orange }}>
            هزینه‌ها
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>بهای تمام شده کالا (COGS)</span>
              <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(cogs)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>سایر هزینه‌ها</span>
              <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Totals Section */}
        <div className="pt-2">
          <div className="flex justify-between mb-2">
            <span className="font-bold" style={{ color: THEME_COLORS.text }}>درآمد کل</span>
            <span className="font-bold" style={{ color: THEME_COLORS.blue }}>
              {formatPersianMoney(totalRevenue)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold" style={{ color: THEME_COLORS.text }}>سود خالص</span>
            <span
              className="font-bold text-lg"
              style={{ color: netProfit >= 0 ? THEME_COLORS.green : THEME_COLORS.red }}
            >
              {formatPersianMoney(netProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
