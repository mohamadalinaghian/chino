// lib/api/saleApi.ts
/**
 * Type-safe API client for Sale endpoints.
 * Handles all CRUD operations for the POS system with proper error handling.
 *
 * Features:
 * - Automatic JWT authentication via AuthService
 * - Type-safe request/response with TypeScript interfaces
 * - Centralized error handling
 * - Matches Django backend schemas exactly
 */

import { AuthService } from '@/service/authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api';

// ============================================================================
// TYPE DEFINITIONS (Matching Backend Schemas)
// ============================================================================

/**
 * Represents an extra item (add-on) for a menu item.
 * Example: Extra cheese, extra bacon
 */
export interface ExtraItemInput {
  product_id: number;
  quantity: number;
}

/**
 * Represents a line item in a sale.
 * Can be used for both creating new items and updating existing ones.
 */
export interface SaleItemInput {
  item_id?: number | null;  // null = create new, number = update existing
  menu_id: number;           // The menu item being ordered
  quantity: number;          // How many of this item
  extras: ExtraItemInput[];  // Additional add-ons
}

/**
 * Request payload for opening a new sale.
 */
export interface OpenSaleRequest {
  sale_type: 'DINE_IN' | 'TAKEAWAY';
  table_id?: number | null;
  guest_id?: number | null;
  guest_count?: number | null;
  note?: string | null;
  items: SaleItemInput[];
}

/**
 * Request payload for syncing/updating sale items.
 */
export interface SyncSaleRequest {
  items: SaleItemInput[];
}

/**
 * Response after creating or updating a sale.
 */
export interface SaleResponse {
  sale_id: number;
  total_amount: string;  // Decimal as string to preserve precision
  state: string;         // "OPEN", "CLOSED", "CANCELED"
}

/**
 * Detailed information about an extra item in a sale.
 */
export interface ExtraDetail {
  id: number;
  product_id: number;
  product_name: string;
  quantity: string;      // Decimal as string
  unit_price: string;    // Decimal as string
  total: string;         // Decimal as string
}

/**
 * Detailed information about a sale item (menu item with extras).
 */
export interface SaleItemDetail {
  id: number;
  menu_id: number | null;
  product_name: string;
  quantity: string;      // Decimal as string
  unit_price: string;    // Decimal as string
  total: string;         // Decimal as string
  extras: ExtraDetail[];
}

/**
 * Complete sale information with all items and metadata.
 */
export interface SaleDetail {
  id: number;
  state: string;
  sale_type: string;
  table_id: number | null;
  table_number: string | null;
  guest_name: string | null;
  guest_count: number | null;
  total_amount: string;
  note: string;
  opened_at: string;     // ISO 8601 datetime string
  items: SaleItemDetail[];
}

/**
 * Lightweight sale summary for dashboard display.
 */
export interface DashboardItem {
  id: number;
  table: string | null;
  guest_name: string | null;
  total_amount: string;
  opened_by_name: string;
  opened_at: string;     // ISO 8601 datetime string
}

/**
 * Dashboard response with all active sales.
 */
export interface DashboardResponse {
  active_sales: DashboardItem[];
  total_count: number;
}

/**
 * Menu item structure (for creating sales).
 */
export interface MenuItem {
  id: number;
  name: string;
  price: string;
  category?: string;
  description?: string;
  is_available: boolean;
}

/**
 * Product structure (for extras).
 */
export interface Product {
  id: number;
  name: string;
  price: string;
  unit: string;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom error class for API errors with structured information.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handles API response errors and throws structured ApiError.
 */
async function handleApiError(response: Response): Promise<never> {
  let errorMessage = 'An error occurred';
  let errorDetails = null;

  try {
    const errorData = await response.json();
    errorMessage = errorData.detail || errorData.message || errorMessage;
    errorDetails = errorData;
  } catch {
    // If JSON parsing fails, use status text
    errorMessage = response.statusText || errorMessage;
  }

  throw new ApiError(errorMessage, response.status, errorDetails);
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

/**
 * Main API client for Sale operations.
 * All methods are static and use AuthService for authentication.
 */
export class SaleApiClient {
  /**
   * Creates a new sale (opens an order).
   *
   * @param payload - Sale creation data including items
   * @returns Sale response with ID, total, and state
   * @throws ApiError if request fails
   *
   * @example
   * const sale = await SaleApiClient.openSale({
   *   sale_type: 'DINE_IN',
   *   table_id: 5,
   *   items: [
   *     { menu_id: 10, quantity: 2, extras: [] }
   *   ]
   * });
   */
  static async openSale(payload: OpenSaleRequest): Promise<SaleResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/sale/open`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }

  /**
   * Synchronizes sale items (add/update/remove).
   * This is the main method for modifying an open sale.
   *
   * Items with item_id = null will be created.
   * Items with item_id = number will be updated.
   * Items not in the list will be deleted.
   *
   * @param saleId - ID of the sale to modify
   * @param items - Complete list of items that should exist
   * @returns Updated sale response
   * @throws ApiError if request fails
   *
   * @example
   * // Update quantity of existing item and add new item
   * await SaleApiClient.syncSaleItems(123, [
   *   { item_id: 45, menu_id: 10, quantity: 3, extras: [] },  // Update
   *   { item_id: null, menu_id: 12, quantity: 1, extras: [] } // Create
   * ]);
   */
  static async syncSaleItems(
    saleId: number,
    items: SaleItemInput[]
  ): Promise<SaleResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/sale/${saleId}/items`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }

  /**
   * Fetches detailed information about a specific sale.
   * Includes all items, extras, and metadata.
   *
   * @param saleId - ID of the sale to fetch
   * @returns Complete sale details
   * @throws ApiError if request fails
   *
   * @example
   * const sale = await SaleApiClient.getSaleDetail(123);
   * console.log(sale.items); // All items with extras
   */
  static async getSaleDetail(saleId: number): Promise<SaleDetail> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/sale/${saleId}`
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }

  /**
   * Fetches the dashboard with all active (OPEN) sales.
   *
   * @returns Dashboard data with active sales
   * @throws ApiError if request fails
   *
   * @example
   * const dashboard = await SaleApiClient.getDashboard();
   * console.log(`${dashboard.total_count} active sales`);
   */
  static async getDashboard(): Promise<DashboardResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/sale/dashboard`
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }

  /**
   * Closes a sale (marks as paid and finalized).
   * This action cannot be undone.
   *
   * @param saleId - ID of the sale to close
   * @returns Final sale response
   * @throws ApiError if request fails
   *
   * @example
   * await SaleApiClient.closeSale(123);
   * // Sale is now closed and cannot be modified
   */
  static async closeSale(saleId: number): Promise<SaleResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/sale/${saleId}/close`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }

  /**
   * Cancels an open sale.
   * Useful for voiding orders that were created by mistake.
   *
   * @param saleId - ID of the sale to cancel
   * @returns Sale response with canceled state
   * @throws ApiError if request fails
   *
   * @example
   * await SaleApiClient.cancelSale(123);
   */
  static async cancelSale(saleId: number): Promise<SaleResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/sale/${saleId}/cancel`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates the total for a sale item including extras.
 */
export function calculateItemTotal(item: SaleItemDetail): number {
  const itemTotal = Number(item.total);
  const extrasTotal = item.extras.reduce(
    (sum, extra) => sum + Number(extra.total),
    0
  );
  return itemTotal + extrasTotal;
}

/**
 * Calculates the grand total for an entire sale.
 */
export function calculateSaleTotal(sale: SaleDetail): number {
  return sale.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

/**
 * Formats a decimal string to display currency.
 */
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Formats an ISO datetime string to a readable format.
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Calculates time elapsed since a given datetime.
 */
export function getTimeElapsed(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Validates a sale before submission.
 */
export function validateSale(payload: OpenSaleRequest): string | null {
  if (!payload.items || payload.items.length === 0) {
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

  return null; // Valid
}
