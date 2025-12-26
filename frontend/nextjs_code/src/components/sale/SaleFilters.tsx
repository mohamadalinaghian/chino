'use client';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  timeFilter?: string;
  onTimeFilterChange: (v?: string) => void;
  onClear: () => void;
}

export function SaleFilters({
  search,
  onSearchChange,
  timeFilter,
  onTimeFilterChange,
  onClear,
}: Props) {
  return (
    <div className="flex flex-col gap-3 my-4">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="جستجو..."
        className="
          w-full rounded-xl border border-gray-200
          px-4 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-gray-200
        "
      />

      <div className="flex gap-2 text-sm">
        <select
          value={timeFilter ?? ''}
          onChange={(e) =>
            onTimeFilterChange(e.target.value || undefined)
          }
          className="rounded-xl border border-gray-200 px-3 py-2"
        >
          <option value="">همه زمان‌ها</option>
          <option value="LT_30">کمتر از ۳۰ دقیقه</option>
          <option value="30_90">۳۰ تا ۹۰ دقیقه</option>
          <option value="GT_90">بیش از ۹۰ دقیقه</option>
        </select>

        <button
          onClick={onClear}
          className="text-gray-500 px-3"
        >
          پاک‌سازی
        </button>
      </div>
    </div>
  );
}
