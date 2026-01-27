/**
 * Types for Report Creation
 * Defines interfaces and enums for the report creation flow
 */

/**
 * Report creation input - matches backend CreateReportRequest schema
 */
export interface ICreateReportInput {
  report_date: string; // ISO date string (YYYY-MM-DD)
  open_floating_cash: number;
  closing_cash_counted: number;
  pos_report: number;
  note?: string | null;
}

/**
 * Response from create report API
 */
export interface ICreateReportResponse {
  id: number;
  state: string;
}

/**
 * Card transfer item for confirmation widget
 */
export interface ICardTransferItem {
  id: number;
  sale_id: number;
  amount: number;
  destination_card_number: string;
  destination_account_owner: string;
  destination_bank_name: string | null;
  received_by_name: string;
  received_at: string;
  confirmed: boolean;
}

/**
 * Card transfers list response
 */
export interface ICardTransfersResponse {
  transfers: ICardTransferItem[];
  total_count: number;
  confirmed_count: number;
  unconfirmed_count: number;
  total_confirmed_amount: number;
}

/**
 * Form field configuration for dynamic form rendering
 */
export interface IReportFormField {
  name: keyof ICreateReportInput;
  label: string;
  type: 'number' | 'text' | 'date' | 'textarea';
  placeholder?: string;
  required?: boolean;
  icon?: string;
  helpText?: string;
  min?: number;
}

/**
 * Form section configuration
 */
export interface IReportFormSection {
  title: string;
  icon: string;
  description?: string;
  fields: IReportFormField[];
}

/**
 * Form state for validation
 */
export interface IReportFormState {
  values: Partial<ICreateReportInput>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}
