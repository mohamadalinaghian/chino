// hooks/payment/splits/usePaymentSplits.ts

import { useEffect, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { PaymentSplit } from './types';
import { distributeAmount } from './calculations';

interface Args {
  finalTotal: number;
  selectedItemsHash: string;
}

export function usePaymentSplits({
  finalTotal,
  selectedItemsHash,
}: Args) {
  const [splits, setSplits] = useState<PaymentSplit[]>([
    { id: uuid(), amount: 0, locked: false },
  ]);

  /** Auto-redistribute when selection changes */
  useEffect(() => {
    setSplits(prev => distributeAmount(finalTotal, prev));
  }, [finalTotal, selectedItemsHash]);

  const updateSplitAmount = useCallback(
    (id: string, amount: number) => {
      setSplits(prev =>
        prev.map(s =>
          s.id === id
            ? { ...s, amount, locked: true }
            : s,
        ),
      );
    },
    [],
  );

  const toggleLock = useCallback((id: string) => {
    setSplits(prev =>
      prev.map(s =>
        s.id === id ? { ...s, locked: !s.locked } : s,
      ),
    );
  }, []);

  const addSplit = () => {
    setSplits(prev => [
      ...prev,
      { id: uuid(), amount: 0, locked: false },
    ]);
  };

  const removeSplit = (id: string) => {
    setSplits(prev => prev.filter(s => s.id !== id));
  };

  const reset = () => {
    setSplits([{ id: uuid(), amount: finalTotal, locked: false }]);
  };

  return {
    splits,
    updateSplitAmount,
    toggleLock,
    addSplit,
    removeSplit,
    reset,
  };
}
