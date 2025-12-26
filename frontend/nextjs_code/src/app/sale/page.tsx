'use client';

import { useMemo, useState } from 'react';
import { useActiveSales } from '@/hooks/useActiveSales';
import {
  matchesSearch,
  matchesTimeFilter,
} from '@/libs/tools/saleFilters';

import { SaleTopBar } from '@/components/sale/SaleTopBar';
import { NewSaleButton } from '@/components/sale/NewSaleButton';
import { SaleFilters } from '@/components/sale/SaleFilters';
import { SaleGrid } from '@/components/sale/SaleGrid';
import { EmptyState } from '@/components/sale/EmptyState';
import { ErrorState } from '@/components/sale/ErrorState';

export default function SalePage() {
  const { sales, totalCount, error, retry } = useActiveSales();

  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<string | undefined>();

  const visibleSales = useMemo(() => {
    return sales.filter(
      (sale) =>
        matchesSearch(sale, search) &&
        matchesTimeFilter(sale.opened_at, timeFilter as any)
    );
  }, [sales, search, timeFilter]);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <SaleTopBar totalCount={totalCount} />

      <div className="my-4">
        <NewSaleButton />
      </div>

      <SaleFilters
        search={search}
        onSearchChange={setSearch}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        onClear={() => {
          setSearch('');
          setTimeFilter(undefined);
        }}
      />

      {error && (
        <ErrorState message={error} onRetry={retry} />
      )}

      {!error && visibleSales.length === 0 && (
        <EmptyState />
      )}

      {visibleSales.length > 0 && (
        <SaleGrid sales={visibleSales} />
      )}
    </div>
  );
}
