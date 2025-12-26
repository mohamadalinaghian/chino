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
  CANCELLED = 'CANCELLED',
}

/**
 * Dashboard item - minimal sale info for list view
 * Matches SaleDashboardItemSchema from backend
 */
export interface SaleDashboardItem {
  id: number;
  table: string | null;
  guest_name: string | null;
  total_amount: string | null;
  opened_by_name: string;
  opened_at: string; // ISO date string
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
 * Complete sale detail response
 */
export interface SaleDetailResponse {
  id: number;
  state: string;
  sale_type: string;
  table_id: number | null;
  table_number: string | null;
  guest_name: string | null;
  guest_count: number | null;
  total_amount: string;
  note: string;
  opened_at: string;
  items: SaleItemDetailSchema[];
}

/**
 * Time filter options for dashboard
 */
export type TimeFilter = 'LT_30' | '30_90' | 'GT_90';
