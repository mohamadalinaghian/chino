'use client';

import { useMemo } from 'react';
import { IMenuItemForSale } from '@/types/sale';
import { ItemCard } from '../ItemCard';
import { THEME_COLORS } from '@/libs/constants';

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
        className="w-full p-12 rounded-lg text-center"
        style={{ backgroundColor: THEME_COLORS.bgSecondary }}
      >
        <div className="text-6xl mb-4">🍽️</div>
        <p
          className="text-lg font-medium"
          style={{ color: THEME_COLORS.subtext }}
        >
          {selectedCategory
            ? 'موردی در این دسته‌بندی یافت نشد'
            : 'لطفاً یک دسته‌بندی را انتخاب کنید'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onAddToCart={onAddToCart}
            onRequestExtras={onRequestExtras}
          />
        ))}
      </div>
    </div>
  );
}
