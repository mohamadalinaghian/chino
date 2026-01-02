/**
 * Payment Input Component
 *
 * Single Responsibility: Allow users to add and manage payment entries
 *
 * Features:
 * - Select payment method (CASH, POS, CARD_TRANSFER)
 * - Enter payment amount
 * - Optional tip amount
 * - Optional destination account (for POS/CARD_TRANSFER)
 * - Add/remove multiple payments
 * - Mobile responsive
 */

'use client';

import { useState } from 'react';
import { formatPersianMoney } from '@/libs/tools/persianMoney';
import type { PaymentInputSchema, PaymentMethod } from '@/types/saleType';

interface Props {
  payments: PaymentInputSchema[];
  onChange: (payments: PaymentInputSchema[]) => void;
  totalDue: number;
  saleItems?: Array<{id: number; product_name: string; quantity: number; unit_price: string}>;
  bankAccounts?: Array<{id: number; bank_name: string; card_number: string}>;
}

const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] =
  [
    { value: 'CASH', label: 'نقدی', icon: '💵' },
    { value: 'POS', label: 'کارتخوان', icon: '💳' },
    { value: 'CARD_TRANSFER', label: 'کارت به کارت', icon: '🏦' },
  ];

export function PaymentInput({ payments, onChange, totalDue, saleItems, bankAccounts }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [newPayment, setNewPayment] = useState<PaymentInputSchema>({
    method: 'CASH',
    amount_applied: '',
    tip_amount: '0',
    destination_account_id: null,
  });

  /**
   * Handle add payment
   */
  const handleAddPayment = () => {
    if (!newPayment.amount_applied || parseFloat(newPayment.amount_applied) <= 0) {
      return;
    }

    // Validate bank account for card transfer/POS
    if ((newPayment.method === 'CARD_TRANSFER' || newPayment.method === 'POS') && !newPayment.destination_account_id) {
      alert('لطفاً حساب مقصد را انتخاب کنید');
      return;
    }

    onChange([...payments, newPayment]);

    // Reset form
    setNewPayment({
      method: 'CASH',
      amount_applied: '',
      tip_amount: '0',
      destination_account_id: null,
    });
    setShowAddForm(false);
  };

  /**
   * Handle remove payment
   */
  const handleRemovePayment = (index: number) => {
    onChange(payments.filter((_, i) => i !== index));
  };

  /**
   * Get payment method label
   */
  const getPaymentMethodInfo = (method: string) => {
    return (
      paymentMethods.find((pm) => pm.value === method) || paymentMethods[0]
    );
  };

  /**
   * Calculate total paid
   */
  const totalPaid = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount_applied || '0'),
    0
  );

  /**
   * Calculate remaining balance
   */
  const remaining = totalDue - totalPaid;

  /**
   * Calculate selected items total
   */
  const calculateSelectedItemsTotal = () => {
    if (!saleItems || selectedItemIds.length === 0) return 0;
    return saleItems
      .filter(item => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);
  };

  /**
   * Handle quick fill buttons
   */
  const handleQuickFill = (type: 'half' | 'items') => {
    if (type === 'half') {
      setNewPayment({
        ...newPayment,
        amount_applied: (totalDue / 2).toString(),
      });
    } else if (type === 'items') {
      const itemsTotal = calculateSelectedItemsTotal();
      setNewPayment({
        ...newPayment,
        amount_applied: itemsTotal.toString(),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment List */}
      {payments.length > 0 && (
        <div className="space-y-3">
          {payments.map((payment, index) => {
            const methodInfo = getPaymentMethodInfo(payment.method);
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-700 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{methodInfo.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      {methodInfo.label}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatPersianMoney(payment.amount_applied)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePayment(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  حذف
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-700 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">مبلغ کل:</span>
          <span className="font-bold text-gray-200">
            {formatPersianMoney(totalDue)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">پرداخت شده:</span>
          <span className="font-bold text-green-400">
            {formatPersianMoney(totalPaid)}
          </span>
        </div>
        <div className="border-t border-gray-600 pt-2 flex justify-between">
          <span className="text-sm text-gray-400">باقی‌مانده:</span>
          <span
            className={`text-lg font-bold ${
              remaining > 0
                ? 'text-yellow-400'
                : remaining < 0
                ? 'text-red-400'
                : 'text-green-400'
            }`}
          >
            {formatPersianMoney(Math.abs(remaining))}
          </span>
        </div>
      </div>

      {/* Add Payment Form */}
      {showAddForm ? (
        <div className="bg-gray-700 rounded-xl p-4 space-y-4">
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              روش پرداخت
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() =>
                    setNewPayment({ ...newPayment, method: method.value })
                  }
                  className={`
                    py-3 px-2 rounded-xl text-sm font-medium
                    transition-all
                    ${
                      newPayment.method === method.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }
                  `}
                >
                  <div className="text-lg mb-1">{method.icon}</div>
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              مبلغ پرداختی (تومان)
            </label>
            <input
              type="number"
              value={newPayment.amount_applied}
              onChange={(e) =>
                setNewPayment({ ...newPayment, amount_applied: e.target.value })
              }
              placeholder="مبلغ را وارد کنید"
              className="
                w-full px-4 py-3 rounded-xl
                bg-gray-800 border border-gray-600
                text-gray-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500
              "
            />

            {/* Quick Fill Buttons */}
            <div className="mt-2 flex flex-wrap gap-2">
              {remaining > 0 && (
                <button
                  onClick={() =>
                    setNewPayment({
                      ...newPayment,
                      amount_applied: remaining.toString(),
                    })
                  }
                  className="px-3 py-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-400 rounded-lg transition-all"
                >
                  کل باقی‌مانده ({formatPersianMoney(remaining)})
                </button>
              )}
              <button
                onClick={() => handleQuickFill('half')}
                className="px-3 py-1.5 text-xs bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 rounded-lg transition-all"
              >
                نصف مبلغ ({formatPersianMoney(totalDue / 2)})
              </button>
              {saleItems && saleItems.length > 0 && selectedItemIds.length > 0 && (
                <button
                  onClick={() => handleQuickFill('items')}
                  className="px-3 py-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-400 rounded-lg transition-all"
                >
                  آیتم‌های انتخابی ({formatPersianMoney(calculateSelectedItemsTotal())})
                </button>
              )}
            </div>
          </div>

          {/* Item Selection for Split Payment */}
          {saleItems && saleItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                انتخاب آیتم‌ها (اختیاری)
              </label>
              <div className="bg-gray-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                {saleItems.map(item => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`
                        flex items-center gap-3 cursor-pointer p-2.5 rounded-lg transition-all
                        ${isSelected
                          ? 'bg-indigo-600/20 border border-indigo-500/50'
                          : 'hover:bg-gray-700 border border-transparent'
                        }
                      `}
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemIds([...selectedItemIds, item.id]);
                            } else {
                              setSelectedItemIds(selectedItemIds.filter(id => id !== item.id));
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                          ${isSelected
                            ? 'bg-indigo-600 border-indigo-500'
                            : 'bg-gray-700 border-gray-600'
                          }
                        `}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={`flex-1 text-sm ${isSelected ? 'text-indigo-300 font-medium' : 'text-gray-300'}`}>
                        {item.product_name}
                      </span>
                      <span className={`text-xs ${isSelected ? 'text-indigo-400 font-bold' : 'text-gray-400'}`}>
                        {formatPersianMoney(parseFloat(item.unit_price) * item.quantity)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bank Account Selection for Card Transfer */}
          {(newPayment.method === 'CARD_TRANSFER' || newPayment.method === 'POS') && bankAccounts && bankAccounts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                حساب مقصد <span className="text-red-400">*</span>
              </label>
              <select
                value={newPayment.destination_account_id || ''}
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    destination_account_id: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-gray-800 border border-gray-600
                  text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                "
              >
                <option value="">حساب را انتخاب کنید</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} - {account.card_number}
                  </option>
                ))}
              </select>
            </div>
          )}


          {/* Tip Amount (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              انعام (اختیاری)
            </label>
            <input
              type="number"
              value={newPayment.tip_amount}
              onChange={(e) =>
                setNewPayment({ ...newPayment, tip_amount: e.target.value })
              }
              placeholder="0"
              className="
                w-full px-4 py-3 rounded-xl
                bg-gray-800 border border-gray-600
                text-gray-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500
              "
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAddPayment}
              disabled={
                !newPayment.amount_applied ||
                parseFloat(newPayment.amount_applied) <= 0
              }
              className="
                flex-1 py-3 px-4
                bg-green-600 hover:bg-green-700
                disabled:bg-gray-600 disabled:text-gray-400
                text-white font-medium
                rounded-xl
                transition-all
              "
            >
              افزودن پرداخت
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewPayment({
                  method: 'CASH',
                  amount_applied: '',
                  tip_amount: '0',
                  destination_account_id: null,
                });
              }}
              className="
                px-4 py-3
                bg-gray-600 hover:bg-gray-500
                text-gray-200
                rounded-xl
                transition-all
              "
            >
              انصراف
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="
            w-full py-3 px-4
            bg-indigo-600 hover:bg-indigo-700
            text-white font-medium
            rounded-xl
            transition-all
            flex items-center justify-center gap-2
          "
        >
          <span className="text-xl">+</span>
          <span>افزودن پرداخت</span>
        </button>
      )}
    </div>
  );
}
