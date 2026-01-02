'use client';

import { IMenuItemForSale } from '@/types/sale';
import { CATPPUCCIN_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';

interface ItemCardProps {
  item: IMenuItemForSale;
  onAddToCart: (item: IMenuItemForSale) => void;
  onRequestExtras?: (item: IMenuItemForSale) => void;
}

export function ItemCard({ item, onAddToCart, onRequestExtras }: ItemCardProps) {
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
      className="w-full group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 active:scale-95"
      style={{
        borderColor: CATPPUCCIN_COLORS.border,
        backgroundColor: CATPPUCCIN_COLORS.bgPrimary,
      }}
    >
      {/* Image Section */}
      <div
        className="relative h-40 overflow-hidden"
        style={{ backgroundColor: CATPPUCCIN_COLORS.surface }}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            style={{ color: CATPPUCCIN_COLORS.subtext }}
          >
            🍽️
          </div>
        )}

        {/* Extras Badge */}
        {item.has_extras && (
          <div
            className="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold"
            style={{
              backgroundColor: CATPPUCCIN_COLORS.accent,
              color: CATPPUCCIN_COLORS.bgSecondary,
            }}
          >
            + افزودنی
          </div>
        )}

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-2">
        {/* Item Name */}
        <h3
          className="text-base font-bold text-right line-clamp-2"
          style={{ color: CATPPUCCIN_COLORS.text }}
        >
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p
            className="text-sm text-right line-clamp-2"
            style={{ color: CATPPUCCIN_COLORS.subtext }}
          >
            {item.description}
          </p>
        )}

        {/* Price */}
        <div
          className="text-lg font-bold text-right pt-2"
          style={{ color: CATPPUCCIN_COLORS.green }}
        >
          {formatPersianMoney(item.price)}
        </div>
      </div>

      {/* Add Button Overlay on Hover */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      >
        <div
          className="px-6 py-3 rounded-lg font-bold text-lg"
          style={{
            backgroundColor: CATPPUCCIN_COLORS.accent,
            color: CATPPUCCIN_COLORS.bgSecondary,
          }}
        >
          {item.has_extras ? '+ انتخاب افزودنی' : '+ افزودن'}
        </div>
      </div>
    </button>
  );
}
