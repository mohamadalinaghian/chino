'use client';
import { THEME_COLORS } from '@/libs/constants';
import { useToast } from '@/components/common/Toast';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SaleCard } from '@/components/dashboard/SaleCard';
import { IDashboardSaleItem } from '@/types/sale';
import { formatPersianMoney } from '@/utils/persianUtils';

interface SaleSectionProps {
  title: string;
  sales: IDashboardSaleItem[];
  isSuperuser: boolean;
  canCancelSale: boolean;
  onCancel: (id: number) => void;
  actionLoading: { [key: number]: boolean };
  stats?: { count: number; revenue: number };
  color: string;
  icon: string;
  defaultExpanded?: boolean;
}

function SaleSection({
  title,
  sales,
  isSuperuser,
  canCancelSale,
  onCancel,
  actionLoading,
  stats,
  color,
  icon,
  defaultExpanded = true,
}: SaleSectionProps) {
  if (sales.length === 0 && !defaultExpanded) return null;

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div
        className="flex items-center justify-between p-4 rounded-t-xl"
        style={{ backgroundColor: `${color}20` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-lg font-bold" style={{ color }}>
            {title}
          </h2>
          <span
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{ backgroundColor: color, color: '#fff' }}
          >
            {sales.length}
          </span>
        </div>
        {isSuperuser && stats && (
          <div className="text-sm font-medium" style={{ color }}>
            مجموع: {formatPersianMoney(stats.revenue)}
          </div>
        )}
      </div>

      {/* Section Content */}
      <div
        className="p-4 rounded-b-xl border-t-0"
        style={{
          backgroundColor: THEME_COLORS.bgSecondary,
          borderColor: `${color}30`,
        }}
      >
        {sales.length === 0 ? (
          <div className="text-center py-8" style={{ color: THEME_COLORS.subtext }}>
            هیچ فروشی در این بخش وجود ندارد
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sales.map((sale) => (
              <SaleCard
                key={sale.id}
                sale={sale}
                isSuperuser={isSuperuser}
                canCancelSale={canCancelSale}
                onCancel={onCancel}
                isLoading={actionLoading[sale.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SaleDashboardPage() {
  const { showToast, ToastContainer } = useToast();

  const {
    salesByState,
    statsByState,
    loading,
    error,
    refreshing,
    actionLoading,
    isSuperuser,
    canCancelSale,
    filters,
    setFilters,
    handleRefresh,
    handleCancelSale,
    loadData,
    showOpenSection,
    showClosedSection,
    showCanceledSection,
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

  const totalSales =
    salesByState.open.length + salesByState.closed.length + salesByState.canceled.length;

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
            {/* Summary Stats Card */}
            {isSuperuser && statsByState && (
              <div
                className="mb-6 p-4 rounded-xl"
                style={{ backgroundColor: THEME_COLORS.bgSecondary }}
              >
                <h3 className="text-lg font-bold mb-4" style={{ color: THEME_COLORS.text }}>
                  خلاصه وضعیت
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${THEME_COLORS.orange}15` }}
                  >
                    <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                      باز
                    </div>
                    <div className="text-2xl font-bold" style={{ color: THEME_COLORS.orange }}>
                      {statsByState.open.count}
                    </div>
                    <div className="text-sm" style={{ color: THEME_COLORS.orange }}>
                      {formatPersianMoney(statsByState.open.revenue)}
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${THEME_COLORS.green}15` }}
                  >
                    <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                      بسته شده
                    </div>
                    <div className="text-2xl font-bold" style={{ color: THEME_COLORS.green }}>
                      {statsByState.closed.count}
                    </div>
                    <div className="text-sm" style={{ color: THEME_COLORS.green }}>
                      {formatPersianMoney(statsByState.closed.revenue)}
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${THEME_COLORS.red}15` }}
                  >
                    <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                      لغو شده
                    </div>
                    <div className="text-2xl font-bold" style={{ color: THEME_COLORS.red }}>
                      {statsByState.canceled.count}
                    </div>
                    <div className="text-sm" style={{ color: THEME_COLORS.red }}>
                      {formatPersianMoney(statsByState.canceled.revenue)}
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${THEME_COLORS.accent}15` }}
                  >
                    <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                      مجموع
                    </div>
                    <div className="text-2xl font-bold" style={{ color: THEME_COLORS.accent }}>
                      {statsByState.total.count}
                    </div>
                    <div className="text-sm" style={{ color: THEME_COLORS.accent }}>
                      {formatPersianMoney(statsByState.total.revenue)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {totalSales === 0 ? (
              <div
                className="p-12 rounded-lg text-center"
                style={{ backgroundColor: THEME_COLORS.bgSecondary }}
              >
                <div className="text-6xl mb-4 opacity-50">📊</div>
                <p
                  className="text-xl font-semibold"
                  style={{ color: THEME_COLORS.subtext }}
                >
                  فروش یافت نشد
                </p>
                <p className="text-sm mt-2" style={{ color: THEME_COLORS.subtext }}>
                  {filters.user || filters.time !== 'today' || filters.state !== 'OPEN'
                    ? 'فیلترهای خود را تغییر دهید'
                    : 'برای شروع یک فروش جدید ایجاد کنید'}
                </p>
              </div>
            ) : (
              <>
                {/* Open Sales Section - Only show when filter allows */}
                {showOpenSection && (
                  <SaleSection
                    title="فروش‌های باز"
                    sales={salesByState.open}
                    isSuperuser={isSuperuser}
                    canCancelSale={canCancelSale}
                    onCancel={onCancelSale}
                    actionLoading={actionLoading}
                    stats={statsByState?.open}
                    color={THEME_COLORS.orange}
                    icon="🟠"
                    defaultExpanded={true}
                  />
                )}

                {/* Closed Sales Section - Only show when filter allows */}
                {showClosedSection && (
                  <SaleSection
                    title="فروش‌های بسته شده"
                    sales={salesByState.closed}
                    isSuperuser={isSuperuser}
                    canCancelSale={canCancelSale}
                    onCancel={onCancelSale}
                    actionLoading={actionLoading}
                    stats={statsByState?.closed}
                    color={THEME_COLORS.green}
                    icon="🟢"
                    defaultExpanded={true}
                  />
                )}

                {/* Canceled Sales Section - Only show when filter allows */}
                {showCanceledSection && (
                  <SaleSection
                    title="فروش‌های لغو شده"
                    sales={salesByState.canceled}
                    isSuperuser={isSuperuser}
                    canCancelSale={canCancelSale}
                    onCancel={onCancelSale}
                    actionLoading={actionLoading}
                    stats={statsByState?.canceled}
                    color={THEME_COLORS.red}
                    icon="🔴"
                    defaultExpanded={false}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
