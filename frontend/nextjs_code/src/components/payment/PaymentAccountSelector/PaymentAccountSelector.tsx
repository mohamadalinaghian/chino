'use client';

import { THEME_COLORS } from '@/libs/constants';
import { PaymentMethod, IBankAccount } from '@/types/sale';
import { IPOSAccount } from '@/hooks/usePayment';

interface PaymentAccountSelectorProps {
  paymentMethod: PaymentMethod;
  bankAccounts: IBankAccount[];
  posAccount: IPOSAccount | null;
  selectedAccountId: number | null;
  onAccountSelect: (accountId: number) => void;
}

export function PaymentAccountSelector({
  paymentMethod,
  bankAccounts,
  posAccount,
  selectedAccountId,
  onAccountSelect,
}: PaymentAccountSelectorProps) {
  if (paymentMethod === PaymentMethod.CASH) {
    return null;
  }

  return (
    <div>
      <div className="text-sm font-bold mb-2" style={{ color: THEME_COLORS.text }}>
        {paymentMethod === PaymentMethod.POS ? 'کارتخوان' : 'حساب مقصد'}
      </div>
      {paymentMethod === PaymentMethod.POS && posAccount?.id ? (
        <div
          className="p-3 rounded border"
          style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.green }}
        >
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
                onChange={() => onAccountSelect(account.id)}
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
  );
}
