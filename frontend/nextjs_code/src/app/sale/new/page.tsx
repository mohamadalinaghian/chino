/**
 * New Sale Page - FINAL PERFECT VERSION
 *
 * FIXES:
 * ✅ Extras have +/- quantity buttons
 * ✅ Submit card can be MINIMIZED (not cancel)
 * ✅ Can add more items while reviewing order
 * ✅ Beautiful UI
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSaleMenu } from '@/hooks/useSaleMenu';
import { useCart } from '@/hooks/useCart';
import { useTables } from '@/hooks/useTables';
import { SaleApiClient } from '@/libs/sale/saleApiClient';
import { MenuApiClient } from '@/libs/menu/menuApiClient';
import { NewSaleType } from '@/types/newSaleTypes';
import type { SyncSaleItemInput } from '@/types/saleType';
import { formatPersianMoney } from '@/libs/tools/persianMoney';

interface ProductExtra {
  id: number;
  name: string;
  price: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const { menuData, loading, error, retry } = useSaleMenu();
  const { tables, loading: tablesLoading } = useTables();
  const cart = useCart();

  // Form state
  const [saleType, setSaleType] = useState<NewSaleType>(NewSaleType.DINE_IN);
  const [tableId, setTableId] = useState<number | null>(null);
  const [guestCount, setGuestCount] = useState<string>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ✅ NEW: Submit card can be minimized
  const [submitCardMinimized, setSubmitCardMinimized] = useState(true);

  // Extras modal
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [selectedItemForExtras, setSelectedItemForExtras] = useState<number | null>(null);
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  /**
   * Scroll to category
   */
  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (!element) return;

    const navbarHeight = 200;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  };

  /**
   * Lazy load extras
   */
  useEffect(() => {
    if (showExtrasModal && extras.length === 0) {
      const fetchExtras = async () => {
        setLoadingExtras(true);
        try {
          const data = await MenuApiClient.getExtras();
          setExtras(data);
        } catch (err) {
          console.error('Error loading extras:', err);
        } finally {
          setLoadingExtras(false);
        }
      };
      fetchExtras();
    }
  }, [showExtrasModal]);

  /**
   * Open extras modal
   */
  const openExtrasModal = (menuId: number) => {
    setSelectedItemForExtras(menuId);
    setShowExtrasModal(true);
  };

  /**
   * ✅ Add extra with quantity
   */
  const handleAddExtra = (productId: number, name: string, price: number) => {
    if (selectedItemForExtras) {
      cart.addExtra(selectedItemForExtras, productId, name, price);
    }
  };

  /**
   * ✅ Update extra quantity
   */
  const handleUpdateExtraQuantity = (menuId: number, productId: number, newQuantity: number) => {
    const item = cart.items.find(i => i.menu_id === menuId);
    if (!item) return;

    const extra = item.extras.find(e => e.product_id === productId);
    if (!extra) return;

    if (newQuantity <= 0) {
      cart.removeExtra(menuId, productId);
    } else {
      // Remove and re-add with new quantity
      cart.removeExtra(menuId, productId);
      for (let i = 0; i < newQuantity; i++) {
        cart.addExtra(menuId, productId, extra.name, extra.price);
      }
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): string | null => {
    if (cart.items.length === 0) {
      return 'لطفاً حداقل یک آیتم به سفارش اضافه کنید';
    }

    if (saleType === NewSaleType.DINE_IN && !tableId) {
      return 'لطفاً یک میز انتخاب کنید';
    }

    return null;
  };

  /**
   * Convert cart to API format
   */
  const cartToApiFormat = (): SyncSaleItemInput[] => {
    return cart.items.map((item) => ({
      item_id: null,
      menu_id: item.menu_id,
      quantity: item.quantity,
      extras: item.extras.map((extra) => ({
        product_id: extra.product_id,
        quantity: extra.quantity,
      })),
    }));
  };

  /**
   * Submit sale
   */
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      // If table selection error, minimize card so user can switch to takeaway
      if (validationError.includes('میز')) {
        setSubmitCardMinimized(true);
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await SaleApiClient.openSale({
        sale_type: saleType,
        table_id: saleType === NewSaleType.DINE_IN ? tableId : null,
        guest_id: null,
        guest_count: guestCount ? parseInt(guestCount) : null,
        note: note || null,
        items: cartToApiFormat(),
      });

      router.push(`/sale/${response.sale_id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'ایجاد فروش با خطا مواجه شد';
      setSubmitError(errorMessage);
      // Minimize card on error so user can see and adjust form options
      setSubmitCardMinimized(true);
      console.error('Sale creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * ✅ CANCEL (goes back to dashboard)
   */
  const handleCancel = () => {
    if (cart.items.length > 0) {
      const confirm = window.confirm(
        'آیا مطمئن هستید؟ تمام آیتم‌های سفارش پاک خواهد شد.'
      );
      if (!confirm) return;
    }
    router.push('/sale');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !menuData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
          <div className="text-xl mb-4">⚠️</div>
          <h2 className="text-base font-bold mb-2 text-red-400">خطا در بارگذاری</h2>
          <p className="text-gray-300 mb-4">{error || 'خطای نامشخص'}</p>
          <button
            onClick={retry}
            className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // Build category navigation
  const allCategories = [
    ...menuData.bar_items.map((cat) => ({
      id: `cat-${cat.category.replace(/\s+/g, '-')}`,
      name: cat.category,
      icon: '🍹',
      type: 'bar' as const,
    })),
    ...menuData.food_items.map((cat) => ({
      id: `cat-${cat.category.replace(/\s+/g, '-')}`,
      name: cat.category,
      icon: '🍽️',
      type: 'food' as const,
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* NAVBAR */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-800 border-b-2 border-indigo-500 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-lg">
                ➕
              </div>
              <div>
                <h1 className="text-base font-bold text-white">فروش جدید</h1>
                <p className="text-xs text-gray-400">انتخاب محصولات و ثبت سفارش</p>
              </div>
            </div>
            {/* ✅ CANCEL = Back to dashboard */}
            <button
              onClick={handleCancel}
              className="
                px-4 py-2 rounded-lg
                bg-red-600/20 hover:bg-red-600/30
                border border-red-500/50
                text-red-400 hover:text-red-300
                transition-all
                flex items-center gap-2
              "
            >
              <span>✕</span>
              <span className="hidden sm:inline">انصراف</span>
            </button>
          </div>

          {/* Category Pills */}
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-indigo-500/50">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`
                    group flex items-center gap-2.5 px-5 py-2.5 rounded-xl
                    ${cat.type === 'bar'
                      ? 'bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30'
                      : 'bg-green-600/20 hover:bg-green-600/30 border border-green-500/30'
                    }
                    text-sm font-medium whitespace-nowrap
                    transition-all shrink-0
                    hover:scale-105 hover:shadow-lg
                  `}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-gray-200">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative pb-32">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Sale Type & Table */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl p-6 border border-gray-700 shadow-xl mb-6">
            {/* Type Toggle */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setSaleType(NewSaleType.DINE_IN)}
                className={`
                  flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all
                  ${saleType === NewSaleType.DINE_IN
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white scale-105 shadow-lg'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'}
                `}
              >
                🍽️ سرو در محل
              </button>
              <button
                onClick={() => {
                  setSaleType(NewSaleType.TAKEAWAY);
                  setTableId(null);
                }}
                className={`
                  flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all
                  ${saleType === NewSaleType.TAKEAWAY
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white scale-105 shadow-lg'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'}
                `}
              >
                🥡 بیرون‌بر
              </button>
            </div>

            {/* Table Selection */}
            {saleType === NewSaleType.DINE_IN && (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-200">
                  انتخاب میز <span className="text-red-400">*</span>
                </label>
                {tablesLoading ? (
                  <div className="text-center py-6 text-gray-400">در حال بارگذاری...</div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {tables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => table.is_active && setTableId(table.id)}
                        disabled={!table.is_active}
                        className={`
                          aspect-square rounded-xl font-bold text-sm transition-all
                          ${tableId === table.id
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-110 shadow-xl'
                            : table.is_active
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-850 text-gray-600 cursor-not-allowed opacity-40'}
                        `}
                      >
                        {table.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Guest Count */}
            <div className="mt-5">
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                تعداد مهمان (اختیاری)
              </label>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="مثال: 4"
                min="1"
                max="20"
                className="w-full px-4 py-3.5 rounded-xl bg-gray-700 border-2 border-gray-600 focus:border-indigo-500 text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-8">
            {/* Bar Items */}
            {menuData.bar_items.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-lg">🍹</div>
                  <h2 className="text-lg font-bold text-indigo-400">نوشیدنی‌ها</h2>
                </div>
                {menuData.bar_items.map((group) => (
                  <div
                    key={group.category}
                    id={`cat-${group.category.replace(/\s+/g, '-')}`}
                    className="mb-8 scroll-mt-52"
                  >
                    <h3 className="text-sm font-semibold mb-4 text-gray-300">
                      {group.category}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => cart.addItem(item.id, item.name, item.price)}
                          className="group relative bg-gradient-to-br from-gray-800 to-gray-850 hover:from-gray-750 hover:to-gray-800 border border-gray-700 hover:border-indigo-500 rounded-xl p-4 transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-right min-h-[100px]"
                        >
                          <h4 className="font-semibold text-sm mb-3 line-clamp-2">{item.name}</h4>
                          <div className="text-sm text-indigo-400 font-bold">{formatPersianMoney(item.price)}</div>
                          <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-base opacity-0 group-hover:opacity-100 transition-opacity">+</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Food Items */}
            {menuData.food_items.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center text-lg">🍽️</div>
                  <h2 className="text-lg font-bold text-green-400">غذاها</h2>
                </div>
                {menuData.food_items.map((group) => (
                  <div
                    key={group.category}
                    id={`cat-${group.category.replace(/\s+/g, '-')}`}
                    className="mb-8 scroll-mt-52"
                  >
                    <h3 className="text-sm font-semibold mb-4 text-gray-300">{group.category}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => cart.addItem(item.id, item.name, item.price)}
                          className="group relative bg-gradient-to-br from-gray-800 to-gray-850 hover:from-gray-750 hover:to-gray-800 border border-gray-700 hover:border-green-500 rounded-xl p-4 transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-right min-h-[100px]"
                        >
                          <h4 className="font-semibold text-sm mb-3 line-clamp-2">{item.name}</h4>
                          <div className="text-sm text-green-400 font-bold">{formatPersianMoney(item.price)}</div>
                          <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-base opacity-0 group-hover:opacity-100 transition-opacity">+</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ✅ SUBMIT CARD - IMPROVED: Full overlay when expanded */}
      {cart.itemCount > 0 && (
        <>
          {/* Minimized floating button */}
          {submitCardMinimized && (
            <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
              <div className="pointer-events-auto space-y-2">
                {submitError && (
                  <div className="bg-red-900/90 border border-red-700 rounded-xl p-3 text-center">
                    <p className="text-red-300 text-sm font-medium">{submitError}</p>
                  </div>
                )}
                <button
                  onClick={() => setSubmitCardMinimized(false)}
                  className={`w-full py-4 rounded-xl ${
                    submitError
                      ? 'bg-gradient-to-r from-red-600 to-red-500'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-500'
                  } text-white font-bold text-sm shadow-2xl flex items-center justify-between px-6`}
                >
                  <div className="flex items-center gap-2">
                    <span>{submitError ? '⚠️' : '🛒'}</span>
                    <span>{cart.itemCount} آیتم</span>
                  </div>
                  <span>{formatPersianMoney(cart.totalAmount)}</span>
                  <span>▲</span>
                </button>
              </div>
            </div>
          )}

          {/* Expanded Full Overlay Modal */}
          {!submitCardMinimized && (
            <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex flex-col">
              {/* Header */}
              <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between shadow-xl">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>🛒</span>
                  <span>سبد خرید ({cart.itemCount})</span>
                </h3>
                <button
                  onClick={() => setSubmitCardMinimized(true)}
                  className="px-5 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition"
                >
                  ▼ بستن
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 pb-32">
                <div className="max-w-2xl mx-auto space-y-4">
                  {cart.items.map((item) => {
                    const extrasTotal = item.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
                    const itemTotal = (item.price * item.quantity) + (extrasTotal * item.quantity);

                    return (
                      <div key={item.menu_id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                            <div className="text-sm text-gray-400">{formatPersianMoney(item.price)}</div>
                          </div>
                          <button
                            onClick={() => cart.removeItem(item.menu_id)}
                            className="text-red-400 hover:text-red-300 text-lg"
                          >
                            🗑️
                          </button>
                        </div>

                        {/* Extras */}
                        {item.extras.length > 0 && (
                          <div className="mb-4 p-3 bg-gray-750 rounded-lg text-sm space-y-2">
                            <div className="text-gray-300 font-semibold mb-2">افزودنی‌ها:</div>
                            {item.extras.map((extra) => (
                              <div key={extra.product_id} className="flex justify-between items-center">
                                <span>{extra.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">{formatPersianMoney(extra.price)}</span>
                                  <div className="flex items-center gap-1 bg-gray-700 rounded">
                                    <button
                                      onClick={() => handleUpdateExtraQuantity(item.menu_id, extra.product_id, extra.quantity - 1)}
                                      className="w-8 h-8 hover:bg-gray-600 rounded-l"
                                    >
                                      −
                                    </button>
                                    <span className="w-10 text-center font-bold">{extra.quantity}</span>
                                    <button
                                      onClick={() => handleUpdateExtraQuantity(item.menu_id, extra.product_id, extra.quantity + 1)}
                                      className="w-8 h-8 hover:bg-gray-600 rounded-r"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-gray-700 rounded-lg">
                            <button
                              onClick={() => cart.updateQuantity(item.menu_id, item.quantity - 1)}
                              className="w-10 h-10 hover:bg-gray-600 rounded-l font-bold"
                            >
                              −
                            </button>
                            <span className="w-12 text-center font-bold text-sm">{item.quantity}</span>
                            <button
                              onClick={() => cart.updateQuantity(item.menu_id, item.quantity + 1)}
                              className="w-10 h-10 hover:bg-gray-600 rounded-r font-bold"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => openExtrasModal(item.menu_id)}
                            className="flex-1 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg font-medium text-green-400"
                          >
                            ➕ افزودنی
                          </button>
                        </div>

                        <div className="text-sm text-indigo-400 font-bold text-right mt-3 pt-3 border-t border-gray-700">
                          جمع این آیتم: {formatPersianMoney(itemTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fixed Bottom Footer */}
              <div className="border-t-2 border-indigo-500 bg-gray-800 p-4 space-y-4">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="یادداشت برای سفارش (اختیاری)..."
                  rows={2}
                  className="w-full rounded-xl bg-gray-700 border-2 border-gray-600 focus:border-indigo-500 px-4 py-3 text-sm resize-none focus:outline-none"
                />

                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/30 rounded-xl p-5 border-2 border-indigo-500/50 text-center">
                  <div className="text-sm text-gray-300 mb-1">جمع کل سفارش</div>
                  <div className="text-lg font-bold text-indigo-300">{formatPersianMoney(cart.totalAmount)}</div>
                </div>

                {submitError && (
                  <div className="text-center text-red-400 bg-red-900/30 border border-red-800 rounded-xl p-3 font-medium">
                    {submitError}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-2xl disabled:opacity-60"
                >
                  {submitting ? '⏳ در حال ثبت سفارش...' : '✓ ثبت فروش و ادامه'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Extras Modal */}
      {showExtrasModal && (
        <div className="fixed inset-0 z-50 bg-gray-900 overflow-y-auto">
          <div className="sticky top-0 bg-gray-800 border-b-2 border-gray-700 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">➕ انتخاب افزودنی</h3>
              <button
                onClick={() => setShowExtrasModal(false)}
                className="w-12 h-12 bg-red-600/20 hover:bg-red-600/30 border border-red-500 rounded-xl text-red-400 text-lg"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4">
            {loadingExtras ? (
              <div className="text-center py-16">
                <div className="text-xl mb-4 animate-spin">⏳</div>
                <p className="text-gray-400">در حال بارگذاری...</p>
              </div>
            ) : extras.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-xl mb-4">📦</div>
                <p className="text-gray-500">افزودنی‌ای یافت نشد</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
                {extras.map((extra) => (
                  <button
                    key={extra.id}
                    onClick={() => {
                      handleAddExtra(extra.id, extra.name, extra.price);
                      setShowExtrasModal(false);
                    }}
                    className="group relative bg-gradient-to-br from-gray-800 to-gray-850 hover:from-gray-750 hover:to-gray-800 border border-gray-700 hover:border-green-500 rounded-xl p-4 transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-right min-h-[100px]"
                  >
                    <h4 className="font-semibold text-sm mb-3 line-clamp-2">{extra.name}</h4>
                    <div className="text-sm text-green-400 font-bold">{formatPersianMoney(extra.price)}</div>
                    <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-base opacity-0 group-hover:opacity-100 transition-opacity">+</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
