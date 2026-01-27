export interface IReportDetails {
  report_date: string;
  creator: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CLOSED';
  opening_float: number;
  closing_cash_counted: number;
  expected_total_sales: number;
  expected_total_refunds: number;
  expected_total_discount: number;
  expected_total_tax: number;
  expected_cash_total: number;
  cogs: number;
  total_expenses: number;
  notes: string | null;
  approved_by: string | null;
  total_revenue: number;
  net_profit: number;
  actual_income: number;
  actual_pos_total: number;
  net_cash_received: number;
  cash_variance: number;
  pos_variance: number;
  card_transfer_variance: number;
  total_variance: number;
}

export interface IPaymentMethodBreakdown {
  payment_method: 'CASH' | 'POS' | 'CARD_TRANSFER';
  expected_amount: number;
  actual_amount: number;
  variance: number;
}

export interface IReportSummary {
  id: number;
  report_date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CLOSED';
  total_sales: number;
  total_variance: number;
  creator: string;
}

export interface IReportListItem {
  id: number;
  report_date: string;
  status: 'DRAFT' | 'APPROVED';
  created_by: string;
  total_revenue: string;
  total_variance: string;
}

export interface IReportListResponse {
  reports: IReportListItem[];
  total_count: number;
}
