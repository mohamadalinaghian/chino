'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';

interface ReportVarianceSectionProps {
  cashVariance: number;
  posVariance: number;
  cardTransferVariance: number;
  totalVariance: number;
  openingFloat: number;
  closingCashCounted: number;
  netCashReceived: number;
  expectedCashTotal: number;
  actualPosTotal: number;
  actualIncome: number;
}

export function ReportVarianceSection({
  cashVariance,
  posVariance,
  cardTransferVariance,
  totalVariance,
  openingFloat,
  closingCashCounted,
  netCashReceived,
  expectedCashTotal,
  actualPosTotal,
  actualIncome,
}: ReportVarianceSectionProps) {
  const getVarianceColor = (variance: number) => {
    if (variance === 0) return THEME_COLORS.green;
    return variance > 0 ? THEME_COLORS.blue : THEME_COLORS.red;
  };

  const formatVariance = (variance: number) => {
    if (variance === 0) return 'صفر';
    const prefix = variance > 0 ? '+' : '';
    return prefix + formatPersianMoney(variance);
  };

  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      <h2 className="text-lg font-bold mb-4" style={{ color: THEME_COLORS.text }}>
        مغایرت‌ها و تطبیق
      </h2>

      <div className="space-y-4">
        {/* Cash Section */}
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: THEME_COLORS.surface }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold" style={{ color: THEME_COLORS.text }}>
              نقدی
            </span>
            <span
              className="font-bold"
              style={{ color: getVarianceColor(cashVariance) }}
            >
              مغایرت: {formatVariance(cashVariance)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>موجودی اول روز</span>
              <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(openingFloat)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>موجودی پایان روز</span>
              <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(closingCashCounted)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>دریافتی خالص نقدی</span>
              <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(netCashReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: THEME_COLORS.subtext }}>مبلغ مورد انتظار</span>
              <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(expectedCashTotal)}</span>
            </div>
          </div>
        </div>

        {/* POS Section */}
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: THEME_COLORS.surface }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold" style={{ color: THEME_COLORS.text }}>
              کارتخوان (POS)
            </span>
            <span
              className="font-bold"
              style={{ color: getVarianceColor(posVariance) }}
            >
              مغایرت: {formatVariance(posVariance)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: THEME_COLORS.subtext }}>مبلغ واقعی POS</span>
            <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(actualPosTotal)}</span>
          </div>
        </div>

        {/* Card Transfer Section */}
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: THEME_COLORS.surface }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold" style={{ color: THEME_COLORS.text }}>
              کارت به کارت
            </span>
            <span
              className="font-bold"
              style={{ color: getVarianceColor(cardTransferVariance) }}
            >
              مغایرت: {formatVariance(cardTransferVariance)}
            </span>
          </div>
        </div>

        {/* Total Section */}
        <div
          className="p-4 rounded-lg border-2"
          style={{
            backgroundColor: THEME_COLORS.surface,
            borderColor: getVarianceColor(totalVariance),
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
              مغایرت کل
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: getVarianceColor(totalVariance) }}
            >
              {formatVariance(totalVariance)}
            </span>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span style={{ color: THEME_COLORS.subtext }}>درآمد واقعی</span>
            <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(actualIncome)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
