'use client';

import { THEME_COLORS } from '@/libs/constants';

interface ReportNotesSectionProps {
  notes: string | null;
  approvedBy: string | null;
}

export function ReportNotesSection({ notes, approvedBy }: ReportNotesSectionProps) {
  if (!notes && !approvedBy) return null;

  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      <h2 className="text-lg font-bold mb-3" style={{ color: THEME_COLORS.text }}>
        توضیحات و تاییدات
      </h2>

      {approvedBy && (
        <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
          <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>تایید شده توسط:</div>
          <div className="font-bold" style={{ color: THEME_COLORS.green }}>{approvedBy}</div>
        </div>
      )}

      {notes && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
          <div className="text-sm mb-1" style={{ color: THEME_COLORS.subtext }}>یادداشت‌ها:</div>
          <div style={{ color: THEME_COLORS.text }}>{notes}</div>
        </div>
      )}
    </div>
  );
}
