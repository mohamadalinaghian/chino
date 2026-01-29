// src/hooks/payment/useSaleSummary.ts
import { useMemo } from 'react';

export interface SelectedItem {
  itemId: number;
  quantity: number;
  taxPercent: number;
}

export function useSaleSummary(
  sale: any | null,
  selectedItems: SelectedItem[]
) {
  return useMemo(() => {
    if (!sale?.items?.length) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
      };
    }

    let unselectedBase = 0;
    let selectedBase = 0;
    let selectedTax = 0;

    for (const item of sale.items) {
      const selected = selectedItems.find(s => s.itemId === item.id);
      const selQty = selected?.quantity ?? 0;
      const unselQty = item.quantity_remaining - selQty;

      // Extras (same for selected/unselected)
      const extrasTotal =
        item.extras?.reduce((sum: number, e: any) => sum + (e.unit_price * e.quantity), 0) ?? 0;
      const extrasPerUnit = item.quantity > 0 ? extrasTotal / item.quantity : 0;

      // ── Unselected part ── (always 10% tax)
      if (unselQty > 0) {
        const base = unselQty * item.unit_price + extrasPerUnit * unselQty;
        unselectedBase += base;
      }

      // ── Selected part ── (custom tax)
      if (selQty > 0 && selected) {
        const base = selQty * item.unit_price + extrasPerUnit * selQty;
        selectedBase += base;
        selectedTax += base * (selected.taxPercent / 100);
      }
    }

    const paid = sale.paid_amount ?? 0;
    const total = unselectedBase * 1.1 + selectedBase + selectedTax;

    // Optional: console.log for debugging
    // console.log('[useSaleSummary]', { total, paid, remaining: total - paid, selectedCount: selectedItems.length });

    return {
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: total - paid,
    };
  }, [sale, selectedItems]);
}
