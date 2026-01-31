/**
 * PaymentSplitPanel Component
 *
 * Displays and manages a single split payment panel.
 * Handles payment method selection, amount input, tax/discount configuration,
 * and bank account selection.
 */

'use client';

import { formatPersianMoney } from '@/utils/persianUtils';
import { Lock, Unlock, Trash2 } from 'lucide-react';
import { PaymentMethod } from '@/types/sale';
import type { SplitPayment, BankAccount, POSAccount } from '@/types/payment';
import { PAYMENT_METHOD_CONFIG } from '@/libs/paymentConstants';
import { calculateSplitTotal } from '@/utils/paymentCalculation';

interface PaymentSplitPanelProps {
  split: SplitPayment;
  index: number;
  bankAccounts: BankAccount[];
  posAccount: POSAccount | null;
  onUpdate: (updates: Partial<SplitPayment>) => void;
  onToggleLock: () => void;
  canDelete: boolean;
  THEME_COLORS: any;
}

export function PaymentSplitPanel({
  split,
  index,
  bankAccounts,
  posAccount,
  onUpdate,
  onToggleLock,
  canDelete,
  THEME_COLORS,
}: PaymentSplitPanelProps) {
  const totalWithTax = calculateSplitTotal(split);

  return (
    <div
      className={`p-5 rounded-2xl border-2 transition-all duration-200 ${split.isLocked ? 'border-green-500/50 bg-green-500/5' : ''
        }`}
      style={{
        backgroundColor: split.isLocked
          ? `${THEME_COLORS.green}10`
          : THEME_COLORS.surface,
        borderColor: split.isLocked ? THEME_COLORS.green : THEME_COLORS.border,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: THEME_COLORS.text }}>
          پرداخت {index + 1}
        </h3>
        <button
          onClick={onToggleLock}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: split.isLocked ? THEME_COLORS.green : THEME_COLORS.subtext }}
          title={split.isLocked ? 'باز کردن قفل' : 'قفل کردن'}
        >
          {split.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.text }}>
          روش پرداخت
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(PaymentMethod).map(method => {
            const config = PAYMENT_METHOD_CONFIG[method];
            const isSelected = split.paymentMethod === method;

            return (
              <button
                key={method}
                onClick={() => onUpdate({ paymentMethod: method })}
                disabled={split.isLocked}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${isSelected
                    ? 'border-current shadow-md'
                    : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  backgroundColor: isSelected ? `${config.color}15` : THEME_COLORS.bgSecondary,
                  color: isSelected ? config.color : THEME_COLORS.text,
                  borderColor: isSelected ? config.color : 'transparent',
                }}
              >
                <div className="text-lg mb-1">{config.icon}</div>
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bank Account Selection (for CARD_TRANSFER) */}
      {split.paymentMethod === PaymentMethod.CARD_TRANSFER && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.text }}>
            حساب مقصد
          </label>
          <select
            value={split.accountId || ''}
            onChange={e => onUpdate({ accountId: Number(e.target.value) || null })}
            disabled={split.isLocked}
            className="w-full px-4 py-2.5 rounded-xl border-2 transition-colors disabled:opacity-50"
            style={{
              backgroundColor: THEME_COLORS.bgSecondary,
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.text,
            }}
          >
            <option value="">انتخاب حساب</option>
            {bankAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.card_number} - {acc.related_user_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.text }}>
          مبلغ (ریال)
        </label>
        <input
          type="number"
          value={split.amount || ''}
          onChange={e => onUpdate({ amount: Number(e.target.value) || 0 })}
          disabled={split.isLocked}
          placeholder="0"
          className="w-full px-4 py-2.5 rounded-xl border-2 transition-colors number-display disabled:opacity-50"
          style={{
            backgroundColor: THEME_COLORS.bgSecondary,
            borderColor: THEME_COLORS.border,
            color: THEME_COLORS.text,
          }}
        />
      </div>

      {/* Tax Configuration */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium" style={{ color: THEME_COLORS.text }}>
            مالیات
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={split.taxEnabled}
              onChange={e => onUpdate({ taxEnabled: e.target.checked })}
              disabled={split.isLocked}
              className="w-4 h-4 rounded cursor-pointer disabled:opacity-50"
            />
            <span className="text-sm" style={{ color: THEME_COLORS.subtext }}>
              فعال
            </span>
          </label>
        </div>

        {split.taxEnabled && (
          <div className="flex gap-2">
            <input
              type="number"
              value={split.taxPercent || ''}
              onChange={e => onUpdate({ taxPercent: Number(e.target.value) || 0 })}
              disabled={split.isLocked}
              placeholder="10"
              max={100}
              min={0}
              className="flex-1 px-4 py-2 rounded-xl border-2 transition-colors number-display disabled:opacity-50"
              style={{
                backgroundColor: THEME_COLORS.bgSecondary,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text,
              }}
            />
            <div
              className="px-4 py-2 rounded-xl border-2 text-sm font-medium"
              style={{
                backgroundColor: THEME_COLORS.bgSecondary,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text,
              }}
            >
              %
            </div>
          </div>
        )}
      </div>

      {/* Discount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.text }}>
          تخفیف (ریال)
        </label>
        <input
          type="number"
          value={split.discount || ''}
          onChange={e => onUpdate({ discount: Number(e.target.value) || 0 })}
          disabled={split.isLocked}
          placeholder="0"
          className="w-full px-4 py-2.5 rounded-xl border-2 transition-colors number-display disabled:opacity-50"
          style={{
            backgroundColor: THEME_COLORS.bgSecondary,
            borderColor: THEME_COLORS.border,
            color: THEME_COLORS.text,
          }}
        />
      </div>

      {/* Tip Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.text }}>
          انعام (ریال)
        </label>
        <input
          type="number"
          value={split.tipAmount || ''}
          onChange={e => onUpdate({ tipAmount: Number(e.target.value) || 0 })}
          disabled={split.isLocked}
          placeholder="0"
          className="w-full px-4 py-2.5 rounded-xl border-2 transition-colors number-display disabled:opacity-50"
          style={{
            backgroundColor: THEME_COLORS.bgSecondary,
            borderColor: THEME_COLORS.border,
            color: THEME_COLORS.text,
          }}
        />
      </div>

      {/* Total Display */}
      <div
        className="p-4 rounded-xl border-2"
        style={{
          backgroundColor: THEME_COLORS.bgSecondary,
          borderColor: THEME_COLORS.border,
        }}
      >
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium" style={{ color: THEME_COLORS.subtext }}>
            جمع با مالیات و انعام:
          </span>
          <span
            className="text-lg font-bold number-display"
            style={{ color: THEME_COLORS.accent }}
          >
            {formatPersianMoney(totalWithTax)}
          </span>
        </div>
      </div>
    </div>
  );
}
