import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PaymentMethod,
  TaxDiscountType,
  ISaleDetailResponse,
  IAddPaymentInput,
  IBankAccount,
  ISaleItemDetail,
  ISelectedItemInput,
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
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface IItemSelection {
  itemId: number;
  quantity: number;
}

export interface IPOSAccount {
  id: number | null;
  card_number: string | null;
  bank_name: string | null;
  account_owner: string | null;
}

/**
 * Payment Mode - Two parent ways to pay:
 * 1. FROM_ITEMS: Calculate amount from selected items in sale
 * 2. MANUAL: Enter a number manually by guest request
 */
export enum PaymentMode {
  FROM_ITEMS = 'FROM_ITEMS',
  MANUAL = 'MANUAL',
}

/**
 * Payment Flow Step:
 * 1. SELECT_MODE: Choose between items-based or manual payment
 * 2. SELECT_ITEMS: (For FROM_ITEMS) Select all or some items to pay
 * 3. ADJUSTMENTS: Apply tax/discount to the amount
 * 4. SPLIT: Decide number of splits between payers
 * 5. CONFIRM: Select payment method and finalize
 */
export enum PaymentStep {
  SELECT_MODE = 'SELECT_MODE',
  SELECT_ITEMS = 'SELECT_ITEMS',
  ADJUSTMENTS = 'ADJUSTMENTS',
  SPLIT = 'SPLIT',
  CONFIRM = 'CONFIRM',
}

interface UsePaymentOptions {
  saleId: number;
  onSuccess?: (message: string, wasAutoClosed: boolean) => void;
  onError?: (message: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function usePayment({ saleId, onSuccess, onError }: UsePaymentOptions) {
  // ── Core sale data ────────────────────────────────────────────────
  const [sale, setSale] = useState<ISaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voidingPaymentId, setVoidingPaymentId] = useState<number | null>(null);

  // ── Accounts ──────────────────────────────────────────────────────
  const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<IPOSAccount | null>(null);

  // ── Payment Flow State ────────────────────────────────────────────
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.FROM_ITEMS);
  const [currentStep, setCurrentStep] = useState<PaymentStep>(PaymentStep.SELECT_ITEMS);

  // ── Payment form state ────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD_TRANSFER);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // ── Item selection (for FROM_ITEMS mode) ──────────────────────────
  const [selectedItems, setSelectedItems] = useState<IItemSelection[]>([]);
  const [selectAllItems, setSelectAllItems] = useState(true);

  // ── Manual amount (for MANUAL mode) ───────────────────────────────
  const [manualAmount, setManualAmount] = useState<string>('');

  // ── Tax / Discount / Tip ──────────────────────────────────────────
  const [taxType, setTaxType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [taxValue, setTaxValue] = useState<string>('10'); // Default 10% tax
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [discountType, setDiscountType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [tipAmount, setTipAmount] = useState<string>('0');

  // ── Split payment ─────────────────────────────────────────────────
  const [divisor, setDivisor] = useState<number>(1);
  const [paidPersons, setPaidPersons] = useState<number[]>([]);

  // ── Manual override for final amount ──────────────────────────────
  const [isAmountManuallyOverridden, setIsAmountManuallyOverridden] = useState(false);
  const [overriddenAmount, setOverriddenAmount] = useState<string>('');

  // ═════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadSaleData();
    loadBankAccounts();
    loadPOSAccount();
  }, [saleId]);

  // ── Auto-select account when accounts are loaded ──────────────────
  useEffect(() => {
    if (paymentMethod === PaymentMethod.POS && posAccount?.id && !selectedAccountId) {
      setSelectedAccountId(posAccount.id);
    } else if (paymentMethod === PaymentMethod.CARD_TRANSFER && bankAccounts.length === 1 && !selectedAccountId) {
      setSelectedAccountId(bankAccounts[0].id);
    }
  }, [posAccount, bankAccounts, paymentMethod, selectedAccountId]);

  const loadSaleData = async () => {
    try {
      setLoading(true);
      const saleData = await fetchSaleDetails(saleId);
      setSale(saleData);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'خطا در بارگذاری فروش');
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const accounts = await fetchBankAccounts();
      setBankAccounts(accounts);
    } catch (err) {
      console.error('Error loading bank accounts:', err);
    }
  };

  const loadPOSAccount = async () => {
    try {
      const response = await authenticatedFetchJSON<IPOSAccount>(
        `${CS_API_URL}${API_ENDPOINTS.POS_ACCOUNT}`
      );
      setPosAccount(response);
    } catch (err) {
      console.error('Error loading POS account:', err);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // DERIVED DATA - Single Source of Truth
  // ═════════════════════════════════════════════════════════════════

  // Items with remaining quantity to pay
  const unpaidItems = useMemo(
    () => sale?.items.filter((item) => item.quantity_remaining > 0) ?? [],
    [sale]
  );

  // Items that are fully paid (no remaining quantity)
  const paidItems = useMemo(
    () => sale?.items.filter((item) => item.quantity_remaining === 0) ?? [],
    [sale]
  );

  // ── SINGLE SOURCE: Calculate base amount based on payment mode ────
  const baseAmount = useMemo((): number => {
    if (paymentMode === PaymentMode.MANUAL) {
      return Number(manualAmount) || 0;
    }

    // FROM_ITEMS mode
    if (!sale) return 0;

    if (selectAllItems) {
      // Calculate total of all unpaid items
      return sale.items
        .filter((item) => item.quantity_remaining > 0)
        .reduce((sum, item) => {
          const itemTotal = Number(item.unit_price) * item.quantity_remaining;
          const extrasTotal =
            item.extras?.reduce((s, e) => s + Number(e.unit_price) * e.quantity, 0) ?? 0;
          const extrasProportional = item.quantity > 0
            ? extrasTotal * (item.quantity_remaining / item.quantity)
            : 0;
          return sum + itemTotal + extrasProportional;
        }, 0);
    }

    // Calculate sum of selected items
    if (selectedItems.length === 0) return 0;

    return selectedItems.reduce((sum, sel) => {
      const item = sale.items.find((i) => i.id === sel.itemId);
      if (!item) return sum;
      const itemTotal = Number(item.unit_price) * sel.quantity;
      const extrasTotal =
        item.extras?.reduce((s, e) => s + Number(e.unit_price) * e.quantity, 0) ?? 0;
      const extrasProportional = item.quantity > 0
        ? extrasTotal * (sel.quantity / item.quantity)
        : 0;
      return sum + itemTotal + extrasProportional;
    }, 0);
  }, [sale, paymentMode, manualAmount, selectAllItems, selectedItems]);

  // Alias for backwards compatibility
  const selectedTotal = baseAmount;

  // ── INITIAL TOTAL: Sum of all items + extras (before any payments) ────
  // This is the maximum base amount for the sale (without tax/discount/tip)
  const initialItemsTotal = useMemo((): number => {
    if (!sale) return 0;
    return sale.items.reduce((sum, item) => {
      const itemTotal = Number(item.unit_price) * item.quantity;
      const extrasTotal =
        item.extras?.reduce((s, e) => s + Number(e.unit_price) * e.quantity, 0) ?? 0;
      return sum + itemTotal + extrasTotal;
    }, 0);
  }, [sale]);

  // ── INITIAL TOTAL WITH DEFAULT TAX: Maximum sale total (items + 10% tax) ────
  const initialTotalWithDefaultTax = useMemo((): number => {
    return initialItemsTotal * 1.1; // 10% default tax
  }, [initialItemsTotal]);

  // ── Tax & Discount Calculations ───────────────────────────────────
  const taxAmount = useMemo(() => {
    if (!taxEnabled) return 0;
    const val = Number(taxValue);
    if (!val) return 0;
    return taxType === TaxDiscountType.FIXED ? val : (baseAmount * val) / 100;
  }, [baseAmount, taxEnabled, taxValue, taxType]);

  const discountAmount = useMemo(() => {
    const val = Number(discountValue);
    if (!val) return 0;
    return discountType === TaxDiscountType.FIXED ? val : (baseAmount * val) / 100;
  }, [baseAmount, discountValue, discountType]);

  const tipAmountValue = Number(tipAmount) || 0;

  // ── Pre-division amount (before splitting) ────────────────────────
  const preDivisionAmount = baseAmount + taxAmount - discountAmount + tipAmountValue;

  // ── CALCULATED TOTAL: Current total based on user's tax/discount choices ────
  // This updates dynamically when user changes tax settings
  const calculatedTotal = useMemo((): number => {
    return baseAmount + taxAmount - discountAmount;
  }, [baseAmount, taxAmount, discountAmount]);

  // ── MAXIMUM TOTAL: Initial total + default tax + tips (ceiling for payments) ────
  // Tips are added on top of the maximum sale amount
  const maximumTotal = useMemo((): number => {
    return initialTotalWithDefaultTax + tipAmountValue;
  }, [initialTotalWithDefaultTax, tipAmountValue]);

  // ── DYNAMIC REMAINING: How much is left to pay based on current calculations ────
  const dynamicRemaining = useMemo((): number => {
    const totalPaid = sale?.total_paid ?? 0;
    // Remaining is calculated total minus what's already paid
    return Math.max(0, calculatedTotal - totalPaid);
  }, [calculatedTotal, sale?.total_paid]);

  // ── Final amount per person (after splitting) ─────────────────────
  const finalAmount = useMemo(() => {
    if (isAmountManuallyOverridden && overriddenAmount) {
      return Number(overriddenAmount) || 0;
    }
    return divisor > 1 ? Math.round(preDivisionAmount / divisor) : preDivisionAmount;
  }, [preDivisionAmount, divisor, isAmountManuallyOverridden, overriddenAmount]);

  // ── Display amount (for UI binding) ───────────────────────────────
  const amount = isAmountManuallyOverridden ? overriddenAmount : finalAmount.toFixed(0);

  // ═════════════════════════════════════════════════════════════════
  // PAYMENT MODE HANDLERS
  // ═════════════════════════════════════════════════════════════════

  const setModeToItems = useCallback(() => {
    setPaymentMode(PaymentMode.FROM_ITEMS);
    setCurrentStep(PaymentStep.SELECT_ITEMS);
    setManualAmount('');
    setIsAmountManuallyOverridden(false);
  }, []);

  const setModeToManual = useCallback(() => {
    setPaymentMode(PaymentMode.MANUAL);
    setCurrentStep(PaymentStep.ADJUSTMENTS);
    setSelectAllItems(false);
    setSelectedItems([]);
    setIsAmountManuallyOverridden(false);
  }, []);

  // ═════════════════════════════════════════════════════════════════
  // STEP NAVIGATION
  // ═════════════════════════════════════════════════════════════════

  const goToStep = useCallback((step: PaymentStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    switch (currentStep) {
      case PaymentStep.SELECT_MODE:
        if (paymentMode === PaymentMode.FROM_ITEMS) {
          setCurrentStep(PaymentStep.SELECT_ITEMS);
        } else {
          setCurrentStep(PaymentStep.ADJUSTMENTS);
        }
        break;
      case PaymentStep.SELECT_ITEMS:
        setCurrentStep(PaymentStep.ADJUSTMENTS);
        break;
      case PaymentStep.ADJUSTMENTS:
        setCurrentStep(PaymentStep.SPLIT);
        break;
      case PaymentStep.SPLIT:
        setCurrentStep(PaymentStep.CONFIRM);
        break;
    }
  }, [currentStep, paymentMode]);

  const prevStep = useCallback(() => {
    switch (currentStep) {
      case PaymentStep.SELECT_ITEMS:
        setCurrentStep(PaymentStep.SELECT_MODE);
        break;
      case PaymentStep.ADJUSTMENTS:
        if (paymentMode === PaymentMode.FROM_ITEMS) {
          setCurrentStep(PaymentStep.SELECT_ITEMS);
        } else {
          setCurrentStep(PaymentStep.SELECT_MODE);
        }
        break;
      case PaymentStep.SPLIT:
        setCurrentStep(PaymentStep.ADJUSTMENTS);
        break;
      case PaymentStep.CONFIRM:
        setCurrentStep(PaymentStep.SPLIT);
        break;
    }
  }, [currentStep, paymentMode]);

  // ═════════════════════════════════════════════════════════════════
  // TAX / DISCOUNT HANDLERS
  // ═════════════════════════════════════════════════════════════════

  const toggleTax = useCallback(() => {
    if (taxEnabled) {
      setTaxEnabled(false);
    } else {
      setTaxEnabled(true);
      setTaxType(TaxDiscountType.PERCENTAGE);
      setTaxValue('10');
    }
    setIsAmountManuallyOverridden(false);
  }, [taxEnabled]);

  const incrementTaxValue = useCallback(() => {
    const current = Number(taxValue) || 0;
    setTaxValue((current + 1).toString());
    setIsAmountManuallyOverridden(false);
  }, [taxValue]);

  const decrementTaxValue = useCallback(() => {
    const current = Number(taxValue) || 0;
    if (current > 0) {
      setTaxValue((current - 1).toString());
      setIsAmountManuallyOverridden(false);
    }
  }, [taxValue]);

  const handleTaxValueChange = useCallback((value: string) => {
    setTaxValue(value);
    setIsAmountManuallyOverridden(false);
  }, []);

  const handleDiscountValueChange = useCallback((value: string) => {
    setDiscountValue(value);
    setIsAmountManuallyOverridden(false);
  }, []);

  const handleTipAmountChange = useCallback((value: string) => {
    setTipAmount(value);
    setIsAmountManuallyOverridden(false);
  }, []);

  // ═════════════════════════════════════════════════════════════════
  // DIVISOR (SPLIT) HANDLERS
  // ═════════════════════════════════════════════════════════════════

  const handleDivisorChange = useCallback((newDivisor: number) => {
    const validDivisor = Math.max(1, Math.min(10, newDivisor));
    setDivisor(validDivisor);
    setPaidPersons([]);
    setIsAmountManuallyOverridden(false);
  }, []);

  const incrementDivisor = useCallback(() => {
    handleDivisorChange(divisor + 1);
  }, [divisor, handleDivisorChange]);

  const decrementDivisor = useCallback(() => {
    handleDivisorChange(divisor - 1);
  }, [divisor, handleDivisorChange]);

  // ═════════════════════════════════════════════════════════════════
  // ITEM SELECTION HANDLERS
  // ═════════════════════════════════════════════════════════════════

  const toggleItemFull = useCallback((itemId: number, maxQty: number) => {
    setSelectAllItems(false);
    setSelectedItems((prev) => {
      const exists = prev.find((s) => s.itemId === itemId);
      if (exists && exists.quantity === maxQty) {
        return prev.filter((s) => s.itemId !== itemId);
      }
      return [...prev.filter((s) => s.itemId !== itemId), { itemId, quantity: maxQty }];
    });
    setIsAmountManuallyOverridden(false);
  }, []);

  const changeItemQuantity = useCallback((itemId: number, newQty: number, maxQty: number) => {
    if (newQty <= 0) {
      setSelectedItems((prev) => prev.filter((s) => s.itemId !== itemId));
      setIsAmountManuallyOverridden(false);
      return;
    }
    setSelectAllItems(false);
    setSelectedItems((prev) => {
      const exists = prev.find((s) => s.itemId === itemId);
      if (exists) {
        return prev.map((s) => (s.itemId === itemId ? { ...s, quantity: newQty } : s));
      }
      return [...prev, { itemId, quantity: newQty }];
    });
    setIsAmountManuallyOverridden(false);
  }, []);

  const handleSelectAllToggle = useCallback(() => {
    if (selectAllItems) {
      setSelectedItems([]);
      setSelectAllItems(false);
    } else {
      setSelectAllItems(true);
      setSelectedItems([]);
    }
    setIsAmountManuallyOverridden(false);
  }, [selectAllItems]);

  // ═════════════════════════════════════════════════════════════════
  // AMOUNT OVERRIDE HANDLERS
  // ═════════════════════════════════════════════════════════════════

  const handleAmountChange = useCallback((newAmount: string) => {
    setOverriddenAmount(newAmount);
    setIsAmountManuallyOverridden(true);
  }, []);

  const syncAmountToFormula = useCallback(() => {
    setOverriddenAmount('');
    setIsAmountManuallyOverridden(false);
  }, []);

  // ═════════════════════════════════════════════════════════════════
  // PAYMENT METHOD HANDLERS
  // ═════════════════════════════════════════════════════════════════

  const handlePaymentMethodChange = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === PaymentMethod.CASH) {
      setSelectedAccountId(null);
    } else if (method === PaymentMethod.POS && posAccount?.id) {
      setSelectedAccountId(posAccount.id);
    } else if (method === PaymentMethod.CARD_TRANSFER && bankAccounts.length === 1) {
      setSelectedAccountId(bankAccounts[0].id);
    }
  }, [posAccount, bankAccounts]);

  // ═════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═════════════════════════════════════════════════════════════════

  const validatePayment = useCallback((): boolean => {
    if (!paymentMethod) {
      onError?.(UI_TEXT.VALIDATION_SELECT_PAYMENT_METHOD);
      return false;
    }
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) {
      onError?.(UI_TEXT.VALIDATION_AMOUNT_GREATER_THAN_ZERO);
      return false;
    }
    if (paymentMethod !== PaymentMethod.CASH && !selectedAccountId) {
      onError?.(UI_TEXT.VALIDATION_SELECT_ACCOUNT);
      return false;
    }
    return true;
  }, [paymentMethod, amount, selectedAccountId, onError]);

  // ═════════════════════════════════════════════════════════════════
  // SUBMIT HANDLERS
  // ═════════════════════════════════════════════════════════════════

  const resetFormState = useCallback(() => {
    setManualAmount('');
    setTipAmount('0');
    setSelectedItems([]);
    setSelectAllItems(true);
    setTaxValue('10');
    setTaxEnabled(true);
    setDiscountValue('0');
    setPaidPersons([]);
    setDivisor(1);
    setIsAmountManuallyOverridden(false);
    setOverriddenAmount('');
    setPaymentMode(PaymentMode.FROM_ITEMS);
    setCurrentStep(PaymentStep.SELECT_ITEMS);
  }, []);

  const handleSubmitPayment = async () => {
    if (!validatePayment() || !sale) return;

    setSubmitting(true);
    try {
      // Build selected_items payload
      let selectedItemsPayload: ISelectedItemInput[] = [];
      if (paymentMode === PaymentMode.FROM_ITEMS && !selectAllItems && selectedItems.length > 0) {
        selectedItemsPayload = selectedItems.map((s) => ({
          item_id: s.itemId,
          quantity: s.quantity,
        }));
      }

      const paymentPayload: IAddPaymentInput = {
        method: paymentMethod,
        amount_applied: Number(amount),
        tip_amount: tipAmountValue,
        destination_account_id: selectedAccountId,
        selected_items: selectedItemsPayload.length > 0 ? selectedItemsPayload : undefined,
      };

      const tv = Number(taxValue);
      if (taxEnabled && tv > 0) paymentPayload.tax = { type: taxType, value: tv };

      const dv = Number(discountValue);
      if (dv > 0) paymentPayload.discount = { type: discountType, value: dv };

      const response = await addPaymentsToSale(saleId, { payments: [paymentPayload] });
      await loadSaleData();

      resetFormState();

      const autoClosed = response.was_auto_closed || response.is_fully_paid;
      onSuccess?.(
        autoClosed ? 'پرداخت ثبت شد و فروش بسته شد' : UI_TEXT.MSG_PAYMENT_SUCCESS,
        autoClosed
      );
    } catch (err) {
      onError?.(err instanceof Error ? err.message : UI_TEXT.ERROR_ADDING_PAYMENT);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPersonPayment = async (personIndex: number) => {
    if (!sale) return;
    if (paidPersons.includes(personIndex)) {
      onError?.('این شخص قبلاً پرداخت کرده است');
      return;
    }

    if (!paymentMethod) {
      onError?.(UI_TEXT.VALIDATION_SELECT_PAYMENT_METHOD);
      return;
    }
    if (paymentMethod !== PaymentMethod.CASH && !selectedAccountId) {
      onError?.(UI_TEXT.VALIDATION_SELECT_ACCOUNT);
      return;
    }

    setSubmitting(true);
    try {
      const personAmount = finalAmount;
      const isFirstPerson = paidPersons.length === 0;

      const paymentPayload: IAddPaymentInput = {
        method: paymentMethod,
        amount_applied: personAmount,
        tip_amount: isFirstPerson ? tipAmountValue : 0,
        destination_account_id: selectedAccountId,
      };

      if (isFirstPerson) {
        const tv = Number(taxValue);
        if (taxEnabled && tv > 0) paymentPayload.tax = { type: taxType, value: tv };

        const dv = Number(discountValue);
        if (dv > 0) paymentPayload.discount = { type: discountType, value: dv };
      }

      const response = await addPaymentsToSale(saleId, { payments: [paymentPayload] });
      await loadSaleData();

      setPaidPersons((prev) => [...prev, personIndex]);

      const allPaid = paidPersons.length + 1 >= divisor;

      if (allPaid) {
        resetFormState();
      }

      const autoClosed = response.was_auto_closed || response.is_fully_paid;
      const message = allPaid
        ? (autoClosed ? 'همه پرداخت‌ها ثبت شد و فروش بسته شد' : 'همه پرداخت‌ها ثبت شد')
        : `پرداخت نفر ${personIndex + 1} ثبت شد`;

      onSuccess?.(message, autoClosed);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : UI_TEXT.ERROR_ADDING_PAYMENT);
    } finally {
      setSubmitting(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // VOID PAYMENT
  // ═════════════════════════════════════════════════════════════════

  const handleVoidPayment = async (paymentId: number) => {
    if (!sale) return;

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
  };

  // ═════════════════════════════════════════════════════════════════
  // RETURN
  // ═════════════════════════════════════════════════════════════════

  return {
    // Core data
    sale,
    loading,
    submitting,
    bankAccounts,
    posAccount,

    // Flow state
    paymentMode,
    currentStep,
    setModeToItems,
    setModeToManual,
    goToStep,
    nextStep,
    prevStep,

    // Payment method
    paymentMethod,
    selectedAccountId,
    handlePaymentMethodChange,
    setSelectedAccountId,

    // Item selection
    selectedItems,
    selectAllItems,
    unpaidItems,
    paidItems,
    handleItemToggleFull: toggleItemFull,
    handleItemQuantityChange: changeItemQuantity,
    handleSelectAllToggle,

    // Manual amount
    manualAmount,
    setManualAmount,

    // Tax/Discount/Tip
    taxType,
    taxValue,
    taxEnabled,
    discountType,
    discountValue,
    tipAmount,
    setTaxType,
    setTaxValue: handleTaxValueChange,
    setTaxEnabled,
    toggleTax,
    incrementTaxValue,
    decrementTaxValue,
    setDiscountType,
    setDiscountValue: handleDiscountValueChange,
    setTipAmount: handleTipAmountChange,

    // Calculated amounts (SINGLE SOURCE OF TRUTH)
    baseAmount,
    selectedTotal, // Alias for backwards compatibility
    taxAmount,
    discountAmount,
    tipAmountValue,
    preDivisionAmount,
    finalAmount,
    amount,
    // Summary card values (dynamic calculations)
    initialItemsTotal,
    initialTotalWithDefaultTax,
    calculatedTotal,
    maximumTotal,
    dynamicRemaining,

    // Split payment
    divisor,
    paidPersons,
    setDivisor: handleDivisorChange,
    incrementDivisor,
    decrementDivisor,

    // Amount override
    isAmountManuallyOverridden,
    handleAmountChange,
    syncAmountToFormula,

    // Actions
    handleSubmitPayment,
    handleSubmitPersonPayment,
    loadSaleData,
    resetFormState,

    // Void payment
    voidingPaymentId,
    handleVoidPayment,
  };
}
