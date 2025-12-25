'use client';

interface Props {
  salesCount: number;
  onRefresh(): void;
  onNewSale(): void;
  onLogout(): void;
}

export function DashboardHeader({
  salesCount,
  onRefresh,
  onNewSale,
  onLogout,
}: Props) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">فروش‌های فعال</h1>
          <p className="text-sm text-gray-600 mt-1">
            {salesCount} سفارش در حال انجام
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            به‌روزرسانی
          </button>

          <button
            onClick={onNewSale}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            + فروش جدید
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  );
}
