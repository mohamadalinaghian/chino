/**
 * Payment Page Hook
 * Main hook that combines all payment functionality
 *
 * Architecture:
 * - usePaymentData: Handles data loading (sale, accounts)
 * - usePaymentInput: Manages input state (method, amount, calculator)
 * - usePaymentValidation: Validates form state
 * - usePaymentActions: Handles submit/void operations
 */

import { useCallback } from 'react';
import { usePaymentData } from './usePaymentData';
import { usePaymentInput } from './usePaymentInput';
import { usePaymentValidation } from './usePaymentValidation';
import { usePaymentActions } from './usePaymentActions';
import { UsePaymentPageOptions, UsePaymentPageReturn } from './types';

// Re-export types for convenience
export * from './types';

/**
 * Main payment page hook
 * Combines data loading, input management, validation, and actions
 */
export function usePaymentPage({
  saleId,
  onSuccess,
  onError,
}: UsePaymentPageOptions): UsePaymentPageReturn {
  // ══════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ══════════════════════════════════════════════════════════════════════

  const {
    loading,
    sale,
    bankAccounts,
    posAccount,
    snapshot,
    payments,
    isViewOnly,
    loadSaleData,
  } = usePaymentData({
    saleId,
    onError,
  });

  // ══════════════════════════════════════════════════════════════════════
  // INPUT STATE
  // ══════════════════════════════════════════════════════════════════════

  const {
    paymentMethod,
    selectedAccountId,
    inputAmount,
    tipAmount,
    calculatorExpression,
    showBreakdown,
    parsedAmount,
    parsedTip,
    totalPaymentAmount,
    quickAmounts,
    setPaymentMethod,
    setSelectedAccountId,
    setInputAmount,
    setTipAmount,
    setCalculatorExpression,
    applyCalculatorResult,
    setAmountToRemaining,
    setShowBreakdown,
    resetInputs,
  } = usePaymentInput({
    snapshot,
    bankAccounts,
    posAccount,
    initialAmount: snapshot?.remainingDue,
  });

  // ══════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ══════════════════════════════════════════════════════════════════════

  const { validationError, isValid } = usePaymentValidation({
    snapshot,
    parsedAmount,
    paymentMethod,
    selectedAccountId,
  });

  // ══════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════════════════════════════

  const handlePaymentComplete = useCallback((balanceDue: number) => {
    // Reset inputs after successful payment
    resetInputs();

    // Set new remaining as default amount
    if (balanceDue > 0) {
      setInputAmount(Math.floor(balanceDue).toString());
    }
  }, [resetInputs, setInputAmount]);

  const {
    submitting,
    voidingPaymentId,
    handleSubmitPayment,
    handleVoidPayment,
  } = usePaymentActions({
    saleId,
    sale,
    paymentMethod,
    parsedAmount,
    parsedTip,
    selectedAccountId,
    isValid,
    onSuccess,
    onError,
    onPaymentComplete: handlePaymentComplete,
    loadSaleData,
  });

  // ══════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════

  return {
    // Loading states
    loading,
    submitting,
    voidingPaymentId,

    // Core data
    sale,
    snapshot,
    payments,
    bankAccounts,
    posAccount,

    // UI state
    showBreakdown,
    setShowBreakdown,
    isViewOnly,

    // Payment input
    paymentMethod,
    selectedAccountId,
    inputAmount,
    tipAmount,
    calculatorExpression,
    parsedAmount,
    parsedTip,
    totalPaymentAmount,

    // Setters
    setPaymentMethod,
    setSelectedAccountId,
    setInputAmount,
    setTipAmount,
    setCalculatorExpression,
    applyCalculatorResult,
    setAmountToRemaining,

    // Validation
    validationError,
    isValid,

    // Quick amounts
    quickAmounts,

    // Actions
    handleSubmitPayment,
    handleVoidPayment,
    loadSaleData,
  };
}
