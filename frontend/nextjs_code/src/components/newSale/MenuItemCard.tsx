/**
 * Menu Item Card Component
 *
 * Displays a single menu item with:
 * - Name
 * - Price
 * - Add button
 */

'use client';

import { MenuItemSale } from '@/types/newSaleTypes';

interface Props {
  item: MenuItemSale;
  onAdd: (menuId: number, name: string, price: number) => void;
}

export function MenuItemCard({ item, onAdd }: Props) {
  const handleClick = () => {
    onAdd(item.id, item.name, item.price);
  };

  /**
   * Format price for display
   */
  const formattedPrice = item.price.toLocaleString('fa-IR');

  return (
    <button
      onClick={handleClick}
      className="
        group relative
        bg-gray-800 hover:bg-gray-750
        border border-gray-700 hover:border-indigo-500
        rounded-xl p-4
        transition-all duration-200
        hover:shadow-xl hover:scale-105
        active:scale-95
        text-right
      "
    >
      {/* Content */}
      <div className="space-y-2">
        {/* Name */}
        <h4 className="font-semibold text-gray-100 text-sm leading-tight">
          {item.name}
        </h4>

        {/* Price */}
        <div className="flex items-baseline gap-1 text-indigo-400">
          <span className="font-bold text-lg">{formattedPrice}</span>
          <span className="text-xs text-gray-500">هزار تومان</span>
        </div>
      </div>

      {/* Add Icon - Shows on hover */}
      <div
        className="
          absolute top-2 left-2
          w-7 h-7 rounded-full
          bg-indigo-600 text-white
          flex items-center justify-center
          opacity-0 group-hover:opacity-100
          transition-opacity
          text-lg
        "
      >
        +
      </div>
    </button>
  );
}
