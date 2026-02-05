// hooks/payment/summary/calculations.ts

import { SaleItem, SelectedItem } from './types';

export function calculateBaseTotal(
  saleItems: SaleItem[],
  selectedItems: SelectedItem[],
): number {
  const itemMap = new Map(saleItems.map(i => [i.id, i]));

  return selectedItems.reduce((sum, sel) => {
    const item = itemMap.get(sel.item_id);
    if (!item) return sum;

    const validQty = Math.min(sel.quantity, item.quantity_remaining);
    return sum + validQty * item.unit_price;
  }, 0);
}
