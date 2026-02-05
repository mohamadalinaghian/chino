// hooks/payment/summary/useSaleSummary.ts

import { useMemo } from 'react';
import {
  SaleSummaryInput,
  SaleSummary,
} from './types';
import { calculateBaseTotal } from './calculations';
import { useSaleTax } from './useSaleTax';
import { useSaleDiscount } from './useSaleDiscount';

export function useSaleSummary(
  input: SaleSummaryInput,
): SaleSummary {
  const baseTotal = useMemo(
    () => calculateBaseTotal(input.saleItems, input.selectedItems),
    [input.saleItems, input.selectedItems],
  );

  const { totalTax } = useSaleTax(
    input.saleItems,
    input.selectedItems,
  );

  const { totalDiscount } = useSaleDiscount(
    input.saleItems,
    input.selectedItems,
  );

  return {
    baseTotal,
    taxTotal: totalTax,
    discountTotal: totalDiscount,
    finalTotal: baseTotal + totalTax - totalDiscount,
  };
}
