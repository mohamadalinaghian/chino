'use client';
import { THEME_COLORS } from '@/libs/constants';
import { useToast } from '@/components/common/Toast';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SaleCard } from '@/components/dashboard/SaleCard';

export default function SaleDashboardPage() {
  const { showToast, ToastContainer } = useToast();

  const {
    sales,
    loading,
    error,
    refreshing,
    actionLoading,
    isSuperuser,
    canCancelSale,
    filters,
    totalRevenue,
    setFilters,
    handleRefresh,
    handleCancelSale,
    loadData,
  } = useDashboard();

  const onRefresh = async () => {
    const success = await handleRefresh();
    showToast(
      success ? 'داشبورد بروزرسانی شد' : 'خطا در بروزرسانی',
      success ? 'success' : 'error'
    );
  };

  const onCancelSale = async (saleId: number) => {
    // Prompt for cancellation reason
    const reason = prompt('لطفا دلیل لغو فروش را وارد کنید:');

    if (!reason || !reason.trim()) {
      showToast('دلیل لغو الزامی است', 'warning');
      return;
    }

    if (!confirm('آیا از لغو این فروش اطمینان دارید؟')) return;

    const success = await handleCancelSale(saleId, reason.trim());
    showToast(
      success ? 'فروش لغو شد' : 'خطا در لغو فروش',
      success ? 'success' : 'error'
    );
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: THEME_COLORS.bgPrimary }}
    >
      {/* Header */}
      <DashboardHeader
        onRefresh={onRefresh}
        isRefreshing={refreshing}
        isLoading={loading}
        filterUser={filters.user}
        onFilterUserChange={(value) => setFilters({ ...filters, user: value })}
        filterTime={filters.time}
        onFilterTimeChange={(value) => setFilters({ ...filters, time: value })}
        filterState={filters.state}
        onFilterStateChange={(value) => setFilters({ ...filters, state: value })}
        isSuperuser={isSuperuser}
      />

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
              <StatsCard
                totalSales={sales.length}
                totalRevenue={totalRevenue}
              />
            )}

            {/* Sales Grid */}
            {sales.length === 0 ? (
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
                  {filters.user || filters.time !== 'all'
                    ? 'فیلترهای خود را تغییر دهید'
                    : 'برای شروع یک فروش جدید ایجاد کنید'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sales.map((sale) => (
                  <SaleCard
                    key={sale.id}
                    sale={sale}
                    isSuperuser={isSuperuser}
                    canCancelSale={canCancelSale}
                    onCancel={onCancelSale}
                    isLoading={actionLoading[sale.id]}
                  />
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
