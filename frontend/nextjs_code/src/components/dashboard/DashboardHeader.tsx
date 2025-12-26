/**
 * Dashboard header component
 *
 * Displays:
 * - Active sales count
 * - User name
 * - Action buttons (refresh, new sale, logout)
 */

'use client';

interface DashboardHeaderProps {
  /** Current authenticated user's name */
  userName: string;
  /** Number of active sales */
  salesCount: number;
  /** Callback to refresh dashboard data */
  onRefresh(): void;
  /** Callback to create new sale */
  onNewSale(): void;
  /** Callback to logout */
  onLogout(): void;
}

/**
 * Header component for dashboard page
 */
export function DashboardHeader({
  userName,
  salesCount,
  onRefresh,
  onNewSale,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top row: Title and user info */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              فروش‌های فعال
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {salesCount} سفارش در حال انجام
            </p>
          </div>

          <div className="text-left">
            <p className="text-sm text-gray-600">خوش آمدید</p>
            <p className="font-semibold text-gray-900">{userName}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-700 font-medium"
            title="به‌روزرسانی لیست فروش‌ها"
          >
            🔄 به‌روزرسانی
          </button>

          <button
            onClick={onNewSale}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm"
            title="ایجاد فروش جدید"
          >
            ✨ + فروش جدید
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition font-medium"
            title="خروج از حساب کاربری"
          >
            🚪 خروج
          </button>
        </div>
      </div>
    </header>
  );
}
