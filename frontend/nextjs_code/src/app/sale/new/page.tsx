'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  SaleType,
  IMenuItemForSale,
  ICartItem,
  ICartExtra,
  IMenuCategoryForSale,
} from '@/types/sale';
import { fetchSaleMenu, openSale } from '@/service/sale';
import { SaleTypeSelector } from '@/components/sale/SaleTypeSelector';
import { TableSelector } from '@/components/sale/TableSelector';
import { CategoryList } from '@/components/sale/CategoryList';
import { ItemsGrid } from '@/components/sale/ItemsGrid';
import { CartSummary } from '@/components/sale/CartSummary';
import { ExtrasModal, SelectedExtra } from '@/components/sale/ExtrasModal';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { CATPPUCCIN_COLORS } from '@/libs/constants';
import { getCurrentJalaliDate } from '@/utils/persianUtils';

export default function NewSalePage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  // Sale configuration
  const [saleType, setSaleType] = useState<SaleType>(SaleType.TAKEAWAY);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  // Menu data
  const [menuData, setMenuData] = useState<{
    bar_items: IMenuCategoryForSale[];
    food_items: IMenuCategoryForSale[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bar' | 'food'>('food');

  // Cart state
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);

  // Extras modal state
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [selectedItemForExtras, setSelectedItemForExtras] =
    useState<IMenuItemForSale | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Load menu on mount
  useEffect(() => {
    loadMenu();
  }, []);

  // Auto-select first category when tab changes
  useEffect(() => {
    const categories = activeTab === 'bar' ? menuData?.bar_items : menuData?.food_items;
    if (categories && categories.length > 0) {
      setSelectedCategory(categories[0].category);
    }
  }, [activeTab, menuData]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSaleMenu();
      setMenuData(data);

      // Auto-select first category
      if (data.food_items.length > 0) {
        setSelectedCategory(data.food_items[0].category);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری منو');
    } finally {
      setLoading(false);
    }
  };

  // Get current categories based on active tab
  const currentCategories = useMemo(() => {
    if (!menuData) return [];
    const items = activeTab === 'bar' ? menuData.bar_items : menuData.food_items;
    return items.map((cat) => ({
      id: cat.category,
      name: cat.category,
      icon: activeTab === 'bar' ? '🍹' : '🍽️',
    }));
  }, [menuData, activeTab]);

  // Get current items for selected category
  const currentItems = useMemo(() => {
    if (!menuData || !selectedCategory) return [];
    const items = activeTab === 'bar' ? menuData.bar_items : menuData.food_items;
    const category = items.find((cat) => cat.category === selectedCategory);
    return category?.items || [];
  }, [menuData, selectedCategory, activeTab]);

  // Handle sale type change
  const handleSaleTypeChange = (type: SaleType) => {
    setSaleType(type);
    if (type === SaleType.TAKEAWAY) {
      setSelectedTableId(null);
    }
  };

  // Handle add item to cart (without extras)
  const handleAddToCart = (item: IMenuItemForSale) => {
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

    setCartItems((prev) => [...prev, newCartItem]);
  };

  // Handle request extras
  const handleRequestExtras = (item: IMenuItemForSale) => {
    setSelectedItemForExtras(item);
    setExtrasModalOpen(true);
  };

  // Handle confirm extras and add to cart
  const handleConfirmExtras = (
    item: IMenuItemForSale,
    selectedExtras: SelectedExtra[],
    quantity: number
  ) => {
    const cartItemId = `${Date.now()}-${Math.random()}`;

    const cartExtras: ICartExtra[] = selectedExtras.map((se) => ({
      id: `${cartItemId}-extra-${se.extra.id}`,
      menu_id: se.extra.id,
      name: se.extra.name,
      price: se.extra.price,
      quantity: se.quantity,
    }));

    const extrasTotal = cartExtras.reduce(
      (sum, extra) => sum + extra.price * extra.quantity,
      0
    );

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
  };

  // Handle remove item from cart
  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Handle update quantity
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

  // Handle proceed to payment
  const handleProceedToPayment = async () => {
    // Validation
    if (saleType === SaleType.DINE_IN && !selectedTableId) {
      showToast('لطفاً یک میز را انتخاب کنید', 'warning');
      return;
    }

    if (cartItems.length === 0) {
      showToast('سبد خرید خالی است', 'warning');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare sale data
      const saleData = {
        sale_type: saleType,
        table_id: saleType === SaleType.DINE_IN ? selectedTableId : null,
        items: cartItems.map((cartItem) => ({
          menu_id: cartItem.menu_id,
          quantity: cartItem.quantity,
          extras: cartItem.extras.map((extra) => ({
            menu_id: extra.menu_id,
            quantity: extra.quantity,
          })),
        })),
      };

      // Create sale
      const sale = await openSale(saleData);

      showToast('فروش با موفقیت ایجاد شد', 'success');

      // Redirect to payment page
      setTimeout(() => {
        router.push(`/sale/${sale.id}/payment`);
      }, 500);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'خطا در ایجاد فروش',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: CATPPUCCIN_COLORS.bgPrimary }}
    >
      {/* Header */}
      <header
        className="p-4 border-b"
        style={{
          backgroundColor: CATPPUCCIN_COLORS.bgSecondary,
          borderColor: CATPPUCCIN_COLORS.border,
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ color: CATPPUCCIN_COLORS.text }}
          >
            فروش جدید
          </h1>
          <div style={{ color: CATPPUCCIN_COLORS.subtext }}>
            {getCurrentJalaliDate('dddd، jD jMMMM jYYYY')}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Menu Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sale Type Selector */}
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: CATPPUCCIN_COLORS.bgSecondary }}
            >
              <SaleTypeSelector
                selectedType={saleType}
                onTypeChange={handleSaleTypeChange}
              />
            </div>

            {/* Table Selector (only for dine-in) */}
            {saleType === SaleType.DINE_IN && (
              <div
                className="p-6 rounded-lg"
                style={{ backgroundColor: CATPPUCCIN_COLORS.bgSecondary }}
              >
                <TableSelector
                  selectedTableId={selectedTableId}
                  onTableSelect={setSelectedTableId}
                />
              </div>
            )}

            {/* Menu Tabs */}
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('food')}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  activeTab === 'food' ? 'scale-105' : ''
                }`}
                style={{
                  backgroundColor:
                    activeTab === 'food'
                      ? CATPPUCCIN_COLORS.accent
                      : CATPPUCCIN_COLORS.surface,
                  color:
                    activeTab === 'food'
                      ? CATPPUCCIN_COLORS.bgSecondary
                      : CATPPUCCIN_COLORS.subtext,
                }}
              >
                🍽️ غذا
              </button>
              <button
                onClick={() => setActiveTab('bar')}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  activeTab === 'bar' ? 'scale-105' : ''
                }`}
                style={{
                  backgroundColor:
                    activeTab === 'bar'
                      ? CATPPUCCIN_COLORS.accent
                      : CATPPUCCIN_COLORS.surface,
                  color:
                    activeTab === 'bar'
                      ? CATPPUCCIN_COLORS.bgSecondary
                      : CATPPUCCIN_COLORS.subtext,
                }}
              >
                🍹 نوشیدنی
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div
                className="p-12 rounded-lg text-center"
                style={{ backgroundColor: CATPPUCCIN_COLORS.bgSecondary }}
              >
                <div
                  className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto"
                  style={{
                    borderColor: `${CATPPUCCIN_COLORS.accent} transparent transparent transparent`,
                  }}
                />
                <p className="mt-4" style={{ color: CATPPUCCIN_COLORS.subtext }}>
                  در حال بارگذاری منو...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div
                className="p-8 rounded-lg text-center"
                style={{ backgroundColor: CATPPUCCIN_COLORS.bgSecondary }}
              >
                <div
                  className="text-4xl mb-3"
                  style={{ color: CATPPUCCIN_COLORS.red }}
                >
                  ⚠️
                </div>
                <p className="mb-4" style={{ color: CATPPUCCIN_COLORS.red }}>
                  {error}
                </p>
                <button
                  onClick={loadMenu}
                  className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: CATPPUCCIN_COLORS.accent,
                    color: CATPPUCCIN_COLORS.bgSecondary,
                  }}
                >
                  تلاش مجدد
                </button>
              </div>
            )}

            {/* Menu Content */}
            {!loading && !error && menuData && (
              <>
                {/* Category List */}
                <div
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: CATPPUCCIN_COLORS.bgSecondary }}
                >
                  <CategoryList
                    categories={currentCategories}
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                  />
                </div>

                {/* Items Grid */}
                <div
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: CATPPUCCIN_COLORS.bgSecondary }}
                >
                  <ItemsGrid
                    items={currentItems}
                    selectedCategory={selectedCategory}
                    onAddToCart={handleAddToCart}
                    onRequestExtras={handleRequestExtras}
                  />
                </div>
              </>
            )}
          </div>

          {/* Right Column - Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <CartSummary
                cartItems={cartItems}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onProceedToPayment={handleProceedToPayment}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Extras Modal */}
      <ExtrasModal
        item={selectedItemForExtras}
        isOpen={extrasModalOpen}
        onClose={() => {
          setExtrasModalOpen(false);
          setSelectedItemForExtras(null);
        }}
        onConfirm={handleConfirmExtras}
      />

      {/* Loading Overlay for Submission */}
      {submitting && <LoadingOverlay message="در حال ایجاد فروش..." />}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
