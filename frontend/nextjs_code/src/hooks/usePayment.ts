import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PaymentMethod,
  TaxDiscountType,
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
  const [taxValue, setTaxValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [showTaxDiscount, setShowTaxDiscount] = useState(false);

  // ── Quick calc ────────────────────────────────────────────────────
  const [customDivisor, setCustomDivisor] = useState<string>('2');

  // ── Load data ─────────────────────────────────────────────────────
  useEffect(() => {
    loadSaleData();
    loadBankAccounts();
    loadPOSAccount();
  }, [saleId]);

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
  const unpaidItems = useMemo(
    () => sale?.items.filter((item) => !item.is_paid) ?? [],
    [sale]
  );

  const paidItems = useMemo(
    () => sale?.items.filter((item) => item.is_paid) ?? [],
    [sale]
  );

  // ── Totals calculation ────────────────────────────────────────────
  const calculateUnpaidTotal = useCallback((): number => {
    if (!sale) return 0;
    return sale.items
      .filter((item) => !item.is_paid)
      .reduce((sum, item) => {
        const itemTotal = Number(item.unit_price) * item.quantity;
        const extrasTotal =
          item.extras?.reduce((s, e) => s + Number(e.unit_price) * e.quantity, 0) ?? 0;
        return sum + itemTotal + extrasTotal;
      }, 0);
  }, [sale]);

  const calculateSelectedItemsTotal = useCallback((): number => {
    if (!sale) return 0;
    if (selectAllItems || selectedItems.length === 0) {
      return calculateUnpaidTotal();
    }
    return selectedItems.reduce((sum, sel) => {
      const item = sale.items.find((i) => i.id === sel.itemId);
      if (!item) return sum;
      const itemTotal = Number(item.unit_price) * sel.quantity;
      const extrasTotal =
        item.extras?.reduce((s, e) => s + Number(e.unit_price) * e.quantity, 0) ?? 0;
      return sum + itemTotal + extrasTotal;
    }, 0);
  }, [sale, selectAllItems, selectedItems, calculateUnpaidTotal]);

  const calculateTaxAmount = useCallback(
    (base: number) => {
      const val = Number(taxValue);
      if (!val) return 0;
      return taxType === TaxDiscountType.FIXED ? val : (base * val) / 100;
    },
    [taxValue, taxType]
  );

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
  const finalAmount = selectedTotal + taxAmount - discountAmount + tipAmountValue;

  // ── Auto-update amount when selection changes ─────────────────────
  const [prevFinal, setPrevFinal] = useState(finalAmount);

  useEffect(() => {
    if (finalAmount === prevFinal) return;

    const currentNum = Number(amount);
    const shouldAutoFill =
      !amount ||
      isNaN(currentNum) ||
      currentNum === 0 ||
      currentNum === prevFinal;

    if (shouldAutoFill) {
      setAmount(finalAmount.toFixed(0));
    }

    setPrevFinal(finalAmount);
  }, [finalAmount, amount]);

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
  }, []);

  const changeItemQuantity = useCallback((itemId: number, newQty: number, maxQty: number) => {
    if (newQty <= 0) {
      setSelectedItems((prev) => prev.filter((s) => s.itemId !== itemId));
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
  }, []);

  const handleSelectAllToggle = () => {
    if (selectAllItems) {
      setSelectedItems([]);
      setSelectAllItems(false);
    } else {
      setSelectAllItems(true);
      setSelectedItems([]);
    }
  };

  // ── Quick calculation (no full button) ────────────────────────────
  const setAmountToHalf = () => {
    setAmount((finalAmount / 2).toFixed(0));
  };

  const setAmountToDivided = (divisor: number) => {
    if (divisor < 2) return;
    setAmount((finalAmount / divisor).toFixed(0));
  };

  // ── Other handlers ────────────────────────────────────────────────
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === PaymentMethod.CASH) {
      setSelectedAccountId(null);
    }
  };

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
      const selectedItemIds = selectAllItems ? [] : selectedItems.map((s) => s.itemId);

      const paymentPayload: IAddPaymentInput = {
        method: paymentMethod,
        amount_applied: Number(amount),
        tip_amount: tipAmountValue,
        destination_account_id: selectedAccountId,
        selected_item_ids: selectedItemIds,
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
      setTaxValue('0');
      setDiscountValue('0');
      setShowTaxDiscount(false);

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
    setAmount,
    setTipAmount,
    setSelectedAccountId,
    setTaxType,
    setTaxValue,
    setDiscountType,
    setDiscountValue,
    setShowTaxDiscount,
    setCustomDivisor,
    handleItemToggleFull: toggleItemFull,
    handleItemQuantityChange: changeItemQuantity,
    handleSelectAllToggle,
    handlePaymentMethodChange,
    handleSubmitPayment,
    setAmountToHalf,
    setAmountToDivided,
    loadSaleData,
  };
}
