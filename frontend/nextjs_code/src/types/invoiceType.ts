/**
 * Invoice-related TypeScript type definitions
 * Matches Django backend invoice schemas exactly
 */

/**
 * Payment method enum
 */
export enum PaymentMethod {
  CASH = 'CASH',
  POS = 'POS',
  CARD_TRANSFER = 'CARD_TRANSFER',
}

/**
 * Invoice status enum
 */
export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  VOID = 'VOID',
}

/**
 * Request to initiate invoice from sale
 */
export interface InitiateInvoiceRequest {
  tax_amount?: string; // Decimal as string
}

/**
 * Response after initiating invoice
 */
export interface InitiateInvoiceResponse {
  invoice_id: number;
  invoice_number: string;
  sale_id: number;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  status: InvoiceStatus;
  sale_state: string;
}

/**
 * Request to process payment
 */
export interface ProcessPaymentRequest {
  method: PaymentMethod;
  amount_applied: string; // Decimal as string
  tip_amount?: string; // Decimal as string
  destination_account_id?: number | null;
}

/**
 * Payment detail in response
 */
export interface PaymentDetail {
  id: number;
  method: string;
  amount_applied: string;
  tip_amount: string;
  amount_total: string;
  received_at: string; // ISO date string
}

/**
 * Response after processing payment
 */
export interface ProcessPaymentResponse {
  payment_id: number;
  invoice_id: number;
  invoice_number: string;
  invoice_status: InvoiceStatus;
  sale_id: number;
  sale_state: string;
  total_amount: string;
  total_paid: string;
  balance_due: string;
  payments: PaymentDetail[];
}

/**
 * Request to cancel invoice
 */
export interface CancelInvoiceRequest {
  reason?: string | null;
}

/**
 * Response after canceling invoice
 */
export interface CancelInvoiceResponse {
  invoice_id: number;
  invoice_number: string;
  invoice_status: InvoiceStatus;
  sale_id: number;
  sale_state: string;
  cancellation_reason: string | null;
}

/**
 * Complete invoice detail response
 */
export interface InvoiceDetailResponse {
  invoice_id: number;
  invoice_number: string;
  sale_id: number;
  status: InvoiceStatus;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  total_paid: string;
  balance_due: string;
  is_fully_paid: boolean;
  payments: PaymentDetail[];
  issued_at: string;
  issued_by_name: string;
}
