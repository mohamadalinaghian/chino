/**
 * Floating Cart Button (Mobile Only)
 *
 * Features:
 * - Floating action button showing cart item count
 * - Sticky at bottom of screen on mobile
 * - Shows/hides cart sidebar on click
 * - Badge with item count
 * - Pulse animation when items added
 *
 * UX Benefits:
 * - Quick cart access on mobile
 * - Visual feedback of cart state
 * - Doesn't block content
 */

'use client';

import { useEffect, useState } from 'react';

interface Props {
  itemCount: number;
  totalAmount: number;
  onClick: () => void;
  className?: string;
}

export function FloatingCartButton({
  itemCount,
  totalAmount,
  onClick,
  className = '',
}: Props) {
  const [isPulsing, setIsPulsing] = useState(false);

  /**
   * Pulse animation when item count changes
   */
  useEffect(() => {
    if (itemCount > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  // Don't show if cart is empty
  if (itemCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className={`
        lg:hidden
        fixed bottom-6 left-6
        w-16 h-16 rounded-full
        bg-indigo-600 hover:bg-indigo-500
        text-white
        shadow-2xl
        flex items-center justify-center
        transition-all duration-300
        z-30
        ${isPulsing ? 'animate-pulse scale-110' : 'scale-100'}
        ${className}
      `}
    >
      {/* Cart Icon */}
      <div className="relative">
        <span className="text-2xl">🛒</span>

        {/* Badge with count */}
        <div
          className="
            absolute -top-2 -right-2
            min-w-[20px] h-5 px-1
            bg-red-500 rounded-full
            flex items-center justify-center
            text-xs font-bold
            shadow-lg
          "
        >
          {itemCount}
        </div>
      </div>
    </button>
  );
}
