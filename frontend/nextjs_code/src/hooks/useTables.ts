/**
 * Custom hook for fetching available tables
 *
 * Features:
 * - Fetches tables on mount
 * - Error handling
 * - Loading states
 * - Retry mechanism
 */

import { useEffect, useState } from 'react';
import { TableApiClient, type TableSchema } from '@/libs/table/tableApiClient';

/**
 * Hook return type
 */
interface UseTablesReturn {
  tables: TableSchema[];
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
}

/**
 * Hook for fetching available tables
 */
export function useTables(): UseTablesReturn {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches tables from API
   */
  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the active tables endpoint for better performance
      const data = await TableApiClient.getActiveTables();
      setTables(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'دریافت لیست میزها با مشکل مواجه شد';
      setError(errorMessage);
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retry handler
   */
  const retry = async () => {
    await fetchTables();
  };

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchTables();
  }, []);

  return {
    tables,
    loading,
    error,
    retry,
  };
}
