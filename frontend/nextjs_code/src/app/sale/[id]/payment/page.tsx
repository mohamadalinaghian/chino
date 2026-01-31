/**
 * MAIN DOC IN doc.txt FILE.
 * Payment Page - Refactored
 *
 * Clean, component-based architecture following SOLID principles.
 *
 * Responsibilities:
 * - Coordinate between components and hooks
 * - Manage top-level state
 * - Handle routing and navigation
 * - Provide data to child components
 *
 * All business logic is extracted to:
 * - Hooks (usePaymentData, usePaymentSplits, usePaymentSubmission, usePaymentVoid)
 * - Utils (paymentCalculations, paymentValidation)
 * - Components (PaymentSplitPanel, PaymentHistory, ViewOnlyMode)
 */

'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';

// Components
import { SaleHeader } from '@/components/sale/salePayment/SaleHeader/SaleHeader';
import { SaleItemsColumn } from '@/components/sale/salePayment/SaleItemColumn/SaleItemColumn';
import { PaymentSplitPanel } from '@/components/sale/salePayment/PaymentSplitPanel';
import { PaymentHistory } from '@/components/sale/salePayment/PaymentHistory';
import { ViewOnlyMode } from '@/components/sale/salePayment/ViewOnlyMode';

// Hooks
import { useItemSelection } from '@/hooks/payment/useItemSelection';
import { useSaleSummary } from '@/hooks/payment/useSaleSummary';
import { usePaymentData } from '@/hooks/payment/usePaymentData';
import { usePaymentSplits } from '@/hooks/payment/usePaymentSplits';
import { usePaymentSubmission } from '@/hooks/payment/usePaymentSubmission';
import { usePaymentVoid } from '@/hooks/payment/usePaymentVoid';

// Utils
import { calculateSelectedItemsTotal } from '@/utils/paymentCalculation';

// Icons
import { DollarSign, RefreshCw, Trash2 } from 'lucide-react';

/**
 * Main Payment Page Component
 */
export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast, ToastContainer } = useToast();

  // Parse sale ID from route params
  const rawId = params.id;
  const saleId = typeof rawId === 'string' ? parseInt(rawId, 10) : NaN;

  // Animation state for recently paid items
  const [animatingItemId, setAnimatingItemId] = useState<number | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // Redirect if invalid sale ID
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isNaN(saleId) || saleId <= 0) {
      router.replace('/sale/dashboard');
    }
  }, [saleId, router]);

  // ──────────────────────────────────────────────────────────────────────────
  // Data Loading Hook
  // ──────────────────────────────────────────────────────────────────────────
  const handlePaymentError = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );
  const {
    sale,
    bankAccounts,
    posAccount,
    loading,
    refreshData,
  } = usePaymentData({
    saleId,
    onError: handlePaymentError,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Computed Values - Categorize Items
  // ──────────────────────────────────────────────────────────────────────────
  const unpaidItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.filter(item => item.quantity_remaining > 0);
  }, [sale]);

  const paidItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.filter(item => item.quantity_paid > 0);
  }, [sale]);

  const partiallyPaidItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.filter(
      item => item.quantity_paid > 0 && item.quantity_remaining > 0
    );
  }, [sale]);

  // ──────────────────────────────────────────────────────────────────────────
  // Item Selection Hook
  // ──────────────────────────────────────────────────────────────────────────
  const {
    selectedItems,
    toggleItemSelection,
    updateItemQuantity,
    selectAllItems,
    clearSelection,
  } = useItemSelection({ unpaidItems });

  // ──────────────────────────────────────────────────────────────────────────
  // Split Payments Hook
  // ──────────────────────────────────────────────────────────────────────────
  const {
    splits,
    splitCount,
    totalLockedAmount,
    totalUnlockedAmount,
    updateSplitCount,
    updateSplit,
    toggleSplitLock,
    distributeSelectedAmount,
    resetSplits,
  } = usePaymentSplits({
    items: sale?.items || [],
    selectedItems,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Payment Submission Hook
  // ──────────────────────────────────────────────────────────────────────────
  const { submitting, submitPayments } = usePaymentSubmission({
    saleId,
    onSuccess: (message) => {
      showToast(message, 'success');
      // Refresh data and reset state
      refreshData();
      clearSelection();
      resetSplits();
    },
    onError: (message) => showToast(message, 'error'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Payment Void Hook
  // ──────────────────────────────────────────────────────────────────────────
  const { voidingPaymentId, voidPaymentById } = usePaymentVoid({
    saleId,
    onSuccess: (message) => {
      showToast(message, 'success');
      refreshData();
    },
    onError: (message) => showToast(message, 'error'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Summary Calculations
  // ──────────────────────────────────────────────────────────────────────────
  const summaryCalculations = useSaleSummary(
    sale,
    selectedItems,
    sale?.total_paid || 0
  );

  const selectedItemsTotal = useMemo(() => {
    if (!sale) return 0;
    return calculateSelectedItemsTotal(sale.items, selectedItems);
  }, [sale, selectedItems]);

  // ──────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Handle item selection with animation
   */
  const handleItemToggle = (item: any) => {
    toggleItemSelection(item);
    setAnimatingItemId(item.id);
    setTimeout(() => setAnimatingItemId(null), 300);
  };

  /**
   * Handle payment submission
   */
  const handleSubmitPayment = async () => {
    await submitPayments(splits, selectedItems);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render States
  // ──────────────────────────────────────────────────────────────────────────

  // Loading state
  if (loading) {
    return <LoadingOverlay message="در حال بارگذاری..." />;
  }

  // No sale data
  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: THEME_COLORS.text }}>فروش یافت نشد</p>
      </div>
    );
  }

  // View-only mode for closed/canceled sales
  if (sale.state === 'CLOSED' || sale.state === 'CANCELED') {
    return (
      <>
        <ViewOnlyMode
          sale={sale}
          saleId={saleId}
          onBack={() => router.back()}
        />
        <ToastContainer />
      </>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Main Payment Interface
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen pb-6"
      style={{ backgroundColor: THEME_COLORS.bgPrimary }}
    >
      {/* Header */}
      <SaleHeader
        saleId={saleId}
        sale={sale}
        summaryCalculations={summaryCalculations}
        THEME_COLORS={THEME_COLORS}
      />

      {/* Main Content Grid */}
      <div className="max-w-[1800px] mx-auto px-5 pt-6 grid lg:grid-cols-12 gap-6">
        {/* Left Column - Unpaid Items */}
        <SaleItemsColumn
          unpaidItems={unpaidItems}
          partiallyPaidItems={partiallyPaidItems}
          selectedItems={selectedItems}
          animatingItemId={animatingItemId}
          toggleItemSelection={handleItemToggle}
          updateItemQuantity={updateItemQuantity}
          selectAllItems={selectAllItems}
          clearSelection={clearSelection}
          THEME_COLORS={THEME_COLORS}
        />

        {/* Middle Column - Split Payments */}
        <div className="lg:col-span-5 space-y-4">
          {/* Split Count Control */}
          <div
            className="p-5 rounded-2xl shadow-md"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
                تقسیم پرداخت
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateSplitCount(splitCount - 1)}
                  disabled={splitCount <= 1}
                  className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 transition-all font-bold text-lg"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-lg" style={{ color: THEME_COLORS.text }}>
                  {splitCount}
                </span>
                <button
                  onClick={() => updateSplitCount(splitCount + 1)}
                  disabled={splitCount >= 10}
                  className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 transition-all font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={distributeSelectedAmount}
              disabled={selectedItems.length === 0}
              className="w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: THEME_COLORS.accent,
                color: '#fff',
              }}
            >
              <RefreshCw className="w-5 h-5" />
              توزیع مبلغ ({formatPersianMoney(selectedItemsTotal)})
            </button>
          </div>

          {/* Split Panels */}
          <div className="space-y-4">
            {splits.map((split, index) => (
              <PaymentSplitPanel
                key={split.id}
                split={split}
                index={index}
                bankAccounts={bankAccounts}
                posAccount={posAccount}
                onUpdate={(updates) => updateSplit(split.id, updates)}
                onToggleLock={() => toggleSplitLock(split.id)}
                canDelete={splits.length > 1}
                THEME_COLORS={THEME_COLORS}
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitPayment}
            disabled={submitting || selectedItems.length === 0 || splits.length === 0}
            className="w-full px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{
              backgroundColor: THEME_COLORS.green,
              color: '#fff',
            }}
          >
            <DollarSign className="w-6 h-6" />
            {submitting ? 'در حال ثبت...' : 'ثبت پرداخت'}
          </button>
        </div>

        {/* Right Column - Payment History */}
        <div className="lg:col-span-3">
          <div
            className="p-5 rounded-2xl shadow-md sticky top-24"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: THEME_COLORS.text }}>
              تاریخچه پرداخت‌ها ({sale.payments?.length || 0})
            </h3>

            <PaymentHistory
              payments={sale.payments || []}
              voidingPaymentId={voidingPaymentId}
              onVoidPayment={voidPaymentById}
              THEME_COLORS={THEME_COLORS}
            />
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
