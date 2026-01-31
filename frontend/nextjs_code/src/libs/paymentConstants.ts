/**
 * Payment Constants
 *
 * Centralized configuration for payment methods, colors, and UI constants.
 * Following the Single Responsibility Principle - this file only manages constants.
 */

import { PaymentMethod } from '@/types/sale';

/**
 * Payment method display configurations
 * Maps backend PaymentMethod enum to UI display properties
 */
export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; color: string; icon?: string }
> = {
  [PaymentMethod.CASH]: {
    label: 'نقدی',
    color: '#10b981', // green
    icon: '💵',
  },
  [PaymentMethod.POS]: {
    label: 'کارتخوان',
    color: '#8b5cf6', // purple
    icon: '💳',
  },
  [PaymentMethod.CARD_TRANSFER]: {
    label: 'کارت به کارت',
    color: '#3b82f6', // blue
    icon: '🏦',
  },
};

/**
 * Default tax percentage for new payments
 */
export const DEFAULT_TAX_PERCENT = 10;

/**
 * Minimum and maximum split count allowed
 */
export const MIN_SPLIT_COUNT = 1;
export const MAX_SPLIT_COUNT = 10;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  ITEM_PAID: 2000,
  TOAST: 3000,
  TRANSITION: 200,
};

/**
 * Payment status display configurations
 */
export const PAYMENT_STATUS_CONFIG = {
  UNPAID: {
    label: 'پرداخت نشده',
    color: '#ef4444', // red
  },
  PARTIALLY_PAID: {
    label: 'پرداخت جزئی',
    color: '#f59e0b', // orange
  },
  PAID: {
    label: 'پرداخت شده',
    color: '#10b981', // green
  },
};

/**
 * Sale state display configurations
 */
export const SALE_STATE_CONFIG = {
  OPEN: {
    label: 'باز',
    color: '#3b82f6', // blue
  },
  CLOSED: {
    label: 'بسته شده',
    color: '#10b981', // green
  },
  CANCELED: {
    label: 'لغو شده',
    color: '#ef4444', // red
  },
};
