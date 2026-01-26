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

interface UsePaymentOptions {
  saleId: number;
  onSuccess?: (message: string, wasAutoClosed: boolean) => void;
  onError?: (message: string) => void;
}

export function usePayment({ saleId, onSuccess, onError }: UsePaymentOptions) {
  // ── Core sale data ────────────────────────────────────────────────
  const [sale, setSale] = useState<ISaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Accounts ──────────────────────────────────────────────────────
  const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<IPOSAccount | null>(null);

  // ── Payment form state ────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD_TRANSFER);
  const [amount, setAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // ── Item selection ────────────────────────────────────────────────
  const [selectedItems, setSelectedItems] = useState<IItemSelection[]>([]);
  const [selectAllItems, setSelectAllItems] = useState(true);

  // ── Tax / Discount / Tip ──────────────────────────────────────────
  const [taxType, setTaxType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [taxValue, setTaxValue] = useState<string>('10'); // Default 10% tax
  const [taxEnabled, setTaxEnabled] = useState(true); // Toggle for quick 10% tax
  const [discountType, setDiscountType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [showTaxDiscount, setShowTaxDiscount] = useState(false);

  // ── Formula divisor (for splitting payment) ───────────────────────
  const [divisor, setDivisor] = useState<number>(1);

  // ── Track which persons have paid in split payment mode ──────────
  // Array of person indices (0-based) who have paid
  const [paidPersons, setPaidPersons] = useState<number[]>([]);

  // ── Manual override tracking ──────────────────────────────────────
  const [isAmountManuallyOverridden, setIsAmountManuallyOverridden] = useState(false);

  // ── Quick calc ────────────────────────────────────────────────────
  const [customDivisor, setCustomDivisor] = useState<string>('2');

  // ── Load data ─────────────────────────────────────────────────────
  useEffect(() => {
    loadSaleData();
    loadBankAccounts();
    loadPOSAccount();
  }, [saleId]);

  // ── Auto-select account when accounts are loaded ────────────────────
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

  // ── Derived lists ─────────────────────────────────────────────────
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

  // ── Totals calculation ────────────────────────────────────────────
  const calculateUnpaidTotal = useCallback((): number => {
    if (!sale) return 0;
    return sale.items
      .filter((item) => item.quantity_remaining > 0)
      .reduce((sum, item) => {
        // Use remaining quantity for calculation
        const itemTotal = Number(item.unit_price) * item.quantity_remaining;
        // Extras are included proportionally based on remaining quantity ratio
        const extrasTotal =
          item.extras?.reduce((s, e) => s + Number(e.unit_price) * e.quantity, 0) ?? 0;
        const extrasProportional = item.quantity > 0
          ? extrasTotal * (item.quantity_remaining / item.quantity)
          : 0;
        return sum + itemTotal + extrasProportional;
      }, 0);
  }, [sale]);

  const calculateSelectedItemsTotal = useCallback((): number => {
    if (!sale) return 0;
    // When selectAllItems is true, use all unpaid items
    if (selectAllItems) {
      return calculateUnpaidTotal();
    }
    // When selectAllItems is false and no items selected, return 0
    if (selectedItems.length === 0) {
      return 0;
    }
    // Otherwise calculate sum of selected items with proportional extras
    return selectedItems.reduce((sum, sel) => {
      const item = sale.items.find((i) => i.id === sel.itemId);
      if (!item) return sum;
      const itemTotal = Number(item.unit_price) * sel.quantity;
      const extrasTotal =
        item.extras?.reduce((s, e) => s + Number(e.unit_price) * e.quantity, 0) ?? 0;
      // Extras proportional to selected quantity
      const extrasProportional = item.quantity > 0
        ? extrasTotal * (sel.quantity / item.quantity)
        : 0;
      return sum + itemTotal + extrasProportional;
    }, 0);
  }, [sale, selectAllItems, selectedItems, calculateUnpaidTotal]);

  const calculateTaxAmount = useCallback(
    (base: number) => {
      if (!taxEnabled) return 0;
      const val = Number(taxValue);
      if (!val) return 0;
      return taxType === TaxDiscountType.FIXED ? val : (base * val) / 100;
    },
    [taxValue, taxType, taxEnabled]
  );

  // Toggle 10% tax on/off
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

  const calculateDiscountAmount = useCallback(
    (base: number) => {
      const val = Number(discountValue);
      if (!val) return 0;
      return discountType === TaxDiscountType.FIXED ? val : (base * val) / 100;
    },
    [discountValue, discountType]
  );

  const selectedTotal = calculateSelectedItemsTotal();
  const taxAmount = calculateTaxAmount(selectedTotal);
  const discountAmount = calculateDiscountAmount(selectedTotal);
  const tipAmountValue = Number(tipAmount) || 0;

  // Calculate pre-division amount (before dividing by divisor)
  const preDivisionAmount = selectedTotal + taxAmount - discountAmount + tipAmountValue;

  // Final amount after division
  const finalAmount = divisor > 1 ? Math.round(preDivisionAmount / divisor) : preDivisionAmount;

  // ── Auto-update amount when formula changes ─────────────────────
  // Any change in formula parts should update the result
  useEffect(() => {
    // Always sync amount to formula result when formula changes
    setAmount(finalAmount.toFixed(0));
    setIsAmountManuallyOverridden(false);
  }, [finalAmount]);

  // ── Handle amount change with manual override detection ───────────
  const handleAmountChange = useCallback((newAmount: string) => {
    setAmount(newAmount);
    // Mark as manually overridden when user types in the amount field
    setIsAmountManuallyOverridden(true);
  }, []);

  // ── Formula-related value changes (should reset manual override) ───
  const handleDiscountValueChange = useCallback((value: string) => {
    setDiscountValue(value);
    setIsAmountManuallyOverridden(false);
  }, []);

  const handleTipAmountChange = useCallback((value: string) => {
    setTipAmount(value);
    setIsAmountManuallyOverridden(false);
  }, []);

  const handleTaxValueChange = useCallback((value: string) => {
    setTaxValue(value);
    setIsAmountManuallyOverridden(false);
  }, []);

  // ── Reset manual override when syncing to formula ─────────────────
  const syncAmountToFormula = useCallback(() => {
    setAmount(finalAmount.toFixed(0));
    setIsAmountManuallyOverridden(false);
  }, [finalAmount]);

  // ── Divisor handlers ──────────────────────────────────────────────
  const handleDivisorChange = useCallback((newDivisor: number) => {
    const validDivisor = Math.max(1, Math.min(10, newDivisor));
    setDivisor(validDivisor);
    setPaidPersons([]); // Reset paid persons when divisor changes
    setIsAmountManuallyOverridden(false);
  }, []);

  const incrementDivisor = useCallback(() => {
    handleDivisorChange(divisor + 1);
  }, [divisor, handleDivisorChange]);

  const decrementDivisor = useCallback(() => {
    handleDivisorChange(divisor - 1);
  }, [divisor, handleDivisorChange]);

  // ── Tax value handlers ────────────────────────────────────────────
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

  // ── Item selection handlers ───────────────────────────────────────
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

  const handleSelectAllToggle = () => {
    if (selectAllItems) {
      setSelectedItems([]);
      setSelectAllItems(false);
    } else {
      setSelectAllItems(true);
      setSelectedItems([]);
    }
    setIsAmountManuallyOverridden(false);
  };

  // ── Quick calculation ────────────────────────────────────────────
  const setAmountToFull = () => {
    setAmount(finalAmount.toFixed(0));
    setIsAmountManuallyOverridden(false);
  };

  const setAmountToHalf = () => {
    setAmount((finalAmount / 2).toFixed(0));
    setIsAmountManuallyOverridden(true); // Half is technically a manual choice
  };

  const setAmountToDivided = (div: number) => {
    if (div < 2) return;
    setAmount((finalAmount / div).toFixed(0));
    setIsAmountManuallyOverridden(true); // Custom division is a manual choice
  };

  // ── Other handlers ────────────────────────────────────────────────
  const handlePaymentMethodChange = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === PaymentMethod.CASH) {
      setSelectedAccountId(null);
    } else if (method === PaymentMethod.POS && posAccount?.id) {
      // Auto-select POS account when switching to POS method
      setSelectedAccountId(posAccount.id);
    } else if (method === PaymentMethod.CARD_TRANSFER && bankAccounts.length === 1) {
      // Auto-select single bank account when switching to card transfer
      setSelectedAccountId(bankAccounts[0].id);
    }
  }, [posAccount, bankAccounts]);

  const validatePayment = (): boolean => {
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
  };

  const handleSubmitPayment = async () => {
    if (!validatePayment() || !sale) return;

    setSubmitting(true);
    try {
      // Build selected_items with quantities
      let selectedItemsPayload: ISelectedItemInput[] = [];
      if (!selectAllItems && selectedItems.length > 0) {
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
      if (tv > 0) paymentPayload.tax = { type: taxType, value: tv };

      const dv = Number(discountValue);
      if (dv > 0) paymentPayload.discount = { type: discountType, value: dv };

      const response = await addPaymentsToSale(saleId, { payments: [paymentPayload] });
      await loadSaleData();

      // Reset form
      setAmount('');
      setTipAmount('0');
      setSelectedItems([]);
      setSelectAllItems(true);
      setTaxValue('10'); // Reset to default 10%
      setTaxEnabled(true); // Reset tax enabled
      setDiscountValue('0');
      setShowTaxDiscount(false);
      setPaidPersons([]); // Reset paid persons
      setDivisor(1); // Reset divisor

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

  // ── Submit payment for a specific person in split mode ─────────────
  const handleSubmitPersonPayment = async (personIndex: number) => {
    if (!sale) return;
    if (paidPersons.includes(personIndex)) {
      onError?.('این شخص قبلاً پرداخت کرده است');
      return;
    }

    // Validate payment method and account
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
      // Use the per-person amount (finalAmount which is already divided)
      const personAmount = finalAmount;

      // Only include tax/discount/tip for the first person to avoid double-counting
      const isFirstPerson = paidPersons.length === 0;

      const paymentPayload: IAddPaymentInput = {
        method: paymentMethod,
        amount_applied: personAmount,
        tip_amount: isFirstPerson ? tipAmountValue : 0,
        destination_account_id: selectedAccountId,
      };

      // Only apply tax/discount for first person
      if (isFirstPerson) {
        const tv = Number(taxValue);
        if (tv > 0) paymentPayload.tax = { type: taxType, value: tv };

        const dv = Number(discountValue);
        if (dv > 0) paymentPayload.discount = { type: discountType, value: dv };
      }

      const response = await addPaymentsToSale(saleId, { payments: [paymentPayload] });
      await loadSaleData();

      // Mark this person as paid
      setPaidPersons((prev) => [...prev, personIndex]);

      // Check if all persons have paid
      const allPaid = paidPersons.length + 1 >= divisor;

      if (allPaid) {
        // Reset form when all persons have paid
        setAmount('');
        setTipAmount('0');
        setSelectedItems([]);
        setSelectAllItems(true);
        setTaxValue('10');
        setTaxEnabled(true);
        setDiscountValue('0');
        setShowTaxDiscount(false);
        setPaidPersons([]);
        setDivisor(1);
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

  return {
    sale,
    loading,
    submitting,
    bankAccounts,
    posAccount,
    paymentMethod,
    amount,
    tipAmount,
    selectedAccountId,
    selectedItems,
    selectAllItems,
    taxType,
    taxValue,
    taxEnabled,
    discountType,
    discountValue,
    showTaxDiscount,
    customDivisor,
    unpaidItems,
    paidItems,
    selectedTotal,
    taxAmount,
    discountAmount,
    tipAmountValue,
    finalAmount,
    preDivisionAmount,
    divisor,
    paidPersons,
    isAmountManuallyOverridden,
    setAmount,
    handleAmountChange,
    syncAmountToFormula,
    setTipAmount: handleTipAmountChange,
    setSelectedAccountId,
    setTaxType,
    setTaxValue: handleTaxValueChange,
    setTaxEnabled,
    toggleTax,
    incrementTaxValue,
    decrementTaxValue,
    setDiscountType,
    setDiscountValue: handleDiscountValueChange,
    setShowTaxDiscount,
    setCustomDivisor,
    setDivisor: handleDivisorChange,
    incrementDivisor,
    decrementDivisor,
    handleItemToggleFull: toggleItemFull,
    handleItemQuantityChange: changeItemQuantity,
    handleSelectAllToggle,
    handlePaymentMethodChange,
    handleSubmitPayment,
    handleSubmitPersonPayment,
    setAmountToFull,
    setAmountToHalf,
    setAmountToDivided,
    loadSaleData,
  };
}
