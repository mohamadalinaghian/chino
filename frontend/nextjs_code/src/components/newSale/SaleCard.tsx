/**
 * Sale card component for dashboard grid (Updated with Persian Money)
 *
 * Features:
 * - Click to view/edit sale
 * - Displays sale type (dine-in vs takeaway)
 * - Shows elapsed time
 * - Persian money formatting
 * - Mobile responsive with better tap targets
 */

'use client';

import { useRouter } from 'next/navigation';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import { formatPersianMoney } from '@/libs/tools/persianMoney';
import type { SaleDashboardItem } from '@/types/saleType';

interface Props {
  sale: SaleDashboardItem;
}

export function SaleCard({ sale }: Props) {
  const router = useRouter();
  const relativeTime = useRelativeTime(sale.opened_at);

  /**
   * Determine if sale is dine-in or takeaway
   */
  const isDineIn = Boolean(sale.table);
  const title = isDineIn ? `میز ${sale.table}` : 'بیرون‌بر';
  const icon = isDineIn ? '🍽️' : '🥡';

  /**
   * Format total amount using Persian formatter
   */
  const formattedAmount = sale.total_amount
    ? formatPersianMoney(sale.total_amount)
    : '0 تومان';

  /**
   * Handle card click
   */
  const handleClick = () => {
    router.push(`/sale/${sale.id}`);
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="
        cursor-pointer rounded-2xl bg-gray-800 p-4
        shadow-lg hover:shadow-xl
        border border-gray-700 hover:border-indigo-500
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900
        active:scale-98
        min-h-[140px]
        flex flex-col
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-bold text-gray-100">
            {title}
          </h3>
        </div>
      </div>

      {/* Guest Name */}
      {sale.guest_name && (
        <div className="text-sm text-gray-300 mb-2 flex items-center gap-1">
          <span>👤</span>
          <span className="truncate">{sale.guest_name}</span>
        </div>
      )}

      {/* Amount - Full Width, Persian Format */}
      <div className="mt-auto pt-3 border-t border-gray-700">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">مبلغ</div>
          <div className="text-lg font-bold text-indigo-400">
            {formattedAmount}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700">
        <div className="truncate flex-1">
          توسط {sale.opened_by_name}
        </div>
        <div className="shrink-0 font-medium">
          {relativeTime}
        </div>
      </div>
    </div>
  );
}
