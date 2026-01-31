/**
 * Payment Calculation Utilities
 *
 * Pure functions for payment-related calculations.
 * Following the Single Responsibility Principle - each function has one clear purpose.
 * All functions are pure (no side effects) for easy testing and reusability.
 */

import type { ISaleItemDetail } from '@/types/sale';
import type { SelectedItem, SplitPayment } from '@/types/payment';

/**
 * Calculate the total price of extras for a sale item
 *
 * @param item - The sale item with extras
 * @returns Total price of all extras
 */
export function calculateExtrasTotal(item: ISaleItemDetail): number {
  if (!item.extras || item.extras.length === 0) {
    return 0;
  }

  return item.extras.reduce(
    (sum, extra) => sum + extra.unit_price * extra.quantity,
    0
  );
}

/**
 * Calculate the proportional extras cost per unit
 *
 * @param item - The sale item with extras
 * @returns Extras cost per single unit
 */
export function calculateExtrasPerUnit(item: ISaleItemDetail): number {
  if (item.quantity === 0) {
    return 0;
  }

  const extrasTotal = calculateExtrasTotal(item);
  return extrasTotal / item.quantity;
}

/**
 * Calculate the total price for a given quantity of an item (including extras)
 *
 * @param item - The sale item
 * @param quantity - Quantity to calculate for
 * @returns Total price including base price and proportional extras
 */
export function calculateItemTotal(
  item: ISaleItemDetail,
  quantity: number
): number {
  const baseTotal = quantity * item.unit_price;
  const extrasPerUnit = calculateExtrasPerUnit(item);
  const extrasTotal = extrasPerUnit * quantity;

  return baseTotal + extrasTotal;
}

/**
 * Calculate total amount from selected items
 *
 * @param items - All sale items
 * @param selectedItems - Items selected for payment
 * @returns Total amount of selected items
 */
export function calculateSelectedItemsTotal(
  items: ISaleItemDetail[],
  selectedItems: SelectedItem[]
): number {
  return selectedItems.reduce((sum, selected) => {
    const item = items.find(i => i.id === selected.itemId);
    if (!item) {
      return sum;
    }

    return sum + calculateItemTotal(item, selected.quantity);
  }, 0);
}

/**
 * Calculate tax amount based on base amount and tax percentage
 *
 * @param baseAmount - Amount before tax
 * @param taxPercent - Tax percentage
 * @returns Tax amount (rounded)
 */
export function calculateTaxAmount(
  baseAmount: number,
  taxPercent: number
): number {
  return Math.round(baseAmount * (taxPercent / 100));
}

/**
 * Calculate total amount for a split payment including tax and tip
 *
 * @param split - Split payment configuration
 * @returns Total amount including tax and tip, minus discount
 */
export function calculateSplitTotal(split: SplitPayment): number {
  const taxAmount = split.taxEnabled
    ? calculateTaxAmount(split.amount, split.taxPercent)
    : 0;

  return split.amount + taxAmount + split.tipAmount - split.discount;
}

/**
 * Calculate total of all locked splits
 *
 * @param splits - All split payments
 * @returns Total amount of locked splits
 */
export function calculateTotalLockedAmount(splits: SplitPayment[]): number {
  return splits
    .filter(s => s.isLocked)
    .reduce((sum, split) => sum + calculateSplitTotal(split), 0);
}

/**
 * Calculate total of all unlocked splits
 *
 * @param splits - All split payments
 * @returns Total amount of unlocked splits
 */
export function calculateTotalUnlockedAmount(splits: SplitPayment[]): number {
  return splits
    .filter(s => !s.isLocked)
    .reduce((sum, split) => sum + calculateSplitTotal(split), 0);
}

/**
 * Calculate the grand total including all splits
 *
 * @param splits - All split payments
 * @returns Grand total of all splits
 */
export function calculateGrandTotal(splits: SplitPayment[]): number {
  return splits.reduce((sum, split) => sum + calculateSplitTotal(split), 0);
}

/**
 * Distribute amount equally across unlocked splits
 *
 * @param totalAmount - Amount to distribute
 * @param splits - All split payments
 * @returns Updated splits with distributed amounts
 */
export function distributeAmountAcrossSplits(
  totalAmount: number,
  splits: SplitPayment[]
): SplitPayment[] {
  const unlockedSplits = splits.filter(s => !s.isLocked);

  if (unlockedSplits.length === 0) {
    return splits;
  }

  const amountPerSplit = Math.floor(totalAmount / unlockedSplits.length);
  const remainder = totalAmount % unlockedSplits.length;

  return splits.map((split, index) => {
    if (split.isLocked) {
      return split;
    }

    const unlockedIndex = unlockedSplits.findIndex(s => s.id === split.id);
    const extraForRemainder = unlockedIndex < remainder ? 1 : 0;

    return {
      ...split,
      amount: amountPerSplit + extraForRemainder,
    };
  });
}

/**
 * Calculate remaining balance after payments
 *
 * @param totalAmount - Total sale amount
 * @param paidAmount - Amount already paid
 * @returns Remaining balance
 */
export function calculateRemainingBalance(
  totalAmount: number,
  paidAmount: number
): number {
  return Math.max(0, totalAmount - paidAmount);
}

/**
 * Calculate percentage of amount paid
 *
 * @param totalAmount - Total sale amount
 * @param paidAmount - Amount paid
 * @returns Percentage paid (0-100)
 */
export function calculatePaymentPercentage(
  totalAmount: number,
  paidAmount: number
): number {
  if (totalAmount === 0) {
    return 0;
  }

  return Math.min(100, (paidAmount / totalAmount) * 100);
}
