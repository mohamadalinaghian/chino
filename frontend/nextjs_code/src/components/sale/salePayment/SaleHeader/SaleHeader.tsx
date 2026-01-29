'use client';
import { useRouter } from 'next/navigation';
import { formatPersianMoney } from '@/utils/persianUtils';

interface SaleHeaderProps {
  saleId: string | number;
  sale: { guest_name?: string };
  summaryCalculations: {
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  };
  THEME_COLORS: {
    bgSecondary: string;
    border: string;
    text: string;
    accent: string;
    green: string;
    orange: string;
    surface?: string;     // ← optional, used in other component
  };
}

export function SaleHeader({
  saleId,
  sale,
  summaryCalculations,
  THEME_COLORS,
}: SaleHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="px-5 py-4 border-b shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-opacity-90"
      style={{
        backgroundColor: THEME_COLORS.bgSecondary,
        borderColor: THEME_COLORS.border,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left side - Back + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:bg-white/10 hover:shadow-sm active:scale-95 flex items-center gap-2"
            style={{ borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
          >
            ← بازگشت
          </button>

          <h1
            className="text-xl md:text-2xl font-bold tracking-tight"
            style={{ color: THEME_COLORS.text }}
          >
            {sale.guest_name || `فروش #${saleId}`}
          </h1>
        </div>

        {/* Right side - Summary pills */}
        <div className="flex flex-wrap gap-4 md:gap-6">
          <Summary
            label="جمع"
            value={summaryCalculations.totalAmount}
            color={THEME_COLORS.accent}
            THEME_COLORS={THEME_COLORS}
          />
          <Summary
            label="پرداخت شده"
            value={summaryCalculations.paidAmount}
            color={THEME_COLORS.green}
            THEME_COLORS={THEME_COLORS}
          />
          <Summary
            label="مانده"
            value={summaryCalculations.remainingAmount}
            color={THEME_COLORS.orange}
            THEME_COLORS={THEME_COLORS}
          />
        </div>
      </div>
    </header>
  );
}

interface SummaryProps {
  label: string;
  value: number;
  color: string;
  THEME_COLORS: any;
}

function Summary({ label, value, color, THEME_COLORS }: SummaryProps) {
  return (
    <div
      className="px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-95 min-w-[140px] text-center"
      style={{
        backgroundColor: `${color}15`, // 15 = ~9% opacity
        color: THEME_COLORS.text,
        border: `1px solid ${color}30`,
      }}
    >
      <span className="text-gray-600 dark:text-gray-400">{label}:</span>{' '}
      <span
        className="font-bold tabular-nums"
        style={{ color }}
      >
        {formatPersianMoney(value)}
      </span>
    </div>
  );
}
