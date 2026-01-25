'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { TaxDiscountType } from '@/types/sale';

interface PaymentTaxDiscountProps {
  showTaxDiscount: boolean;
  onToggleShow: () => void;
  taxType: TaxDiscountType;
  taxValue: string;
  discountType: TaxDiscountType;
  discountValue: string;
  tipAmount: string;
  onTaxTypeChange: (type: TaxDiscountType) => void;
  onTaxValueChange: (value: string) => void;
  onDiscountTypeChange: (type: TaxDiscountType) => void;
  onDiscountValueChange: (value: string) => void;
  onTipAmountChange: (value: string) => void;
  // Calculated values for summary
  selectedTotal: number;
  taxAmount: number;
  discountAmount: number;
  tipAmountValue: number;
  finalAmount: number;
}

export function PaymentTaxDiscount({
  showTaxDiscount,
  onToggleShow,
  taxType,
  taxValue,
  discountType,
  discountValue,
  tipAmount,
  onTaxTypeChange,
  onTaxValueChange,
  onDiscountTypeChange,
  onDiscountValueChange,
  onTipAmountChange,
  selectedTotal,
  taxAmount,
  discountAmount,
  tipAmountValue,
  finalAmount,
}: PaymentTaxDiscountProps) {
  return (
    <div>
      <button
        onClick={onToggleShow}
        className="w-full flex items-center justify-between py-2 px-3 rounded"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        <span className="font-bold" style={{ color: THEME_COLORS.text }}>
          مالیات / تخفیف / انعام
        </span>
        <span style={{ color: THEME_COLORS.accent }}>
          {showTaxDiscount ? '▼' : '◀'}
        </span>
      </button>

      {showTaxDiscount && (
        <div className="mt-2 space-y-3 p-3 rounded" style={{ backgroundColor: THEME_COLORS.surface }}>
          {/* Tax */}
          <div>
            <div className="text-sm font-bold mb-1" style={{ color: THEME_COLORS.blue }}>
              مالیات
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onTaxTypeChange(TaxDiscountType.FIXED)}
                className="flex-1 py-1 rounded text-sm"
                style={{
                  backgroundColor: taxType === TaxDiscountType.FIXED ? THEME_COLORS.blue : 'transparent',
                  color: taxType === TaxDiscountType.FIXED ? '#fff' : THEME_COLORS.text,
                  border: `1px solid ${THEME_COLORS.blue}`,
                }}
              >
                ثابت
              </button>
              <button
                onClick={() => onTaxTypeChange(TaxDiscountType.PERCENTAGE)}
                className="flex-1 py-1 rounded text-sm"
                style={{
                  backgroundColor: taxType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.blue : 'transparent',
                  color: taxType === TaxDiscountType.PERCENTAGE ? '#fff' : THEME_COLORS.text,
                  border: `1px solid ${THEME_COLORS.blue}`,
                }}
              >
                درصد
              </button>
              <input
                type="number"
                value={taxValue}
                onChange={(e) => onTaxValueChange(e.target.value)}
                className="flex-1 px-2 py-1 rounded border text-center"
                style={{
                  backgroundColor: THEME_COLORS.bgSecondary,
                  borderColor: THEME_COLORS.blue,
                  color: THEME_COLORS.text,
                }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Discount */}
          <div>
            <div className="text-sm font-bold mb-1" style={{ color: THEME_COLORS.orange }}>
              تخفیف
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onDiscountTypeChange(TaxDiscountType.FIXED)}
                className="flex-1 py-1 rounded text-sm"
                style={{
                  backgroundColor: discountType === TaxDiscountType.FIXED ? THEME_COLORS.orange : 'transparent',
                  color: discountType === TaxDiscountType.FIXED ? '#fff' : THEME_COLORS.text,
                  border: `1px solid ${THEME_COLORS.orange}`,
                }}
              >
                ثابت
              </button>
              <button
                onClick={() => onDiscountTypeChange(TaxDiscountType.PERCENTAGE)}
                className="flex-1 py-1 rounded text-sm"
                style={{
                  backgroundColor: discountType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.orange : 'transparent',
                  color: discountType === TaxDiscountType.PERCENTAGE ? '#fff' : THEME_COLORS.text,
                  border: `1px solid ${THEME_COLORS.orange}`,
                }}
              >
                درصد
              </button>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => onDiscountValueChange(e.target.value)}
                className="flex-1 px-2 py-1 rounded border text-center"
                style={{
                  backgroundColor: THEME_COLORS.bgSecondary,
                  borderColor: THEME_COLORS.orange,
                  color: THEME_COLORS.text,
                }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Tip */}
          <div>
            <div className="text-sm font-bold mb-1" style={{ color: THEME_COLORS.text }}>
              انعام
            </div>
            <input
              type="number"
              value={tipAmount}
              onChange={(e) => onTipAmountChange(e.target.value)}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: THEME_COLORS.bgSecondary,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text,
              }}
              placeholder="0"
            />
          </div>

          {/* Summary */}
          <div className="pt-2 border-t space-y-1" style={{ borderColor: THEME_COLORS.border }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: THEME_COLORS.subtext }}>انتخاب شده:</span>
              <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(selectedTotal)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: THEME_COLORS.subtext }}>مالیات:</span>
                <span style={{ color: THEME_COLORS.text }}>+{formatPersianMoney(taxAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: THEME_COLORS.subtext }}>تخفیف:</span>
                <span style={{ color: THEME_COLORS.red }}>-{formatPersianMoney(discountAmount)}</span>
              </div>
            )}
            {tipAmountValue > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: THEME_COLORS.subtext }}>انعام:</span>
                <span style={{ color: THEME_COLORS.text }}>+{formatPersianMoney(tipAmountValue)}</span>
              </div>
            )}
            <div
              className="flex justify-between text-base font-bold pt-1 border-t"
              style={{ borderColor: THEME_COLORS.border }}
            >
              <span style={{ color: THEME_COLORS.text }}>جمع:</span>
              <span style={{ color: THEME_COLORS.accent }}>{formatPersianMoney(finalAmount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
