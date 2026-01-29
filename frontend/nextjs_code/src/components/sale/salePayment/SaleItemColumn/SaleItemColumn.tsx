'use client';
import { formatPersianMoney } from '@/utils/persianUtils';
import { CheckSquare, X, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface SaleItemsColumnProps {
  unpaidItems: any[];
  partiallyPaidItems: any[]; // unused now — can be used later
  selectedItems: Array<{ itemId: string; quantity: number }>;
  animatingItemId?: string | null;
  toggleItemSelection: (item: any) => void;
  updateItemQuantity: (item: any, qty: number) => void;
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

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
  const allSelected = unpaidItems.length > 0 &&
    unpaidItems.every((item) => {
      const sel = selectedItems.find((s) => s.itemId === item.id);
      return sel && sel.quantity === item.quantity_remaining;
    });

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
          {!allSelected && (
            <button
              onClick={selectAllItems}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white/10 dark:bg-black/10 border transition-all duration-200 hover:bg-white/20 dark:hover:bg-black/20 hover:shadow-sm active:scale-95 flex items-center gap-2"
              style={{ borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
            >
              <CheckSquare className="w-4 h-4" />
              انتخاب همه
            </button>
          )}

          {selectedItems.length > 0 && (
            <button
              onClick={clearSelection}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-500/30 dark:border-red-900/30 transition-all duration-200 hover:bg-red-500/20 dark:hover:bg-red-900/20 hover:shadow-sm active:scale-95 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              پاک کردن
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      <motion.div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {unpaidItems.map((item) => {
          const selected = selectedItems.find((s) => s.itemId === item.id);
          const selectedQty = selected?.quantity ?? 0;
          const isSelected = !!selected;
          const effectiveQty = isSelected ? selectedQty : item.quantity_remaining;

          const extrasTotal =
            item.extras?.reduce(
              (sum: number, e: any) => sum + e.unit_price * e.quantity,
              0
            ) ?? 0;

          const extrasPerUnit =
            item.quantity > 0 ? extrasTotal / item.quantity : 0;

          const itemSubTotal = effectiveQty * item.unit_price;
          const extrasSubTotal = extrasPerUnit * effectiveQty;
          const itemTotal = itemSubTotal + extrasSubTotal;

          const isAnimating = animatingItemId === item.id;

          return (
            <motion.div
              key={item.id}
              layout
              variants={itemVariants}
              onClick={() => toggleItemSelection(item)}
              className={`
                group rounded-xl p-4 cursor-pointer transition-all duration-200
                border hover:shadow-md active:scale-[0.98]
                ${isSelected
                  ? 'border-2 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-900/10 dark:to-indigo-900/10'
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
                  <div className="font-medium text-base mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.product_name}
                  </div>

                  {/* Quantity and Unit Price */}
                  {item.quantity_remaining > 1 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {effectiveQty} × {formatPersianMoney(item.unit_price)} = {formatPersianMoney(itemSubTotal)}
                    </div>
                  )}

                  {/* Extras */}
                  {item.extras?.length > 0 && (
                    <div className="space-y-1 mt-2 mb-2 text-sm text-gray-500 dark:text-gray-400">
                      {item.extras.map((extra: any, idx: number) => (
                        <div key={idx}>
                          افزونه: {extra.product_name || 'افزونه'} × {extra.quantity} : {formatPersianMoney(extra.unit_price * extra.quantity)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stepper when selected and qty >1 */}
                  {item.quantity_remaining > 1 && isSelected && (
                    <motion.div
                      className="flex items-center gap-3 mt-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedQty > 1) {
                            updateItemQuantity(item, selectedQty - 1, item);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-gray-200/70 dark:bg-gray-700/70 hover:bg-gray-300/70 dark:hover:bg-gray-600/70 active:scale-95 transition-all flex items-center justify-center text-lg font-bold disabled:opacity-40"
                        disabled={selectedQty <= 1}
                      >
                        <Minus className="w-5 h-5" />
                      </button>

                      <span className="w-12 text-center font-medium tabular-nums text-base">
                        {selectedQty}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedQty < item.quantity_remaining) {
                            updateItemQuantity(item, selectedQty + 1, item);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-gray-200/70 dark:bg-gray-700/70 hover:bg-gray-300/70 dark:hover:bg-gray-600/70 active:scale-95 transition-all flex items-center justify-center text-lg font-bold disabled:opacity-40"
                        disabled={selectedQty >= item.quantity_remaining}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </div>

                <div
                  className="font-bold text-lg tabular-nums whitespace-nowrap pt-1"
                  style={{ color: isSelected ? '#2563eb' : THEME_COLORS.text }}
                >
                  {formatPersianMoney(itemTotal)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
