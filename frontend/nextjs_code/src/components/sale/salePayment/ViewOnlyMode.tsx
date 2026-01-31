/**
 * ViewOnlyMode Component
 *
 * Display-only view for closed or canceled sales.
 * Shows sale details, items, and payment history without edit capabilities.
 */

'use client';

import { formatPersianMoney } from '@/utils/persianUtils';
import { ArrowLeft } from 'lucide-react';
import type { SaleData } from '@/types/payment';
import { THEME_COLORS } from '@/libs/constants';
import { PAYMENT_METHOD_CONFIG, SALE_STATE_CONFIG } from '@/libs/paymentConstants';

interface ViewOnlyModeProps {
  sale: SaleData;
  saleId: number;
  onBack: () => void;
}

export function ViewOnlyMode({ sale, saleId, onBack }: ViewOnlyModeProps) {
  const isCanceled = sale.state === 'CANCELED';
  const stateConfig = SALE_STATE_CONFIG[sale.state as keyof typeof SALE_STATE_CONFIG] || {
    label: sale.state,
    color: THEME_COLORS.text,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header
        className="px-5 py-4 border-b sticky top-0 z-10 backdrop-blur-sm bg-opacity-90"
        style={{
          backgroundColor: THEME_COLORS.bgSecondary,
          borderColor: THEME_COLORS.border,
        }}
      >
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg font-medium border transition-all duration-200 hover:bg-white/10 dark:hover:bg-black/10 flex items-center gap-2"
              style={{
                backgroundColor: THEME_COLORS.surface,
                color: THEME_COLORS.text,
                borderColor: THEME_COLORS.border,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              بازگشت
            </button>
            <h1 className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
              {sale.guest_name || `فروش #${saleId}`}
            </h1>
          </div>

          <div
            className="px-4 py-2 rounded-xl font-bold"
            style={{
              backgroundColor: `${stateConfig.color}20`,
              color: stateConfig.color,
            }}
          >
            {stateConfig.label}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-5 space-y-5">
        {/* Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label="جمع فروش"
            value={sale.total_amount}
            color={THEME_COLORS.text}
          />
          <SummaryCard
            label="پرداخت شده"
            value={sale.total_paid}
            color={THEME_COLORS.green}
          />
          <SummaryCard
            label="مالیات"
            value={sale.tax_amount}
            color={THEME_COLORS.blue}
          />
          <SummaryCard
            label="تخفیف"
            value={sale.discount_amount}
            color={THEME_COLORS.orange}
          />
        </div>

        {/* Items List */}
        <div
          className="p-5 rounded-2xl"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          <h3 className="font-bold mb-4 text-lg" style={{ color: THEME_COLORS.text }}>
            اقلام فروش ({sale.items.length})
          </h3>
          <div className="space-y-2">
            {sale.items.map(item => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 rounded-xl"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <div>
                  <div className="font-medium" style={{ color: THEME_COLORS.text }}>
                    {item.product_name}
                  </div>
                  <div
                    className="text-sm number-display mt-1"
                    style={{ color: THEME_COLORS.subtext }}
                  >
                    {item.quantity} × {formatPersianMoney(item.unit_price)}
                  </div>
                </div>
                <div
                  className="font-bold number-display text-lg"
                  style={{ color: THEME_COLORS.green }}
                >
                  {formatPersianMoney(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        {sale.payments.length > 0 && (
          <div
            className="p-5 rounded-2xl"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <h3 className="font-bold mb-4 text-lg" style={{ color: THEME_COLORS.text }}>
              تاریخچه پرداخت‌ها ({sale.payments.length})
            </h3>
            <div className="space-y-2">
              {sale.payments.map(payment => {
                const isVoid = payment.status === 'VOID';
                const config =
                  PAYMENT_METHOD_CONFIG[
                  payment.method as keyof typeof PAYMENT_METHOD_CONFIG
                  ] || {
                    label: payment.method,
                    color: THEME_COLORS.text,
                  };

                return (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 rounded-xl"
                    style={{
                      backgroundColor: isVoid
                        ? `${THEME_COLORS.red}10`
                        : THEME_COLORS.surface,
                      opacity: isVoid ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-bold number-display ${isVoid ? 'line-through' : ''
                            }`}
                          style={{ color: THEME_COLORS.text }}
                        >
                          {formatPersianMoney(payment.amount_applied)}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${config.color}20`,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                        {isVoid && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold"
                            style={{
                              backgroundColor: `${THEME_COLORS.red}20`,
                              color: THEME_COLORS.red,
                            }}
                          >
                            لغو شده
                          </span>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                        {payment.received_by_name} -{' '}
                        {new Date(payment.received_at).toLocaleString('fa-IR')}
                      </div>
                    </div>

                    {payment.tip_amount > 0 && (
                      <div
                        className="text-sm number-display font-medium"
                        style={{ color: THEME_COLORS.green }}
                      >
                        انعام: {formatPersianMoney(payment.tip_amount)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Summary card for financial metrics
 */
interface SummaryCardProps {
  label: string;
  value: number;
  color: string;
}

function SummaryCard({ label, value, color }: SummaryCardProps) {
  return (
    <div
      className="p-4 rounded-xl text-center"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      <div className="text-sm mb-1" style={{ color: THEME_COLORS.subtext }}>
        {label}
      </div>
      <div className="text-xl font-bold number-display" style={{ color }}>
        {formatPersianMoney(value)}
      </div>
    </div>
  );
}
