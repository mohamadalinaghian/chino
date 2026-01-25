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
  taxType,
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
  onTaxValueChange,
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
      className="rounded-xl p-4"
      style={{ backgroundColor: THEME_COLORS.surface }}
    >
      {/* Formula Row - Visual Math Expression */}
      <div className="flex items-center justify-center gap-1 flex-wrap mb-4">
        {/* Opening bracket for numerator */}
        <span className="text-3xl font-light" style={{ color: THEME_COLORS.subtext }}>
          (
        </span>

        {/* Selected Total Box */}
        <div className="flex flex-col items-center">
          <div
            className="px-3 py-2 rounded-lg min-w-[80px] text-center"
            style={{ backgroundColor: THEME_COLORS.bgSecondary, border: `2px solid ${THEME_COLORS.accent}` }}
          >
            <div className="text-lg font-bold" style={{ color: THEME_COLORS.accent }}>
              {formatPersianMoney(selectedTotal)}
            </div>
          </div>
          <span className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
            اقلام
          </span>
        </div>

        {/* Plus operator */}
        <span className="text-2xl font-bold mx-1" style={{ color: THEME_COLORS.blue }}>
          +
        </span>

        {/* Tax Box with controls */}
        <div className="flex flex-col items-center">
          <div
            className={`px-3 py-2 rounded-lg min-w-[80px] text-center cursor-pointer transition-all ${
              taxEnabled ? '' : 'opacity-50'
            }`}
            style={{
              backgroundColor: taxEnabled ? `${THEME_COLORS.blue}20` : THEME_COLORS.bgSecondary,
              border: `2px solid ${taxEnabled ? THEME_COLORS.blue : THEME_COLORS.border}`,
            }}
            onClick={onToggleTax}
          >
            <div className="text-lg font-bold" style={{ color: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.subtext }}>
              {taxEnabled ? formatPersianMoney(taxAmount) : '۰'}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={onDecrementTax}
              disabled={!taxEnabled}
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                backgroundColor: taxEnabled ? `${THEME_COLORS.blue}30` : THEME_COLORS.border,
                color: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.subtext,
              }}
            >
              -
            </button>
            <span className="text-xs px-1" style={{ color: THEME_COLORS.subtext }}>
              {taxValue}%
            </span>
            <button
              onClick={onIncrementTax}
              disabled={!taxEnabled}
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                backgroundColor: taxEnabled ? `${THEME_COLORS.blue}30` : THEME_COLORS.border,
                color: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.subtext,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Minus operator */}
        <span className="text-2xl font-bold mx-1" style={{ color: THEME_COLORS.orange }}>
          -
        </span>

        {/* Discount Box */}
        <div className="flex flex-col items-center">
          <div
            className="px-3 py-2 rounded-lg min-w-[80px] text-center"
            style={{
              backgroundColor: discountAmount > 0 ? `${THEME_COLORS.orange}20` : THEME_COLORS.bgSecondary,
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
          <span className="text-xs mt-1" style={{ color: THEME_COLORS.orange }}>
            تخفیف {discountType === TaxDiscountType.PERCENTAGE ? '%' : ''}
          </span>
        </div>

        {/* Plus operator */}
        <span className="text-2xl font-bold mx-1" style={{ color: THEME_COLORS.green }}>
          +
        </span>

        {/* Tip Box */}
        <div className="flex flex-col items-center">
          <div
            className="px-3 py-2 rounded-lg min-w-[80px] text-center"
            style={{
              backgroundColor: tipAmountValue > 0 ? `${THEME_COLORS.green}20` : THEME_COLORS.bgSecondary,
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
          <span className="text-xs mt-1" style={{ color: THEME_COLORS.green }}>
            انعام
          </span>
        </div>

        {/* Closing bracket */}
        <span className="text-3xl font-light" style={{ color: THEME_COLORS.subtext }}>
          )
        </span>

        {/* Division operator */}
        <span className="text-2xl font-bold mx-2" style={{ color: THEME_COLORS.purple }}>
          ÷
        </span>

        {/* Divisor Box */}
        <div className="flex flex-col items-center">
          <div
            className="px-3 py-2 rounded-lg min-w-[60px] text-center"
            style={{
              backgroundColor: divisor > 1 ? `${THEME_COLORS.purple}20` : THEME_COLORS.bgSecondary,
              border: `2px solid ${divisor > 1 ? THEME_COLORS.purple : THEME_COLORS.border}`,
            }}
          >
            <div className="text-xl font-bold" style={{ color: divisor > 1 ? THEME_COLORS.purple : THEME_COLORS.text }}>
              {divisor}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={onDecrementDivisor}
              disabled={divisor <= 1}
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                backgroundColor: divisor > 1 ? `${THEME_COLORS.purple}30` : THEME_COLORS.border,
                color: divisor > 1 ? THEME_COLORS.purple : THEME_COLORS.subtext,
              }}
            >
              -
            </button>
            <button
              onClick={() => onDivisorChange(2)}
              className="px-2 h-6 rounded text-xs font-medium"
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
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all"
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

      {/* Equals / Not Equals and Result */}
      <div className="flex items-center justify-center gap-3 pt-3 border-t" style={{ borderColor: THEME_COLORS.border }}>
        {/* Equals sign (or not equals if manually overridden) */}
        <div
          className={`text-3xl font-bold cursor-pointer transition-all ${
            isAmountManuallyOverridden ? 'animate-pulse' : ''
          }`}
          style={{ color: isAmountManuallyOverridden ? THEME_COLORS.red : THEME_COLORS.green }}
          onClick={isAmountManuallyOverridden ? onSyncToFormula : undefined}
          title={isAmountManuallyOverridden ? 'کلیک برای همگام‌سازی با فرمول' : ''}
        >
          {isAmountManuallyOverridden ? '≠' : '='}
        </div>

        {/* Final Amount Input */}
        <div className="flex flex-col items-center flex-1 max-w-[200px]">
          <div
            className="w-full px-4 py-3 rounded-xl text-center relative"
            style={{
              backgroundColor: isAmountManuallyOverridden ? `${THEME_COLORS.red}15` : `${THEME_COLORS.green}15`,
              border: `3px solid ${isAmountManuallyOverridden ? THEME_COLORS.red : THEME_COLORS.green}`,
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9۰-۹]/g, ''))}
              className="w-full text-center text-2xl font-bold bg-transparent outline-none"
              style={{ color: isAmountManuallyOverridden ? THEME_COLORS.red : THEME_COLORS.green }}
              placeholder="۰"
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: THEME_COLORS.subtext }}>
              مبلغ پرداخت
            </span>
            {isAmountManuallyOverridden && (
              <button
                onClick={onSyncToFormula}
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
              >
                بازگشت به فرمول
              </button>
            )}
          </div>
        </div>

        {/* Calculated result display (when not manually overridden) */}
        {!isAmountManuallyOverridden && (
          <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
            {formatPersianMoney(finalAmount)}
          </div>
        )}
      </div>

      {/* Quick info bar */}
      {divisor > 1 && (
        <div
          className="mt-3 px-3 py-2 rounded-lg text-center text-sm"
          style={{ backgroundColor: `${THEME_COLORS.purple}15`, color: THEME_COLORS.purple }}
        >
          جمع کل: {formatPersianMoney(preDivisionAmount)} ÷ {divisor} نفر = {formatPersianMoney(finalAmount)} هر نفر
        </div>
      )}
    </div>
  );
}
