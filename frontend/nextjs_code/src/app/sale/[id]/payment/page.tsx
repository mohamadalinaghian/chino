'use client';

import { useRouter, useParams } from 'next/navigation';
import { usePayment, PaymentMode } from '@/hooks/usePayment';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import {
  PaymentItemList,
  PaymentMethodSelector,
  PaymentAccountSelector,
  PaymentFormulaCalculator,
} from '@/components/payment';

export default function SalePaymentPage() {
  const router = useRouter();
  const params = useParams();

  const rawId = params.id;
  const saleId = typeof rawId === 'string' ? parseInt(rawId, 10) : NaN;

  if (isNaN(saleId) || saleId <= 0) {
    router.replace('/sale/dashboard');
    return null;
  }

  const { showToast, ToastContainer } = useToast();

  const handleSuccess = (message: string, wasAutoClosed: boolean) => {
    showToast(message, 'success');
    if (wasAutoClosed) {
      setTimeout(() => router.push('/sale/dashboard'), 1600);
    }
  };

  const handleError = (message: string) => {
    showToast(message, 'error');
  };

  const payment = usePayment({
    saleId,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  if (payment.loading) {
    return <LoadingOverlay message="در حال بارگذاری..." />;
  }

  if (!payment.sale) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: THEME_COLORS.bgPrimary }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4" style={{ color: THEME_COLORS.red }}>
            ⚠️
          </div>
          <p style={{ color: THEME_COLORS.text }}>فروش یافت نشد</p>
        </div>
      </div>
    );
  }

  const currentAmount = Number(payment.amount) || 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header
        className="px-4 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              aria-label="بازگشت"
              className="px-5 py-2 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              ← بازگشت
            </button>
            <h1 className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
              پرداخت فروش #{saleId}
            </h1>
          </div>

          {/* Payment Status Summary - SINGLE SOURCE OF TRUTH */}
          <div className="flex items-center gap-3">
            {/* Payment Status Badge */}
            <div
              className="px-3 py-1.5 rounded-lg text-sm font-bold"
              style={{
                backgroundColor: payment.sale.payment_status === 'PAID' ? '#10B98120' :
                                payment.sale.payment_status === 'PARTIALLY_PAID' ? `${THEME_COLORS.orange}20` :
                                `${THEME_COLORS.red}20`,
                color: payment.sale.payment_status === 'PAID' ? '#10B981' :
                       payment.sale.payment_status === 'PARTIALLY_PAID' ? THEME_COLORS.orange :
                       THEME_COLORS.red,
              }}
            >
              {payment.sale.payment_status === 'PAID' ? '✓ تسویه شده' :
               payment.sale.payment_status === 'PARTIALLY_PAID' ? '◐ پرداخت جزئی' :
               '○ پرداخت نشده'}
            </div>

            <div className="h-8 w-px" style={{ backgroundColor: THEME_COLORS.border }} />

            {/* Dynamic Total - updates based on tax settings */}
            <div className="text-center">
              <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                مجموع {payment.taxEnabled ? `(+${payment.taxValue}% مالیات)` : '(بدون مالیات)'}
              </div>
              <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                {formatPersianMoney(payment.calculatedTotal)}
              </div>
              {payment.calculatedTotal !== payment.sale.total_amount && (
                <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                  اصلی: {formatPersianMoney(payment.sale.total_amount)}
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>پرداخت شده</div>
              <div className="font-bold" style={{ color: '#10B981' }}>
                {formatPersianMoney(payment.sale.total_paid)}
              </div>
            </div>
            {/* Dynamic Remaining - recalculates when total changes */}
            <div
              className="text-center cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded-lg"
              style={{ backgroundColor: `${THEME_COLORS.orange}15` }}
              onClick={() => payment.handleAmountChange(Math.floor(payment.dynamicRemaining).toString())}
              title="کلیک برای وارد کردن مبلغ مانده"
            >
              <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>مانده (کلیک کنید)</div>
              <div
                className="font-bold"
                style={{
                  color: payment.dynamicRemaining > 0 ? THEME_COLORS.orange : '#10B981',
                }}
              >
                {formatPersianMoney(payment.dynamicRemaining)}
              </div>
            </div>
            {/* Maximum with tips indicator */}
            {payment.tipAmountValue > 0 && (
              <div className="text-center">
                <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>سقف (با انعام)</div>
                <div className="font-bold" style={{ color: THEME_COLORS.green }}>
                  {formatPersianMoney(payment.maximumTotal)}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Payment Mode Selector */}
      <div
        className="flex-shrink-0 px-4 py-3 border-b"
        style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.border }}
      >
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm font-medium" style={{ color: THEME_COLORS.subtext }}>
            نوع پرداخت:
          </span>
          <div className="flex gap-2">
            <button
              onClick={payment.setModeToItems}
              className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
              style={{
                backgroundColor: payment.paymentMode === PaymentMode.FROM_ITEMS
                  ? THEME_COLORS.accent
                  : THEME_COLORS.bgSecondary,
                color: payment.paymentMode === PaymentMode.FROM_ITEMS
                  ? '#fff'
                  : THEME_COLORS.text,
                border: `2px solid ${payment.paymentMode === PaymentMode.FROM_ITEMS ? THEME_COLORS.accent : THEME_COLORS.border}`,
              }}
            >
              بر اساس اقلام
            </button>
            <button
              onClick={payment.setModeToManual}
              className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
              style={{
                backgroundColor: payment.paymentMode === PaymentMode.MANUAL
                  ? THEME_COLORS.purple
                  : THEME_COLORS.bgSecondary,
                color: payment.paymentMode === PaymentMode.MANUAL
                  ? '#fff'
                  : THEME_COLORS.text,
                border: `2px solid ${payment.paymentMode === PaymentMode.MANUAL ? THEME_COLORS.purple : THEME_COLORS.border}`,
              }}
            >
              مبلغ دستی
            </button>
          </div>
        </div>
      </div>

      {/* Main layout - 4-8 split for larger payment panel */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left - Items Panel (4 columns) */}
        <div
          className="col-span-4 flex flex-col overflow-hidden rounded-xl"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          {payment.paymentMode === PaymentMode.FROM_ITEMS ? (
            <PaymentItemList
              unpaidItems={payment.unpaidItems}
              paidItems={payment.paidItems}
              selectedItems={payment.selectedItems}
              selectAllItems={payment.selectAllItems}
              payments={payment.sale?.payments || []}
              onItemToggleFull={payment.handleItemToggleFull}
              onItemQuantityChange={payment.handleItemQuantityChange}
              onSelectAllToggle={payment.handleSelectAllToggle}
            />
          ) : (
            /* Manual Amount Mode - Show input here */
            <div className="flex flex-col h-full">
              <div
                className="flex-shrink-0 px-4 py-3 border-b"
                style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.border }}
              >
                <span className="font-bold" style={{ color: THEME_COLORS.purple }}>
                  ورود مبلغ دستی
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center p-6">
                <div
                  className="w-full max-w-sm p-6 rounded-xl text-center"
                  style={{
                    backgroundColor: THEME_COLORS.surface,
                    border: `3px solid ${THEME_COLORS.purple}`,
                  }}
                >
                  <label
                    className="block text-sm font-medium mb-3"
                    style={{ color: THEME_COLORS.subtext }}
                  >
                    مبلغ درخواستی مهمان را وارد کنید
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={payment.manualAmount}
                    onChange={(e) => payment.setManualAmount(e.target.value.replace(/[^0-9۰-۹]/g, ''))}
                    placeholder="۰"
                    className="w-full text-4xl font-bold bg-transparent outline-none text-center py-4"
                    style={{ color: THEME_COLORS.purple }}
                    autoFocus
                  />
                  <div className="text-sm mt-2" style={{ color: THEME_COLORS.subtext }}>
                    تومان
                  </div>
                </div>
              </div>

              {/* Show paid items in manual mode too */}
              {payment.paidItems.length > 0 && (
                <div
                  className="flex-shrink-0 border-t p-4"
                  style={{ borderColor: THEME_COLORS.border }}
                >
                  <div className="text-sm font-medium mb-2" style={{ color: '#10B981' }}>
                    اقلام پرداخت شده ({payment.paidItems.length})
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {payment.paidItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                        style={{ color: THEME_COLORS.subtext }}
                      >
                        <span>{item.product_name} ×{item.quantity_paid}</span>
                        <span style={{ color: '#10B981' }}>
                          {formatPersianMoney(Number(item.unit_price) * item.quantity_paid)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right - Payment panel (8 columns - larger) */}
        <div
          className="col-span-8 flex flex-col overflow-hidden rounded-xl shadow-lg"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          {/* Formula Calculator at top */}
          <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: THEME_COLORS.border }}>
            <PaymentFormulaCalculator
              selectedTotal={payment.selectedTotal}
              taxAmount={payment.taxAmount}
              taxEnabled={payment.taxEnabled}
              taxValue={payment.taxValue}
              taxType={payment.taxType}
              discountAmount={payment.discountAmount}
              discountValue={payment.discountValue}
              discountType={payment.discountType}
              tipAmount={payment.tipAmount}
              tipAmountValue={payment.tipAmountValue}
              divisor={payment.divisor}
              preDivisionAmount={payment.preDivisionAmount}
              finalAmount={payment.finalAmount}
              amount={payment.amount}
              isAmountManuallyOverridden={payment.isAmountManuallyOverridden}
              onToggleTax={payment.toggleTax}
              onIncrementTax={payment.incrementTaxValue}
              onDecrementTax={payment.decrementTaxValue}
              onTaxValueChange={payment.setTaxValue}
              onDiscountValueChange={payment.setDiscountValue}
              onTipAmountChange={payment.setTipAmount}
              onDivisorChange={payment.setDivisor}
              onIncrementDivisor={payment.incrementDivisor}
              onDecrementDivisor={payment.decrementDivisor}
              onAmountChange={payment.handleAmountChange}
              onSyncToFormula={payment.syncAmountToFormula}
            />
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Payment method */}
            <PaymentMethodSelector
              paymentMethod={payment.paymentMethod}
              onMethodChange={payment.handlePaymentMethodChange}
            />

            {/* Account selector */}
            <PaymentAccountSelector
              paymentMethod={payment.paymentMethod}
              bankAccounts={payment.bankAccounts}
              posAccount={payment.posAccount}
              selectedAccountId={payment.selectedAccountId}
              onAccountSelect={payment.setSelectedAccountId}
            />

            {/* Payment History Section */}
            {payment.sale.payments && payment.sale.payments.length > 0 && (
              <div
                className="mt-4 p-4 rounded-xl"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <h3 className="font-bold mb-3" style={{ color: THEME_COLORS.text }}>
                  تاریخچه پرداخت‌ها ({payment.sale.payments.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {payment.sale.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        backgroundColor: p.status === 'VOID' ? `${THEME_COLORS.red}10` : THEME_COLORS.bgSecondary,
                        opacity: p.status === 'VOID' ? 0.6 : 1,
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: THEME_COLORS.text }}>
                            {formatPersianMoney(p.amount_applied)}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor:
                                p.method === 'CARD_TRANSFER' ? `${THEME_COLORS.accent}20` :
                                p.method === 'CASH' ? `${THEME_COLORS.green}20` :
                                `${THEME_COLORS.purple}20`,
                              color:
                                p.method === 'CARD_TRANSFER' ? THEME_COLORS.accent :
                                p.method === 'CASH' ? THEME_COLORS.green :
                                THEME_COLORS.purple,
                            }}
                          >
                            {p.method === 'CARD_TRANSFER' ? 'کارت به کارت' :
                             p.method === 'CASH' ? 'نقدی' : 'کارتخوان'}
                          </span>
                          {p.status === 'VOID' && (
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{ backgroundColor: `${THEME_COLORS.red}20`, color: THEME_COLORS.red }}
                            >
                              لغو شده
                            </span>
                          )}
                          {p.tip_amount > 0 && (
                            <span className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                              + انعام {formatPersianMoney(p.tip_amount)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
                          {p.received_by_name} - {new Date(p.received_at).toLocaleString('fa-IR')}
                        </div>
                      </div>
                      {p.status !== 'VOID' && (
                        <button
                          onClick={() => payment.handleVoidPayment(p.id)}
                          disabled={payment.voidingPaymentId === p.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                          style={{ backgroundColor: THEME_COLORS.red, color: '#fff' }}
                        >
                          {payment.voidingPaymentId === p.id ? '...' : 'لغو'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit button - Synced with formula amount */}
          <div className="flex-shrink-0 p-5 border-t" style={{ borderColor: THEME_COLORS.border }}>
            {payment.divisor > 1 ? (
              // Split submit buttons for multiple persons
              <div className="space-y-3">
                <div className="text-center text-sm mb-2" style={{ color: THEME_COLORS.subtext }}>
                  پرداخت {payment.divisor} نفره - هر نفر: {formatPersianMoney(payment.finalAmount)}
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(payment.divisor, 5)}, 1fr)` }}>
                  {Array.from({ length: payment.divisor }, (_, index) => {
                    const isPaid = payment.paidPersons.includes(index);
                    return (
                      <button
                        key={index}
                        onClick={() => payment.handleSubmitPersonPayment(index)}
                        disabled={payment.submitting || isPaid}
                        className="py-4 rounded-xl font-bold text-base disabled:opacity-60 transition-all relative overflow-hidden"
                        style={{
                          backgroundColor: isPaid ? THEME_COLORS.green : THEME_COLORS.accent,
                          color: '#ffffff',
                        }}
                      >
                        {payment.submitting ? (
                          '...'
                        ) : isPaid ? (
                          <div className="flex flex-col items-center">
                            <span className="text-lg">✓</span>
                            <span className="text-xs">نفر {index + 1}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span>نفر {index + 1}</span>
                            <span className="text-xs opacity-80">{formatPersianMoney(payment.finalAmount)}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Progress indicator */}
                <div
                  className="text-center text-sm py-2 rounded-lg"
                  style={{ backgroundColor: `${THEME_COLORS.purple}10`, color: THEME_COLORS.purple }}
                >
                  {payment.paidPersons.length} از {payment.divisor} نفر پرداخت کرده‌اند
                </div>
              </div>
            ) : (
              // Single submit button
              <button
                onClick={payment.handleSubmitPayment}
                disabled={payment.submitting || currentAmount <= 0}
                className="w-full py-5 rounded-xl font-bold text-xl disabled:opacity-60 transition-all relative overflow-hidden"
                style={{
                  backgroundColor: payment.isAmountManuallyOverridden ? THEME_COLORS.orange : THEME_COLORS.green,
                  color: '#ffffff',
                }}
              >
                {payment.submitting ? (
                  'در حال ثبت...'
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    {payment.isAmountManuallyOverridden && (
                      <span className="text-sm opacity-80">(دستی)</span>
                    )}
                    <span>پرداخت {formatPersianMoney(currentAmount)}</span>
                  </div>
                )}
              </button>
            )}

            {/* Show difference from formula if manually overridden */}
            {payment.isAmountManuallyOverridden && currentAmount !== payment.finalAmount && (
              <div
                className="mt-2 text-center text-sm py-2 rounded-lg"
                style={{ backgroundColor: `${THEME_COLORS.orange}15`, color: THEME_COLORS.orange }}
              >
                تفاوت با فرمول: {formatPersianMoney(Math.abs(currentAmount - payment.finalAmount))}
                {currentAmount > payment.finalAmount ? ' بیشتر' : ' کمتر'}
              </div>
            )}
          </div>
        </div>
      </div>

      {payment.submitting && <LoadingOverlay message="در حال ثبت پرداخت..." />}
      <ToastContainer />
    </div>
  );
}
