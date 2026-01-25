'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { TaxDiscountType } from '@/types/sale';

interface Props {
  showTaxDiscount: boolean;
  onToggleShow: () => void;
  taxType: TaxDiscountType;
  taxValue: string;
  taxEnabled: boolean;
  onToggleTax: () => void;
  discountType: TaxDiscountType;
  discountValue: string;
  tipAmount: string;
  onTaxTypeChange: (t: TaxDiscountType) => void;
  onTaxValueChange: (v: string) => void;
  onDiscountTypeChange: (t: TaxDiscountType) => void;
  onDiscountValueChange: (v: string) => void;
  onTipAmountChange: (v: string) => void;
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
  taxEnabled,
  onToggleTax,
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
}: Props) {
  return (
    <div className="rounded-lg overflow-hidden">
      {/* Quick 10% Tax Toggle Button - Always visible */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={onToggleTax}
          className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all"
          style={{
            backgroundColor: taxEnabled ? THEME_COLORS.blue : THEME_COLORS.surface,
            color: taxEnabled ? '#fff' : THEME_COLORS.text,
            border: `2px solid ${taxEnabled ? THEME_COLORS.blue : THEME_COLORS.border}`,
          }}
        >
          {taxEnabled ? '✓ مالیات ۱۰٪ فعال' : 'مالیات ۱۰٪ غیرفعال'}
        </button>
      </div>

      <button
        onClick={onToggleShow}
        className="w-full flex items-center justify-between px-3 py-2.5 font-medium"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        <span style={{ color: THEME_COLORS.text }}>مالیات / تخفیف / انعام</span>
        <span style={{ color: THEME_COLORS.accent, fontSize: '1.1rem' }}>
          {showTaxDiscount ? '▼' : '►'}
        </span>
      </button>

      {/* Always-visible mini summary */}
      <div
        className="px-3 py-2 text-sm border-t grid grid-cols-4 gap-2"
        style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.border }}
      >
        <div>
          <div style={{ color: THEME_COLORS.subtext }}>انتخابی</div>
          <div className="font-medium">{formatPersianMoney(selectedTotal)}</div>
        </div>
        <div>
          <div style={{ color: THEME_COLORS.subtext }}>مالیات</div>
          <div style={{ color: taxAmount > 0 ? THEME_COLORS.blue : THEME_COLORS.subtext }}>
            {taxAmount > 0 ? `+${formatPersianMoney(taxAmount)}` : '—'}
          </div>
        </div>
        <div>
          <div style={{ color: THEME_COLORS.subtext }}>تخفیف</div>
          <div style={{ color: discountAmount > 0 ? THEME_COLORS.red : THEME_COLORS.subtext }}>
            {discountAmount > 0 ? `-${formatPersianMoney(discountAmount)}` : '—'}
          </div>
        </div>
        <div className="text-right">
          <div style={{ color: THEME_COLORS.subtext }}>جمع نهایی</div>
          <div className="font-bold" style={{ color: THEME_COLORS.accent }}>
            {formatPersianMoney(finalAmount)}
          </div>
        </div>
      </div>

      {showTaxDiscount && (
        <div className="p-3 space-y-3 bg-opacity-70" style={{ backgroundColor: THEME_COLORS.surface }}>
          {/* Tax */}
          <div className="space-y-1.5">
            <div className="text-sm font-medium" style={{ color: THEME_COLORS.blue }}>
              مالیات {taxEnabled ? '(فعال)' : '(غیرفعال)'}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => onTaxTypeChange(TaxDiscountType.FIXED)}
                className="px-3 py-1 text-sm rounded border flex-1"
                style={{
                  borderColor: THEME_COLORS.blue,
                  backgroundColor: taxType === TaxDiscountType.FIXED ? THEME_COLORS.blue : 'transparent',
                  color: taxType === TaxDiscountType.FIXED ? 'white' : THEME_COLORS.text,
                  opacity: taxEnabled ? 1 : 0.5,
                }}
                disabled={!taxEnabled}
              >
                ثابت
              </button>
              <button
                onClick={() => onTaxTypeChange(TaxDiscountType.PERCENTAGE)}
                className="px-3 py-1 text-sm rounded border flex-1"
                style={{
                  borderColor: THEME_COLORS.blue,
                  backgroundColor: taxType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.blue : 'transparent',
                  color: taxType === TaxDiscountType.PERCENTAGE ? 'white' : THEME_COLORS.text,
                  opacity: taxEnabled ? 1 : 0.5,
                }}
                disabled={!taxEnabled}
              >
                درصد
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={taxValue}
                onChange={(e) => onTaxValueChange(e.target.value.replace(/[^0-9۰-۹.]/g, ''))}
                className="w-20 px-2 py-1.5 text-center rounded border"
                style={{
                  borderColor: THEME_COLORS.blue,
                  opacity: taxEnabled ? 1 : 0.5,
                }}
                placeholder="0"
                disabled={!taxEnabled}
              />
            </div>
          </div>

          {/* Discount */}
          <div className="space-y-1.5">
            <div className="text-sm font-medium" style={{ color: THEME_COLORS.orange }}>
              تخفیف
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => onDiscountTypeChange(TaxDiscountType.FIXED)}
                className="px-3 py-1 text-sm rounded border flex-1"
                style={{
                  borderColor: THEME_COLORS.orange,
                  backgroundColor: discountType === TaxDiscountType.FIXED ? THEME_COLORS.orange : 'transparent',
                  color: discountType === TaxDiscountType.FIXED ? 'white' : THEME_COLORS.text,
                }}
              >
                ثابت
              </button>
              <button
                onClick={() => onDiscountTypeChange(TaxDiscountType.PERCENTAGE)}
                className="px-3 py-1 text-sm rounded border flex-1"
                style={{
                  borderColor: THEME_COLORS.orange,
                  backgroundColor: discountType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.orange : 'transparent',
                  color: discountType === TaxDiscountType.PERCENTAGE ? 'white' : THEME_COLORS.text,
                }}
              >
                درصد
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={discountValue}
                onChange={(e) => onDiscountValueChange(e.target.value.replace(/[^0-9۰-۹.]/g, ''))}
                className="w-20 px-2 py-1.5 text-center rounded border"
                style={{ borderColor: THEME_COLORS.orange }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Tip */}
          <div className="space-y-1.5">
            <div className="text-sm font-medium" style={{ color: THEME_COLORS.text }}>
              انعام
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={tipAmount}
              onChange={(e) => onTipAmountChange(e.target.value.replace(/[^0-9۰-۹.]/g, ''))}
              className="w-full px-3 py-2 rounded border"
              style={{ borderColor: THEME_COLORS.border }}
              placeholder="مبلغ انعام"
            />
          </div>
        </div>
      )}
    </div>
  );
}
