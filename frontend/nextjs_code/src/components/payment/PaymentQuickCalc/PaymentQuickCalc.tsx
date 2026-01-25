'use client';
import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';

interface PaymentQuickCalcProps {
  customDivisor: string;
  onSetCustomDivisor: (value: string) => void;
  onSetHalf: () => void;
  onSetDivided: (divisor: number) => void;
  finalAmount: number;
  onSetFull: () => void;
}

export function PaymentQuickCalc({
  customDivisor,
  onSetCustomDivisor,
  onSetHalf,
  onSetDivided,
  finalAmount,
  onSetFull,
}: PaymentQuickCalcProps) {
  return (
    <div>
      {/* Final Amount Card - Single source of truth display */}
      <div
        className="mb-3 p-3 rounded-lg text-center cursor-pointer transition-all hover:opacity-90"
        style={{ backgroundColor: THEME_COLORS.accent }}
        onClick={onSetFull}
      >
        <div className="text-xs opacity-80" style={{ color: '#fff' }}>
          مبلغ قابل پرداخت (کلیک برای انتخاب)
        </div>
        <div className="text-2xl font-bold" style={{ color: '#fff' }}>
          {formatPersianMoney(finalAmount)}
        </div>
      </div>

      <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.subtext }}>
        محاسبه سریع
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onSetHalf}
          className="py-3 rounded font-bold border-2"
          style={{
            backgroundColor: THEME_COLORS.blue,
            borderColor: THEME_COLORS.blue,
            color: '#fff',
          }}
        >
          نصف
        </button>

        <div className="flex flex-col gap-1">
          <input
            type="number"
            min="2"
            value={customDivisor}
            onChange={(e) => onSetCustomDivisor(e.target.value)}
            className="px-2 py-1.5 rounded text-center border text-sm"
            style={{
              backgroundColor: THEME_COLORS.surface,
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.text,
            }}
            placeholder="تعداد تقسیم"
          />
          <button
            onClick={() => {
              const div = parseInt(customDivisor) || 2;
              if (div >= 2) onSetDivided(div);
            }}
            className="py-1.5 rounded font-medium text-sm"
            style={{
              backgroundColor: THEME_COLORS.accent,
              color: '#fff',
            }}
          >
            اعمال تقسیم
          </button>
        </div>
      </div>
    </div>
  );
}
