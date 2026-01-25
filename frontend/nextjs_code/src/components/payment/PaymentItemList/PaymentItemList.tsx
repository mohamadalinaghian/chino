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
  // Calculate selection percentage for visual indicator
  const getSelectionPercentage = (item: ISaleItemDetail, selectedQty: number): number => {
    if (selectedQty <= 0) return 0;
    return Math.round((selectedQty / item.quantity) * 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick bar */}
      <div
        className="flex-shrink-0 px-4 py-3 border-b flex items-center justify-between"
        style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.border }}
      >
        <button
          onClick={onSelectAllToggle}
          className="px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all"
          style={{
            backgroundColor: selectAllItems ? THEME_COLORS.accent : 'transparent',
            borderColor: THEME_COLORS.accent,
            color: selectAllItems ? 'white' : THEME_COLORS.text,
          }}
        >
          {selectAllItems ? 'همه انتخاب شده' : 'انتخاب همه'}
        </button>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: `${THEME_COLORS.orange}20`, color: THEME_COLORS.orange }}
          >
            {unpaidItems.length} پرداخت‌نشده
          </span>
          {paidItems.length > 0 && (
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: `${THEME_COLORS.green}20`, color: THEME_COLORS.green }}
            >
              {paidItems.length} پرداخت‌شده
            </span>
          )}
        </div>
      </div>

      {/* Scrollable items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {unpaidItems.map((item) => {
          const selection = selectedItems.find((s) => s.itemId === item.id);
          const qty = selectAllItems ? item.quantity : (selection?.quantity ?? 0);
          const isSelected = qty > 0;
          const isPartiallySelected = isSelected && qty < item.quantity;
          const selectionPercent = getSelectionPercentage(item, qty);

          const baseTotal = qty * Number(item.unit_price);
          const extrasTotal =
            item.extras?.reduce((sum, e) => sum + Number(e.unit_price) * e.quantity, 0) || 0;
          const total = baseTotal + (isSelected ? extrasTotal : 0);
          const fullItemTotal = item.quantity * Number(item.unit_price) + extrasTotal;

          return (
            <div
              key={item.id}
              onClick={() => onItemToggleFull(item.id, item.quantity)}
              className="rounded-xl overflow-hidden cursor-pointer transition-all relative"
              style={{
                border: `2px solid ${isSelected ? THEME_COLORS.accent : THEME_COLORS.border}`,
                boxShadow: isSelected ? `0 4px 12px ${THEME_COLORS.accent}30` : 'none',
              }}
            >
              {/* Background payment indicator bar */}
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  background: isSelected
                    ? `linear-gradient(to left, ${THEME_COLORS.accent}25 ${selectionPercent}%, transparent ${selectionPercent}%)`
                    : 'transparent',
                }}
              />

              {/* Content */}
              <div className="relative">
                <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: isSelected ? 'transparent' : THEME_COLORS.surface }}>
                  {/* Selection indicator circle */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 relative overflow-hidden"
                    style={{
                      backgroundColor: isSelected ? THEME_COLORS.accent : THEME_COLORS.bgSecondary,
                      color: isSelected ? '#fff' : THEME_COLORS.subtext,
                      border: `2px solid ${isSelected ? THEME_COLORS.accent : THEME_COLORS.border}`,
                    }}
                  >
                    {/* Partial fill indicator inside circle */}
                    {isPartiallySelected && (
                      <div
                        className="absolute bottom-0 left-0 right-0 transition-all"
                        style={{
                          height: `${selectionPercent}%`,
                          backgroundColor: `${THEME_COLORS.accent}60`,
                        }}
                      />
                    )}
                    <span className="relative z-10">
                      {isSelected ? qty : '○'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base" style={{ color: THEME_COLORS.text }}>
                      {item.product_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: THEME_COLORS.subtext }}>
                      <span>{formatPersianMoney(item.unit_price)}</span>
                      <span>×</span>
                      <span className="font-medium">{item.quantity}</span>
                      {isPartiallySelected && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{ backgroundColor: `${THEME_COLORS.orange}20`, color: THEME_COLORS.orange }}
                        >
                          {selectionPercent}% انتخاب
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity controls for multi-quantity items */}
                  {item.quantity > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemQuantityChange(item.id, Math.max(0, qty - 1), item.quantity);
                        }}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-all"
                        style={{
                          backgroundColor: qty > 0 ? `${THEME_COLORS.red}25` : THEME_COLORS.bgSecondary,
                          color: qty > 0 ? THEME_COLORS.red : THEME_COLORS.subtext,
                          border: `2px solid ${qty > 0 ? THEME_COLORS.red : THEME_COLORS.border}`,
                        }}
                      >
                        −
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemQuantityChange(item.id, Math.min(item.quantity, qty + 1), item.quantity);
                        }}
                        disabled={qty >= item.quantity}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: qty < item.quantity ? `${THEME_COLORS.green}25` : THEME_COLORS.bgSecondary,
                          color: qty < item.quantity ? THEME_COLORS.green : THEME_COLORS.subtext,
                          border: `2px solid ${qty < item.quantity ? THEME_COLORS.green : THEME_COLORS.border}`,
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}

                  {/* Price display */}
                  <div className="text-right min-w-[100px]">
                    {isSelected ? (
                      <>
                        <div className="text-xl font-bold" style={{ color: THEME_COLORS.green }}>
                          {formatPersianMoney(total)}
                        </div>
                        {isPartiallySelected && (
                          <div className="text-xs line-through" style={{ color: THEME_COLORS.subtext }}>
                            {formatPersianMoney(fullItemTotal)}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-lg" style={{ color: THEME_COLORS.subtext }}>
                        {formatPersianMoney(fullItemTotal)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Extras section */}
                {item.extras?.length > 0 && (
                  <div
                    className="px-4 py-2.5 border-t"
                    style={{
                      borderColor: THEME_COLORS.border,
                      backgroundColor: isSelected ? `${THEME_COLORS.purple}10` : THEME_COLORS.bgSecondary,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: THEME_COLORS.purple, color: '#fff' }}
                      >
                        افزودنی
                      </span>
                    </div>
                    <div className="space-y-1">
                      {item.extras.map((ex) => (
                        <div key={ex.id} className="flex justify-between items-center text-sm">
                          <span style={{ color: THEME_COLORS.text }}>
                            {ex.product_name} ×{ex.quantity}
                          </span>
                          <span className="font-medium" style={{ color: THEME_COLORS.purple }}>
                            +{formatPersianMoney(ex.unit_price * ex.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Paid items section */}
        {paidItems.length > 0 && (
          <div className="mt-6 pt-4 border-t-2" style={{ borderColor: THEME_COLORS.green }}>
            <div
              className="flex items-center gap-2 mb-3 px-2"
              style={{ color: THEME_COLORS.green }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">پرداخت شده ({paidItems.length})</span>
            </div>

            {paidItems.map((item) => {
              const itemTotal = item.quantity * Number(item.unit_price) +
                (item.extras?.reduce((sum, e) => sum + Number(e.unit_price) * e.quantity, 0) || 0);

              return (
                <div
                  key={item.id}
                  className="rounded-xl mb-2 overflow-hidden"
                  style={{
                    backgroundColor: `${THEME_COLORS.green}10`,
                    border: `2px solid ${THEME_COLORS.green}40`,
                  }}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Checkmark indicator */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                        {item.product_name}
                      </div>
                      <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                        {formatPersianMoney(item.unit_price)} × {item.quantity}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold" style={{ color: THEME_COLORS.green }}>
                        {formatPersianMoney(itemTotal)}
                      </div>
                      <div className="text-xs" style={{ color: THEME_COLORS.green }}>
                        تسویه شده
                      </div>
                    </div>
                  </div>

                  {/* Paid item extras */}
                  {item.extras?.length > 0 && (
                    <div
                      className="px-4 py-2 border-t text-sm"
                      style={{ borderColor: `${THEME_COLORS.green}30` }}
                    >
                      {item.extras.map((ex) => (
                        <div key={ex.id} className="flex justify-between" style={{ color: THEME_COLORS.subtext }}>
                          <span>{ex.product_name} ×{ex.quantity}</span>
                          <span>+{formatPersianMoney(ex.unit_price * ex.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
