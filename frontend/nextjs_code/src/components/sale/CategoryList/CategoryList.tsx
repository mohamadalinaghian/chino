'use client';

import { useRef, useEffect } from 'react';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';
import { getCategoryIcon } from '@/utils/iconUtils';

interface Category {
  id: string;
  name: string;
  parentGroup?: string;
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
        className="block mb-2 font-medium text-sm"
        style={{ color: THEME_COLORS.subtext }}
      >
        {UI_TEXT.LABEL_CATEGORIES}
      </label>
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-rounded"
        style={{
          scrollbarColor: `${THEME_COLORS.surface} ${THEME_COLORS.bgSecondary}`,
        }}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          const icon = getCategoryIcon(category.name, category.parentGroup);

          return (
            <button
              key={category.id}
              ref={isSelected ? selectedRef : null}
              onClick={() => onCategorySelect(category.id)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-md border
                transition-all duration-200
                hover:scale-[1.02] active:scale-95
                flex items-center gap-1.5
              `}
              style={{
                borderColor: isSelected
                  ? THEME_COLORS.accent
                  : THEME_COLORS.border,
                backgroundColor: isSelected
                  ? THEME_COLORS.surface
                  : THEME_COLORS.bgPrimary,
                color: isSelected
                  ? THEME_COLORS.text
                  : THEME_COLORS.subtext,
              }}
            >
              <span className="text-base">{icon}</span>
              <span className="font-bold text-sm whitespace-nowrap">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
