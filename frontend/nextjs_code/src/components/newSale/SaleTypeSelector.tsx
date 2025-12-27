/**
 * Sale Type Selector Component (Updated with Real Tables)
 *
 * Features:
 * - Toggle between dine-in and takeaway
 * - Table selection for dine-in (fetched from API)
 * - Visual indicators for inactive tables
 * - Capacity hints on hover
 * - Loading and error states
 */

'use client';

import { NewSaleType } from '@/types/newSaleTypes';
import { useTables } from '@/hooks/useTables';

interface Props {
  value: NewSaleType;
  onChange: (type: NewSaleType) => void;
  tableId: number | null;
  onTableChange: (tableId: number | null) => void;
}

export function SaleTypeSelector({
  value,
  onChange,
  tableId,
  onTableChange,
}: Props) {
  const { tables, loading, error } = useTables();
  const isDineIn = value === NewSaleType.DINE_IN;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      {/* Toggle */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => onChange(NewSaleType.DINE_IN)}
          className={`
            flex-1 py-3 px-4 rounded-lg font-medium transition-all
            ${
              isDineIn
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-650'
            }
          `}
        >
          🍽️ سرو در محل
        </button>
        <button
          onClick={() => {
            onChange(NewSaleType.TAKEAWAY);
            onTableChange(null); // Clear table when switching to takeaway
          }}
          className={`
            flex-1 py-3 px-4 rounded-lg font-medium transition-all
            ${
              !isDineIn
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-650'
            }
          `}
        >
          🥡 بیرون‌بر
        </button>
      </div>

      {/* Table Selection (only for dine-in) */}
      {isDineIn && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            انتخاب میز <span className="text-red-400">*</span>
          </label>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin text-3xl mb-2">⏳</div>
              <p className="text-sm text-gray-400">در حال بارگذاری میزها...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-red-300 underline hover:text-red-200"
              >
                تلاش مجدد
              </button>
            </div>
          )}

          {/* Tables Grid */}
          {!loading && !error && (
            <>
              {tables.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>میزی یافت نشد</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => table.is_active && onTableChange(table.id)}
                      disabled={!table.is_active}
                      title={
                        table.is_active
                          ? `ظرفیت: ${table.capacity} نفر`
                          : 'میز غیرفعال'
                      }
                      className={`
                        group relative
                        aspect-square rounded-lg font-bold text-lg
                        transition-all
                        ${
                          tableId === table.id
                            ? 'bg-green-600 text-white shadow-lg scale-105 ring-2 ring-green-400'
                            : table.is_active
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-650 hover:scale-105'
                            : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      {/* Table Name */}
                      <span>{table.name}</span>

                      {/* Capacity Hint (on hover for active tables) */}
                      {table.is_active && (
                        <span
                          className="
                            absolute -top-8 left-1/2 -translate-x-1/2
                            bg-gray-900 text-gray-200
                            px-2 py-1 rounded text-xs
                            opacity-0 group-hover:opacity-100
                            transition-opacity
                            whitespace-nowrap
                            pointer-events-none
                            shadow-lg
                          "
                        >
                          {table.capacity} نفر
                        </span>
                      )}

                      {/* Inactive Indicator */}
                      {!table.is_active && (
                        <span className="absolute top-1 right-1 text-xs">🚫</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selection Hint */}
              {!tableId && tables.length > 0 && (
                <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>لطفاً یک میز انتخاب کنید</span>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
