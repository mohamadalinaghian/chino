'use client';

import { useRouter, useParams } from 'next/navigation';
import { usePayment } from '@/hooks/usePayment';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import {
  PaymentItemList,
  PaymentSummaryBar,
  PaymentMethodSelector,
  PaymentAccountSelector,
  PaymentQuickCalc,
  PaymentTaxDiscount,
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
              className="px-5 py-2 rounded font-medium"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              ← بازگشت
            </button>
            <h1 className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
              پرداخت فروش #{saleId}
            </h1>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left - Items (7 columns) */}
        <div className="col-span-7 flex flex-col overflow-hidden border-r" style={{ borderColor: THEME_COLORS.border }}>
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

        {/* Right - Payment panel (5 columns) */}
        <div
          className="col-span-5 flex flex-col overflow-hidden rounded-xl shadow-sm"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          <PaymentSummaryBar
            sale={payment.sale}
            selectedTotal={payment.selectedTotal}
            selectAllItems={payment.selectAllItems}
            finalAmount={payment.finalAmount}
          />

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Amount input */}
            <div>
              <label
                htmlFor="payment-amount"
                className="block text-base font-bold mb-2"
                style={{ color: THEME_COLORS.text }}
              >
                مبلغ پرداخت
              </label>
              <input
                id="payment-amount"
                type="text"
                inputMode="numeric"
                value={payment.amount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9۰-۹]/g, '');
                  payment.setAmount(cleaned);
                }}
                className="w-full px-5 py-6 text-4xl font-bold text-center rounded-xl border-2 focus:outline-none focus:border-2"
                style={{
                  backgroundColor: THEME_COLORS.surface,
                  borderColor: THEME_COLORS.accent,
                  color: THEME_COLORS.text,
                }}
                placeholder="۰"
              />
            </div>

            {/* Quick calculation with final amount card */}
            <PaymentQuickCalc
              customDivisor={payment.customDivisor}
              onSetCustomDivisor={payment.setCustomDivisor}
              onSetHalf={payment.setAmountToHalf}
              onSetDivided={payment.setAmountToDivided}
              finalAmount={payment.finalAmount}
              onSetFull={payment.setAmountToFull}
            />

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

            {/* Tax / Discount / Tip */}
            <PaymentTaxDiscount
              showTaxDiscount={payment.showTaxDiscount}
              onToggleShow={() => payment.setShowTaxDiscount(!payment.showTaxDiscount)}
              taxType={payment.taxType}
              taxValue={payment.taxValue}
              taxEnabled={payment.taxEnabled}
              onToggleTax={payment.toggleTax}
              discountType={payment.discountType}
              discountValue={payment.discountValue}
              tipAmount={payment.tipAmount}
              onTaxTypeChange={payment.setTaxType}
              onTaxValueChange={payment.setTaxValue}
              onDiscountTypeChange={payment.setDiscountType}
              onDiscountValueChange={payment.setDiscountValue}
              onTipAmountChange={payment.setTipAmount}
              selectedTotal={payment.selectedTotal}
              taxAmount={payment.taxAmount}
              discountAmount={payment.discountAmount}
              tipAmountValue={payment.tipAmountValue}
              finalAmount={payment.finalAmount}
            />
          </div>

          {/* Submit button */}
          <div className="flex-shrink-0 p-5 border-t" style={{ borderColor: THEME_COLORS.border }}>
            <button
              onClick={payment.handleSubmitPayment}
              disabled={payment.submitting || Number(payment.amount) <= 0}
              className="w-full py-5 rounded-xl font-bold text-xl disabled:opacity-60 transition-all"
              style={{
                backgroundColor: THEME_COLORS.green,
                color: '#ffffff',
              }}
            >
              {payment.submitting
                ? 'در حال ثبت...'
                : `پرداخت ${formatPersianMoney(payment.finalAmount)}`}
            </button>
          </div>
        </div>
      </div>

      {payment.submitting && <LoadingOverlay message="در حال ثبت پرداخت..." />}
      <ToastContainer />
    </div>
  );
}
