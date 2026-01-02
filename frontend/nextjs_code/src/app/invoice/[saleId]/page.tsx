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
 * ✅ Component-based architecture
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
import { CS_API_URL } from '@/libs/constants';
import {
  InvoiceDetailResponse,
  ProcessPaymentResponse,
  PaymentMethod,
  InvoiceStatus,
} from '@/types/invoiceType';
import { SaleDetailResponse } from '@/types/saleType';
import {
  InvoiceHeader,
  PaymentProgress,
  QuickPaymentButtons,
  PaymentForm,
  PaymentHistory,
} from '@/components/invoice';

interface BankAccount {
  id: number;
  bank_name: string;
  card_number: string;
  account_owner: string;
  account_balance: string;
}

export default function InvoicePaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const saleId = parseInt(params.saleId as string);

  // Data states
  const [sale, setSale] = useState<SaleDetailResponse | null>(null);
  const [invoice, setInvoice] = useState<InvoiceDetailResponse | ProcessPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment form states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Item selection for split payments
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Permissions
  const canPayment = user?.permissions?.includes('sale.close_sale') || false;

  /**
   * Load sale and initiate invoice
   */
  useEffect(() => {
    loadSaleAndInitiateInvoice();
  }, [saleId]);

  /**
   * Lazy load bank accounts only when needed
   */
  useEffect(() => {
    if (paymentMethod === PaymentMethod.CARD_TRANSFER || paymentMethod === PaymentMethod.POS) {
      if (bankAccounts.length === 0) {
        loadBankAccounts();
      }
    }
  }, [paymentMethod]);

  /**
   * Load bank accounts for card transfer (lazy loaded when needed)
   */
  const loadBankAccounts = async () => {
    try {
      const response = await fetch(`${CS_API_URL}/settings/bank-accounts/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const accounts = await response.json();
        setBankAccounts(accounts);

        // Also load POS account and set it as default for POS payment
        const posResponse = await fetch(`${CS_API_URL}/settings/pos-account/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (posResponse.ok) {
          const posAccount = await posResponse.json();
          if (posAccount.account_id) {
            setSelectedAccountId(posAccount.account_id);
          }
        }
      }
    } catch (err) {
      console.error('Error loading bank accounts:', err);
    }
  };

  const loadSaleAndInitiateInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load sale details
      const saleData = await SaleApiClient.getSaleDetail(saleId);
      setSale(saleData);

      // Initiate invoice (creates new or returns existing)
      const initiateData = await InvoiceApiClient.initiateInvoice(saleId);

      // Fetch full invoice details to get payment history
      const invoiceData = await InvoiceApiClient.getInvoiceDetail(initiateData.invoice_id);
      setInvoice(invoiceData);

      // Pre-fill remaining balance (or full amount if no payments)
      setAmount(invoiceData.balance_due);
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

    // Validate account selection for card transfer
    if (paymentMethod === PaymentMethod.CARD_TRANSFER && !selectedAccountId) {
      setError('لطفاً حساب مقصد را انتخاب کنید');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const paymentData = await InvoiceApiClient.processPayment(invoice.invoice_id, {
        method: paymentMethod,
        amount_applied: amount,
        tip_amount: tipAmount || '0',
        destination_account_id: paymentMethod !== PaymentMethod.CASH ? selectedAccountId : null,
        sale_item_ids: selectedItems.length > 0 ? selectedItems : undefined,
      });

      // Update invoice state
      setInvoice(paymentData);

      // Reset form
      setShowPaymentForm(false);
      setAmount('');
      setTipAmount('0');
      setSelectedItems([]);

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
   * Quick payment handlers
   */
  const handleQuickPayment = (percentage: number) => {
    if (!invoice) return;
    const total = parseFloat(invoice.total_amount);
    const quickAmount = total * (percentage / 100);
    setAmount(quickAmount.toFixed(2));
    setShowPaymentForm(true);
  };

  const handleCustomPayment = () => {
    setShowPaymentForm(true);
    if (!showPaymentForm && invoice) {
      setAmount(parseFloat(invoice.balance_due || invoice.total_amount).toString());
    }
  };

  /**
   * Item selection handlers
   */
  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const calculateSelectedItemsTotal = (): number => {
    if (!sale || selectedItems.length === 0) return 0;

    return sale.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => {
        const itemTotal = parseFloat(item.unit_price) * item.quantity;
        const extrasTotal = item.extras.reduce((sum, extra) =>
          sum + (parseFloat(extra.unit_price) * extra.quantity), 0
        );
        return total + itemTotal + extrasTotal;
      }, 0);
  };

  const applySelectedItemsAmount = () => {
    const total = calculateSelectedItemsTotal();
    if (total > 0) {
      setAmount(total.toString());
    }
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
      {/* Header */}
      <InvoiceHeader
        invoiceNumber={invoice.invoice_number}
        invoiceStatus={invoice.invoice_status}
        saleId={saleId}
        sale={sale}
        totalAmount={totalAmount}
        balanceDue={balanceDue}
        onBack={() => router.push(`/sale/${saleId}`)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Error Alert - Full Width */}
        {error && (
          <div className="bg-red-900/30 border-2 border-red-800 rounded-2xl p-5 flex items-start gap-4 mb-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-300 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
          </div>
        )}

        {/* Grid Layout - 2 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left Column */}
          <div className="space-y-3">
            <PaymentProgress totalPaid={totalPaid} totalAmount={totalAmount} />

            {!isPaid && canPayment && (
              <QuickPaymentButtons
                balanceDue={balanceDue}
                onFullPayment={() => handleQuickPayment(100)}
                onHalfPayment={() => handleQuickPayment(50)}
                onCustomPayment={handleCustomPayment}
              />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {showPaymentForm && !isPaid && (
              <PaymentForm
                paymentMethod={paymentMethod}
                amount={amount}
                tipAmount={tipAmount}
                selectedAccountId={selectedAccountId}
                selectedItems={selectedItems}
                bankAccounts={bankAccounts}
                sale={sale}
                onPaymentMethodChange={setPaymentMethod}
                onAmountChange={setAmount}
                onTipAmountChange={setTipAmount}
                onAccountSelect={setSelectedAccountId}
                onItemToggle={toggleItemSelection}
                onCalculateItemsAmount={applySelectedItemsAmount}
                onSubmit={handleProcessPayment}
                onCancel={() => setShowPaymentForm(false)}
                processing={processing}
              />
            )}

            <PaymentHistory payments={payments} />
          </div>
        </div>

        {/* Cancel Invoice Button - Full Width Below Grid */}
        {!isPaid && !isPartiallyPaid && canPayment && (
          <button
            onClick={handleCancelInvoice}
            disabled={canceling}
            className="w-full py-4 px-6 rounded-xl bg-red-900/30 hover:bg-red-900/40 border-2 border-red-700 text-red-400 font-bold flex items-center justify-center gap-3 disabled:opacity-50 mt-3"
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
          <div className="bg-green-900/30 border-2 border-green-700 rounded-2xl p-8 text-center mt-3">
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
