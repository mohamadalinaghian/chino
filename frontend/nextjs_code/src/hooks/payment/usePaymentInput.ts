/**
 * Payment Input State Hook
 * Manages payment method selection, amount input, and calculator
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PaymentMethod, IBankAccount } from '@/types/sale';
import { IPOSAccount, PaymentSnapshot } from './types';

interface UsePaymentInputOptions {
  snapshot: PaymentSnapshot | null;
  bankAccounts: IBankAccount[];
  posAccount: IPOSAccount | null;
  initialAmount?: number;
}

interface UsePaymentInputReturn {
  // State
  paymentMethod: PaymentMethod;
  selectedAccountId: number | null;
  inputAmount: string;
  tipAmount: string;
  calculatorExpression: string;
  showBreakdown: boolean;

  // Computed
  parsedAmount: number;
  parsedTip: number;
  totalPaymentAmount: number;
  quickAmounts: number[];

  // Actions
  setPaymentMethod: (method: PaymentMethod) => void;
  setSelectedAccountId: (id: number | null) => void;
  setInputAmount: (value: string) => void;
  setTipAmount: (value: string) => void;
  setCalculatorExpression: (value: string) => void;
  applyCalculatorResult: () => void;
  setAmountToRemaining: () => void;
  setShowBreakdown: (value: boolean) => void;
  resetInputs: () => void;
}

/**
 * Hook for managing payment input state
 */
export function usePaymentInput({
  snapshot,
  bankAccounts,
  posAccount,
  initialAmount,
}: UsePaymentInputOptions): UsePaymentInputReturn {
  // ── State ─────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('');
  const [calculatorExpression, setCalculatorExpression] = useState<string>('');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // ── Set initial amount when snapshot loads ────────────────────────────
  useEffect(() => {
    if (initialAmount && initialAmount > 0 && inputAmount === '') {
      setInputAmount(Math.floor(initialAmount).toString());
    }
  }, [initialAmount, inputAmount]);

  // ── Auto-select account when method changes ───────────────────────────
  useEffect(() => {
    if (paymentMethod === PaymentMethod.CASH) {
      setSelectedAccountId(null);
    } else if (paymentMethod === PaymentMethod.POS && posAccount?.id) {
      setSelectedAccountId(posAccount.id);
    } else if (paymentMethod === PaymentMethod.CARD_TRANSFER && bankAccounts.length === 1) {
      setSelectedAccountId(bankAccounts[0].id);
    }
  }, [paymentMethod, posAccount, bankAccounts]);

  // ── Computed values ───────────────────────────────────────────────────
  const parsedAmount = useMemo(() => {
    const num = Number(inputAmount.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  }, [inputAmount]);

  const parsedTip = useMemo(() => {
    const num = Number(tipAmount.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  }, [tipAmount]);

  const totalPaymentAmount = parsedAmount + parsedTip;

  // ── Calculator ────────────────────────────────────────────────────────
  const evaluateExpression = useCallback((expr: string): number | null => {
    try {
      // Only allow numbers, +, -, *, /, (, ), and spaces
      const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
      if (!sanitized.trim()) return null;

      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.floor(result);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const handleCalculatorInput = useCallback((value: string) => {
    setCalculatorExpression(value);
    const result = evaluateExpression(value);
    if (result !== null && result > 0) {
      setInputAmount(result.toString());
    }
  }, [evaluateExpression]);

  const applyCalculatorResult = useCallback(() => {
    const result = evaluateExpression(calculatorExpression);
    if (result !== null && result > 0) {
      setInputAmount(result.toString());
      setCalculatorExpression('');
    }
  }, [calculatorExpression, evaluateExpression]);

  // ── Quick actions ─────────────────────────────────────────────────────
  const setAmountToRemaining = useCallback(() => {
    if (snapshot && snapshot.remainingDue > 0) {
      setInputAmount(Math.floor(snapshot.remainingDue).toString());
    }
  }, [snapshot]);

  const resetInputs = useCallback(() => {
    setInputAmount('');
    setTipAmount('');
    setCalculatorExpression('');
  }, []);

  // ── Quick amount buttons ──────────────────────────────────────────────
  const quickAmounts = useMemo(() => {
    const remaining = snapshot?.remainingDue || 0;
    const amounts: number[] = [];

    // Add common round amounts
    [10000, 20000, 50000, 100000, 200000, 500000].forEach(amt => {
      if (amt <= remaining * 1.5) amounts.push(amt);
    });

    // Add half of remaining
    if (remaining > 20000) {
      amounts.push(Math.round(remaining / 2 / 1000) * 1000);
    }

    return Array.from(new Set(amounts)).sort((a, b) => a - b).slice(0, 6);
  }, [snapshot]);

  return {
    // State
    paymentMethod,
    selectedAccountId,
    inputAmount,
    tipAmount,
    calculatorExpression,
    showBreakdown,

    // Computed
    parsedAmount,
    parsedTip,
    totalPaymentAmount,
    quickAmounts,

    // Actions
    setPaymentMethod,
    setSelectedAccountId,
    setInputAmount,
    setTipAmount,
    setCalculatorExpression: handleCalculatorInput,
    applyCalculatorResult,
    setAmountToRemaining,
    setShowBreakdown,
    resetInputs,
  };
}
