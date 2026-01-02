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
    <div className="flex flex-col gap-2 my-3 bg-gray-800 rounded-lg p-3 shadow-md border border-gray-700">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجو در میز، نام مهمان یا اپراتور..."
          className="
          w-full rounded-lg bg-gray-700 border border-gray-600
          pr-10 pl-3 py-2 text-xs text-gray-100
          placeholder-gray-400
          focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
          transition-all
        "
        />
      </div>

      {/* Time Filter and Clear Button */}
      <div className="flex gap-2 items-center">
        <select
          value={timeFilter ?? ''}
          onChange={(e) =>
            onTimeFilterChange((e.target.value as TimeFilter) || undefined)
          }
          className="
          flex-1 rounded-lg bg-gray-700 border border-gray-600
          px-3 py-2 text-xs text-gray-100
          focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
          transition-all
        "
        >
          <option value="">⏱️ همه زمان‌ها</option>
          <option value="LT_30">🟢 کمتر از ۳۰ دقیقه</option>
          <option value="30_90">🟡 ۳۰ تا ۹۰ دقیقه</option>
          <option value="GT_90">🔴 بیش از ۹۰ دقیقه</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="
            px-3 py-2 rounded-lg
            bg-gray-700 hover:bg-gray-600
            text-gray-300 hover:text-white text-sm font-medium
            transition-all shrink-0
          "
          >
            ✕
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span>✓</span>
          <span>فیلترهای فعال اعمال شده</span>
        </div>
      )}
    </div>
  );
