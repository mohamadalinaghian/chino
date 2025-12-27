/**
 * Menu API client for new sale page
 *
 * Handles fetching menu items and extras with proper authentication.
 */

import { CS_API_URL } from '@/libs/constants';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import type { MenuSaleResponse, ProductExtra } from '@/types/newSaleTypes';

/**
 * Base URL for menu endpoints
 */
const MENU_BASE_URL = `${CS_API_URL}/menu`;

/**
 * Menu API client class
 * Centralizes all menu-related API operations for sale creation
 */
export class MenuApiClient {
  /**
   * Fetches menu items grouped by category for new sale page
   *
   * @returns Menu items grouped by BAR and FOOD categories
   * @throws Error if request fails
   */
  static async getSaleMenu(): Promise<MenuSaleResponse> {
    try {
      return await authenticatedFetchJSON<MenuSaleResponse>(
        `${MENU_BASE_URL}/sale/menu`
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در دریافت منوی فروش');
    }
  }

  /**
   * Fetches available extra products (lazy-loaded)
   *
   * Only fetched when user clicks "Add Extra" button.
   * Returns sellable products like syrups, toppings, etc.
   *
   * @returns List of available extra products
   * @throws Error if request fails
   */
  static async getExtras(): Promise<ProductExtra[]> {
    try {
      return await authenticatedFetchJSON<ProductExtra[]>(
        `${MENU_BASE_URL}/sale/extras`
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در دریافت لیست افزودنی‌ها');
    }
  }
}
