
import { SaleDetail, SaleItemDetail } from '@/types/saleType';

export function calculateItemTotal(item: SaleItemDetail): number {
  const base = Number(item.total);
  const extras = item.extras.reduce(
    (sum, extra) => sum + Number(extra.total),
    0
  );
  return base + extras;
}

export function calculateSaleTotal(sale: SaleDetail): number {
  return sale.items.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );
}
