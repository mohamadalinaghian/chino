'use client';

import { useRouter, useParams } from 'next/navigation';
import { usePayment } from '@/hooks/usePayment';
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

          {/* Quick summary in header */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>مجموع</div>
              <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                {formatPersianMoney(payment.sale.total_amount)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>پرداخت شده</div>
              <div className="font-bold" style={{ color: THEME_COLORS.green }}>
                {formatPersianMoney(payment.sale.total_paid || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>مانده</div>
              <div className="font-bold" style={{ color: THEME_COLORS.orange }}>
                {formatPersianMoney(payment.sale.balance_due ?? payment.sale.total_amount)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout - 4-8 split for larger payment panel */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left - Items (4 columns) */}
        <div
          className="col-span-4 flex flex-col overflow-hidden rounded-xl"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          <PaymentItemList
            unpaidItems={payment.unpaidItems}
            paidItems={payment.paidItems}
            selectedItems={payment.selectedItems}
            selectAllItems={payment.selectAllItems}
            onItemToggleFull={payment.handleItemToggleFull}
            onItemQuantityChange={payment.handleItemQuantityChange}
            onSelectAllToggle={payment.handleSelectAllToggle}
          />
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
          </div>

          {/* Submit button - Synced with formula amount */}
          <div className="flex-shrink-0 p-5 border-t" style={{ borderColor: THEME_COLORS.border }}>
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
