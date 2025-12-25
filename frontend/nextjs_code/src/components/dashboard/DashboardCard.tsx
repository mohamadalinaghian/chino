'use client';

import { DashboardItem } from '@/types/saleType';
import { formatRelativeTime } from '@/libs/sale/saleFormatter';

interface Props {
  sale: DashboardItem;
  onClick(): void;
}

export function DashboardCard({ sale, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white">
        <div className="flex justify-between">
          <div>
            <p className="text-sm opacity-90">میز</p>
            <p className="text-2xl font-bold">{sale.table || 'بیرون‌بر'}</p>
          </div>

          <div className="text-left">
            <p className="text-sm opacity-90">مجموع</p>
            <p className="text-xl font-bold">
              {Number(sale.total_amount).toLocaleString('fa-IR')} تومان
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-2 text-sm text-gray-700">
        <div>مشتری: {sale.guest_name || 'آزاد'}</div>
        <div>زمان: {formatRelativeTime(sale.opened_at)}</div>
        <div>اپراتور: {sale.opened_by_name}</div>
      </div>

      <div className="px-6 py-2 bg-gray-50 text-xs text-center text-gray-500">
        برای مشاهده کلیک کنید
      </div>
    </div>
  );
}
