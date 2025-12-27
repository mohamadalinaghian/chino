/**
 * Extras Modal Component
 *
 * Features:
 * - Lazy-loads extra products when opened
 * - Displays available extras
 * - Add extras to cart item
 * - Full-screen modal with backdrop
 */

'use client';

import { useEffect, useState } from 'react';
import { MenuApiClient } from '@/libs/menu/menuApiClient';
import type { ProductExtra } from '@/types/newSaleTypes';

interface Props {
  menuId: number;
  onClose: () => void;
  onAddExtra: (
    menuId: number,
    productId: number,
    name: string,
    price: number
  ) => void;
}

export function ExtrasModal({ menuId, onClose, onAddExtra }: Props) {
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch extras when modal opens
   */
  useEffect(() => {
    const fetchExtras = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await MenuApiClient.getExtras();
        setExtras(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'خطا در بارگذاری افزودنی‌ها'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExtras();
  }, []);

  /**
   * Handle adding extra and closing modal
   */
  const handleAdd = (extra: ProductExtra) => {
    onAddExtra(menuId, extra.id, extra.name, extra.price);
    // Don't close modal - user might want to add multiple extras
  };

  /**
   * Prevent background scroll when modal is open
   */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="
          bg-gray-800 rounded-2xl
          max-w-2xl w-full max-h-[80vh]
          border border-gray-700
          overflow-hidden
          flex flex-col
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-xl font-bold text-gray-100">
            انتخاب افزودنی
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-gray-400">در حال بارگذاری...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Extras Grid */}
          {!loading && !error && (
            <>
              {extras.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">📦</div>
                  <p>افزودنی‌ای یافت نشد</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {extras.map((extra) => (
                    <button
                      key={extra.id}
                      onClick={() => handleAdd(extra)}
                      className="
                        bg-gray-700 hover:bg-gray-650
                        border border-gray-600 hover:border-indigo-500
                        rounded-xl p-4
                        transition-all
                        hover:shadow-lg hover:scale-105
                        active:scale-95
                        text-right
                      "
                    >
                      <h4 className="font-semibold text-gray-100 text-sm mb-2 truncate">
                        {extra.name}
                      </h4>
                      <div className="flex items-baseline gap-1 text-indigo-400">
                        <span className="font-bold">
                          {extra.price.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-xs text-gray-500">هزار تومان</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700">
          <button
            onClick={onClose}
            className="
              w-full py-3 rounded-xl
              bg-gray-700 hover:bg-gray-600
              text-gray-200 font-medium
              transition-colors
            "
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
