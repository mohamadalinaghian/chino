/**
 * Invoice Payment Page - /invoice/[saleId]
 *
 * FEATURES:
 * ✅ Initiate invoice from sale
 * ✅ Process payments (full, partial, multiple)
 * ✅ Cancel/abort invoice (rollback)
 * ✅ Auto-close sale on full payment
 * ✅ Beautiful mobile-first UI
 * ✅ Real-time balance calculation
 * ✅ Payment history display
 *
 * SCENARIOS:
 * 1. Full Payment: Invoice PAID → Sale auto-closes
 * 2. Partial Payment: Invoice PARTIALLY_PAID → Sale stays OPEN
 * 3. Cancel: Invoice VOID → Sale stays OPEN (rollback)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/libs/auth/AuthContext';
import { InvoiceApiClient } from '@/libs/invoice/invoiceApiClient';
import { SaleApiClient } from '@/libs/sale/saleApiClient';
import { formatPersianMoney } from '@/libs/tools/persianMoney';
import {
  InitiateInvoiceResponse,
  ProcessPaymentResponse,
  PaymentMethod,
  InvoiceStatus,
  PaymentDetail,
} from '@/types/invoiceType';
import { SaleDetailResponse } from '@/types/saleType';

export default function InvoicePaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const saleId = parseInt(params.saleId as string);

  // Data states
  const [sale, setSale] = useState<SaleDetailResponse | null>(null);
  const [invoice, setInvoice] = useState<InitiateInvoiceResponse | ProcessPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment form states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Permissions
  const canPayment = user?.permissions?.includes('sale.close_sale') || false;

  /**
   * Load sale and initiate invoice
   */
  useEffect(() => {
    loadSaleAndInitiateInvoice();
  }, [saleId]);

  const loadSaleAndInitiateInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load sale details
      const saleData = await SaleApiClient.getSaleDetail(saleId);
      setSale(saleData);

      // Initiate invoice
      const invoiceData = await InvoiceApiClient.initiateInvoice(saleId);
      setInvoice(invoiceData);

      // Pre-fill full amount
      setAmount(invoiceData.total_amount);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Process payment
   */
  const handleProcessPayment = async () => {
    if (!invoice || !amount || parseFloat(amount) <= 0) {
      setError('لطفاً مبلغ معتبری وارد کنید');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const paymentData = await InvoiceApiClient.processPayment(invoice.invoice_id, {
        method: paymentMethod,
        amount_applied: amount,
        tip_amount: tipAmount || '0',
        destination_account_id: paymentMethod !== PaymentMethod.CASH ? 1 : null, // TODO: Add account selector
      });

      // Update invoice state
      setInvoice(paymentData);

      // Reset form
      setShowPaymentForm(false);
      setAmount('');
      setTipAmount('0');

      // If fully paid, redirect to sale list
      if (paymentData.invoice_status === InvoiceStatus.PAID) {
        setTimeout(() => {
          alert('✅ پرداخت با موفقیت انجام شد. فروش بسته شد.');
          router.push('/sale');
        }, 1000);
      } else {
        // Show remaining balance
        const remaining = parseFloat(paymentData.balance_due);
        setAmount(remaining.toString());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ثبت پرداخت';
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Cancel invoice
   */
  const handleCancelInvoice = async () => {
    if (!invoice) return;

    const confirm = window.confirm(
      'آیا از لغو این فاکتور اطمینان دارید؟ فروش باز خواهد ماند و می‌توانید به ویرایش آن ادامه دهید.'
    );
    if (!confirm) return;

    try {
      setCanceling(true);
      setError(null);

      await InvoiceApiClient.cancelInvoice(invoice.invoice_id, {
        reason: 'لغو توسط کاربر',
      });

      alert('✅ فاکتور لغو شد. می‌توانید به ویرایش فروش برگردید.');
      router.push(`/sale/${saleId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در لغو فاکتور';
      setError(message);
    } finally {
      setCanceling(false);
    }
  };

  /**
   * Quick payment buttons
   */
  const handleQuickPayment = (percentage: number) => {
    if (!invoice) return;
    const total = parseFloat(invoice.total_amount);
    const quickAmount = total * (percentage / 100);
    setAmount(quickAmount.toFixed(2));
    setShowPaymentForm(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">💳</div>
          <p className="text-gray-400 text-lg">در حال بارگذاری فاکتور...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-900/20 border-2 border-red-800 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-3 text-red-400">خطا</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/sale')}
            className="w-full px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            بازگشت به داشبورد
          </button>
        </div>
      </div>
    );
  }

  if (!invoice || !sale) return null;

  const balanceDue = 'balance_due' in invoice ? parseFloat(invoice.balance_due) : parseFloat(invoice.total_amount);
  const totalPaid = 'total_paid' in invoice ? parseFloat(invoice.total_paid) : 0;
  const totalAmount = parseFloat(invoice.total_amount);
  const isPaid = invoice.invoice_status === InvoiceStatus.PAID;
  const isPartiallyPaid = invoice.invoice_status === InvoiceStatus.PARTIALLY_PAID;
  const payments = 'payments' in invoice ? invoice.payments : [];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-900 to-gray-900/95 border-b-4 border-purple-500 shadow-2xl backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/sale/${saleId}`)}
                className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center text-xl transition-all"
              >
                ←
              </button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-3">
                  💳 فاکتور #{invoice.invoice_number}
                  <span className={`
                    px-4 py-1.5 rounded-full text-sm font-medium border
                    ${isPaid ? 'bg-green-600/20 text-green-400 border-green-500' :
                      isPartiallyPaid ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500' :
                        'bg-red-600/20 text-red-400 border-red-500'}
                  `}>
                    {isPaid ? 'پرداخت شده' : isPartiallyPaid ? 'پرداخت جزئی' : 'پرداخت نشده'}
                  </span>
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  فروش #{sale.id} • {sale.table_number ? `میز ${sale.table_number}` : 'بیرون‌بر'}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">جمع کل فاکتور</p>
              <p className="text-lg font-bold text-white">{formatPersianMoney(totalAmount)}</p>
            </div>
            <div className={`rounded-xl p-4 border ${balanceDue > 0 ? 'bg-red-900/20 border-red-800' : 'bg-green-900/20 border-green-800'}`}>
              <p className="text-xs text-gray-400 mb-1">مانده پرداخت</p>
              <p className={`text-lg font-bold ${balanceDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {formatPersianMoney(balanceDue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-900/30 border-2 border-red-800 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-300 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
          </div>
        )}

        {/* Payment Progress */}
        {totalPaid > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-400">پرداخت شده</span>
              <span className="text-sm font-bold text-green-400">{((totalPaid / totalAmount) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalPaid / totalAmount) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-3 text-sm">
              <span className="text-green-400 font-bold">{formatPersianMoney(totalPaid)}</span>
              <span className="text-gray-400">از {formatPersianMoney(totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Quick Payment Buttons */}
        {!isPaid && canPayment && (
          <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-2 border-purple-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>⚡</span> پرداخت سریع
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleQuickPayment(100)}
                className="py-4 px-6 bg-gradient-to-br from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all"
              >
                💯 پرداخت کامل
                <div className="text-xs mt-1 opacity-90">{formatPersianMoney(balanceDue)}</div>
              </button>
              <button
                onClick={() => handleQuickPayment(50)}
                className="py-4 px-6 bg-gradient-to-br from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all"
              >
                50% پرداخت نصف
                <div className="text-xs mt-1 opacity-90">{formatPersianMoney(balanceDue * 0.5)}</div>
              </button>
            </div>
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="w-full py-4 px-6 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <span className="text-xl">💰</span> پرداخت با مبلغ دلخواه
            </button>
          </div>
        )}

        {/* Payment Form */}
        {showPaymentForm && !isPaid && (
          <div className="bg-gray-800 rounded-2xl p-6 border-2 border-indigo-500 space-y-5">
            <h3 className="text-lg font-bold mb-4">💳 ثبت پرداخت</h3>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">روش پرداخت</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                  className={`py-3 px-4 rounded-xl font-medium border-2 transition-all ${
                    paymentMethod === PaymentMethod.CASH
                      ? 'bg-green-600 border-green-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  💵 نقد
                </button>
                <button
                  onClick={() => setPaymentMethod(PaymentMethod.POS)}
                  className={`py-3 px-4 rounded-xl font-medium border-2 transition-all ${
                    paymentMethod === PaymentMethod.POS
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  💳 کارتخوان
                </button>
                <button
                  onClick={() => setPaymentMethod(PaymentMethod.CARD_TRANSFER)}
                  className={`py-3 px-4 rounded-xl font-medium border-2 transition-all ${
                    paymentMethod === PaymentMethod.CARD_TRANSFER
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  📱 کارت‌به‌کارت
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">مبلغ پرداختی (تومان)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-5 py-4 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-lg font-bold focus:border-indigo-500 focus:outline-none"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            {/* Tip Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">انعام (اختیاری)</label>
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full px-5 py-4 bg-gray-700 border-2 border-gray-600 rounded-xl text-white font-bold focus:border-green-500 focus:outline-none"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="flex-1 py-4 px-6 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium"
              >
                انصراف
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={processing || !amount || parseFloat(amount) <= 0}
                className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-lg flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>⏳ در حال ثبت...</>
                ) : (
                  <>✓ ثبت پرداخت</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📜</span> تاریخچه پرداخت‌ها
            </h3>
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="bg-gray-750 rounded-xl p-4 border border-gray-600"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-white">#{index + 1}</span>
                      <span className="text-sm text-gray-400 mr-3">{payment.method}</span>
                    </div>
                    <span className="text-lg font-bold text-green-400">
                      {formatPersianMoney(parseFloat(payment.amount_applied))}
                    </span>
                  </div>
                  {parseFloat(payment.tip_amount) > 0 && (
                    <p className="text-sm text-gray-400">
                      انعام: {formatPersianMoney(parseFloat(payment.tip_amount))}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(payment.received_at).toLocaleString('fa-IR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancel Invoice Button */}
        {!isPaid && !isPartiallyPaid && canPayment && (
          <button
            onClick={handleCancelInvoice}
            disabled={canceling}
            className="w-full py-4 px-6 rounded-xl bg-red-900/30 hover:bg-red-900/40 border-2 border-red-700 text-red-400 font-bold flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {canceling ? (
              <>⏳ در حال لغو...</>
            ) : (
              <>🗑️ لغو فاکتور و بازگشت به ویرایش</>
            )}
          </button>
        )}

        {/* Success Message */}
        {isPaid && (
          <div className="bg-green-900/30 border-2 border-green-700 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">پرداخت کامل شد!</h3>
            <p className="text-gray-300 mb-6">فروش به طور خودکار بسته شد.</p>
            <button
              onClick={() => router.push('/sale')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg"
            >
              بازگشت به داشبورد
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
