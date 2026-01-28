'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { usePaymentPage } from '@/hooks/usePaymentPage';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { PaymentMethod } from '@/types/sale';

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT PAGE
// A clean, production-ready payment interface for cafe POS
// Designed for non-technical cashiers with mistake-resistant UX
// ═══════════════════════════════════════════════════════════════════════════════

export default function PaymentPage() {
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
      setTimeout(() => router.push('/sale/dashboard'), 1500);
    }
  };

  const handleError = (message: string) => {
    showToast(message, 'error');
  };

  const payment = usePaymentPage({
    saleId,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  if (payment.loading) {
    return <LoadingOverlay message="در حال بارگذاری..." />;
  }

  if (!payment.snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
        <div className="text-center p-8 rounded-2xl" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
          <div className="text-6xl mb-4">!</div>
          <p className="text-xl font-bold" style={{ color: THEME_COLORS.red }}>فروش یافت نشد</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-3 rounded-xl font-bold"
            style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  // View-only mode for closed sales
  if (payment.isViewOnly) {
    return <ViewOnlyMode payment={payment} router={router} saleId={saleId} ToastContainer={ToastContainer} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER - Payment Status (Always Visible) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="flex-shrink-0 px-4 py-4 border-b"
        style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Top row: Back button and sale info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
              >
                بازگشت
              </button>
              <h1 className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
                پرداخت فروش #{saleId}
              </h1>
            </div>
            <StatusBadge status={payment.snapshot.paymentStatus} />
          </div>

          {/* Payment Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Total Amount - LARGEST */}
            <div
              className="p-4 rounded-xl text-center"
              style={{ backgroundColor: THEME_COLORS.surface, border: `2px solid ${THEME_COLORS.accent}` }}
            >
              <div className="text-xs mb-1" style={{ color: THEME_COLORS.subtext }}>جمع کل فروش</div>
              <div className="text-2xl font-black" style={{ color: THEME_COLORS.accent }}>
                {formatPersianMoney(payment.snapshot.totalAmount)}
              </div>
            </div>

            {/* Tax - Read Only */}
            <div
              className="p-4 rounded-xl text-center"
              style={{ backgroundColor: THEME_COLORS.surface }}
            >
              <div className="text-xs mb-1" style={{ color: THEME_COLORS.subtext }}>مالیات (محاسبه شده)</div>
              <div className="text-lg font-bold" style={{ color: THEME_COLORS.blue }}>
                {formatPersianMoney(payment.snapshot.taxAmount)}
              </div>
            </div>

            {/* Paid So Far */}
            <div
              className="p-4 rounded-xl text-center"
              style={{ backgroundColor: `${THEME_COLORS.green}10` }}
            >
              <div className="text-xs mb-1" style={{ color: THEME_COLORS.subtext }}>پرداخت شده</div>
              <div className="text-lg font-bold" style={{ color: THEME_COLORS.green }}>
                {formatPersianMoney(payment.snapshot.totalPaid)}
              </div>
            </div>

            {/* Remaining Due - HIGHLIGHTED */}
            <div
              className="p-4 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: payment.snapshot.remainingDue > 0 ? `${THEME_COLORS.orange}15` : `${THEME_COLORS.green}15`,
                border: `2px solid ${payment.snapshot.remainingDue > 0 ? THEME_COLORS.orange : THEME_COLORS.green}`,
              }}
              onClick={payment.setAmountToRemaining}
              title="کلیک برای وارد کردن مبلغ مانده"
            >
              <div className="text-xs mb-1" style={{ color: THEME_COLORS.subtext }}>
                مانده {payment.snapshot.remainingDue > 0 ? '(کلیک کنید)' : ''}
              </div>
              <div
                className="text-xl font-black"
                style={{ color: payment.snapshot.remainingDue > 0 ? THEME_COLORS.orange : THEME_COLORS.green }}
              >
                {payment.snapshot.remainingDue > 0 ? formatPersianMoney(payment.snapshot.remainingDue) : 'تسویه شده'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-4 space-y-4">
          {/* Sale Breakdown (Collapsible) */}
          <SaleBreakdown
            items={payment.snapshot.items}
            subtotal={payment.snapshot.subtotalAmount}
            tax={payment.snapshot.taxAmount}
            discount={payment.snapshot.discountAmount}
            total={payment.snapshot.totalAmount}
            isOpen={payment.showBreakdown}
            onToggle={() => payment.setShowBreakdown(!payment.showBreakdown)}
          />

          {/* Main Layout: Payment Input + History */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Payment Input Area (Main Interaction Zone) */}
            <div className="lg:col-span-3">
              <PaymentInputArea
                paymentMethod={payment.paymentMethod}
                onMethodChange={payment.setPaymentMethod}
                inputAmount={payment.inputAmount}
                onAmountChange={payment.setInputAmount}
                tipAmount={payment.tipAmount}
                onTipChange={payment.setTipAmount}
                calculatorExpression={payment.calculatorExpression}
                onCalculatorChange={payment.setCalculatorExpression}
                onCalculatorApply={payment.applyCalculatorResult}
                parsedAmount={payment.parsedAmount}
                parsedTip={payment.parsedTip}
                totalPaymentAmount={payment.totalPaymentAmount}
                remainingDue={payment.snapshot.remainingDue}
                quickAmounts={payment.quickAmounts}
                onQuickAmount={(amt) => payment.setInputAmount(amt.toString())}
                onSetRemaining={payment.setAmountToRemaining}
                bankAccounts={payment.bankAccounts}
                posAccount={payment.posAccount}
                selectedAccountId={payment.selectedAccountId}
                onAccountSelect={payment.setSelectedAccountId}
                validationError={payment.validationError}
                isValid={payment.isValid}
                submitting={payment.submitting}
                onSubmit={payment.handleSubmitPayment}
              />
            </div>

            {/* Payments History */}
            <div className="lg:col-span-2">
              <PaymentHistory
                payments={payment.payments}
                voidingPaymentId={payment.voidingPaymentId}
                onVoidPayment={payment.handleVoidPayment}
              />
            </div>
          </div>

          {/* Edge Actions */}
          <EdgeActions saleId={saleId} router={router} />
        </div>
      </main>

      {payment.submitting && <LoadingOverlay message="در حال ثبت پرداخت..." />}
      <ToastContainer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: string }) {
  const config = {
    PAID: { bg: `${THEME_COLORS.green}20`, color: THEME_COLORS.green, text: 'تسویه شده', icon: 'check' },
    PARTIALLY_PAID: { bg: `${THEME_COLORS.orange}20`, color: THEME_COLORS.orange, text: 'پرداخت جزئی', icon: 'half' },
    UNPAID: { bg: `${THEME_COLORS.red}20`, color: THEME_COLORS.red, text: 'پرداخت نشده', icon: 'empty' },
  }[status] || { bg: THEME_COLORS.surface, color: THEME_COLORS.text, text: status, icon: 'empty' };

  return (
    <div
      className="px-4 py-2 rounded-xl font-bold flex items-center gap-2"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <span className="text-lg">
        {config.icon === 'check' ? '●' : config.icon === 'half' ? '◐' : '○'}
      </span>
      {config.text}
    </div>
  );
}

function SaleBreakdown({
  items,
  subtotal,
  tax,
  discount,
  total,
  isOpen,
  onToggle,
}: {
  items: { id: number; product_name: string; quantity: number; unit_price: number; total: number; extras: { product_name: string; quantity: number; unit_price: number }[] }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{isOpen ? '▼' : '▶'}</span>
          <span className="font-bold" style={{ color: THEME_COLORS.text }}>
            جزئیات فروش ({items.length} قلم)
          </span>
        </div>
        <span style={{ color: THEME_COLORS.subtext }}>
          {isOpen ? 'بستن' : 'مشاهده'}
        </span>
      </button>

      {/* Content - Collapsible */}
      {isOpen && (
        <div className="p-4 space-y-3">
          {/* Items */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start p-3 rounded-lg"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <div>
                  <div className="font-medium" style={{ color: THEME_COLORS.text }}>
                    {item.product_name}
                  </div>
                  <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                    {item.quantity} عدد × {formatPersianMoney(item.unit_price)}
                  </div>
                  {item.extras?.length > 0 && (
                    <div className="mt-1 text-xs" style={{ color: THEME_COLORS.subtext }}>
                      افزودنی: {item.extras.map(e => e.product_name).join('، ')}
                    </div>
                  )}
                </div>
                <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                  {formatPersianMoney(item.total)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="pt-3 border-t space-y-1" style={{ borderColor: THEME_COLORS.border }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: THEME_COLORS.subtext }}>جمع اقلام:</span>
              <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(subtotal)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: THEME_COLORS.blue }}>+ مالیات:</span>
                <span style={{ color: THEME_COLORS.blue }}>{formatPersianMoney(tax)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: THEME_COLORS.orange }}>- تخفیف:</span>
                <span style={{ color: THEME_COLORS.orange }}>{formatPersianMoney(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2">
              <span style={{ color: THEME_COLORS.text }}>جمع کل:</span>
              <span style={{ color: THEME_COLORS.accent }}>{formatPersianMoney(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentInputArea({
  paymentMethod,
  onMethodChange,
  inputAmount,
  onAmountChange,
  tipAmount,
  onTipChange,
  calculatorExpression,
  onCalculatorChange,
  onCalculatorApply,
  parsedAmount,
  parsedTip,
  totalPaymentAmount,
  remainingDue,
  quickAmounts,
  onQuickAmount,
  onSetRemaining,
  bankAccounts,
  posAccount,
  selectedAccountId,
  onAccountSelect,
  validationError,
  isValid,
  submitting,
  onSubmit,
}: {
  paymentMethod: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  inputAmount: string;
  onAmountChange: (v: string) => void;
  tipAmount: string;
  onTipChange: (v: string) => void;
  calculatorExpression: string;
  onCalculatorChange: (v: string) => void;
  onCalculatorApply: () => void;
  parsedAmount: number;
  parsedTip: number;
  totalPaymentAmount: number;
  remainingDue: number;
  quickAmounts: number[];
  onQuickAmount: (amt: number) => void;
  onSetRemaining: () => void;
  bankAccounts: { id: number; card_number: string; bank_name: string | null; related_user_name: string }[];
  posAccount: { id: number | null; card_number: string | null; account_owner: string | null } | null;
  selectedAccountId: number | null;
  onAccountSelect: (id: number) => void;
  validationError: string | null;
  isValid: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const [showCalculator, setShowCalculator] = useState(false);

  return (
    <div
      className="rounded-xl p-5 space-y-5"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      {/* Payment Method Selector */}
      <div>
        <div className="text-sm font-bold mb-3" style={{ color: THEME_COLORS.text }}>
          روش پرداخت
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: PaymentMethod.CASH, label: 'نقدی', icon: '💵', color: THEME_COLORS.green },
            { value: PaymentMethod.POS, label: 'کارتخوان', icon: '💳', color: THEME_COLORS.purple },
            { value: PaymentMethod.CARD_TRANSFER, label: 'کارت به کارت', icon: '🏦', color: THEME_COLORS.accent },
          ].map((method) => (
            <button
              key={method.value}
              onClick={() => onMethodChange(method.value)}
              className="py-4 rounded-xl font-bold transition-all flex flex-col items-center gap-1"
              style={{
                backgroundColor: paymentMethod === method.value ? method.color : THEME_COLORS.surface,
                color: paymentMethod === method.value ? '#fff' : THEME_COLORS.text,
                border: `2px solid ${paymentMethod === method.value ? method.color : THEME_COLORS.border}`,
              }}
            >
              <span className="text-2xl">{method.icon}</span>
              <span>{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Account Selector (for non-cash methods) */}
      {paymentMethod !== PaymentMethod.CASH && (
        <div>
          <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>
            {paymentMethod === PaymentMethod.POS ? 'کارتخوان' : 'حساب مقصد'}
          </div>
          {paymentMethod === PaymentMethod.POS ? (
            posAccount?.id ? (
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${THEME_COLORS.green}15`, border: `2px solid ${THEME_COLORS.green}` }}
              >
                <div className="font-bold" style={{ color: THEME_COLORS.text }}>{posAccount.account_owner}</div>
                <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>{posAccount.card_number}</div>
              </div>
            ) : (
              <div className="p-3 rounded-xl text-center" style={{ backgroundColor: `${THEME_COLORS.red}10` }}>
                <span style={{ color: THEME_COLORS.red }}>کارتخوان تنظیم نشده است</span>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {bankAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => onAccountSelect(account.id)}
                  className="p-3 rounded-xl text-right transition-all"
                  style={{
                    backgroundColor: selectedAccountId === account.id ? `${THEME_COLORS.accent}15` : THEME_COLORS.surface,
                    border: `2px solid ${selectedAccountId === account.id ? THEME_COLORS.accent : THEME_COLORS.border}`,
                  }}
                >
                  <div className="font-bold" style={{ color: THEME_COLORS.text }}>{account.related_user_name}</div>
                  <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>{account.card_number}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Amount Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold" style={{ color: THEME_COLORS.text }}>مبلغ پرداخت</span>
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.accent }}
          >
            {showCalculator ? 'بستن ماشین‌حساب' : 'ماشین‌حساب'}
          </button>
        </div>

        {/* Calculator Expression (if open) */}
        {showCalculator && (
          <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: THEME_COLORS.surface }}>
            <input
              type="text"
              value={calculatorExpression}
              onChange={(e) => onCalculatorChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCalculatorApply()}
              placeholder="مثال: 50000 + 30000"
              className="w-full bg-transparent outline-none text-lg font-mono"
              style={{ color: THEME_COLORS.text }}
              dir="ltr"
            />
            <div className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
              Enter بزنید یا روی دکمه مبلغ کلیک کنید
            </div>
          </div>
        )}

        {/* Main Amount Input - LARGE */}
        <div
          className="p-4 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: THEME_COLORS.surface, border: `3px solid ${THEME_COLORS.accent}` }}
        >
          <input
            type="text"
            inputMode="numeric"
            value={inputAmount}
            onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="۰"
            className="text-4xl font-black bg-transparent outline-none text-center w-full"
            style={{ color: THEME_COLORS.accent }}
            dir="ltr"
          />
          <span className="text-lg mr-2" style={{ color: THEME_COLORS.subtext }}>تومان</span>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={onSetRemaining}
            className="px-3 py-2 rounded-lg text-sm font-bold"
            style={{ backgroundColor: `${THEME_COLORS.orange}20`, color: THEME_COLORS.orange }}
          >
            کل مانده
          </button>
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => onQuickAmount(amt)}
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              {formatPersianMoney(amt)}
            </button>
          ))}
        </div>
      </div>

      {/* Tip Input (Optional) */}
      <div>
        <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>
          انعام (اختیاری)
        </div>
        <div
          className="p-3 rounded-xl flex items-center gap-2"
          style={{ backgroundColor: THEME_COLORS.surface }}
        >
          <input
            type="text"
            inputMode="numeric"
            value={tipAmount}
            onChange={(e) => onTipChange(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="۰"
            className="flex-1 text-lg font-bold bg-transparent outline-none text-center"
            style={{ color: THEME_COLORS.green }}
            dir="ltr"
          />
          <span className="text-sm" style={{ color: THEME_COLORS.subtext }}>تومان</span>
        </div>
      </div>

      {/* Total Summary */}
      {(parsedTip > 0 || parsedAmount !== totalPaymentAmount) && (
        <div
          className="p-3 rounded-xl text-center"
          style={{ backgroundColor: `${THEME_COLORS.green}10` }}
        >
          <span className="text-sm" style={{ color: THEME_COLORS.subtext }}>جمع کل: </span>
          <span className="text-lg font-bold" style={{ color: THEME_COLORS.green }}>
            {formatPersianMoney(totalPaymentAmount)}
          </span>
          <span className="text-xs mr-2" style={{ color: THEME_COLORS.subtext }}>
            (پرداخت {formatPersianMoney(parsedAmount)} + انعام {formatPersianMoney(parsedTip)})
          </span>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div
          className="p-3 rounded-xl text-center"
          style={{ backgroundColor: `${THEME_COLORS.red}10` }}
        >
          <span style={{ color: THEME_COLORS.red }}>{validationError}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={!isValid || submitting}
        className="w-full py-5 rounded-xl font-black text-xl transition-all disabled:opacity-50"
        style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
      >
        {submitting ? (
          'در حال ثبت...'
        ) : (
          <span>
            ثبت پرداخت {parsedAmount > 0 && formatPersianMoney(parsedAmount)}
          </span>
        )}
      </button>

      {/* Amount vs Remaining indicator */}
      {parsedAmount > 0 && remainingDue > 0 && (
        <div className="text-center text-sm" style={{ color: THEME_COLORS.subtext }}>
          {parsedAmount >= remainingDue ? (
            <span style={{ color: THEME_COLORS.green }}>
              این پرداخت فروش را تسویه می‌کند
              {parsedAmount > remainingDue && ` (${formatPersianMoney(parsedAmount - remainingDue)} اضافه)`}
            </span>
          ) : (
            <span>
              پس از این پرداخت: {formatPersianMoney(remainingDue - parsedAmount)} باقی می‌ماند
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentHistory({
  payments,
  voidingPaymentId,
  onVoidPayment,
}: {
  payments: { id: number; method: string; amount: number; tipAmount: number; receivedBy: string; receivedAt: string; status: string; accountInfo?: string }[];
  voidingPaymentId: number | null;
  onVoidPayment: (id: number) => void;
}) {
  const [confirmVoidId, setConfirmVoidId] = useState<number | null>(null);

  const activePayments = payments.filter(p => p.status === 'ACTIVE');
  const voidedPayments = payments.filter(p => p.status === 'VOID');

  const handleVoidClick = (id: number) => {
    if (confirmVoidId === id) {
      onVoidPayment(id);
      setConfirmVoidId(null);
    } else {
      setConfirmVoidId(id);
    }
  };

  const methodLabel = (method: string) => ({
    CASH: { label: 'نقدی', color: THEME_COLORS.green },
    POS: { label: 'کارتخوان', color: THEME_COLORS.purple },
    CARD_TRANSFER: { label: 'کارت', color: THEME_COLORS.accent },
  }[method] || { label: method, color: THEME_COLORS.text });

  return (
    <div
      className="rounded-xl p-4 h-full"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      <h3 className="font-bold mb-3" style={{ color: THEME_COLORS.text }}>
        تاریخچه پرداخت‌ها ({activePayments.length})
      </h3>

      {payments.length === 0 ? (
        <div className="text-center py-8" style={{ color: THEME_COLORS.subtext }}>
          هنوز پرداختی ثبت نشده است
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {/* Active Payments */}
          {activePayments.map((p) => {
            const { label, color } = methodLabel(p.method);
            const isConfirming = confirmVoidId === p.id;

            return (
              <div
                key={p.id}
                className="p-3 rounded-xl"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg" style={{ color: THEME_COLORS.text }}>
                        {formatPersianMoney(p.amount)}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {label}
                      </span>
                    </div>
                    {p.tipAmount > 0 && (
                      <div className="text-xs" style={{ color: THEME_COLORS.green }}>
                        + انعام {formatPersianMoney(p.tipAmount)}
                      </div>
                    )}
                    <div className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
                      {p.receivedBy} - {new Date(p.receivedAt).toLocaleString('fa-IR')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleVoidClick(p.id)}
                    disabled={voidingPaymentId === p.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      backgroundColor: isConfirming ? THEME_COLORS.red : `${THEME_COLORS.red}20`,
                      color: isConfirming ? '#fff' : THEME_COLORS.red,
                    }}
                  >
                    {voidingPaymentId === p.id ? '...' : isConfirming ? 'تایید لغو' : 'لغو'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Voided Payments */}
          {voidedPayments.length > 0 && (
            <>
              <div className="text-xs font-medium pt-3" style={{ color: THEME_COLORS.subtext }}>
                پرداخت‌های لغو شده
              </div>
              {voidedPayments.map((p) => {
                const { label, color } = methodLabel(p.method);
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl opacity-50"
                    style={{ backgroundColor: `${THEME_COLORS.red}10` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold line-through" style={{ color: THEME_COLORS.text }}>
                        {formatPersianMoney(p.amount)}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {label}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{ backgroundColor: `${THEME_COLORS.red}20`, color: THEME_COLORS.red }}
                      >
                        لغو شده
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EdgeActions({
  saleId,
  router,
}: {
  saleId: number;
  router: { push: (url: string) => void };
}) {
  const [showWarning, setShowWarning] = useState(false);

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      <div className="text-sm font-bold mb-3" style={{ color: THEME_COLORS.subtext }}>
        عملیات دیگر
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowWarning(true)}
          className="px-4 py-2 rounded-xl font-medium transition-all"
          style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
        >
          افزودن آیتم به فروش
        </button>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="max-w-md w-full p-6 rounded-2xl"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
                توجه!
              </h3>
            </div>
            <p className="text-center mb-6" style={{ color: THEME_COLORS.subtext }}>
              افزودن آیتم جدید به فروش، محاسبات را تغییر می‌دهد.
              آیا مطمئن هستید؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
              >
                انصراف
              </button>
              <button
                onClick={() => router.push(`/sale/${saleId}`)}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: THEME_COLORS.orange, color: '#fff' }}
              >
                ادامه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW-ONLY MODE
// ═══════════════════════════════════════════════════════════════════════════════

function ViewOnlyMode({
  payment,
  router,
  saleId,
  ToastContainer,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any;
  saleId: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ToastContainer: any;
}) {
  const snapshot = payment.snapshot;
  const isCanceled = snapshot.saleState === 'CANCELED';

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header
        className="px-4 py-4 border-b"
        style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}
      >
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl font-medium"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              بازگشت
            </button>
            <h1 className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
              جزئیات فروش #{saleId}
            </h1>
          </div>
          <div
            className="px-4 py-2 rounded-xl font-bold"
            style={{
              backgroundColor: isCanceled ? `${THEME_COLORS.red}20` : `${THEME_COLORS.green}20`,
              color: isCanceled ? THEME_COLORS.red : THEME_COLORS.green,
            }}
          >
            {isCanceled ? 'لغو شده' : 'تسویه شده'}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>جمع فروش</div>
            <div className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
              {formatPersianMoney(snapshot.totalAmount)}
            </div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>پرداخت شده</div>
            <div className="text-xl font-bold" style={{ color: THEME_COLORS.green }}>
              {formatPersianMoney(snapshot.totalPaid)}
            </div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>مالیات</div>
            <div className="text-xl font-bold" style={{ color: THEME_COLORS.blue }}>
              {formatPersianMoney(snapshot.taxAmount)}
            </div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>تخفیف</div>
            <div className="text-xl font-bold" style={{ color: THEME_COLORS.orange }}>
              {formatPersianMoney(snapshot.discountAmount)}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
          <h3 className="font-bold mb-3" style={{ color: THEME_COLORS.text }}>
            اقلام فروش ({snapshot.items.length})
          </h3>
          <div className="space-y-2">
            {snapshot.items.map((item: { id: number; product_name: string; quantity: number; unit_price: number; total: number }) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 rounded-lg"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <div>
                  <div className="font-medium" style={{ color: THEME_COLORS.text }}>
                    {item.product_name}
                  </div>
                  <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                    {item.quantity} × {formatPersianMoney(item.unit_price)}
                  </div>
                </div>
                <div className="font-bold" style={{ color: THEME_COLORS.green }}>
                  {formatPersianMoney(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        {payment.payments.length > 0 && (
          <div className="p-4 rounded-xl" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <h3 className="font-bold mb-3" style={{ color: THEME_COLORS.text }}>
              تاریخچه پرداخت‌ها ({payment.payments.length})
            </h3>
            <div className="space-y-2">
              {payment.payments.map((p: { id: number; method: string; amount: number; tipAmount: number; receivedBy: string; receivedAt: string; status: string }) => {
                const isVoid = p.status === 'VOID';
                return (
                  <div
                    key={p.id}
                    className="flex justify-between items-center p-3 rounded-lg"
                    style={{
                      backgroundColor: isVoid ? `${THEME_COLORS.red}10` : THEME_COLORS.surface,
                      opacity: isVoid ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isVoid ? 'line-through' : ''}`} style={{ color: THEME_COLORS.text }}>
                          {formatPersianMoney(p.amount)}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: `${THEME_COLORS.accent}20`,
                            color: THEME_COLORS.accent,
                          }}
                        >
                          {p.method === 'CASH' ? 'نقدی' : p.method === 'POS' ? 'کارتخوان' : 'کارت'}
                        </span>
                        {isVoid && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold"
                            style={{ backgroundColor: `${THEME_COLORS.red}20`, color: THEME_COLORS.red }}
                          >
                            لغو شده
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
                        {p.receivedBy} - {new Date(p.receivedAt).toLocaleString('fa-IR')}
                      </div>
                    </div>
                    {p.tipAmount > 0 && (
                      <div className="text-sm" style={{ color: THEME_COLORS.green }}>
                        انعام: {formatPersianMoney(p.tipAmount)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
