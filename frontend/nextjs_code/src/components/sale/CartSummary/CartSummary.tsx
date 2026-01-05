'use client';
import { forwardRef } from 'react'; // ← ADD THIS
import { ICartItem } from '@/types/sale';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';
import { formatPersianMoney, toPersianDigits } from '@/utils/persianUtils';

interface CartSummaryProps {
  cartItems: ICartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onEditExtras?: (item: ICartItem) => void;

  // New button structure
  onSaveSilent: () => void; // Save without print
  onSaveAndPrintAll: () => void; // Save and print everything
  onSaveAndPrintChanges?: () => void; // Save and print only changes (edit mode only)
  onSaveAndPay?: () => void; // Save and go to payment (new sale mode only)
  onCancel: () => void; // Cancel button

  isEditMode?: boolean; // To show/hide print changes button
  isSubmitting?: boolean; // Loading state
}

// ← CHANGE: Use forwardRef to expose a ref to the parent
export const CartSummary = forwardRef<HTMLDivElement, CartSummaryProps>(function CartSummary(
  {
    cartItems,
    onRemoveItem,
    onUpdateQuantity,
    onEditExtras,
    onSaveSilent,
    onSaveAndPrintAll,
    onSaveAndPrintChanges,
    onSaveAndPay,
    onCancel,
    isEditMode = false,
    isSubmitting = false,
  },
  ref // ← This ref will point to the main container
) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discount = 0;
  const tax = 0;
  const total = subtotal - discount + tax;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div
        ref={ref}
        className="w-full h-full rounded-lg p-8 flex flex-col items-center justify-center"
        style={{ backgroundColor: THEME_COLORS.bgSecondary }}
      >
        <div className="text-8xl mb-6 opacity-80">🛒</div>
        <p className="text-xl font-semibold text-center" style={{ color: THEME_COLORS.subtext }}>
          سبد خرید خالی است
        </p>
        <p className="text-sm mt-3 text-center opacity-75" style={{ color: THEME_COLORS.subtext }}>
          موارد مورد نظر را از منو انتخاب کنید
        </p>
      </div>
    );
  }

  return (
    <div
      ref={ref} // ← This is the key: allows parent to scroll to this component
      className="w-full h-full rounded-lg p-6 flex flex-col"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      {/* Rest of your code remains 100% unchanged */}
      <div className="mb-4 pb-4 border-b" style={{ borderColor: THEME_COLORS.border }}>
        <h2 className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
          سبد خرید
        </h2>
        <p className="text-sm mt-1" style={{ color: THEME_COLORS.subtext }}>
          {toPersianDigits(itemCount)} مورد
        </p>
      </div>

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
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm flex-1" style={{ color: THEME_COLORS.text }}>
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

            <button
              onClick={() => onEditExtras?.(item)}
              className="text-xs font-medium underline hover:no-underline transition-all"
              style={{ color: THEME_COLORS.accent }}
            >
              ویرایش اضافات
            </button>
            <div className="flex justify-between items-center">
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
                <span className="w-8 text-center font-bold" style={{ color: THEME_COLORS.text }}>
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
              <div className="text-sm font-bold" style={{ color: THEME_COLORS.green }}>
                {formatPersianMoney(item.total)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-4 mb-4 border-t" style={{ borderColor: THEME_COLORS.border }}>
        <div className="flex justify-between text-sm" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
          <span style={{ color: THEME_COLORS.subtext }}>جمع جزء:</span>
          <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
            <span style={{ color: THEME_COLORS.subtext }}>تخفیف:</span>
            <span style={{ color: THEME_COLORS.red }}>-{formatPersianMoney(discount)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-sm" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
            <span style={{ color: THEME_COLORS.subtext }}>مالیات:</span>
            <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(tax)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: THEME_COLORS.border }}>
          <span style={{ color: THEME_COLORS.text }}>جمع کل:</span>
          <span style={{ color: THEME_COLORS.green }}>{formatPersianMoney(total)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Save Silent Button */}
        <button
          onClick={onSaveSilent}
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg font-bold transition-all hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: isSubmitting ? THEME_COLORS.surface : THEME_COLORS.accent,
            color: '#fff',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'در حال ذخیره...' : '💾 ذخیره'}
        </button>

        {/* Save and Print Changes (Edit Mode Only) */}
        {isEditMode && onSaveAndPrintChanges && (
          <button
            onClick={onSaveAndPrintChanges}
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg font-bold transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: isSubmitting ? THEME_COLORS.surface : THEME_COLORS.accent,
              color: '#fff',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? 'در حال ذخیره و چاپ...' : '🖨️ ذخیره و چاپ تغییرات'}
          </button>
        )}

        {/* Save and Print All */}
        <button
          onClick={onSaveAndPrintAll}
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg font-bold transition-all hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: isSubmitting ? THEME_COLORS.surface : THEME_COLORS.green,
            color: '#fff',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'در حال ذخیره و چاپ...' : '🖨️ ذخیره و چاپ همه'}
        </button>

        {/* Save and Go to Payment (New Sale Mode Only) */}
        {!isEditMode && onSaveAndPay && (
          <button
            onClick={onSaveAndPay}
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg font-bold transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: isSubmitting ? THEME_COLORS.surface : THEME_COLORS.blue,
              color: '#fff',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? 'در حال ذخیره...' : '💳 ذخیره و پرداخت'}
          </button>
        )}

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg font-bold transition-all hover:opacity-90 active:scale-95 border-2"
          style={{
            backgroundColor: 'transparent',
            borderColor: THEME_COLORS.red,
            color: THEME_COLORS.red,
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          ✕ لغو
        </button>
      </div>
    </div>
  );
});
