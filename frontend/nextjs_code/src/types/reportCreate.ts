/**
 * Types for Report Creation
 * Defines interfaces and enums for the report creation flow
 */

/**
 * Report creation input - data collected from the form
 */
export interface ICreateReportInput {
  report_date: string; // ISO date string (YYYY-MM-DD)
  opening_float: number;
  closing_cash_counted: number;
  actual_pos_total: number;
  actual_card_transfer_total: number;
  notes?: string;
}

/**
 * Response from create report API
 */
export interface ICreateReportResponse {
  id: number;
  report_date: string;
  status: 'DRAFT';
  message?: string;
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
