/**
 * Custom hook for fetching and managing active sales
 *
 * Features:
 * - Auto-refresh with polling
 * - Pause polling when tab inactive (performance optimization)
 * - Proper error handling
 * - Loading states
 * - Uses centralized API client
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { SaleApiClient } from '@/libs/sale/saleApiClient';
import { SaleDashboardItem } from '@/types/saleType';

/**
 * Polling interval in milliseconds
 */
const POLL_INTERVAL_MS = 5000; // 5 seconds

/**
 * Hook return type
 */
interface UseActiveSalesReturn {
  sales: SaleDashboardItem[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing active sales dashboard
 */
export function useActiveSales(): UseActiveSalesReturn {
  const [sales, setSales] = useState<SaleDashboardItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  /**
   * Fetches sales from API
   */
  const fetchSales = useCallback(async () => {
    try {
      const data = await SaleApiClient.getDashboard();

      setSales(data.active_sales);
      setTotalCount(data.total_count);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'دریافت اطلاعات فروش با مشکل مواجه شد';

      setError(errorMessage);
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Retry handler - clears error and refetches
   */
  const retry = useCallback(async () => {
    setError(null);
    setLoading(true);
    await fetchSales();
  }, [fetchSales]);

  /**
   * Manual refresh - force refetch
   */
  const refresh = useCallback(async () => {
    await fetchSales();
  }, [fetchSales]);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // Already polling

    pollingRef.current = setInterval(() => {
      if (isActiveRef.current) {
        fetchSales();
      }
    }, POLL_INTERVAL_MS);
  }, [fetchSales]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /**
   * Handle tab visibility change
   * Pause polling when tab is inactive to save resources
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;

      if (!document.hidden) {
        // Tab became active - refresh immediately
        fetchSales();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSales]);

  /**
   * Initial fetch and start polling
   */
  useEffect(() => {
    fetchSales();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchSales, startPolling, stopPolling]);

  return {
    sales,
    totalCount,
    loading,
    error,
    retry,
    refresh,
  };
}
