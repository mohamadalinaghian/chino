/**
 * Sale grid component
 *
 * Single Responsibility: Render sale cards in responsive grid layout
 *
 * Features:
 * - Responsive grid (1-4 columns based on screen size)
 * - Type-safe sale data
 */

import { SaleCard } from './SaleCard';
import type { SaleDashboardItem } from '@/types/saleType';

interface Props {
  sales: SaleDashboardItem[];
}

export function SaleGrid({ sales }: Props) {
  return (
    <div
      className="
        grid gap-2
        grid-cols-2
        sm:grid-cols-4
        md:grid-cols-5
        lg:grid-cols-6
        xl:grid-cols-8
      "
    >
      {sales.map((sale) => (
        <SaleCard key={sale.id} sale={sale} />
      ))}
    </div>
  );
}
