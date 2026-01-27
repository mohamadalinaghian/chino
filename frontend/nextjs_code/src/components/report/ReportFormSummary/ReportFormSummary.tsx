'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';

interface ReportFormSummaryProps {
  openingFloat: number;
  closingCash: number;
  posTotal: number;
  cardTransferTotal: number;
  cashReceived: number;
  totalIncome: number;
}

/**
 * ReportFormSummary
 * Displays calculated totals based on form values
 */
export function ReportFormSummary({
  openingFloat,
  closingCash,
  posTotal,
  cardTransferTotal,
  cashReceived,
  totalIncome,
}: ReportFormSummaryProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: THEME_COLORS.border }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
            خلاصه محاسبات
          </h3>
        </div>
      </div>

      {/* Summary Items */}
      <div className="p-5 space-y-4">
        {/* Cash Calculation */}
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: THEME_COLORS.surface }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: THEME_COLORS.subtext }}>
            محاسبه نقدی
          </div>
          <div className="space-y-2">
            <SummaryRow
              label="نقدی شمارش شده"
              value={closingCash}
              color={THEME_COLORS.text}
            />
            <SummaryRow
              label="موجودی اولیه"
              value={-openingFloat}
              color={THEME_COLORS.subtext}
              isNegative
            />
            <div className="border-t pt-2 mt-2" style={{ borderColor: THEME_COLORS.border }}>
              <SummaryRow
                label="نقدی دریافتی"
                value={cashReceived}
                color={cashReceived >= 0 ? THEME_COLORS.green : THEME_COLORS.red}
                isBold
              />
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: THEME_COLORS.surface }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: THEME_COLORS.subtext }}>
            تفکیک درآمد
          </div>
          <div className="space-y-2">
            <SummaryRow
              label="نقدی دریافتی"
              value={cashReceived}
              color={THEME_COLORS.green}
              icon="💵"
            />
            <SummaryRow
              label="کارتخوان"
              value={posTotal}
              color={THEME_COLORS.purple}
              icon="💳"
            />
            <SummaryRow
              label="کارت به کارت"
              value={cardTransferTotal}
              color={THEME_COLORS.blue}
              icon="📱"
            />
          </div>
        </div>

        {/* Total */}
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${THEME_COLORS.accent}15` }}
        >
          <SummaryRow
            label="مجموع درآمد"
            value={totalIncome}
            color={THEME_COLORS.accent}
            isBold
            isLarge
          />
        </div>
      </div>
    </div>
  );
}

/**
 * SummaryRow - A single row in the summary
 */
interface SummaryRowProps {
  label: string;
  value: number;
  color: string;
  icon?: string;
  isBold?: boolean;
  isLarge?: boolean;
  isNegative?: boolean;
}

function SummaryRow({
  label,
  value,
  color,
  icon,
  isBold = false,
  isLarge = false,
  isNegative = false,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`flex items-center gap-2 ${isLarge ? 'text-base' : 'text-sm'}`}
        style={{ color: THEME_COLORS.text }}
      >
        {icon && <span>{icon}</span>}
        {label}
      </span>
      <span
        className={`${isBold ? 'font-bold' : ''} ${isLarge ? 'text-xl' : ''}`}
        style={{ color }}
      >
        {isNegative && value !== 0 ? '- ' : ''}
        {formatPersianMoney(Math.abs(value))}
      </span>
    </div>
  );
}
