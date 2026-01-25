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
  const saleId = parseInt(params.id as string);
  const { showToast, ToastContainer } = useToast();

  const handleSuccess = (message: string, wasAutoClosed: boolean) => {
    showToast(message, 'success');
    if (wasAutoClosed) {
      setTimeout(() => {
        router.push('/sale/dashboard');
      }, 1500);
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
          <div className="text-4xl mb-4" style={{ color: THEME_COLORS.red }}>⚠️</div>
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
        <div className="max-w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded font-bold text-sm"
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

      {/* Main 3-Column Layout */}
      <div className="flex-5 grid grid-cols-12 gap-4 overflow-hidden">
        {/* LEFT COLUMN - Scrollable Items List */}
        <PaymentItemList
          unpaidItems={payment.unpaidItems}
          paidItems={payment.paidItems}
          selectedItems={payment.selectedItems}
          selectAllItems={payment.selectAllItems}
          onItemSelectionChange={payment.handleItemSelectionChange}
          onSelectAllToggle={payment.handleSelectAllToggle}
        />

        {/* RIGHT COLUMN - Sticky Payment Panel */}
        <div
          className="col-span-4 flex flex-col overflow-hidden"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          {/* Summary Bar - Now shows selected items total */}
          <PaymentSummaryBar
            sale={payment.sale}
            selectedTotal={payment.selectedTotal}
            selectAllItems={payment.selectAllItems}
          />

          {/* Payment Form */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Amount Input */}
            <div>
              <label
                className="block text-base font-bold mb-2"
                style={{ color: THEME_COLORS.text }}
              >
                مبلغ پرداخت
              </label>
              <input
                type="number"
                value={payment.amount}
                onChange={(e) => payment.setAmount(e.target.value)}
                className="w-full px-4 py-4 rounded text-2xl font-bold text-center border-2"
                style={{
                  backgroundColor: THEME_COLORS.surface,
                  borderColor: THEME_COLORS.accent,
                  color: THEME_COLORS.text,
                }}
                placeholder="0"
              />
            </div>

            {/* Quick Calculation */}
            <PaymentQuickCalc
              customDivisor={payment.customDivisor}
              onSetCustomDivisor={payment.setCustomDivisor}
              onSetFull={payment.setAmountToFull}
              onSetHalf={payment.setAmountToHalf}
              onSetDivided={payment.setAmountToDivided}
            />

            {/* Payment Method */}
            <PaymentMethodSelector
              paymentMethod={payment.paymentMethod}
              onMethodChange={payment.handlePaymentMethodChange}
            />

            {/* Account Selection */}
            <PaymentAccountSelector
              paymentMethod={payment.paymentMethod}
              bankAccounts={payment.bankAccounts}
              posAccount={payment.posAccount}
              selectedAccountId={payment.selectedAccountId}
              onAccountSelect={payment.setSelectedAccountId}
            />

            {/* Tax/Discount/Tip */}
            <PaymentTaxDiscount
              showTaxDiscount={payment.showTaxDiscount}
              onToggleShow={() => payment.setShowTaxDiscount(!payment.showTaxDiscount)}
              taxType={payment.taxType}
              taxValue={payment.taxValue}
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

          {/* Submit Button */}
          <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: THEME_COLORS.border }}>
            <button
              onClick={payment.handleSubmitPayment}
              disabled={payment.submitting}
              className="w-full py-4 rounded-lg font-bold text-lg transition-all disabled:opacity-50"
              style={{
                backgroundColor: THEME_COLORS.green,
                color: '#fff',
              }}
            >
              {payment.submitting
                ? 'در حال ثبت...'
                : `ثبت پرداخت ${formatPersianMoney(parseFloat(payment.amount) || 0)}`}
            </button>
          </div>
        </div>
      </div>

      {payment.submitting && <LoadingOverlay message="در حال ثبت..." />}
      <ToastContainer />
    </div>
  );
}
