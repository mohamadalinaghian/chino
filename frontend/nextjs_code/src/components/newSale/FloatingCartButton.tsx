/**
 * Floating Cart Button (Mobile Optimized with Persian Money)
 *
 * Features:
 * - Shows cart item count
 * - Displays total amount in Persian format
 * - Pulse animation when items added
 * - Larger tap target (60x60)
 * - Better positioning to avoid overlap
 */

'use client';

import { useEffect, useState } from 'react';
import { formatPersianMoneyShort } from '@/libs/tools/persianMoney';

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

  const formattedAmount = formatPersianMoneyShort(totalAmount);

  return (
    <button
      onClick={onClick}
      className={`
        lg:hidden
        fixed bottom-20 left-4
        z-30
        ${isPulsing ? 'animate-bounce' : ''}
        ${className}
      `}
    >
      {/* Main Button */}
      <div
        className="
          w-16 h-16
          rounded-full
          bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
          text-white
          shadow-2xl
          flex flex-col items-center justify-center
          transition-all duration-300
          border-4 border-gray-900
        "
      >
        {/* Cart Icon */}
        <span className="text-2xl mb-0.5">🛒</span>

        {/* Badge with count */}
        <div
          className="
            absolute -top-2 -right-2
            min-w-[28px] h-7 px-2
            bg-red-500 rounded-full
            flex items-center justify-center
            text-sm font-bold
            shadow-lg
            border-2 border-gray-900
          "
        >
          {itemCount}
        </div>
      </div>

      {/* Total Amount Badge */}
      <div
        className="
          absolute -top-3 -left-2
          bg-green-600 text-white
          px-3 py-1.5
          rounded-full
          text-xs font-bold
          shadow-lg
          border-2 border-gray-900
          whitespace-nowrap
        "
      >
        {formattedAmount}
      </div>
    </button>
  );
}
