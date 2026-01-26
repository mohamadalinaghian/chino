import { useRouter } from 'next/navigation';
import { THEME_COLORS } from '@/libs/constants';
import { getCurrentJalaliDate } from '@/utils/persianUtils';
import { SaleStateFilter } from '@/hooks/useDashboard';

interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading: boolean;
  filterUser: string;
  onFilterUserChange: (value: string) => void;
  filterTime: 'all' | 'today' | 'last_hour';
  onFilterTimeChange: (value: 'all' | 'today' | 'last_hour') => void;
  filterState: SaleStateFilter;
  onFilterStateChange: (value: SaleStateFilter) => void;
  isSuperuser: boolean;
}

export function DashboardHeader({
  onRefresh,
  isRefreshing,
  isLoading,
  filterUser,
  onFilterUserChange,
  filterTime,
  onFilterTimeChange,
  filterState,
  onFilterStateChange,
  isSuperuser,
}: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="p-4 border-b shadow-sm"
      style={{
        backgroundColor: THEME_COLORS.bgSecondary,
        borderColor: THEME_COLORS.border,
      }}
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <h1
            className="text-3xl font-bold"
            style={{ color: THEME_COLORS.text }}
          >
            داشبورد فروش
          </h1>
          <div className="flex gap-2 items-center">
            <span style={{ color: THEME_COLORS.subtext }} className="text-sm">
              {getCurrentJalaliDate('dddd، jD jMMMM jYYYY')}
            </span>
            <button
              onClick={() => router.push('/sale/new')}
              className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90"
              style={{
                backgroundColor: THEME_COLORS.green,
                color: '#fff',
              }}
            >
              + فروش جدید
            </button>
            <button
              onClick={onRefresh}
              disabled={isRefreshing || isLoading}
              className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: THEME_COLORS.accent,
                color: '#fff',
              }}
            >
              {isRefreshing ? '🔄 در حال بروزرسانی...' : '🔄 بروزرسانی'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="جستجوی کاربر..."
            value={filterUser}
            onChange={(e) => onFilterUserChange(e.target.value)}
            className="px-4 py-2 rounded-lg border outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: THEME_COLORS.surface,
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.text,
            }}
          />

          <select
            value={filterTime}
            onChange={(e) => onFilterTimeChange(e.target.value as any)}
            className="px-4 py-2 rounded-lg border outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: THEME_COLORS.surface,
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.text,
            }}
          >
            <option value="all">همه زمان‌ها</option>
            <option value="today">امروز</option>
            <option value="last_hour">یک ساعت اخیر</option>
          </select>

          {/* Sale State Filter - Only show for users who can see different states */}
          <select
            value={filterState}
            onChange={(e) => onFilterStateChange(e.target.value as SaleStateFilter)}
            className="px-4 py-2 rounded-lg border outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: THEME_COLORS.surface,
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.text,
            }}
          >
            <option value="OPEN">باز</option>
            <option value="CLOSED">بسته شده</option>
            {isSuperuser && <option value="CANCELED">لغو شده</option>}
            <option value="all">همه وضعیت‌ها</option>
          </select>
        </div>
      </div>
    </header>
  );
}
