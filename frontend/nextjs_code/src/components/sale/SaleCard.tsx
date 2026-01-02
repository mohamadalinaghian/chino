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
      cursor-pointer rounded-lg bg-gray-800 p-2
      shadow-sm hover:shadow-md
      border border-gray-700 hover:border-indigo-500
      transition-all duration-150
      focus:outline-none focus:ring-1 focus:ring-indigo-500
      active:scale-98
    "
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1">
          <span className="text-base">{icon}</span>
          <h3 className="text-sm font-bold text-gray-100">
            {title}
          </h3>
        </div>
        {/* Amount Badge */}
        <div className="text-left shrink-0 flex items-baseline gap-0.5">
          <div className="text-xs font-bold text-indigo-400">
            {formattedAmount}
          </div>
          <div className="text-[10px] text-gray-500">هزار</div>
        </div>
      </div>

      {/* Guest Name */}
      {sale.guest_name && (
        <div className="text-[10px] text-gray-300 mb-1.5 flex items-center gap-0.5">
          <span className="text-xs">👤</span>
          <span className="truncate">{sale.guest_name}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-700 my-1.5"></div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <div className="truncate flex-1">
          {sale.opened_by_name}
        </div>
        <div className="shrink-0 font-medium">
          {relativeTime}
        </div>
      </div>
    </div>
  );
