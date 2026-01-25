'use client';

import { THEME_COLORS } from '@/libs/constants';
import { ISaleDetailResponse } from '@/types/sale';

interface SaleInfoCardProps {
  originalSale: ISaleDetailResponse;
}

export function SaleInfoCard({ originalSale }: SaleInfoCardProps) {
  if (!originalSale.guest_name && !originalSale.table_name) {
    return null;
  }

  return (
    <div
      className="p-3 rounded-lg border-2"
      style={{
        backgroundColor: THEME_COLORS.bgSecondary,
        borderColor: THEME_COLORS.accent,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: '16px' }}>i</span>
        <strong style={{ color: THEME_COLORS.text }}>اطلاعات فروش فعلی:</strong>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {originalSale.guest_name && (
          <div
            className="p-2 rounded"
            style={{ backgroundColor: THEME_COLORS.bgPrimary }}
          >
            <div style={{ color: THEME_COLORS.subtext, fontSize: '11px' }}>مهمان:</div>
            <div style={{ color: THEME_COLORS.text, fontWeight: 'bold' }}>
              {originalSale.guest_name}
            </div>
          </div>
        )}
        {originalSale.table_name && (
          <div
            className="p-2 rounded"
            style={{ backgroundColor: THEME_COLORS.bgPrimary }}
          >
            <div style={{ color: THEME_COLORS.subtext, fontSize: '11px' }}>میز:</div>
            <div style={{ color: THEME_COLORS.text, fontWeight: 'bold' }}>
              {originalSale.table_name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
