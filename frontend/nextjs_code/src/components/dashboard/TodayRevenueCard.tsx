/**
 * Today Revenue Card
 *
 * Single Responsibility: Display today's revenue metrics
 *
 * Requires: sale.view_revenue_data permission
 *
 * Features:
 * - Total revenue
 * - COGS (Cost of Goods Sold)
 * - Gross profit
 * - Gross margin percentage
 * - Mobile responsive
 *
 * Note: This is a placeholder implementation.
 * Connect to backend revenue API endpoint when available.
 */

'use client';

import { formatPersianMoney } from '@/libs/tools/persianMoney';
import { DashboardCard } from './DashboardCard';

interface RevenueData {
  total_revenue: string;
  total_cogs: string;
  gross_profit: string;
  gross_margin_percent: string;
  closed_sales_count: number;
}

interface Props {
  data?: RevenueData;
  loading?: boolean;
  error?: string;
}

export function TodayRevenueCard({ data, loading, error }: Props) {
  return (
    <DashboardCard
      title="درآمد امروز"
      icon="💰"
      loading={loading}
      error={error}
      theme="success"
    >
      {data ? (
        <div className="space-y-4">
          {/* Closed Sales Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">فروش‌های بسته شده</span>
            <span className="text-lg font-bold text-gray-200">
              {data.closed_sales_count.toLocaleString('fa-IR')}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700"></div>

          {/* Total Revenue */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">کل فروش</span>
            <div className="text-xl font-bold text-green-400">
              {formatPersianMoney(data.total_revenue)}
            </div>
          </div>

          {/* COGS */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">بهای تمام شده</span>
            <div className="text-lg font-bold text-red-400">
              {formatPersianMoney(data.total_cogs)}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700"></div>

          {/* Gross Profit */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">سود ناخالص</span>
            <div className="text-2xl font-bold text-green-400">
              {formatPersianMoney(data.gross_profit)}
            </div>
          </div>

          {/* Gross Margin */}
          <div className="flex items-center justify-center p-3 bg-gray-700 rounded-xl">
            <span className="text-sm text-gray-400 ml-2">حاشیه سود:</span>
            <span className="text-2xl font-bold text-green-400">
              {Number(data.gross_margin_percent).toLocaleString('fa-IR', {
                maximumFractionDigits: 1,
              })}
              ٪
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-3xl mb-3">📈</div>
          <p className="text-sm text-gray-400">
            برای نمایش اطلاعات درآمد، به API متصل شوید
          </p>
        </div>
      )}
    </DashboardCard>
  );
}
