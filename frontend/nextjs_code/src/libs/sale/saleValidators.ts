
import { OpenSaleRequest } from '@/types/saleType';

export function validateSale(payload: OpenSaleRequest): string | null {
  if (!payload.items.length) {
    return 'Sale must contain at least one item';
  }

  if (payload.sale_type === 'DINE_IN' && !payload.table_id) {
    return 'Table is required for dine-in orders';
  }

  if (payload.guest_count && payload.guest_count <= 0) {
    return 'Guest count must be positive';
  }

  for (const item of payload.items) {
    if (item.quantity <= 0) {
      return 'Item quantities must be positive';
    }

    for (const extra of item.extras) {
      if (extra.quantity <= 0) {
        return 'Extra quantities must be positive';
      }
    }
  }

  return null;
}
