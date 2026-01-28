import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PaymentMethod,
  ISaleDetailResponse,
  IAddPaymentInput,
  IBankAccount,
  ISaleItemDetail,
} from '@/types/sale';
import {
  fetchSaleDetails,
  addPaymentsToSale,
  fetchBankAccounts,
  voidPayment,
} from '@/service/sale';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL, API_ENDPOINTS, UI_TEXT } from '@/libs/constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface IPOSAccount {
  id: number | null;
  card_number: string | null;
  bank_name: string | null;
  account_owner: string | null;
}

/**
 * Frozen snapshot of the sale at payment time
 * This is IMMUTABLE - cannot be modified during payment
 */
export interface PaymentSnapshot {
  saleId: number;
  totalAmount: number;      // Total payable (frozen)
  taxAmount: number;        // Tax (pre-calculated, frozen)
  discountAmount: number;   // Discount (frozen)
  subtotalAmount: number;   // Subtotal before tax/discount
  totalPaid: number;        // Amount already paid
  remainingDue: number;     // What's still owed
  items: ISaleItemDetail[]; // Items in the sale
  isFullyPaid: boolean;
  paymentStatus: string;
  saleState: string;
}

export interface PaymentRecord {
  id: number;
  method: string;
  amount: number;
  tipAmount: number;
  receivedBy: string;
  receivedAt: string;
  status: 'ACTIVE' | 'VOID';
  accountInfo?: string;
}

interface UsePaymentPageOptions {
  saleId: number;
  onSuccess?: (message: string, wasAutoClosed: boolean) => void;
  onError?: (message: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function usePaymentPage({ saleId, onSuccess, onError }: UsePaymentPageOptions) {
  // ── Loading & UI State ──────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voidingPaymentId, setVoidingPaymentId] = useState<number | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // ── Core Data ───────────────────────────────────────────────────────
  const [sale, setSale] = useState<ISaleDetailResponse | null>(null);
  const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<IPOSAccount | null>(null);

  // ── Payment Input State ─────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('');
  const [calculatorExpression, setCalculatorExpression] = useState<string>('');

  // ═════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═════════════════════════════════════════════════════════════════════

  const loadSaleData = useCallback(async () => {
    try {
      setLoading(true);
      const saleData = await fetchSaleDetails(saleId);
      setSale(saleData);

      // Set initial amount to remaining due
      const remaining = saleData.balance_due;
      if (remaining > 0) {
        setInputAmount(Math.floor(remaining).toString());
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'خطا در بارگذاری فروش');
    } finally {
      setLoading(false);
    }
  }, [saleId, onError]);

  const loadAccounts = useCallback(async () => {
    try {
      const [accounts, pos] = await Promise.all([
        fetchBankAccounts(),
        authenticatedFetchJSON<IPOSAccount>(`${CS_API_URL}${API_ENDPOINTS.POS_ACCOUNT}`).catch(() => null),
      ]);
      setBankAccounts(accounts);
      if (pos) setPosAccount(pos);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  }, []);

  useEffect(() => {
    loadSaleData();
    loadAccounts();
  }, [loadSaleData, loadAccounts]);

  // ── Auto-select account when method changes ─────────────────────────
  useEffect(() => {
    if (paymentMethod === PaymentMethod.CASH) {
      setSelectedAccountId(null);
    } else if (paymentMethod === PaymentMethod.POS && posAccount?.id) {
      setSelectedAccountId(posAccount.id);
    } else if (paymentMethod === PaymentMethod.CARD_TRANSFER && bankAccounts.length === 1) {
      setSelectedAccountId(bankAccounts[0].id);
    }
  }, [paymentMethod, posAccount, bankAccounts]);

  // ═════════════════════════════════════════════════════════════════════
  // FROZEN SNAPSHOT (IMMUTABLE)
  // ═════════════════════════════════════════════════════════════════════

  const snapshot: PaymentSnapshot | null = useMemo(() => {
    if (!sale) return null;
    return {
      saleId: sale.id,
      totalAmount: sale.total_amount,
      taxAmount: sale.tax_amount,
      discountAmount: sale.discount_amount,
      subtotalAmount: sale.subtotal_amount,
      totalPaid: sale.total_paid,
      remainingDue: sale.balance_due,
      items: sale.items,
      isFullyPaid: sale.is_fully_paid,
      paymentStatus: sale.payment_status,
      saleState: sale.state,
    };
  }, [sale]);

  // ═════════════════════════════════════════════════════════════════════
  // PAYMENT HISTORY
  // ═════════════════════════════════════════════════════════════════════

  const payments: PaymentRecord[] = useMemo(() => {
    if (!sale?.payments) return [];
    return sale.payments.map(p => ({
      id: p.id,
      method: p.method,
      amount: p.amount_applied,
      tipAmount: p.tip_amount,
      receivedBy: p.received_by_name,
      receivedAt: p.received_at,
      status: p.status as 'ACTIVE' | 'VOID',
      accountInfo: p.destination_card_number
        ? `${p.destination_bank_name || ''} - ${p.destination_card_number}`.trim()
        : undefined,
    }));
  }, [sale]);

  // ═════════════════════════════════════════════════════════════════════
  // CALCULATED VALUES
  // ═════════════════════════════════════════════════════════════════════

  const parsedAmount = useMemo(() => {
    const num = Number(inputAmount.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  }, [inputAmount]);

  const parsedTip = useMemo(() => {
    const num = Number(tipAmount.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  }, [tipAmount]);

  const totalPaymentAmount = parsedAmount + parsedTip;

  // ═════════════════════════════════════════════════════════════════════
  // CALCULATOR SUPPORT
  // ═════════════════════════════════════════════════════════════════════

  const evaluateExpression = useCallback((expr: string): number | null => {
    try {
      // Only allow numbers, +, -, *, /, (, ), and spaces
      const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
      if (!sanitized.trim()) return null;

      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.floor(result);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const handleCalculatorInput = useCallback((value: string) => {
    setCalculatorExpression(value);
    const result = evaluateExpression(value);
    if (result !== null && result > 0) {
      setInputAmount(result.toString());
    }
  }, [evaluateExpression]);

  const applyCalculatorResult = useCallback(() => {
    const result = evaluateExpression(calculatorExpression);
    if (result !== null && result > 0) {
      setInputAmount(result.toString());
      setCalculatorExpression('');
    }
  }, [calculatorExpression, evaluateExpression]);

  // ═════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═════════════════════════════════════════════════════════════════════

  const validationError = useMemo((): string | null => {
    if (!snapshot) return 'در حال بارگذاری...';
    if (snapshot.isFullyPaid) return 'این فروش کاملاً تسویه شده است';
    if (snapshot.saleState === 'CANCELED') return 'این فروش لغو شده است';
    if (parsedAmount <= 0) return 'مبلغ باید بزرگتر از صفر باشد';
    if (paymentMethod !== PaymentMethod.CASH && !selectedAccountId) {
      return paymentMethod === PaymentMethod.POS
        ? 'کارتخوان تنظیم نشده است'
        : 'لطفاً حساب مقصد را انتخاب کنید';
    }
    return null;
  }, [snapshot, parsedAmount, paymentMethod, selectedAccountId]);

  const isValid = validationError === null;

  // ═════════════════════════════════════════════════════════════════════
  // VIEW-ONLY MODE
  // ═════════════════════════════════════════════════════════════════════

  const isViewOnly = useMemo(() => {
    if (!snapshot) return false;
    return snapshot.isFullyPaid || snapshot.saleState === 'CANCELED';
  }, [snapshot]);

  // ═════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═════════════════════════════════════════════════════════════════════

  const setAmountToRemaining = useCallback(() => {
    if (snapshot && snapshot.remainingDue > 0) {
      setInputAmount(Math.floor(snapshot.remainingDue).toString());
    }
  }, [snapshot]);

  const handleMethodChange = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
  }, []);

  const handleSubmitPayment = useCallback(async () => {
    if (!isValid || !sale || submitting) return;

    setSubmitting(true);
    try {
      const payload: IAddPaymentInput = {
        method: paymentMethod,
        amount_applied: parsedAmount,
        tip_amount: parsedTip > 0 ? parsedTip : undefined,
        destination_account_id: selectedAccountId,
      };

      const response = await addPaymentsToSale(saleId, { payments: [payload] });

      // Reload sale data to get updated state
      await loadSaleData();

      // Reset input for next payment
      setInputAmount('');
      setTipAmount('');
      setCalculatorExpression('');

      // Set new remaining as default
      if (response.balance_due > 0) {
        setInputAmount(Math.floor(response.balance_due).toString());
      }

      const wasAutoClosed = response.was_auto_closed || response.is_fully_paid;
      onSuccess?.(
        wasAutoClosed
          ? 'پرداخت ثبت شد و فروش تسویه شد'
          : `پرداخت ${parsedAmount.toLocaleString('fa-IR')} تومان ثبت شد`,
        wasAutoClosed
      );
    } catch (err) {
      onError?.(err instanceof Error ? err.message : UI_TEXT.ERROR_ADDING_PAYMENT);
    } finally {
      setSubmitting(false);
    }
  }, [isValid, sale, submitting, paymentMethod, parsedAmount, parsedTip, selectedAccountId, saleId, loadSaleData, onSuccess, onError]);

  const handleVoidPayment = useCallback(async (paymentId: number) => {
    if (!sale || voidingPaymentId) return;

    setVoidingPaymentId(paymentId);
    try {
      await voidPayment(saleId, paymentId);
      await loadSaleData();
      onSuccess?.('پرداخت با موفقیت لغو شد', false);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'خطا در لغو پرداخت');
    } finally {
      setVoidingPaymentId(null);
    }
  }, [sale, voidingPaymentId, saleId, loadSaleData, onSuccess, onError]);

  // ═════════════════════════════════════════════════════════════════════
  // QUICK AMOUNT BUTTONS
  // ═════════════════════════════════════════════════════════════════════

  const quickAmounts = useMemo(() => {
    const remaining = snapshot?.remainingDue || 0;
    const amounts: number[] = [];

    // Add common round amounts
    [10000, 20000, 50000, 100000, 200000, 500000].forEach(amt => {
      if (amt <= remaining * 1.5) amounts.push(amt);
    });

    // Add half and quarter of remaining
    if (remaining > 20000) {
      amounts.push(Math.round(remaining / 2 / 1000) * 1000);
    }

    return Array.from(new Set(amounts)).sort((a, b) => a - b).slice(0, 6);
  }, [snapshot]);

  // ═════════════════════════════════════════════════════════════════════
  // RETURN
  // ═════════════════════════════════════════════════════════════════════

  return {
    // Loading states
    loading,
    submitting,
    voidingPaymentId,

    // Core data
    sale,
    snapshot,
    payments,
    bankAccounts,
    posAccount,

    // UI state
    showBreakdown,
    setShowBreakdown,
    isViewOnly,

    // Payment input
    paymentMethod,
    selectedAccountId,
    inputAmount,
    tipAmount,
    calculatorExpression,
    parsedAmount,
    parsedTip,
    totalPaymentAmount,

    // Setters
    setPaymentMethod: handleMethodChange,
    setSelectedAccountId,
    setInputAmount,
    setTipAmount,
    setCalculatorExpression: handleCalculatorInput,
    applyCalculatorResult,
    setAmountToRemaining,

    // Validation
    validationError,
    isValid,

    // Quick amounts
    quickAmounts,

    // Actions
    handleSubmitPayment,
    handleVoidPayment,
    loadSaleData,
  };
}
