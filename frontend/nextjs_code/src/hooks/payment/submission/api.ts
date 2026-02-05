// hooks/payment/submission/api.ts

import { SubmitPaymentPayload } from './types';

export async function submitPayment(
  payload: SubmitPaymentPayload,
): Promise<void> {
  const res = await fetch('/api/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'خطا در ثبت پرداخت');
  }
}
