'use client';
import { SaleHeader } from '@/components/sale/salePayment/SaleHeader/SaleHeader';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { PaymentMethod, ISaleItemDetail, IAddPaymentInput, TaxDiscountType } from '@/types/sale';
import { fetchSaleDetails, fetchBankAccounts, addPaymentsToSale, voidPayment } from '@/service/sale';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL, API_ENDPOINTS } from '@/libs/constants';
import { useSaleSummary } from '@/hooks/payment/useSaleSummary';
import { SaleItemsColumn } from '@/components/sale/salePayment/SaleItemColumn/SaleItemColumn';
import { useItemSelection } from '@/hooks/payment/useItemSelection';

import type { SaleData, BankAccount, POSAccount, SplitPayment, PaymentRecord } from '@/types/payment';
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast, ToastContainer } = useToast();

  const rawId = params.id;
  const saleId = typeof rawId === 'string' ? parseInt(rawId, 10) : NaN;

  // ── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sale, setSale] = useState<SaleData | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<POSAccount | null>(null);

  // Item selection
  const [animatingItemId, setAnimatingItemId] = useState<number | null>(null);

  // Split payments
  const [splitCount, setSplitCount] = useState(1);
  const [splits, setSplits] = useState<SplitPayment[]>([createDefaultSplit(1)]);

  // Recently paid items (for animation)
  const [recentlyPaidItems, setRecentlyPaidItems] = useState<number[]>([]);

  // Voiding
  const [voidingPaymentId, setVoidingPaymentId] = useState<number | null>(null);

  // ── Invalid Sale ID Check ─────────────────────────────────────────────────
  useEffect(() => {
    if (isNaN(saleId) || saleId <= 0) {
      router.replace('/sale/dashboard');
    }
  }, [saleId, router]);

  // ── Data Loading ──────────────────────────────────────────────────────────
  // 1. Remove showToast from dependencies
  const loadData = useCallback(async () => {
    if (isNaN(saleId) || saleId <= 0) return;

    try {
      setLoading(true);
      const [saleData, accounts, pos] = await Promise.all([
        fetchSaleDetails(saleId),
        fetchBankAccounts(),
        authenticatedFetchJSON<POSAccount>(`${CS_API_URL}${API_ENDPOINTS.POS_ACCOUNT}`).catch(() => null),
      ]);

      setSale({
        ...saleData,
        payments: saleData.payments || [],
      } as SaleData);

      setPaidAmount(saleData.total_paid ?? 0);

      setBankAccounts(accounts as BankAccount[]);
      if (pos) setPosAccount(pos);
    } catch (err) {
      // You can still show toast here — it's fine
      showToast(err instanceof Error ? err.message : 'خطا در بارگذاری', 'error');
    } finally {
      setLoading(false);
    }
  }, [saleId]); // ← only saleId


  // 2. Now useEffect depends only on saleId
  useEffect(() => {
    loadData();
  }, [saleId]);   // ← safe — saleId changes very rarely

  // ── Computed Values ───────────────────────────────────────────────────────
  // Items that still have remaining quantity (can be selected for payment)
  const unpaidItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.filter(item => item.quantity_remaining > 0);
  }, [sale]);

  // Fully paid items (no remaining quantity)
  const fullyPaidItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.filter(item => item.quantity_remaining === 0 && item.quantity_paid > 0);
  }, [sale]);

  // Partially paid items (some paid, some remaining) - these show in both lists
  const partiallyPaidItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.filter(item => item.quantity_paid > 0 && item.quantity_remaining > 0);
  }, [sale]);

  // Combined list of items with any payment (for left column display)
  const paidItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.filter(item => item.quantity_paid > 0);
  }, [sale]);
  //
  // ── Item Selection ────────────────────────────────────────────────────────
  const {
    selectedItems,
    toggleItemSelection,
    updateItemQuantity,
    selectAllItems,
    clearSelection,
  } = useItemSelection({
    unpaidItems,
  });

  const selectedItemsTotal = useMemo(() => {
    if (!sale) return 0;

    return selectedItems.reduce((sum, sel) => {
      const item = sale.items.find(i => i.id === sel.itemId);
      if (!item) return sum;

      const baseTotal = sel.quantity * item.unit_price;

      const extrasTotal = item.extras.reduce(
        (eSum, e) => eSum + e.unit_price * e.quantity,
        0
      );

      const extrasProportional =
        item.quantity > 0
          ? (extrasTotal * sel.quantity) / item.quantity
          : 0;

      return sum + baseTotal + extrasProportional;
    }, 0);
  }, [sale, selectedItems]);

  const totalLockedAmount = useMemo(() => {
    return splits.filter(s => s.isLocked).reduce((sum, s) => {
      const taxAmount = s.taxEnabled ? Math.round(s.amount * s.taxPercent / 100) : 0;
      return sum + s.amount + taxAmount - s.discount + s.tipAmount;
    }, 0);
  }, [splits]);

  // Calculate total of selected items with their configured tax and discount from split panels
  const selectedItemsWithTaxDiscount = useMemo(() => {
    // Get all unlocked splits and calculate their total with tax/discount
    const unlockedSplits = splits.filter(s => !s.isLocked);
    return unlockedSplits.reduce((sum, split) => {
      const taxAmount = split.taxEnabled ? Math.round(split.amount * split.taxPercent / 100) : 0;
      return sum + split.amount + taxAmount - split.discount;
    }, 0);
  }, [splits]);

  const summaryCalculations = useSaleSummary(
    sale,
    selectedItems,
    paidAmount
  );


  // ── Split Payment Management ──────────────────────────────────────────────
  function createDefaultSplit(id: number): SplitPayment {
    return {
      id,
      amount: 0,
      taxEnabled: true,
      taxPercent: 10,
      discount: 0,
      paymentMethod: PaymentMethod.CARD_TRANSFER,
      accountId: null,
      isLocked: false,
      tipAmount: 0,
    };
  }

  const updateSplitCount = useCallback((count: number) => {
    const newCount = Math.max(1, Math.min(10, count));
    setSplitCount(newCount);

    // Preserve locked splits, adjust unlocked ones
    const lockedSplits = splits.filter(s => s.isLocked);
    const unlockedNeeded = newCount - lockedSplits.length;

    if (unlockedNeeded > 0) {
      const newSplits = [...lockedSplits];
      const unlockedSplits = splits.filter(s => !s.isLocked);

      // Keep existing unlocked splits up to needed count
      for (let i = 0; i < Math.min(unlockedNeeded, unlockedSplits.length); i++) {
        newSplits.push(unlockedSplits[i]);
      }

      // Create new splits if needed
      for (let i = unlockedSplits.length; i < unlockedNeeded; i++) {
        newSplits.push(createDefaultSplit(Date.now() + i));
      }

      setSplits(newSplits);
    } else {
      setSplits(lockedSplits);
    }
  }, [splits]);

  const distributeSplitAmounts = useCallback(() => {
    if (selectedItemsTotal <= 0) return;

    const unlockedSplits = splits.filter(s => !s.isLocked);
    if (unlockedSplits.length === 0) return;

    const lockedTotal = splits.filter(s => s.isLocked).reduce((sum, s) => sum + s.amount, 0);
    const remainingAmount = selectedItemsTotal - lockedTotal;
    const perSplit = Math.floor(remainingAmount / unlockedSplits.length);
    const remainder = remainingAmount - (perSplit * unlockedSplits.length);

    setSplits(prev => prev.map((split, idx) => {
      if (split.isLocked) return split;
      const unlockedIdx = prev.filter(s => !s.isLocked).indexOf(split);
      return {
        ...split,
        amount: perSplit + (unlockedIdx === 0 ? remainder : 0),
      };
    }));
  }, [selectedItemsTotal, splits]);

  // Auto-distribute when split count or selected items change
  useEffect(() => {
    distributeSplitAmounts();
  }, [splitCount, selectedItemsTotal]);

  const updateSplit = useCallback((splitId: number, updates: Partial<SplitPayment>) => {
    setSplits(prev => prev.map(s => s.id === splitId ? { ...s, ...updates } : s));
  }, []);

  // ── Payment Submission ────────────────────────────────────────────────────
  const handleSubmitSplit = useCallback(async (splitId: number) => {
    const split = splits.find(s => s.id === splitId);
    if (!split || split.isLocked || !sale) return;

    if (selectedItems.length === 0) {
      showToast('لطفاً حداقل یک آیتم انتخاب کنید', 'error');
      return;
    }

    if (split.amount <= 0) {
      showToast('مبلغ باید بزرگتر از صفر باشد', 'error');
      return;
    }

    // Validate account for non-cash methods
    if (split.paymentMethod !== PaymentMethod.CASH && !split.accountId) {
      if (split.paymentMethod === PaymentMethod.POS && !posAccount?.id) {
        showToast('کارتخوان تنظیم نشده است', 'error');
        return;
      }
      if (split.paymentMethod === PaymentMethod.CARD_TRANSFER) {
        showToast('لطفاً حساب مقصد را انتخاب کنید', 'error');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Calculate proportional items for this split based on payment amount
      // This fixes the issue where all items were marked as paid for partial payments
      const unlockedSplits = splits.filter(s => !s.isLocked);
      const isLastUnlockedSplit = unlockedSplits.length === 1 && unlockedSplits[0].id === splitId;

      let proportionalItems: { item_id: number; quantity: number }[] = [];

      if (splitCount === 1 || isLastUnlockedSplit) {
        // Single payment or last split: send all selected items
        proportionalItems = selectedItems.map(s => ({
          item_id: s.itemId,
          quantity: s.quantity,
        }));
      } else {
        // Multiple splits: calculate proportional items based on payment amount ratio
        const splitRatio = split.amount / selectedItemsTotal;
        let remainingRatio = splitRatio;

        for (const sel of selectedItems) {
          if (remainingRatio <= 0) break;

          const proportionalQty = Math.min(
            Math.ceil(sel.quantity * splitRatio),
            sel.quantity
          );

          if (proportionalQty > 0) {
            proportionalItems.push({
              item_id: sel.itemId,
              quantity: proportionalQty,
            });
          }
        }

        // If no items calculated (very small split), don't send items at all
        // Backend will record the payment without item allocation
        if (proportionalItems.length === 0) {
          proportionalItems = [];
        }
      }

      const payload: IAddPaymentInput = {
        method: split.paymentMethod,
        amount_applied: split.amount,
        tip_amount: split.tipAmount > 0 ? split.tipAmount : undefined,
        destination_account_id: split.paymentMethod === PaymentMethod.POS
          ? posAccount?.id
          : split.accountId,
        selected_items: proportionalItems.length > 0 ? proportionalItems : undefined,
        tax: split.taxEnabled ? { type: TaxDiscountType.PERCENTAGE, value: split.taxPercent } : null,
        discount: split.discount > 0 ? { type: TaxDiscountType.FIXED, value: split.discount } : null,
      };

      const response = await addPaymentsToSale(saleId, { payments: [payload] });

      // Mark split as locked
      updateSplit(splitId, { isLocked: true });

      // Track recently paid items for animation
      const newlyPaidIds = proportionalItems.map(s => s.item_id);
      setRecentlyPaidItems(newlyPaidIds);
      setTimeout(() => setRecentlyPaidItems([]), 1000);

      // Reload sale data to get updated item quantities
      await loadData();

      // Check if there are still unpaid items
      const updatedSale = await fetchSaleDetails(saleId);
      const hasRemainingItems = updatedSale.items.some(item => item.quantity_remaining > 0);

      // Only clear selection if all items are paid or this is the last split
      if (!hasRemainingItems || isLastUnlockedSplit) {
        setSelectedItems([]);
      } else {
        // Update selected items to reflect remaining quantities
        setSelectedItems(prev =>
          prev.map(sel => {
            const updatedItem = updatedSale.items.find(i => i.id === sel.itemId);
            if (updatedItem && updatedItem.quantity_remaining > 0) {
              return { ...sel, quantity: Math.min(sel.quantity, updatedItem.quantity_remaining), item: updatedItem as ISaleItemDetail };
            }
            return sel;
          }).filter(sel => sel.quantity > 0)
        );
      }

      // If there are remaining items but all splits are locked, create a new split
      // This ensures the payment form stays visible for continuing payments
      if (hasRemainingItems) {
        const remainingUnlockedSplits = splits.filter(s => !s.isLocked && s.id !== splitId);
        if (remainingUnlockedSplits.length === 0) {
          // Create a new split for continuing payment
          const newSplit = createDefaultSplit(Date.now());
          setSplits(prev => [...prev.filter(s => s.isLocked || s.id !== splitId), { ...prev.find(s => s.id === splitId)!, isLocked: true }, newSplit]);
          setSplitCount(prev => prev);
        }
      }

      const wasAutoClosed = response.was_auto_closed || response.is_fully_paid;
      showToast(
        wasAutoClosed
          ? 'پرداخت ثبت شد و فروش تسویه شد'
          : `پرداخت ${split.amount.toLocaleString('fa-IR')} تومان ثبت شد`,
        'success'
      );

      if (wasAutoClosed) {
        setTimeout(() => router.push('/sale/dashboard'), 1500);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در ثبت پرداخت', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [splits, sale, selectedItems, selectedItemsTotal, splitCount, posAccount, saleId, loadData, router, showToast, updateSplit]);

  // ── Void Payment ──────────────────────────────────────────────────────────
  const handleVoidPayment = useCallback(async (paymentId: number) => {
    if (!sale || voidingPaymentId) return;

    setVoidingPaymentId(paymentId);
    try {
      await voidPayment(saleId, paymentId);
      await loadData();
      showToast('پرداخت با موفقیت لغو شد', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در لغو پرداخت', 'error');
    } finally {
      setVoidingPaymentId(null);
    }
  }, [sale, voidingPaymentId, saleId, loadData, showToast]);

  // ── Render Guards ─────────────────────────────────────────────────────────
  if (isNaN(saleId) || saleId <= 0) {
    return null;
  }

  if (loading) {
    return <LoadingOverlay message="در حال بارگذاری..." />;
  }

  if (!sale) {
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

  // View-only mode for closed/canceled sales
  if (sale.is_fully_paid || sale.state === 'CANCELED') {
    return (
      <ViewOnlyMode
        sale={sale}
        router={router}
        saleId={saleId}
        ToastContainer={ToastContainer}
        onVoidPayment={handleVoidPayment}
        voidingPaymentId={voidingPaymentId}
      />
    );
  }

  const unlockedSplits = splits.filter(s => !s.isLocked);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SaleHeader
        saleId={saleId}
        sale={sale}
        summaryCalculations={summaryCalculations}
        THEME_COLORS={THEME_COLORS}
      />


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN 3-COLUMN LAYOUT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN: Sale Items */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <SaleItemsColumn
            unpaidItems={unpaidItems}
            partiallyPaidItems={partiallyPaidItems}
            selectedItems={selectedItems}
            animatingItemId={animatingItemId}
            THEME_COLORS={THEME_COLORS}
            selectAllItems={selectAllItems}
            clearSelection={clearSelection}
            toggleItemSelection={toggleItemSelection}
            updateItemQuantity={updateItemQuantity}
          />
          {/* ─────────────────────────────────────────────────────────────── */}
          {/* CENTER COLUMN: Payment Controls */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            {/* Selected Items Summary */}
            <div className="px-4 py-3 border-b" style={{ borderColor: THEME_COLORS.border }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold" style={{ color: THEME_COLORS.text }}>
                  آیتم‌های انتخاب شده ({selectedItems.length})
                </h2>
                <div className="text-lg font-bold" style={{ color: THEME_COLORS.accent }}>
                  {formatPersianMoney(selectedItemsTotal)}
                </div>
              </div>

              {/* Selected items mini-list */}
              {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedItems.map(sel => {
                    const item = sale?.items.find(i => i.id === sel.itemId);
                    if (!item) return null;

                    return (
                      <div
                        key={sel.itemId}
                        className="px-2 py-1 rounded-lg text-xs font-medium animate-appear-selection"
                        style={{ backgroundColor: `${THEME_COLORS.accent}20`, color: THEME_COLORS.accent }}
                      >
                        {item.product_name}
                        {sel.quantity > 1 && ` ×${sel.quantity}`}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Split Count Control */}
            <div className="px-4 py-3 border-b" style={{ borderColor: THEME_COLORS.border }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium block" style={{ color: THEME_COLORS.text }}>
                    تعداد نفرات برای تقسیم هزینه
                  </span>
                  <span className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                    برای پرداخت چند نفره، تعداد را افزایش دهید
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSplitCount(splitCount - 1)}
                    disabled={splitCount <= 1}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold disabled:opacity-50"
                    style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xl font-bold" style={{ color: THEME_COLORS.accent }}>
                    {splitCount}
                  </span>
                  <button
                    onClick={() => updateSplitCount(splitCount + 1)}
                    disabled={splitCount >= 10}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold disabled:opacity-50"
                    style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
                  >
                    +
                  </button>
                </div>
              </div>

              {splitCount > 1 && (
                <button
                  onClick={distributeSplitAmounts}
                  className="mt-2 w-full py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.accent }}
                >
                  تقسیم مساوی مبالغ بین {splitCount} نفر
                </button>
              )}
            </div>

            {/* Split Payments - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {splits.map((split, index) => (
                <SplitPaymentCard
                  key={split.id}
                  split={split}
                  index={index}
                  totalSplits={splits.length}
                  bankAccounts={bankAccounts}
                  posAccount={posAccount}
                  onUpdate={(updates) => updateSplit(split.id, updates)}
                  onSubmit={() => handleSubmitSplit(split.id)}
                  submitting={submitting}
                  disabled={selectedItems.length === 0}
                />
              ))}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN: Summary Card, Paid Items & History */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            {/* Payment Status Header */}
            <div className="px-4 py-3 border-b" style={{ borderColor: THEME_COLORS.border }}>
              <h2 className="font-bold" style={{ color: THEME_COLORS.text }}>
                وضعیت پرداخت اقلام
              </h2>
              <div className="flex gap-3 mt-1 text-xs">
                {fullyPaidItems.length > 0 && (
                  <span style={{ color: THEME_COLORS.green }}>
                    پرداخت شده: {fullyPaidItems.length}
                  </span>
                )}
                {partiallyPaidItems.length > 0 && (
                  <span style={{ color: THEME_COLORS.orange }}>
                    پرداخت ناقص: {partiallyPaidItems.length}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Partially Paid Items - These are important to show first */}
              {partiallyPaidItems.length > 0 && (
                <div className="p-3 space-y-2 border-b" style={{ borderColor: THEME_COLORS.border }}>
                  <div className="text-xs font-bold mb-2" style={{ color: THEME_COLORS.orange }}>
                    پرداخت ناقص - نیاز به تکمیل پرداخت
                  </div>
                  {partiallyPaidItems.map(item => {
                    const isRecentlyPaid = recentlyPaidItems.includes(item.id);
                    const paidAmount = item.quantity_paid * item.unit_price;
                    const remainingAmount = item.quantity_remaining * item.unit_price;
                    const totalItemAmount = item.quantity * item.unit_price;
                    const paidPercentage = Math.round((item.quantity_paid / item.quantity) * 100);
                    const extrasTotal = item.extras?.reduce((sum, e) => sum + e.unit_price * e.quantity, 0) || 0;
                    const extrasRemainingProportional = item.quantity > 0 ? (extrasTotal * item.quantity_remaining / item.quantity) : 0;

                    return (
                      <div
                        key={`partial-${item.id}`}
                        className={`p-3 rounded-lg ${isRecentlyPaid ? 'animate-slide-to-paid' : ''}`}
                        style={{ backgroundColor: `${THEME_COLORS.orange}15`, border: `1px solid ${THEME_COLORS.orange}30` }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: THEME_COLORS.orange }}
                            >
                              <span className="text-white text-[10px] font-bold">{paidPercentage}%</span>
                            </div>
                            <span className="text-sm font-medium" style={{ color: THEME_COLORS.text }}>
                              {item.product_name}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: THEME_COLORS.surface }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${paidPercentage}%`, backgroundColor: THEME_COLORS.orange }}
                          />
                        </div>

                        {/* Payment details */}
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span style={{ color: THEME_COLORS.subtext }}>پرداخت شده:</span>
                            <span className="font-bold mr-1 number-display" style={{ color: THEME_COLORS.green }}>
                              {formatPersianMoney(paidAmount)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: THEME_COLORS.subtext }}>باقیمانده:</span>
                            <span className="font-bold mr-1 number-display" style={{ color: THEME_COLORS.orange }}>
                              {formatPersianMoney(remainingAmount + extrasRemainingProportional)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-1 text-xs" style={{ color: THEME_COLORS.subtext }}>
                          {item.quantity_paid} از {item.quantity} عدد پرداخت شده
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fully Paid Items */}
              {fullyPaidItems.length > 0 && (
                <div className="p-3 space-y-2 border-b" style={{ borderColor: THEME_COLORS.border }}>
                  <div className="text-xs font-bold mb-2" style={{ color: THEME_COLORS.green }}>
                    تکمیل شده
                  </div>
                  {fullyPaidItems.map(item => {
                    const isRecentlyPaid = recentlyPaidItems.includes(item.id);
                    return (
                      <div
                        key={`paid-${item.id}`}
                        className={`p-2 rounded-lg ${isRecentlyPaid ? 'animate-slide-to-paid' : ''}`}
                        style={{ backgroundColor: `${THEME_COLORS.green}15` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: THEME_COLORS.green }}
                            >
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="text-sm font-medium" style={{ color: THEME_COLORS.text }}>
                              {item.product_name}
                            </span>
                          </div>
                          <span className="text-sm font-bold number-display" style={{ color: THEME_COLORS.green }}>
                            {formatPersianMoney(item.quantity_paid * item.unit_price)}
                          </span>
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
                            {item.quantity} عدد
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment History */}
              <div className="p-3">
                <h3 className="font-bold mb-2 text-sm" style={{ color: THEME_COLORS.text }}>
                  تاریخچه پرداخت‌ها ({sale.payments.filter(p => p.status === 'COMPLETED').length})
                </h3>

                {sale.payments.length === 0 ? (
                  <div className="text-center py-4 text-sm" style={{ color: THEME_COLORS.subtext }}>
                    هنوز پرداختی ثبت نشده
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sale.payments.filter(p => p.status === 'COMPLETED').map(payment => (
                      <PaymentHistoryItem
                        key={payment.id}
                        payment={payment}
                        onVoid={handleVoidPayment}
                        voiding={voidingPaymentId === payment.id}
                      />
                    ))}

                    {/* Voided payments */}
                    {sale.payments.filter(p => p.status === 'VOID').length > 0 && (
                      <>
                        <div className="text-xs font-medium pt-2 mt-2 border-t" style={{ color: THEME_COLORS.subtext, borderColor: THEME_COLORS.border }}>
                          لغو شده
                        </div>
                        {sale.payments.filter(p => p.status === 'VOID').map(payment => (
                          <div
                            key={payment.id}
                            className="p-2 rounded-lg opacity-50"
                            style={{ backgroundColor: `${THEME_COLORS.red}10` }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm line-through" style={{ color: THEME_COLORS.text }}>
                                {formatPersianMoney(payment.amount_applied)}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${THEME_COLORS.red}20`, color: THEME_COLORS.red }}>
                                لغو شده
                              </span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Partial Payment Progress */}
            {totalLockedAmount > 0 && totalLockedAmount < selectedItemsTotal && (
              <div className="p-3 border-t" style={{ borderColor: THEME_COLORS.border }}>
                <div className="text-xs mb-1" style={{ color: THEME_COLORS.subtext }}>
                  پیشرفت پرداخت
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: THEME_COLORS.surface }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (totalLockedAmount / selectedItemsTotal) * 100)}%`,
                      backgroundColor: THEME_COLORS.green,
                    }}
                  />
                </div>
                <div className="text-xs mt-1 text-center" style={{ color: THEME_COLORS.green }}>
                  {Math.round((totalLockedAmount / selectedItemsTotal) * 100)}% پرداخت شده
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {submitting && <LoadingOverlay message="در حال ثبت پرداخت..." />}
      <ToastContainer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPLIT PAYMENT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SplitPaymentCardProps {
  split: SplitPayment;
  index: number;
  totalSplits: number;
  bankAccounts: BankAccount[];
  posAccount: POSAccount | null;
  onUpdate: (updates: Partial<SplitPayment>) => void;
  onSubmit: () => void;
  submitting: boolean;
  disabled: boolean;
}

function SplitPaymentCard({
  split,
  index,
  totalSplits,
  bankAccounts,
  posAccount,
  onUpdate,
  onSubmit,
  submitting,
  disabled,
}: SplitPaymentCardProps) {
  const taxAmount = split.taxEnabled ? Math.round(split.amount * split.taxPercent / 100) : 0;
  const totalWithTaxDiscount = split.amount + taxAmount - split.discount;
  const finalTotal = totalWithTaxDiscount + split.tipAmount;

  if (split.isLocked) {
    return (
      <div
        className="p-4 rounded-xl"
        style={{ backgroundColor: `${THEME_COLORS.green}15`, border: `2px solid ${THEME_COLORS.green}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.green }}>
              <span className="text-white text-sm">✓</span>
            </div>
            <span className="font-bold" style={{ color: THEME_COLORS.green }}>
              پرداخت {index + 1} ثبت شد
            </span>
          </div>
          <span className="font-bold number-display" style={{ color: THEME_COLORS.green }}>
            {formatPersianMoney(finalTotal)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-xl space-y-4 animate-split-appear"
      style={{ backgroundColor: THEME_COLORS.surface, border: `2px solid ${THEME_COLORS.border}` }}
    >
      {/* Header */}
      {totalSplits > 1 && (
        <div className="font-bold" style={{ color: THEME_COLORS.accent }}>
          پرداخت {index + 1} از {totalSplits}
        </div>
      )}

      {/* Amount Input */}
      <div>
        <label className="text-sm font-medium mb-1 block" style={{ color: THEME_COLORS.subtext }}>
          مبلغ پرداخت
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={split.amount || ''}
          onChange={(e) => onUpdate({ amount: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
          placeholder="۰"
          className="w-full p-3 rounded-lg text-xl font-bold bg-transparent outline-none number-input"
          style={{
            backgroundColor: THEME_COLORS.bgSecondary,
            color: THEME_COLORS.accent,
            border: `2px solid ${THEME_COLORS.border}`,
          }}
        />
      </div>

      {/* Tax Toggle and Percentage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: THEME_COLORS.text }}>
            مالیات
          </span>
          <button
            onClick={() => onUpdate({ taxEnabled: !split.taxEnabled })}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
            style={{
              backgroundColor: split.taxEnabled ? THEME_COLORS.blue : THEME_COLORS.bgSecondary,
              color: split.taxEnabled ? '#fff' : THEME_COLORS.subtext,
              border: `2px solid ${split.taxEnabled ? THEME_COLORS.blue : THEME_COLORS.border}`,
            }}
          >
            {split.taxEnabled ? 'فعال' : 'غیرفعال'}
          </button>
        </div>

        {/* Tax Percentage Input */}
        {split.taxEnabled && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: THEME_COLORS.subtext }}>
              درصد مالیات:
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdate({ taxPercent: Math.max(0, split.taxPercent - 1) })}
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: THEME_COLORS.bgSecondary, color: THEME_COLORS.text }}
              >
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={split.taxPercent}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                  onUpdate({ taxPercent: Math.min(100, val) });
                }}
                className="w-12 p-1 rounded text-center text-sm font-bold bg-transparent outline-none number-input"
                style={{
                  backgroundColor: THEME_COLORS.bgSecondary,
                  color: THEME_COLORS.blue,
                  border: `1px solid ${THEME_COLORS.border}`,
                }}
              />
              <span className="text-sm" style={{ color: THEME_COLORS.subtext }}>%</span>
              <button
                onClick={() => onUpdate({ taxPercent: Math.min(100, split.taxPercent + 1) })}
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: THEME_COLORS.bgSecondary, color: THEME_COLORS.text }}
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tax Amount Display */}
      {split.taxEnabled && taxAmount > 0 && (
        <div className="flex justify-between text-sm" style={{ color: THEME_COLORS.blue }}>
          <span>+ مالیات ({split.taxPercent}%)</span>
          <span className="number-display">{formatPersianMoney(taxAmount)}</span>
        </div>
      )}

      {/* Discount Input */}
      <div>
        <label className="text-sm font-medium mb-1 block" style={{ color: THEME_COLORS.subtext }}>
          تخفیف (تومان)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={split.discount || ''}
          onChange={(e) => onUpdate({ discount: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
          placeholder="۰"
          className="w-full p-2 rounded-lg text-lg font-bold bg-transparent outline-none number-input"
          style={{
            backgroundColor: THEME_COLORS.bgSecondary,
            color: THEME_COLORS.orange,
            border: `2px solid ${THEME_COLORS.border}`,
          }}
        />
      </div>

      {/* Tip Input */}
      <div>
        <label className="text-sm font-medium mb-1 block" style={{ color: THEME_COLORS.subtext }}>
          انعام (اختیاری)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={split.tipAmount || ''}
          onChange={(e) => onUpdate({ tipAmount: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
          placeholder="۰"
          className="w-full p-2 rounded-lg text-lg font-bold bg-transparent outline-none number-input"
          style={{
            backgroundColor: THEME_COLORS.bgSecondary,
            color: THEME_COLORS.green,
            border: `2px solid ${THEME_COLORS.border}`,
          }}
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: THEME_COLORS.subtext }}>
          روش پرداخت
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: PaymentMethod.CASH, label: 'نقدی', icon: '💵', color: THEME_COLORS.green },
            { value: PaymentMethod.POS, label: 'کارتخوان', icon: '💳', color: THEME_COLORS.purple },
            { value: PaymentMethod.CARD_TRANSFER, label: 'کارت', icon: '🏦', color: THEME_COLORS.accent },
          ].map((method) => (
            <button
              key={method.value}
              onClick={() => onUpdate({
                paymentMethod: method.value,
                accountId: method.value === PaymentMethod.POS ? posAccount?.id || null : null,
              })}
              className="py-2 rounded-lg font-medium text-sm transition-all flex flex-col items-center gap-1"
              style={{
                backgroundColor: split.paymentMethod === method.value ? method.color : THEME_COLORS.bgSecondary,
                color: split.paymentMethod === method.value ? '#fff' : THEME_COLORS.text,
                border: `2px solid ${split.paymentMethod === method.value ? method.color : THEME_COLORS.border}`,
              }}
            >
              <span>{method.icon}</span>
              <span>{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bank Account Selection */}
      {split.paymentMethod === PaymentMethod.CARD_TRANSFER && (
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: THEME_COLORS.subtext }}>
            حساب مقصد
          </label>
          <div className="space-y-2 max-h-24 overflow-y-auto">
            {bankAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => onUpdate({ accountId: account.id })}
                className="w-full p-2 rounded-lg text-right text-sm transition-all"
                style={{
                  backgroundColor: split.accountId === account.id ? `${THEME_COLORS.accent}15` : THEME_COLORS.bgSecondary,
                  border: `2px solid ${split.accountId === account.id ? THEME_COLORS.accent : THEME_COLORS.border}`,
                }}
              >
                <div className="font-medium" style={{ color: THEME_COLORS.text }}>{account.related_user_name}</div>
                <div className="text-xs number-display" style={{ color: THEME_COLORS.subtext }}>{account.card_number}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* POS Account Display */}
      {split.paymentMethod === PaymentMethod.POS && posAccount?.id && (
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${THEME_COLORS.green}15`, border: `2px solid ${THEME_COLORS.green}` }}>
          <div className="text-sm font-medium" style={{ color: THEME_COLORS.text }}>{posAccount.account_owner}</div>
          <div className="text-xs number-display" style={{ color: THEME_COLORS.subtext }}>{posAccount.card_number}</div>
        </div>
      )}

      {/* Total Summary */}
      <div className="pt-3 border-t" style={{ borderColor: THEME_COLORS.border }}>
        <div className="flex justify-between items-center">
          <span className="font-bold" style={{ color: THEME_COLORS.text }}>جمع کل:</span>
          <span className="text-xl font-black number-display" style={{ color: THEME_COLORS.accent }}>
            {formatPersianMoney(finalTotal)}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={disabled || submitting || split.amount <= 0}
        className={`w-full py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 ${!disabled && split.amount > 0 ? 'animate-submit-pulse' : ''
          }`}
        style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
      >
        {submitting ? 'در حال ثبت...' : `ثبت پرداخت ${formatPersianMoney(finalTotal)}`}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT HISTORY ITEM
// ═══════════════════════════════════════════════════════════════════════════════

interface PaymentHistoryItemProps {
  payment: PaymentRecord;
  onVoid: (id: number) => void;
  voiding: boolean;
}

function PaymentHistoryItem({ payment, onVoid, voiding }: PaymentHistoryItemProps) {
  const [confirmVoid, setConfirmVoid] = useState(false);

  const methodConfig: Record<string, { label: string; color: string }> = {
    CASH: { label: 'نقدی', color: THEME_COLORS.green },
    POS: { label: 'کارتخوان', color: THEME_COLORS.purple },
    CARD_TRANSFER: { label: 'کارت', color: THEME_COLORS.accent },
  };

  const config = methodConfig[payment.method] || { label: payment.method, color: THEME_COLORS.text };

  const handleVoidClick = () => {
    if (confirmVoid) {
      onVoid(payment.id);
      setConfirmVoid(false);
    } else {
      setConfirmVoid(true);
    }
  };

  return (
    <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold number-display" style={{ color: THEME_COLORS.text }}>
              {formatPersianMoney(payment.amount_applied)}
            </span>
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              {config.label}
            </span>
          </div>
          {payment.tip_amount > 0 && (
            <div className="text-xs" style={{ color: THEME_COLORS.green }}>
              + انعام {formatPersianMoney(payment.tip_amount)}
            </div>
          )}
          <div className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
            {payment.received_by_name} - {new Date(payment.received_at).toLocaleString('fa-IR')}
          </div>
        </div>

        <button
          onClick={handleVoidClick}
          disabled={voiding}
          className="px-2 py-1 rounded text-xs font-bold transition-all"
          style={{
            backgroundColor: confirmVoid ? THEME_COLORS.red : `${THEME_COLORS.red}20`,
            color: confirmVoid ? '#fff' : THEME_COLORS.red,
          }}
        >
          {voiding ? '...' : confirmVoid ? 'تایید لغو' : 'لغو'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW ONLY MODE
// ═══════════════════════════════════════════════════════════════════════════════

interface ViewOnlyModeProps {
  sale: SaleData;
  router: ReturnType<typeof useRouter>;
  saleId: number;
  ToastContainer: React.ComponentType;
  onVoidPayment: (id: number) => void;
  voidingPaymentId: number | null;
}

function ViewOnlyMode({ sale, router, saleId, ToastContainer, onVoidPayment, voidingPaymentId }: ViewOnlyModeProps) {
  const isCanceled = sale.state === 'CANCELED';

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
            <div className="text-xl font-bold number-display" style={{ color: THEME_COLORS.text }}>
              {formatPersianMoney(sale.total_amount)}
            </div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>پرداخت شده</div>
            <div className="text-xl font-bold number-display" style={{ color: THEME_COLORS.green }}>
              {formatPersianMoney(sale.total_paid)}
            </div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>مالیات</div>
            <div className="text-xl font-bold number-display" style={{ color: THEME_COLORS.blue }}>
              {formatPersianMoney(sale.tax_amount)}
            </div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>تخفیف</div>
            <div className="text-xl font-bold number-display" style={{ color: THEME_COLORS.orange }}>
              {formatPersianMoney(sale.discount_amount)}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
          <h3 className="font-bold mb-3" style={{ color: THEME_COLORS.text }}>
            اقلام فروش ({sale.items.length})
          </h3>
          <div className="space-y-2">
            {sale.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 rounded-lg"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <div>
                  <div className="font-medium" style={{ color: THEME_COLORS.text }}>
                    {item.product_name}
                  </div>
                  <div className="text-sm number-display" style={{ color: THEME_COLORS.subtext }}>
                    {item.quantity} × {formatPersianMoney(item.unit_price)}
                  </div>
                </div>
                <div className="font-bold number-display" style={{ color: THEME_COLORS.green }}>
                  {formatPersianMoney(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        {sale.payments.length > 0 && (
          <div className="p-4 rounded-xl" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <h3 className="font-bold mb-3" style={{ color: THEME_COLORS.text }}>
              تاریخچه پرداخت‌ها ({sale.payments.length})
            </h3>
            <div className="space-y-2">
              {sale.payments.map((payment) => {
                const isVoid = payment.status === 'VOID';
                const methodConfig: Record<string, { label: string; color: string }> = {
                  CASH: { label: 'نقدی', color: THEME_COLORS.green },
                  POS: { label: 'کارتخوان', color: THEME_COLORS.purple },
                  CARD_TRANSFER: { label: 'کارت', color: THEME_COLORS.accent },
                };
                const config = methodConfig[payment.method] || { label: payment.method, color: THEME_COLORS.text };

                return (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 rounded-lg"
                    style={{
                      backgroundColor: isVoid ? `${THEME_COLORS.red}10` : THEME_COLORS.surface,
                      opacity: isVoid ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold number-display ${isVoid ? 'line-through' : ''}`} style={{ color: THEME_COLORS.text }}>
                          {formatPersianMoney(payment.amount_applied)}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: `${config.color}20`, color: config.color }}
                        >
                          {config.label}
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
                        {payment.received_by_name} - {new Date(payment.received_at).toLocaleString('fa-IR')}
                      </div>
                    </div>
                    {payment.tip_amount > 0 && (
                      <div className="text-sm number-display" style={{ color: THEME_COLORS.green }}>
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
      <ToastContainer />
    </div>
  );
}
