'use client';

import { useRouter } from 'next/navigation';
import { THEME_COLORS } from '@/libs/constants';
import { getCurrentJalaliDate } from '@/utils/persianUtils';

interface EditSaleHeaderProps {
  saleId: number;
  onCancel: () => void;
}

export function EditSaleHeader({ saleId, onCancel }: EditSaleHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="p-2 border-b"
      style={{
        backgroundColor: THEME_COLORS.bgSecondary,
        borderColor: THEME_COLORS.border,
      }}
    >
      <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90 border-2"
            style={{
              backgroundColor: 'transparent',
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.subtext,
            }}
          >
            ← بازگشت
          </button>
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ color: THEME_COLORS.text }}
          >
            ویرایش فروش #{saleId}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/sale/${saleId}/payment`)}
            className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90"
            style={{
              backgroundColor: THEME_COLORS.green,
              color: '#fff',
            }}
          >
            پرداخت
          </button>
          <div style={{ color: THEME_COLORS.subtext }}>
            {getCurrentJalaliDate('dddd، jD jMMMM jYYYY')}
          </div>
        </div>
      </div>
    </header>
  );
}
