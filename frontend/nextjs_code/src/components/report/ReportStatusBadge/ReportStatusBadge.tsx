'use client';

import { THEME_COLORS } from '@/libs/constants';

type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CLOSED';

interface ReportStatusBadgeProps {
  status: ReportStatus;
}

const statusConfig: Record<ReportStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: {
    label: 'پیش‌نویس',
    color: THEME_COLORS.orange,
    bgColor: `${THEME_COLORS.orange}20`,
  },
  SUBMITTED: {
    label: 'ثبت شده',
    color: THEME_COLORS.blue,
    bgColor: `${THEME_COLORS.blue}20`,
  },
  APPROVED: {
    label: 'تایید شده',
    color: THEME_COLORS.green,
    bgColor: `${THEME_COLORS.green}20`,
  },
  CLOSED: {
    label: 'بسته شده',
    color: THEME_COLORS.purple,
    bgColor: `${THEME_COLORS.purple}20`,
  },
};

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className="px-4 py-2 rounded-full font-bold text-sm"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}
