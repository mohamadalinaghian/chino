// hooks/payment/submission/submitSplits.ts

import { PaymentSplit } from '@/hooks/payment/splits/types';
import { submitPayment } from './api';
import { SubmissionResult } from './types';

export async function submitSplits(
  saleId: number,
  splits: PaymentSplit[],
  allowedSplitIds: string[],
): Promise<SubmissionResult[]> {
  const results: SubmissionResult[] = [];

  for (const split of splits) {
    if (
      split.meta?.submitted ||
      !allowedSplitIds.includes(split.id)
    ) {
      continue;
    }

    try {
      await submitPayment({
        saleId,
        amount: split.amount,
        method: split.method!,
      });

      results.push({
        splitId: split.id,
        success: true,
      });
    } catch (e: any) {
      results.push({
        splitId: split.id,
        success: false,
        error: e.message,
      });
    }
  }

  return results;
}
