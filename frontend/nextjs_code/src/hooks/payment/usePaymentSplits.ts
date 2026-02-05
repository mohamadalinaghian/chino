import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Money,
  PaymentSplit,
  SaleSummary,
} from '@/types/payment/domain';

/**
 * ─────────────────────────────────────────────────────────────
 * usePaymentSplits
 * ─────────────────────────────────────────────────────────────
 * Authoritative split engine.
 *
 * Core invariant:
 *   Σ(split.amount) === saleSummary.selectedItemsTotal
 *
 * Design decisions:
 * - Amount-based only
 * - Manual edits are authoritative
 * - Locked splits preserve relative weight
 * - Redistribution is rounding-safe
 * - No UI logic
 * ─────────────────────────────────────────────────────────────
 */
export function usePaymentSplits(saleSummary: SaleSummary) {
  const [splits, setSplits] = useState<PaymentSplit[]>(() => [
    createEmptySplit(),
  ]);

  /**
   * Tracks whether recalculation is internal
   * (prevents infinite loops on state updates).
   */
  const isRecalculatingRef = useRef(false);

  /**
   * Recalculate splits whenever selected total changes.
   */
  useEffect(() => {
    if (isRecalculatingRef.current) return;

    redistributeSplits(
      saleSummary.selectedItemsTotal,
      splits,
      setSplits,
      isRecalculatingRef,
    );
  }, [saleSummary.selectedItemsTotal, splits]);

  /* ────────────────────────────────────────────────────────── */
  /* Public API                                                 */
  /* ────────────────────────────────────────────────────────── */

  const updateAmount = useCallback((id: string, amount: Money) => {
    setSplits(prev =>
      prev.map(split =>
        split.id === id
          ? {
              ...split,
              amount,
              manuallyEdited: true,
            }
          : split,
      ),
    );
  }, []);

  const toggleLock = useCallback((id: string) => {
    setSplits(prev =>
      prev.map(split =>
        split.id === id
          ? { ...split, locked: !split.locked }
          : split,
      ),
    );
  }, []);

  const addSplit = useCallback(() => {
    setSplits(prev => [...prev, createEmptySplit()]);
  }, []);

  const removeSplit = useCallback((id: string) => {
    setSplits(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    splits,
    updateAmount,
    toggleLock,
    addSplit,
    removeSplit,
  };
}

/* ────────────────────────────────────────────────────────── */
/* Helpers                                                    */
/* ────────────────────────────────────────────────────────── */

function createEmptySplit(): PaymentSplit {
  return {
    id: crypto.randomUUID(),
    amount: 0,
    locked: false,
    manuallyEdited: false,
  };
}

/**
 * Redistribute amounts while preserving:
 * - manual edits
 * - locked intent
 * - rounding correctness
 */
function redistributeSplits(
  total: Money,
  splits: PaymentSplit[],
  setSplits: React.Dispatch<React.SetStateAction<PaymentSplit[]>>,
  lockRef: React.MutableRefObject<boolean>,
) {
  lockRef.current = true;

  setSplits(prev => {
    if (prev.length === 0) return prev;

    const manual = prev.filter(s => s.manuallyEdited);
    const auto = prev.filter(s => !s.manuallyEdited);

    const manualSum = manual.reduce(
      (sum, s) => sum + s.amount,
      0,
    );

    const remaining = Math.max(total - manualSum, 0);

    if (auto.length === 0) {
      lockRef.current = false;
      return prev;
    }

    const base = Math.floor(remaining / auto.length);
    let remainder = remaining - base * auto.length;

    const next = prev.map(split => {
      if (split.manuallyEdited) return split;

      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;

      return {
        ...split,
        amount: base + extra,
      };
    });

    lockRef.current = false;
    return next;
  });
}
