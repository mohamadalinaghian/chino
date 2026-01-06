'use client';
// TODO: REFACTOR - This file is 800+ lines and handles too many responsibilities
// Recommended refactoring:
// 1. Extract cart management logic into a custom hook (useCartManager)
// 2. Extract sale data loading and state into a custom hook (useSaleEditor)
// 3. Extract print logic into a custom hook (useSalePrintDiff)
// 4. Move item/extra handlers to separate service functions
// 5. Consider breaking this into smaller sub-components for each section
// 6. Extract business logic (diff calculation, validation) into pure functions

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  SaleType,
  IMenuItemForSale,
  ICartItem,
  ICartExtra,
  IMenuGroup,
  ISaleDetailResponse,
} from '@/types/sale';
import { fetchSaleMenu, fetchSaleDetails, syncSaleItems } from '@/service/sale';
import { SaleTypeSelector } from '@/components/sale/SaleTypeSelector';
import { TableSelector } from '@/components/sale/TableSelector';
import { CategoryList } from '@/components/sale/CategoryList';
import { ItemsGrid } from '@/components/sale/ItemsGrid';
import { CartSummary } from '@/components/sale/CartSummary/CartSummary';
import { ExtrasModal, SelectedExtra } from '@/components/sale/ExtrasModal';
import { GuestSelector } from '@/components/guest/GuestSelector';
import { GuestQuickCreateModal } from '@/components/guest/GuestQuickCreateModal';
import { IGuest } from '@/types/guest';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';
import { getCurrentJalaliDate } from '@/utils/persianUtils';
import { printEditReceipt, PrintEditItem, PrintEditData, printReceipt, PrintSaleData, queueReceipt, queueEditReceipt } from '@/utils/printUtils';

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
  const saleId = parseInt(params.id as string);
  const { showToast, ToastContainer } = useToast();

  // Sale configuration
  const [saleType, setSaleType] = useState<SaleType>(SaleType.TAKEAWAY);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  // Menu data
  const [menuData, setMenuData] = useState<IMenuGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'BAR' | 'FOOD'>('FOOD');

  // Cart state
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);

  // Animation state
  const [animatingItemId, setAnimatingItemId] = useState<number | null>(null);

  // Extras modal state
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [selectedItemForExtras, setSelectedItemForExtras] =
    useState<IMenuItemForSale | null>(null);

  // Editing cart item extras
  const [editingCartItem, setEditingCartItem] = useState<ICartItem | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Guest information
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [guestQuickCreateModalOpen, setGuestQuickCreateModalOpen] = useState(false);
  const [searchedMobile, setSearchedMobile] = useState<string>('');

  // Original sale state for tracking changes
  const [originalSale, setOriginalSale] = useState<ISaleDetailResponse | null>(null);
  const [originalCartItems, setOriginalCartItems] = useState<ICartItem[]>([]);

  // Cart ref + floating button
  const cartSummaryRef = useRef<HTMLDivElement>(null);
  const showFloatingButton = cartItems.length > 0;

  const scrollToCart = () => {
    cartSummaryRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    loadSaleData();
    loadMenu();
  }, [saleId]);

  useEffect(() => {
    if (!menuData) return;
    const group = menuData.find((g) => g.parent_group === activeTab);
    if (group && group.categories.length > 0) {
      setSelectedCategory(group.categories[0].title);
    }
  }, [activeTab, menuData]);

  const loadSaleData = async () => {
    try {
      const sale = await fetchSaleDetails(saleId);

      // Set sale type and table
      setSaleType(sale.sale_type);
      setSelectedTableId(sale.table_id || null);

      // Set guest information
      setSelectedGuestId(sale.guest_id || null);
      setGuestCount(sale.guest_count || null);

      // Convert sale items to cart items
      // Backend returns hierarchical structure with extras already nested
      // Calculate total locally (same as new sale page logic)
      const convertedItems: ICartItem[] = sale.items.map((item) => {
        const extras: ICartExtra[] = item.extras.map((extra) => ({
          id: `extra-${extra.id}`,
          product_id: extra.product_id,
          name: extra.product_name,
          price: Number(extra.unit_price),
          quantity: Number(extra.quantity),
        }));

        // Calculate extras total
        const extrasTotal = extras.reduce(
          (sum, extra) => sum + extra.price * extra.quantity,
          0
        );

        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unit_price);

        return {
          id: `item-${item.id}`,
          menu_id: item.menu_id || 0,
          name: item.product_name,
          quantity,
          unit_price: unitPrice,
          extras,
          total: (unitPrice + extrasTotal) * quantity,
        };
      });

      setCartItems(convertedItems);

      // Save original state for change tracking
      setOriginalSale(sale);
      setOriginalCartItems(JSON.parse(JSON.stringify(convertedItems))); // Deep copy
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'خطا در بارگذاری فروش',
        'error'
      );
      setError('خطا در بارگذاری اطلاعات فروش');
    }
  };

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSaleMenu();
      setMenuData(data);
      const foodGroup = data.find((g) => g.parent_group === 'FOOD');
      if (foodGroup && foodGroup.categories.length > 0) {
        setSelectedCategory(foodGroup.categories[0].title);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : UI_TEXT.ERROR_LOADING_MENU);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAndSave = async () => {
    if (cartItems.length === 0) {
      showToast('سبد خرید نمی‌تواند خالی باشد', 'warning');
      return;
    }

    if (saleType === SaleType.DINE_IN && !selectedTableId) {
      showToast('لطفاً یک میز انتخاب کنید', 'warning');
      return;
    }

    if (!originalSale) {
      showToast('خطا: اطلاعات اصلی فروش یافت نشد', 'error');
      return;
    }

    try {
      setSubmitting(true);

      // First, save the changes
      const items = cartItems.map((cartItem) => ({
        menu_id: cartItem.menu_id,
        quantity: cartItem.quantity,
        extras: cartItem.extras.map((extra) => ({
          product_id: extra.product_id,
          quantity: extra.quantity,
        })),
      }));

      await syncSaleItems(saleId, items, {
        sale_type: saleType,
        table_id: saleType === SaleType.DINE_IN ? selectedTableId : null,
        guest_id: selectedGuestId,
        guest_count: guestCount,
      });

      showToast('تغییرات ذخیره شد، در حال چاپ...', 'success');

      // Then, prepare and trigger print
      const tableChanged = selectedTableId !== originalSale.table_id;
      const oldTableName = originalSale.table_name || undefined;
      const newTableName = selectedTableId ? `میز ${selectedTableId}` : undefined;

      // Calculate item changes
      const diffItems: PrintEditItem[] = [];

      // Find removed and modified items
      originalCartItems.forEach((originalItem) => {
        const currentItem = cartItems.find(
          (ci) => ci.menu_id === originalItem.menu_id &&
            JSON.stringify(ci.extras) === JSON.stringify(originalItem.extras)
        );

        if (!currentItem) {
          diffItems.push({
            name: originalItem.name,
            quantity: originalItem.quantity,
            unit_price: originalItem.unit_price,
            total: originalItem.total,
            extras: originalItem.extras.map(e => ({
              name: e.name,
              quantity: e.quantity,
              unit_price: e.price,
              total: e.price * e.quantity,
            })),
            status: 'removed',
          });
        } else if (currentItem.quantity !== originalItem.quantity) {
          diffItems.push({
            name: currentItem.name,
            quantity: currentItem.quantity,
            unit_price: currentItem.unit_price,
            total: currentItem.total,
            extras: currentItem.extras.map(e => ({
              name: e.name,
              quantity: e.quantity,
              unit_price: e.price,
              total: e.price * e.quantity,
            })),
            status: 'modified',
            oldQuantity: originalItem.quantity,
            quantityDiff: currentItem.quantity - originalItem.quantity,
          });
        } else {
          diffItems.push({
            name: currentItem.name,
            quantity: currentItem.quantity,
            unit_price: currentItem.unit_price,
            total: currentItem.total,
            extras: currentItem.extras.map(e => ({
              name: e.name,
              quantity: e.quantity,
              unit_price: e.price,
              total: e.price * e.quantity,
            })),
            status: 'unchanged',
          });
        }
      });

      // Find added items
      cartItems.forEach((currentItem) => {
        const wasOriginal = originalCartItems.some(
          (oi) => oi.menu_id === currentItem.menu_id &&
            JSON.stringify(oi.extras) === JSON.stringify(currentItem.extras)
        );

        if (!wasOriginal) {
          diffItems.push({
            name: currentItem.name,
            quantity: currentItem.quantity,
            unit_price: currentItem.unit_price,
            total: currentItem.total,
            extras: currentItem.extras.map(e => ({
              name: e.name,
              quantity: e.quantity,
              unit_price: e.price,
              total: e.price * e.quantity,
            })),
            status: 'added',
          });
        }
      });

      const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

      const printData: PrintEditData = {
        sale_id: saleId,
        sale_type: saleType,
        table_name: newTableName,
        items: diffItems,
        subtotal,
        total: subtotal,
        timestamp: new Date(),
        tableChanged,
        oldTableName,
        newTableName,
      };

      // Queue print job instead of direct print
      await queueEditReceipt(printData, saleId);

      // Navigate back after print is triggered
      setTimeout(() => {
        router.push('/sale/dashboard');
      }, 1000);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'خطا در ذخیره تغییرات',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndPrintAll = async () => {
    if (cartItems.length === 0) {
      showToast('سبد خرید نمی‌تواند خالی باشد', 'warning');
      return;
    }

    if (saleType === SaleType.DINE_IN && !selectedTableId) {
      showToast('لطفاً یک میز انتخاب کنید', 'warning');
      return;
    }

    try {
      setSubmitting(true);

      // First, save the changes
      const items = cartItems.map((cartItem) => ({
        menu_id: cartItem.menu_id,
        quantity: cartItem.quantity,
        extras: cartItem.extras.map((extra) => ({
          product_id: extra.product_id,
          quantity: extra.quantity,
        })),
      }));

      await syncSaleItems(saleId, items, {
        sale_type: saleType,
        table_id: saleType === SaleType.DINE_IN ? selectedTableId : null,
        guest_id: selectedGuestId,
        guest_count: guestCount,
      });

      showToast('تغییرات ذخیره شد، در حال چاپ...', 'success');

      // Then, print ALL items (not just changes)
      const tableName = selectedTableId ? `میز ${selectedTableId}` : undefined;
      const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

      const printData: PrintSaleData = {
        sale_id: saleId,
        sale_type: saleType,
        table_name: tableName,
        guest_count: guestCount || 0,
        items: cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          extras: item.extras.map((e) => ({
            name: e.name,
            quantity: e.quantity,
            unit_price: e.price,
            total: e.price * e.quantity,
          })),
        })),
        subtotal,
        total: subtotal,
        timestamp: new Date(),
      };

      // Queue print job instead of direct print
      await queueReceipt(printData, saleId);

      // Navigate back after print is triggered
      setTimeout(() => {
        router.push('/sale/dashboard');
      }, 1000);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'خطا در ذخیره تغییرات',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategories = useMemo(() => {
    if (!menuData) return [];
    const group = menuData.find((g) => g.parent_group === activeTab);
    if (!group) return [];
    return group.categories.map((cat) => ({
      id: cat.title,
      name: cat.title,
      parentGroup: activeTab,
    }));
  }, [menuData, activeTab]);

  const currentItems = useMemo(() => {
    if (!menuData || !selectedCategory) return [];
    const group = menuData.find((g) => g.parent_group === activeTab);
    if (!group) return [];
    const category = group.categories.find((cat) => cat.title === selectedCategory);
    return category?.items || [];
  }, [menuData, selectedCategory, activeTab]);

  const handleSaleTypeChange = (type: SaleType) => {
    setSaleType(type);
    if (type === SaleType.TAKEAWAY) {
      setSelectedTableId(null);
    }
  };

  const handleAddToCart = (item: IMenuItemForSale) => {
    setAnimatingItemId(item.id);
    setTimeout(() => setAnimatingItemId(null), 500);

    setCartItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (cartItem) => cartItem.menu_id === item.id && cartItem.extras.length === 0
      );
      if (existingItemIndex !== -1) {
        const updated = [...prev];
        const existingItem = updated[existingItemIndex];
        updated[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          total: existingItem.unit_price * (existingItem.quantity + 1),
        };
        return updated;
      } else {
        const cartItemId = `${Date.now()}-${Math.random()}`;
        const newCartItem: ICartItem = {
          id: cartItemId,
          menu_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: item.price,
          extras: [],
          total: item.price,
        };
        return [...prev, newCartItem];
      }
    });
  };

  const handleRequestExtras = (item: IMenuItemForSale) => {
    setSelectedItemForExtras(item);
    setEditingCartItem(null);
    setExtrasModalOpen(true);
  };

  const handleEditCartItemExtras = (cartItem: ICartItem) => {
    const menuItem: IMenuItemForSale = {
      id: cartItem.menu_id,
      name: cartItem.name,
      price: cartItem.unit_price,
    };
    setSelectedItemForExtras(menuItem);
    setEditingCartItem(cartItem);
    setExtrasModalOpen(true);
  };

  const handleConfirmExtras = (
    item: IMenuItemForSale,
    selectedExtras: SelectedExtra[],
    quantity: number
  ) => {
    setAnimatingItemId(item.id);
    setTimeout(() => setAnimatingItemId(null), 500);

    if (editingCartItem) {
      const updatedExtras: ICartExtra[] = selectedExtras.map((se, idx) => ({
        id: editingCartItem.extras[idx]?.id || `${editingCartItem.id}-extra-${se.extra.id}`,
        product_id: se.extra.id,
        name: se.extra.name,
        price: se.extra.price,
        quantity: se.quantity,
      }));

      const extrasTotal = updatedExtras.reduce((sum, e) => sum + e.price * e.quantity, 0);

      setCartItems((prev) =>
        prev.map((ci) =>
          ci.id === editingCartItem.id
            ? {
              ...ci,
              quantity,
              extras: updatedExtras,
              total: (item.price + extrasTotal) * quantity,
            }
            : ci
        )
      );
      setEditingCartItem(null);
    } else {
      const cartItemId = `${Date.now()}-${Math.random()}`;
      const cartExtras: ICartExtra[] = selectedExtras.map((se) => ({
        id: `${cartItemId}-extra-${se.extra.id}`,
        product_id: se.extra.id,
        name: se.extra.name,
        price: se.extra.price,
        quantity: se.quantity,
      }));
      const extrasTotal = cartExtras.reduce((sum, extra) => sum + extra.price * extra.quantity, 0);
      const newCartItem: ICartItem = {
        id: cartItemId,
        menu_id: item.id,
        name: item.name,
        quantity,
        unit_price: item.price,
        extras: cartExtras,
        total: (item.price + extrasTotal) * quantity,
      };
      setCartItems((prev) => [...prev, newCartItem]);
    }

    setExtrasModalOpen(false);
    setSelectedItemForExtras(null);
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const extrasTotal = item.extras.reduce(
          (sum, extra) => sum + extra.price * extra.quantity,
          0
        );
        return {
          ...item,
          quantity: newQuantity,
          total: (item.unit_price + extrasTotal) * newQuantity,
        };
      })
    );
  };

  const handleSaveChanges = async () => {
    if (cartItems.length === 0) {
      showToast('سبد خرید نمی‌تواند خالی باشد', 'warning');
      return;
    }

    if (saleType === SaleType.DINE_IN && !selectedTableId) {
      showToast('لطفاً یک میز انتخاب کنید', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const items = cartItems.map((cartItem) => ({
        menu_id: cartItem.menu_id,
        quantity: cartItem.quantity,
        extras: cartItem.extras.map((extra) => ({
          product_id: extra.product_id,
          quantity: extra.quantity,
        })),
      }));

      // Include sale metadata in sync request
      await syncSaleItems(saleId, items, {
        sale_type: saleType,
        table_id: saleType === SaleType.DINE_IN ? selectedTableId : null,
        guest_id: selectedGuestId,
        guest_count: guestCount || 0,
      });

      showToast('تغییرات با موفقیت ذخیره شد', 'success');
      setTimeout(() => {
        router.push('/sale/dashboard');
      }, 500);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'خطا در ذخیره تغییرات',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('آیا از لغو تغییرات اطمینان دارید؟')) {
      router.push('/sale/dashboard');
    }
  };

  const handleGuestCreated = (guest: IGuest) => {
    setSelectedGuestId(guest.id);
    showToast(`مهمان "${guest.name}" ایجاد شد`, 'success');
  };

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: THEME_COLORS.bgPrimary }}
    >
      {/* Header */}
      <header
        className="p-2 border-b"
        style={{
          backgroundColor: THEME_COLORS.bgSecondary,
          borderColor: THEME_COLORS.border,
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90 border-2"
              style={{
                backgroundColor: 'transparent',
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.subtext,
              }}
            >
              ← بازگشت
            </button>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: THEME_COLORS.text }}
            >
              ویرایش فروش #{saleId}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/sale/${saleId}/payment`)}
              className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90"
              style={{
                backgroundColor: THEME_COLORS.green,
                color: '#fff',
              }}
            >
              💳 پرداخت
            </button>
            <div style={{ color: THEME_COLORS.subtext }}>
              {getCurrentJalaliDate('dddd، jD jMMMM jYYYY')}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Left Column - Menu Selection */}
          <div className="lg:col-span-2 space-y-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: THEME_COLORS.bgSecondary }}
            >
              <SaleTypeSelector
                selectedType={saleType}
                onTypeChange={handleSaleTypeChange}
              />
            </div>

            {saleType === SaleType.DINE_IN && (
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: THEME_COLORS.bgSecondary }}
              >
                <TableSelector
                  selectedTableId={selectedTableId}
                  onTableSelect={setSelectedTableId}
                />
              </div>
            )}

            {/* Current Sale Info Card - Show guest and table if they exist */}
            {originalSale && (originalSale.guest_name || originalSale.table_name) && (
              <div
                className="p-3 rounded-lg border-2"
                style={{
                  backgroundColor: THEME_COLORS.bgSecondary,
                  borderColor: THEME_COLORS.accent,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '16px' }}>ℹ️</span>
                  <strong style={{ color: THEME_COLORS.text }}>اطلاعات فروش فعلی:</strong>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {originalSale.guest_name && (
                    <div
                      className="p-2 rounded"
                      style={{ backgroundColor: THEME_COLORS.bgPrimary }}
                    >
                      <div style={{ color: THEME_COLORS.subtext, fontSize: '11px' }}>مهمان:</div>
                      <div style={{ color: THEME_COLORS.text, fontWeight: 'bold' }}>
                        {originalSale.guest_name}
                      </div>
                    </div>
                  )}
                  {originalSale.table_name && (
                    <div
                      className="p-2 rounded"
                      style={{ backgroundColor: THEME_COLORS.bgPrimary }}
                    >
                      <div style={{ color: THEME_COLORS.subtext, fontSize: '11px' }}>میز:</div>
                      <div style={{ color: THEME_COLORS.text, fontWeight: 'bold' }}>
                        {originalSale.table_name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guest Selector and Guest Count */}
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: THEME_COLORS.bgSecondary }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <GuestSelector
                    selectedGuestId={selectedGuestId}
                    onGuestChange={setSelectedGuestId}
                    onQuickCreate={(mobile) => {
                      setSearchedMobile(mobile || '');
                      setGuestQuickCreateModalOpen(true);
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: THEME_COLORS.text }}
                  >
                    تعداد نفرات
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={guestCount ?? ''}
                    onChange={(e) => setGuestCount(e.target.value ? Number(e.target.value) : null)}
                    placeholder="تعداد..."
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: THEME_COLORS.bgPrimary,
                      borderColor: THEME_COLORS.border,
                      color: THEME_COLORS.text,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('FOOD')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${activeTab === 'FOOD' ? 'scale-105' : ''
                  }`}
                style={{
                  backgroundColor:
                    activeTab === 'FOOD'
                      ? THEME_COLORS.accent
                      : THEME_COLORS.surface,
                  color:
                    activeTab === 'FOOD'
                      ? '#fff'
                      : THEME_COLORS.subtext,
                }}
              >
                {UI_TEXT.TAB_FOOD}
              </button>
              <button
                onClick={() => setActiveTab('BAR')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${activeTab === 'BAR' ? 'scale-105' : ''
                  }`}
                style={{
                  backgroundColor:
                    activeTab === 'BAR'
                      ? THEME_COLORS.accent
                      : THEME_COLORS.surface,
                  color:
                    activeTab === 'BAR'
                      ? '#fff'
                      : THEME_COLORS.subtext,
                }}
              >
                {UI_TEXT.TAB_DRINKS}
              </button>
            </div>

            {loading && (
              <div
                className="p-6 rounded-lg text-center"
                style={{ backgroundColor: THEME_COLORS.bgSecondary }}
              >
                <div
                  className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto"
                  style={{
                    borderColor: `${THEME_COLORS.accent} transparent transparent transparent`,
                  }}
                />
                <p className="mt-4" style={{ color: THEME_COLORS.subtext }}>
                  {UI_TEXT.MSG_LOADING_MENU}
                </p>
              </div>
            )}

            {error && (
              <div
                className="p-4 rounded-lg text-center"
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
                  onClick={loadMenu}
                  className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: THEME_COLORS.accent,
                    color: '#fff',
                  }}
                >
                  {UI_TEXT.BTN_RETRY}
                </button>
              </div>
            )}

            {!loading && !error && menuData && (
              <>
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: THEME_COLORS.bgSecondary }}
                >
                  <CategoryList
                    categories={currentCategories}
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                  />
                </div>

                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: THEME_COLORS.bgSecondary }}
                >
                  <ItemsGrid
                    items={currentItems}
                    selectedCategory={selectedCategory}
                    onAddToCart={handleAddToCart}
                    onRequestExtras={handleRequestExtras}
                    animatingItemId={animatingItemId}
                  />
                </div>
              </>
            )}
          </div>

          {/* Right Column - Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <CartSummary
                ref={cartSummaryRef}
                cartItems={cartItems}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onEditExtras={handleEditCartItemExtras}
                onSaveSilent={handleSaveChanges}
                onSaveAndPrintAll={handleSaveAndPrintAll}
                onSaveAndPrintChanges={handlePrintAndSave}
                onCancel={handleCancel}
                isEditMode={true}
                isSubmitting={submitting}
              />
            </div>
          </div>
        </div>
      </div>

      {showFloatingButton && (
        <button
          onClick={scrollToCart}
          className="fixed bottom-6 right-6 z-50 block lg:hidden w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl font-bold hover:scale-110 active:scale-95 transition-all duration-300 animate-pulse"
          style={{
            backgroundColor: THEME_COLORS.accent,
            color: '#fff',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.5)',
          }}
          title="نمایش سبد خرید"
        >
          🛒
        </button>
      )}

      {/* Extras Modal */}
      <ExtrasModal
        item={selectedItemForExtras}
        isOpen={extrasModalOpen}
        onClose={() => {
          setExtrasModalOpen(false);
          setSelectedItemForExtras(null);
          setEditingCartItem(null);
        }}
        onConfirm={handleConfirmExtras}
      />

      {submitting && <LoadingOverlay message="در حال ذخیره تغییرات..." />}

      {/* Guest Quick-Create Modal */}
      <GuestQuickCreateModal
        isOpen={guestQuickCreateModalOpen}
        onClose={() => setGuestQuickCreateModalOpen(false)}
        onGuestCreated={handleGuestCreated}
        initialMobile={searchedMobile}
      />

      <ToastContainer />
    </div>
  );
}
