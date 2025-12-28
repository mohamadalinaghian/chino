/**
 * Sale Detail Page - /sale/[id]
 *
 * FEATURES:
 * ✅ View sale details with items and extras
 * ✅ Update items (add/remove/modify quantities)
 * ✅ Close sale (with permission check)
 * ✅ Cancel sale (with permission check)
 * ✅ Beautiful mobile-first UI
 * ✅ Real-time total calculation
 * ✅ Optimistic updates
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/libs/auth/AuthContext';
import { SaleApiClient } from '@/libs/sale/saleApiClient';
import { MenuApiClient } from '@/libs/menu/menuApiClient';
import { formatPersianMoney } from '@/libs/tools/persianMoney';
import type {
  SaleDetailResponse,
  SyncSaleItemInput,
  SaleItemDetailSchema,
  ExtraDetailSchema
} from '@/types/saleType';
import type { MenuItemSale, ProductExtra } from '@/types/newSaleTypes';

interface CartItem {
  item_id: number | null; // null for new items
  menu_id: number;
  name: string;
  price: number;
  quantity: number;
  extras: CartExtra[];
}

interface CartExtra {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function SaleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const saleId = parseInt(params.id as string);

  // Sale data
  const [sale, setSale] = useState<SaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isModified, setIsModified] = useState(false);

  // UI states
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [selectedItemForExtras, setSelectedItemForExtras] = useState<number | null>(null);

  // Menu data for adding items
  const [menuItems, setMenuItems] = useState<MenuItemSale[]>([]);
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingExtras, setLoadingExtras] = useState(false);

  // Permissions (from user)
  const canModify = user?.permissions?.includes('sale.modify_sale') || false;
  const canClose = user?.permissions?.includes('sale.close_sale') || false;
  const canCancel = user?.permissions?.includes('sale.cancel_sale') || false;

  /**
   * Load sale details
   */
  useEffect(() => {
    loadSale();
  }, [saleId]);

  const loadSale = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SaleApiClient.getSaleDetail(saleId);
      setSale(data);

      // Convert to cart format
      const cartItems: CartItem[] = data.items.map(item => ({
        item_id: item.id,
        menu_id: item.menu_id || 0,
        name: item.product_name,
        price: parseFloat(item.unit_price),
        quantity: item.quantity,
        extras: item.extras.map(extra => ({
          product_id: extra.product_id,
          name: extra.product_name,
          price: parseFloat(extra.unit_price),
          quantity: extra.quantity,
        })),
      }));

      setCart(cartItems);
      setIsModified(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load menu for adding items
   */
  const loadMenu = async () => {
    if (menuItems.length > 0) return; // Already loaded

    try {
      setLoadingMenu(true);
      const data = await MenuApiClient.getSaleMenu();
      const allItems = [
        ...data.bar_items.flatMap(cat => cat.items),
        ...data.food_items.flatMap(cat => cat.items),
      ];
      setMenuItems(allItems);
    } catch (err) {
      console.error('Error loading menu:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  /**
   * Load extras
   */
  const loadExtras = async () => {
    if (extras.length > 0) return; // Already loaded

    try {
      setLoadingExtras(true);
      const data = await MenuApiClient.getExtras();
      setExtras(data);
    } catch (err) {
      console.error('Error loading extras:', err);
    } finally {
      setLoadingExtras(false);
    }
  };

  /**
   * Add item to cart
   */
  const addItem = (menuId: number, name: string, price: number) => {
    const existingIndex = cart.findIndex(item => item.menu_id === menuId && item.item_id === null);

    if (existingIndex >= 0) {
      // Increase quantity of new item
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        item_id: null,
        menu_id: menuId,
        name,
        price,
        quantity: 1,
        extras: [],
      };
      setCart([...cart, newItem]);
    }

    setIsModified(true);
    setShowAddMenu(false);
  };

  /**
   * Update item quantity
   */
  const updateQuantity = (index: number, newQuantity: number) => {
    const qty = Math.max(0, Math.floor(newQuantity)); // Force integer
    if (qty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      const newCart = [...cart];
      newCart[index].quantity = qty;
      setCart(newCart);
    }
    setIsModified(true);
  };

  /**
   * Add extra to item
   */
  const addExtra = (itemIndex: number, productId: number, name: string, price: number) => {
    const newCart = [...cart];
    const item = newCart[itemIndex];

    const existingExtra = item.extras.find(e => e.product_id === productId);
    if (existingExtra) {
      existingExtra.quantity += 1;
    } else {
      item.extras.push({
        product_id: productId,
        name,
        price,
        quantity: 1,
      });
    }

    setCart(newCart);
    setIsModified(true);
  };

  /**
   * Update extra quantity
   */
  const updateExtraQuantity = (itemIndex: number, productId: number, newQuantity: number) => {
    const qty = Math.max(0, Math.floor(newQuantity)); // Force integer
    const newCart = [...cart];
    const item = newCart[itemIndex];
    if (qty <= 0) {
      item.extras = item.extras.filter(e => e.product_id !== productId);
    } else {
      const extra = item.extras.find(e => e.product_id === productId);
      if (extra) extra.quantity = qty;
    }
    setCart(newCart);
    setIsModified(true);
  };

  /**
   * Calculate total
   */
  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.price * item.quantity;
      const extrasPrice = item.extras.reduce((eSum, extra) =>
        eSum + (extra.price * extra.quantity * item.quantity), 0
      );
      return sum + itemPrice + extrasPrice;
    }, 0);
  };

  /**
   * Save changes
   */
  const handleSave = async () => {
    if (!isModified) return;

    try {
      setSaving(true);
      setError(null);

      // Convert cart to API format
      const items: SyncSaleItemInput[] = cart.map(item => ({
        item_id: item.item_id,
        menu_id: item.menu_id,
        quantity: item.quantity,
        extras: item.extras.map(extra => ({
          product_id: extra.product_id,
          quantity: extra.quantity,
        })),
      }));

      await SaleApiClient.syncSaleItems(saleId, { items });

      // Reload sale
      await loadSale();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ذخیره تغییرات';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Close sale
   */
  const handleClose = async () => {
    if (!canClose) return;

    const confirm = window.confirm('آیا از بستن این فروش اطمینان دارید؟');
    if (!confirm) return;

    try {
      setClosing(true);
      setError(null);

      await SaleApiClient.closeSale(saleId);

      // Redirect to dashboard
      router.push('/sale');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در بستن فروش';
      setError(message);
      setClosing(false);
    }
  };

  /**
   * Cancel sale
   */
  const handleCancel = async () => {
    if (!canCancel) return;

    const confirm = window.confirm('آیا از لغو این فروش اطمینان دارید؟ این عملیات قابل بازگشت نیست.');
    if (!confirm) return;

    try {
      setError(null);
      await SaleApiClient.cancelSale(saleId);
      router.push('/sale');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در لغو فروش';
      setError(message);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !sale) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2 text-red-400">خطا</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/sale')}
            className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            بازگشت به داشبورد
          </button>
        </div>
      </div>
    );
  }

  if (!sale) return null;

  const isOpen = sale.state === 'OPEN';
  const canEdit = isOpen && canModify;
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-32">
      {/* Sticky Header with Total */}
      <div className="sticky top-0 z-40 bg-gray-900 border-b-4 border-indigo-500 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/sale')}
                className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center text-2xl transition-all"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  فروش #{sale.id}
                  <span className={`
                    px-4 py-1.5 rounded-full text-sm font-medium border
                    ${sale.state === 'OPEN' ? 'bg-green-600/20 text-green-400 border-green-500/50' :
                      sale.state === 'CLOSED' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' :
                        'bg-red-600/20 text-red-400 border-red-500/50'}
                  `}>
                    {sale.state === 'OPEN' ? 'باز' : sale.state === 'CLOSED' ? 'بسته شده' : 'لغو شده'}
                  </span>
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {sale.table_number ? `میز ${sale.table_number}` : 'بیرون‌بر'}
                  {sale.guest_count && ` • ${sale.guest_count} مهمان`}
                  {sale.guest_name && ` • ${sale.guest_name}`}
                </p>
              </div>
            </div>

            {isOpen && (
              <div className="flex gap-3">
                {canCancel && (
                  <button onClick={handleCancel} className="px-5 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 font-medium flex items-center gap-2">
                    <span>🗑️</span> لغو فروش
                  </button>
                )}
                {canClose && (
                  <button
                    onClick={handleClose}
                    disabled={closing || cart.length === 0}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-60 text-white font-bold shadow-lg flex items-center gap-2"
                  >
                    {closing ? <span className="animate-spin">⏳</span> : '✓'} بستن فروش
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <span className="text-lg text-gray-400">جمع کل:</span>
            <span className="text-3xl font-bold text-indigo-400">
              {formatPersianMoney(calculateTotal())}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-900/30 border-2 border-red-800/70 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-300 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
          </div>
        )}

        {/* Items */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">آیتم‌های سفارش</h2>
            {canEdit && (
              <button
                onClick={() => { setShowAddMenu(true); loadMenu(); }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-white font-bold shadow-lg flex items-center gap-3"
              >
                <span className="text-xl">➕</span> افزودن آیتم
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-2xl p-16 text-center">
              <div className="text-6xl mb-4 opacity-50">🧾</div>
              <p className="text-xl text-gray-500">سفارشی ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item, index) => {
                const itemSubtotal = item.price * item.quantity;
                const extrasSubtotal = item.extras.reduce((s, e) => s + e.price * e.quantity * item.quantity, 0);
                const total = itemSubtotal + extrasSubtotal;

                return (
                  <div key={`${item.item_id || 'new'}-${index}`} className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-xl font-bold">{item.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{formatPersianMoney(item.price)} × {item.quantity}</p>
                      </div>
                      {canEdit && (
                        <button onClick={() => updateQuantity(index, 0)} className="text-red-400 hover:text-red-300 text-2xl p-2">
                          🗑️
                        </button>
                      )}
                    </div>

                    {item.extras.length > 0 && (
                      <div className="mb-5 p-4 bg-gray-750 rounded-xl">
                        <p className="font-semibold text-gray-300 mb-3">افزودنی‌ها:</p>
                        <div className="space-y-3">
                          {item.extras.map(extra => (
                            <div key={extra.product_id} className="flex justify-between items-center">
                              <span>{extra.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-400">{formatPersianMoney(extra.price)} × {extra.quantity}</span>
                                {canEdit && (
                                  <div className="flex items-center gap-2 bg-gray-700 rounded-lg">
                                    <button onClick={() => updateExtraQuantity(index, extra.product_id, extra.quantity - 1)} className="w-9 h-9 hover:bg-gray-600 rounded-l-lg">−</button>
                                    <span className="w-10 text-center font-bold">{extra.quantity}</span>
                                    <button onClick={() => updateExtraQuantity(index, extra.product_id, extra.quantity + 1)} className="w-9 h-9 hover:bg-gray-600 rounded-r-lg">+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-4">
                        {canEdit && (
                          <>
                            <div className="flex items-center bg-gray-700 rounded-xl">
                              <button onClick={() => updateQuantity(index, item.quantity - 1)} className="w-12 h-12 hover:bg-gray-600 rounded-l-xl text-xl font-bold">−</button>
                              <span className="w-16 text-center text-xl font-bold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(index, item.quantity + 1)} className="w-12 h-12 hover:bg-gray-600 rounded-r-xl text-xl font-bold">+</button>
                            </div>
                            <button
                              onClick={() => { setSelectedItemForExtras(index); setShowExtrasModal(true); loadExtras(); }}
                              className="px-5 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-xl text-green-400 font-medium flex items-center gap-2"
                            >
                              <span>➕</span> افزودنی
                            </button>
                          </>
                        )}
                        {!canEdit && <span className="text-lg text-gray-400">تعداد: <strong>{item.quantity}</strong></span>}
                      </div>
                      <div className="text-2xl font-bold text-indigo-400">{formatPersianMoney(total)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Save Bar */}
      {canEdit && isModified && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-gray-900 to-gray-900/90 border-t-4 border-indigo-500 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400">تغییرات ذخیره نشده</p>
                <p className="text-3xl font-bold text-indigo-400 mt-1">{formatPersianMoney(calculateTotal())}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => loadSale()} className="px-6 py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium">انصراف</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg shadow-xl disabled:opacity-60 flex items-center gap-3"
                >
                  {saving ? <>⏳ در حال ذخیره...</> : <>✓ ذخیره تغییرات</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl border-2 border-indigo-500 shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">➕ افزودن آیتم</h3>
                  <button
                    onClick={() => setShowAddMenu(false)}
                    className="w-10 h-10 bg-red-600/20 hover:bg-red-600/30 border border-red-500 rounded-lg text-red-400 text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {/* Menu Items */}
              <div className="p-4">
                {loadingMenu ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4 animate-spin">⏳</div>
                    <p className="text-gray-400">در حال بارگذاری...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addItem(item.id, item.name, item.price)}
                        className="group relative bg-gradient-to-br from-gray-800 to-gray-850 hover:from-gray-750 hover:to-gray-800 border border-gray-700 hover:border-indigo-500 rounded-xl p-4 transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-right min-h-[100px]"
                      >
                        <h4 className="font-semibold text-sm mb-3 line-clamp-2">{item.name}</h4>
                        <div className="text-sm text-indigo-400 font-bold">{formatPersianMoney(item.price)}</div>
                        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity">+</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extras Modal */}
      {showExtrasModal && selectedItemForExtras !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl border-2 border-green-500 shadow-2xl">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">➕ افزودن اکسترا</h3>
                  <button
                    onClick={() => {
                      setShowExtrasModal(false);
                      setSelectedItemForExtras(null);
                    }}
                    className="w-10 h-10 bg-red-600/20 hover:bg-red-600/30 border border-red-500 rounded-lg text-red-400 text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4">
                {loadingExtras ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4 animate-spin">⏳</div>
                    <p className="text-gray-400">در حال بارگذاری...</p>
                  </div>
                ) : extras.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">📦</div>
                    <p className="text-gray-500">افزودنی‌ای یافت نشد</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {extras.map((extra) => (
                      <button
                        key={extra.id}
                        onClick={() => {
                          addExtra(selectedItemForExtras!, extra.id, extra.name, extra.price);
                          setShowExtrasModal(false);
                          setSelectedItemForExtras(null);
                        }}
                        className="group relative bg-gradient-to-br from-gray-800 to-gray-850 hover:from-gray-750 hover:to-gray-800 border border-gray-700 hover:border-green-500 rounded-xl p-4 transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-right min-h-[100px]"
                      >
                        <h4 className="font-semibold text-sm mb-3 line-clamp-2">{extra.name}</h4>
                        <div className="text-sm text-green-400 font-bold">{formatPersianMoney(extra.price)}</div>
                        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity">+</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
