/**
 * TypeScript type definitions for new sale page
 * Matches backend MenuSaleResponse and related schemas
 */

/**
 * Menu item for sale creation
 * Matches MenuItemSaleSchema from backend
 */
export interface MenuItemSale {
  id: number; // Menu ID
  name: string; // Product name
  price: number; // Item price in thousand Tomans
}

/**
 * Category group containing menu items
 * Matches MenuCategoryGroupSchema from backend
 */
export interface MenuCategoryGroup {
  category: string; // Category title
  items: MenuItemSale[]; // Items in this category
}

/**
 * Complete menu response grouped by type
 * Matches MenuSaleResponse from backend
 */
export interface MenuSaleResponse {
  bar_items: MenuCategoryGroup[]; // Bar category groups
  food_items: MenuCategoryGroup[]; // Food category groups
}

/**
 * Extra product (syrups, toppings, etc.)
 * Matches ProductExtraSchema from backend
 */
export interface ProductExtra {
  id: number; // Product ID
  name: string; // Product name
  price: number; // Price in thousand Tomans
}

/**
 * Item in the order cart (client-side only)
 */
export interface CartItem {
  menu_id: number; // Menu item ID
  name: string; // Display name
  price: number; // Unit price
  quantity: number; // Quantity ordered
  extras: CartExtra[]; // Extra items added
}

/**
 * Extra item in cart (client-side only)
 */
export interface CartExtra {
  product_id: number; // Product ID
  name: string; // Display name
  price: number; // Unit price
  quantity: number; // Quantity
}

/**
 * Sale type options
 */
export enum NewSaleType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
}

/**
 * Form state for new sale
 */
export interface NewSaleFormState {
  sale_type: NewSaleType;
  table_id: number | null;
  guest_id: number | null;
  guest_count: number | null;
  note: string;
}

/**
 * Table option for dropdown
 */
export interface TableOption {
  id: number;
  name: string;
}
