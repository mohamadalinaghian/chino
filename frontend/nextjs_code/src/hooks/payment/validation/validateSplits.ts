// hooks/payment/validation/validateSplits.ts

import { PaymentSplit } from '@/hooks/payment/splits/types';
import { PaymentValidationResult } from './types';

export function validatePaymentSplits(
  splits: PaymentSplit[],
  finalTotal: number,
): PaymentValidationResult {
  const results = [];
  let validSum = 0;

  for (const split of splits) {
    if (split.meta?.submitted) {
      continue; // already paid, ignore forever
    }

    if (split.amount <= 0) {
      results.push({
        splitId: split.id,
        valid: false,
        error: 'مبلغ نامعتبر است',
      });
      continue;
    }

    if (!split.method) {
      results.push({
        splitId: split.id,
        valid: false,
        error: 'روش پرداخت انتخاب نشده',
      });
      continue;
    }

    validSum += split.amount;
    results.push({
      splitId: split.id,
      valid: true,
    });
  }

  if (results.every(r => !r.valid)) {
    return {
      isBlocking: true,
      blockingReason: 'هیچ پرداخت معتبری وجود ندارد',
      splitResults: results,
      submittableSplitIds: [],
    };
  }

  if (Math.abs(validSum - finalTotal) > 1) {
    return {
      isBlocking: true,
      blockingReason: 'مجموع پرداخت‌ها با مبلغ نهایی برابر نیست',
      splitResults: results,
      submittableSplitIds: results
        .filter(r => r.valid)
        .map(r => r.splitId),
    };
  }

  return {
    isBlocking: false,
    splitResults: results,
    submittableSplitIds: results
      .filter(r => r.valid)
      .map(r => r.splitId),
  };
}
