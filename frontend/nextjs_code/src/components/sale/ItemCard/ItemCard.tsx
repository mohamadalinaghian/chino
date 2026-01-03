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
  const handleCardClick = () => {
    onAddToCart(item);
  };

  const handleExtrasClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestExtras) {
      onRequestExtras(item);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`w-full group relative overflow-hidden rounded-md border transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
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

        {/* Add Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
            style={{
              backgroundColor: THEME_COLORS.accent,
              color: '#fff',
            }}
          >
            +
          </div>
        </div>
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

      {/* Extras Button - Always Visible in Top Left */}
      {onRequestExtras && (
        <button
          onClick={handleExtrasClick}
          className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 z-10"
          style={{
            backgroundColor: THEME_COLORS.purple,
            color: '#fff',
          }}
          title={UI_TEXT.LABEL_EXTRAS}
        >
          <span className="text-sm font-bold">+</span>
        </button>
      )}
    </div>
  );
}
