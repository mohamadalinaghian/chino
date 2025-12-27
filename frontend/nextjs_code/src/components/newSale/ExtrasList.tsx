/**
 * Extras List Component
 *
 * Displays list of extras for a cart item
 * Each extra has quantity control and remove button
 */

'use client';

import type { CartExtra } from '@/types/newSaleTypes';
import { QuantityControl } from './QuantityControl';

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
      <div className="text-xs text-gray-400 font-medium mb-2">افزودنی‌ها:</div>
      {extras.map((extra) => (
        <div
          key={extra.product_id}
          className="flex items-center gap-2 bg-gray-750 rounded-lg p-2"
        >
          {/* Extra Info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-300 truncate">{extra.name}</div>
            <div className="text-xs text-gray-500">
              {extra.price.toLocaleString('fa-IR')} هزار تومان
            </div>
          </div>

          {/* Quantity Control - Smaller */}
          <div className="scale-75">
            <QuantityControl
              value={extra.quantity}
              onChange={(qty) => onUpdateQuantity(menuId, extra.product_id, qty)}
            />
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(menuId, extra.product_id)}
            className="text-red-400 hover:text-red-300 text-sm transition-colors px-2"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
