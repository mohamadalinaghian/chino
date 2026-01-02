/**
 * Sale Types and Interfaces
 * Used for the new sale creation page
 */

/**
 * Sale type enum
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
 * Payment status enum
 */
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

/**
 * Table interface
 */
export interface ITable {
  id: number;
  name: string;
  capacity: number;
  is_active: boolean;
}

/**
 * Menu category for sale
 */
export interface IMenuCategoryForSale {
  category: string;
  items: IMenuItemForSale[];
}

/**
 * Menu item for sale
 */
export interface IMenuItemForSale {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  thumbnail?: string | null;
  has_extras?: boolean;
}

/**
 * Extra item
 */
export interface IExtraItem {
  id: number;
  name: string;
  price: number;
  description?: string | null;
}

/**
 * Cart item (item added to current sale)
 */
export interface ICartItem {
  id: string; // Temporary ID for cart management
  menu_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  extras: ICartExtra[];
  total: number; // quantity * (unit_price + sum of extras)
}

/**
 * Cart extra item
 */
export interface ICartExtra {
  id: string; // Temporary ID
  menu_id: number;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Sale summary for cart display
 */
export interface ISaleSummary {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
}

/**
 * Request payload for opening a new sale
 */
export interface IOpenSaleRequest {
  sale_type: SaleType;
  table_id?: number | null;
  guest_id?: number | null;
  guest_count?: number;
  items: ISaleItemInput[];
  note?: string;
}

/**
 * Sale item input for API
 */
export interface ISaleItemInput {
  item_id?: number | null;
  menu_id: number;
  quantity: number;
  extras: IExtraItemInput[];
}

/**
 * Extra item input for API
 */
export interface IExtraItemInput {
  menu_id: number;
  quantity: number;
}

/**
 * Sale response from API
 */
export interface ISaleResponse {
  id: number;
  state: SaleState;
  sale_type: SaleType;
  table?: ITable | null;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  opened_at: string;
  items: ISaleItemResponse[];
}

/**
 * Sale item response from API
 */
export interface ISaleItemResponse {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  parent_item?: number | null;
  extras: ISaleItemResponse[];
}

/**
 * Grouped menu data
 */
export interface IGroupedMenuData {
  bar_items: IMenuCategoryForSale[];
  food_items: IMenuCategoryForSale[];
}

/**
 * Error response from API
 */
export interface IApiError {
  message: string;
  details?: Record<string, string[]>;
  code?: string;
}
