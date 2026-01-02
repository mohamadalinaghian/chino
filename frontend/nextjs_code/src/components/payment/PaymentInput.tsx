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
import type { PaymentInputSchema, PaymentMethod } from '@/types/saleType';

interface Props {
  payments: PaymentInputSchema[];
  onChange: (payments: PaymentInputSchema[]) => void;
  totalDue: number;
}

const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] =
  [
    { value: 'CASH', label: 'نقدی', icon: '💵' },
    { value: 'POS', label: 'کارتخوان', icon: '💳' },
    { value: 'CARD_TRANSFER', label: 'کارت به کارت', icon: '🏦' },
  ];

export function PaymentInput({ payments, onChange, totalDue }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
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
                      {parseFloat(payment.amount_applied).toLocaleString(
                        'fa-IR'
                      )}{' '}
                      تومان
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
            {totalDue.toLocaleString('fa-IR')} تومان
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">پرداخت شده:</span>
          <span className="font-bold text-green-400">
            {totalPaid.toLocaleString('fa-IR')} تومان
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
            {Math.abs(remaining).toLocaleString('fa-IR')} تومان
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
            {remaining > 0 && (
              <button
                onClick={() =>
                  setNewPayment({
                    ...newPayment,
                    amount_applied: remaining.toString(),
                  })
                }
                className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
              >
                پرداخت کل باقی‌مانده ({remaining.toLocaleString('fa-IR')} تومان)
              </button>
            )}
          </div>

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
