interface Props {
  totalCount: number;
  staffName?: string;
}

export function SaleTopBar({ totalCount, staffName }: Props) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <h1 className="text-xl font-semibold text-gray-900">
        فروش‌های فعال
      </h1>

      <div className="text-sm text-gray-500 flex gap-2">
        <span>{totalCount} فروش باز</span>
        {staffName && <span>• {staffName}</span>}
      </div>
    </div>
  );
}
