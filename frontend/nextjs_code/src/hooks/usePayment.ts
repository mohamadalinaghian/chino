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
  // Sale data
  const [sale, setSale] = useState<ISaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Bank/POS accounts
  const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<IPOSAccount | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // Item selection state
  const [selectedItems, setSelectedItems] = useState<IItemSelection[]>([]);
  const [selectAllItems, setSelectAllItems] = useState(true);

  // Tax/Discount state
  const [taxType, setTaxType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [taxValue, setTaxValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [showTaxDiscount, setShowTaxDiscount] = useState(false);

  // Quick calculation
  const [customDivisor, setCustomDivisor] = useState<string>('2');

  // Load initial data
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
      onError?.(err instanceof Error ? err.message : 'خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const accounts = await fetchBankAccounts();
      setBankAccounts(accounts);
    } catch (err) {
      console.error('Error loading bank accounts:', err);
    } finally {
      setLoadingAccounts(false);
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

  // Memoized item lists
  const unpaidItems = useMemo(() => {
    return sale?.items.filter((item) => !item.is_paid) || [];
  }, [sale]);

  const paidItems = useMemo(() => {
    return sale?.items.filter((item) => item.is_paid) || [];
  }, [sale]);

  // Calculate totals
  const calculateUnpaidTotal = useCallback((): number => {
    if (!sale) return 0;
    return sale.items
      .filter((item) => !item.is_paid)
      .reduce((sum, item) => {
        const itemTotal = Number(item.unit_price) * item.quantity;
        const extrasTotal = item.extras?.reduce(
          (extSum, ext) => extSum + Number(ext.unit_price) * ext.quantity,
          0
        ) || 0;
        return sum + itemTotal + extrasTotal;
      }, 0);
  }, [sale]);

  const calculateSelectedItemsTotal = useCallback((): number => {
    if (!sale) return 0;
    if (selectAllItems || selectedItems.length === 0) {
      return calculateUnpaidTotal();
    }

    return selectedItems.reduce((sum, selection) => {
      const item = sale.items.find((i) => i.id === selection.itemId);
      if (!item) return sum;
      const itemTotal = Number(item.unit_price) * selection.quantity;
      const extrasTotal = item.extras?.reduce(
        (extSum, ext) => extSum + Number(ext.unit_price) * ext.quantity,
        0
      ) || 0;
      return sum + itemTotal + extrasTotal;
    }, 0);
  }, [sale, selectAllItems, selectedItems, calculateUnpaidTotal]);

  const calculateTaxAmount = useCallback((baseAmount: number): number => {
    const val = parseFloat(taxValue);
    if (!val || val <= 0) return 0;

    if (taxType === TaxDiscountType.FIXED) {
      return val;
    }
    return (baseAmount * val) / 100;
  }, [taxValue, taxType]);

  const calculateDiscountAmount = useCallback((baseAmount: number): number => {
    const val = parseFloat(discountValue);
    if (!val || val <= 0) return 0;

    if (discountType === TaxDiscountType.FIXED) {
      return val;
    }
    return (baseAmount * val) / 100;
  }, [discountValue, discountType]);

  // Calculated values
  const selectedTotal = calculateSelectedItemsTotal();
  const taxAmount = calculateTaxAmount(selectedTotal);
  const discountAmount = calculateDiscountAmount(selectedTotal);
  const tipAmountValue = parseFloat(tipAmount) || 0;
  const finalAmount = selectedTotal + taxAmount - discountAmount + tipAmountValue;

  // Item selection handlers
  const handleItemSelectionChange = (itemId: number, quantity: number, maxQuantity: number) => {
    if (selectAllItems && quantity === 0) {
      const otherItems = unpaidItems
        .filter((item) => item.id !== itemId)
        .map((item) => ({ itemId: item.id, quantity: item.quantity }));
      setSelectedItems(otherItems);
      setSelectAllItems(false);
      return;
    }

    if (selectAllItems && quantity < maxQuantity) {
      const allItems = unpaidItems.map((item) => ({
        itemId: item.id,
        quantity: item.id === itemId ? quantity : item.quantity,
      }));
      setSelectedItems(allItems);
      setSelectAllItems(false);
      return;
    }

    setSelectedItems((prev) => {
      const existing = prev.find((s) => s.itemId === itemId);
      if (quantity === 0) {
        return prev.filter((s) => s.itemId !== itemId);
      }
      if (existing) {
        return prev.map((s) => (s.itemId === itemId ? { ...s, quantity } : s));
      }
      return [...prev, { itemId, quantity }];
    });
  };

  const handleSelectAllToggle = () => {
    if (selectAllItems) {
      setSelectedItems([]);
      setSelectAllItems(false);
    } else {
      setSelectAllItems(true);
      setSelectedItems([]);
    }
  };

  // Payment method handler
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === PaymentMethod.CASH) {
      setSelectedAccountId(null);
    }
  };

  // Quick calculation
  const setAmountToFull = () => {
    setAmount(finalAmount.toFixed(0));
  };

  const setAmountToHalf = () => {
    setAmount((finalAmount / 2).toFixed(0));
  };

  const setAmountToDivided = (divisor: number) => {
    setAmount((finalAmount / divisor).toFixed(0));
  };

  // Validation
  const validatePayment = (): boolean => {
    if (!paymentMethod) {
      onError?.(UI_TEXT.VALIDATION_SELECT_PAYMENT_METHOD);
      return false;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      onError?.(UI_TEXT.VALIDATION_AMOUNT_GREATER_THAN_ZERO);
      return false;
    }

    if (paymentMethod !== PaymentMethod.CASH && !selectedAccountId) {
      onError?.(UI_TEXT.VALIDATION_SELECT_ACCOUNT);
      return false;
    }

    return true;
  };

  // Submit payment
  const handleSubmitPayment = async () => {
    if (!validatePayment() || !sale) return;

    try {
      setSubmitting(true);

      const selectedItemIds = selectAllItems ? [] : selectedItems.map((s) => s.itemId);

      const payment: IAddPaymentInput = {
        method: paymentMethod,
        amount_applied: parseFloat(amount),
        tip_amount: parseFloat(tipAmount) || 0,
        destination_account_id: selectedAccountId,
        selected_item_ids: selectedItemIds,
      };

      const taxVal = parseFloat(taxValue);
      if (taxVal > 0) {
        payment.tax = { type: taxType, value: taxVal };
      }

      const discountVal = parseFloat(discountValue);
      if (discountVal > 0) {
        payment.discount = { type: discountType, value: discountVal };
      }

      const response = await addPaymentsToSale(saleId, { payments: [payment] });

      await loadSaleData();

      // Reset form
      setAmount('');
      setTipAmount('0');
      setSelectedItems([]);
      setSelectAllItems(true);
      setTaxValue('0');
      setDiscountValue('0');
      setShowTaxDiscount(false);

      const wasAutoClosed = response.was_auto_closed || response.is_fully_paid;
      const message = wasAutoClosed
        ? 'پرداخت ثبت شد و فروش بسته شد'
        : UI_TEXT.MSG_PAYMENT_SUCCESS;

      onSuccess?.(message, wasAutoClosed);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : UI_TEXT.ERROR_ADDING_PAYMENT);
    } finally {
      setSubmitting(false);
    }
  };

  // Void payment
  const handleVoidPayment = async (paymentId: number) => {
    if (!sale) return;

    try {
      setSubmitting(true);
      await voidPayment(saleId, paymentId);
      await loadSaleData();
      onSuccess?.('پرداخت با موفقیت لغو شد', false);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'خطا در لغو پرداخت');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    // Data
    sale,
    loading,
    submitting,
    bankAccounts,
    posAccount,
    loadingAccounts,
    unpaidItems,
    paidItems,

    // Form state
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

    // Calculated values
    selectedTotal,
    taxAmount,
    discountAmount,
    tipAmountValue,
    finalAmount,

    // Setters
    setAmount,
    setTipAmount,
    setSelectedAccountId,
    setTaxType,
    setTaxValue,
    setDiscountType,
    setDiscountValue,
    setShowTaxDiscount,
    setCustomDivisor,

    // Handlers
    handleItemSelectionChange,
    handleSelectAllToggle,
    handlePaymentMethodChange,
    handleSubmitPayment,
    handleVoidPayment,
    setAmountToFull,
    setAmountToHalf,
    setAmountToDivided,

    // Utility
    loadSaleData,
  };
}
