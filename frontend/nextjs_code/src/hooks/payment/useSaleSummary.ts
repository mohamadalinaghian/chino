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
    if (!sale) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
      };
    }

    let unselectedBaseTotal = 0;
    let selectedBaseTotal = 0;
    let selectedTaxTotal = 0;

    for (const item of sale.items) {
      const selected = selectedItems.find(s => s.itemId === item.id);
      const selectedQty = selected?.quantity ?? 0;
      const unselectedQty = item.quantity_remaining - selectedQty;

      const extrasTotal =
        item.extras?.reduce(
          (sum: number, e: any) => sum + e.unit_price * e.quantity,
          0
        ) ?? 0;

      const extrasPerUnit =
        item.quantity > 0 ? extrasTotal / item.quantity : 0;

      // Unselected items (default 10% tax)
      if (unselectedQty > 0) {
        unselectedBaseTotal +=
          unselectedQty * item.unit_price +
          extrasPerUnit * unselectedQty;
      }

      // Selected items (custom tax)
      if (selectedQty > 0 && selected) {
        const base =
          selectedQty * item.unit_price +
          extrasPerUnit * selectedQty;

        selectedBaseTotal += base;
        selectedTaxTotal += base * (selected.taxPercent / 100);
      }
    }

    const paidAmount = sale.paid_amount ?? 0;

    const totalAmount =
      unselectedBaseTotal * 1.1 +
      selectedBaseTotal +
      selectedTaxTotal;

    return {
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
    };
  }, [sale, selectedItems]);
}
