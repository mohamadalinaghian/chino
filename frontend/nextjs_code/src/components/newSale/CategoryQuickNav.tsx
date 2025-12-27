/**
 * Category Quick Navigation Component
 *
 * Features:
 * - Sticky horizontal scroll bar for quick category access
 * - Active category highlighting
 * - Smooth scroll to category sections
 * - Mobile-optimized horizontal scroll
 * - Keyboard navigation support
 *
 * UX Benefits:
 * - Staff can quickly jump between categories
 * - No need to scroll through entire menu
 * - Visual feedback of current section
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { MenuCategoryGroup } from '@/types/newSaleTypes';

interface Props {
  barCategories: MenuCategoryGroup[];
  foodCategories: MenuCategoryGroup[];
}

interface NavItem {
  id: string;
  label: string;
  group: 'bar' | 'food';
  icon: string;
}

export function CategoryQuickNav({ barCategories, foodCategories }: Props) {
  const [activeId, setActiveId] = useState<string>('');
  const navRef = useRef<HTMLDivElement>(null);

  /**
   * Build navigation items from categories
   */
  const navItems: NavItem[] = [
    // Bar categories
    ...barCategories.map((cat) => ({
      id: `category-${cat.category.replace(/\s+/g, '-')}`,
      label: cat.category,
      group: 'bar' as const,
      icon: '🍹',
    })),
    // Food categories
    ...foodCategories.map((cat) => ({
      id: `category-${cat.category.replace(/\s+/g, '-')}`,
      label: cat.category,
      group: 'food' as const,
      icon: '🍽️',
    })),
  ];

  /**
   * Scroll to category section
   */
  const scrollToCategory = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 180; // Account for sticky header + nav bar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      setActiveId(id);
    }
  };

  /**
   * Track active section on scroll (Intersection Observer)
   */
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-200px 0px -50% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Observe all category sections
    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [navItems]);

  /**
   * Auto-scroll active item into view in nav bar
   */
  useEffect(() => {
    if (activeId && navRef.current) {
      const activeButton = navRef.current.querySelector(
        `[data-category-id="${activeId}"]`
      );
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeId]);

  if (navItems.length === 0) return null;

  return (
    <div className="sticky top-[72px] z-20 bg-gray-900 border-b border-gray-700 shadow-lg">
      <div
        ref={navRef}
        className="
          flex gap-2 overflow-x-auto
          px-4 py-3
          scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent
          lg:justify-center lg:flex-wrap
        "
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 transparent',
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            data-category-id={item.id}
            onClick={() => scrollToCategory(item.id)}
            className={`
              flex items-center gap-2
              px-4 py-2 rounded-lg
              whitespace-nowrap
              text-sm font-medium
              transition-all duration-200
              shrink-0
              ${
                activeId === item.id
                  ? 'bg-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }
            `}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
