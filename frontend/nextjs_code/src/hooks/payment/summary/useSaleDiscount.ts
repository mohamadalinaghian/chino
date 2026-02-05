// hooks/payment/summary/useSaleDiscount.ts

import { SaleItem, SelectedItem, DiscountResult } from './types';

export function useSaleDiscount(
  saleItems: SaleItem[],
  selectedItems: SelectedItem[],
): DiscountResult {
  const breakdown: Record<number, number> = {};
  let totalDiscount = 0;

  const itemMap = new Map(saleItems.map(i => [i.id, i]));

  for (const sel of selectedItems) {
    const item = itemMap.get(sel.item_id);
    if (!item || !item.discount_rate) continue;

    const qty = Math.min(sel.quantity, item.quantity_remaining);
    const discount = qty * item.unit_price * item.discount_rate;

    breakdown[item.id] = discount;
    totalDiscount += discount;
  }

  return {
    totalDiscount,
    breakdownByItem: breakdown,
  };
}
