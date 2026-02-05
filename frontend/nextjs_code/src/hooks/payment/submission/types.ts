// hooks/payment/submission/types.ts

export interface SubmitPaymentPayload {
  saleId: number;
  amount: number;
  method: string;
}

export interface SubmissionResult {
  splitId: string;
  success: boolean;
  error?: string;
}
