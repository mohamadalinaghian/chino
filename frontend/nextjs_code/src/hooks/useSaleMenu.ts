/**
 * Custom hook for fetching and managing sale menu data
 *
 * Features:
 * - Fetches menu items grouped by category
 * - Error handling
 * - Loading states
 * - Uses centralized API client
 */

import { useEffect, useState } from 'react';
import { MenuApiClient } from '@/libs/menu/menuApiClient';
import type { MenuSaleResponse } from '@/types/newSaleTypes';

/**
 * Hook return type
 */
interface UseSaleMenuReturn {
  menuData: MenuSaleResponse | null;
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
}

/**
 * Hook for fetching sale menu data
 */
export function useSaleMenu(): UseSaleMenuReturn {
  const [menuData, setMenuData] = useState<MenuSaleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches menu data from API
   */
  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MenuApiClient.getSaleMenu();
      setMenuData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'دریافت منو با مشکل مواجه شد';
      setError(errorMessage);
      console.error('Error fetching sale menu:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retry handler
   */
  const retry = async () => {
    await fetchMenu();
  };

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchMenu();
  }, []);

  return {
    menuData,
    loading,
    error,
    retry,
  };
}
