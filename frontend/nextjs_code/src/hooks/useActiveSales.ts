import { useEffect, useRef, useState } from 'react';
import { CS_API_URL, STORAGE_KEYS } from '@/libs/constants';

type SaleDashboardItem = {
  id: number;
  table?: string | null;
  guest_name?: string | null;
  opened_by_name: string;
  opened_at: string;
  total_amount?: string;
};

type Response = {
  active_sales: SaleDashboardItem[];
  total_count: number;
};

export function useActiveSales() {
  const [sales, setSales] = useState<SaleDashboardItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem(
        STORAGE_KEYS.ACCESS_TOKEN
      );

      const res = await fetch(`${CS_API_URL}/sale`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        cache: 'no-store',
      });

      if (!res.ok) throw new Error();

      const data: Response = await res.json();
      setSales(data.active_sales);
      setTotalCount(data.total_count);
      setError(null);
    } catch {
      setError('دریافت اطلاعات فروش با مشکل مواجه شد');
    }
  };

  useEffect(() => {
    fetchSales();

    pollingRef.current = setInterval(fetchSales, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    sales,
    totalCount,
    error,
    retry: fetchSales,
  };
}
