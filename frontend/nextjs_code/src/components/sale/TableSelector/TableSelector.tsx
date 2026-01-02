'use client';

import { useEffect, useState } from 'react';
import { ITable } from '@/types/sale';
import { fetchTables } from '@/service/sale';
import { THEME_COLORS } from '@/libs/constants';

interface TableSelectorProps {
  selectedTableId: number | null;
  onTableSelect: (tableId: number | null) => void;
}

export function TableSelector({
  selectedTableId,
  onTableSelect,
}: TableSelectorProps) {
  const [tables, setTables] = useState<ITable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTables();
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری میزها');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <label
          className="block mb-3 font-medium"
          style={{ color: THEME_COLORS.subtext }}
        >
          انتخاب میز
        </label>
        <div
          className="p-8 rounded-lg text-center"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto"
            style={{ borderColor: `${THEME_COLORS.accent} transparent transparent transparent` }}
          />
          <p className="mt-4" style={{ color: THEME_COLORS.subtext }}>
            در حال بارگذاری میزها...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <label
          className="block mb-3 font-medium"
          style={{ color: THEME_COLORS.subtext }}
        >
          انتخاب میز
        </label>
        <div
          className="p-6 rounded-lg text-center"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          <div
            className="text-4xl mb-3"
            style={{ color: THEME_COLORS.red }}
          >
            ⚠️
          </div>
          <p className="mb-4" style={{ color: THEME_COLORS.red }}>
            {error}
          </p>
          <button
            onClick={loadTables}
            className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
            style={{
              backgroundColor: THEME_COLORS.accent,
              color: THEME_COLORS.bgSecondary,
            }}
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="w-full">
        <label
          className="block mb-3 font-medium"
          style={{ color: THEME_COLORS.subtext }}
        >
          انتخاب میز
        </label>
        <div
          className="p-6 rounded-lg text-center"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          <p style={{ color: THEME_COLORS.subtext }}>
            هیچ میز فعالی موجود نیست
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label
        className="block mb-3 font-medium"
        style={{ color: THEME_COLORS.subtext }}
      >
        انتخاب میز
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onTableSelect(table.id)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-300
              flex flex-col items-center justify-center gap-2
              hover:scale-105 active:scale-95
            `}
            style={{
              borderColor:
                selectedTableId === table.id
                  ? THEME_COLORS.accent
                  : THEME_COLORS.border,
              backgroundColor:
                selectedTableId === table.id
                  ? THEME_COLORS.surface
                  : THEME_COLORS.bgPrimary,
            }}
          >
            <span className="text-2xl">🪑</span>
            <span
              className="text-base font-bold"
              style={{
                color:
                  selectedTableId === table.id
                    ? THEME_COLORS.text
                    : THEME_COLORS.subtext,
              }}
            >
              {table.name}
            </span>
            <span
              className="text-xs"
              style={{
                color: THEME_COLORS.subtext,
              }}
            >
              {table.capacity} نفر
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
