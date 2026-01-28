'use client';

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

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SaleData {
  id: number;
  state: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  subtotal_amount: number;
  total_paid: number;
  balance_due: number;
  is_fully_paid: boolean;
  payment_status: string;
  items: ISaleItemDetail[];
  payments: PaymentRecord[];
  // Guest and table info for display
  guest_name?: string | null;
  table_name?: string | null;
  sale_type: 'DINE_IN' | 'TAKEAWAY';
  opened_at: string;
}

interface PaymentRecord {
  id: number;
  method: string;
  amount_applied: number;
  amount_total: number;
  tip_amount: number;
  received_by_name: string;
  received_at: string;
  status: string;
  covered_items: { item_id: number; quantity_paid: number }[];
  destination_card_number?: string;
  destination_bank_name?: string;
  destination_account_owner?: string;
}

interface BankAccount {
  id: number;
  card_number: string;
  bank_name: string | null;
  related_user_name: string;
}

interface POSAccount {
  id: number | null;
  card_number: string | null;
  account_owner: string | null;
}

interface SelectedItem {
  itemId: number;
  quantity: number;
  item: ISaleItemDetail;
}

interface SplitPayment {
  id: number;
  amount: number;
  taxEnabled: boolean;
  taxPercent: number;
  discount: number;
  paymentMethod: PaymentMethod;
  accountId: number | null;
  isLocked: boolean;
  tipAmount: number;
}

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
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<POSAccount | null>(null);

  // Item selection
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [animatingItemId, setAnimatingItemId] = useState<number | null>(null);

  // Split payments
  const [splitCount, setSplitCount] = useState(1);
  const [splits, setSplits] = useState<SplitPayment[]>([createDefaultSplit(1)]);

  // Recently paid items (for animation)
  const [recentlyPaidItems, setRecentlyPaidItems] = useState<number[]>([]);

  // Voiding
  const [voidingPaymentId, setVoidingPaymentId] = useState<number | null>(null);

  // Payment in progress mode (locks item selection and modifications)
  const [paymentInProgress, setPaymentInProgress] = useState(false);

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
  const unpaidItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.filter(item => item.quantity_remaining > 0);
  }, [sale]);

  const paidItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.filter(item => item.quantity_paid > 0);
  }, [sale]);

  const selectedItemsTotal = useMemo(() => {
    return selectedItems.reduce((sum, sel) => {
      const item = sel.item;
      const baseTotal = sel.quantity * item.unit_price;
      const extrasTotal = item.extras?.reduce((eSum, e) => eSum + e.unit_price * e.quantity, 0) || 0;
      const extrasProportional = item.quantity > 0 ? (extrasTotal * sel.quantity / item.quantity) : 0;
      return sum + baseTotal + extrasProportional;
    }, 0);
  }, [selectedItems]);

  const totalLockedAmount = useMemo(() => {
    return splits.filter(s => s.isLocked).reduce((sum, s) => {
      const taxAmount = s.taxEnabled ? Math.round(s.amount * s.taxPercent / 100) : 0;
      return sum + s.amount + taxAmount - s.discount + s.tipAmount;
    }, 0);
  }, [splits]);

  // Summary calculations - dynamic based on splits
  const summaryCalculations = useMemo(() => {
    if (!sale) return { subtotal: 0, taxAmount: 0, discountAmount: 0, tipAmount: 0, totalAmount: 0, paidAmount: 0, remainingAmount: 0 };

    // Calculate based on selected items if any are selected, otherwise use all items
    const baseSubtotal = selectedItems.length > 0 ? selectedItemsTotal : sale.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const extrasTotal = item.extras?.reduce((eSum, e) => eSum + e.unit_price * e.quantity, 0) || 0;
      return sum + itemTotal + extrasTotal;
    }, 0);

    // Calculate total tax, discount, and tip from all unlocked splits
    const unlockedSplits = splits.filter(s => !s.isLocked);
    let totalTax = 0;
    let totalDiscount = 0;
    let totalTip = 0;

    // If we have selected items, calculate from current splits
    if (selectedItems.length > 0 && unlockedSplits.length > 0) {
      unlockedSplits.forEach(split => {
        if (split.taxEnabled) {
          totalTax += Math.round(split.amount * split.taxPercent / 100);
        }
        totalDiscount += split.discount;
        totalTip += split.tipAmount;
      });
    } else {
      // Default 10% tax when no items selected
      totalTax = Math.round(baseSubtotal * 0.10);
    }

    // Formula: Selected Items + Tax - Discount + Tip = Final Amount
    const totalAmount = baseSubtotal + totalTax - totalDiscount + totalTip;

    // Amount paid from backend
    const paidAmount = sale.total_paid;

    // Remaining amount
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    return { subtotal: baseSubtotal, taxAmount: totalTax, discountAmount: totalDiscount, tipAmount: totalTip, totalAmount, paidAmount, remainingAmount };
  }, [sale, selectedItems, selectedItemsTotal, splits]);

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

  // ── Item Selection ────────────────────────────────────────────────────────
  const toggleItemSelection = useCallback((item: ISaleItemDetail) => {
    const maxQty = item.quantity_remaining;
    const existing = selectedItems.find(s => s.itemId === item.id);

    // Trigger animation
    setAnimatingItemId(item.id);
    setTimeout(() => setAnimatingItemId(null), 400);

    if (existing) {
      // Deselect
      setSelectedItems(prev => prev.filter(s => s.itemId !== item.id));
    } else {
      // Select with full quantity
      setSelectedItems(prev => [...prev, { itemId: item.id, quantity: maxQty, item }]);
    }
  }, [selectedItems]);

  const updateItemQuantity = useCallback((itemId: number, quantity: number, item: ISaleItemDetail) => {
    const maxQty = item.quantity_remaining;
    const newQty = Math.max(0, Math.min(maxQty, quantity));

    if (newQty === 0) {
      setSelectedItems(prev => prev.filter(s => s.itemId !== itemId));
    } else {
      setSelectedItems(prev => {
        const existing = prev.find(s => s.itemId === itemId);
        if (existing) {
          return prev.map(s => s.itemId === itemId ? { ...s, quantity: newQty } : s);
        } else {
          return [...prev, { itemId, quantity: newQty, item }];
        }
      });
    }
  }, []);

  const selectAllItems = useCallback(() => {
    setSelectedItems(unpaidItems.map(item => ({
      itemId: item.id,
      quantity: item.quantity_remaining,
      item,
    })));
  }, [unpaidItems]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
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

    // Lock the page for payment process
    setPaymentInProgress(true);
    setSubmitting(true);

    try {
      // Calculate proportional items for this split based on payment amount
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

        for (const sel of selectedItems) {
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

      // Track recently paid items for animation
      const newlyPaidIds = proportionalItems.map(s => s.item_id);
      setRecentlyPaidItems(newlyPaidIds);
      setTimeout(() => setRecentlyPaidItems([]), 1000);

      // Reload sale data to get updated item quantities
      await loadData();

      // Check if there are still unpaid items
      const updatedSale = await fetchSaleDetails(saleId);
      const hasRemainingItems = updatedSale.items.some(item => item.quantity_remaining > 0);
      const wasAutoClosed = response.was_auto_closed || response.is_fully_paid;

      if (wasAutoClosed) {
        // Sale is fully paid - show success and redirect
        showToast('پرداخت ثبت شد و فروش تسویه شد', 'success');
        setTimeout(() => router.push('/sale/dashboard'), 1500);
      } else if (hasRemainingItems) {
        // There are more items to pay - prepare for next payment
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

        // Check if there are remaining unlocked splits
        const remainingUnlockedSplits = splits.filter(s => !s.isLocked && s.id !== splitId);

        if (remainingUnlockedSplits.length > 0) {
          // Mark current split as locked
          updateSplit(splitId, { isLocked: true });
        } else {
          // All splits are done but there are more items - reset for fresh payment
          // Create new default split and clear the old locked ones
          const newSplit = createDefaultSplit(Date.now());
          setSplits([newSplit]);
          setSplitCount(1);
          // Clear selection for user to select new items
          setSelectedItems([]);
        }

        // No toast here - just prepare UI for next action
      } else {
        // No remaining items - clear everything
        setSelectedItems([]);
        setSplits([createDefaultSplit(Date.now())]);
        setSplitCount(1);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در ثبت پرداخت', 'error');
    } finally {
      setSubmitting(false);
      setPaymentInProgress(false);
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
      <header
        className="flex-shrink-0 px-4 py-3 border-b"
        style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              بازگشت
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
                {sale.guest_name || sale.table_name || `فروش #${saleId}`}
              </h1>
              <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                {sale.table_name && <span className="ml-2">میز: {sale.table_name}</span>}
                {sale.opened_at && (
                  <span>
                    {new Date(sale.opened_at).toLocaleDateString('fa-IR')} - {new Date(sale.opened_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
              جمع: <span className="font-bold" style={{ color: THEME_COLORS.accent }}>{formatPersianMoney(sale.total_amount)}</span>
            </div>
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
              پرداخت شده: <span className="font-bold" style={{ color: THEME_COLORS.green }}>{formatPersianMoney(sale.total_paid)}</span>
            </div>
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
              مانده: <span className="font-bold" style={{ color: THEME_COLORS.orange }}>{formatPersianMoney(sale.balance_due)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN 3-COLUMN LAYOUT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN: Sale Items */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className={`lg:col-span-4 flex flex-col overflow-hidden rounded-xl ${paymentInProgress ? 'opacity-60 pointer-events-none' : ''}`} style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: THEME_COLORS.border }}>
              <h2 className="font-bold" style={{ color: THEME_COLORS.text }}>
                اقلام فروش ({unpaidItems.length})
              </h2>
              <div className="flex gap-2">
                {!paymentInProgress && (
                  <>
                    <button
                      onClick={selectAllItems}
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                    >
                      انتخاب همه
                    </button>
                    {selectedItems.length > 0 && (
                      <button
                        onClick={clearSelection}
                        className="px-3 py-1 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: THEME_COLORS.red, color: '#fff' }}
                      >
                        پاک کردن
                      </button>
                    )}
                  </>
                )}
                {paymentInProgress && (
                  <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: `${THEME_COLORS.orange}20`, color: THEME_COLORS.orange }}>
                    در حال پردازش...
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {unpaidItems.map(item => {
                const isSelected = selectedItems.some(s => s.itemId === item.id);
                const selectedQty = selectedItems.find(s => s.itemId === item.id)?.quantity || 0;
                const isAnimating = animatingItemId === item.id;
                const itemTotal = item.quantity_remaining * item.unit_price;
                const extrasTotal = item.extras?.reduce((sum, e) => sum + e.unit_price * e.quantity, 0) || 0;
                const extrasProportional = item.quantity > 0 ? (extrasTotal * item.quantity_remaining / item.quantity) : 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => !paymentInProgress && toggleItemSelection(item)}
                    className={`rounded-xl transition-all duration-300 overflow-hidden ${paymentInProgress ? '' : 'cursor-pointer'} ${isAnimating ? 'animate-slide-to-center' : ''
                      } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800' : paymentInProgress ? '' : 'hover:scale-[1.01]'}`}
                    style={{
                      backgroundColor: isSelected ? `${THEME_COLORS.accent}15` : THEME_COLORS.surface,
                      border: `2px solid ${isSelected ? THEME_COLORS.accent : THEME_COLORS.border}`,
                    }}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                            {item.product_name}
                          </div>
                          <div className="text-sm mt-1" style={{ color: THEME_COLORS.subtext }}>
                            {item.quantity_remaining > 1 ? (
                              <span>{formatPersianMoney(item.unit_price)} × {item.quantity_remaining}</span>
                            ) : (
                              <span>{formatPersianMoney(item.unit_price)}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-left">
                          <div className="font-bold text-lg" style={{ color: isSelected ? THEME_COLORS.green : THEME_COLORS.text }}>
                            {formatPersianMoney(itemTotal + extrasProportional)}
                          </div>
                          {isSelected && item.quantity_remaining > 1 && (
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemQuantity(item.id, selectedQty - 1, item);
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: THEME_COLORS.red, color: '#fff' }}
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-bold" style={{ color: THEME_COLORS.text }}>
                                {selectedQty}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemQuantity(item.id, selectedQty + 1, item);
                                }}
                                disabled={selectedQty >= item.quantity_remaining}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-50"
                                style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Extras */}
                      {item.extras && item.extras.length > 0 && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: THEME_COLORS.border }}>
                          <div className="text-xs font-bold mb-1" style={{ color: THEME_COLORS.purple }}>
                            افزودنی‌ها:
                          </div>
                          {item.extras.map(extra => (
                            <div key={extra.id} className="flex justify-between text-xs" style={{ color: THEME_COLORS.subtext }}>
                              <span>{extra.product_name} {extra.quantity > 1 ? `×${extra.quantity}` : ''}</span>
                              <span className="number-display">+{formatPersianMoney(extra.unit_price * extra.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div
                        className="px-3 py-1 text-center text-xs font-bold"
                        style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                      >
                        انتخاب شده
                      </div>
                    )}
                  </div>
                );
              })}

              {unpaidItems.length === 0 && (
                <div className="text-center py-8" style={{ color: THEME_COLORS.subtext }}>
                  همه اقلام پرداخت شده‌اند
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* CENTER COLUMN: Payment Controls */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className={`lg:col-span-5 flex flex-col overflow-hidden rounded-xl ${paymentInProgress ? 'ring-2 ring-orange-500' : ''}`} style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            {/* Show placeholder when no items selected */}
            {selectedItems.length === 0 && !paymentInProgress ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: THEME_COLORS.text }}>
                  آیتمی انتخاب نشده
                </h3>
                <p className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                  برای شروع پرداخت، از لیست سمت راست آیتم‌های مورد نظر را انتخاب کنید
                </p>
                <button
                  onClick={selectAllItems}
                  className="mt-4 px-6 py-3 rounded-xl font-bold"
                  style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                >
                  انتخاب همه آیتم‌ها
                </button>
              </div>
            ) : (
              <>
                {/* Payment in progress indicator */}
                {paymentInProgress && (
                  <div className="px-4 py-2 text-center font-bold" style={{ backgroundColor: THEME_COLORS.orange, color: '#fff' }}>
                    در حال پردازش پرداخت - لطفاً صبر کنید...
                  </div>
                )}

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
                      {selectedItems.map(sel => (
                        <div
                          key={sel.itemId}
                          className="px-2 py-1 rounded-lg text-xs font-medium animate-appear-selection"
                          style={{ backgroundColor: `${THEME_COLORS.accent}20`, color: THEME_COLORS.accent }}
                        >
                          {sel.item.product_name} {sel.quantity > 1 ? `×${sel.quantity}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Split Count Control */}
                <div className={`px-4 py-3 border-b ${paymentInProgress ? 'opacity-50 pointer-events-none' : ''}`} style={{ borderColor: THEME_COLORS.border }}>
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
                        disabled={splitCount <= 1 || paymentInProgress}
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
                        disabled={splitCount >= 10 || paymentInProgress}
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
                      disabled={paymentInProgress}
                      className="mt-2 w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50"
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
                      paymentInProgress={paymentInProgress}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN: Summary Card, Paid Items & History */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
            {/* Summary Card with Guest Name, Sale Type, and Date */}
            <div className="px-4 py-3 border-b" style={{ borderColor: THEME_COLORS.border, backgroundColor: `${THEME_COLORS.accent}10` }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-lg" style={{ color: THEME_COLORS.accent }}>
                  {sale.guest_name || sale.table_name || `فروش #${saleId}`}
                </h2>
                <span
                  className="px-2 py-1 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: sale.sale_type === 'DINE_IN' ? `${THEME_COLORS.blue}20` : `${THEME_COLORS.orange}20`,
                    color: sale.sale_type === 'DINE_IN' ? THEME_COLORS.blue : THEME_COLORS.orange,
                  }}
                >
                  {sale.sale_type === 'DINE_IN' ? 'سرو در محل' : 'بیرون بر'}
                </span>
              </div>
              <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                {sale.table_name && <span>میز: {sale.table_name} | </span>}
                {sale.opened_at && (
                  <span>
                    {new Date(sale.opened_at).toLocaleDateString('fa-IR')} - {new Date(sale.opened_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Dynamic Financial Summary - Updates with formula */}
              <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: THEME_COLORS.border }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: THEME_COLORS.subtext }}>
                    {selectedItems.length > 0 ? 'اقلام انتخابی:' : 'جمع اقلام:'}
                  </span>
                  <span className="font-bold number-display" style={{ color: THEME_COLORS.text }}>
                    {formatPersianMoney(summaryCalculations.subtotal)}
                  </span>
                </div>
                {summaryCalculations.taxAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: THEME_COLORS.subtext }}>+ مالیات:</span>
                    <span className="font-bold number-display" style={{ color: THEME_COLORS.blue }}>
                      {formatPersianMoney(summaryCalculations.taxAmount)}
                    </span>
                  </div>
                )}
                {summaryCalculations.discountAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: THEME_COLORS.subtext }}>- تخفیف:</span>
                    <span className="font-bold number-display" style={{ color: THEME_COLORS.orange }}>
                      {formatPersianMoney(summaryCalculations.discountAmount)}
                    </span>
                  </div>
                )}
                {summaryCalculations.tipAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: THEME_COLORS.subtext }}>+ انعام:</span>
                    <span className="font-bold number-display" style={{ color: THEME_COLORS.green }}>
                      {formatPersianMoney(summaryCalculations.tipAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1 border-t" style={{ borderColor: THEME_COLORS.border }}>
                  <span className="font-bold" style={{ color: THEME_COLORS.text }}>جمع کل:</span>
                  <span className="font-bold number-display" style={{ color: THEME_COLORS.accent }}>
                    {formatPersianMoney(summaryCalculations.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: THEME_COLORS.subtext }}>پرداخت شده:</span>
                  <span className="font-bold number-display" style={{ color: THEME_COLORS.green }}>
                    {formatPersianMoney(summaryCalculations.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold" style={{ color: THEME_COLORS.orange }}>مانده:</span>
                  <span className="font-bold number-display" style={{ color: THEME_COLORS.orange }}>
                    {formatPersianMoney(summaryCalculations.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Paid Items */}
            <div className="px-4 py-3 border-b" style={{ borderColor: THEME_COLORS.border }}>
              <h2 className="font-bold" style={{ color: THEME_COLORS.green }}>
                اقلام پرداخت شده ({paidItems.length})
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Paid Items List */}
              {paidItems.length > 0 && (
                <div className="p-3 space-y-2 border-b" style={{ borderColor: THEME_COLORS.border }}>
                  {paidItems.map(item => {
                    const isRecentlyPaid = recentlyPaidItems.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-2 rounded-lg ${isRecentlyPaid ? 'animate-slide-to-paid' : ''}`}
                        style={{ backgroundColor: `${THEME_COLORS.green}15` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center animate-checkmark"
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
                        {item.quantity_paid < item.quantity && (
                          <div className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
                            {item.quantity_paid} از {item.quantity} پرداخت شده
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
                                {formatPersianMoney(payment.amount_total || payment.amount_applied)}
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
  paymentInProgress: boolean;
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
  paymentInProgress,
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

  const isInputDisabled = paymentInProgress || split.isLocked;

  return (
    <div
      className={`p-4 rounded-xl space-y-4 animate-split-appear ${isInputDisabled ? 'opacity-70' : ''}`}
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
          disabled={isInputDisabled}
          className="w-full p-3 rounded-lg text-xl font-bold bg-transparent outline-none number-input disabled:cursor-not-allowed"
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
            disabled={isInputDisabled}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:cursor-not-allowed"
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
                disabled={isInputDisabled}
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold disabled:opacity-50"
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
                disabled={isInputDisabled}
                className="w-12 p-1 rounded text-center text-sm font-bold bg-transparent outline-none number-input disabled:cursor-not-allowed"
                style={{
                  backgroundColor: THEME_COLORS.bgSecondary,
                  color: THEME_COLORS.blue,
                  border: `1px solid ${THEME_COLORS.border}`,
                }}
              />
              <span className="text-sm" style={{ color: THEME_COLORS.subtext }}>%</span>
              <button
                onClick={() => onUpdate({ taxPercent: Math.min(100, split.taxPercent + 1) })}
                disabled={isInputDisabled}
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold disabled:opacity-50"
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
          disabled={isInputDisabled}
          className="w-full p-2 rounded-lg text-lg font-bold bg-transparent outline-none number-input disabled:cursor-not-allowed"
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
          disabled={isInputDisabled}
          className="w-full p-2 rounded-lg text-lg font-bold bg-transparent outline-none number-input disabled:cursor-not-allowed"
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
              disabled={isInputDisabled}
              className="py-2 rounded-lg font-medium text-sm transition-all flex flex-col items-center gap-1 disabled:opacity-50"
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
                disabled={isInputDisabled}
                className="w-full p-2 rounded-lg text-right text-sm transition-all disabled:opacity-50"
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
        disabled={disabled || submitting || split.amount <= 0 || paymentInProgress}
        className={`w-full py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${!disabled && split.amount > 0 && !paymentInProgress ? 'animate-submit-pulse' : ''
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

  // Use amount_total which includes tax and discount
  const displayAmount = payment.amount_total || payment.amount_applied;

  return (
    <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold number-display" style={{ color: THEME_COLORS.text }}>
              {formatPersianMoney(displayAmount)}
            </span>
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              {config.label}
            </span>
          </div>
          {/* Show breakdown if different from total */}
          {payment.amount_applied !== displayAmount && (
            <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
              مبلغ پایه: {formatPersianMoney(payment.amount_applied)}
            </div>
          )}
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
                // Use amount_total which includes tax and discount
                const displayAmount = payment.amount_total || payment.amount_applied;

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
                          {formatPersianMoney(displayAmount)}
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
