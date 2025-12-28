/**
 * Extras Modal Component (Updated with Persian Money + Mobile UX)
 *
 * Features:
 * - Persian money formatting
 * - Larger tap targets
 * - Better mobile experience
 * - Visual feedback on add
 */

'use client';

import { useEffect, useState } from 'react';
import { MenuApiClient } from '@/libs/menu/menuApiClient';
import { formatPriceBadge } from '@/libs/tools/persianMoney';
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
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

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
   * Handle adding extra with visual feedback
   */
  const handleAdd = (extra: ProductExtra) => {
    onAddExtra(menuId, extra.id, extra.name, extra.price);

    // Visual feedback
    setAddedItems(prev => new Set(prev).add(extra.id));
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(extra.id);
        return next;
      });
    }, 500);
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70"
      onClick={onClose}
    >
      {/* Modal Content - Slides up on mobile */}
      <div
        className="
          bg-gray-800 rounded-t-3xl sm:rounded-2xl
          w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh]
          border-t-2 sm:border border-gray-700
          overflow-hidden
          flex flex-col
          animate-slide-up sm:animate-none
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
          <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <span>➕</span>
            <span>انتخاب افزودنی</span>
          </h3>
          <button
            onClick={onClose}
            className="
              w-10 h-10
              flex items-center justify-center
              text-gray-400 hover:text-gray-200
              hover:bg-gray-700
              rounded-lg
              text-2xl
              transition-colors
            "
          >
            ✕
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 animate-spin">⏳</div>
              <p className="text-gray-400">در حال بارگذاری...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                بستن
              </button>
            </div>
          )}

          {/* Extras Grid */}
          {!loading && !error && (
            <>
              {extras.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-5xl mb-4">📦</div>
                  <p className="text-lg">افزودنی‌ای یافت نشد</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {extras.map((extra) => {
                    const { value, unit } = formatPriceBadge(extra.price);
                    const isAdded = addedItems.has(extra.id);

                    return (
                      <button
                        key={extra.id}
                        onClick={() => handleAdd(extra)}
                        className={`
                          bg-gray-700 hover:bg-gray-650 active:bg-gray-600
                          border border-gray-600 hover:border-indigo-500
                          rounded-xl p-4
                          transition-all
                          hover:shadow-lg hover:scale-105
                          active:scale-95
                          text-right
                          min-h-[100px]
                          flex flex-col justify-between
                          ${isAdded ? 'bg-green-700 border-green-500 scale-105' : ''}
                        `}
                      >
                        {/* Extra Name */}
                        <h4 className="font-semibold text-gray-100 text-sm mb-2 line-clamp-2 leading-tight">
                          {extra.name}
                        </h4>

                        {/* Price - Persian Format */}
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-bold text-indigo-400 leading-none">
                            {value}
                          </span>
                          <span className="text-xs text-gray-500">{unit}</span>
                        </div>

                        {/* Added Indicator */}
                        {isAdded && (
                          <div className="absolute top-2 left-2 text-white text-lg">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Mobile sticky */}
        <div className="p-5 border-t border-gray-700 bg-gray-800 sticky bottom-0">
          <button
            onClick={onClose}
            className="
              w-full py-4 rounded-xl
              bg-gray-700 hover:bg-gray-600 active:bg-gray-650
              text-gray-200 font-medium text-lg
              transition-colors
              min-h-[56px]
            "
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
