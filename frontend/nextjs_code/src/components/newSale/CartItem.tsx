/**
 * Cart Item Component (Updated with Persian Money + Mobile UX)
 *
 * Features:
 * - Persian money formatting
 * - Larger tap targets for mobile
 * - Better visual hierarchy
 * - Improved extras management
 */

'use client';

import { useState } from 'react';
import type { CartItem as CartItemType } from '@/types/newSaleTypes';
import { QuantityControl } from './QuantityControl';
import { ExtrasList } from './ExtrasList';
import { ExtrasModal } from './ExtrasModal';
import { formatPersianMoney, formatPersianMoneyShort } from '@/libs/tools/persianMoney';

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
   * Calculate totals
   */
  const itemTotal = item.price * item.quantity;
  const extrasTotal = item.extras.reduce(
    (sum, extra) => sum + extra.price * extra.quantity,
    0
  );
  const total = itemTotal + extrasTotal;

  /**
   * Format prices using Persian formatter
   */
  const formattedUnitPrice = formatPersianMoneyShort(item.price);
  const formattedTotal = formatPersianMoney(total);

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-100 text-base mb-1 leading-tight">
            {item.name}
          </h3>
          <div className="text-sm text-gray-400">
            {formattedUnitPrice}
          </div>
        </div>

        {/* Remove Button - Larger tap target */}
        <button
          onClick={onRemove}
          className="
            w-10 h-10
            flex items-center justify-center
            text-red-400 hover:text-red-300
            hover:bg-red-900/20
            rounded-lg
            transition-colors
            text-xl
            shrink-0
          "
          title="حذف"
        >
          🗑️
        </button>
      </div>

      {/* Quantity Control - Mobile optimized */}
      <div className="mb-3">
        <QuantityControl value={item.quantity} onChange={onUpdateQuantity} />
      </div>

      {/* Extras */}
      {item.extras.length > 0 && (
        <div className="mb-3">
          <ExtrasList
            extras={item.extras}
            menuId={item.menu_id}
            onRemove={onRemoveExtra}
            onUpdateQuantity={onUpdateExtraQuantity}
          />
        </div>
      )}

      {/* Add Extras Button - Better mobile UX */}
      <button
        onClick={() => setShowExtrasModal(true)}
        className="
          w-full py-3 px-4
          bg-gray-700 hover:bg-gray-650 active:bg-gray-600
          border border-gray-600 hover:border-indigo-500
          rounded-lg text-sm font-medium text-gray-300 hover:text-white
          transition-all
          flex items-center justify-center gap-2
          min-h-[44px]
        "
      >
        <span className="text-lg">➕</span>
        <span>افزودن افزودنی</span>
      </button>

      {/* Total - Persian Format */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">جمع این آیتم:</span>
          <span className="font-bold text-indigo-400 text-base">
            {formattedTotal}
          </span>
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
