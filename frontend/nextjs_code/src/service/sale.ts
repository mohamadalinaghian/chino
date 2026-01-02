/**
 * Sale API Service
 * Handles all API calls related to sales
 */

import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL } from '@/libs/constants';
import {
  IOpenSaleRequest,
  ISaleResponse,
  ITable,
  IGroupedMenuData,
  IExtraItem,
} from '@/types/sale';

/**
 * Fetches all available tables
 */
export async function fetchTables(): Promise<ITable[]> {
  try {
    const tables = await authenticatedFetchJSON<ITable[]>(
      `${CS_API_URL}/table/`
    );
    return tables.filter((table) => table.is_active);
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw new Error('خطا در دریافت لیست میزها');
  }
}

/**
 * Fetches menu items grouped by category for sale
 * Returns bar_items and food_items
 */
export async function fetchSaleMenu(): Promise<IGroupedMenuData> {
  try {
    const menu = await authenticatedFetchJSON<IGroupedMenuData>(
      `${CS_API_URL}/menu/sale/menu`
    );
    return menu;
  } catch (error) {
    console.error('Error fetching sale menu:', error);
    throw new Error('خطا در دریافت منوی فروش');
  }
}

/**
 * Fetches extra items for a specific menu item
 * This is a placeholder - adjust based on your backend API
 */
export async function fetchExtrasForItem(
  menuId: number
): Promise<IExtraItem[]> {
  try {
    // TODO: Update this endpoint based on your actual backend API
    // For now, returning empty array as extras might be part of the menu response
    // or require a separate endpoint
    const extras = await authenticatedFetchJSON<IExtraItem[]>(
      `${CS_API_URL}/menu/items/${menuId}/extras/`
    );
    return extras;
  } catch (error) {
    console.error(`Error fetching extras for item ${menuId}:`, error);
    // Return empty array if extras endpoint doesn't exist or fails
    return [];
  }
}

/**
 * Opens a new sale
 */
export async function openSale(
  saleData: IOpenSaleRequest
): Promise<ISaleResponse> {
  try {
    const response = await authenticatedFetchJSON<ISaleResponse>(
      `${CS_API_URL}/sale/open`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      }
    );
    return response;
  } catch (error) {
    console.error('Error opening sale:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('خطا در ایجاد فروش جدید');
  }
}

/**
 * Fetches details of a specific sale
 */
export async function fetchSaleDetails(saleId: number): Promise<ISaleResponse> {
  try {
    const sale = await authenticatedFetchJSON<ISaleResponse>(
      `${CS_API_URL}/sale/${saleId}`
    );
    return sale;
  } catch (error) {
    console.error(`Error fetching sale ${saleId}:`, error);
    throw new Error('خطا در دریافت جزئیات فروش');
  }
}

/**
 * Syncs sale items (add/update/remove items from an open sale)
 */
export async function syncSaleItems(
  saleId: number,
  items: IOpenSaleRequest['items']
): Promise<ISaleResponse> {
  try {
    const response = await authenticatedFetchJSON<ISaleResponse>(
      `${CS_API_URL}/sale/${saleId}/sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      }
    );
    return response;
  } catch (error) {
    console.error(`Error syncing sale ${saleId}:`, error);
    throw new Error('خطا در بروزرسانی موارد فروش');
  }
}

/**
 * Closes a sale
 */
export async function closeSale(saleId: number): Promise<ISaleResponse> {
  try {
    const response = await authenticatedFetchJSON<ISaleResponse>(
      `${CS_API_URL}/sale/${saleId}/close`,
      {
        method: 'POST',
      }
    );
    return response;
  } catch (error) {
    console.error(`Error closing sale ${saleId}:`, error);
    throw new Error('خطا در بستن فروش');
  }
}

/**
 * Cancels a sale
 */
export async function cancelSale(saleId: number): Promise<ISaleResponse> {
  try {
    const response = await authenticatedFetchJSON<ISaleResponse>(
      `${CS_API_URL}/sale/${saleId}/cancel`,
      {
        method: 'POST',
      }
    );
    return response;
  } catch (error) {
    console.error(`Error canceling sale ${saleId}:`, error);
    throw new Error('خطا در لغو فروش');
  }
}
