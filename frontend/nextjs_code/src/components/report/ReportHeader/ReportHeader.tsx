'use client';

import { useRouter } from 'next/navigation';
import { THEME_COLORS } from '@/libs/constants';
import { ReportStatusBadge } from '../ReportStatusBadge';

interface ReportHeaderProps {
  reportId: number;
  reportDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CLOSED';
  creator: string;
}

export function ReportHeader({ reportId, reportDate, status, creator }: ReportHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="p-4 border-b"
      style={{
        backgroundColor: THEME_COLORS.bgSecondary,
        borderColor: THEME_COLORS.border,
      }}
    >
      <div className="max-w-screen-xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90 border"
            style={{
              backgroundColor: 'transparent',
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.subtext,
            }}
          >
            بازگشت
          </button>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: THEME_COLORS.text }}
            >
              گزارش روزانه #{reportId}
            </h1>
            <div className="text-sm mt-1" style={{ color: THEME_COLORS.subtext }}>
              {reportDate} | ایجاد شده توسط: {creator}
            </div>
          </div>
        </div>
        <ReportStatusBadge status={status} />
      </div>
    </header>
  );
}
