/**
 * Payment Actions Hook
 * Handles payment submission and void operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PaymentMethod, IAddPaymentInput, ISaleDetailResponse } from '@/types/sale';
import { addPaymentsToSale, voidPayment } from '@/service/sale';
import { UI_TEXT } from '@/libs/constants';

interface UsePaymentActionsOptions {
  saleId: number;
  sale: ISaleDetailResponse | null;
  paymentMethod: PaymentMethod;
  parsedAmount: number;
  parsedTip: number;
  selectedAccountId: number | null;
  isValid: boolean;
  onSuccess?: (message: string, wasAutoClosed: boolean) => void;
  onError?: (message: string) => void;
  onPaymentComplete?: (balanceDue: number) => void;
  loadSaleData: () => Promise<void>;
}

interface UsePaymentActionsReturn {
  submitting: boolean;
  voidingPaymentId: number | null;
  handleSubmitPayment: () => Promise<void>;
  handleVoidPayment: (paymentId: number) => Promise<void>;
}

/**
 * Hook for handling payment submission and void operations
 */
export function usePaymentActions({
  saleId,
  sale,
  paymentMethod,
  parsedAmount,
  parsedTip,
  selectedAccountId,
  isValid,
  onSuccess,
  onError,
  onPaymentComplete,
  loadSaleData,
}: UsePaymentActionsOptions): UsePaymentActionsReturn {
  const [submitting, setSubmitting] = useState(false);
  const [voidingPaymentId, setVoidingPaymentId] = useState<number | null>(null);

  // Use refs for callbacks to avoid infinite loops
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onPaymentCompleteRef = useRef(onPaymentComplete);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onPaymentCompleteRef.current = onPaymentComplete;
  });

  /**
   * Submit a payment
   */
  const handleSubmitPayment = useCallback(async () => {
    if (!isValid || !sale || submitting) return;

    setSubmitting(true);
    try {
      const payload: IAddPaymentInput = {
        method: paymentMethod,
        amount_applied: parsedAmount,
        tip_amount: parsedTip > 0 ? parsedTip : undefined,
        destination_account_id: selectedAccountId,
      };

      const response = await addPaymentsToSale(saleId, { payments: [payload] });

      // Reload sale data to get updated state
      await loadSaleData();

      // Notify about new balance for input reset
      onPaymentCompleteRef.current?.(response.balance_due);

      const wasAutoClosed = response.was_auto_closed || response.is_fully_paid;
      onSuccessRef.current?.(
        wasAutoClosed
          ? 'پرداخت ثبت شد و فروش تسویه شد'
          : `پرداخت ${parsedAmount.toLocaleString('fa-IR')} تومان ثبت شد`,
        wasAutoClosed
      );
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : UI_TEXT.ERROR_ADDING_PAYMENT);
    } finally {
      setSubmitting(false);
    }
  }, [isValid, sale, submitting, paymentMethod, parsedAmount, parsedTip, selectedAccountId, saleId, loadSaleData]);

  /**
   * Void/cancel a payment
   */
  const handleVoidPayment = useCallback(async (paymentId: number) => {
    if (!sale || voidingPaymentId) return;

    setVoidingPaymentId(paymentId);
    try {
      await voidPayment(saleId, paymentId);
      await loadSaleData();
      onSuccessRef.current?.('پرداخت با موفقیت لغو شد', false);
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : 'خطا در لغو پرداخت');
    } finally {
      setVoidingPaymentId(null);
    }
  }, [sale, voidingPaymentId, saleId, loadSaleData]);

  return {
    submitting,
    voidingPaymentId,
    handleSubmitPayment,
    handleVoidPayment,
  };
}
