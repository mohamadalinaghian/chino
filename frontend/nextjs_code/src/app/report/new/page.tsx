'use client';

import { useRouter } from 'next/navigation';
import { THEME_COLORS } from '@/libs/constants';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useReportForm } from '@/hooks/useReportForm';
import { ReportFormSection } from '@/components/report/ReportFormSection';
import { ReportFormField } from '@/components/report/ReportFormField';
import { ReportFormSummary } from '@/components/report/ReportFormSummary';
import { JalaliDatePicker } from '@/components/report/JalaliDatePicker';
import { CardTransferWidget } from '@/components/report/CardTransferWidget';

/**
 * ReportCreatePage
 * Page for creating new daily reports
 */
export default function ReportCreatePage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  const handleSuccess = (reportId: number) => {
    showToast('گزارش با موفقیت ایجاد شد', 'success');
    setTimeout(() => {
      router.push(`/report/${reportId}`);
    }, 1000);
  };

  const handleError = (message: string) => {
    showToast(message, 'error');
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setFieldTouched,
    handleSubmit,
    resetForm,
    setConfirmedCardTransferTotal,
    calculatedTotals,
  } = useReportForm({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const onSubmit = async () => {
    await handleSubmit();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header
        className="px-4 py-4 border-b sticky top-0 z-10"
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
              ایجاد گزارش جدید
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetForm}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              پاک کردن فرم
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !isValid}
              className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
            >
              {isSubmitting ? 'در حال ذخیره...' : 'ذخیره گزارش'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Sections - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Section */}
            <ReportFormSection
              title="اطلاعات پایه"
              icon="📅"
              description="تاریخ و اطلاعات اولیه گزارش"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <JalaliDatePicker
                  value={values.report_date || ''}
                  onChange={(v) => setValue('report_date', v)}
                  label="تاریخ گزارش"
                  error={errors.report_date}
                  touched={touched.report_date}
                  required
                />
                <ReportFormField
                  label="موجودی اولیه صندوق"
                  name="open_floating_cash"
                  type="number"
                  value={values.open_floating_cash ?? 0}
                  onChange={(v) => setValue('open_floating_cash', v as number)}
                  onBlur={() => setFieldTouched('open_floating_cash')}
                  error={errors.open_floating_cash}
                  touched={touched.open_floating_cash}
                  required
                  icon="💰"
                  helpText="مبلغ نقدی موجود در صندوق در ابتدای روز"
                />
              </div>
            </ReportFormSection>

            {/* Cash Section */}
            <ReportFormSection
              title="وجه نقد"
              icon="💵"
              description="اطلاعات نقدی صندوق"
            >
              <ReportFormField
                label="نقدی شمارش شده"
                name="closing_cash_counted"
                type="number"
                value={values.closing_cash_counted ?? 0}
                onChange={(v) => setValue('closing_cash_counted', v as number)}
                onBlur={() => setFieldTouched('closing_cash_counted')}
                error={errors.closing_cash_counted}
                touched={touched.closing_cash_counted}
                required
                icon="🧮"
                helpText="مبلغ کل نقدی شمارش شده در پایان روز"
              />
            </ReportFormSection>

            {/* POS Section */}
            <ReportFormSection
              title="کارتخوان"
              icon="🏧"
              description="گزارش دستگاه کارتخوان"
            >
              <ReportFormField
                label="مجموع گزارش کارتخوان"
                name="pos_report"
                type="number"
                value={values.pos_report ?? 0}
                onChange={(v) => setValue('pos_report', v as number)}
                onBlur={() => setFieldTouched('pos_report')}
                error={errors.pos_report}
                touched={touched.pos_report}
                required
                icon="💳"
                helpText="مجموع فروش از گزارش دستگاه کارتخوان"
              />
            </ReportFormSection>

            {/* Card Transfers Section */}
            <CardTransferWidget
              onTotalChange={setConfirmedCardTransferTotal}
              reportDate={values.report_date}
            />

            {/* Notes Section */}
            <ReportFormSection
              title="یادداشت"
              icon="📝"
              description="توضیحات اضافی (اختیاری)"
            >
              <ReportFormField
                label="یادداشت"
                name="note"
                type="textarea"
                value={values.note || ''}
                onChange={(v) => setValue('note', v as string)}
                onBlur={() => setFieldTouched('note')}
                placeholder="توضیحات یا نکات مهم روز را اینجا بنویسید..."
                helpText="این فیلد اختیاری است"
              />
            </ReportFormSection>
          </div>

          {/* Summary Panel - 1 column on large screens, sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <ReportFormSummary
                openingFloat={calculatedTotals.openingFloat}
                closingCash={calculatedTotals.closingCash}
                posTotal={calculatedTotals.posTotal}
                cardTransferTotal={calculatedTotals.cardTransferTotal}
                cashReceived={calculatedTotals.cashReceived}
                totalIncome={calculatedTotals.totalIncome}
              />

              {/* Submit Button - Mobile */}
              <div className="mt-6 lg:hidden">
                <button
                  onClick={onSubmit}
                  disabled={isSubmitting || !isValid}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
                >
                  {isSubmitting ? 'در حال ذخیره...' : 'ذخیره گزارش'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSubmitting && <LoadingOverlay message="در حال ذخیره گزارش..." />}
      <ToastContainer />
    </div>
  );
}
