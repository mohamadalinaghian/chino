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

export interface SalesByState {
  open: IDashboardSaleItem[];
  closed: IDashboardSaleItem[];
  canceled: IDashboardSaleItem[];
}

export interface StatsByState {
  open: { count: number; revenue: number };
  closed: { count: number; revenue: number };
  canceled: { count: number; revenue: number };
  total: { count: number; revenue: number };
}

export function useDashboard() {
  const [sales, setSales] = useState<IDashboardSaleItem[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  // Filters - Default to today and OPEN sales
  const [filters, setFilters] = useState<DashboardFilters>({
    user: '',
    time: 'today', // Default to today's sales
    state: 'OPEN', // Default to show only OPEN sales
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

  // Filter sales by user and time
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

  // Group sales by state for sectioned display
  const salesByState = useMemo((): SalesByState => {
    const open: IDashboardSaleItem[] = [];
    const closed: IDashboardSaleItem[] = [];
    const canceled: IDashboardSaleItem[] = [];

    filteredSales.forEach((sale) => {
      switch (sale.state) {
        case 'OPEN':
          open.push(sale);
          break;
        case 'CLOSED':
          closed.push(sale);
          break;
        case 'CANCELED':
          canceled.push(sale);
          break;
      }
    });

    return { open, closed, canceled };
  }, [filteredSales]);

  // Calculate stats by state - only if superuser
  const statsByState = useMemo((): StatsByState | null => {
    if (!isSuperuser) return null;

    const calculateRevenue = (sales: IDashboardSaleItem[]) => {
      return sales.reduce((sum, sale) => {
        const amount =
          sale.total_amount !== null && sale.total_amount !== undefined
            ? Number(sale.total_amount)
            : 0;
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);
    };

    const openStats = {
      count: salesByState.open.length,
      revenue: calculateRevenue(salesByState.open),
    };

    const closedStats = {
      count: salesByState.closed.length,
      revenue: calculateRevenue(salesByState.closed),
    };

    const canceledStats = {
      count: salesByState.canceled.length,
      revenue: calculateRevenue(salesByState.canceled),
    };

    return {
      open: openStats,
      closed: closedStats,
      canceled: canceledStats,
      total: {
        count: openStats.count + closedStats.count + canceledStats.count,
        revenue: openStats.revenue + closedStats.revenue + canceledStats.revenue,
      },
    };
  }, [salesByState, isSuperuser]);

  // Legacy: Calculate total revenue for backwards compatibility
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

  // Section visibility based on filter state
  // When a specific state is selected (not 'all'), only show that section
  const showOpenSection = filters.state === 'all' || filters.state === 'OPEN';
  const showClosedSection = filters.state === 'all' || filters.state === 'CLOSED';
  const showCanceledSection = filters.state === 'all' || filters.state === 'CANCELED';

  return {
    // State
    sales: filteredSales,
    salesByState,
    statsByState,
    loading,
    error,
    refreshing,
    actionLoading,
    isSuperuser,
    canCancelSale,
    filters,
    totalRevenue,

    // Section visibility
    showOpenSection,
    showClosedSection,
    showCanceledSection,

    // Actions
    setFilters,
    handleRefresh,
    handleCancelSale,
    loadData,
  };
}
