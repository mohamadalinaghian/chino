'use client';

import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { ISaleItemDetail, IPaymentDetail, PaymentMethod } from '@/types/sale';
import { IItemSelection } from '@/hooks/usePayment';

interface PaymentItemListProps {
  unpaidItems: ISaleItemDetail[];
  paidItems: ISaleItemDetail[];
  selectedItems: IItemSelection[];
  selectAllItems: boolean;
  payments?: IPaymentDetail[];
  onItemToggleFull: (itemId: number, maxQty: number) => void;
  onItemQuantityChange: (itemId: number, qty: number, maxQty: number) => void;
  onSelectAllToggle: () => void;
}

// Helper to format payment method in Persian
const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case PaymentMethod.CASH:
      return 'نقدی';
    case PaymentMethod.POS:
      return 'کارتخوان';
    case PaymentMethod.CARD_TRANSFER:
      return 'کارت به کارت';
    default:
      return method;
  }
};

// Helper to format date
const formatPaymentDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
};

export function PaymentItemList({
  unpaidItems,
  paidItems,
  selectedItems,
  selectAllItems,
  payments = [],
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
          // Use quantity_remaining as the max selectable quantity
          const maxSelectableQty = item.quantity_remaining;
          const selection = selectedItems.find((s) => s.itemId === item.id);
          const qty = selectAllItems ? maxSelectableQty : (selection?.quantity ?? 0);
          const isSelected = qty > 0;
          const isPartiallySelected = isSelected && qty < maxSelectableQty;
          const selectionPercent = getSelectionPercentage({ ...item, quantity: maxSelectableQty }, qty);

          const baseTotal = qty * Number(item.unit_price);
          // Extras proportional to selected quantity
          const extrasTotal =
            item.extras?.reduce((sum, e) => sum + Number(e.unit_price) * e.quantity, 0) || 0;
          const extrasProportional = item.quantity > 0
            ? (extrasTotal * qty / item.quantity)
            : 0;
          const total = baseTotal + (isSelected ? extrasProportional : 0);
          const remainingItemTotal = maxSelectableQty * Number(item.unit_price) +
            (item.quantity > 0 ? extrasTotal * maxSelectableQty / item.quantity : 0);

          return (
            <div
              key={item.id}
              onClick={() => onItemToggleFull(item.id, maxSelectableQty)}
              className={`rounded-xl overflow-hidden cursor-pointer relative transition-all duration-300 ease-out ${
                isSelected ? 'transform scale-[1.02] animate-pulse-once' : 'hover:scale-[1.01]'
              }`}
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
                      <span className="font-medium">{maxSelectableQty}</span>
                      {item.quantity_paid > 0 && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{ backgroundColor: `${THEME_COLORS.green}20`, color: THEME_COLORS.green }}
                        >
                          {item.quantity_paid} پرداخت شده
                        </span>
                      )}
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
                  {maxSelectableQty > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemQuantityChange(item.id, Math.max(0, qty - 1), maxSelectableQty);
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
                          onItemQuantityChange(item.id, Math.min(maxSelectableQty, qty + 1), maxSelectableQty);
                        }}
                        disabled={qty >= maxSelectableQty}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: qty < maxSelectableQty ? `${THEME_COLORS.green}25` : THEME_COLORS.bgSecondary,
                          color: qty < maxSelectableQty ? THEME_COLORS.green : THEME_COLORS.subtext,
                          border: `2px solid ${qty < maxSelectableQty ? THEME_COLORS.green : THEME_COLORS.border}`,
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
                            {formatPersianMoney(remainingItemTotal)}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-lg" style={{ color: THEME_COLORS.subtext }}>
                        {formatPersianMoney(remainingItemTotal)}
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

        {/* Paid items section - Enhanced styling */}
        {paidItems.length > 0 && (
          <div className="mt-6 pt-4 border-t-2" style={{ borderColor: '#10B981' }}>
            <div
              className="flex items-center gap-2 mb-3 px-2"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#10B981' }}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-bold" style={{ color: '#10B981' }}>اقلام پرداخت‌شده ({paidItems.length})</span>
            </div>

            {paidItems.map((item) => {
              // Show total for paid quantity
              const itemTotal = item.quantity_paid * Number(item.unit_price) +
                (item.extras?.reduce((sum, e) => sum + Number(e.unit_price) * e.quantity, 0) || 0);

              return (
                <div
                  key={item.id}
                  className="rounded-xl mb-2 overflow-hidden relative"
                  style={{
                    background: `linear-gradient(135deg, #10B98115 0%, #10B98108 100%)`,
                    border: `2px solid #10B981`,
                  }}
                >
                  {/* Paid stamp diagonal ribbon */}
                  <div
                    className="absolute top-2 left-2 px-3 py-0.5 text-xs font-bold text-white rounded"
                    style={{ backgroundColor: '#10B981' }}
                  >
                    ✓ تسویه شد
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Checkmark indicator */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                      style={{ backgroundColor: '#10B981', color: '#fff' }}
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
                        {formatPersianMoney(item.unit_price)} × {item.quantity_paid}
                        {item.quantity > item.quantity_paid && (
                          <span className="text-xs ml-2">(از {item.quantity})</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold" style={{ color: '#10B981', direction: 'ltr' }}>
                        {formatPersianMoney(itemTotal)}
                      </div>
                    </div>
                  </div>

                  {/* Paid item extras */}
                  {item.extras?.length > 0 && (
                    <div
                      className="px-4 py-2 border-t text-sm"
                      style={{ borderColor: '#10B98130' }}
                    >
                      {item.extras.map((ex) => (
                        <div key={ex.id} className="flex justify-between" style={{ color: THEME_COLORS.subtext }}>
                          <span>{ex.product_name} ×{ex.quantity}</span>
                          <span style={{ direction: 'ltr' }}>+{formatPersianMoney(ex.unit_price * ex.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Payment History Section */}
        {payments.length > 0 && (
          <div className="mt-6 pt-4 border-t-2" style={{ borderColor: THEME_COLORS.accent }}>
            <div className="flex items-center gap-2 mb-3 px-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: THEME_COLORS.accent }}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <span className="font-bold" style={{ color: THEME_COLORS.accent }}>
                تاریخچه پرداخت‌ها ({payments.length})
              </span>
            </div>

            <div className="space-y-2">
              {payments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: payment.status === 'VOID' ? `${THEME_COLORS.red}10` : `${THEME_COLORS.accent}08`,
                    border: `1px solid ${payment.status === 'VOID' ? THEME_COLORS.red : THEME_COLORS.accent}40`,
                  }}
                >
                  <div className="px-4 py-3">
                    {/* Payment header row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                        >
                          {index + 1}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{
                            backgroundColor: payment.method === 'CASH' ? `${THEME_COLORS.green}20` :
                                           payment.method === 'POS' ? `${THEME_COLORS.blue}20` : `${THEME_COLORS.purple}20`,
                            color: payment.method === 'CASH' ? THEME_COLORS.green :
                                   payment.method === 'POS' ? THEME_COLORS.blue : THEME_COLORS.purple,
                          }}
                        >
                          {formatPaymentMethod(payment.method)}
                        </span>
                        {payment.status === 'VOID' && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold"
                            style={{ backgroundColor: `${THEME_COLORS.red}20`, color: THEME_COLORS.red }}
                          >
                            باطل شده
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-lg font-bold ${payment.status === 'VOID' ? 'line-through' : ''}`}
                        style={{ color: payment.status === 'VOID' ? THEME_COLORS.red : '#10B981', direction: 'ltr' }}
                      >
                        {formatPersianMoney(payment.amount_applied)}
                      </div>
                    </div>

                    {/* Payment details row */}
                    <div className="flex items-center justify-between text-xs" style={{ color: THEME_COLORS.subtext }}>
                      <div className="flex items-center gap-3">
                        <span>توسط: {payment.received_by_name}</span>
                        {payment.tip_amount > 0 && (
                          <span style={{ color: THEME_COLORS.green }}>
                            انعام: {formatPersianMoney(payment.tip_amount)}
                          </span>
                        )}
                      </div>
                      <span>{formatPaymentDate(payment.received_at)}</span>
                    </div>

                    {/* Account info for non-cash payments */}
                    {payment.destination_card_number && (
                      <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: THEME_COLORS.border }}>
                        <span style={{ color: THEME_COLORS.subtext }}>
                          {payment.destination_bank_name} - {payment.destination_card_number.slice(-4)}****
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
