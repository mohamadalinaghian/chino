'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
} from '@/service/sale';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS, UI_TEXT, API_ENDPOINTS, CS_API_URL } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { formatJalaliDateTime } from '@/utils/persianUtils';
import { IUserPermissions } from '@/types/sale';
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
  const [userPermissions, setUserPermissions] = useState<IUserPermissions | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD_TRANSFER);
  const [amount, setAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<IItemSelection[]>([]);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');

  const [taxType, setTaxType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [taxValue, setTaxValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState<string>('0');

  const [selectAllItems, setSelectAllItems] = useState(true);
  const [customDivisor, setCustomDivisor] = useState<string>('3');

  useEffect(() => {
    loadSaleData();
    loadBankAccounts();
    loadPOSAccount();
    loadUserPermissions();
  }, [saleId]);

  // Auto-update amount when selection, tax/discount, or tip changes
  useEffect(() => {
    if (sale) {
      const baseAmount = calculateSelectedItemsTotal();
      const taxAmt = calculateTaxAmount(baseAmount);
      const discountAmt = calculateDiscountAmount(baseAmount);
      const tip = parseFloat(tipAmount) || 0;
      const finalAmount = baseAmount + taxAmt - discountAmt + tip;
      setAmount(finalAmount.toString());
    }
  }, [selectedItems, selectAllItems, taxValue, taxType, discountValue, discountType, tipAmount, sale]);

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
      showToast(UI_TEXT.ERROR_LOADING_BANK_ACCOUNTS, 'error');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadPOSAccount = async () => {
    try {
      const account = await authenticatedFetchJSON<IPOSAccount>(
        `${CS_API_URL}${API_ENDPOINTS.POS_ACCOUNT}`
      );
      setPosAccount(account);
    } catch (err) {
      console.error('Error loading POS account:', err);
    }
  };

  const loadUserPermissions = async () => {
    try {
      const permissions = await authenticatedFetchJSON<IUserPermissions>(
        `${CS_API_URL}${API_ENDPOINTS.AUTH_ME}`
      );
      setUserPermissions(permissions);
    } catch (err) {
      console.error('Error loading permissions:', err);
    }
  };

  const canEditTaxDiscount = useMemo(() => {
    return userPermissions?.is_superuser || false;
  }, [userPermissions]);

  const canSeeAccountBalance = useMemo(() => {
    return userPermissions?.is_superuser || false;
  }, [userPermissions]);

  const calculateUnpaidTotal = (): number => {
    if (!sale) return 0;
    return sale.balance_due ?? sale.total_amount;
  };

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
  }, [sale, selectAllItems, selectedItems]);

  const calculateTaxAmount = (baseAmount: number): number => {
    const val = parseFloat(taxValue);
    if (!val || val <= 0) return 0;

    if (taxType === TaxDiscountType.FIXED) {
      return val;
    } else {
      return (baseAmount * val) / 100;
    }
  };

  const calculateDiscountAmount = (baseAmount: number): number => {
    const val = parseFloat(discountValue);
    if (!val || val <= 0) return 0;

    if (discountType === TaxDiscountType.FIXED) {
      return val;
    } else {
      return (baseAmount * val) / 100;
    }
  };

  const { paidItems, unpaidItems } = useMemo(() => {
    if (!sale) return { paidItems: [], unpaidItems: [] };

    // Build a set of all item IDs that have been paid (fully)
    const paidItemIds = new Set<number>();

    // Track which items are covered by payments
    if (sale.payments && sale.payments.length > 0) {
      sale.payments.forEach((payment) => {
        if (payment.covered_item_ids && payment.covered_item_ids.length > 0) {
          payment.covered_item_ids.forEach((itemId) => {
            paidItemIds.add(itemId);
          });
        }
      });
    }

    const paid: ISaleItemDetail[] = [];
    const unpaid: ISaleItemDetail[] = [];

    sale.items.forEach((item) => {
      if (paidItemIds.has(item.id)) {
        paid.push(item);
      } else {
        unpaid.push(item);
      }
    });

    return { paidItems: paid, unpaidItems: unpaid };
  }, [sale]);

  const filteredBankAccounts = useMemo(() => {
    if (!accountSearchQuery.trim()) return bankAccounts;
    const query = accountSearchQuery.toLowerCase();
    return bankAccounts.filter(
      (account) =>
        account.card_number.includes(query) ||
        account.account_owner.toLowerCase().includes(query) ||
        (account.bank_name && account.bank_name.toLowerCase().includes(query))
    );
  }, [bankAccounts, accountSearchQuery]);

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);

    // Only auto-select for POS
    if (method === PaymentMethod.POS && posAccount?.id) {
      setSelectedAccountId(posAccount.id);
    } else if (method === PaymentMethod.CASH) {
      setSelectedAccountId(null);
    }
    // For CARD_TRANSFER, don't auto-select - let user choose
  };

  const handleItemQuantityChange = (itemId: number, quantity: number) => {
    setSelectAllItems(false);
    if (quantity === 0) {
      setSelectedItems((prev) => prev.filter((s) => s.itemId !== itemId));
    } else {
      setSelectedItems((prev) => {
        const existing = prev.find((s) => s.itemId === itemId);
        if (existing) {
          return prev.map((s) => (s.itemId === itemId ? { ...s, quantity } : s));
        } else {
          return [...prev, { itemId, quantity }];
        }
      });
    }
  };

  const handleSelectAllToggle = () => {
    setSelectAllItems(!selectAllItems);
    if (!selectAllItems) {
      setSelectedItems([]);
    }
  };

  const handlePrintInvoice = () => {
    // TODO: Implement print functionality
    showToast('قابلیت چاپ به زودی اضافه می‌شود', 'info');
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
    <div className="min-h-screen" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header className="p-2 border-b" style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}>
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="px-3 py-1.5 rounded-lg font-bold text-sm"
              style={{ backgroundColor: 'transparent', borderColor: THEME_COLORS.border, color: THEME_COLORS.subtext, border: '2px solid' }}
            >
              ← بازگشت
            </button>
            <h1 className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
              پرداخت #{saleId}
            </h1>
          </div>
          <button
            onClick={handlePrintInvoice}
            className="px-3 py-1.5 rounded-lg font-bold text-sm"
            style={{ backgroundColor: THEME_COLORS.cyan, color: '#fff' }}
          >
            🖨️ چاپ فاکتور
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-2">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-2">
            {/* Sale Info - Compact */}
            <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <div style={{ color: THEME_COLORS.subtext }}>مجموع:</div>
                  <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                    {formatPersianMoney(sale.total_amount)}
                  </div>
                </div>
                <div>
                  <div style={{ color: THEME_COLORS.subtext }}>پرداخت شده:</div>
                  <div className="font-bold" style={{ color: THEME_COLORS.green }}>
                    {formatPersianMoney(sale.total_paid || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ color: THEME_COLORS.subtext }}>مانده:</div>
                  <div className="font-bold" style={{ color: THEME_COLORS.orange }}>
                    {formatPersianMoney(sale.balance_due ?? sale.total_amount)}
                  </div>
                </div>
                <div>
                  <div style={{ color: THEME_COLORS.subtext }}>وضعیت:</div>
                  <div className="font-bold text-xs" style={{ color: THEME_COLORS.cyan }}>
                    {sale.payment_status === 'PAID' ? 'پرداخت شده' :
                      sale.payment_status === 'PARTIALLY_PAID' ? 'پرداخت جزئی' : 'پرداخت نشده'}
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Card - Dynamic */}
            <div className="p-3 rounded-lg border-2" style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.accent }}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <label className="block text-xs mb-1" style={{ color: THEME_COLORS.text }}>مبلغ پرداخت *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border text-sm"
                    style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: THEME_COLORS.text }}>انعام</label>
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border text-sm"
                    style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
                  />
                </div>
              </div>

              {/* Quick Calculation Buttons */}
              <div className="mt-2">
                <div className="text-xs mb-1" style={{ color: THEME_COLORS.subtext }}>محاسبه سریع (بر اساس مانده):</div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      const remaining = sale.balance_due ?? sale.total_amount;
                      setAmount(remaining.toFixed(0));
                    }}
                    className="py-1 rounded text-xs border font-bold"
                    style={{
                      backgroundColor: amount === (sale.balance_due ?? sale.total_amount).toFixed(0) ? THEME_COLORS.green : THEME_COLORS.surface,
                      borderColor: THEME_COLORS.green,
                      color: amount === (sale.balance_due ?? sale.total_amount).toFixed(0) ? '#fff' : THEME_COLORS.text
                    }}
                  >
                    همه
                  </button>
                  <button
                    onClick={() => {
                      const remaining = sale.balance_due ?? sale.total_amount;
                      setAmount((remaining / 2).toFixed(0));
                    }}
                    className="py-1 rounded text-xs border"
                    style={{
                      backgroundColor: amount === ((sale.balance_due ?? sale.total_amount) / 2).toFixed(0) ? THEME_COLORS.blue : THEME_COLORS.surface,
                      borderColor: THEME_COLORS.border,
                      color: amount === ((sale.balance_due ?? sale.total_amount) / 2).toFixed(0) ? '#fff' : THEME_COLORS.text
                    }}
                  >
                    نصف
                  </button>
                  <div className="flex gap-1">
                    <span className="text-xs py-1" style={{ color: THEME_COLORS.text }}>÷</span>
                    <input
                      type="number"
                      min="2"
                      value={customDivisor}
                      onChange={(e) => setCustomDivisor(e.target.value)}
                      onBlur={() => {
                        const divisor = parseInt(customDivisor) || 3;
                        const remaining = sale.balance_due ?? sale.total_amount;
                        setAmount((remaining / divisor).toFixed(0));
                      }}
                      className="w-full px-1 py-1 rounded border text-xs text-center"
                      style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t" style={{ borderColor: THEME_COLORS.border }}>
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
                <div className="flex justify-between text-base font-bold mt-1 pt-1 border-t" style={{ borderColor: THEME_COLORS.border }}>
                  <span style={{ color: THEME_COLORS.text }}>جمع نهایی:</span>
                  <span style={{ color: THEME_COLORS.accent }}>{formatPersianMoney(finalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Paid Items - Read Only */}
            {paidItems.length > 0 && (
              <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
                <h3 className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.green }}>اقلام پرداخت شده</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {paidItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded text-xs opacity-60"
                      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div style={{ color: THEME_COLORS.text }}>✓ {item.product_name}</div>
                          <div style={{ color: THEME_COLORS.subtext }}>
                            {item.quantity} × {formatPersianMoney(item.unit_price)}
                          </div>
                        </div>
                        <div className="font-bold" style={{ color: THEME_COLORS.green }}>
                          پرداخت شده
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unpaid Item Selection - Compact */}
            <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold" style={{ color: THEME_COLORS.text }}>
                  {paidItems.length > 0 ? 'اقلام پرداخت نشده' : 'اقلام'}
                </h3>
                <label className="flex items-center gap-1 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectAllItems}
                    onChange={handleSelectAllToggle}
                    className="w-4 h-4"
                  />
                  <span style={{ color: THEME_COLORS.text }}>همه</span>
                </label>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {unpaidItems.length > 0 ? (
                  unpaidItems.map((item) => {
                  const selection = selectedItems.find((s) => s.itemId === item.id);
                  const selectedQty = selection?.quantity || 0;

                  return (
                    <div
                      key={item.id}
                      className="p-2 rounded text-xs"
                      style={{
                        backgroundColor: selectAllItems || selectedQty > 0 ? THEME_COLORS.hover : THEME_COLORS.bgSecondary,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div style={{ color: THEME_COLORS.text }}>{item.product_name}</div>
                          <div style={{ color: THEME_COLORS.subtext }}>
                            {item.quantity} × {formatPersianMoney(item.unit_price)}
                          </div>
                        </div>
                        {!selectAllItems && (
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={selectedQty}
                            onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-1 py-0.5 rounded border text-center text-xs"
                            style={{ backgroundColor: THEME_COLORS.bgPrimary, borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
                ) : (
                  <div className="text-center py-4 text-xs" style={{ color: THEME_COLORS.subtext }}>
                    همه اقلام پرداخت شده است
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method - Compact */}
            <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>روش پرداخت</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: PaymentMethod.CARD_TRANSFER, label: 'کارت به کارت' },
                  { value: PaymentMethod.POS, label: 'کارتخوان' },
                  { value: PaymentMethod.CASH, label: 'نقدی' },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => handlePaymentMethodChange(method.value)}
                    className="py-2 rounded text-xs font-bold border-2"
                    style={{
                      backgroundColor: paymentMethod === method.value ? THEME_COLORS.accent : 'transparent',
                      borderColor: paymentMethod === method.value ? THEME_COLORS.accent : THEME_COLORS.border,
                      color: paymentMethod === method.value ? '#fff' : THEME_COLORS.text,
                    }}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Selection - Only for Card Transfer */}
            {paymentMethod === PaymentMethod.CARD_TRANSFER && (
              <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
                <h3 className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>انتخاب حساب مقصد</h3>
                <input
                  type="text"
                  value={accountSearchQuery}
                  onChange={(e) => setAccountSearchQuery(e.target.value)}
                  placeholder="جستجو..."
                  className="w-full px-2 py-1.5 rounded border mb-2 text-xs"
                  style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border, color: THEME_COLORS.text }}
                />
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {filteredBankAccounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center gap-2 p-2 rounded cursor-pointer text-xs"
                      style={{
                        backgroundColor: selectedAccountId === account.id ? THEME_COLORS.hover : THEME_COLORS.bgSecondary,
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
                        <div style={{ color: THEME_COLORS.text }}>{account.account_owner}</div>
                        <div style={{ color: THEME_COLORS.subtext }}>{account.card_number}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* POS Account Display (Cash has no destination account) */}
            {paymentMethod === PaymentMethod.POS && posAccount?.id && (
              <div className="p-2 rounded-lg border" style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.green }}>
                <div className="text-xs font-bold mb-1" style={{ color: THEME_COLORS.green }}>
                  حساب مقصد (کارتخوان):
                </div>
                <div className="text-xs" style={{ color: THEME_COLORS.text }}>
                  {posAccount.account_owner} - {posAccount.card_number}
                </div>
              </div>
            )}

            {/* Tax/Discount - With Clear Labels */}
            {canEditTaxDiscount && (
              <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
                <h3 className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>مالیات و تخفیف</h3>
                <div className="grid grid-cols-2 gap-2">
                  {/* Tax Section */}
                  <div className="p-2 rounded border" style={{ borderColor: THEME_COLORS.blue, backgroundColor: `${THEME_COLORS.blue}10` }}>
                    <div className="text-xs font-bold mb-1" style={{ color: THEME_COLORS.blue }}>
                      ➕ مالیات
                    </div>
                    <div className="flex gap-1 mb-1">
                      <button
                        onClick={() => setTaxType(TaxDiscountType.FIXED)}
                        className="flex-1 py-1 rounded text-xs border"
                        style={{
                          backgroundColor: taxType === TaxDiscountType.FIXED ? THEME_COLORS.blue : 'transparent',
                          borderColor: THEME_COLORS.blue,
                          color: taxType === TaxDiscountType.FIXED ? '#fff' : THEME_COLORS.blue,
                        }}
                      >
                        ثابت
                      </button>
                      <button
                        onClick={() => setTaxType(TaxDiscountType.PERCENTAGE)}
                        className="flex-1 py-1 rounded text-xs border"
                        style={{
                          backgroundColor: taxType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.blue : 'transparent',
                          borderColor: THEME_COLORS.blue,
                          color: taxType === TaxDiscountType.PERCENTAGE ? '#fff' : THEME_COLORS.blue,
                        }}
                      >
                        درصد
                      </button>
                    </div>
                    <input
                      type="number"
                      value={taxValue}
                      onChange={(e) => setTaxValue(e.target.value)}
                      placeholder="مقدار مالیات"
                      className="w-full px-2 py-1 rounded border text-xs"
                      style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.blue, color: THEME_COLORS.text }}
                    />
                  </div>

                  {/* Discount Section */}
                  <div className="p-2 rounded border" style={{ borderColor: THEME_COLORS.orange, backgroundColor: `${THEME_COLORS.orange}10` }}>
                    <div className="text-xs font-bold mb-1" style={{ color: THEME_COLORS.orange }}>
                      ➖ تخفیف
                    </div>
                    <div className="flex gap-1 mb-1">
                      <button
                        onClick={() => setDiscountType(TaxDiscountType.FIXED)}
                        className="flex-1 py-1 rounded text-xs border"
                        style={{
                          backgroundColor: discountType === TaxDiscountType.FIXED ? THEME_COLORS.orange : 'transparent',
                          borderColor: THEME_COLORS.orange,
                          color: discountType === TaxDiscountType.FIXED ? '#fff' : THEME_COLORS.orange,
                        }}
                      >
                        ثابت
                      </button>
                      <button
                        onClick={() => setDiscountType(TaxDiscountType.PERCENTAGE)}
                        className="flex-1 py-1 rounded text-xs border"
                        style={{
                          backgroundColor: discountType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.orange : 'transparent',
                          borderColor: THEME_COLORS.orange,
                          color: discountType === TaxDiscountType.PERCENTAGE ? '#fff' : THEME_COLORS.orange,
                        }}
                      >
                        درصد
                      </button>
                    </div>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="مقدار تخفیف"
                      className="w-full px-2 py-1 rounded border text-xs"
                      style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.orange, color: THEME_COLORS.text }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitPayment}
              disabled={submitting}
              className="w-full py-3 rounded-lg font-bold transition-all disabled:opacity-50"
              style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
            >
              {submitting ? 'در حال ثبت...' : 'ثبت پرداخت'}
            </button>
          </div>

          {/* Right Column - Payment History */}
          <div className="lg:col-span-2">
            <div className="p-2 rounded-lg sticky top-2" style={{ backgroundColor: THEME_COLORS.surface }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>تاریخچه پرداخت‌ها</h3>

              {sale.payments && sale.payments.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sale.payments.map((payment, index) => (
                    <div
                      key={payment.id}
                      className="p-2 rounded border text-xs"
                      style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold" style={{ color: THEME_COLORS.text }}>
                          #{index + 1}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor:
                              payment.method === 'CASH'
                                ? THEME_COLORS.green
                                : payment.method === 'POS'
                                ? THEME_COLORS.blue
                                : THEME_COLORS.purple,
                            color: '#fff',
                          }}
                        >
                          {payment.method === 'CASH'
                            ? 'نقدی'
                            : payment.method === 'POS'
                            ? 'کارتخوان'
                            : 'کارت به کارت'}
                        </span>
                      </div>

                      <div className="space-y-0.5" style={{ color: THEME_COLORS.subtext }}>
                        <div className="flex justify-between">
                          <span>مبلغ:</span>
                          <span style={{ color: THEME_COLORS.text }}>
                            {formatPersianMoney(payment.amount_applied)}
                          </span>
                        </div>
                        {payment.tip_amount > 0 && (
                          <div className="flex justify-between">
                            <span>انعام:</span>
                            <span style={{ color: THEME_COLORS.text }}>
                              {formatPersianMoney(payment.tip_amount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold">
                          <span>جمع:</span>
                          <span style={{ color: THEME_COLORS.accent }}>
                            {formatPersianMoney(payment.amount_total)}
                          </span>
                        </div>
                      </div>

                      {payment.destination_account_owner && (
                        <div className="mt-1 pt-1 border-t" style={{ borderColor: THEME_COLORS.border }}>
                          <div style={{ color: THEME_COLORS.subtext }}>حساب مقصد:</div>
                          <div style={{ color: THEME_COLORS.text }}>
                            {payment.destination_account_owner}
                          </div>
                          {payment.destination_card_number && (
                            <div style={{ color: THEME_COLORS.subtext }}>
                              {payment.destination_card_number}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-1 pt-1 border-t" style={{ borderColor: THEME_COLORS.border }}>
                        <div style={{ color: THEME_COLORS.subtext }}>
                          {formatJalaliDateTime(payment.received_at)}
                        </div>
                        <div style={{ color: THEME_COLORS.subtext }}>
                          دریافت کننده: {payment.received_by_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs" style={{ color: THEME_COLORS.subtext }}>
                  پرداختی ثبت نشده است
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {submitting && <LoadingOverlay message="در حال ثبت..." />}
      <ToastContainer />
    </div>
  );
}
