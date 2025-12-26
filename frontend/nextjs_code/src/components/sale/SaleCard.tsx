/**
 * Sale card component for dashboard grid
 *
 * Features:
 * - Click to view/edit sale
 * - Displays sale type (dine-in vs takeaway)
 * - Shows elapsed time
 * - Mobile responsive
 */

'use client';

import { useRouter } from 'next/navigation';
import { useRelativeTime } from '@/hooks/useRelativeTime';
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
   * Format total amount
   */
  const formattedAmount = sale.total_amount
    ? Number(sale.total_amount).toLocaleString('fa-IR')
    : '0';

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
        cursor-pointer rounded-2xl bg-white p-4
        shadow-sm hover:shadow-lg
        border border-gray-100 hover:border-indigo-200
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-indigo-500
        active:scale-98
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-bold text-gray-900">
            {title}
          </h3>
        </div>

        {/* Amount Badge */}
        <div className="text-left shrink-0 flex items-baseline gap-1">
          <div className="text-sm font-bold text-indigo-600">
            {formattedAmount}
          </div>
          <div className="text-xs text-gray-500">هزار تومان</div>
        </div>
      </div>

      {/* Guest Name */}
      {sale.guest_name && (
        <div className="text-sm text-gray-700 mb-2 flex items-center gap-1">
          <span>👤</span>
          <span className="truncate">{sale.guest_name}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 my-3"></div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
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
