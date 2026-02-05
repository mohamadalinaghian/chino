/**
 * ─────────────────────────────────────────────────────────────
 * Payment Domain Types
 * ─────────────────────────────────────────────────────────────
 * These types define the authoritative contracts used by:
 * - useSaleSummary
 * - useItemSelection
 * - usePaymentSplits
 * - usePaymentValidation
 * - usePaymentSubmission
 *
 * No UI component should redefine or extend these types.
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Monetary value in smallest currency unit (e.g. toman, rial)
 * Must always be an integer.
 */
export type Money = number;

/**
 * Payment methods supported by the system.
 * Extendable without touching UI.
 */
import { PaymentMethod } from "../sale";

/**
 * Sale lifecycle states relevant to payment.
 * Business rules must rely on these values,
 * never string literals in UI.
 */
export type SaleState =
  | 'OPEN'
  | 'CLOSED'
  | 'CANCELED'
  | 'LOCKED'
  | 'REFUNDED';

/**
 * A single item inside a sale.
 * This represents backend truth.
 */
export interface SaleItem {
  id: number;
  name: string;

  unit_price: Money;

  quantity_total: number;
  quantity_paid: number;
  quantity_remaining: number;
}

/**
 * User intent: which items (and how many)
 * are selected for payment.
 */
export interface SelectedItem {
  itemId: number;
  quantity: number;
}

/**
 * One payment split (guest / payer).
 * Amount-based only.
 */
export interface PaymentSplit {
  id: string;

  /**
   * Final payable amount for this split.
   * Must participate in global invariant:
   * Σ(split.amount) === selectedItemsTotal
   */
  amount: Money;

  /**
   * Indicates whether user intends to preserve
   * this split’s relative weight.
   */
  locked: boolean;

  /**
   * True if user manually edited the amount.
   * Manual edits are authoritative.
   */
  manuallyEdited: boolean;

  /**
   * Payment routing
   */
  method?: PaymentMethod;
  accountId?: number;
}

/**
 * Summary of monetary state for a sale.
 * This is the SINGLE source of truth for totals.
 */
export interface SaleSummary {
  saleTotal: Money;
  totalPaid: Money;
  remainingTotal: Money;

  /**
   * Total amount derived from current selection.
   */
  selectedItemsTotal: Money;

  isFullyPaid: boolean;
  isOverpaid: boolean;
}

/**
 * Validation state for a single split.
 */
export interface SplitValidation {
  splitId: string;
  valid: boolean;

  /**
   * Blocking reasons shown inline in UI.
   */
  errors: string[];

  /**
   * Whether this split can be submitted
   * independently of others.
   */
  canSubmitIndependently: boolean;
}

/**
 * Aggregate validation result.
 */
export interface PaymentValidation {
  isAnySplitSubmittable: boolean;
  splitValidation: SplitValidation[];
}

/**
 * Result of a partial submission attempt.
 */
export interface SubmissionResult {
  successSplitIds: string[];
  failedSplitIds: string[];
}
