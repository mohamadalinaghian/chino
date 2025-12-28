/**
 * Cart Sidebar Component (Updated with Persian Money + Mobile UX)
 *
 * Features:
 * - Persian money formatting
 * - Mobile-optimized layout
 * - Larger tap targets
 * - Better visual hierarchy
 * - Improved mobile modal
 */

'use client';

import { UseCartReturn } from '@/hooks/useCart';
import { CartItem } from './CartItem';
import { formatPersianMoney } from '@/libs/tools/persianMoney';

interface Props {
  cart: UseCartReturn;
  note: string;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
  onClose?: () => void;
}

export function CartSidebar({
  cart,
  note,
  onNoteChange,
  onSubmit,
  submitting,
  submitError,
  onClose,
}: Props) {
  const hasItems = cart.items.length > 0;
  const formattedTotal = formatPersianMoney(cart.totalAmount);

  return (
    <div
      className="
        lg:w-96 lg:border-r lg:border-gray-800
        bg-gray-850
        flex flex-col
        max-h-screen

        fixed lg:relative
        inset-0 lg:inset-auto
        z-50 lg:z-auto
      "
    >
      {/* Header - Fixed */}
      <div className="p-4 border-b border-gray-800 bg-gray-850">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <span>🛒</span>
            <span>سبد خرید</span>
            {cart.itemCount > 0 && (
              <span className="text-sm font-normal text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
                {cart.itemCount}
              </span>
            )}
          </h2>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="
                lg:hidden
                w-10 h-10
                flex items-center justify-center
                text-gray-400 hover:text-gray-200
                text-2xl
                rounded-lg
                hover:bg-gray-700
                transition-colors
              "
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {hasItems ? (
          <div className="space-y-3">
            {cart.items.map((item) => (
              <CartItem
                key={item.menu_id}
                item={item}
                onUpdateQuantity={(qty) =>
                  cart.updateQuantity(item.menu_id, qty)
                }
                onRemove={() => cart.removeItem(item.menu_id)}
                onAddExtra={cart.addExtra}
                onRemoveExtra={cart.removeExtra}
                onUpdateExtraQuantity={cart.updateExtraQuantity}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-lg font-medium mb-2">سبد خرید خالی است</p>
            <p className="text-sm">آیتم‌های خود را از منو انتخاب کنید</p>
          </div>
        )}
      </div>

      {/* Footer - Fixed */}
      <div className="border-t border-gray-800 p-4 space-y-4 bg-gray-850">
        {/* Note Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            یادداشت (اختیاری)
          </label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="توضیحات اضافی..."
            rows={2}
            className="
              w-full rounded-lg
              bg-gray-700 border border-gray-600
              text-gray-100 placeholder-gray-500
              px-3 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500
              resize-none
            "
          />
        </div>

        {/* Total Amount - Persian Format */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-2 text-center">
            جمع کل سفارش
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-400">
              {formattedTotal}
            </div>
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
            {submitError}
          </div>
        )}

        {/* Submit Button - Mobile Optimized */}
        <button
          onClick={onSubmit}
          disabled={!hasItems || submitting}
          className="
            w-full py-4 rounded-xl
            bg-indigo-600 hover:bg-indigo-500
            disabled:bg-gray-700 disabled:text-gray-500
            text-white font-bold text-lg
            transition-all
            disabled:cursor-not-allowed
            shadow-lg
            active:scale-98
            min-h-[56px]
          "
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>در حال ثبت...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>✓</span>
              <span>ثبت فروش</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
