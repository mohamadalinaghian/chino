import { useMemo } from 'react';
import type {
  Money,
  PaymentSplit,
  PaymentValidationResult,
} from '@/types/payment/domain';

/**
 * ─────────────────────────────────────────────────────────────
 * usePaymentValidation
 * ─────────────────────────────────────────────────────────────
 * Evaluates payment splits and produces a validation report.
 *
 * Key property:
 * - Supports partial validity (some splits valid, others not)
 *
 * This hook does NOT:
 * - Submit
 * - Mutate
 * - Auto-fix values
 * ─────────────────────────────────────────────────────────────
 */
export function usePaymentValidation(
  splits: PaymentSplit[],
  expectedTotal: Money,
) {
  return useMemo<PaymentValidationResult>(() => {
    const errorsBySplit = new Map<string, string[]>();

    let sum = 0;

    for (const split of splits) {
      const errors: string[] = [];

      if (split.amount <= 0) {
        errors.push('Amount must be greater than zero.');
      }

      if (!Number.isInteger(split.amount)) {
        errors.push('Amount must be an integer.');
      }

      if (errors.length > 0) {
        errorsBySplit.set(split.id, errors);
      }

      sum += split.amount;
    }

    const blockingErrors: string[] = [];

    if (sum !== expectedTotal) {
      blockingErrors.push(
        'Total of payments does not match selected items total.',
      );
    }

    /**
     * A split is submittable if:
     * - it has no local errors
     * - amount > 0
     */
    const submittableSplitIds = splits
      .filter(
        s =>
          s.amount > 0 &&
          !errorsBySplit.has(s.id),
      )
      .map(s => s.id);

    return {
      isFullyValid:
        errorsBySplit.size === 0 &&
        blockingErrors.length === 0,

      blockingErrors,
      errorsBySplit,
      submittableSplitIds,
    };
  }, [splits, expectedTotal]);
}
