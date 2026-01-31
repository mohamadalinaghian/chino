/**
 * Payment Validation Utilities
 *
 * Pure validation functions for payment-related data.
 * Each function returns a validation result with success status and optional error message.
 */

import { PaymentMethod } from '@/types/sale';
import type { SplitPayment, SelectedItem } from '@/types/payment';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate that an amount is positive
 *
 * @param amount - Amount to validate
 * @param fieldName - Name of the field for error messages
 * @returns Validation result
 */
export function validatePositiveAmount(
  amount: number,
  fieldName: string = 'مبلغ'
): ValidationResult {
  if (amount <= 0) {
    return {
      isValid: false,
      error: `${fieldName} باید بیشتر از صفر باشد`,
    };
  }

  return { isValid: true };
}

/**
 * Validate that selected items are not empty
 *
 * @param selectedItems - Items selected for payment
 * @returns Validation result
 */
export function validateSelectedItems(
  selectedItems: SelectedItem[]
): ValidationResult {
  if (selectedItems.length === 0) {
    return {
      isValid: false,
      error: 'لطفاً حداقل یک قلم را انتخاب کنید',
    };
  }

  return { isValid: true };
}

/**
 * Validate payment method selection
 *
 * @param method - Payment method
 * @returns Validation result
 */
export function validatePaymentMethod(
  method: PaymentMethod | null
): ValidationResult {
  if (!method) {
    return {
      isValid: false,
      error: 'لطفاً روش پرداخت را انتخاب کنید',
    };
  }

  return { isValid: true };
}

/**
 * Validate bank account selection for card transfer payments
 *
 * @param method - Payment method
 * @param accountId - Selected account ID
 * @returns Validation result
 */
export function validateBankAccount(
  method: PaymentMethod,
  accountId: number | null
): ValidationResult {
  if (method === PaymentMethod.CARD_TRANSFER && !accountId) {
    return {
      isValid: false,
      error: 'لطفاً حساب مقصد را انتخاب کنید',
    };
  }

  return { isValid: true };
}

/**
 * Validate tax percentage range
 *
 * @param taxPercent - Tax percentage
 * @returns Validation result
 */
export function validateTaxPercent(taxPercent: number): ValidationResult {
  if (taxPercent < 0 || taxPercent > 100) {
    return {
      isValid: false,
      error: 'درصد مالیات باید بین 0 تا 100 باشد',
    };
  }

  return { isValid: true };
}

/**
 * Validate discount amount against total amount
 *
 * @param discount - Discount amount
 * @param totalAmount - Total amount before discount
 * @returns Validation result
 */
export function validateDiscount(
  discount: number,
  totalAmount: number
): ValidationResult {
  if (discount < 0) {
    return {
      isValid: false,
      error: 'تخفیف نمی‌تواند منفی باشد',
    };
  }

  if (discount > totalAmount) {
    return {
      isValid: false,
      error: 'تخفیف نمی‌تواند بیشتر از مبلغ کل باشد',
    };
  }

  return { isValid: true };
}

/**
 * Validate a single split payment
 *
 * @param split - Split payment to validate
 * @returns Validation result
 */
export function validateSplitPayment(split: SplitPayment): ValidationResult {
  // Validate amount
  const amountValidation = validatePositiveAmount(split.amount, 'مبلغ پرداخت');
  if (!amountValidation.isValid) {
    return amountValidation;
  }

  // Validate payment method
  const methodValidation = validatePaymentMethod(split.paymentMethod);
  if (!methodValidation.isValid) {
    return methodValidation;
  }

  // Validate bank account if needed
  const accountValidation = validateBankAccount(
    split.paymentMethod,
    split.accountId
  );
  if (!accountValidation.isValid) {
    return accountValidation;
  }

  // Validate tax
  if (split.taxEnabled) {
    const taxValidation = validateTaxPercent(split.taxPercent);
    if (!taxValidation.isValid) {
      return taxValidation;
    }
  }

  // Validate discount
  const discountValidation = validateDiscount(split.discount, split.amount);
  if (!discountValidation.isValid) {
    return discountValidation;
  }

  return { isValid: true };
}

/**
 * Validate all split payments
 *
 * @param splits - All split payments
 * @returns Validation result with specific split index in error
 */
export function validateAllSplits(splits: SplitPayment[]): ValidationResult {
  for (let i = 0; i < splits.length; i++) {
    const validation = validateSplitPayment(splits[i]);
    if (!validation.isValid) {
      return {
        isValid: false,
        error: `پرداخت ${i + 1}: ${validation.error}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate that payment amount doesn't exceed remaining balance
 *
 * @param paymentAmount - Amount being paid
 * @param remainingBalance - Remaining balance on sale
 * @returns Validation result
 */
export function validatePaymentAmount(
  paymentAmount: number,
  remainingBalance: number
): ValidationResult {
  if (paymentAmount > remainingBalance) {
    return {
      isValid: false,
      error: 'مبلغ پرداخت نمی‌تواند بیشتر از مانده باشد',
    };
  }

  return { isValid: true };
}

/**
 * Validate quantity against available quantity
 *
 * @param quantity - Selected quantity
 * @param availableQuantity - Available quantity
 * @returns Validation result
 */
export function validateQuantity(
  quantity: number,
  availableQuantity: number
): ValidationResult {
  if (quantity <= 0) {
    return {
      isValid: false,
      error: 'تعداد باید بیشتر از صفر باشد',
    };
  }

  if (quantity > availableQuantity) {
    return {
      isValid: false,
      error: `تعداد نمی‌تواند بیشتر از ${availableQuantity} باشد`,
    };
  }

  return { isValid: true };
}
