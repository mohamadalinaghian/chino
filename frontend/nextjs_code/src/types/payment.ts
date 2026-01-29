// src/types/payment.ts

export interface SaleData {
  id: number;
  state: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  subtotal_amount: number;
  total_paid: number;
  balance_due: number;
  is_fully_paid: boolean;
  payment_status: string;
  items: ISaleItemDetail[];
  payments: PaymentRecord[];
  // Guest and table info for display
  guest_name?: string | null;
  table_name?: string | null;
  opened_at: string;
}

export interface PaymentRecord {
  id: number;
  method: string;
  amount_applied: number;
  amount_total: number;
  tip_amount: number;
  received_by_name: string;
  received_at: string;
  status: string;
  covered_items: { item_id: number; quantity_paid: number }[];
  destination_card_number?: string;
  destination_bank_name?: string;
  destination_account_owner?: string;
}

export interface BankAccount {
  id: number;
  card_number: string;
  bank_name: string | null;
  related_user_name: string;
}

export interface POSAccount {
  id: number | null;
  card_number: string | null;
  account_owner: string | null;
}

/**
 * Core type for items selected for payment.
 * IMPORTANT: taxPercent is REQUIRED to prevent NaN in calculations.
 */
export interface SelectedItem {
  itemId: number;
  quantity: number;
  taxPercent: number;          // ← added & required (fixes your main bug)
  item?: ISaleItemDetail;      // optional – only if you really need the full item reference
}

/**
 * Used in split payment / multi-method flows (if applicable)
 */
export interface SplitPayment {
  id: number;
  amount: number;
  taxEnabled: boolean;
  taxPercent: number;
  discount: number;
  paymentMethod: PaymentMethod;
  accountId: number | null;
  isLocked: boolean;
  tipAmount: number;
}

// ───────────────────────────────────────────────
// Missing types referenced above – define them here
// (or move to separate file if they are used elsewhere)
// ───────────────────────────────────────────────

export interface ISaleItemDetail {
  id: number;
  product_name: string;
  unit_price: number;
  quantity_remaining: number;
  quantity?: number;               // original total quantity (if needed)
  extras?: Array<{
    product_name?: string;
    unit_price: number;
    quantity: number;
  }>;
  tax_percent?: number;            // ← source of default tax rate
  // Add any other fields you actually use from items
}

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'pos'
