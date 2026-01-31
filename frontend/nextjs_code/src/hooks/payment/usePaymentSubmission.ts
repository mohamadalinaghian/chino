/**
 * usePaymentSubmission Hook
 *
 * Manages payment submission process.
 * Responsibilities:
 * - Validate payment data before submission
 * - Transform UI state to API format
 * - Submit payments to backend
 * - Handle success/error states
 * - Manage submission loading state
 */

import { useState, useCallback } from 'react';
import { addPaymentsToSale } from '@/service/sale';
import type { IAddPaymentInput, ISelectedItemInput } from '@/types/sale';
import type { SplitPayment, SelectedItem } from '@/types/payment';
import { PaymentMethod, TaxDiscountType } from '@/types/sale';
import { validateAllSplits, validateSelectedItems } from '@/utils/paymentValidation';

interface UsePaymentSubmissionProps {
  saleId: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onComplete?: () => void;
}

interface UsePaymentSubmissionReturn {
  submitting: boolean;
  submitPayments: (
    splits: SplitPayment[],
    selectedItems: SelectedItem[]
  ) => Promise<void>;
}

/**
 * Transform split payment to API payment input format
 *
 * @param split - Split payment from UI
 * @param selectedItems - Selected items for payment
 * @returns API-compatible payment input
 */
function transformSplitToPaymentInput(
  split: SplitPayment,
  selectedItems: SelectedItem[]
): IAddPaymentInput {
  const payment: IAddPaymentInput = {
    method: split.paymentMethod,
    amount_applied: split.amount,
    tip_amount: split.tipAmount > 0 ? split.tipAmount : undefined,
    destination_account_id:
      split.paymentMethod === PaymentMethod.CARD_TRANSFER
        ? split.accountId
        : undefined,
    selected_items: selectedItems.map(
      (item): ISelectedItemInput => ({
        item_id: item.itemId,
        quantity: item.quantity,
      })
    ),
  };

  // Add tax if enabled
  if (split.taxEnabled && split.taxPercent > 0) {
    payment.tax = {
      type: TaxDiscountType.PERCENTAGE,
      value: split.taxPercent,
    };
  }

  // Add discount if present
  if (split.discount > 0) {
    payment.discount = {
      type: TaxDiscountType.FIXED,
      value: split.discount,
    };
  }

  return payment;
}

/**
 * Hook for managing payment submission
 *
 * @param props - Hook configuration
 * @returns Submission state and submit function
 */
export function usePaymentSubmission({
  saleId,
  onSuccess,
  onError,
  onComplete,
}: UsePaymentSubmissionProps): UsePaymentSubmissionReturn {
  const [submitting, setSubmitting] = useState(false);

  /**
   * Submit payments to backend
   * Validates data, transforms to API format, and handles the request
   *
   * @param splits - Split payments to submit
   * @param selectedItems - Items being paid for
   */
  const submitPayments = useCallback(
    async (splits: SplitPayment[], selectedItems: SelectedItem[]) => {
      try {
        setSubmitting(true);

        // Validate selected items
        const itemsValidation = validateSelectedItems(selectedItems);
        if (!itemsValidation.isValid) {
          onError(itemsValidation.error!);
          return;
        }

        // Validate all splits
        const splitsValidation = validateAllSplits(splits);
        if (!splitsValidation.isValid) {
          onError(splitsValidation.error!);
          return;
        }

        // Transform splits to API format
        const payments = splits.map(split =>
          transformSplitToPaymentInput(split, selectedItems)
        );

        // Submit to backend
        const response = await addPaymentsToSale(saleId, { payments });

        // Handle auto-close notification
        if (response.was_auto_closed) {
          onSuccess('پرداخت ثبت شد و فروش بسته شد');
        } else {
          onSuccess('پرداخت با موفقیت ثبت شد');
        }

        // Call completion callback if provided
        if (onComplete) {
          onComplete();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'خطا در ثبت پرداخت';
        onError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [saleId, onSuccess, onError, onComplete]
  );

  return {
    submitting,
    submitPayments,
  };
}
