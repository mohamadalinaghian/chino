/**
 * usePaymentVoid Hook
 *
 * Manages payment voiding functionality.
 * Responsibilities:
 * - Handle void payment requests
 * - Manage confirmation state
 * - Handle success/error states
 * - Manage voiding loading state
 */

import { useState, useCallback } from 'react';
import { voidPayment } from '@/service/sale';

interface UsePaymentVoidProps {
  saleId: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onComplete?: () => void;
}

interface UsePaymentVoidReturn {
  voidingPaymentId: number | null;
  voidPaymentById: (paymentId: number) => Promise<void>;
  cancelVoid: () => void;
}

/**
 * Hook for managing payment void operations
 *
 * @param props - Hook configuration
 * @returns Void state and void function
 */
export function usePaymentVoid({
  saleId,
  onSuccess,
  onError,
  onComplete,
}: UsePaymentVoidProps): UsePaymentVoidReturn {
  const [voidingPaymentId, setVoidingPaymentId] = useState<number | null>(null);

  /**
   * Void a payment by ID
   *
   * @param paymentId - ID of payment to void
   */
  const voidPaymentById = useCallback(
    async (paymentId: number) => {
      try {
        setVoidingPaymentId(paymentId);

        await voidPayment(saleId, paymentId);

        onSuccess('پرداخت با موفقیت لغو شد');

        // Call completion callback if provided
        if (onComplete) {
          onComplete();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'خطا در لغو پرداخت';
        onError(errorMessage);
      } finally {
        setVoidingPaymentId(null);
      }
    },
    [saleId, onSuccess, onError, onComplete]
  );

  /**
   * Cancel void operation
   */
  const cancelVoid = useCallback(() => {
    setVoidingPaymentId(null);
  }, []);

  return {
    voidingPaymentId,
    voidPaymentById,
    cancelVoid,
  };
}
