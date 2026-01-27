'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IReportListItem } from '@/types/reportType';
import { fetchReportList, approveReport } from '@/service/reportService';
import { THEME_COLORS } from '@/libs/constants';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useToast } from '@/components/common/Toast';
import { formatPersianMoney } from '@/utils/persianUtils';

type StatusFilter = 'all' | 'DRAFT' | 'APPROVED';

export default function ReportsDashboardPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  const [reports, setReports] = useState<IReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await fetchReportList(status);
      setReports(data.reports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در بارگذاری گزارش‌ها';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: number) => {
    if (!confirm('آیا از تایید این گزارش اطمینان دارید؟')) return;

    try {
      setActionLoading(reportId);
      await approveReport(reportId);
      showToast('گزارش با موفقیت تایید شد', 'success');
      await loadReports();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در تایید گزارش';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return THEME_COLORS.green;
      case 'DRAFT':
        return THEME_COLORS.orange;
      default:
        return THEME_COLORS.subtext;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'تایید شده';
      case 'DRAFT':
        return 'پیش‌نویس';
      default:
        return status;
    }
  };

  const getVarianceColor = (variance: string) => {
    const value = parseFloat(variance);
    if (value === 0) return THEME_COLORS.green;
    if (value > 0) return THEME_COLORS.blue;
    return THEME_COLORS.red;
  };

  // Group reports by status for summary
  const draftCount = reports.filter((r) => r.status === 'DRAFT').length;
  const approvedCount = reports.filter((r) => r.status === 'APPROVED').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header
        className="px-4 py-4 border-b"
        style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}
      >
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              ← بازگشت
            </button>
            <h1 className="text-2xl font-bold" style={{ color: THEME_COLORS.text }}>
              داشبورد گزارش‌ها
            </h1>
          </div>

          <button
            onClick={loadReports}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
          >
            {loading ? 'در حال بارگذاری...' : 'بروزرسانی'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>کل گزارش‌ها</div>
            <div className="text-3xl font-bold" style={{ color: THEME_COLORS.accent }}>
              {reports.length}
            </div>
          </div>
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: `${THEME_COLORS.orange}15` }}
          >
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>پیش‌نویس</div>
            <div className="text-3xl font-bold" style={{ color: THEME_COLORS.orange }}>
              {draftCount}
            </div>
          </div>
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: `${THEME_COLORS.green}15` }}
          >
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>تایید شده</div>
            <div className="text-3xl font-bold" style={{ color: THEME_COLORS.green }}>
              {approvedCount}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className="p-4 rounded-xl mb-6 flex items-center gap-4"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          <span className="font-medium" style={{ color: THEME_COLORS.text }}>
            فیلتر وضعیت:
          </span>
          <div className="flex gap-2">
            {(['all', 'DRAFT', 'APPROVED'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                style={{
                  backgroundColor: statusFilter === status ? THEME_COLORS.accent : THEME_COLORS.surface,
                  color: statusFilter === status ? '#fff' : THEME_COLORS.text,
                }}
              >
                {status === 'all' ? 'همه' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div
              className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full"
              style={{ borderColor: `${THEME_COLORS.accent} transparent transparent transparent` }}
            />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            className="p-6 rounded-xl text-center"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <div className="text-4xl mb-3" style={{ color: THEME_COLORS.red }}>!</div>
            <p className="mb-4" style={{ color: THEME_COLORS.red }}>{error}</p>
            <button
              onClick={loadReports}
              className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {/* Reports List */}
        {!loading && !error && (
          <>
            {reports.length === 0 ? (
              <div
                className="p-12 rounded-xl text-center"
                style={{ backgroundColor: THEME_COLORS.bgSecondary }}
              >
                <div className="text-6xl mb-4 opacity-50">📊</div>
                <p className="text-xl font-semibold" style={{ color: THEME_COLORS.subtext }}>
                  گزارشی یافت نشد
                </p>
                <p className="text-sm mt-2" style={{ color: THEME_COLORS.subtext }}>
                  {statusFilter !== 'all' ? 'فیلتر را تغییر دهید یا گزارش جدید ایجاد کنید' : 'گزارش جدید ایجاد کنید'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-xl transition-all hover:shadow-lg cursor-pointer"
                    style={{ backgroundColor: THEME_COLORS.bgSecondary }}
                    onClick={() => router.push(`/report/${report.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Report Info */}
                      <div className="flex items-center gap-4">
                        {/* Report ID & Date */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
                              گزارش #{report.id}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{
                                backgroundColor: `${getStatusColor(report.status)}20`,
                                color: getStatusColor(report.status),
                              }}
                            >
                              {getStatusText(report.status)}
                            </span>
                          </div>
                          <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                            تاریخ: {report.report_date}
                          </div>
                        </div>
                      </div>

                      {/* Financial Info */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                            درآمد کل
                          </div>
                          <div className="font-bold" style={{ color: THEME_COLORS.green }}>
                            {formatPersianMoney(parseFloat(report.total_revenue))}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                            مغایرت
                          </div>
                          <div className="font-bold" style={{ color: getVarianceColor(report.total_variance) }}>
                            {formatPersianMoney(parseFloat(report.total_variance))}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                            ایجاد کننده
                          </div>
                          <div className="font-medium" style={{ color: THEME_COLORS.text }}>
                            {report.created_by}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/report/${report.id}`);
                            }}
                            className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-80"
                            style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                          >
                            مشاهده جزئیات
                          </button>
                          {report.status === 'DRAFT' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(report.id);
                              }}
                              disabled={actionLoading === report.id}
                              className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-80 disabled:opacity-50"
                              style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
                            >
                              {actionLoading === report.id ? '...' : 'تایید'}
                            </button>
                          )}
                        </div>
                      </div>
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
