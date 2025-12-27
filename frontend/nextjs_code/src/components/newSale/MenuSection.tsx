/**
 * Menu Section Component (Updated with Navigation IDs)
 *
 * Displays a group of menu categories with scroll anchors
 * Each category gets a unique ID for quick navigation
 */

'use client';

import { MenuCategoryGroup } from '@/types/newSaleTypes';
import { MenuItemCard } from './MenuItemCard';

interface Props {
  title: string; // Section title (e.g., "نوشیدنی‌ها")
  categoryGroups: MenuCategoryGroup[]; // Categories with their items
  onAddItem: (menuId: number, name: string, price: number) => void;
}

export function MenuSection({ title, categoryGroups, onAddItem }: Props) {
  // Don't render if no categories
  if (categoryGroups.length === 0) {
    return null;
  }

  /**
   * Generate consistent ID for category
   */
  const getCategoryId = (categoryName: string): string => {
    return `category-${categoryName.replace(/\s+/g, '-')}`;
  };

  return (
    <section>
      {/* Section Title */}
      <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
        {title}
      </h2>

      {/* Categories */}
      <div className="space-y-8">
        {categoryGroups.map((group) => (
          <div
            key={group.category}
            id={getCategoryId(group.category)}
            className="scroll-mt-48" // Offset for sticky headers
          >
            {/* Category Title */}
            <h3 className="text-lg font-semibold mb-4 text-indigo-400">
              {group.category}
            </h3>

            {/* Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.items.map((item) => (
                <MenuItemCard key={item.id} item={item} onAdd={onAddItem} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
