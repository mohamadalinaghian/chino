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
  isAnimating?: boolean;
}

export function ItemCard({ item, categoryName, onAddToCart, onRequestExtras, isAnimating }: ItemCardProps) {
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(item);
  };

  const handleAddWithExtras = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestExtras) {
      onRequestExtras(item);
    } else {
      onAddToCart(item);
    }
  };

  return (
    <div
      className={`w-full group relative overflow-hidden rounded-md border transition-all duration-200 hover:scale-[1.02] ${
        isAnimating ? 'animate-pulse ring-4 ring-green-500 scale-105' : ''
      }`}
      style={{
        borderColor: isAnimating ? THEME_COLORS.green : THEME_COLORS.border,
        backgroundColor: THEME_COLORS.bgPrimary,
      }}
    >
      {/* Icon Section */}
      <div
        className="relative h-24 overflow-hidden"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        <div
          className="w-full h-full flex items-center justify-center text-4xl"
          style={{ color: THEME_COLORS.subtext }}
        >
          {getItemIcon(item.name, categoryName)}
        </div>

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      </div>

      {/* Content Section */}
      <div className="p-2 space-y-1">
        {/* Item Name */}
        <h3
          className="text-sm font-bold text-right line-clamp-1"
          style={{ color: THEME_COLORS.text }}
        >
          {item.name}
        </h3>

        {/* Price */}
        <div
          className="text-sm font-bold text-right"
          style={{ color: THEME_COLORS.green }}
        >
          {formatPersianMoney(item.price)}
        </div>
      </div>

      {/* Dual Button Overlay on Hover */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      >
        <button
          onClick={handleQuickAdd}
          className="w-full px-3 py-1.5 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: THEME_COLORS.accent,
            color: '#fff',
          }}
        >
          {UI_TEXT.BTN_ADD}
        </button>
        {onRequestExtras && (
          <button
            onClick={handleAddWithExtras}
            className="w-full px-3 py-1.5 rounded-md font-bold text-sm border transition-all hover:scale-105 active:scale-95"
            style={{
              borderColor: THEME_COLORS.accent,
              color: THEME_COLORS.accent,
              backgroundColor: 'transparent',
            }}
          >
            + {UI_TEXT.LABEL_EXTRAS}
          </button>
        )}
      </div>
    </div>
  );
}
