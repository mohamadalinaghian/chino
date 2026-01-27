import { useRouter } from 'next/navigation';
import { IDashboardSaleItem, SaleState } from '@/types/sale';
import { THEME_COLORS } from '@/libs/constants';
import { toPersianDigits, formatPersianMoney } from '@/utils/persianUtils';
import jalaliMoment from 'jalali-moment';

interface SaleCardProps {
  sale: IDashboardSaleItem;
  isSuperuser: boolean;
  canCancelSale: boolean;
  onCancel: (saleId: number) => void;
  isLoading?: boolean;
}

export function SaleCard({
  sale,
  isSuperuser,
  canCancelSale,
  onCancel,
  isLoading = false,
}: SaleCardProps) {
  const router = useRouter();

  // Check if sale is in a final state (CLOSED or CANCELED)
  const isOpen = sale.state === SaleState.OPEN || sale.state === 'OPEN';
  const isClosed = sale.state === SaleState.CLOSED || sale.state === 'CLOSED';
  const isCanceled = sale.state === SaleState.CANCELED || sale.state === 'CANCELED';
  const isFinalState = isClosed || isCanceled;

  return (
    <div
      className="p-4 rounded-lg shadow-md border transition-all hover:shadow-lg"
      style={{
        backgroundColor: THEME_COLORS.bgSecondary,
        borderColor: THEME_COLORS.border,
      }}
    >
      {/* Sale Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div
            className="text-lg font-bold"
            style={{ color: THEME_COLORS.text }}
          >
            {sale.table || 'بیرون‌بر'}
          </div>
          <div
            className="text-sm"
            style={{ color: THEME_COLORS.subtext }}
          >
            شماره: {toPersianDigits(sale.id)}
          </div>
        </div>
        {isSuperuser && sale.total_amount !== null && (
          <div
            className="text-xl font-bold"
            style={{
              color: THEME_COLORS.green,
            }}
          >
            {formatPersianMoney(sale.total_amount)}
          </div>
        )}
      </div>

      {/* Sale Details */}
      <div className="space-y-2 mb-4">
        {sale.guest_name && (
          <div className="flex justify-between text-sm">
            <span style={{ color: THEME_COLORS.subtext }}>مهمان:</span>
            <span style={{ color: THEME_COLORS.text }}>
              {sale.guest_name}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span style={{ color: THEME_COLORS.subtext }}>کاربر:</span>
          <span style={{ color: THEME_COLORS.text }}>
            {sale.opened_by_name}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: THEME_COLORS.subtext }}>زمان:</span>
          <span style={{ color: THEME_COLORS.text }}>
            {jalaliMoment(sale.opened_at).locale('fa').fromNow()}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Edit button - only for OPEN sales */}
        {isOpen && (
          <button
            onClick={() => router.push(`/sale/${sale.id}/edit`)}
            className="py-2 px-3 rounded-lg text-sm font-bold transition-all hover:opacity-90"
            style={{
              backgroundColor: THEME_COLORS.surface,
              color: THEME_COLORS.text,
            }}
          >
            ✏️ ویرایش
          </button>
        )}
        {/* Payment button - label changes based on state */}
        <button
          onClick={() => router.push(`/sale/${sale.id}/payment`)}
          className={`py-2 px-3 rounded-lg text-sm font-bold transition-all hover:opacity-90 ${!isOpen ? 'col-span-2' : ''}`}
          style={{
            backgroundColor: isFinalState ? THEME_COLORS.surface : THEME_COLORS.accent,
            color: isFinalState ? THEME_COLORS.text : '#fff',
          }}
        >
          {isFinalState ? '📋 مشاهده' : '💳 پرداخت'}
        </button>
        {/* Cancel button - only for OPEN sales with permission */}
        {isOpen && canCancelSale && (
          <button
            onClick={() => onCancel(sale.id)}
            disabled={isLoading}
            className="col-span-2 py-2 px-3 rounded-lg text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: `${THEME_COLORS.red}20`,
              color: THEME_COLORS.red,
            }}
          >
            {isLoading ? '⏳ در حال لغو...' : '✕ لغو فروش'}
          </button>
        )}
      </div>
    </div>
  );
}
