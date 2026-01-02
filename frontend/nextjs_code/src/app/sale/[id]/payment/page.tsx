/**
 * Sale Payment & Invoice Page
 *
 * Single Responsibility: Handle payment processing and invoice finalization
 *
 * Features:
 * - Display sale items and totals
 * - Add/edit tax and discount
 * - Accept multiple payment methods (CASH, POS, CARD_TRANSFER)
 * - Support split payments
 * - Real-time balance calculation
 * - Close sale with invoice generation
 * - Mobile responsive
 *
 * Permissions: Requires 'sale.close_sale' permission
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SaleApiClient } from '@/libs/sale/saleApiClient';
import { usePermissions, SalePermissions } from '@/hooks/usePermissions';
import { formatPersianMoney } from '@/libs/tools/persianMoney';
import { InvoiceSummary } from '@/components/payment/InvoiceSummary';
import { PaymentInput } from '@/components/payment/PaymentInput';
import type {
  SaleDetailResponse,
  PaymentInputSchema,
  CloseSaleResponse,
} from '@/types/saleType';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { hasPermission, loading: permissionLoading } = usePermissions();

  const saleId = Number(params.id);

  // State
  const [sale, setSale] = useState<SaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [taxAmount, setTaxAmount] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [payments, setPayments] = useState<PaymentInputSchema[]>([]);

  /**
   * Load sale details
   */
  useEffect(() => {
    const loadSale = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await SaleApiClient.getSaleDetail(saleId);

        // Check if sale is OPEN
        if (data.state !== 'OPEN') {
          setError('این فروش قبلاً بسته شده یا لغو شده است');
          return;
        }

        setSale(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات فروش'
        );
      } finally {
        setLoading(false);
      }
    };

    if (!permissionLoading && saleId) {
      loadSale();
    }
  }, [saleId, permissionLoading]);

  /**
   * Check permission and redirect if needed
   */
  useEffect(() => {
    if (!permissionLoading && !hasPermission(SalePermissions.CLOSE_SALE)) {
      router.push('/sale');
    }
  }, [permissionLoading, hasPermission, router]);

  /**
   * Calculate total paid from payments
   */
  const totalPaid = payments.reduce((sum, payment) => {
    return sum + parseFloat(payment.amount_applied || '0');
  }, 0);

  /**
   * Calculate final invoice total
   */
  const finalTotal = sale
    ? parseFloat(sale.total_amount) +
      parseFloat(taxAmount || '0') -
      parseFloat(discountAmount || '0')
    : 0;

  /**
   * Calculate balance due
   */
  const balanceDue = finalTotal - totalPaid;

  /**
   * Handle close sale with payments
   */
  const handleCloseSale = async () => {
    if (!sale) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await SaleApiClient.closeSale(saleId, {
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        payments,
      });

      // Success - redirect to sale detail
      router.push(`/sale/${saleId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در بستن فروش'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading || permissionLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !sale) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/sale')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            بازگشت به داشبورد
          </button>
        </div>
      </div>
    );
  }

  if (!sale) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-xl">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-100">
              پرداخت و صدور فاکتور
            </h1>
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Sale Info */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">
            اطلاعات فروش
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">شماره فروش:</span>
              <span className="text-gray-200">#{sale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">نوع:</span>
              <span className="text-gray-200">
                {sale.table_name ? `میز ${sale.table_name}` : 'بیرون‌بر'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">مبلغ کل:</span>
              <span className="text-xl font-bold text-green-400">
                {formatPersianMoney(sale.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">
            فاکتور
          </h2>
          <InvoiceSummary
            sale={sale}
            taxAmount={taxAmount}
            onTaxChange={setTaxAmount}
            discountAmount={discountAmount}
            onDiscountChange={setDiscountAmount}
          />
        </div>

        {/* Payment Input */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">
            پرداخت‌ها
          </h2>
          <PaymentInput
            payments={payments}
            onChange={setPayments}
            totalDue={finalTotal}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleCloseSale}
          disabled={submitting}
          className="
            w-full py-4 px-6
            bg-green-600 hover:bg-green-700
            disabled:bg-gray-700 disabled:text-gray-500
            text-white font-bold text-lg
            rounded-xl
            transition-all
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
          "
        >
          {submitting ? 'در حال پردازش...' : 'تایید و بستن فاکتور'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
