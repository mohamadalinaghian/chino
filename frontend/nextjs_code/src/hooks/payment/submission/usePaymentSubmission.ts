// hooks/payment/submission/usePaymentSubmission.ts

import { useState } from 'react';
import { PaymentSplit } from '@/hooks/payment/splits/types';
import { submitSplits } from './submitSplits';

interface Args {
  saleId: number;
  onSplitUpdate: (updater: (s: PaymentSplit[]) => PaymentSplit[]) => void;
}

export function usePaymentSubmission({
  saleId,
  onSplitUpdate,
}: Args) {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (
    splits: PaymentSplit[],
    allowedSplitIds: string[],
  ) => {
    setSubmitting(true);

    const results = await submitSplits(
      saleId,
      splits,
      allowedSplitIds,
    );

    onSplitUpdate(prev =>
      prev.map(split => {
        const result = results.find(
          r => r.splitId === split.id,
        );
        if (!result) return split;

        return result.success
          ? {
              ...split,
              meta: { ...split.meta, submitted: true, error: undefined },
            }
          : {
              ...split,
              meta: { ...split.meta, error: result.error },
            };
      }),
    );

    setSubmitting(false);
  };

  return {
    submitting,
    submit,
  };
}
