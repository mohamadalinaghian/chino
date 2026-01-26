/**
 * Sale API Service
 * Handles all API calls related to sales
 */

import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL, API_ENDPOINTS, UI_TEXT } from '@/libs/constants';
import {
  SaleType,
  IOpenSaleRequest,
  ISaleResponse,
  ISaleDetailResponse,
  ITable,
  IMenuGroup,
  IExtraItem,
  IDashboardResponse,
  IAddPaymentsRequest,
  IAddPaymentsResponse,
  IBankAccount,
  IPaymentDetail,
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
 * Fetches dashboard data (list of sales filtered by state)
 * @param state - Filter by sale state (OPEN, CLOSED, CANCELED, all). Default: OPEN
 */
export async function fetchDashboard(state?: string): Promise<IDashboardResponse> {
  try {
    const url = new URL(`${CS_API_URL}${API_ENDPOINTS.SALE_DASHBOARD}`);
    if (state) {
      url.searchParams.append('state', state);
    }
    const response = await authenticatedFetchJSON<IDashboardResponse>(url.toString());
    return response;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    throw new Error('خطا در دریافت داشبورد');
  }
}

/**
 * Fetches bank accounts for payment target selection
 */
export async function fetchBankAccounts(): Promise<IBankAccount[]> {
  try {
    const response = await authenticatedFetchJSON<IBankAccount[]>(
      `${CS_API_URL}${API_ENDPOINTS.BANK_ACCOUNTS}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    throw new Error('خطا در دریافت حساب‌های بانکی');
  }
}

/**
 * Fetches payment history for a sale
 */
export async function fetchSalePayments(saleId: number): Promise<IPaymentDetail[]> {
  try {
    // Fetch sale details which includes all payments
    const sale = await fetchSaleDetails(saleId);
    // For now, we'll need to add a dedicated endpoint later if payments aren't in sale details
    // Return empty array as placeholder
    return [];
  } catch (error) {
    console.error(`Error fetching payments for sale ${saleId}:`, error);
    throw new Error('خطا در دریافت تاریخچه پرداخت‌ها');
  }
}

/**
 * Adds one or more payments to a sale
 */
export async function addPaymentsToSale(
  saleId: number,
  paymentsData: IAddPaymentsRequest
): Promise<IAddPaymentsResponse> {
  try {
    const response = await authenticatedFetchJSON<IAddPaymentsResponse>(
      `${CS_API_URL}${API_ENDPOINTS.SALE_ADD_PAYMENT(saleId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentsData),
      }
    );
    return response;
  } catch (error) {
    console.error(`Error adding payments to sale ${saleId}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('خطا در افزودن پرداخت');
  }
}

/**
 * Voids a payment (sets status to VOID)
 * Only superusers can void payments
 */
export async function voidPayment(
  saleId: number,
  paymentId: number
): Promise<IAddPaymentsResponse> {
  try {
    const response = await authenticatedFetchJSON<IAddPaymentsResponse>(
      `${CS_API_URL}/api/sale/${saleId}/payment/${paymentId}`,
      {
        method: 'DELETE',
      }
    );
    return response;
  } catch (error) {
    console.error(`Error voiding payment ${paymentId}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('خطا در لغو پرداخت');
  }
}
