// hooks/payment/splits/calculations.ts

import { PaymentSplit } from './types';

export function distributeAmount(
  total: number,
  splits: PaymentSplit[],
): PaymentSplit[] {
  const unlocked = splits.filter(s => !s.locked);
  const lockedTotal = splits
    .filter(s => s.locked)
    .reduce((s, p) => s + p.amount, 0);

  const remaining = total - lockedTotal;
  if (remaining < 0 || unlocked.length === 0) {
    return splits;
  }

  const perSplit = remaining / unlocked.length;

  return splits.map(split =>
    split.locked
      ? split
      : { ...split, amount: perSplit },
  );
}
