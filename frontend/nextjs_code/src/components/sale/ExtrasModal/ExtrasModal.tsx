'use client';
import { useState, useEffect } from 'react';
import { IMenuItemForSale, IExtraItem } from '@/types/sale';
import { fetchExtras } from '@/service/sale';
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

interface ExtraSelection {
  extra: IExtraItem;
  quantity: number;
}

export function ExtrasModal({ item, isOpen, onClose, onConfirm }: ExtrasModalProps) {
  const [extras, setExtras] = useState<IExtraItem[]>([]);
  const [filteredExtras, setFilteredExtras] = useState<IExtraItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selections, setSelections] = useState<Record<number, ExtraSelection>>({});
  const [mainQuantity, setMainQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      loadExtras();
      setSearchQuery(''); // Clear search when reopening
    } else {
      resetState();
    }
  }, [isOpen, item]);

  // Filter extras when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredExtras(extras);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredExtras(
        extras.filter((extra) =>
          extra.name.toLowerCase().includes(lowerQuery) ||
          (extra.description && extra.description.toLowerCase().includes(lowerQuery))
        )
      );
    }
  }, [searchQuery, extras]);

  const resetState = () => {
    setExtras([]);
    setFilteredExtras([]);
    setSelections({});
    setMainQuantity(1);
    setSearchQuery('');
    setError(null);
  };

  const loadExtras = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchExtras();
      setExtras(data);
      setFilteredExtras(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری افزودنی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const toggleExtra = (extra: IExtraItem) => {
    setSelections((prev) => {
      const newSelections = { ...prev };
      if (newSelections[extra.id]) {
        delete newSelections[extra.id];
      } else {
        newSelections[extra.id] = { extra, quantity: 1 };
      }
      return newSelections;
    });
  };

  const setExtraQuantity = (extraId: number, quantity: number) => {
    if (quantity < 1) return;
    setSelections((prev) => ({
      ...prev,
      [extraId]: { ...prev[extraId], quantity },
    }));
  };

  const quickSetQuantity = (extraId: number, quantity: number) => {
    const extra = extras.find((e) => e.id === extraId);
    if (!extra) return;
    setSelections((prev) => ({
      ...prev,
      [extraId]: { extra, quantity },
    }));
  };

  const calculateTotal = () => {
    if (!item) return 0;
    const itemPrice = item.price * mainQuantity;
    const extrasPrice = Object.values(selections).reduce(
      (sum, { extra, quantity }) => sum + extra.price * quantity * mainQuantity,
      0
    );
    return itemPrice + extrasPrice;
  };

  const handleConfirm = () => {
    if (!item) return;
    const selectedExtras: SelectedExtra[] = Object.values(selections);
    onConfirm(item, selectedExtras, mainQuantity);
    onClose();
  };

  if (!isOpen || !item) return null;

  const selectedCount = Object.keys(selections).length;
  const displayExtras = filteredExtras;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl"
        style={{ backgroundColor: THEME_COLORS.bgPrimary }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-4 border-b"
          style={{
            borderColor: THEME_COLORS.border,
            background: `linear-gradient(135deg, ${THEME_COLORS.bgSecondary} 0%, ${THEME_COLORS.surface} 100%)`,
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1" style={{ color: THEME_COLORS.text }}>
                {item.name}
              </h2>
              <p className="text-lg" style={{ color: THEME_COLORS.green }}>
                {formatPersianMoney(item.price)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-2xl w-10 h-10 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
              style={{
                color: THEME_COLORS.red,
                backgroundColor: THEME_COLORS.bgPrimary,
              }}
            >
              ✕
            </button>
          </div>

          {/* Main Item Quantity */}
          <div className="p-3 rounded-lg flex justify-between items-center" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
            <span className="font-bold" style={{ color: THEME_COLORS.text }}>تعداد سفارش:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMainQuantity(Math.max(1, mainQuantity - 1))}
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
                disabled={mainQuantity === 1}
              >
                −
              </button>
              <span className="w-14 text-center font-bold text-xl" style={{ color: THEME_COLORS.accent }}>
                {toPersianDigits(mainQuantity)}
              </span>
              <button
                onClick={() => setMainQuantity(mainQuantity + 1)}
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* NEW: Search Box */}
        <div className="px-4 pt-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی افزودنی..."
              className="w-full px-4 py-3 pr-12 rounded-lg text-right outline-none transition-all"
              style={{
                backgroundColor: THEME_COLORS.bgSecondary,
                color: THEME_COLORS.text,
                border: `1px solid ${THEME_COLORS.border}`,
              }}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none" style={{ color: THEME_COLORS.subtext }}>
              🔍
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mb-4"
                style={{ borderColor: `${THEME_COLORS.accent} transparent transparent transparent` }} />
              <p style={{ color: THEME_COLORS.subtext }}>در حال بارگذاری افزودنی‌ها...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
              <p className="mb-4 text-lg" style={{ color: THEME_COLORS.red }}>{error}</p>
              <button
                onClick={loadExtras}
                className="px-8 py-3 rounded-lg font-bold transition-all hover:opacity-90"
                style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
              >
                تلاش مجدد
              </button>
            </div>
          )}

          {!loading && !error && displayExtras.length === 0 && (
            <div className="p-8 rounded-lg text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
              <div className="text-6xl mb-4">
                {searchQuery ? '🔍' : '🍯'}
              </div>
              <p className="text-lg" style={{ color: THEME_COLORS.subtext }}>
                {searchQuery ? 'افزودنی یافت نشد' : 'افزودنی موجود نیست'}
              </p>
            </div>
          )}

          {!loading && !error && displayExtras.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg" style={{ color: THEME_COLORS.text }}>
                  افزودنی‌های موجود
                </h3>
                {selectedCount > 0 && (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                  >
                    {toPersianDigits(selectedCount)} مورد انتخاب شده
                  </span>
                )}
              </div>

              {displayExtras.map((extra) => {
                const isSelected = !!selections[extra.id];
                const quantity = selections[extra.id]?.quantity || 1;
                return (
                  <div
                    key={extra.id}
                    className={`rounded-lg border-2 transition-all ${isSelected ? 'ring-2 ring-offset-1' : ''}`}
                    style={{
                      backgroundColor: isSelected ? THEME_COLORS.surface : THEME_COLORS.bgSecondary,
                      borderColor: isSelected ? THEME_COLORS.accent : THEME_COLORS.border,
                      // ringColor: isSelected ? THEME_COLORS.accent : 'transparent',
                      // ringOffsetColor: THEME_COLORS.bgPrimary,
                    }}
                  >
                    {/* Toggle Header */}
                    <div className="p-4 cursor-pointer" onClick={() => toggleExtra(extra)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 ml-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'scale-110' : ''}`}
                              style={{
                                borderColor: isSelected ? THEME_COLORS.accent : THEME_COLORS.border,
                                backgroundColor: isSelected ? THEME_COLORS.accent : 'transparent',
                              }}
                            >
                              {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                            </div>
                            <h4 className="font-bold text-base" style={{ color: THEME_COLORS.text }}>
                              {extra.name}
                            </h4>
                          </div>
                          {extra.description && (
                            <p className="text-sm mr-8" style={{ color: THEME_COLORS.subtext }}>
                              {extra.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="font-bold text-base" style={{ color: THEME_COLORS.green }}>
                            {formatPersianMoney(extra.price)}
                          </p>
                          {isSelected && quantity > 1 && (
                            <p className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                              جمع: {formatPersianMoney(extra.price * quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    {isSelected && (
                      <div className="px-4 pb-4 pt-0" onClick={(e) => e.stopPropagation()}>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold" style={{ color: THEME_COLORS.text }}>تعداد:</span>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3].map((q) => (
                                <button
                                  key={q}
                                  onClick={() => quickSetQuantity(extra.id, q)}
                                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-all hover:scale-105 ${quantity === q ? 'ring-2' : ''}`}
                                  style={{
                                    backgroundColor: quantity === q ? THEME_COLORS.accent : THEME_COLORS.surface,
                                    color: quantity === q ? '#fff' : THEME_COLORS.text,
                                    // ringColor: THEME_COLORS.accent,
                                  }}
                                >
                                  {toPersianDigits(q)}
                                </button>
                              ))}
                              <div className="w-px h-8 mx-1" style={{ backgroundColor: THEME_COLORS.border }} />
                              <button
                                onClick={() => setExtraQuantity(extra.id, quantity - 1)}
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-all hover:scale-105"
                                style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
                                disabled={quantity === 1}
                              >
                                −
                              </button>
                              <span className="w-10 text-center font-bold" style={{ color: THEME_COLORS.accent }}>
                                {toPersianDigits(quantity)}
                              </span>
                              <button
                                onClick={() => setExtraQuantity(extra.id, quantity + 1)}
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-all hover:scale-105"
                                style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: THEME_COLORS.border, backgroundColor: THEME_COLORS.bgSecondary }}>
          {selectedCount > 0 && (
            <div className="p-3 rounded-lg space-y-1.5" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
              <p className="text-xs font-bold mb-2" style={{ color: THEME_COLORS.subtext }}>
                افزودنی‌های انتخاب شده:
              </p>
              {Object.values(selections).map(({ extra, quantity }) => (
                <div key={extra.id} className="flex justify-between text-sm">
                  <span style={{ color: THEME_COLORS.text }}>
                    {extra.name} {quantity > 1 && `(×${toPersianDigits(quantity)})`}
                  </span>
                  <span style={{ color: THEME_COLORS.green }}>
                    {formatPersianMoney(extra.price * quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center py-2 px-3 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
            <span className="font-bold text-lg" style={{ color: THEME_COLORS.text }}>جمع کل:</span>
            <span className="font-bold text-2xl" style={{ color: THEME_COLORS.green }}>
              {formatPersianMoney(calculateTotal())}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-lg font-bold transition-all hover:opacity-80 active:scale-95"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              انصراف
            </button>
            <button
              onClick={handleConfirm}
              className="flex-[2] py-3 rounded-lg font-bold text-lg transition-all hover:opacity-90 active:scale-95 shadow-lg"
              style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
            >
              افزودن به سبد ({toPersianDigits(mainQuantity)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
