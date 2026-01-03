'use client';

import { IMenuItemForSale } from '@/types/sale';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { getItemIcon } from '@/utils/iconUtils';

interface ItemCardProps {
  item: IMenuItemForSale;
  categoryName?: string;
  onAddToCart: (item: IMenuItemForSale) => void;
  onRequestExtras?: (item: IMenuItemForSale) => void;
}

export function ItemCard({ item, categoryName, onAddToCart, onRequestExtras }: ItemCardProps) {
  const handleClick = () => {
    if (item.has_extras && onRequestExtras) {
      onRequestExtras(item);
    } else {
      onAddToCart(item);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full group relative overflow-hidden rounded-md border transition-all duration-200 hover:scale-[1.02] active:scale-95"
      style={{
        borderColor: THEME_COLORS.border,
        backgroundColor: THEME_COLORS.bgPrimary,
      }}
    >
      {/* Image Section - Reduced height */}
      <div
        className="relative h-24 overflow-hidden"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl"
            style={{ color: THEME_COLORS.subtext }}
          >
            {getItemIcon(item.name, categoryName)}
          </div>
        )}

        {/* Extras Badge - Smaller */}
        {item.has_extras && (
          <div
            className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-bold"
            style={{
              backgroundColor: THEME_COLORS.purple,
              color: '#fff',
            }}
          >
            + {UI_TEXT.LABEL_EXTRAS}
          </div>
        )}

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      </div>

      {/* Content Section - Reduced padding */}
      <div className="p-2 space-y-1">
        {/* Item Name - Smaller text */}
        <h3
          className="text-sm font-bold text-right line-clamp-1"
          style={{ color: THEME_COLORS.text }}
        >
          {item.name}
        </h3>

        {/* Description - Hidden on small cards for better space */}
        {item.description && (
          <p
            className="text-xs text-right line-clamp-1 hidden sm:block"
            style={{ color: THEME_COLORS.subtext }}
          >
            {item.description}
          </p>
        )}

        {/* Price - Smaller */}
        <div
          className="text-sm font-bold text-right"
          style={{ color: THEME_COLORS.green }}
        >
          {formatPersianMoney(item.price)}
        </div>
      </div>

      {/* Add Button Overlay on Hover - Smaller button */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      >
        <div
          className="px-4 py-2 rounded-md font-bold text-sm"
          style={{
            backgroundColor: THEME_COLORS.accent,
            color: '#fff',
          }}
        >
          {item.has_extras ? UI_TEXT.BTN_SELECT_EXTRAS : UI_TEXT.BTN_ADD}
        </div>
      </div>
    </button>
  );
}
