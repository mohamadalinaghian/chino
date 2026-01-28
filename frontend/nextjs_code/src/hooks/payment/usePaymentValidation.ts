/**
 * Payment Validation Hook
 * Handles payment form validation
 */

import { useMemo } from 'react';
import { PaymentMethod } from '@/types/sale';
import { PaymentSnapshot } from './types';

interface UsePaymentValidationOptions {
  snapshot: PaymentSnapshot | null;
  parsedAmount: number;
  paymentMethod: PaymentMethod;
  selectedAccountId: number | null;
}

interface UsePaymentValidationReturn {
  validationError: string | null;
  isValid: boolean;
}

/**
 * Hook for validating payment form state
 */
export function usePaymentValidation({
  snapshot,
  parsedAmount,
  paymentMethod,
  selectedAccountId,
}: UsePaymentValidationOptions): UsePaymentValidationReturn {
  const validationError = useMemo((): string | null => {
    // Loading state
    if (!snapshot) return 'در حال بارگذاری...';

    // Sale already paid
    if (snapshot.isFullyPaid) return 'این فروش کاملاً تسویه شده است';

    // Sale canceled
    if (snapshot.saleState === 'CANCELED') return 'این فروش لغو شده است';

    // Amount validation
    if (parsedAmount <= 0) return 'مبلغ باید بزرگتر از صفر باشد';

    // Account validation for non-cash methods
    if (paymentMethod !== PaymentMethod.CASH && !selectedAccountId) {
      return paymentMethod === PaymentMethod.POS
        ? 'کارتخوان تنظیم نشده است'
        : 'لطفاً حساب مقصد را انتخاب کنید';
    }

    return null;
  }, [snapshot, parsedAmount, paymentMethod, selectedAccountId]);

  const isValid = validationError === null;

  return {
    validationError,
    isValid,
  };
}
