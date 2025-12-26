'use client';

import { useRouter } from 'next/navigation';
import { useRelativeTime } from '@/hooks/useRelativeTime';

type SaleDashboardItem = {
  id: number;
  table?: string | null;
  guest_name?: string | null;
  opened_by_name: string;
  opened_at: string;
  total_amount?: string;
};

interface Props {
  sale: SaleDashboardItem;
}

export function SaleCard({ sale }: Props) {
  const router = useRouter();
  const relativeTime = useRelativeTime(sale.opened_at);

  const isDineIn = Boolean(sale.table);
  const title = isDineIn ? sale.table : 'بیرون‌بر';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/sale/${sale.id}`)}
      className="
        cursor-pointer rounded-2xl bg-white p-4
        shadow-sm hover:shadow-md transition-shadow
        flex flex-col gap-2
      "
    >
      <div className="text-lg font-semibold text-gray-900">
        {title}
      </div>

      <div className="text-sm text-gray-500">
        توسط {sale.opened_by_name}
      </div>

      <div className="text-sm text-gray-400">
        {relativeTime}
      </div>

      {'total_amount' in sale && sale.total_amount && (
        <div className="mt-1 text-sm text-gray-500">
          {sale.total_amount} تومان
        </div>
      )}
    </div>
  );
}
