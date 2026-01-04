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
 * Menu item for sale (matches MenuItemOut from backend)
 * Minimal schema for performance - extras loaded on-demand
 */
export interface IMenuItemForSale {
  id: number;
  name: string;
  price: number;
}

/**
 * Menu category (matches MenuCategoryOut from backend)
 */
export interface IMenuCategory {
  id: number;
  title: string;
  items: IMenuItemForSale[];
}

/**
 * Menu group (matches MenuGroupOut from backend)
 * Top-level grouping by parent_group (BAR or FOOD)
 */
export interface IMenuGroup {
  parent_group: 'BAR' | 'FOOD';
  categories: IMenuCategory[];
}

/**
 * Legacy interface - kept for compatibility during migration
 * @deprecated Use IMenuCategory instead
 */
export interface IMenuCategoryForSale extends IMenuCategory {
  parent_group?: string;
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
  product_id: number; // Product ID for extras (not menu_id)
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
  guest_count?: number | null;
  items: ISaleItemInput[];
  note?: string | null;
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
 * Extra item input for API (matches backend ExtraItemInput)
 */
export interface IExtraItemInput {
  product_id: number; // Backend expects product_id, not menu_id
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
 * Grouped menu data - DEPRECATED
 * Backend now returns List[IMenuGroup] instead
 * @deprecated Use IMenuGroup[] directly
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

/**
 * Dashboard sale item (lightweight summary)
 */
export interface IDashboardSaleItem {
  id: number;
  state: string;
  table: string | null;
  guest_name: string | null;
  total_amount: number | null;
  opened_by_name: string;
  opened_at: string;
  payment_status: string | null;
  balance_due: number | null;
}

/**
 * Dashboard response
 */
export interface IDashboardResponse {
  active_sales: IDashboardSaleItem[];
  total_count: number;
}

/**
 * User permissions response
 */
export interface IUserPermissions {
  id: number;
  mobile: string;
  name: string;
  is_staff: boolean;
  is_superuser?: boolean; // Added for dashboard total_amount check
  permissions: string[];
}

/**
 * Extra detail from sale detail endpoint (matches backend ExtraDetailSchema)
 */
export interface IExtraDetail {
  id: number; // SaleItem PK
  product_id: number; // Inventory Product ID
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

/**
 * Sale item detail from sale detail endpoint (matches backend SaleItemDetailSchema)
 */
export interface ISaleItemDetail {
  id: number; // SaleItem PK
  menu_id: number | null; // The Menu ID
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  extras: IExtraDetail[];
}

/**
 * Sale detail response (matches backend SaleDetailResponse)
 */
export interface ISaleDetailResponse {
  id: number;
  state: SaleState;
  sale_type: SaleType;
  table_id?: number | null;
  table_name?: string | null;
  guest_name?: string | null;
  items: ISaleItemDetail[];
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  opened_at: string;
  opened_by_name: string;
}
