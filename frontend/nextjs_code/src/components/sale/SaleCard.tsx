/**
 * Sale card component for dashboard grid
 *
 * Single Responsibility: Display sale summary with action buttons
 *
 * Features:
 * - Click to view/edit sale
 * - Displays sale type (dine-in vs takeaway)
 * - Shows elapsed time
 * - Pay Now button (permission-gated)
 * - Mobile responsive
 */

'use client';

import { useRouter } from 'next/navigation';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import { usePermissions, SalePermissions } from '@/hooks/usePermissions';
import type { SaleDashboardItem } from '@/types/saleType';

interface Props {
  sale: SaleDashboardItem;
}

export function SaleCard({ sale }: Props) {
  const router = useRouter();
  const relativeTime = useRelativeTime(sale.opened_at);
  const { hasPermission } = usePermissions();

  /**
   * Permission checks
   */
  const canCloseSale = hasPermission(SalePermissions.CLOSE_SALE);

  /**
   * Determine if sale is dine-in or takeaway
   */
  const isDineIn = Boolean(sale.table);
  const title = isDineIn ? `میز ${sale.table}` : 'بیرون‌بر';
  const icon = isDineIn ? '🍽️' : '🥡';

  /**
   * Determine if sale is in OPEN state
   */
  const isOpen = sale.state === 'OPEN';

  /**
   * Format total amount
   */
  const formattedAmount = sale.total_amount
    ? Number(sale.total_amount).toLocaleString('fa-IR')
    : '0';

  /**
   * Handle card click - navigate to detail view
   */
  const handleClick = () => {
    router.push(`/sale/${sale.id}`);
  };

  /**
   * Handle Pay Now button click
   */
  const handlePayNow = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    router.push(`/sale/${sale.id}/payment`);
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
        {/* Amount Badge */}
        <div className="text-left shrink-0 flex items-baseline gap-1">
          <div className="text-sm font-bold text-indigo-400">
            {formattedAmount}
          </div>
          <div className="text-xs text-gray-500">هزار تومان</div>
        </div>
      </div>

      {/* Guest Name */}
      {sale.guest_name && (
        <div className="text-sm text-gray-300 mb-2 flex items-center gap-1">
          <span>👤</span>
          <span className="truncate">{sale.guest_name}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-700 my-3"></div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="truncate flex-1">
          توسط {sale.opened_by_name}
        </div>
        <div className="shrink-0 font-medium">
          {relativeTime}
        </div>
      </div>

      {/* Pay Now Button - Only for OPEN sales with permission */}
      {isOpen && canCloseSale && (
        <>
          <div className="border-t border-gray-700 my-3"></div>
          <button
            onClick={handlePayNow}
            className="
              w-full py-2.5 px-4
              bg-indigo-600 hover:bg-indigo-700
              text-white font-medium text-sm
              rounded-xl
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800
              active:scale-98
              flex items-center justify-center gap-2
            "
          >
            <span>💳</span>
            <span>پرداخت و بستن فاکتور</span>
          </button>
        </>
      )}
    </div>
  );
}
