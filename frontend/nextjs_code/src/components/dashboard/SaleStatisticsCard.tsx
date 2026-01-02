/**
 * Sale Statistics Card
 *
 * Single Responsibility: Display summary statistics for active sales
 *
 * Features:
 * - Total open sales count
 * - Total sales value
 * - Breakdown by sale type (dine-in vs takeaway)
 * - Mobile responsive
 */

'use client';

import { useMemo } from 'react';
import { DashboardCard } from './DashboardCard';
import type { SaleDashboardItem } from '@/types/saleType';

interface Props {
  sales: SaleDashboardItem[];
  loading?: boolean;
  error?: string;
}

export function SaleStatisticsCard({ sales, loading, error }: Props) {
  /**
   * Calculate statistics from sales data
   */
  const stats = useMemo(() => {
    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, sale) => {
      return sum + (sale.total_amount ? parseFloat(sale.total_amount) : 0);
    }, 0);

    const dineInCount = sales.filter((sale) => sale.table).length;
    const takeawayCount = totalSales - dineInCount;

    const averageValue = totalSales > 0 ? totalValue / totalSales : 0;

    return {
      totalSales,
      totalValue,
      dineInCount,
      takeawayCount,
      averageValue,
    };
  }, [sales]);

  return (
    <DashboardCard
      title="آمار فروش‌های فعال"
      icon="📊"
      loading={loading}
      error={error}
      theme="info"
    >
      <div className="space-y-4">
        {/* Total Sales */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">تعداد کل فروش‌ها</span>
          <span className="text-2xl font-bold text-blue-400">
            {stats.totalSales.toLocaleString('fa-IR')}
          </span>
        </div>

        {/* Total Value */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">مجموع ارزش</span>
          <div className="text-left">
            <div className="text-xl font-bold text-green-400">
              {stats.totalValue.toLocaleString('fa-IR')}
            </div>
            <div className="text-xs text-gray-500">هزار تومان</div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700"></div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-700 rounded-xl">
            <div className="text-xs text-gray-400 mb-1">🍽️ سالنی</div>
            <div className="text-lg font-bold text-gray-200">
              {stats.dineInCount.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-700 rounded-xl">
            <div className="text-xs text-gray-400 mb-1">🥡 بیرون‌بر</div>
            <div className="text-lg font-bold text-gray-200">
              {stats.takeawayCount.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>

        {/* Average Value */}
        {stats.totalSales > 0 && (
          <>
            <div className="border-t border-gray-700"></div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">میانگین ارزش</span>
              <div className="text-left">
                <div className="text-lg font-bold text-indigo-400">
                  {stats.averageValue.toLocaleString('fa-IR', {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs text-gray-500">هزار تومان</div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardCard>
  );
}
