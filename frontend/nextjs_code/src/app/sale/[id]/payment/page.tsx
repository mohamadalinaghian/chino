'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  PaymentMethod,
  TaxDiscountType,
  ISaleDetailResponse,
  IAddPaymentInput,
  IBankAccount,
} from '@/types/sale';
import {
  fetchSaleDetails,
  addPaymentsToSale,
  fetchBankAccounts,
  voidPayment,
} from '@/service/sale';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS, UI_TEXT, API_ENDPOINTS, CS_API_URL } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';

interface IItemSelection {
  itemId: number;
  quantity: number;
}

interface IPOSAccount {
  id: number | null;
  card_number: string | null;
  bank_name: string | null;
  account_owner: string | null;
}

export default function SalePaymentPage() {
  const router = useRouter();
  const params = useParams();
  const saleId = parseInt(params.id as string);
  const { showToast, ToastContainer } = useToast();

  const [sale, setSale] = useState<ISaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<IPOSAccount | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<IItemSelection[]>([]);

  const [taxType, setTaxType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [taxValue, setTaxValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [showTaxDiscount, setShowTaxDiscount] = useState(false);

  const [selectAllItems, setSelectAllItems] = useState(true);
  const [customDivisor, setCustomDivisor] = useState<string>('2');

  useEffect(() => {
    loadSaleData();
    loadBankAccounts();
    loadPOSAccount();
    // loadUserPermissions();
  }, [saleId]);

  const loadSaleData = async () => {
    try {
      setLoading(true);
      const saleData = await fetchSaleDetails(saleId);
      setSale(saleData);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در بارگذاری', 'error');
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


  const calculateUnpaidTotal = useCallback((): number => {
    if (!sale) return 0;
    return sale.items
      .filter((item) => !item.is_paid)
      .reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
  }, [sale]);

  const calculateSelectedItemsTotal = useCallback((): number => {
    if (!sale) return 0;
    if (selectAllItems || selectedItems.length === 0) {
      return calculateUnpaidTotal();
    }

    return selectedItems.reduce((sum, selection) => {
      const item = sale.items.find((i) => i.id === selection.itemId);
      if (!item) return sum;
      return sum + Number(item.unit_price) * selection.quantity;
    }, 0);
  }, [sale, selectAllItems, selectedItems, calculateUnpaidTotal]);

  const calculateTaxAmount = (baseAmount: number): number => {
    const val = parseFloat(taxValue);
    if (!val || val <= 0) return 0;

    if (taxType === TaxDiscountType.FIXED) {
      return val;
    }
    return (baseAmount * val) / 100;
  };

  const calculateDiscountAmount = (baseAmount: number): number => {
    const val = parseFloat(discountValue);
    if (!val || val <= 0) return 0;

    if (discountType === TaxDiscountType.FIXED) {
      return val;
    }
    return (baseAmount * val) / 100;
  };

  const unpaidItems = useMemo(() => {
    return sale?.items.filter((item) => !item.is_paid) || [];
  }, [sale]);

  const paidItems = useMemo(() => {
    return sale?.items.filter((item) => item.is_paid) || [];
  }, [sale]);

  const handleItemSelectionChange = (itemId: number, quantity: number, maxQuantity: number) => {
    // If we're in "select all" mode and user is deselecting, switch to manual mode
    if (selectAllItems && quantity === 0) {
      // Switch to manual mode with all items except this one
      const otherItems = unpaidItems
        .filter((item) => item.id !== itemId)
        .map((item) => ({ itemId: item.id, quantity: item.quantity }));
      setSelectedItems(otherItems);
      setSelectAllItems(false);
      return;
    }

    // If we're in "select all" mode and user is changing quantity, switch to manual mode
    if (selectAllItems && quantity < maxQuantity) {
      const allItems = unpaidItems.map((item) => ({
        itemId: item.id,
        quantity: item.id === itemId ? quantity : item.quantity,
      }));
      setSelectedItems(allItems);
      setSelectAllItems(false);
      return;
    }

    // Normal manual mode updates
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
      // Switching from all to none
      setSelectedItems([]);
      setSelectAllItems(false);
    } else {
      // Switching to select all
      setSelectAllItems(true);
      setSelectedItems([]);
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === PaymentMethod.CASH) {
      setSelectedAccountId(null);
    }
  };

  const validatePayment = (): boolean => {
    if (!paymentMethod) {
      showToast(UI_TEXT.VALIDATION_SELECT_PAYMENT_METHOD, 'warning');
      return false;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      showToast(UI_TEXT.VALIDATION_AMOUNT_GREATER_THAN_ZERO, 'warning');
      return false;
    }

    if (paymentMethod !== PaymentMethod.CASH && !selectedAccountId) {
      showToast(UI_TEXT.VALIDATION_SELECT_ACCOUNT, 'warning');
      return false;
    }

    return true;
  };

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

      // Reload sale data to show updated payment history
      await loadSaleData();

      // Reset payment form
      setAmount('');
      setTipAmount('0');
      setSelectedItems([]);
      setSelectAllItems(true);
      setTaxValue('0');
      setDiscountValue('0');
      setShowTaxDiscount(false);

      // Show appropriate message based on payment result
      if (response.was_auto_closed || response.is_fully_paid) {
        showToast('پرداخت ثبت شد و فروش بسته شد', 'success');
        setTimeout(() => {
          router.push('/sale/dashboard');
        }, 1500);
      } else {
        showToast(UI_TEXT.MSG_PAYMENT_SUCCESS, 'success');
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : UI_TEXT.ERROR_ADDING_PAYMENT,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoidPayment = async (paymentId: number) => {
    if (!sale) return;

    const confirmed = window.confirm('آیا مطمئن هستید که می‌خواهید این پرداخت را لغو کنید؟');
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await voidPayment(saleId, paymentId);
      await loadSaleData();
      showToast('پرداخت با موفقیت لغو شد', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'خطا در لغو پرداخت',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message="در حال بارگذاری..." />;
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
        <div className="text-center">
          <div className="text-4xl mb-4" style={{ color: THEME_COLORS.red }}>⚠️</div>
          <p style={{ color: THEME_COLORS.text }}>فروش یافت نشد</p>
        </div>
      </div>
    );
  }

  const selectedTotal = calculateSelectedItemsTotal();
  const taxAmount = calculateTaxAmount(selectedTotal);
  const discountAmount = calculateDiscountAmount(selectedTotal);
  const tipAmountValue = parseFloat(tipAmount) || 0;
  const finalAmount = selectedTotal + taxAmount - discountAmount + tipAmountValue;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header className="px-4 py-3 border-b flex-shrink-0" style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}>
        <div className="max-w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded font-bold text-sm"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              ← بازگشت
            </button>
            <h1 className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
              پرداخت فروش #{saleId}
            </h1>
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex-5 grid grid-cols-12 gap-4 overflow-hidden">

        {/* LEFT COLUMN - Scrollable Items List (65%) */}
        <div className="col-span-3 flex flex-col overflow-hidden border-l" style={{ borderColor: THEME_COLORS.border }}>

          {/* Quick Select Bar */}
          <div className="flex-shrink-0 px-2 py-1 border-b flex items-center justify-between" style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.border }}>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllToggle}
                className="px-4 py-2 rounded font-bold text-sm border-2 transition-all"
                style={{
                  backgroundColor: selectAllItems ? THEME_COLORS.accent : 'transparent',
                  borderColor: THEME_COLORS.accent,
                  color: selectAllItems ? '#fff' : THEME_COLORS.text,
                }}
              >
                همه اقلام
              </button>
              <span className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                {unpaidItems.length} مورد پرداخت نشده
              </span>
            </div>
          </div>

          {/* Scrollable Items List */}
          <div className="flex-3 overflow-y-auto px-4 py-2">
            <div className="space-y-2">
              {/* Unpaid Items */}
              {unpaidItems.map((item) => {
                const selection = selectedItems.find((s) => s.itemId === item.id);
                const selectedQty = selectAllItems ? item.quantity : (selection?.quantity || 0);
                const isSelected = selectAllItems || selectedQty > 0;
                const itemTotal = selectedQty * item.unit_price;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 rounded border"
                    style={{
                      backgroundColor: isSelected ? `${THEME_COLORS.accent}15` : THEME_COLORS.surface,
                      borderColor: isSelected ? THEME_COLORS.accent : THEME_COLORS.border,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleItemSelectionChange(item.id, item.quantity, item.quantity);
                        } else {
                          handleItemSelectionChange(item.id, 0, item.quantity);
                        }
                      }}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                        {item.product_name}
                      </div>
                      <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                        {formatPersianMoney(item.unit_price)} × {item.quantity}
                      </div>
                    </div>
                    {isSelected && item.quantity > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleItemSelectionChange(item.id, Math.max(0, selectedQty - 1), item.quantity)}
                          className="w-8 h-8 rounded font-bold flex items-center justify-center"
                          style={{ backgroundColor: THEME_COLORS.red, color: '#fff' }}
                        >
                          −
                        </button>
                        <div className="w-10 text-center font-bold" style={{ color: THEME_COLORS.text }}>
                          {selectedQty}
                        </div>
                        <button
                          onClick={() => handleItemSelectionChange(item.id, Math.min(item.quantity, selectedQty + 1), item.quantity)}
                          className="w-8 h-8 rounded font-bold flex items-center justify-center"
                          style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
                          disabled={selectedQty >= item.quantity}
                        >
                          +
                        </button>
                      </div>
                    )}
                    {isSelected && (
                      <div className="text-right min-w-20">
                        <div className="text-lg font-bold" style={{ color: THEME_COLORS.green }}>
                          {formatPersianMoney(itemTotal)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Paid Items */}
              {paidItems.length > 0 && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: THEME_COLORS.border }}>
                  <div className="text-sm font-bold mb-2 px-2" style={{ color: THEME_COLORS.green }}>
                    ✓ پرداخت شده ({paidItems.length})
                  </div>
                  {paidItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2 rounded opacity-50"
                      style={{ backgroundColor: THEME_COLORS.surface }}
                    >
                      <div className="flex-1">
                        <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                          {item.product_name}
                        </div>
                        <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                          {formatPersianMoney(item.unit_price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-sm font-bold" style={{ color: THEME_COLORS.green }}>
                        پرداخت شده
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Sticky Payment Panel (35%) */}
        <div className="col-span-4 flex flex-col overflow-hidden" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>

          {/* Compact Summary Bar */}
          <div className="flex-shrink-0 px-4 py-3 border-b grid grid-cols-4 gap-2 text-center" style={{ borderColor: THEME_COLORS.border }}>
            <div>
              <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>مجموع</div>
              <div className="font-bold text-base" style={{ color: THEME_COLORS.text }}>
                {formatPersianMoney(sale.total_amount)}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>پرداخت شده</div>
              <div className="font-bold text-base" style={{ color: THEME_COLORS.green }}>
                {formatPersianMoney(sale.total_paid || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>مانده</div>
              <div className="font-bold text-base" style={{ color: THEME_COLORS.orange }}>
                {formatPersianMoney(sale.balance_due ?? sale.total_amount)}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>وضعیت</div>
              <div className="font-bold text-sm" style={{ color: THEME_COLORS.cyan }}>
                {sale.payment_status === 'PAID' ? '✓' :
                  sale.payment_status === 'PARTIALLY_PAID' ? 'جزئی' : 'بدون'}
              </div>
            </div>
          </div>

          {/* Payment Form - No Scroll */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {/* Large Amount Input */}
            <div>
              <label className="block text-base font-bold mb-2" style={{ color: THEME_COLORS.text }}>مبلغ پرداخت</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-4 rounded text-2xl font-bold text-center border-2"
                style={{
                  backgroundColor: THEME_COLORS.surface,
                  borderColor: THEME_COLORS.accent,
                  color: THEME_COLORS.text
                }}
                placeholder="0"
              />
            </div>

            {/* Quick Calculation - AFTER inputs */}
            <div>
              <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.subtext }}>محاسبه سریع</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    const baseAmount = calculateSelectedItemsTotal();
                    const taxAmt = calculateTaxAmount(baseAmount);
                    const discountAmt = calculateDiscountAmount(baseAmount);
                    const tip = parseFloat(tipAmount) || 0;
                    const final = baseAmount + taxAmt - discountAmt + tip;
                    setAmount(final.toFixed(0));
                  }}
                  className="py-3 rounded font-bold border-2"
                  style={{
                    backgroundColor: THEME_COLORS.green,
                    borderColor: THEME_COLORS.green,
                    color: '#fff',
                  }}
                >
                  همه
                </button>
                <button
                  onClick={() => {
                    const baseAmount = calculateSelectedItemsTotal();
                    const taxAmt = calculateTaxAmount(baseAmount);
                    const discountAmt = calculateDiscountAmount(baseAmount);
                    const tip = parseFloat(tipAmount) || 0;
                    const final = baseAmount + taxAmt - discountAmt + tip;
                    setAmount((final / 2).toFixed(0));
                  }}
                  className="py-3 rounded font-bold border-2"
                  style={{
                    backgroundColor: THEME_COLORS.blue,
                    borderColor: THEME_COLORS.blue,
                    color: '#fff',
                  }}
                >
                  نصف
                </button>
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    min="2"
                    value={customDivisor}
                    onChange={(e) => setCustomDivisor(e.target.value)}
                    className="px-2 py-1 rounded text-center border"
                    style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
                    placeholder="÷ 2"
                  />
                  <button
                    onClick={() => {
                      const divisor = parseInt(customDivisor) || 2;
                      const baseAmount = calculateSelectedItemsTotal();
                      const taxAmt = calculateTaxAmount(baseAmount);
                      const discountAmt = calculateDiscountAmount(baseAmount);
                      const tip = parseFloat(tipAmount) || 0;
                      const final = baseAmount + taxAmt - discountAmt + tip;
                      setAmount((final / divisor).toFixed(0));
                    }}
                    className="py-1 rounded font-bold text-sm"
                    style={{
                      backgroundColor: THEME_COLORS.accent,
                      color: '#fff',
                    }}
                  >
                    اعمال
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Method - Segmented */}
            <div>
              <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>روش پرداخت</div>
              <div className="grid grid-cols-3 gap-1 rounded p-1" style={{ backgroundColor: THEME_COLORS.surface }}>
                {[
                  { value: PaymentMethod.CASH, label: 'نقدی', icon: '💵' },
                  { value: PaymentMethod.POS, label: 'کارتخوان', icon: '💳' },
                  { value: PaymentMethod.CARD_TRANSFER, label: 'کارت', icon: '🏦' },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => handlePaymentMethodChange(method.value)}
                    className="py-3 rounded font-bold transition-all text-sm"
                    style={{
                      backgroundColor: paymentMethod === method.value ? THEME_COLORS.accent : 'transparent',
                      color: paymentMethod === method.value ? '#fff' : THEME_COLORS.text,
                    }}
                  >
                    <div>{method.icon}</div>
                    <div>{method.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Selection - Compact */}
            {paymentMethod !== PaymentMethod.CASH && (
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>
                  {paymentMethod === PaymentMethod.POS ? 'کارتخوان' : 'حساب مقصد'}
                </div>
                {paymentMethod === PaymentMethod.POS && posAccount?.id ? (
                  <div className="p-3 rounded border" style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.green }}>
                    <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                      {posAccount.account_owner}
                    </div>
                    <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                      {posAccount.card_number}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {bankAccounts.map((account) => (
                      <label
                        key={account.id}
                        className="flex items-center gap-2 p-2 rounded cursor-pointer border"
                        style={{
                          backgroundColor: selectedAccountId === account.id ? `${THEME_COLORS.accent}20` : THEME_COLORS.surface,
                          borderColor: selectedAccountId === account.id ? THEME_COLORS.accent : THEME_COLORS.border,
                        }}
                      >
                        <input
                          type="radio"
                          name="account"
                          checked={selectedAccountId === account.id}
                          onChange={() => setSelectedAccountId(account.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm" style={{ color: THEME_COLORS.text }}>
                            {account.related_user_name}
                          </div>
                          <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                            {account.card_number}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tax/Discount/Tip - Collapsible */}
            <div>
              <button
                onClick={() => setShowTaxDiscount(!showTaxDiscount)}
                className="w-full flex items-center justify-between py-2 px-3 rounded"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <span className="font-bold" style={{ color: THEME_COLORS.text }}>
                  مالیات / تخفیف / انعام
                </span>
                <span style={{ color: THEME_COLORS.accent }}>
                  {showTaxDiscount ? '▼' : '◀'}
                </span>
              </button>

              {showTaxDiscount && (
                <div className="mt-2 space-y-3 p-3 rounded" style={{ backgroundColor: THEME_COLORS.surface }}>
                  {/* Tax */}
                  <div>
                    <div className="text-sm font-bold mb-1" style={{ color: THEME_COLORS.blue }}>مالیات</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTaxType(TaxDiscountType.FIXED)}
                        className="flex-1 py-1 rounded text-sm"
                        style={{
                          backgroundColor: taxType === TaxDiscountType.FIXED ? THEME_COLORS.blue : 'transparent',
                          color: taxType === TaxDiscountType.FIXED ? '#fff' : THEME_COLORS.text,
                          border: `1px solid ${THEME_COLORS.blue}`,
                        }}
                      >
                        ثابت
                      </button>
                      <button
                        onClick={() => setTaxType(TaxDiscountType.PERCENTAGE)}
                        className="flex-1 py-1 rounded text-sm"
                        style={{
                          backgroundColor: taxType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.blue : 'transparent',
                          color: taxType === TaxDiscountType.PERCENTAGE ? '#fff' : THEME_COLORS.text,
                          border: `1px solid ${THEME_COLORS.blue}`,
                        }}
                      >
                        درصد
                      </button>
                      <input
                        type="number"
                        value={taxValue}
                        onChange={(e) => setTaxValue(e.target.value)}
                        className="flex-1 px-2 py-1 rounded border text-center"
                        style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.blue, color: THEME_COLORS.text }}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Discount */}
                  <div>
                    <div className="text-sm font-bold mb-1" style={{ color: THEME_COLORS.orange }}>تخفیف</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDiscountType(TaxDiscountType.FIXED)}
                        className="flex-1 py-1 rounded text-sm"
                        style={{
                          backgroundColor: discountType === TaxDiscountType.FIXED ? THEME_COLORS.orange : 'transparent',
                          color: discountType === TaxDiscountType.FIXED ? '#fff' : THEME_COLORS.text,
                          border: `1px solid ${THEME_COLORS.orange}`,
                        }}
                      >
                        ثابت
                      </button>
                      <button
                        onClick={() => setDiscountType(TaxDiscountType.PERCENTAGE)}
                        className="flex-1 py-1 rounded text-sm"
                        style={{
                          backgroundColor: discountType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.orange : 'transparent',
                          color: discountType === TaxDiscountType.PERCENTAGE ? '#fff' : THEME_COLORS.text,
                          border: `1px solid ${THEME_COLORS.orange}`,
                        }}
                      >
                        درصد
                      </button>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="flex-1 px-2 py-1 rounded border text-center"
                        style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.orange, color: THEME_COLORS.text }}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Tip */}
                  <div>
                    <div className="text-sm font-bold mb-1" style={{ color: THEME_COLORS.text }}>انعام</div>
                    <input
                      type="number"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded border"
                      style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
                      placeholder="0"
                    />
                  </div>

                  {/* Summary */}
                  <div className="pt-2 border-t space-y-1" style={{ borderColor: THEME_COLORS.border }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: THEME_COLORS.subtext }}>انتخاب شده:</span>
                      <span style={{ color: THEME_COLORS.text }}>{formatPersianMoney(selectedTotal)}</span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: THEME_COLORS.subtext }}>مالیات:</span>
                        <span style={{ color: THEME_COLORS.text }}>+{formatPersianMoney(taxAmount)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: THEME_COLORS.subtext }}>تخفیف:</span>
                        <span style={{ color: THEME_COLORS.red }}>-{formatPersianMoney(discountAmount)}</span>
                      </div>
                    )}
                    {tipAmountValue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: THEME_COLORS.subtext }}>انعام:</span>
                        <span style={{ color: THEME_COLORS.text }}>+{formatPersianMoney(tipAmountValue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-1 border-t" style={{ borderColor: THEME_COLORS.border }}>
                      <span style={{ color: THEME_COLORS.text }}>جمع:</span>
                      <span style={{ color: THEME_COLORS.accent }}>{formatPersianMoney(finalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Submit Button - Always Visible */}
          <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: THEME_COLORS.border }}>
            <button
              onClick={handleSubmitPayment}
              disabled={submitting}
              className="w-full py-4 rounded-lg font-bold text-lg transition-all disabled:opacity-50"
              style={{
                backgroundColor: THEME_COLORS.green,
                color: '#fff',
              }}
            >
              {submitting ? 'در حال ثبت...' : `ثبت پرداخت ${formatPersianMoney(parseFloat(amount) || 0)}`}
            </button>
          </div>

        </div>
      </div>

      {submitting && <LoadingOverlay message="در حال ثبت..." />}
      <ToastContainer />
    </div>
  );
}
