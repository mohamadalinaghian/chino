'use client';
import { formatPersianMoney } from '@/utils/persianUtils';

interface SaleItemsColumnProps {
  unpaidItems: any[];
  partiallyPaidItems: any[]; // unused now — can be used later
  selectedItems: Array<{ itemId: string; quantity: number }>;
  animatingItemId?: string | null;
  toggleItemSelection: (item: any) => void;
  updateItemQuantity: (itemId: string, qty: number, item: any) => void;
  selectAllItems: () => void;
  clearSelection: () => void;
  THEME_COLORS: {
    bgSecondary: string;
    surface: string;
    border: string;
    text: string;
    accent?: string;
  };
}

export function SaleItemsColumn({
  unpaidItems,
  selectedItems,
  animatingItemId,
  toggleItemSelection,
  updateItemQuantity,
  selectAllItems,
  clearSelection,
  THEME_COLORS,
}: SaleItemsColumnProps) {
  return (
    <div
      className="lg:col-span-4 flex flex-col rounded-2xl shadow-md overflow-hidden h-full"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: THEME_COLORS.border }}
      >
        <h2
          className="text-lg font-bold tracking-tight"
          style={{ color: THEME_COLORS.text }}
        >
          اقلام برای پرداخت ({unpaidItems.length})
        </h2>

        <div className="flex gap-3">
          <button
            onClick={selectAllItems}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white/10 border transition-all duration-200 hover:bg-white/20 hover:shadow-sm active:scale-95"
            style={{ borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
          >
            انتخاب همه
          </button>

          {selectedItems.length > 0 && (
            <button
              onClick={clearSelection}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-600 border border-red-500/30 transition-all duration-200 hover:bg-red-500/20 hover:shadow-sm active:scale-95"
            >
              پاک کردن
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {unpaidItems.map((item) => {
          const selected = selectedItems.find((s) => s.itemId === item.id);
          const selectedQty = selected?.quantity ?? 0;

          const extrasTotal =
            item.extras?.reduce(
              (sum: number, e: any) => sum + e.unit_price * e.quantity,
              0
            ) ?? 0;

          const extrasPerUnit =
            item.quantity > 0 ? extrasTotal / item.quantity : 0;

          const itemTotal =
            item.quantity_remaining * item.unit_price +
            extrasPerUnit * item.quantity_remaining;

          const isSelected = !!selected;
          const isAnimating = animatingItemId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => toggleItemSelection(item)}
              className={`
                group rounded-xl p-4 cursor-pointer transition-all duration-200
                border hover:shadow-md active:scale-[0.98]
                ${isSelected
                  ? 'border-2 bg-gradient-to-r from-blue-500/5 to-indigo-500/5'
                  : 'border-transparent'
                }
                ${isAnimating ? 'animate-pulse-subtle' : ''}
              `}
              style={{
                backgroundColor: THEME_COLORS.surface,
                borderColor: isSelected ? '#3b82f6' : undefined,
              }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="font-medium text-base mb-1 group-hover:text-blue-600 transition-colors">
                    {item.product_name}
                  </div>

                  {item.quantity_remaining > 1 && isSelected && (
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedQty > 1) {
                            updateItemQuantity(item.id, selectedQty - 1, item);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-gray-200/70 hover:bg-gray-300/70 active:scale-95 transition-all flex items-center justify-center text-lg font-bold disabled:opacity-40"
                        disabled={selectedQty <= 1}
                      >
                        −
                      </button>

                      <span className="w-10 text-center font-medium tabular-nums">
                        {selectedQty}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedQty < item.quantity_remaining) {
                            updateItemQuantity(item.id, selectedQty + 1, item);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-gray-200/70 hover:bg-gray-300/70 active:scale-95 transition-all flex items-center justify-center text-lg font-bold disabled:opacity-40"
                        disabled={selectedQty >= item.quantity_remaining}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className="font-bold text-lg tabular-nums whitespace-nowrap pt-1"
                  style={{ color: isSelected ? '#2563eb' : THEME_COLORS.text }}
                >
                  {formatPersianMoney(itemTotal)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
