/**
 * useReportForm Hook
 * Manages the state and logic for report creation form
 */

import { useState, useCallback, useMemo } from 'react';
import { ICreateReportInput } from '@/types/reportCreate';
import { createReport } from '@/service/reportService';

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Initial form values - matches backend schema
const INITIAL_VALUES: Partial<ICreateReportInput> = {
  report_date: getTodayDate(),
  open_floating_cash: 0,
  closing_cash_counted: 0,
  pos_report: 0,
  note: '',
};

interface UseReportFormOptions {
  onSuccess?: (reportId: number) => void;
  onError?: (message: string) => void;
}

export function useReportForm({ onSuccess, onError }: UseReportFormOptions = {}) {
  // Form state
  const [values, setValues] = useState<Partial<ICreateReportInput>>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for confirmed card transfers total (calculated from card transfer widget)
  const [confirmedCardTransferTotal, setConfirmedCardTransferTotal] = useState(0);

  // Update a single field value
  const setValue = useCallback((name: keyof ICreateReportInput, value: string | number | null) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Mark field as touched (for blur events)
  const setFieldTouched = useCallback((name: keyof ICreateReportInput) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  // Validate form - using correct field names that match backend
  const validate = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!values.report_date) {
      newErrors.report_date = 'تاریخ گزارش الزامی است';
    }

    if (values.open_floating_cash === undefined || values.open_floating_cash < 0) {
      newErrors.open_floating_cash = 'موجودی اولیه صندوق باید صفر یا بیشتر باشد';
    }

    if (values.closing_cash_counted === undefined || values.closing_cash_counted < 0) {
      newErrors.closing_cash_counted = 'نقدی شمارش شده باید صفر یا بیشتر باشد';
    }

    if (values.pos_report === undefined || values.pos_report < 0) {
      newErrors.pos_report = 'جمع کارتخوان باید صفر یا بیشتر باشد';
    }

    return newErrors;
  }, [values]);

  // Check if form is valid
  const isValid = useMemo(() => {
    const validationErrors = validate();
    return Object.keys(validationErrors).length === 0;
  }, [validate]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validate all fields
    const validationErrors = validate();
    setErrors(validationErrors);

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(INITIAL_VALUES).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (Object.keys(validationErrors).length > 0) {
      onError?.('لطفا خطاهای فرم را برطرف کنید');
      return false;
    }

    setIsSubmitting(true);
    try {
      // Build request with correct field names
      const requestData: ICreateReportInput = {
        report_date: values.report_date!,
        open_floating_cash: values.open_floating_cash ?? 0,
        closing_cash_counted: values.closing_cash_counted ?? 0,
        pos_report: values.pos_report ?? 0,
        note: values.note || null,
      };
      const response = await createReport(requestData);
      onSuccess?.(response.id);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ایجاد گزارش';
      onError?.(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSuccess, onError]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setTouched({});
    setConfirmedCardTransferTotal(0);
  }, []);

  // Calculate totals for display
  const calculatedTotals = useMemo(() => {
    const openingFloat = Number(values.open_floating_cash) || 0;
    const closingCash = Number(values.closing_cash_counted) || 0;
    const posTotal = Number(values.pos_report) || 0;
    const cardTransferTotal = confirmedCardTransferTotal;

    const cashReceived = closingCash - openingFloat;
    const totalIncome = cashReceived + posTotal + cardTransferTotal;

    return {
      openingFloat,
      closingCash,
      posTotal,
      cardTransferTotal,
      cashReceived,
      totalIncome,
    };
  }, [values, confirmedCardTransferTotal]);

  return {
    // Form state
    values,
    errors,
    touched,
    isSubmitting,
    isValid,

    // Actions
    setValue,
    setFieldTouched,
    handleSubmit,
    resetForm,

    // Card transfer total (from widget)
    confirmedCardTransferTotal,
    setConfirmedCardTransferTotal,

    // Calculated values
    calculatedTotals,
  };
}
