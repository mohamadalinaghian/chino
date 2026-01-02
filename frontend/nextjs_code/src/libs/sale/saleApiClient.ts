/**
 * Sale API client
 *
 * Handles all sale-related API requests with proper authentication.
 * Uses authenticatedFetch to automatically handle token refresh.
 */

import { CS_API_URL } from '@/libs/constants';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import {
  SaleDashboardResponse,
  SaleDetailResponse,
  OpenSaleRequest,
  OpenSaleResponse,
  SyncSaleRequest,
  CloseSaleRequest,
  CloseSaleResponse,
  CancelSaleRequest,
  CancelSaleResponse,
} from '@/types/saleType';

/**
 * Base URL for sale endpoints
 */
const SALE_BASE_URL = `${CS_API_URL}/sale`;

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
  static async getDashboard(): Promise<SaleDashboardResponse> {
    try {
      return await authenticatedFetchJSON<SaleDashboardResponse>(
        `${SALE_BASE_URL}`
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
  static async getSaleDetail(saleId: number): Promise<SaleDetailResponse> {
    try {
      return await authenticatedFetchJSON<SaleDetailResponse>(
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
   * Opens a new sale
   *
   * @param data - Sale creation data
   * @returns Created sale response
   * @throws Error if creation fails or user lacks permission
   */
  static async openSale(data: OpenSaleRequest): Promise<OpenSaleResponse> {
    try {
      return await authenticatedFetchJSON<OpenSaleResponse>(
        `${SALE_BASE_URL}/open`,
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
   * Syncs sale items (add/update/remove)
   *
   * @param saleId - ID of sale to update
   * @param data - Sync data with items
   * @returns Updated sale detail
   * @throws Error if sync fails or user lacks permission
   */
  static async syncSaleItems(
    saleId: number,
    data: SyncSaleRequest
  ): Promise<SaleDetailResponse> {
    try {
      return await authenticatedFetchJSON<SaleDetailResponse>(
        `${SALE_BASE_URL}/${saleId}/sync`,
        {
          method: 'POST',
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
      throw new Error('خطا در به‌روزرسانی آیتم‌های فروش');
    }
  }

  /**
   * Closes a sale with invoice and payments
   *
   * @param saleId - ID of sale to close
   * @param data - Close sale request with tax, discount, and payments
   * @returns Closed sale response with invoice and payment details
   * @throws Error if closing fails or user lacks permission
   */
  static async closeSale(
    saleId: number,
    data: CloseSaleRequest
  ): Promise<CloseSaleResponse> {
    try {
      return await authenticatedFetchJSON<CloseSaleResponse>(
        `${SALE_BASE_URL}/${saleId}/close`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
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
   * @param data - Cancel request with reason
   * @returns Cancelled sale response
   * @throws Error if cancellation fails or user lacks permission
   */
  static async cancelSale(
    saleId: number,
    data: CancelSaleRequest
  ): Promise<CancelSaleResponse> {
    try {
      return await authenticatedFetchJSON<CancelSaleResponse>(
        `${SALE_BASE_URL}/${saleId}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
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
