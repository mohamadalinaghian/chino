'use client';

import { useMemo } from 'react';
import { IMenuItemForSale } from '@/types/sale';
import { ItemCard } from '../ItemCard';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';

interface ItemsGridProps {
  items: IMenuItemForSale[];
  selectedCategory: string | null;
  onAddToCart: (item: IMenuItemForSale) => void;
  onRequestExtras?: (item: IMenuItemForSale) => void;
}

export function ItemsGrid({
  items,
  selectedCategory,
  onAddToCart,
  onRequestExtras,
}: ItemsGridProps) {
  // Memoize filtered items to avoid recalculation on every render
  const displayedItems = useMemo(() => {
    if (!selectedCategory) {
      return items;
    }
    // Items are already filtered by category from parent
    return items;
  }, [items, selectedCategory]);

  if (displayedItems.length === 0) {
    return (
      <div
        className="w-full p-8 rounded-md text-center"
        style={{ backgroundColor: THEME_COLORS.bgSecondary }}
      >
        <div className="text-4xl mb-3">🍽️</div>
        <p
          className="text-base font-medium"
          style={{ color: THEME_COLORS.subtext }}
        >
          {selectedCategory
            ? UI_TEXT.MSG_NO_CATEGORY_ITEMS
            : UI_TEXT.MSG_SELECT_CATEGORY}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {displayedItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            categoryName={selectedCategory || undefined}
            onAddToCart={onAddToCart}
            onRequestExtras={onRequestExtras}
          />
        ))}
      </div>
    </div>
  );
}
