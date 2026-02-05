// hooks/payment/splits/types.ts

import { PaymentMethod } from '@/types/sale';

export interface PaymentSplit {
  id: string;
  amount: number;
  method?: PaymentMethod;
  locked: boolean;
  meta?: {
    error?: string;
    submitted?: boolean;
  };
}
