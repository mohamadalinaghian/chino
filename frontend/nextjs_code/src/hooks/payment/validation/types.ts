// hooks/payment/validation/types.ts

import { PaymentSplit } from '@/hooks/payment/splits/types';

export interface SplitValidationResult {
  splitId: string;
  valid: boolean;
  error?: string;
}

export interface PaymentValidationResult {
  isBlocking: boolean;
  blockingReason?: string;
  splitResults: SplitValidationResult[];
  submittableSplitIds: string[];
}
