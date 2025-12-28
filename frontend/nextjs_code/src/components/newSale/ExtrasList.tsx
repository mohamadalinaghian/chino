/**
 * Extras List Component (Updated with Persian Money)
 *
 * Displays list of extras for a cart item with Persian formatting
 */

'use client';

import type { CartExtra } from '@/types/newSaleTypes';
import { QuantityControl } from './QuantityControl';
import { formatPersianMoneyShort } from '@/libs/tools/persianMoney';

interface Props {
  extras: CartExtra[];
  menuId: number;
  onRemove: (menuId: number, productId: number) => void;
  onUpdateQuantity: (menuId: number, productId: number, quantity: number) => void;
}

export function ExtrasList({
  extras,
  menuId,
  onRemove,
  onUpdateQuantity,
}: Props) {
  if (extras.length === 0) return null;

  return (
    <div className="space-y-2 pt-3 border-t border-gray-700">
      <div className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
        <span>➕</span>
        <span>افزودنی‌ها:</span>
      </div>
      {extras.map((extra) => {
        const formattedPrice = formatPersianMoneyShort(extra.price);

        return (
          <div
            key={extra.product_id}
            className="flex items-center gap-2 bg-gray-750 rounded-lg p-3 border border-gray-700"
          >
            {/* Extra Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-300 font-medium truncate">
                {extra.name}
              </div>
              <div className="text-xs text-gray-500">
                {formattedPrice}
              </div>
            </div>

            {/* Quantity Control - Smaller scale */}
            <div className="scale-90">
              <QuantityControl
                value={extra.quantity}
                onChange={(qty) => onUpdateQuantity(menuId, extra.product_id, qty)}
              />
            </div>

            {/* Remove Button - Better tap target */}
            <button
              onClick={() => onRemove(menuId, extra.product_id)}
              className="
                w-9 h-9
                flex items-center justify-center
                text-red-400 hover:text-red-300
                hover:bg-red-900/20
                rounded-lg
                transition-colors
                shrink-0
              "
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
