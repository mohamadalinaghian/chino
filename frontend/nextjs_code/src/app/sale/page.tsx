/**
 * Sale dashboard page
 *
 * Single Responsibility: Display sale dashboard with permission-based views
 *
 * Features:
 * - Permission-based dashboard cards (statistics, revenue)
 * - Active sales list with real-time updates
 * - Search and time filters
 * - Loading skeleton
 * - Error handling with retry
 * - Mobile responsive
 *
 * Different views based on permissions:
 * - All users: See active sales + statistics
 * - Users with 'sale.view_revenue_data': Also see revenue metrics
 */

'use client';

import { useMemo, useState } from 'react';
import { useActiveSales } from '@/hooks/useActiveSales';
import { usePermissions, SalePermissions } from '@/hooks/usePermissions';
import { matchesSearch, matchesTimeFilter } from '@/libs/tools/saleFilters';
import { SaleTopBar } from '@/components/sale/SaleTopBar';
import { NewSaleButton } from '@/components/sale/NewSaleButton';
import { SaleFilters } from '@/components/sale/SaleFilters';
import { SaleGrid } from '@/components/sale/SaleGrid';
import { EmptyState } from '@/components/sale/EmptyState';
import { ErrorState } from '@/components/sale/ErrorState';
import { LoadingSkeleton } from '@/components/sale/LoadingSkeleton';
import { SaleStatisticsCard } from '@/components/dashboard/SaleStatisticsCard';
import { TodayRevenueCard } from '@/components/dashboard/TodayRevenueCard';
import { PermissionGate } from '@/components/common/PermissionGate';
import type { TimeFilter } from '@/types/saleType';

export default function SalePage() {
  const { sales, totalCount, loading, error, retry, refresh } = useActiveSales();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter | undefined>();

  /**
   * Permission checks
   */
  const canViewRevenue = hasPermission(SalePermissions.VIEW_REVENUE_DATA);

  /**
   * Filter sales based on search and time filter
   */
  const visibleSales = useMemo(() => {
    return sales.filter(
      (sale) =>
        matchesSearch(sale, search) &&
        matchesTimeFilter(sale.opened_at, timeFilter)
    );
  }, [sales, search, timeFilter]);

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearch('');
    setTimeFilter(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 fixed inset-0 overflow-y-auto">
      {/* Header - Sticky on mobile */}
      <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 shadow-xl">
        <div className="max-w-7xl mx-auto p-4">
          <SaleTopBar totalCount={totalCount} onRefresh={refresh} />
          {/* New Sale Button - Mobile friendly */}
          <div className="mt-4">
            <NewSaleButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Dashboard Cards - Permission Based */}
        {!loading && !error && sales.length > 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {/* Statistics Card - Visible to all */}
            <SaleStatisticsCard
              sales={sales}
              loading={loading}
              error={error}
            />

            {/* Revenue Card - Only for users with permission */}
            <PermissionGate permission={SalePermissions.VIEW_REVENUE_DATA}>
              <TodayRevenueCard
                loading={false}
                error={undefined}
                data={undefined}
              />
            </PermissionGate>
          </div>
        )}

        {/* Filters */}
        <SaleFilters
          search={search}
          onSearchChange={setSearch}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          onClear={handleClearFilters}
        />

        {/* Loading State */}
        {loading && !error && <LoadingSkeleton />}

        {/* Error State */}
        {error && <ErrorState message={error} onRetry={retry} />}

        {/* Empty State */}
        {!loading && !error && visibleSales.length === 0 && sales.length === 0 && (
          <EmptyState />
        )}

        {/* No Results State (after filtering) */}
        {!loading && !error && visibleSales.length === 0 && sales.length > 0 && (
          <div className="text-center py-12">
            <div className="text-2xl mb-6 opacity-60">🔍</div>
            <p className="text-gray-400 mb-6 text-lg">
              نتیجه‌ای با این فیلترها یافت نشد
            </p>
            <button
              onClick={handleClearFilters}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              پاک کردن فیلترها
            </button>
          </div>
        )}

        {/* Sale Grid */}
        {!loading && !error && visibleSales.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-200">
                فروش‌های فعال
              </h2>
              <span className="text-sm text-gray-400">
                {visibleSales.length.toLocaleString('fa-IR')} فروش
              </span>
            </div>
            <SaleGrid sales={visibleSales} />
          </>
        )}
      </main>
    </div>
  );
}
