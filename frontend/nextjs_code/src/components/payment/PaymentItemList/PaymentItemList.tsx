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
  onItemToggleFull: (itemId: number, maxQty: number) => void;
  onItemQuantityChange: (itemId: number, qty: number, maxQty: number) => void;
  onSelectAllToggle: () => void;
}

export function PaymentItemList({
  unpaidItems,
  paidItems,
  selectedItems,
  selectAllItems,
  onItemToggleFull,
  onItemQuantityChange,
  onSelectAllToggle,
}: PaymentItemListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Quick bar */}
      <div
        className="flex-shrink-0 px-3 py-2 border-b flex items-center justify-between text-sm"
        style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.border }}
      >
        <button
          onClick={onSelectAllToggle}
          className="px-3 py-1.5 rounded font-medium text-sm border transition-all"
          style={{
            backgroundColor: selectAllItems ? THEME_COLORS.accent : 'transparent',
            borderColor: THEME_COLORS.accent,
            color: selectAllItems ? 'white' : THEME_COLORS.text,
          }}
        >
          همه اقلام
        </button>
        <span style={{ color: THEME_COLORS.subtext }}>
          {unpaidItems.length} مورد پرداخت‌نشده
        </span>
      </div>

      {/* Scrollable items */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {unpaidItems.map((item) => {
          const selection = selectedItems.find((s) => s.itemId === item.id);
          const qty = selectAllItems ? item.quantity : (selection?.quantity ?? 0);
          const isSelected = qty > 0;

          const baseTotal = qty * Number(item.unit_price);
          const extrasTotal =
            item.extras?.reduce((sum, e) => sum + Number(e.unit_price) * e.quantity, 0) || 0;
          const total = baseTotal + (isSelected ? extrasTotal : 0);

          return (
            <div
              key={item.id}
              onClick={() => onItemToggleFull(item.id, item.quantity)}
              className={`rounded-lg border overflow-hidden cursor-pointer transition-all ${
                isSelected ? 'border-2 shadow-sm' : ''
              }`}
              style={{
                backgroundColor: isSelected ? `${THEME_COLORS.accent}10` : THEME_COLORS.surface,
                borderColor: isSelected ? THEME_COLORS.accent : THEME_COLORS.border,
              }}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: THEME_COLORS.text }}>
                    {item.product_name}
                  </div>
                  <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                    {formatPersianMoney(item.unit_price)} × {item.quantity}
                  </div>
                </div>

                {isSelected && item.quantity > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemQuantityChange(item.id, Math.max(0, qty - 1), item.quantity);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: THEME_COLORS.red + '30', color: THEME_COLORS.red }}
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-bold text-lg" style={{ color: THEME_COLORS.text }}>
                      {qty}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemQuantityChange(item.id, Math.min(item.quantity, qty + 1), item.quantity);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: THEME_COLORS.green + '30', color: THEME_COLORS.green }}
                      disabled={qty >= item.quantity}
                    >
                      +
                    </button>
                  </div>
                )}

                {isSelected && (
                  <div className="text-right min-w-[90px]">
                    <div className="text-lg font-bold" style={{ color: THEME_COLORS.green }}>
                      {formatPersianMoney(total)}
                    </div>
                  </div>
                )}
              </div>

              {/* Extras */}
              {item.extras?.length ? (
                <div
                  className="px-3 py-2 border-t text-sm"
                  style={{ borderColor: THEME_COLORS.border, backgroundColor: isSelected ? `${THEME_COLORS.purple}08` : undefined }}
                >
                  <div className="text-xs font-medium mb-1" style={{ color: THEME_COLORS.purple }}>
                    افزودنی‌ها
                  </div>
                  {item.extras.map((ex) => (
                    <div key={ex.id} className="flex justify-between">
                      <span style={{ color: THEME_COLORS.text }}>
                        + {ex.product_name} ×{ex.quantity}
                      </span>
                      <span style={{ color: THEME_COLORS.purple }}>
                        {formatPersianMoney(ex.unit_price * ex.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        {paidItems.length > 0 && (
          <div className="mt-5 pt-4 border-t" style={{ borderColor: THEME_COLORS.border }}>
            <div className="text-sm font-semibold mb-2 px-1" style={{ color: THEME_COLORS.green }}>
              پرداخت‌شده ({paidItems.length})
            </div>
            {paidItems.map((item) => (
              <div
                key={item.id}
                className="rounded bg-opacity-60 px-3 py-2.5 mb-1.5 text-sm"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.product_name}</span>
                    <div style={{ color: THEME_COLORS.subtext }}>
                      {formatPersianMoney(item.unit_price)} × {item.quantity}
                    </div>
                  </div>
                  <span className="font-medium" style={{ color: THEME_COLORS.green }}>
                    پرداخت شده
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
