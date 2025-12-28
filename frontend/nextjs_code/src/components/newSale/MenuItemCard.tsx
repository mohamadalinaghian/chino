/**
 * Menu Item Card Component (Updated with Persian Money Format)
 *
 * Displays a single menu item with:
 * - Name
 * - Price in Persian format
 * - Add button
 * - Mobile-optimized tap targets
 */

'use client';

import { MenuItemSale } from '@/types/newSaleTypes';
import { formatPriceBadge } from '@/libs/tools/persianMoney';

interface Props {
  item: MenuItemSale;
  onAdd: (menuId: number, name: string, price: number) => void;
}

export function MenuItemCard({ item, onAdd }: Props) {
  const handleClick = () => {
    onAdd(item.id, item.name, item.price);
  };

  /**
   * Format price using Persian money formatter
   */
  const { value, unit } = formatPriceBadge(item.price);

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
        min-h-[100px]
      "
    >
      {/* Content */}
      <div className="space-y-3">
        {/* Name */}
        <h4 className="font-semibold text-gray-100 text-sm leading-tight line-clamp-2">
          {item.name}
        </h4>

        {/* Price - Persian Format */}
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-bold text-lg text-indigo-400 leading-none">
            {value}
          </span>
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>

      {/* Add Icon - Shows on hover/tap */}
      <div
        className="
          absolute top-2 left-2
          w-8 h-8 rounded-full
          bg-indigo-600 text-white
          flex items-center justify-center
          opacity-0 group-hover:opacity-100 group-active:opacity-100
          transition-opacity
          text-xl font-bold
        "
      >
        +
      </div>
    </button>
  );
}
