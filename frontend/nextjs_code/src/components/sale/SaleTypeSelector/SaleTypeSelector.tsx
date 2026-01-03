'use client';

import { SaleType } from '@/types/sale';
import { THEME_COLORS } from '@/libs/constants';

interface SaleTypeSelectorProps {
  selectedType: SaleType;
  onTypeChange: (type: SaleType) => void;
}

export function SaleTypeSelector({
  selectedType,
  onTypeChange,
}: SaleTypeSelectorProps) {
  const saleTypes = [
    { value: SaleType.DINE_IN, label: 'سرو در محل', icon: '🍽️' },
    { value: SaleType.TAKEAWAY, label: 'بیرون بر', icon: '🥡' },
  ];

  return (
    <div className="w-full">
      <label
        className="block mb-3 font-medium"
        style={{ color: THEME_COLORS.subtext }}
      >
        نوع سفارش
      </label>
      <div className="grid grid-cols-2 gap-2">
        {saleTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-300
              flex flex-col items-center justify-center gap-2
              hover:scale-105 active:scale-95
              ${
                selectedType === type.value
                  ? 'border-[#CBA6F7] bg-[#313244]'
                  : 'border-[#313244] bg-[#1E1E2E]'
              }
            `}
            style={{
              borderColor:
                selectedType === type.value
                  ? THEME_COLORS.accent
                  : THEME_COLORS.border,
              backgroundColor:
                selectedType === type.value
                  ? THEME_COLORS.surface
                  : THEME_COLORS.bgPrimary,
            }}
          >
            <span className="text-3xl">{type.icon}</span>
            <span
              className="text-lg font-bold"
              style={{
                color:
                  selectedType === type.value
                    ? THEME_COLORS.text
                    : THEME_COLORS.subtext,
              }}
            >
              {type.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
