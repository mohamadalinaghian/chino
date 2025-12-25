import { useCallback, useEffect, useRef, useState } from 'react';
import { SaleApiClient } from './saleApiClient';
import { DashboardItem } from '@/types/saleType';

const POLL_INTERVAL_MS = 30_000;

export function useDashboard() {
  const [sales, setSales] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await SaleApiClient.getDashboard();
      setSales(data.active_sales);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    intervalRef.current = setInterval(loadDashboard, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadDashboard]);

  return {
    sales,
    loading,
    error,
    reload: loadDashboard,
  };
}
