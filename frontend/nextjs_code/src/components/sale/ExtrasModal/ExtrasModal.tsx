'use client';

import { useState, useEffect } from 'react';
import { IMenuItemForSale, IExtraItem } from '@/types/sale';
import { fetchExtrasForItem } from '@/service/sale';
import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney, toPersianDigits } from '@/utils/persianUtils';

interface ExtrasModalProps {
  item: IMenuItemForSale | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: IMenuItemForSale, selectedExtras: SelectedExtra[], quantity: number) => void;
}

export interface SelectedExtra {
  extra: IExtraItem;
  quantity: number;
}

export function ExtrasModal({ item, isOpen, onClose, onConfirm }: ExtrasModalProps) {
  const [extras, setExtras] = useState<IExtraItem[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Map<number, number>>(new Map());
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      loadExtras();
    } else {
      // Reset state when modal closes
      setExtras([]);
      setSelectedExtras(new Map());
      setQuantity(1);
      setError(null);
    }
  }, [isOpen, item]);

  const loadExtras = async () => {
    if (!item) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchExtrasForItem(item.id);
      setExtras(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری افزودنی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleExtraQuantityChange = (extraId: number, change: number) => {
    setSelectedExtras((prev) => {
      const newMap = new Map(prev);
      const currentQty = newMap.get(extraId) || 0;
      const newQty = Math.max(0, currentQty + change);

      if (newQty === 0) {
        newMap.delete(extraId);
      } else {
        newMap.set(extraId, newQty);
      }

      return newMap;
    });
  };

  const calculateTotal = () => {
    if (!item) return 0;

    const itemPrice = item.price * quantity;
    const extrasPrice = Array.from(selectedExtras.entries()).reduce(
      (sum, [extraId, qty]) => {
        const extra = extras.find((e) => e.id === extraId);
        return sum + (extra ? extra.price * qty * quantity : 0);
      },
      0
    );

    return itemPrice + extrasPrice;
  };

  const handleConfirm = () => {
    if (!item) return;

    const selected: SelectedExtra[] = Array.from(selectedExtras.entries())
      .map(([extraId, qty]) => {
        const extra = extras.find((e) => e.id === extraId);
        return extra ? { extra, quantity: qty } : null;
      })
      .filter((e): e is SelectedExtra => e !== null);

    onConfirm(item, selected, quantity);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-lg overflow-hidden flex flex-col"
        style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-3 border-b flex justify-between items-start"
          style={{ borderColor: THEME_COLORS.border }}
        >
          <div className="flex-1">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: THEME_COLORS.text }}
            >
              {item.name}
            </h2>
            <p
              className="text-sm"
              style={{ color: THEME_COLORS.green }}
            >
              {formatPersianMoney(item.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:scale-110 transition-transform"
            style={{ color: THEME_COLORS.red }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-12">
              <div
                className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto"
                style={{
                  borderColor: `${THEME_COLORS.accent} transparent transparent transparent`,
                }}
              />
              <p className="mt-4" style={{ color: THEME_COLORS.subtext }}>
                در حال بارگذاری افزودنی‌ها...
              </p>
            </div>
          )}

          {error && (
            <div
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: THEME_COLORS.bgPrimary }}
            >
              <p className="mb-4" style={{ color: THEME_COLORS.red }}>
                {error}
              </p>
              <button
                onClick={loadExtras}
                className="px-6 py-2 rounded-lg font-bold"
                style={{
                  backgroundColor: THEME_COLORS.accent,
                  color: THEME_COLORS.bgSecondary,
                }}
              >
                تلاش مجدد
              </button>
            </div>
          )}

          {!loading && !error && extras.length === 0 && (
            <div
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: THEME_COLORS.bgPrimary }}
            >
              <p style={{ color: THEME_COLORS.subtext }}>
                افزودنی موجود نیست
              </p>
            </div>
          )}

          {!loading && !error && extras.length > 0 && (
            <div className="space-y-3">
              <h3
                className="font-bold mb-4"
                style={{ color: THEME_COLORS.text }}
              >
                افزودنی‌های موجود:
              </h3>
              {extras.map((extra) => {
                const qty = selectedExtras.get(extra.id) || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={extra.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected ? 'border-accent' : ''
                    }`}
                    style={{
                      backgroundColor: THEME_COLORS.bgPrimary,
                      borderColor: isSelected
                        ? THEME_COLORS.accent
                        : THEME_COLORS.border,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4
                          className="font-bold"
                          style={{ color: THEME_COLORS.text }}
                        >
                          {extra.name}
                        </h4>
                        {extra.description && (
                          <p
                            className="text-sm mt-1"
                            style={{ color: THEME_COLORS.subtext }}
                          >
                            {extra.description}
                          </p>
                        )}
                        <p
                          className="text-sm mt-2"
                          style={{ color: THEME_COLORS.green }}
                        >
                          {formatPersianMoney(extra.price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mr-4">
                        <button
                          onClick={() => handleExtraQuantityChange(extra.id, -1)}
                          className="w-8 h-8 rounded-md flex items-center justify-center font-bold transition-all hover:scale-110"
                          style={{
                            backgroundColor: THEME_COLORS.surface,
                            color: THEME_COLORS.text,
                          }}
                          disabled={qty === 0}
                        >
                          −
                        </button>
                        <span
                          className="w-8 text-center font-bold"
                          style={{ color: THEME_COLORS.text }}
                        >
                          {toPersianDigits(qty)}
                        </span>
                        <button
                          onClick={() => handleExtraQuantityChange(extra.id, 1)}
                          className="w-8 h-8 rounded-md flex items-center justify-center font-bold transition-all hover:scale-110"
                          style={{
                            backgroundColor: THEME_COLORS.accent,
                            color: THEME_COLORS.bgSecondary,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-3 border-t space-y-4"
          style={{ borderColor: THEME_COLORS.border }}
        >
          {/* Main Item Quantity */}
          <div className="flex justify-between items-center">
            <span
              className="font-bold"
              style={{ color: THEME_COLORS.text }}
            >
              تعداد:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-md flex items-center justify-center font-bold text-xl transition-all hover:scale-110"
                style={{
                  backgroundColor: THEME_COLORS.surface,
                  color: THEME_COLORS.text,
                }}
              >
                −
              </button>
              <span
                className="w-12 text-center font-bold text-xl"
                style={{ color: THEME_COLORS.text }}
              >
                {toPersianDigits(quantity)}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-md flex items-center justify-center font-bold text-xl transition-all hover:scale-110"
                style={{
                  backgroundColor: THEME_COLORS.accent,
                  color: THEME_COLORS.bgSecondary,
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          <div
            className="flex justify-between items-center py-1.5 border-t"
            style={{ borderColor: THEME_COLORS.border }}
          >
            <span
              className="font-bold text-lg"
              style={{ color: THEME_COLORS.text }}
            >
              جمع کل:
            </span>
            <span
              className="font-bold text-2xl"
              style={{ color: THEME_COLORS.green }}
            >
              {formatPersianMoney(calculateTotal())}
            </span>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full py-2 rounded-lg font-bold text-lg transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: THEME_COLORS.accent,
              color: THEME_COLORS.bgSecondary,
            }}
          >
            افزودن به سبد خرید
          </button>
        </div>
      </div>
    </div>
  );
}
