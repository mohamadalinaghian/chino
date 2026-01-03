'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IDashboardSaleItem, IUserPermissions } from '@/types/sale';
import { fetchDashboard, cancelSale } from '@/service/sale';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL, THEME_COLORS } from '@/libs/constants';
import { useToast } from '@/components/common/Toast';
import { getCurrentJalaliDate, toPersianDigits, formatPersianMoney } from '@/utils/persianUtils';
import jalaliMoment from 'jalali-moment';

export default function SaleDashboardPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  const [sales, setSales] = useState<IDashboardSaleItem[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterTime, setFilterTime] = useState<'all' | 'today' | 'last_hour'>('all');

  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch permissions and dashboard data in parallel
      const [dashboardData, userInfo] = await Promise.all([
        fetchDashboard(),
        authenticatedFetchJSON<IUserPermissions>(`${CS_API_URL}/auth/me`),
      ]);

      setSales(dashboardData.active_sales);
      setPermissions(userInfo.permissions);
      setIsSuperuser(userInfo.is_staff); // Use is_staff as superuser indicator
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری داشبورد');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await fetchDashboard();
      setSales(data.active_sales);
      showToast('داشبورد بروزرسانی شد', 'success');
    } catch (err) {
      showToast('خطا در بروزرسانی', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelSale = async (saleId: number) => {
    // Prompt for cancellation reason
    const reason = prompt('لطفا دلیل لغو فروش را وارد کنید:');

    if (!reason || !reason.trim()) {
      showToast('دلیل لغو الزامی است', 'warning');
      return;
    }

    if (!confirm('آیا از لغو این فروش اطمینان دارید؟')) return;

    try {
      setActionLoading((prev) => ({ ...prev, [saleId]: true }));
      await cancelSale(saleId, reason.trim());
      showToast('فروش لغو شد', 'success');
      // Reload data after canceling
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در لغو فروش', 'error');
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
    if (filterUser.trim()) {
      filtered = filtered.filter((sale) =>
        sale.opened_by_name.toLowerCase().includes(filterUser.toLowerCase())
      );
    }

    // Filter by time
    if (filterTime === 'today') {
      const today = jalaliMoment().startOf('day');
      filtered = filtered.filter((sale) => jalaliMoment(sale.opened_at).isSameOrAfter(today));
    } else if (filterTime === 'last_hour') {
      const lastHour = jalaliMoment().subtract(1, 'hour');
      filtered = filtered.filter((sale) => jalaliMoment(sale.opened_at).isSameOrAfter(lastHour));
    }

    // Sort by oldest first (ascending order)
    return filtered.sort((a, b) =>
      new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
    );
  }, [sales, filterUser, filterTime]);

  // Calculate stats - only if superuser
  const totalRevenue = useMemo(() => {
    if (!isSuperuser) return null;
    return filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  }, [filteredSales, isSuperuser]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: THEME_COLORS.bgPrimary }}
    >
      {/* Header */}
      <header
        className="p-4 border-b shadow-sm"
        style={{
          backgroundColor: THEME_COLORS.bgSecondary,
          borderColor: THEME_COLORS.border,
        }}
      >
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h1
              className="text-3xl font-bold"
              style={{ color: THEME_COLORS.text }}
            >
              داشبورد فروش
            </h1>
            <div className="flex gap-2 items-center">
              <span style={{ color: THEME_COLORS.subtext }} className="text-sm">
                {getCurrentJalaliDate('dddd، jD jMMMM jYYYY')}
              </span>
              <button
                onClick={() => router.push('/sale/new')}
                className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90"
                style={{
                  backgroundColor: THEME_COLORS.green,
                  color: '#fff',
                }}
              >
                + فروش جدید
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: THEME_COLORS.accent,
                  color: '#fff',
                }}
              >
                {refreshing ? '🔄 در حال بروزرسانی...' : '🔄 بروزرسانی'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="جستجوی کاربر..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-4 py-2 rounded-lg border outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: THEME_COLORS.surface,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text,
              }}
            />

            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value as any)}
              className="px-4 py-2 rounded-lg border outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: THEME_COLORS.surface,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text,
              }}
            >
              <option value="all">همه زمان‌ها</option>
              <option value="today">امروز</option>
              <option value="last_hour">یک ساعت اخیر</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto p-4">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div
              className="animate-spin w-16 h-16 border-4 border-t-transparent rounded-full"
              style={{
                borderColor: `${THEME_COLORS.accent} transparent transparent transparent`,
              }}
            />
          </div>
        )}

        {error && (
          <div
            className="p-6 rounded-lg text-center"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <div className="text-4xl mb-3" style={{ color: THEME_COLORS.red }}>
              ⚠️
            </div>
            <p className="mb-4" style={{ color: THEME_COLORS.red }}>
              {error}
            </p>
            <button
              onClick={loadData}
              className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
              style={{
                backgroundColor: THEME_COLORS.accent,
                color: '#fff',
              }}
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats Card - Only show if user is superuser */}
            {isSuperuser && totalRevenue !== null && (
              <div
                className="p-6 rounded-lg mb-4 shadow-md"
                style={{ backgroundColor: THEME_COLORS.bgSecondary }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div
                      className="text-sm mb-1"
                      style={{ color: THEME_COLORS.subtext }}
                    >
                      تعداد فروش‌های باز
                    </div>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: THEME_COLORS.accent }}
                    >
                      {toPersianDigits(filteredSales.length)}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-sm mb-1"
                      style={{ color: THEME_COLORS.subtext }}
                    >
                      مجموع درآمد
                    </div>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: THEME_COLORS.green }}
                    >
                      {formatPersianMoney(totalRevenue)}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-sm mb-1"
                      style={{ color: THEME_COLORS.subtext }}
                    >
                      میانگین هر سفارش
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: THEME_COLORS.text }}
                    >
                      {filteredSales.length > 0
                        ? formatPersianMoney(totalRevenue / filteredSales.length)
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Grid */}
            {filteredSales.length === 0 ? (
              <div
                className="p-12 rounded-lg text-center"
                style={{ backgroundColor: THEME_COLORS.bgSecondary }}
              >
                <div className="text-6xl mb-4 opacity-50">📊</div>
                <p
                  className="text-xl font-semibold"
                  style={{ color: THEME_COLORS.subtext }}
                >
                  فروش بازی یافت نشد
                </p>
                <p className="text-sm mt-2" style={{ color: THEME_COLORS.subtext }}>
                  {filterUser || filterTime !== 'all'
                    ? 'فیلترهای خود را تغییر دهید'
                    : 'برای شروع یک فروش جدید ایجاد کنید'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-4 rounded-lg shadow-md border transition-all hover:shadow-lg"
                    style={{
                      backgroundColor: THEME_COLORS.bgSecondary,
                      borderColor: THEME_COLORS.border,
                    }}
                  >
                    {/* Sale Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: THEME_COLORS.text }}
                        >
                          {sale.table || 'بیرون‌بر'}
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: THEME_COLORS.subtext }}
                        >
                          شماره: {toPersianDigits(sale.id)}
                        </div>
                      </div>
                      {isSuperuser && sale.total_amount !== null && (
                        <div
                          className="text-xl font-bold"
                          style={{ color: THEME_COLORS.green }}
                        >
                          {formatPersianMoney(sale.total_amount)}
                        </div>
                      )}
                    </div>

                    {/* Sale Details */}
                    <div className="space-y-2 mb-4">
                      {sale.guest_name && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: THEME_COLORS.subtext }}>مهمان:</span>
                          <span style={{ color: THEME_COLORS.text }}>
                            {sale.guest_name}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span style={{ color: THEME_COLORS.subtext }}>کاربر:</span>
                        <span style={{ color: THEME_COLORS.text }}>
                          {sale.opened_by_name}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: THEME_COLORS.subtext }}>زمان:</span>
                        <span style={{ color: THEME_COLORS.text }}>
                          {jalaliMoment(sale.opened_at).locale('fa').fromNow()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => router.push(`/sale/${sale.id}/edit`)}
                        className="py-2 px-3 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                        style={{
                          backgroundColor: THEME_COLORS.surface,
                          color: THEME_COLORS.text,
                        }}
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        onClick={() => router.push(`/sale/${sale.id}/payment`)}
                        className="py-2 px-3 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                        style={{
                          backgroundColor: THEME_COLORS.accent,
                          color: '#fff',
                        }}
                      >
                        💳 پرداخت
                      </button>
                      {canCancelSale && (
                        <button
                          onClick={() => handleCancelSale(sale.id)}
                          disabled={actionLoading[sale.id]}
                          className="col-span-2 py-2 px-3 rounded-lg text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                          style={{
                            backgroundColor: `${THEME_COLORS.red}20`,
                            color: THEME_COLORS.red,
                          }}
                        >
                          {actionLoading[sale.id] ? '⏳ در حال لغو...' : '✕ لغو فروش'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
