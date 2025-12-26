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
    <div className="flex flex-col gap-4 my-6 bg-gray-800 rounded-2xl p-5 shadow-xl border border-gray-700">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجو در میز، نام مهمان یا اپراتور..."
          className="
          w-full rounded-xl bg-gray-700 border border-gray-600
          pr-12 pl-4 py-3.5 text-sm text-gray-100
          placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          transition-all
        "
        />
      </div>

      {/* Time Filter and Clear Button */}
      <div className="flex gap-3 items-center">
        <select
          value={timeFilter ?? ''}
          onChange={(e) =>
            onTimeFilterChange((e.target.value as TimeFilter) || undefined)
          }
          className="
          flex-1 rounded-xl bg-gray-700 border border-gray-600
          px-4 py-3 text-sm text-gray-100
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
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
            px-4 py-3 rounded-xl
            bg-gray-700 hover:bg-gray-600
            text-gray-300 hover:text-white text-lg font-medium
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
