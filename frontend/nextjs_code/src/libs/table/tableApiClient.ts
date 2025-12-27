/**
 * Table API client
 *
 * Handles fetching table data for sale assignment.
 */

import { CS_API_URL } from '@/libs/constants';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';

/**
 * Table schema matching backend
 */
export interface TableSchema {
  id: number;
  name: string;
  capacity: number;
  is_active: boolean;
}

/**
 * Table list response
 */
export interface TableListResponse {
  tables: TableSchema[];
  total_count: number;
  active_count: number;
}

/**
 * Base URL for table endpoints
 */
const TABLE_BASE_URL = `${CS_API_URL}/table`;

/**
 * Table API client class
 */
export class TableApiClient {
  /**
   * Fetches all tables with availability status
   *
   * @returns All tables with metadata
   * @throws Error if request fails
   */
  static async getAvailableTables(): Promise<TableListResponse> {
    try {
      return await authenticatedFetchJSON<TableListResponse>(
        `${TABLE_BASE_URL}/available`
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در دریافت لیست میزها');
    }
  }

  /**
   * Fetches only active tables (faster endpoint)
   *
   * @returns Active tables only
   * @throws Error if request fails
   */
  static async getActiveTables(): Promise<TableSchema[]> {
    try {
      return await authenticatedFetchJSON<TableSchema[]>(
        `${TABLE_BASE_URL}/active`
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در دریافت میزهای فعال');
    }
  }
}
