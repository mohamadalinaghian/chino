'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  PaymentMethod,
  TaxDiscountType,
  ISaleDetailResponse,
  IAddPaymentInput,
  IBankAccount,
  IPaymentDetail,
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

/**
 * Item quantity selection for partial payment
 */
interface IItemSelection {
  itemId: number;
  quantity: number; // Selected quantity (can be less than total)
}

/**
 * POS terminal account
 */
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

  // Sale data
  const [sale, setSale] = useState<ISaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<IPOSAccount | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // User permissions
  const [userPermissions, setUserPermissions] = useState<IUserPermissions | null>(null);

  // Payment input state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD_TRANSFER);
  const [amount, setAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<IItemSelection[]>([]);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');

  // Tax and discount state
  const [taxType, setTaxType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [taxValue, setTaxValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<TaxDiscountType>(TaxDiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState<string>('0');

  // UI state
  const [selectAllItems, setSelectAllItems] = useState(true);

  useEffect(() => {
    loadSaleData();
    loadBankAccounts();
    loadPOSAccount();
    loadUserPermissions();
  }, [saleId]);

  useEffect(() => {
    // Auto-fill amount when selection changes
    if (sale && selectedItems.length > 0 && !amount) {
      const selectedTotal = calculateSelectedItemsTotal();
      setAmount(selectedTotal.toString());
    }
  }, [selectedItems, sale]);

  useEffect(() => {
    // When select all is toggled
    if (sale && selectAllItems) {
      setSelectedItems([]);
      const unpaidTotal = calculateUnpaidTotal();
      setAmount(unpaidTotal.toString());
    }
  }, [selectAllItems, sale]);

  const loadSaleData = async () => {
    try {
      setLoading(true);
      const saleData = await fetchSaleDetails(saleId);
      setSale(saleData);

      // Set initial amount to unpaid balance
      const unpaidBalance = calculateUnpaidBalanceForSale(saleData);
      setAmount(unpaidBalance.toString());
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات فروش',
        'error'
      );
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

      // Auto-select POS account if method is POS
      if (account?.id && paymentMethod === PaymentMethod.POS) {
        setSelectedAccountId(account.id);
      }
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
      console.error('Error loading user permissions:', err);
    }
  };

  const canEditTaxDiscount = useMemo(() => {
    return userPermissions?.is_superuser || false;
  }, [userPermissions]);

  const canSeeAccountBalance = useMemo(() => {
    return userPermissions?.is_superuser || false;
  }, [userPermissions]);

  /**
   * Calculate unpaid balance for a sale
   */
  const calculateUnpaidBalanceForSale = (saleData: ISaleDetailResponse): number => {
    return saleData.balance_due ?? saleData.total_amount;
  };

  /**
   * Calculate unpaid total
   */
  const calculateUnpaidTotal = (): number => {
    if (!sale) return 0;
    return sale.balance_due ?? sale.total_amount;
  };

  /**
   * Calculate selected items total
   */
  const calculateSelectedItemsTotal = (): number => {
    if (!sale) return 0;
    if (selectAllItems || selectedItems.length === 0) {
      return calculateUnpaidTotal();
    }

    return selectedItems.reduce((sum, selection) => {
      const item = sale.items.find((i) => i.id === selection.itemId);
      if (!item) return sum;

      const unitPrice = Number(item.unit_price);
      return sum + unitPrice * selection.quantity;
    }, 0);
  };

  /**
   * Separate paid and unpaid items
   */
  const { paidItems, unpaidItems } = useMemo(() => {
    if (!sale) return { paidItems: [], unpaidItems: [] };

    // For now, all items are unpaid (we'll enhance this when we add payment history)
    // In future: check each item against payment history to determine paid quantities
    return {
      paidItems: [] as ISaleItemDetail[],
      unpaidItems: sale.items,
    };
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

    // Auto-select appropriate account
    if (method === PaymentMethod.POS && posAccount?.id) {
      setSelectedAccountId(posAccount.id);
    } else if (method === PaymentMethod.CARD_TRANSFER && bankAccounts.length > 0) {
      setSelectedAccountId(bankAccounts[0].id);
    } else if (method === PaymentMethod.CASH) {
      setSelectedAccountId(null);
    }
  };

  const handleItemQuantityChange = (itemId: number, quantity: number) => {
    setSelectAllItems(false);

    if (quantity === 0) {
      // Remove item
      setSelectedItems((prev) => prev.filter((s) => s.itemId !== itemId));
    } else {
      setSelectedItems((prev) => {
        const existing = prev.find((s) => s.itemId === itemId);
        if (existing) {
          return prev.map((s) =>
            s.itemId === itemId ? { ...s, quantity } : s
          );
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

      // Build selected item IDs (for partial payment)
      const selectedItemIds = selectAllItems
        ? []
        : selectedItems.map((s) => s.itemId);

      const payment: IAddPaymentInput = {
        method: paymentMethod,
        amount_applied: parseFloat(amount),
        tip_amount: parseFloat(tipAmount) || 0,
        destination_account_id: selectedAccountId,
        selected_item_ids: selectedItemIds,
      };

      // Add tax if specified
      const taxVal = parseFloat(taxValue);
      if (taxVal > 0) {
        payment.tax = {
          type: taxType,
          value: taxVal,
        };
      }

      // Add discount if specified
      const discountVal = parseFloat(discountValue);
      if (discountVal > 0) {
        payment.discount = {
          type: discountType,
          value: discountVal,
        };
      }

      const response = await addPaymentsToSale(saleId, {
        payments: [payment],
      });

      showToast(UI_TEXT.MSG_PAYMENT_SUCCESS, 'success');

      if (response.was_auto_closed) {
        showToast(UI_TEXT.MSG_SALE_AUTO_CLOSED, 'info');
      }

      // Redirect after success
      setTimeout(() => {
        router.push('/sale/dashboard');
      }, 1500);
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
    return <LoadingOverlay message="در حال بارگذاری اطلاعات فروش..." />;
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
        <div className="text-center">
          <div className="text-4xl mb-4" style={{ color: THEME_COLORS.red }}>⚠️</div>
          <p style={{ color: THEME_COLORS.text }}>فروش یافت نشد</p>
          <button
            onClick={() => router.push('/sale/dashboard')}
            className="mt-4 px-6 py-2 rounded-lg font-bold"
            style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
          >
            بازگشت به داشبورد
          </button>
        </div>
      </div>
    );
  }

  const selectedTotal = calculateSelectedItemsTotal();

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header
        className="p-4 border-b"
        style={{
          backgroundColor: THEME_COLORS.bgSecondary,
          borderColor: THEME_COLORS.border,
        }}
      >
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90 border-2"
              style={{
                backgroundColor: 'transparent',
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.subtext,
              }}
            >
              ← بازگشت
            </button>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: THEME_COLORS.text }}>
              {UI_TEXT.PAYMENT_PAGE_TITLE} #{saleId}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Sale Info Card */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: THEME_COLORS.surface }}
            >
              <h2 className="text-lg font-bold mb-3" style={{ color: THEME_COLORS.text }}>
                اطلاعات فروش
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div style={{ color: THEME_COLORS.subtext }}>مجموع:</div>
                  <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                    {formatPersianMoney(sale.total_amount / 1000)}
                  </div>
                </div>
                <div>
                  <div style={{ color: THEME_COLORS.subtext }}>پرداخت شده:</div>
                  <div className="font-bold" style={{ color: THEME_COLORS.green }}>
                    {formatPersianMoney((sale.total_paid || 0) / 1000)}
                  </div>
                </div>
                <div>
                  <div style={{ color: THEME_COLORS.subtext }}>مانده:</div>
                  <div className="font-bold" style={{ color: THEME_COLORS.orange }}>
                    {formatPersianMoney((sale.balance_due ?? sale.total_amount) / 1000)}
                  </div>
                </div>
                <div>
                  <div style={{ color: THEME_COLORS.subtext }}>وضعیت:</div>
                  <div className="font-bold" style={{ color: THEME_COLORS.cyan }}>
                    {sale.payment_status === 'PAID' ? 'پرداخت شده' :
                     sale.payment_status === 'PARTIALLY_PAID' ? 'پرداخت جزئی' : 'پرداخت نشد

ه'}
                  </div>
                </div>
              </div>
            </div>

            {/* Item Selection */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: THEME_COLORS.surface }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
                  {UI_TEXT.LABEL_SELECT_ITEMS}
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAllItems}
                    onChange={handleSelectAllToggle}
                    className="w-5 h-5"
                  />
                  <span style={{ color: THEME_COLORS.text }}>{UI_TEXT.LABEL_ALL_ITEMS}</span>
                </label>
              </div>

              {/* Unpaid Items */}
              {unpaidItems.length > 0 && (
                <div className="space-y-2 mb-3">
                  <div className="text-sm font-bold" style={{ color: THEME_COLORS.accent }}>
                    اقلام پرداخت نشده:
                  </div>
                  {unpaidItems.map((item) => {
                    const selection = selectedItems.find((s) => s.itemId === item.id);
                    const selectedQty = selection?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: selectAllItems || selectedQty > 0
                            ? THEME_COLORS.hover
                            : THEME_COLORS.bgSecondary,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div style={{ color: THEME_COLORS.text }}>{item.product_name}</div>
                            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                              موجود: {item.quantity} × {formatPersianMoney(item.unit_price / 1000)}
                            </div>
                          </div>
                          <div className="font-bold" style={{ color: THEME_COLORS.accent }}>
                            {formatPersianMoney(item.total / 1000)}
                          </div>
                        </div>

                        {!selectAllItems && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm" style={{ color: THEME_COLORS.text }}>
                              تعداد برای پرداخت:
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={selectedQty}
                              onChange={(e) =>
                                handleItemQuantityChange(item.id, parseInt(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 rounded border text-center"
                              style={{
                                backgroundColor: THEME_COLORS.bgPrimary,
                                borderColor: THEME_COLORS.border,
                                color: THEME_COLORS.text,
                              }}
                            />
                            <span className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                              از {item.quantity}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paid Items (if any) */}
              {paidItems.length > 0 && (
                <div className="space-y-2 pt-3 border-t" style={{ borderColor: THEME_COLORS.border }}>
                  <div className="text-sm font-bold" style={{ color: THEME_COLORS.green }}>
                    اقلام پرداخت شده:
                  </div>
                  {paidItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg opacity-60"
                      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div style={{ color: THEME_COLORS.text }}>{item.product_name}</div>
                          <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                            تعداد: {item.quantity} × {formatPersianMoney(item.unit_price / 1000)}
                          </div>
                        </div>
                        <div className="font-bold" style={{ color: THEME_COLORS.green }}>
                          ✓ پرداخت شده
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t" style={{ borderColor: THEME_COLORS.border }}>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: THEME_COLORS.text }}>
                    جمع انتخاب شده:
                  </span>
                  <span className="text-xl font-bold" style={{ color: THEME_COLORS.accent }}>
                    {formatPersianMoney(selectedTotal / 1000)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: THEME_COLORS.surface }}
            >
              <h2 className="text-lg font-bold mb-3" style={{ color: THEME_COLORS.text }}>
                {UI_TEXT.LABEL_PAYMENT_METHOD}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: PaymentMethod.CARD_TRANSFER, label: UI_TEXT.PAYMENT_METHOD_CARD_TRANSFER },
                  { value: PaymentMethod.POS, label: UI_TEXT.PAYMENT_METHOD_POS },
                  { value: PaymentMethod.CASH, label: UI_TEXT.PAYMENT_METHOD_CASH },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => handlePaymentMethodChange(method.value)}
                    className="p-3 rounded-lg font-bold transition-all border-2"
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

            {/* Bank Account Selection (if not cash) */}
            {paymentMethod !== PaymentMethod.CASH && (
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <h2 className="text-lg font-bold mb-3" style={{ color: THEME_COLORS.text }}>
                  {UI_TEXT.LABEL_SELECT_ACCOUNT}
                  {paymentMethod === PaymentMethod.POS && posAccount?.id && (
                    <span className="text-sm font-normal mr-2" style={{ color: THEME_COLORS.green }}>
                      (حساب پایانه خودکار انتخاب شد)
                    </span>
                  )}
                </h2>

                <input
                  type="text"
                  value={accountSearchQuery}
                  onChange={(e) => setAccountSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس شماره کارت یا نام صاحب حساب..."
                  className="w-full px-4 py-2 rounded-lg mb-3 border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: THEME_COLORS.bgSecondary,
                    borderColor: THEME_COLORS.border,
                    color: THEME_COLORS.text,
                  }}
                />

                {loadingAccounts ? (
                  <div className="text-center py-4" style={{ color: THEME_COLORS.subtext }}>
                    در حال بارگذاری...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredBankAccounts.map((account) => (
                      <label
                        key={account.id}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:opacity-90 transition-all"
                        style={{
                          backgroundColor: selectedAccountId === account.id
                            ? THEME_COLORS.hover
                            : THEME_COLORS.bgSecondary,
                        }}
                      >
                        <input
                          type="radio"
                          name="account"
                          checked={selectedAccountId === account.id}
                          onChange={() => setSelectedAccountId(account.id)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <div style={{ color: THEME_COLORS.text }}>{account.account_owner}</div>
                          <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                            {account.card_number}
                            {account.bank_name && ` • ${account.bank_name}`}
                          </div>
                        </div>
                        {canSeeAccountBalance && (
                          <div className="font-bold" style={{ color: THEME_COLORS.accent }}>
                            {formatPersianMoney(parseFloat(account.account_balance) / 1000)}
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Amount and Tip */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: THEME_COLORS.surface }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-2" style={{ color: THEME_COLORS.text }}>
                    {UI_TEXT.LABEL_AMOUNT} *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="مبلغ پرداخت"
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: THEME_COLORS.bgSecondary,
                      borderColor: THEME_COLORS.border,
                      color: THEME_COLORS.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2" style={{ color: THEME_COLORS.text }}>
                    {UI_TEXT.LABEL_TIP}
                  </label>
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="انعام (اختیاری)"
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: THEME_COLORS.bgSecondary,
                      borderColor: THEME_COLORS.border,
                      color: THEME_COLORS.text,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tax and Discount (if has permission) */}
            {canEditTaxDiscount && (
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <h2 className="text-lg font-bold mb-3" style={{ color: THEME_COLORS.text }}>
                  {UI_TEXT.LABEL_TAX_DISCOUNT}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* Tax */}
                  <div>
                    <label className="block font-bold mb-2 text-sm" style={{ color: THEME_COLORS.text }}>
                      مالیات
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setTaxType(TaxDiscountType.FIXED)}
                        className="flex-1 py-2 rounded-lg text-sm font-bold border-2"
                        style={{
                          backgroundColor: taxType === TaxDiscountType.FIXED ? THEME_COLORS.accent : 'transparent',
                          borderColor: taxType === TaxDiscountType.FIXED ? THEME_COLORS.accent : THEME_COLORS.border,
                          color: taxType === TaxDiscountType.FIXED ? '#fff' : THEME_COLORS.text,
                        }}
                      >
                        {UI_TEXT.LABEL_FIXED_AMOUNT}
                      </button>
                      <button
                        onClick={() => setTaxType(TaxDiscountType.PERCENTAGE)}
                        className="flex-1 py-2 rounded-lg text-sm font-bold border-2"
                        style={{
                          backgroundColor: taxType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.accent : 'transparent',
                          borderColor: taxType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.accent : THEME_COLORS.border,
                          color: taxType === TaxDiscountType.PERCENTAGE ? '#fff' : THEME_COLORS.text,
                        }}
                      >
                        {UI_TEXT.LABEL_PERCENTAGE}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={taxValue}
                      onChange={(e) => setTaxValue(e.target.value)}
                      placeholder={taxType === TaxDiscountType.PERCENTAGE ? "درصد" : "مبلغ"}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: THEME_COLORS.bgSecondary,
                        borderColor: THEME_COLORS.border,
                        color: THEME_COLORS.text,
                      }}
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block font-bold mb-2 text-sm" style={{ color: THEME_COLORS.text }}>
                      تخفیف
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setDiscountType(TaxDiscountType.FIXED)}
                        className="flex-1 py-2 rounded-lg text-sm font-bold border-2"
                        style={{
                          backgroundColor: discountType === TaxDiscountType.FIXED ? THEME_COLORS.accent : 'transparent',
                          borderColor: discountType === TaxDiscountType.FIXED ? THEME_COLORS.accent : THEME_COLORS.border,
                          color: discountType === TaxDiscountType.FIXED ? '#fff' : THEME_COLORS.text,
                        }}
                      >
                        {UI_TEXT.LABEL_FIXED_AMOUNT}
                      </button>
                      <button
                        onClick={() => setDiscountType(TaxDiscountType.PERCENTAGE)}
                        className="flex-1 py-2 rounded-lg text-sm font-bold border-2"
                        style={{
                          backgroundColor: discountType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.accent : 'transparent',
                          borderColor: discountType === TaxDiscountType.PERCENTAGE ? THEME_COLORS.accent : THEME_COLORS.border,
                          color: discountType === TaxDiscountType.PERCENTAGE ? '#fff' : THEME_COLORS.text,
                        }}
                      >
                        {UI_TEXT.LABEL_PERCENTAGE}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === TaxDiscountType.PERCENTAGE ? "درصد" : "مبلغ"}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: THEME_COLORS.bgSecondary,
                        borderColor: THEME_COLORS.border,
                        color: THEME_COLORS.text,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitPayment}
              disabled={submitting}
              className="w-full py-4 rounded-lg font-bold text-xl transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: THEME_COLORS.green,
                color: '#fff',
              }}
            >
              {submitting ? 'در حال ثبت...' : UI_TEXT.BTN_SUBMIT_PAYMENT}
            </button>
          </div>

          {/* Right Column - Payment History */}
          <div className="lg:col-span-1">
            <div
              className="p-4 rounded-lg sticky top-4"
              style={{ backgroundColor: THEME_COLORS.surface }}
            >
              <h2 className="text-lg font-bold mb-3" style={{ color: THEME_COLORS.text }}>
                {UI_TEXT.LABEL_PAYMENT_HISTORY}
              </h2>

              {/* Placeholder for payment history */}
              <div className="text-center py-8" style={{ color: THEME_COLORS.subtext }}>
                پرداخت قبلی وجود ندارد
              </div>
            </div>
          </div>
        </div>
      </div>

      {submitting && <LoadingOverlay message="در حال ثبت پرداخت..." />}
      <ToastContainer />
    </div>
  );
}
