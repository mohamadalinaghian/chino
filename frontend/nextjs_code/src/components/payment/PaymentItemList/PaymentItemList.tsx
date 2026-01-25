'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { ISaleItemDetail } from '@/types/sale';
import { IItemSelection } from '@/hooks/usePayment';

interface PaymentItemListProps {
  unpaidItems: ISaleItemDetail[];
  paidItems: ISaleItemDetail[];
  selectedItems: IItemSelection[];
  selectAllItems: boolean;
  onItemSelectionChange: (itemId: number, quantity: number, maxQuantity: number) => void;
  onSelectAllToggle: () => void;
}

export function PaymentItemList({
  unpaidItems,
  paidItems,
  selectedItems,
  selectAllItems,
  onItemSelectionChange,
  onSelectAllToggle,
}: PaymentItemListProps) {
  return (
    <div className="col-span-3 flex flex-col overflow-hidden border-l" style={{ borderColor: THEME_COLORS.border }}>
      {/* Quick Select Bar */}
      <div
        className="flex-shrink-0 px-2 py-1 border-b flex items-center justify-between"
        style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.border }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAllToggle}
            className="px-4 py-2 rounded font-bold text-sm border-2 transition-all"
            style={{
              backgroundColor: selectAllItems ? THEME_COLORS.accent : 'transparent',
              borderColor: THEME_COLORS.accent,
              color: selectAllItems ? '#fff' : THEME_COLORS.text,
            }}
          >
            همه اقلام
          </button>
          <span className="text-sm" style={{ color: THEME_COLORS.subtext }}>
            {unpaidItems.length} مورد پرداخت نشده
          </span>
        </div>
      </div>

      {/* Scrollable Items List */}
      <div className="flex-3 overflow-y-auto px-4 py-2">
        <div className="space-y-2">
          {/* Unpaid Items */}
          {unpaidItems.map((item) => {
            const selection = selectedItems.find((s) => s.itemId === item.id);
            const selectedQty = selectAllItems ? item.quantity : (selection?.quantity || 0);
            const isSelected = selectAllItems || selectedQty > 0;

            // Calculate item total including extras
            const baseItemTotal = selectedQty * item.unit_price;
            const extrasTotal = item.extras?.reduce(
              (sum, ext) => sum + ext.unit_price * ext.quantity,
              0
            ) || 0;
            const itemTotal = baseItemTotal + (isSelected ? extrasTotal : 0);

            return (
              <div
                key={item.id}
                className="rounded border overflow-hidden"
                style={{
                  backgroundColor: isSelected ? `${THEME_COLORS.accent}15` : THEME_COLORS.surface,
                  borderColor: isSelected ? THEME_COLORS.accent : THEME_COLORS.border,
                }}
              >
                {/* Main Item Row */}
                <div className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onItemSelectionChange(item.id, item.quantity, item.quantity);
                      } else {
                        onItemSelectionChange(item.id, 0, item.quantity);
                      }
                    }}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                      {item.product_name}
                    </div>
                    <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                      {formatPersianMoney(item.unit_price)} × {item.quantity}
                    </div>
                  </div>
                  {isSelected && item.quantity > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onItemSelectionChange(item.id, Math.max(0, selectedQty - 1), item.quantity)}
                        className="w-8 h-8 rounded font-bold flex items-center justify-center"
                        style={{ backgroundColor: THEME_COLORS.red, color: '#fff' }}
                      >
                        −
                      </button>
                      <div className="w-10 text-center font-bold" style={{ color: THEME_COLORS.text }}>
                        {selectedQty}
                      </div>
                      <button
                        onClick={() => onItemSelectionChange(item.id, Math.min(item.quantity, selectedQty + 1), item.quantity)}
                        className="w-8 h-8 rounded font-bold flex items-center justify-center"
                        style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
                        disabled={selectedQty >= item.quantity}
                      >
                        +
                      </button>
                    </div>
                  )}
                  {isSelected && (
                    <div className="text-right min-w-20">
                      <div className="text-lg font-bold" style={{ color: THEME_COLORS.green }}>
                        {formatPersianMoney(itemTotal)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Extras Section */}
                {item.extras && item.extras.length > 0 && (
                  <div
                    className="px-3 py-2 border-t"
                    style={{
                      backgroundColor: isSelected ? `${THEME_COLORS.purple}10` : `${THEME_COLORS.surface}`,
                      borderColor: THEME_COLORS.border,
                    }}
                  >
                    <div className="text-xs font-bold mb-1" style={{ color: THEME_COLORS.purple }}>
                      افزودنی‌ها:
                    </div>
                    <div className="space-y-1">
                      {item.extras.map((extra) => (
                        <div
                          key={extra.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span style={{ color: THEME_COLORS.purple }}>+</span>
                            <span style={{ color: THEME_COLORS.text }}>{extra.product_name}</span>
                            <span style={{ color: THEME_COLORS.subtext }}>×{extra.quantity}</span>
                          </div>
                          <span style={{ color: THEME_COLORS.purple }}>
                            {formatPersianMoney(extra.unit_price * extra.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Paid Items */}
          {paidItems.length > 0 && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: THEME_COLORS.border }}>
              <div className="text-sm font-bold mb-2 px-2" style={{ color: THEME_COLORS.green }}>
                ✓ پرداخت شده ({paidItems.length})
              </div>
              {paidItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded opacity-50 overflow-hidden mb-2"
                  style={{ backgroundColor: THEME_COLORS.surface }}
                >
                  {/* Main Item */}
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="flex-1">
                      <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                        {item.product_name}
                      </div>
                      <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                        {formatPersianMoney(item.unit_price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: THEME_COLORS.green }}>
                      پرداخت شده
                    </div>
                  </div>

                  {/* Extras for paid items */}
                  {item.extras && item.extras.length > 0 && (
                    <div
                      className="px-3 py-2 border-t"
                      style={{ borderColor: THEME_COLORS.border }}
                    >
                      <div className="text-xs font-bold mb-1" style={{ color: THEME_COLORS.purple }}>
                        افزودنی‌ها:
                      </div>
                      {item.extras.map((extra) => (
                        <div
                          key={extra.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span style={{ color: THEME_COLORS.text }}>
                            + {extra.product_name} ×{extra.quantity}
                          </span>
                          <span style={{ color: THEME_COLORS.subtext }}>
                            {formatPersianMoney(extra.unit_price * extra.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
