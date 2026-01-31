/**
 * usePaymentSplits Hook
 *
 * Manages split payment state and operations.
 * Responsibilities:
 * - Manage split count and split payment objects
 * - Handle split creation, deletion, and updates
 * - Distribute amounts across splits
 * - Lock/unlock splits
 * - Calculate totals
 */

import { useState, useCallback, useMemo } from 'react';
import { PaymentMethod } from '@/types/sale';
import type { SplitPayment, SelectedItem } from '@/types/payment';
import {
  calculateSelectedItemsTotal,
  distributeAmountAcrossSplits,
  calculateTotalLockedAmount,
  calculateTotalUnlockedAmount,
} from '@/utils/paymentCalculation';
import { DEFAULT_TAX_PERCENT } from '@/libs/paymentConstants';
import type { ISaleItemDetail } from '@/types/sale';

interface UsePaymentSplitsProps {
  items: ISaleItemDetail[];
  selectedItems: SelectedItem[];
}

interface UsePaymentSplitsReturn {
  splits: SplitPayment[];
  splitCount: number;
  totalLockedAmount: number;
  totalUnlockedAmount: number;
  updateSplitCount: (count: number) => void;
  updateSplit: (id: number, updates: Partial<SplitPayment>) => void;
  toggleSplitLock: (id: number) => void;
  distributeSelectedAmount: () => void;
  resetSplits: () => void;
}

/**
 * Create a default split payment object
 *
 * @param id - Unique identifier for the split
 * @returns Default split payment configuration
 */
function createDefaultSplit(id: number): SplitPayment {
  return {
    id,
    amount: 0,
    taxEnabled: true,
    taxPercent: DEFAULT_TAX_PERCENT,
    discount: 0,
    paymentMethod: PaymentMethod.CARD_TRANSFER,
    accountId: null,
    isLocked: false,
    tipAmount: 0,
  };
}

/**
 * Hook for managing split payments
 *
 * @param props - Hook configuration
 * @returns Split payment state and operations
 */
export function usePaymentSplits({
  items,
  selectedItems,
}: UsePaymentSplitsProps): UsePaymentSplitsReturn {
  const [splitCount, setSplitCount] = useState(1);
  const [splits, setSplits] = useState<SplitPayment[]>([createDefaultSplit(1)]);

  /**
   * Calculate total amount of selected items
   */
  const selectedTotal = useMemo(() => {
    return calculateSelectedItemsTotal(items, selectedItems);
  }, [items, selectedItems]);

  /**
   * Calculate total locked amount
   */
  const totalLockedAmount = useMemo(() => {
    return calculateTotalLockedAmount(splits);
  }, [splits]);

  /**
   * Calculate total unlocked amount
   */
  const totalUnlockedAmount = useMemo(() => {
    return calculateTotalUnlockedAmount(splits);
  }, [splits]);

  /**
   * Update the number of split payments
   * Preserves locked splits and adjusts unlocked ones
   *
   * @param count - New split count (1-10)
   */
  const updateSplitCount = useCallback(
    (count: number) => {
      const newCount = Math.max(1, Math.min(10, count));
      setSplitCount(newCount);

      // Preserve locked splits, adjust unlocked ones
      const lockedSplits = splits.filter(s => s.isLocked);
      const unlockedNeeded = newCount - lockedSplits.length;

      if (unlockedNeeded > 0) {
        // Create additional unlocked splits
        const newSplits = [...lockedSplits];
        const maxId = Math.max(...splits.map(s => s.id), 0);

        for (let i = 0; i < unlockedNeeded; i++) {
          newSplits.push(createDefaultSplit(maxId + i + 1));
        }

        setSplits(newSplits);
      } else if (unlockedNeeded < 0) {
        // Remove excess unlocked splits
        const unlockedToKeep = splits.filter(s => !s.isLocked).slice(0, unlockedNeeded);
        setSplits([...lockedSplits, ...unlockedToKeep]);
      }
    },
    [splits]
  );

  /**
   * Update a specific split payment
   *
   * @param id - Split ID to update
   * @param updates - Partial updates to apply
   */
  const updateSplit = useCallback(
    (id: number, updates: Partial<SplitPayment>) => {
      setSplits(prev =>
        prev.map(split =>
          split.id === id ? { ...split, ...updates } : split
        )
      );
    },
    []
  );

  /**
   * Toggle lock state of a split
   *
   * @param id - Split ID to toggle
   */
  const toggleSplitLock = useCallback(
    (id: number) => {
      setSplits(prev =>
        prev.map(split =>
          split.id === id ? { ...split, isLocked: !split.isLocked } : split
        )
      );
    },
    []
  );

  /**
   * Distribute selected items total across unlocked splits
   * Respects locked splits and distributes remaining amount equally
   */
  const distributeSelectedAmount = useCallback(() => {
    const lockedTotal = calculateTotalLockedAmount(splits);
    const remainingAmount = Math.max(0, selectedTotal - lockedTotal);

    const updatedSplits = distributeAmountAcrossSplits(remainingAmount, splits);
    setSplits(updatedSplits);
  }, [splits, selectedTotal]);

  /**
   * Reset all splits to default state
   */
  const resetSplits = useCallback(() => {
    setSplitCount(1);
    setSplits([createDefaultSplit(1)]);
  }, []);

  return {
    splits,
    splitCount,
    totalLockedAmount,
    totalUnlockedAmount,
    updateSplitCount,
    updateSplit,
    toggleSplitLock,
    distributeSelectedAmount,
    resetSplits,
  };
}
