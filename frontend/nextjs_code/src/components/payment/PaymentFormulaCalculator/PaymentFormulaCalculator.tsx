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

      {/* Formula Visualization - Two Rows Layout */}
      <div className="space-y-4">
        {/* Row 1: Main Items + Tax/Discount/Tip */}
        <div className="flex items-center justify-center gap-3">
          {/* Selected Items Total */}
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1" style={{ color: THEME_COLORS.subtext }}>
              مجموع اقلام
            </span>
            <div
              className="px-5 py-3 rounded-xl text-center min-w-[140px]"
              style={{
                backgroundColor: THEME_COLORS.bgSecondary,
                border: `2px solid ${THEME_COLORS.accent}`
              }}
            >
              <div className="text-xl font-bold" style={{ color: THEME_COLORS.accent }}>
                {formatPersianMoney(selectedTotal)}
              </div>
            </div>
          </div>

          {/* Plus Operator */}
          <div className="flex flex-col items-center justify-end" style={{ paddingTop: '20px' }}>
            <span className="text-3xl font-bold" style={{ color: THEME_COLORS.blue }}>+</span>
          </div>

          {/* Tax Box */}
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1" style={{ color: THEME_COLORS.blue }}>
              مالیات {taxEnabled ? `(${taxValue}%)` : ''}
            </span>
            <div
              className={`px-4 py-3 rounded-xl text-center min-w-[120px] cursor-pointer transition-all ${
                taxEnabled ? '' : 'opacity-50'
              }`}
              style={{
                backgroundColor: taxEnabled ? `${THEME_COLORS.blue}15` : THEME_COLORS.bgSecondary,
                border: `2px solid ${taxEnabled ? THEME_COLORS.blue : THEME_COLORS.border}`,
              }}
              onClick={onToggleTax}
            >
              <div
                className="text-lg font-bold"
                style={{ color: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.subtext }}
              >
                {taxEnabled ? formatPersianMoney(taxAmount) : '۰'}
              </div>
            </div>
            {/* Tax Controls */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={onDecrementTax}
                disabled={!taxEnabled}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  backgroundColor: taxEnabled ? `${THEME_COLORS.blue}30` : THEME_COLORS.border,
                  color: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.subtext,
                }}
              >
                -
              </button>
              <span className="text-xs px-2 font-medium" style={{ color: THEME_COLORS.blue }}>
                {taxValue}%
              </span>
              <button
                onClick={onIncrementTax}
                disabled={!taxEnabled}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  backgroundColor: taxEnabled ? `${THEME_COLORS.blue}30` : THEME_COLORS.border,
                  color: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.subtext,
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Minus Operator */}
          <div className="flex flex-col items-center justify-end" style={{ paddingTop: '20px' }}>
            <span className="text-3xl font-bold" style={{ color: THEME_COLORS.orange }}>-</span>
          </div>

          {/* Discount Box */}
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1" style={{ color: THEME_COLORS.orange }}>
              تخفیف {discountType === TaxDiscountType.PERCENTAGE ? '%' : 'ثابت'}
            </span>
            <div
              className="px-4 py-3 rounded-xl text-center min-w-[120px]"
              style={{
                backgroundColor: discountAmount > 0 ? `${THEME_COLORS.orange}15` : THEME_COLORS.bgSecondary,
                border: `2px solid ${discountAmount > 0 ? THEME_COLORS.orange : THEME_COLORS.border}`,
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                value={discountValue === '0' ? '' : discountValue}
                onChange={(e) => onDiscountValueChange(e.target.value.replace(/[^0-9۰-۹]/g, '') || '0')}
                placeholder="۰"
                className="w-full text-center text-lg font-bold bg-transparent outline-none"
                style={{ color: discountAmount > 0 ? THEME_COLORS.orange : THEME_COLORS.subtext }}
              />
            </div>
          </div>

          {/* Plus Operator */}
          <div className="flex flex-col items-center justify-end" style={{ paddingTop: '20px' }}>
            <span className="text-3xl font-bold" style={{ color: THEME_COLORS.green }}>+</span>
          </div>

          {/* Tip Box */}
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1" style={{ color: THEME_COLORS.green }}>
              انعام
            </span>
            <div
              className="px-4 py-3 rounded-xl text-center min-w-[120px]"
              style={{
                backgroundColor: tipAmountValue > 0 ? `${THEME_COLORS.green}15` : THEME_COLORS.bgSecondary,
                border: `2px solid ${tipAmountValue > 0 ? THEME_COLORS.green : THEME_COLORS.border}`,
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                value={tipAmount === '0' ? '' : tipAmount}
                onChange={(e) => onTipAmountChange(e.target.value.replace(/[^0-9۰-۹]/g, '') || '0')}
                placeholder="۰"
                className="w-full text-center text-lg font-bold bg-transparent outline-none"
                style={{ color: tipAmountValue > 0 ? THEME_COLORS.green : THEME_COLORS.subtext }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Divisor */}
        <div className="flex items-center justify-center gap-4">
          {/* Divisor Section */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold" style={{ color: THEME_COLORS.purple }}>÷</span>
            <div className="flex flex-col items-center">
              <div
                className="px-5 py-3 rounded-xl text-center min-w-[80px]"
                style={{
                  backgroundColor: divisor > 1 ? `${THEME_COLORS.purple}15` : THEME_COLORS.bgSecondary,
                  border: `2px solid ${divisor > 1 ? THEME_COLORS.purple : THEME_COLORS.border}`,
                }}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ color: divisor > 1 ? THEME_COLORS.purple : THEME_COLORS.text }}
                >
                  {divisor}
                </div>
              </div>
              {/* Divisor Controls */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={onDecrementDivisor}
                  disabled={divisor <= 1}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={{
                    backgroundColor: divisor > 1 ? `${THEME_COLORS.purple}30` : THEME_COLORS.border,
                    color: divisor > 1 ? THEME_COLORS.purple : THEME_COLORS.subtext,
                  }}
                >
                  -
                </button>
                <button
                  onClick={() => onDivisorChange(2)}
                  className="px-3 h-7 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: divisor === 2 ? THEME_COLORS.purple : THEME_COLORS.border,
                    color: divisor === 2 ? '#fff' : THEME_COLORS.text,
                  }}
                >
                  ۲
                </button>
                <button
                  onClick={onIncrementDivisor}
                  disabled={divisor >= 10}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={{
                    backgroundColor: `${THEME_COLORS.purple}30`,
                    color: THEME_COLORS.purple,
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed my-2" style={{ borderColor: THEME_COLORS.border }} />

        {/* Row 3: Result */}
        <div className="flex items-center justify-center gap-4">
          {/* Equals Sign */}
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

          {/* Final Amount Input */}
          <div className="flex flex-col items-center">
            <div
              className="px-6 py-4 rounded-xl text-center min-w-[180px]"
              style={{
                backgroundColor: isAmountManuallyOverridden ? `${THEME_COLORS.red}10` : `${THEME_COLORS.green}10`,
                border: `3px solid ${isAmountManuallyOverridden ? THEME_COLORS.red : THEME_COLORS.green}`,
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9۰-۹]/g, ''))}
                className="w-full text-center text-3xl font-bold bg-transparent outline-none"
                style={{ color: isAmountManuallyOverridden ? THEME_COLORS.red : THEME_COLORS.green }}
                placeholder="۰"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                مبلغ پرداخت
              </span>
              {isAmountManuallyOverridden && (
                <button
                  onClick={onSyncToFormula}
                  className="text-xs px-3 py-1 rounded-lg font-medium"
                  style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                >
                  بازگشت به فرمول
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Division Summary Info */}
      {divisor > 1 && (
        <div
          className="mt-4 px-4 py-3 rounded-xl text-center"
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
