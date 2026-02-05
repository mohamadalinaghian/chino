// hooks/payment/validation/usePaymentValidation.ts

import { useMemo } from 'react';
import { PaymentSplit } from '@/hooks/payment/splits/types';
import { validatePaymentSplits } from './validateSplits';
import { PaymentValidationResult } from './types';

export function usePaymentValidation(
  splits: PaymentSplit[],
  finalTotal: number,
): PaymentValidationResult {
  return useMemo(
    () => validatePaymentSplits(splits, finalTotal),
    [splits, finalTotal],
  );
}
