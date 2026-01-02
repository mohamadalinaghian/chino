'use client';

import { useRef, useEffect } from 'react';
import { CATPPUCCIN_COLORS } from '@/libs/constants';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string) => void;
}

export function CategoryList({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected category
  useEffect(() => {
    if (selectedRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selected = selectedRef.current;

      const containerWidth = container.offsetWidth;
      const selectedLeft = selected.offsetLeft;
      const selectedWidth = selected.offsetWidth;

      // Scroll to center the selected item
      const scrollTo = selectedLeft - containerWidth / 2 + selectedWidth / 2;
      container.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <label
        className="block mb-3 font-medium"
        style={{ color: CATPPUCCIN_COLORS.subtext }}
      >
        دسته‌بندی‌ها
      </label>
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-rounded"
        style={{
          scrollbarColor: `${CATPPUCCIN_COLORS.surface} ${CATPPUCCIN_COLORS.bgSecondary}`,
        }}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              ref={isSelected ? selectedRef : null}
              onClick={() => onCategorySelect(category.id)}
              className={`
                flex-shrink-0 px-6 py-3 rounded-lg border-2
                transition-all duration-300
                hover:scale-105 active:scale-95
                flex items-center gap-2
              `}
              style={{
                borderColor: isSelected
                  ? CATPPUCCIN_COLORS.accent
                  : CATPPUCCIN_COLORS.border,
                backgroundColor: isSelected
                  ? CATPPUCCIN_COLORS.surface
                  : CATPPUCCIN_COLORS.bgPrimary,
                color: isSelected
                  ? CATPPUCCIN_COLORS.text
                  : CATPPUCCIN_COLORS.subtext,
              }}
            >
              {category.icon && <span className="text-xl">{category.icon}</span>}
              <span className="font-bold whitespace-nowrap">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
