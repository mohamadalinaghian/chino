'use client';

import { DashboardItem } from '@/types/saleType';
import { DashboardCard } from './DashboardCard';

interface Props {
  sales: DashboardItem[];
  onSelect(id: number): void;
}

export function DashboardGrid({ sales, onSelect }: Props) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold">فروشی فعال نیست</h3>
        <p className="text-gray-600 mt-2">
          برای شروع یک فروش جدید ایجاد کنید
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sales.map((sale) => (
        <DashboardCard
          key={sale.id}
          sale={sale}
          onClick={() => onSelect(sale.id)}
        />
      ))}
    </div>
  );
}
