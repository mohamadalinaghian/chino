// hooks/payment/summary/useSaleTax.ts

import { SaleItem, SelectedItem, TaxResult } from './types';

export function useSaleTax(
  saleItems: SaleItem[],
  selectedItems: SelectedItem[],
): TaxResult {
  const breakdown: Record<number, number> = {};
  let totalTax = 0;

  const itemMap = new Map(saleItems.map(i => [i.id, i]));

  for (const sel of selectedItems) {
    const item = itemMap.get(sel.item_id);
    if (!item || !item.tax_rate) continue;

    const qty = Math.min(sel.quantity, item.quantity_remaining);
    const tax = qty * item.unit_price * item.tax_rate;

    breakdown[item.id] = tax;
    totalTax += tax;
  }

  return {
    totalTax,
    breakdownByItem: breakdown,
  };
}
