import { useState, useEffect, useMemo } from 'react';
import { IDashboardSaleItem, IUserPermissions } from '@/types/sale';
import { fetchDashboard, cancelSale } from '@/service/sale';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL } from '@/libs/constants';
import jalaliMoment from 'jalali-moment';

export type SaleStateFilter = 'OPEN' | 'CLOSED' | 'CANCELED' | 'all';

export interface DashboardFilters {
  user: string;
  time: 'all' | 'today' | 'last_hour';
  state: SaleStateFilter;
}

export function useDashboard() {
  const [sales, setSales] = useState<IDashboardSaleItem[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  // Filters
  const [filters, setFilters] = useState<DashboardFilters>({
    user: '',
    time: 'all',
    state: 'OPEN',
  });

  useEffect(() => {
    loadData();
  }, [filters.state]); // Reload when state filter changes

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch permissions and dashboard data in parallel
      const [dashboardData, userInfo] = await Promise.all([
        fetchDashboard(filters.state),
        authenticatedFetchJSON<IUserPermissions>(`${CS_API_URL}/auth/me`),
      ]);

      setSales(dashboardData.active_sales);
      setPermissions(userInfo.permissions);
      setIsSuperuser(userInfo.is_superuser || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری داشبورد');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await fetchDashboard(filters.state);
      setSales(data.active_sales);
      return true;
    } catch (err) {
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelSale = async (saleId: number, reason: string): Promise<boolean> => {
    try {
      setActionLoading((prev) => ({ ...prev, [saleId]: true }));
      await cancelSale(saleId, reason);
      await loadData();
      return true;
    } catch (err) {
      return false;
    } finally {
      setActionLoading((prev) => ({ ...prev, [saleId]: false }));
    }
  };

  // Permission checks
  const hasPermission = (perm: string) => permissions.includes(perm);
  const canCancelSale = hasPermission('sale.cancel_sale');

  // Filter and sort sales
  const filteredSales = useMemo(() => {
    let filtered = sales;

    // Filter by user
    if (filters.user.trim()) {
      filtered = filtered.filter((sale) =>
        sale.opened_by_name.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    // Filter by time
    if (filters.time === 'today') {
      const today = jalaliMoment().startOf('day');
      filtered = filtered.filter((sale) => jalaliMoment(sale.opened_at).isSameOrAfter(today));
    } else if (filters.time === 'last_hour') {
      const lastHour = jalaliMoment().subtract(1, 'hour');
      filtered = filtered.filter((sale) => jalaliMoment(sale.opened_at).isSameOrAfter(lastHour));
    }

    // Sort by oldest first (ascending order)
    return filtered.sort((a, b) =>
      new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
    );
  }, [sales, filters]);

  // TODO: better permissions controlling for this
  // Calculate stats - only if superuser
  const totalRevenue = useMemo(() => {
    if (!isSuperuser) return null;

    return filteredSales.reduce((sum, sale) => {
      const amount =
        sale.total_amount !== null && sale.total_amount !== undefined
          ? Number(sale.total_amount)
          : 0;

      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }, [filteredSales, isSuperuser]);

  return {
    // State
    sales: filteredSales,
    loading,
    error,
    refreshing,
    actionLoading,
    isSuperuser,
    canCancelSale,
    filters,
    totalRevenue,

    // Actions
    setFilters,
    handleRefresh,
    handleCancelSale,
    loadData,
  };
}
