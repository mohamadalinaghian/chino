'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { IReportDetails } from '@/types/reportType';
import { fetchReportDetails } from '@/service/reportService';
import { THEME_COLORS } from '@/libs/constants';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useToast } from '@/components/common/Toast';
import { ReportHeader } from '@/components/report/ReportHeader';
import { ReportSummaryCard } from '@/components/report/ReportSummaryCard';
import { ReportRevenueSection } from '@/components/report/ReportRevenueSection';
import { ReportVarianceSection } from '@/components/report/ReportVarianceSection';
import { ReportNotesSection } from '@/components/report/ReportNotesSection';

export default function ReportDetailsPage() {
  const params = useParams();
  const reportId = parseInt(params.id as string);
  const { showToast, ToastContainer } = useToast();

  const [report, setReport] = useState<IReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportData();
  }, [reportId]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchReportDetails(reportId);
      setReport(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در بارگذاری گزارش';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message="در حال بارگذاری گزارش..." />;
  }

  if (error || !report) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: THEME_COLORS.bgPrimary }}
      >
        <div className="text-center p-8">
          <div className="text-6xl mb-4">!</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: THEME_COLORS.text }}>
            خطا در بارگذاری گزارش
          </h2>
          <p className="mb-4" style={{ color: THEME_COLORS.subtext }}>
            {error || 'گزارش یافت نشد'}
          </p>
          <button
            onClick={loadReportData}
            className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
            style={{
              backgroundColor: THEME_COLORS.accent,
              color: '#fff',
            }}
          >
            تلاش مجدد
          </button>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: THEME_COLORS.bgPrimary }}
    >
      {/* Header */}
      <ReportHeader
        reportId={reportId}
        reportDate={report.report_date}
        status={report.status}
        creator={report.creator}
      />

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ReportSummaryCard
            title="فروش کل"
            value={report.expected_total_sales}
            icon="$"
            valueColor={THEME_COLORS.green}
          />
          <ReportSummaryCard
            title="درآمد کل"
            value={report.total_revenue}
            icon="+"
            valueColor={THEME_COLORS.blue}
          />
          <ReportSummaryCard
            title="سود خالص"
            value={report.net_profit}
            icon="="
            valueColor={report.net_profit >= 0 ? THEME_COLORS.green : THEME_COLORS.red}
          />
          <ReportSummaryCard
            title="مغایرت کل"
            value={report.total_variance}
            icon="~"
            valueColor={
              report.total_variance === 0
                ? THEME_COLORS.green
                : report.total_variance > 0
                  ? THEME_COLORS.blue
                  : THEME_COLORS.red
            }
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Revenue Details */}
          <ReportRevenueSection
            totalSales={report.expected_total_sales}
            totalRefunds={report.expected_total_refunds}
            totalDiscount={report.expected_total_discount}
            totalTax={report.expected_total_tax}
            cogs={report.cogs}
            totalExpenses={report.total_expenses}
            totalRevenue={report.total_revenue}
            netProfit={report.net_profit}
          />

          {/* Right Column - Variance Details */}
          <ReportVarianceSection
            cashVariance={report.cash_variance}
            posVariance={report.pos_variance}
            cardTransferVariance={report.card_transfer_variance}
            totalVariance={report.total_variance}
            openingFloat={report.opening_float}
            closingCashCounted={report.closing_cash_counted}
            netCashReceived={report.net_cash_received}
            expectedCashTotal={report.expected_cash_total}
            actualPosTotal={report.actual_pos_total}
            actualIncome={report.actual_income}
          />
        </div>

        {/* Notes Section */}
        <div className="mt-6">
          <ReportNotesSection
            notes={report.notes}
            approvedBy={report.approved_by}
          />
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
