/**
 * Sale API client
 *
 * Handles all sale-related API requests with proper authentication.
 * Uses authenticatedFetch to automatically handle token refresh.
 */

import { CS_API_URL } from '@/libs/constants';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { DashboardItem } from '@/types/saleType';

/**
 * Base URL for sale endpoints
 */
const SALE_BASE_URL = `${CS_API_URL}/sale`;

/**
 * Dashboard response structure
 */
interface DashboardResponse {
  active_sales: DashboardItem[];
}

/**
 * Sale API client class
 * Centralizes all sale-related API operations
 */
export class SaleApiClient {
  /**
   * Fetches dashboard data with active sales
   *
   * @returns Dashboard data with active sales list
   * @throws Error if request fails or user lacks permission
   */
  static async getDashboard(): Promise<DashboardResponse> {
    try {
      return await authenticatedFetchJSON<DashboardResponse>(
        `${SALE_BASE_URL}/`
      );
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw with more context if needed
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز مشاهده لیست فروش‌ها را ندارید');
        }
        throw error;
      }
      throw new Error('خطا در دریافت اطلاعات داشبورد');
    }
  }

  /**
   * Fetches details of a specific sale
   *
   * @param saleId - ID of the sale to fetch
   * @returns Sale details
   * @throws Error if sale not found or user lacks permission
   */
  static async getSaleDetail(saleId: number): Promise<any> {
    try {
      return await authenticatedFetchJSON(
        `${SALE_BASE_URL}/${saleId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error('فروش مورد نظر یافت نشد');
        }
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز مشاهده جزئیات این فروش را ندارید');
        }
        throw error;
      }
      throw new Error('خطا در دریافت جزئیات فروش');
    }
  }

  /**
   * Creates a new sale
   *
   * @param data - Sale creation data
   * @returns Created sale
   * @throws Error if creation fails or user lacks permission
   */
  static async createSale(data: any): Promise<any> {
    try {
      return await authenticatedFetchJSON(
        `${SALE_BASE_URL}/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز ایجاد فروش جدید را ندارید');
        }
        throw error;
      }
      throw new Error('خطا در ایجاد فروش جدید');
    }
  }

  /**
   * Updates an existing sale
   *
   * @param saleId - ID of sale to update
   * @param data - Update data
   * @returns Updated sale
   * @throws Error if update fails or user lacks permission
   */
  static async updateSale(saleId: number, data: any): Promise<any> {
    try {
      return await authenticatedFetchJSON(
        `${SALE_BASE_URL}/${saleId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز ویرایش این فروش را ندارید');
        }
        throw error;
      }
      throw new Error('خطا در به‌روزرسانی فروش');
    }
  }

  /**
   * Closes a sale
   *
   * @param saleId - ID of sale to close
   * @returns Closed sale
   * @throws Error if closing fails or user lacks permission
   */
  static async closeSale(saleId: number): Promise<any> {
    try {
      return await authenticatedFetchJSON(
        `${SALE_BASE_URL}/${saleId}/close`,
        {
          method: 'POST',
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز بستن این فروش را ندارید');
        }
        if (error.message.includes('empty')) {
          throw new Error('نمی‌توان فروش خالی را بست');
        }
        throw error;
      }
      throw new Error('خطا در بستن فروش');
    }
  }

  /**
   * Cancels a sale
   *
   * @param saleId - ID of sale to cancel
   * @returns Cancelled sale
   * @throws Error if cancellation fails or user lacks permission
   */
  static async cancelSale(saleId: number): Promise<any> {
    try {
      return await authenticatedFetchJSON(
        `${SALE_BASE_URL}/${saleId}/cancel`,
        {
          method: 'POST',
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز لغو این فروش را ندارید');
        }
        throw error;
      }
      throw new Error('خطا در لغو فروش');
    }
  }
}
