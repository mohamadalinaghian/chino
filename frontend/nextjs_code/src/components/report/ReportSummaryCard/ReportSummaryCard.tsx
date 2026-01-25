'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';

interface ReportSummaryCardProps {
  title: string;
  value: number;
  subtitle?: string;
  valueColor?: string;
  icon?: string;
}

export function ReportSummaryCard({
  title,
  value,
  subtitle,
  valueColor = THEME_COLORS.text,
  icon,
}: ReportSummaryCardProps) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: THEME_COLORS.surface }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-xl">{icon}</span>}
        <span className="text-sm font-medium" style={{ color: THEME_COLORS.subtext }}>
          {title}
        </span>
      </div>
      <div className="text-2xl font-bold" style={{ color: valueColor }}>
        {formatPersianMoney(value)}
      </div>
      {subtitle && (
        <div className="text-xs mt-1" style={{ color: THEME_COLORS.textDark }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
