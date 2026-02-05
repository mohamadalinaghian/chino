import { useMemo } from 'react';
import type {
  SaleItem,
  SelectedItem,
  SaleSummary,
  Money,
} from '@/types/payment/domain';

/**
 * ─────────────────────────────────────────────────────────────
 * useSaleSummary
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for ALL monetary calculations
 * related to a sale and current user selection.
 *
 * Rules:
 * - All money is integer-based (smallest currency unit)
 * - No UI logic
 * - No side effects
 * - No duplicated calculations elsewhere
 *
 * Consumers:
 * - PaymentPage
 * - SaleHeader
 * - usePaymentSplits
 * - usePaymentValidation
 * ─────────────────────────────────────────────────────────────
 */
export function useSaleSummary(
  saleItems: SaleItem[] | null,
  selectedItems: SelectedItem[],
  totalPaid: Money,
): SaleSummary {
  return useMemo(() => {
    if (!saleItems) {
      return emptySummary();
    }

    const saleTotal = calculateSaleTotal(saleItems);
    const selectedItemsTotal = calculateSelectedItemsTotal(
      saleItems,
      selectedItems,
    );

    const remainingTotal = Math.max(
      saleTotal - totalPaid,
      0,
    );

    return {
      saleTotal,
      totalPaid,
      remainingTotal,
      selectedItemsTotal,
      isFullyPaid: remainingTotal === 0,
      isOverpaid: totalPaid > saleTotal,
    };
  }, [saleItems, selectedItems, totalPaid]);
}

/* ────────────────────────────────────────────────────────── */
/* Helpers (pure functions, testable)                          */
/* ────────────────────────────────────────────────────────── */

function calculateSaleTotal(items: SaleItem[]): Money {
  return items.reduce((sum, item) => {
    return sum + item.unit_price * item.quantity_total;
  }, 0);
}

function calculateSelectedItemsTotal(
  items: SaleItem[],
  selected: SelectedItem[],
): Money {
  if (selected.length === 0) return 0;

  const itemMap = new Map<number, SaleItem>();
  items.forEach(item => itemMap.set(item.id, item));

  return selected.reduce((sum, sel) => {
    const item = itemMap.get(sel.itemId);
    if (!item) return sum;

    const payableQty = Math.min(
      sel.quantity,
      item.quantity_remaining,
    );

    return sum + item.unit_price * payableQty;
  }, 0);
}

function emptySummary(): SaleSummary {
  return {
    saleTotal: 0,
    totalPaid: 0,
    remainingTotal: 0,
    selectedItemsTotal: 0,
    isFullyPaid: false,
    isOverpaid: false,
  };
}
