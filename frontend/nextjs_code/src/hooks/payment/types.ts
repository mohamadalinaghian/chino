/**
 * Payment Hook Types
 * Centralized type definitions for payment functionality
 */

import { PaymentMethod, ISaleDetailResponse, IBankAccount, ISaleItemDetail } from '@/types/sale';

// ═══════════════════════════════════════════════════════════════════════════════
// API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface IPOSAccount {
  id: number | null;
  card_number: string | null;
  bank_name: string | null;
  account_owner: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SNAPSHOT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Frozen snapshot of the sale at payment time
 * This is IMMUTABLE - cannot be modified during payment
 */
export interface PaymentSnapshot {
  saleId: number;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  subtotalAmount: number;
  totalPaid: number;
  remainingDue: number;
  items: ISaleItemDetail[];
  isFullyPaid: boolean;
  paymentStatus: string;
  saleState: string;
}

/**
 * Simplified payment record for display
 */
export interface PaymentRecord {
  id: number;
  method: string;
  amount: number;
  tipAmount: number;
  receivedBy: string;
  receivedAt: string;
  status: 'ACTIVE' | 'VOID';
  accountInfo?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface UsePaymentPageOptions {
  saleId: number;
  onSuccess?: (message: string, wasAutoClosed: boolean) => void;
  onError?: (message: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK RETURN TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PaymentDataState {
  loading: boolean;
  sale: ISaleDetailResponse | null;
  bankAccounts: IBankAccount[];
  posAccount: IPOSAccount | null;
  snapshot: PaymentSnapshot | null;
  payments: PaymentRecord[];
  isViewOnly: boolean;
}

export interface PaymentInputState {
  paymentMethod: PaymentMethod;
  selectedAccountId: number | null;
  inputAmount: string;
  tipAmount: string;
  calculatorExpression: string;
  parsedAmount: number;
  parsedTip: number;
  totalPaymentAmount: number;
  showBreakdown: boolean;
}

export interface PaymentValidation {
  validationError: string | null;
  isValid: boolean;
}

export interface PaymentActions {
  loadSaleData: () => Promise<void>;
  handleSubmitPayment: () => Promise<void>;
  handleVoidPayment: (paymentId: number) => Promise<void>;
  setPaymentMethod: (method: PaymentMethod) => void;
  setSelectedAccountId: (id: number | null) => void;
  setInputAmount: (value: string) => void;
  setTipAmount: (value: string) => void;
  setCalculatorExpression: (value: string) => void;
  applyCalculatorResult: () => void;
  setAmountToRemaining: () => void;
  setShowBreakdown: (value: boolean) => void;
}

export interface UsePaymentPageReturn extends PaymentDataState, PaymentInputState, PaymentValidation, PaymentActions {
  submitting: boolean;
  voidingPaymentId: number | null;
  quickAmounts: number[];
}
