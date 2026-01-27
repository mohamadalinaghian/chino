'use client';

import { useRouter } from 'next/navigation';
import { THEME_COLORS } from '@/libs/constants';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useReportForm } from '@/hooks/useReportForm';
import { ReportFormSection } from '@/components/report/ReportFormSection';
import { ReportFormField } from '@/components/report/ReportFormField';
import { ReportFormSummary } from '@/components/report/ReportFormSummary';
import { ICreateReportInput } from '@/types/reportCreate';

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
                <ReportFormField
                  label="تاریخ گزارش"
                  name="report_date"
                  type="date"
                  value={values.report_date || ''}
                  onChange={(v) => setValue('report_date', v as string)}
                  onBlur={() => setFieldTouched('report_date')}
                  error={errors.report_date}
                  touched={touched.report_date}
                  required
                  helpText="تاریخ روزی که گزارش برای آن تنظیم می‌شود"
                />
                <ReportFormField
                  label="موجودی اولیه صندوق"
                  name="opening_float"
                  type="number"
                  value={values.opening_float ?? 0}
                  onChange={(v) => setValue('opening_float', v as number)}
                  onBlur={() => setFieldTouched('opening_float')}
                  error={errors.opening_float}
                  touched={touched.opening_float}
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

            {/* Electronic Payments Section */}
            <ReportFormSection
              title="پرداخت‌های الکترونیکی"
              icon="💳"
              description="اطلاعات کارتخوان و کارت به کارت"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReportFormField
                  label="مجموع کارتخوان"
                  name="actual_pos_total"
                  type="number"
                  value={values.actual_pos_total ?? 0}
                  onChange={(v) => setValue('actual_pos_total', v as number)}
                  onBlur={() => setFieldTouched('actual_pos_total')}
                  error={errors.actual_pos_total}
                  touched={touched.actual_pos_total}
                  required
                  icon="🏧"
                  helpText="مجموع تراکنش‌های کارتخوان"
                />
                <ReportFormField
                  label="مجموع کارت به کارت"
                  name="actual_card_transfer_total"
                  type="number"
                  value={values.actual_card_transfer_total ?? 0}
                  onChange={(v) => setValue('actual_card_transfer_total', v as number)}
                  onBlur={() => setFieldTouched('actual_card_transfer_total')}
                  error={errors.actual_card_transfer_total}
                  touched={touched.actual_card_transfer_total}
                  required
                  icon="📱"
                  helpText="مجموع واریزهای کارت به کارت تایید شده"
                />
              </div>
            </ReportFormSection>

            {/* Notes Section */}
            <ReportFormSection
              title="یادداشت"
              icon="📝"
              description="توضیحات اضافی (اختیاری)"
            >
              <ReportFormField
                label="یادداشت"
                name="notes"
                type="textarea"
                value={values.notes || ''}
                onChange={(v) => setValue('notes', v as string)}
                onBlur={() => setFieldTouched('notes')}
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
