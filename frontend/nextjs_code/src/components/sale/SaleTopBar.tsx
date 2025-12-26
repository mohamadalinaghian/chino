/**
 * Top bar for sale dashboard
 *
 * Features:
 * - Total count display
 * - Manual refresh button
 * - Responsive design
 */

'use client';

import { useState } from 'react';

interface Props {
  totalCount: number;
  staffName?: string;
  onRefresh?: () => Promise<void>;
}

export function SaleTopBar({ totalCount, staffName, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Handle manual refresh
   */
  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Title and Count */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
          فروش‌های فعال
        </h1>

        <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
          <span className="font-medium">{totalCount} فروش باز</span>
          {staffName && (
            <>
              <span className="text-gray-300">•</span>
              <span className="truncate">{staffName}</span>
            </>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="
            flex items-center gap-2 px-4 py-2
            bg-gray-100 hover:bg-gray-200
            rounded-xl text-gray-700 text-sm font-medium
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            shrink-0
          "
          title="به‌روزرسانی لیست"
        >
          <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
          <span className="hidden sm:inline">به‌روزرسانی</span>
        </button>
      )}
    </div>
  );
}
