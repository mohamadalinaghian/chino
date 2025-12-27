/**
 * Cart Item Component
 *
 * Features:
 * - Item name and price
 * - Quantity controls
 * - Remove button
 * - Extras list with management
 * - Add extras button (lazy-loads extras modal)
 */

'use client';

import { useState } from 'react';
import type { CartItem as CartItemType } from '@/types/newSaleTypes';
import { QuantityControl } from './QuantityControl';
import { ExtrasList } from './ExtrasList';
import { ExtrasModal } from './ExtrasModal';

interface Props {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onAddExtra: (
    menuId: number,
    productId: number,
    name: string,
    price: number
  ) => void;
  onRemoveExtra: (menuId: number, productId: number) => void;
  onUpdateExtraQuantity: (
    menuId: number,
    productId: number,
    quantity: number
  ) => void;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  onAddExtra,
  onRemoveExtra,
  onUpdateExtraQuantity,
}: Props) {
  const [showExtrasModal, setShowExtrasModal] = useState(false);

  /**
   * Calculate item total (including extras)
   */
  const itemTotal = item.price * item.quantity;
  const extrasTotal = item.extras.reduce(
    (sum, extra) => sum + extra.price * extra.quantity,
    0
  );
  const total = itemTotal + extrasTotal;

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-100 text-sm truncate">
            {item.name}
          </h3>
          <div className="text-xs text-gray-400 mt-1">
            {item.price.toLocaleString('fa-IR')} هزار تومان
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 text-lg transition-colors"
          title="حذف"
        >
          🗑️
        </button>
      </div>

      {/* Quantity Control */}
      <div className="mb-3">
        <QuantityControl value={item.quantity} onChange={onUpdateQuantity} />
      </div>

      {/* Extras */}
      {item.extras.length > 0 && (
        <ExtrasList
          extras={item.extras}
          menuId={item.menu_id}
          onRemove={onRemoveExtra}
          onUpdateQuantity={onUpdateExtraQuantity}
        />
      )}

      {/* Add Extras Button */}
      <button
        onClick={() => setShowExtrasModal(true)}
        className="
          w-full mt-3 py-2 px-3
          bg-gray-700 hover:bg-gray-650
          border border-gray-600 hover:border-indigo-500
          rounded-lg text-sm text-gray-300 hover:text-white
          transition-all
          flex items-center justify-center gap-2
        "
      >
        <span>➕</span>
        <span>افزودن افزودنی</span>
      </button>

      {/* Total */}
      <div className="mt-3 pt-3 border-t border-gray-700 flex items-baseline justify-between">
        <span className="text-xs text-gray-400">جمع:</span>
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-indigo-400">
            {total.toLocaleString('fa-IR')}
          </span>
          <span className="text-xs text-gray-500">هزار تومان</span>
        </div>
      </div>

      {/* Extras Modal */}
      {showExtrasModal && (
        <ExtrasModal
          menuId={item.menu_id}
          onClose={() => setShowExtrasModal(false)}
          onAddExtra={onAddExtra}
        />
      )}
    </div>
  );
}
