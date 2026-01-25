'use client';

import { THEME_COLORS } from '@/libs/constants';

interface PaymentQuickCalcProps {
  customDivisor: string;
  onSetCustomDivisor: (value: string) => void;
  onSetFull: () => void;
  onSetHalf: () => void;
  onSetDivided: (divisor: number) => void;
}

export function PaymentQuickCalc({
  customDivisor,
  onSetCustomDivisor,
  onSetFull,
  onSetHalf,
  onSetDivided,
}: PaymentQuickCalcProps) {
  return (
    <div>
      <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.subtext }}>
        محاسبه سریع
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onSetFull}
          className="py-3 rounded font-bold border-2"
          style={{
            backgroundColor: THEME_COLORS.green,
            borderColor: THEME_COLORS.green,
            color: '#fff',
          }}
        >
          همه
        </button>
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
            className="px-2 py-1 rounded text-center border"
            style={{
              backgroundColor: THEME_COLORS.surface,
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.text,
            }}
            placeholder="÷ 2"
          />
          <button
            onClick={() => onSetDivided(parseInt(customDivisor) || 2)}
            className="py-1 rounded font-bold text-sm"
            style={{
              backgroundColor: THEME_COLORS.accent,
              color: '#fff',
            }}
          >
            اعمال
          </button>
        </div>
      </div>
    </div>
  );
}
