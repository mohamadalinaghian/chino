/**
 * Sale filters component
 *
 * Features:
 * - Search input
 * - Time filter dropdown
 * - Clear filters button
 * - Mobile responsive
 */

'use client';

import type { TimeFilter } from '@/types/saleType';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  timeFilter?: TimeFilter;
  onTimeFilterChange: (value?: TimeFilter) => void;
  onClear: () => void;
}

export function SaleFilters({
  search,
  onSearchChange,
  timeFilter,
  onTimeFilterChange,
  onClear,
}: Props) {
  /**
   * Check if any filter is active
   */
  const hasActiveFilters = Boolean(search || timeFilter);

  return (
    <div className="flex flex-col gap-3 my-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجو در میز، نام مهمان یا اپراتور..."
          className="
            w-full rounded-xl border border-gray-200
            pr-10 pl-4 py-3 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-shadow
          "
        />
      </div>

      {/* Time Filter and Clear Button */}
      <div className="flex gap-2 items-center">
        {/* Time Filter Dropdown */}
        <select
          value={timeFilter ?? ''}
          onChange={(e) =>
            onTimeFilterChange((e.target.value as TimeFilter) || undefined)
          }
          className="
            flex-1 rounded-xl border border-gray-200
            px-4 py-2.5 text-sm
            bg-white
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            transition-shadow
          "
        >
          <option value="">⏱️ همه زمان‌ها</option>
          <option value="LT_30">🟢 کمتر از ۳۰ دقیقه</option>
          <option value="30_90">🟡 ۳۰ تا ۹۰ دقیقه</option>
          <option value="GT_90">🔴 بیش از ۹۰ دقیقه</option>
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="
              px-4 py-2.5 rounded-xl
              bg-gray-100 hover:bg-gray-200
              text-gray-700 text-sm font-medium
              transition-colors
              shrink-0
            "
            title="پاک کردن فیلترها"
          >
            ✕
          </button>
        )}
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span>✓</span>
          <span>فیلترهای فعال اعمال شده</span>
        </div>
      )}
    </div>
  );
}
