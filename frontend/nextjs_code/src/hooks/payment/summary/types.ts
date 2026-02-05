// hooks/payment/summary/types.ts

export interface SelectedItem {
  item_id: number;
  quantity: number;
}

export interface SaleItem {
  id: number;
  unit_price: number;
  quantity_remaining: number;
  tax_rate?: number;       // 0.09 => 9%
  discount_rate?: number; // 0.10 => 10%
}

export interface SaleSummaryInput {
  saleItems: SaleItem[];
  selectedItems: SelectedItem[];
}

export interface TaxResult {
  totalTax: number;
  breakdownByItem: Record<number, number>;
}

export interface DiscountResult {
  totalDiscount: number;
  breakdownByItem: Record<number, number>;
}

export interface SaleSummary {
  baseTotal: number;
  taxTotal: number;
  discountTotal: number;
  finalTotal: number;
}
