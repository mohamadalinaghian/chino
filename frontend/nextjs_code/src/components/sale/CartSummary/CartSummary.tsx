'use client';

import { ICartItem } from '@/types/sale';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';
import { formatPersianMoney, toPersianDigits } from '@/utils/persianUtils';

interface CartSummaryProps {
  cartItems: ICartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onProceedToPayment: () => void;
  onSaveAsOpen: () => void;
  printOrder: boolean;
  onPrintOrderChange: (value: boolean) => void;
}

export function CartSummary({
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onProceedToPayment,
  onSaveAsOpen,
  printOrder,
  onPrintOrderChange,
}: CartSummaryProps) {
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discount = 0; // TODO: Implement discount logic
  const tax = 0; // TODO: Implement tax calculation
  const total = subtotal - discount + tax;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div
        className="w-full h-full rounded-lg p-8 flex flex-col items-center justify-center"
        style={{ backgroundColor: THEME_COLORS.bgSecondary }}
      >
        <div className="text-6xl mb-4">🛒</div>
        <p
          className="text-lg font-medium text-center"
          style={{ color: THEME_COLORS.subtext }}
        >
          سبد خرید خالی است
        </p>
        <p
          className="text-sm mt-2 text-center"
          style={{ color: THEME_COLORS.subtext }}
        >
          موارد مورد نظر را از منو انتخاب کنید
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full rounded-lg p-6 flex flex-col"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      {/* Header */}
      <div className="mb-4 pb-4 border-b" style={{ borderColor: THEME_COLORS.border }}>
        <h2
          className="text-xl font-bold"
          style={{ color: THEME_COLORS.text }}
        >
          سبد خرید
        </h2>
        <p className="text-sm mt-1" style={{ color: THEME_COLORS.subtext }}>
          {toPersianDigits(itemCount)} مورد
        </p>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: THEME_COLORS.bgPrimary,
              borderColor: THEME_COLORS.border,
            }}
          >
            {/* Item Header */}
            <div className="flex justify-between items-start mb-2">
              <h3
                className="font-bold text-sm flex-1"
                style={{ color: THEME_COLORS.text }}
              >
                {item.name}
              </h3>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="mr-2 text-lg hover:scale-110 transition-transform"
                style={{ color: THEME_COLORS.red }}
                title="حذف"
              >
                ✕
              </button>
            </div>

            {/* Extras */}
            {item.extras.length > 0 && (
              <div className="mb-2 pr-2 space-y-1">
                {item.extras.map((extra) => (
                  <div
                    key={extra.id}
                    className="text-xs flex justify-between"
                    style={{ color: THEME_COLORS.subtext }}
                  >
                    <span>+ {extra.name} (×{toPersianDigits(extra.quantity)})</span>
                    <span>{formatPersianMoney(extra.price * extra.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity and Price */}
            <div className="flex justify-between items-center">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-md flex items-center justify-center font-bold transition-all hover:scale-110"
                  style={{
                    backgroundColor: THEME_COLORS.surface,
                    color: THEME_COLORS.text,
                  }}
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span
                  className="w-8 text-center font-bold"
                  style={{ color: THEME_COLORS.text }}
                >
                  {toPersianDigits(item.quantity)}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-md flex items-center justify-center font-bold transition-all hover:scale-110"
                  style={{
                    backgroundColor: THEME_COLORS.accent,
                    color: THEME_COLORS.bgSecondary,
                  }}
                >
                  +
                </button>
              </div>

              {/* Total Price */}
              <div
                className="text-sm font-bold"
                style={{ color: THEME_COLORS.green }}
              >
                {formatPersianMoney(item.total)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div
        className="space-y-2 pt-4 mb-4 border-t"
        style={{ borderColor: THEME_COLORS.border }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: THEME_COLORS.subtext }}>جمع جزء:</span>
          <span style={{ color: THEME_COLORS.text }}>
            {formatPersianMoney(subtotal)}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: THEME_COLORS.subtext }}>تخفیف:</span>
            <span style={{ color: THEME_COLORS.red }}>
              -{formatPersianMoney(discount)}
            </span>
          </div>
        )}

        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: THEME_COLORS.subtext }}>مالیات:</span>
            <span style={{ color: THEME_COLORS.text }}>
              {formatPersianMoney(tax)}
            </span>
          </div>
        )}

        <div
          className="flex justify-between text-lg font-bold pt-2 border-t"
          style={{ borderColor: THEME_COLORS.border }}
        >
          <span style={{ color: THEME_COLORS.text }}>جمع کل:</span>
          <span style={{ color: THEME_COLORS.green }}>
            {formatPersianMoney(total)}
          </span>
        </div>
      </div>

      {/* Print Option */}
      <div
        className="mb-3 p-3 rounded-lg border"
        style={{
          backgroundColor: THEME_COLORS.bgPrimary,
          borderColor: THEME_COLORS.border,
        }}
      >
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖨️</span>
            <div>
              <span className="font-bold text-sm block" style={{ color: THEME_COLORS.text }}>
                چاپ سفارش
              </span>
              <span className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                {printOrder ? 'سفارش چاپ می‌شود' : 'ایجاد بدون چاپ (Silent)'}
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => onPrintOrderChange(!printOrder)}
            className={`relative w-12 h-6 rounded-full transition-all ${
              printOrder ? 'ring-2' : ''
            }`}
            style={{
              backgroundColor: printOrder ? THEME_COLORS.green : THEME_COLORS.surface,
              ringColor: printOrder ? THEME_COLORS.green : 'transparent',
            }}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                printOrder ? 'left-0.5' : 'right-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onProceedToPayment}
          className="w-full py-1.5 rounded-lg font-bold transition-all hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: THEME_COLORS.accent,
            color: '#fff',
          }}
        >
          {UI_TEXT.BTN_IMMEDIATE_PAY}
        </button>
        <button
          onClick={onSaveAsOpen}
          className="w-full py-1.5 rounded-lg font-bold transition-all hover:opacity-90 active:scale-95 border-2"
          style={{
            backgroundColor: 'transparent',
            borderColor: THEME_COLORS.accent,
            color: THEME_COLORS.accent,
          }}
        >
          {UI_TEXT.BTN_SAVE_OPEN_SALE}
        </button>
      </div>
    </div>
  );
}
