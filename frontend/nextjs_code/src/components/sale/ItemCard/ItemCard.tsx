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

export function ItemCard({
  item,
  categoryName,
  onAddToCart,
  onRequestExtras,
  isAnimating
}: ItemCardProps) {
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
      className={`
        w-full group relative overflow-hidden rounded-xl border transition-all duration-300
        hover:scale-[1.025] hover:shadow-xl cursor-pointer
        will-change-transform
        ${
          isAnimating
            ? 'animate-item-select animate-inner-glow animate-ripple-success ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/25 scale-[1.02]'
            : 'hover:shadow-lg shadow-md'
        }
      `}
      style={{
        borderColor: isAnimating ? 'rgba(59, 130, 246, 0.5)' : THEME_COLORS.border,
        backgroundColor: THEME_COLORS.bgPrimary,
        boxShadow: isAnimating
          ? '0 20px 40px rgba(59, 130, 246, 0.3)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Icon Section */}
      <div
        className="relative h-24 overflow-hidden rounded-t-xl"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        <div
          className="w-full h-full flex items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-110"
          style={{ color: THEME_COLORS.subtext }}
        >
          {getItemIcon(item.name, categoryName)}
        </div>

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                     opacity-0 group-hover:opacity-100 transition-all duration-300"
        />

        {/* Add Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-2xl backdrop-blur-sm border scale-0 group-hover:scale-100 transition-all duration-300"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.9)',
              color: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            +
          </div>
        </div>

        {/* Success Checkmark (during animation) */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-2xl animate-ping">
              <span style={{ color: THEME_COLORS.green, textShadow: '0 0 8px rgba(34, 197, 94, 0.6)' }}>✓</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-1.5 relative z-10">
        {/* Item Name */}
        <h3
          className="text-sm font-bold text-right line-clamp-1 leading-tight"
          style={{ color: THEME_COLORS.text }}
        >
          {item.name}
        </h3>

        {/* Price */}
        <div
          className="text-base font-extrabold text-right tracking-tight drop-shadow-sm"
          style={{ color: THEME_COLORS.green }}
        >
          {formatPersianMoney(item.price)}
        </div>
      </div>

      {/* Extras Button */}
      {onRequestExtras && (
        <button
          onClick={handleExtrasClick}
          className="absolute top-3 left-3 w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl
                     transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-2xl
                     backdrop-blur-sm border z-20 group/extras"
          style={{
            backgroundColor: THEME_COLORS.purple,
            color: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
          }}
          title={UI_TEXT.LABEL_EXTRAS}
        >
          <span className="text-base font-bold group-hover/extras:scale-110">+</span>
        </button>
      )}
    </div>
  );
}
