'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { TaxDiscountType } from '@/types/sale';

interface PaymentFormulaCalculatorProps {
  // Values
  selectedTotal: number;
  taxAmount: number;
  taxEnabled: boolean;
  taxValue: string;
  taxType: TaxDiscountType;
  discountAmount: number;
  discountValue: string;
  discountType: TaxDiscountType;
  tipAmount: string;
  tipAmountValue: number;
  divisor: number;
  preDivisionAmount: number;
  finalAmount: number;
  amount: string;
  isAmountManuallyOverridden: boolean;

  // Handlers
  onToggleTax: () => void;
  onIncrementTax: () => void;
  onDecrementTax: () => void;
  onTaxValueChange: (v: string) => void;
  onDiscountValueChange: (v: string) => void;
  onTipAmountChange: (v: string) => void;
  onDivisorChange: (d: number) => void;
  onIncrementDivisor: () => void;
  onDecrementDivisor: () => void;
  onAmountChange: (a: string) => void;
  onSyncToFormula: () => void;
}

export function PaymentFormulaCalculator({
  selectedTotal,
  taxAmount,
  taxEnabled,
  taxValue,
  discountAmount,
  discountValue,
  discountType,
  tipAmount,
  tipAmountValue,
  divisor,
  preDivisionAmount,
  finalAmount,
  amount,
  isAmountManuallyOverridden,
  onToggleTax,
  onIncrementTax,
  onDecrementTax,
  onDiscountValueChange,
  onTipAmountChange,
  onDivisorChange,
  onIncrementDivisor,
  onDecrementDivisor,
  onAmountChange,
  onSyncToFormula,
}: PaymentFormulaCalculatorProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: THEME_COLORS.surface }}
    >
      {/* Formula Header */}
      <div className="text-center mb-4">
        <span className="text-sm font-medium" style={{ color: THEME_COLORS.subtext }}>
          محاسبه مبلغ پرداخت
        </span>
      </div>

      {/* Formula Visualization - Card-based Grid Layout */}
      <div className="space-y-4">
        {/* Row 1: Main calculation cards */}
        <div className="grid grid-cols-4 gap-3">
          {/* Selected Items Total */}
          <div
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: THEME_COLORS.bgSecondary,
              border: `2px solid ${THEME_COLORS.accent}`
            }}
          >
            <div className="text-xs mb-1" style={{ color: THEME_COLORS.subtext }}>
              مجموع اقلام
            </div>
            <div className="text-lg font-bold" style={{ color: THEME_COLORS.accent }}>
              {formatPersianMoney(selectedTotal)}
            </div>
          </div>

          {/* Tax Box - with clear ON/OFF toggle */}
          <div
            className="rounded-xl p-3 text-center relative"
            style={{
              backgroundColor: taxEnabled ? `${THEME_COLORS.blue}10` : THEME_COLORS.bgSecondary,
              border: `2px solid ${taxEnabled ? THEME_COLORS.blue : THEME_COLORS.border}`,
            }}
          >
            {/* Tax ON/OFF Toggle - Clear switch button */}
            <button
              onClick={onToggleTax}
              className="absolute -top-2 -right-2 w-12 h-6 rounded-full text-xs font-bold transition-all flex items-center justify-center shadow-md"
              style={{
                backgroundColor: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.border,
                color: taxEnabled ? '#fff' : THEME_COLORS.subtext,
              }}
            >
              {taxEnabled ? 'فعال' : 'غیرفعال'}
            </button>

            <div className="text-xs mb-1" style={{ color: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.subtext }}>
              <span className="text-lg ml-1">+</span> مالیات {taxEnabled ? `(${taxValue}%)` : ''}
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.subtext }}
            >
              {taxEnabled ? formatPersianMoney(taxAmount) : '۰'}
            </div>
            {/* Tax percentage controls - always visible for clarity */}
            <div className="flex items-center justify-center gap-1 mt-2">
              <button
                onClick={onDecrementTax}
                disabled={!taxEnabled}
                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  backgroundColor: `${THEME_COLORS.blue}30`,
                  color: THEME_COLORS.blue,
                }}
              >
                -
              </button>
              <span
                className="text-xs px-2 font-bold min-w-[40px]"
                style={{ color: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.subtext }}
              >
                {taxValue}%
              </span>
              <button
                onClick={onIncrementTax}
                disabled={!taxEnabled}
                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  backgroundColor: `${THEME_COLORS.blue}30`,
                  color: THEME_COLORS.blue,
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Discount Box */}
          <div
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: discountAmount > 0 ? `${THEME_COLORS.orange}10` : THEME_COLORS.bgSecondary,
              border: `2px solid ${discountAmount > 0 ? THEME_COLORS.orange : THEME_COLORS.border}`,
            }}
          >
            <div className="text-xs mb-1" style={{ color: discountAmount > 0 ? THEME_COLORS.orange : THEME_COLORS.subtext }}>
              <span className="text-lg ml-1">−</span> تخفیف {discountType === TaxDiscountType.PERCENTAGE ? '%' : '(ثابت)'}
            </div>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={discountValue === '0' ? '' : discountValue}
              onChange={(e) => onDiscountValueChange(e.target.value.replace(/[^0-9۰-۹]/g, '') || '0')}
              placeholder="۰"
              className="w-full text-center text-lg font-bold bg-transparent outline-none"
              style={{ color: discountAmount > 0 ? THEME_COLORS.orange : THEME_COLORS.subtext }}
            />
          </div>

          {/* Tip Box */}
          <div
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: tipAmountValue > 0 ? `${THEME_COLORS.green}10` : THEME_COLORS.bgSecondary,
              border: `2px solid ${tipAmountValue > 0 ? THEME_COLORS.green : THEME_COLORS.border}`,
            }}
          >
            <div className="text-xs mb-1" style={{ color: tipAmountValue > 0 ? THEME_COLORS.green : THEME_COLORS.subtext }}>
              <span className="text-lg ml-1">+</span> انعام
            </div>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={tipAmount === '0' ? '' : tipAmount}
              onChange={(e) => onTipAmountChange(e.target.value.replace(/[^0-9۰-۹]/g, '') || '0')}
              placeholder="۰"
              className="w-full text-center text-lg font-bold bg-transparent outline-none"
              style={{ color: tipAmountValue > 0 ? THEME_COLORS.green : THEME_COLORS.subtext }}
            />
          </div>
        </div>

        {/* Row 2: Divisor and Result */}
        <div className="flex items-stretch gap-3">
          {/* Divisor Section - Compact */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{
              backgroundColor: divisor > 1 ? `${THEME_COLORS.purple}10` : THEME_COLORS.bgSecondary,
              border: `2px solid ${divisor > 1 ? THEME_COLORS.purple : THEME_COLORS.border}`,
            }}
          >
            <span className="text-2xl font-bold" style={{ color: THEME_COLORS.purple }}>÷</span>
            <div className="flex flex-col items-center">
              <div
                className="text-xl font-bold min-w-[30px] text-center"
                style={{ color: divisor > 1 ? THEME_COLORS.purple : THEME_COLORS.text, direction: 'ltr' }}
              >
                {divisor}
              </div>
              <span className="text-xs" style={{ color: THEME_COLORS.subtext }}>نفر</span>
            </div>
            {/* Divisor Controls */}
            <div className="flex flex-col gap-1">
              <button
                onClick={onIncrementDivisor}
                disabled={divisor >= 10}
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  backgroundColor: `${THEME_COLORS.purple}30`,
                  color: THEME_COLORS.purple,
                }}
              >
                +
              </button>
              <button
                onClick={onDecrementDivisor}
                disabled={divisor <= 1}
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  backgroundColor: `${THEME_COLORS.purple}30`,
                  color: THEME_COLORS.purple,
                }}
              >
                -
              </button>
            </div>
            {/* Quick divisor buttons */}
            <div className="flex flex-col gap-1">
              {[2, 3, 4].map((d) => (
                <button
                  key={d}
                  onClick={() => onDivisorChange(d)}
                  className="px-2 h-5 rounded text-xs font-bold transition-all"
                  style={{
                    backgroundColor: divisor === d ? THEME_COLORS.purple : THEME_COLORS.border,
                    color: divisor === d ? '#fff' : THEME_COLORS.text,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Equals and Result - Larger emphasis */}
          <div className="flex-1 flex items-center gap-3">
            <div
              className={`text-4xl font-bold cursor-pointer transition-all ${
                isAmountManuallyOverridden ? 'animate-pulse' : ''
              }`}
              style={{ color: isAmountManuallyOverridden ? THEME_COLORS.red : THEME_COLORS.green }}
              onClick={isAmountManuallyOverridden ? onSyncToFormula : undefined}
              title={isAmountManuallyOverridden ? 'کلیک برای همگام‌سازی با فرمول' : ''}
            >
              {isAmountManuallyOverridden ? '≠' : '='}
            </div>

            {/* Final Amount Input - Primary focus */}
            <div
              className="flex-1 rounded-xl p-3"
              style={{
                backgroundColor: isAmountManuallyOverridden ? `${THEME_COLORS.red}10` : `${THEME_COLORS.green}10`,
                border: `3px solid ${isAmountManuallyOverridden ? THEME_COLORS.red : THEME_COLORS.green}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs mb-1" style={{ color: THEME_COLORS.subtext }}>
                    مبلغ پرداخت
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9۰-۹]/g, ''))}
                    className="w-full text-2xl font-bold bg-transparent outline-none"
                    style={{ color: isAmountManuallyOverridden ? THEME_COLORS.red : THEME_COLORS.green }}
                    placeholder="۰"
                  />
                </div>
                {isAmountManuallyOverridden && (
                  <button
                    onClick={onSyncToFormula}
                    className="text-xs px-3 py-2 rounded-lg font-medium whitespace-nowrap"
                    style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                  >
                    بازگشت به فرمول
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Division Summary Info */}
      {divisor > 1 && (
        <div
          className="mt-3 px-4 py-2 rounded-xl text-center"
          style={{ backgroundColor: `${THEME_COLORS.purple}10`, color: THEME_COLORS.purple }}
        >
          <span className="text-sm font-medium">
            جمع کل: {formatPersianMoney(preDivisionAmount)} ÷ {divisor} نفر = {formatPersianMoney(finalAmount)} هر نفر
          </span>
        </div>
      )}
    </div>
  );
}
