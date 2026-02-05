import { useCallback, useMemo, useState } from 'react';
import type {
  SaleItem,
  SelectedItem,
} from '@/types/payment/domain';

/**
 * ─────────────────────────────────────────────────────────────
 * useItemSelection
 * ─────────────────────────────────────────────────────────────
 * Manages user intent for selecting sale items and quantities.
 *
 * Responsibilities:
 * - Track which items are selected
 * - Track selected quantities
 *
 * Non-responsibilities:
 * - No monetary calculation
 * - No payment logic
 * - No split awareness
 *
 * This hook represents PURE USER INTENT.
 * ─────────────────────────────────────────────────────────────
 */
export function useItemSelection(unpaidItems: SaleItem[]) {
  const [selectedMap, setSelectedMap] = useState<
    Map<number, number>
  >(new Map());

  /**
   * Toggle selection of an item.
   * If selecting, defaults quantity to remaining quantity.
   * If deselecting, removes it completely.
   */
  const toggleItem = useCallback(
    (itemId: number) => {
      setSelectedMap(prev => {
        const next = new Map(prev);

        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          const item = unpaidItems.find(i => i.id === itemId);
          if (!item) return prev;

          next.set(itemId, item.quantity_remaining);
        }

        return next;
      });
    },
    [unpaidItems],
  );

  /**
   * Update selected quantity for an item.
   * Quantity is clamped between 1 and remaining quantity.
   */
  const updateQuantity = useCallback(
    (itemId: number, quantity: number) => {
      setSelectedMap(prev => {
        if (!prev.has(itemId)) return prev;

        const item = unpaidItems.find(i => i.id === itemId);
        if (!item) return prev;

        const clampedQty = Math.max(
          1,
          Math.min(quantity, item.quantity_remaining),
        );

        const next = new Map(prev);
        next.set(itemId, clampedQty);

        return next;
      });
    },
    [unpaidItems],
  );

  /**
   * Select all unpaid items with full remaining quantities.
   */
  const selectAll = useCallback(() => {
    const next = new Map<number, number>();
    unpaidItems.forEach(item => {
      next.set(item.id, item.quantity_remaining);
    });
    setSelectedMap(next);
  }, [unpaidItems]);

  /**
   * Clear all selections.
   */
  const clear = useCallback(() => {
    setSelectedMap(new Map());
  }, []);

  /**
   * Convert internal map to stable array form.
   */
  const selectedItems: SelectedItem[] = useMemo(() => {
    return Array.from(selectedMap.entries()).map(
      ([itemId, quantity]) => ({
        itemId,
        quantity,
      }),
    );
  }, [selectedMap]);

  return {
    selectedItems,
    toggleItem,
    updateQuantity,
    selectAll,
    clear,
  };
}
