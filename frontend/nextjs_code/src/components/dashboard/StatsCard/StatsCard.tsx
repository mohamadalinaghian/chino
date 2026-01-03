import { THEME_COLORS } from '@/libs/constants';
import { toPersianDigits, formatPersianMoney } from '@/utils/persianUtils';

interface StatsCardProps {
  totalSales: number;
  totalRevenue: number;
}

export function StatsCard({ totalSales, totalRevenue }: StatsCardProps) {
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div
      className="p-6 rounded-lg mb-4 shadow-md"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div
            className="text-sm mb-1"
            style={{ color: THEME_COLORS.subtext }}
          >
            تعداد فروش‌های باز
          </div>
          <div
            className="text-3xl font-bold"
            style={{ color: THEME_COLORS.accent }}
          >
            {toPersianDigits(totalSales)}
          </div>
        </div>
        <div>
          <div
            className="text-sm mb-1"
            style={{ color: THEME_COLORS.subtext }}
          >
            مجموع درآمد
          </div>
          <div
            className="text-3xl font-bold"
            style={{
              color: THEME_COLORS.green,
              fontFamily: 'Tahoma, Arial, sans-serif',
            }}
          >
            {formatPersianMoney(totalRevenue)}
          </div>
        </div>
        <div>
          <div
            className="text-sm mb-1"
            style={{ color: THEME_COLORS.subtext }}
          >
            میانگین هر سفارش
          </div>
          <div
            className="text-2xl font-bold"
            style={{
              color: THEME_COLORS.text,
              fontFamily: 'Tahoma, Arial, sans-serif',
            }}
          >
            {totalSales > 0 ? formatPersianMoney(averageOrderValue) : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
