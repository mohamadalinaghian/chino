/**
 * Sale-related TypeScript type definitions
 * Matches Django backend schemas exactly
 */

/**
 * Sale type enum - matches backend
 */
export enum SaleType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
}

/**
 * Sale state enum
 */
export enum SaleState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}

/**
 * Payment status enum (for CLOSED sales)
 */
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

/**
 * Dashboard item - minimal sale info for list view
 * Matches SaleDashboardItemSchema from backend
 */
export interface SaleDashboardItem {
  id: number;
  state: string;
  table: string | null;
  guest_name: string | null;
  total_amount: string | null;
  opened_by_name: string;
  opened_at: string; // ISO date string
  // Invoice/payment fields (when CLOSED)
  invoice_number: string | null;
  payment_status: string | null;
  balance_due: string | null;
}

/**
 * Dashboard response - matches backend SaleDashboardResponse
 */
export interface SaleDashboardResponse {
  active_sales: SaleDashboardItem[];
  total_count: number;
}

/**
 * Extra item input for creating/updating extras
 */
export interface ExtraItemInput {
  product_id: number;
  quantity: number;
}

/**
 * Sync sale item input - unified for create/update
 */
export interface SyncSaleItemInput {
  item_id: number | null; // null = create, number = update
  menu_id: number;
  quantity: number;
  extras: ExtraItemInput[];
}

/**
 * Request for syncing sale items
 */
export interface SyncSaleRequest {
  items: SyncSaleItemInput[];
}

/**
 * Request for opening a new sale
 */
export interface OpenSaleRequest {
  sale_type: SaleType;
  table_id: number | null;
  guest_id: number | null;
  guest_count: number | null;
  note: string | null;
  items: SyncSaleItemInput[];
}

/**
 * Response after opening a sale
 */
export interface OpenSaleResponse {
  sale_id: number;
  total_amount: string;
  state: string;
}

/**
 * Extra detail in sale item
 */
export interface ExtraDetailSchema {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total: string;
}

/**
 * Sale item detail
 */
export interface SaleItemDetailSchema {
  id: number;
  menu_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: string;
  total: string;
  extras: ExtraDetailSchema[];
}

/**
 * Complete sale detail response - Unified model with invoice and COGS data
 */
export interface SaleDetailResponse {
  // ---- Sale Metadata ----
  id: number;
  state: string;
  sale_type: string;
  table_id: number | null;
  table_name: string | null;
  guest_name: string | null;
  guest_count: number | null;
  note: string;
  opened_at: string;
  opened_by_name: string;
  modified_by_name: string | null;

  // ---- Financial Data ----
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;

  // ---- Invoice Data (when CLOSED) ----
  invoice_number: string | null;
  payment_status: string | null;
  closed_at: string | null;
  closed_by_name: string | null;

  // ---- Payment Tracking (when CLOSED) ----
  total_paid: string | null;
  balance_due: string | null;
  is_fully_paid: boolean | null;

  // ---- COGS & Revenue (when CLOSED, if has permission) ----
  total_cost: string | null;
  gross_profit: string | null;
  gross_margin_percent: string | null;

  // ---- Cancellation (when CANCELED) ----
  canceled_at: string | null;
  canceled_by_name: string | null;
  cancel_reason: string | null;

  // ---- Items ----
  items: SaleItemDetailSchema[];
}

/**
 * Time filter options for dashboard
 */
export type TimeFilter = 'LT_30' | '30_90' | 'GT_90';

/**
 * Payment method enum
 */
export enum PaymentMethod {
  CASH = 'CASH',
  POS = 'POS',
  CARD_TRANSFER = 'CARD_TRANSFER',
}

/**
 * Payment input for closing sale
 */
export interface PaymentInputSchema {
  method: PaymentMethod;
  amount_applied: string;
  tip_amount?: string;
  destination_account_id?: number | null;
}

/**
 * Payment detail in response
 */
export interface PaymentDetailSchema {
  id: number;
  method: string;
  amount_total: string;
  amount_applied: string;
  tip_amount: string;
  destination_account_id: number | null;
  received_at: string;
}

/**
 * Request for closing a sale
 */
export interface CloseSaleRequest {
  tax_amount: string;
  discount_amount: string;
  payments: PaymentInputSchema[];
}

/**
 * Response after closing a sale
 */
export interface CloseSaleResponse {
  sale_id: number;
  invoice_number: string;
  state: string;
  payment_status: string;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  total_cost: string;
  gross_profit: string;
  gross_margin_percent: string;
  total_paid: string;
  balance_due: string;
  is_fully_paid: boolean;
  payments: PaymentDetailSchema[];
}

/**
 * Request for canceling a sale
 */
export interface CancelSaleRequest {
  cancel_reason: string;
}

/**
 * Response after canceling a sale
 */
export interface CancelSaleResponse {
  sale_id: number;
  state: string;
  canceled_at: string;
  canceled_by_name: string;
  cancel_reason: string;
}
