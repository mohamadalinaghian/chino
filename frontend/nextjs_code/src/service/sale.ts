/**
 * Sale API Service
 * Handles all API calls related to sales
 */

import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL, API_ENDPOINTS, UI_TEXT } from '@/libs/constants';
import {
  IOpenSaleRequest,
  ISaleResponse,
  ISaleDetailResponse,
  ITable,
  IMenuGroup,
  IExtraItem,
  IDashboardResponse,
} from '@/types/sale';

/**
 * Fetches empty (available) tables only
 */
export async function fetchTables(): Promise<ITable[]> {
  try {
    const tables = await authenticatedFetchJSON<ITable[]>(
      `${CS_API_URL}${API_ENDPOINTS.TABLES_EMPTY}`
    );
    return tables;
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw new Error(UI_TEXT.ERROR_LOADING_TABLES);
  }
}

/**
 * Fetches menu items grouped by parent_group -> category -> items
 * Returns array of menu groups (BAR_ITEM and FOOD)
 */
export async function fetchSaleMenu(): Promise<IMenuGroup[]> {
  try {
    const menu = await authenticatedFetchJSON<IMenuGroup[]>(
      `${CS_API_URL}${API_ENDPOINTS.MENU_SALE}`
    );
    return menu;
  } catch (error) {
    console.error('Error fetching sale menu:', error);
    throw new Error(UI_TEXT.ERROR_LOADING_MENU);
  }
}

/**
 * Fetches all available extra items (RAW/PROCESSED products)
 * Extras are global, not per-item
 */
export async function fetchExtras(): Promise<IExtraItem[]> {
  try {
    const extras = await authenticatedFetchJSON<IExtraItem[]>(
      `${CS_API_URL}${API_ENDPOINTS.MENU_EXTRAS}`
    );
    return extras;
  } catch (error) {
    console.error('Error fetching extras:', error);
    // Return empty array if extras endpoint doesn't exist or fails
    return [];
  }
}

/**
 * Opens a new sale (immediate payment)
 */
export async function openSale(
  saleData: IOpenSaleRequest
): Promise<ISaleResponse> {
  try {
    const response = await authenticatedFetchJSON<ISaleResponse>(
      `${CS_API_URL}${API_ENDPOINTS.SALE_OPEN}`,
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
    throw new Error(UI_TEXT.ERROR_CREATING_SALE);
  }
}

/**
 * Saves sale as open (to pay later)
 */
export async function saveAsOpenSale(
  saleData: IOpenSaleRequest
): Promise<ISaleResponse> {
  try {
    // Same endpoint but we won't redirect to payment
    const response = await authenticatedFetchJSON<ISaleResponse>(
      `${CS_API_URL}${API_ENDPOINTS.SALE_OPEN}`,
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
    console.error('Error saving open sale:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(UI_TEXT.ERROR_CREATING_SALE);
  }
}

/**
 * Fetches details of a specific sale
 */
export async function fetchSaleDetails(saleId: number): Promise<ISaleDetailResponse> {
  try {
    const sale = await authenticatedFetchJSON<ISaleDetailResponse>(
      `${CS_API_URL}${API_ENDPOINTS.SALE_DETAILS(saleId)}`
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
  items: IOpenSaleRequest['items'],
  metadata?: {
    sale_type?: SaleType;
    table_id?: number | null;
    guest_id?: number | null;
    guest_count?: number | null;
  }
): Promise<ISaleResponse> {
  try {
    const response = await authenticatedFetchJSON<ISaleResponse>(
      `${CS_API_URL}${API_ENDPOINTS.SALE_SYNC(saleId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          ...metadata,
        }),
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
      `${CS_API_URL}${API_ENDPOINTS.SALE_CLOSE(saleId)}`,
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
export async function cancelSale(saleId: number, reason: string): Promise<ISaleResponse> {
  try {
    const response = await authenticatedFetchJSON<ISaleResponse>(
      `${CS_API_URL}${API_ENDPOINTS.SALE_CANCEL(saleId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancel_reason: reason }),
      }
    );
    return response;
  } catch (error) {
    console.error(`Error canceling sale ${saleId}:`, error);
    throw new Error('خطا در لغو فروش');
  }
}

/**
 * Fetches dashboard data (list of open sales)
 */
export async function fetchDashboard(): Promise<IDashboardResponse> {
  try {
    const response = await authenticatedFetchJSON<IDashboardResponse>(
      `${CS_API_URL}${API_ENDPOINTS.SALE_DASHBOARD}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    throw new Error('خطا در دریافت داشبورد');
  }
}
