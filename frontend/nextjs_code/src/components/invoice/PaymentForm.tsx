/**
 * Payment Form Component
 * Form for processing payments with method selection, item selection, etc.
 */

import { formatPersianMoney } from '@/libs/tools/persianMoney';
import { PaymentMethod } from '@/types/invoiceType';
import { SaleDetailResponse } from '@/types/saleType';

interface BankAccount {
  id: number;
  bank_name: string;
  card_number: string;
  account_owner: string;
  account_balance: string;
}

interface Props {
  // Payment data
  paymentMethod: PaymentMethod;
  amount: string;
  tipAmount: string;
  selectedAccountId: number | null;
  selectedItems: number[];

  // Available data
  bankAccounts: BankAccount[];
  sale: SaleDetailResponse | null;

  // State setters
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onAmountChange: (amount: string) => void;
  onTipAmountChange: (amount: string) => void;
  onAccountSelect: (accountId: number) => void;
  onItemToggle: (itemId: number) => void;
  onCalculateItemsAmount: () => void;

  // Actions
  onSubmit: () => void;
  onCancel: () => void;

  // UI state
  processing: boolean;
}

export function PaymentForm({
  paymentMethod,
  amount,
  tipAmount,
  selectedAccountId,
  selectedItems,
  bankAccounts,
  sale,
  onPaymentMethodChange,
  onAmountChange,
  onTipAmountChange,
  onAccountSelect,
  onItemToggle,
  onCalculateItemsAmount,
  onSubmit,
  onCancel,
  processing,
}: Props) {
  const calculateSelectedItemsTotal = (): number => {
    if (!sale || selectedItems.length === 0) return 0;

    return sale.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => {
        const itemTotal = parseFloat(item.unit_price) * item.quantity;
        const extrasTotal = item.extras.reduce((sum, extra) =>
          sum + (parseFloat(extra.unit_price) * extra.quantity), 0
        );
        return total + itemTotal + extrasTotal;
      }, 0);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-indigo-500 space-y-3">
      <h3 className="text-sm font-bold mb-2">💳 ثبت پرداخت</h3>

      {/* Payment Method */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">روش پرداخت</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onPaymentMethodChange(PaymentMethod.CASH)}
            className={`py-2 px-3 text-xs rounded-lg font-medium border transition-all ${
              paymentMethod === PaymentMethod.CASH
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            💵 نقد
          </button>
          <button
            onClick={() => onPaymentMethodChange(PaymentMethod.POS)}
            className={`py-2 px-3 text-xs rounded-lg font-medium border transition-all ${
              paymentMethod === PaymentMethod.POS
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            💳 کارتخوان
          </button>
          <button
            onClick={() => onPaymentMethodChange(PaymentMethod.CARD_TRANSFER)}
            className={`py-2 px-3 text-xs rounded-lg font-medium border transition-all ${
              paymentMethod === PaymentMethod.CARD_TRANSFER
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            📱 کارت‌به‌کارت
          </button>
        </div>
      </div>

      {/* Account Selection for Card Transfer */}
      {paymentMethod === PaymentMethod.CARD_TRANSFER && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">حساب مقصد</label>
          <select
            value={selectedAccountId || ''}
            onChange={(e) => onAccountSelect(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            required
          >
            <option value="">انتخاب حساب...</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_owner} - {formatPersianMoney(parseFloat(account.account_balance))} ({account.card_number.slice(-4)})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">حساب‌های بدهکار در ابتدا + کارمندان</p>
        </div>
      )}

      {/* Item Selection for Split Payments */}
      <div className="bg-gray-750 rounded-lg p-3 border border-gray-600">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-medium text-gray-400">
            🧾 انتخاب اقلام
          </label>
          {selectedItems.length > 0 && (
            <button
              onClick={onCalculateItemsAmount}
              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-medium text-white"
            >
              محاسبه ({selectedItems.length})
            </button>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {sale?.items.map((item) => {
            const itemTotal = parseFloat(item.unit_price) * item.quantity;
            const extrasTotal = item.extras.reduce((sum, extra) =>
              sum + (parseFloat(extra.unit_price) * extra.quantity), 0
            );
            const totalPrice = itemTotal + extrasTotal;
            const isSelected = selectedItems.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => onItemToggle(item.id)}
                className={`p-2 rounded-md border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-gray-500'
                  }`}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-white">{item.product_name}</p>
                        <p className="text-xs text-gray-400">×{item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold text-green-400">
                        {formatPersianMoney(totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {selectedItems.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600 flex justify-between items-center">
            <span className="text-xs text-gray-400">جمع:</span>
            <span className="text-sm font-bold text-indigo-400">
              {formatPersianMoney(calculateSelectedItemsTotal())}
            </span>
          </div>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">مبلغ پرداختی (تومان)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-bold focus:border-indigo-500 focus:outline-none"
          placeholder="0"
          min="0"
          step="1000"
        />
      </div>

      {/* Tip Amount */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">انعام (اختیاری)</label>
        <input
          type="number"
          value={tipAmount}
          onChange={(e) => onTipAmountChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-bold focus:border-green-500 focus:outline-none"
          placeholder="0"
          min="0"
          step="1000"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium"
        >
          انصراف
        </button>
        <button
          onClick={onSubmit}
          disabled={processing || !amount || parseFloat(amount) <= 0}
          className="flex-1 py-2 px-4 text-sm rounded-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-lg flex items-center justify-center gap-1"
        >
          {processing ? (
            <>⏳ در حال ثبت...</>
          ) : (
            <>✓ ثبت</>
          )}
        </button>
      </div>
    </div>
  );
}
