'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  SaleType,
  IMenuItemForSale,
  ICartItem,
  ICartExtra,
  IMenuGroup,
} from '@/types/sale';
import { fetchSaleMenu, openSale, saveAsOpenSale } from '@/service/sale';
import { SaleTypeSelector } from '@/components/sale/SaleTypeSelector';
import { TableSelector } from '@/components/sale/TableSelector';
import { CategoryList } from '@/components/sale/CategoryList';
import { ItemsGrid } from '@/components/sale/ItemsGrid';
import { CartSummary } from '@/components/sale/CartSummary';
import { ExtrasModal, SelectedExtra } from '@/components/sale/ExtrasModal';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';
import { getCurrentJalaliDate } from '@/utils/persianUtils';

export default function NewSalePage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  // Sale configuration
  const [saleType, setSaleType] = useState<SaleType>(SaleType.TAKEAWAY);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  // Menu data
  const [menuData, setMenuData] = useState<IMenuGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation state - use parent_group (BAR or FOOD) as activeTab
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'BAR' | 'FOOD'>('FOOD');

  // Cart state
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);

  // Animation state for item selection feedback
  const [animatingItemId, setAnimatingItemId] = useState<number | null>(null);

  // Extras modal state
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [selectedItemForExtras, setSelectedItemForExtras] =
    useState<IMenuItemForSale | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Print option
  const [printOrder, setPrintOrder] = useState(true); // Default: print orders

  // Load menu on mount
  useEffect(() => {
    loadMenu();
  }, []);

  // Auto-select first category when tab changes
  useEffect(() => {
    if (!menuData) return;
    const group = menuData.find((g) => g.parent_group === activeTab);
    if (group && group.categories.length > 0) {
      setSelectedCategory(group.categories[0].title);
    }
  }, [activeTab, menuData]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSaleMenu();
      setMenuData(data);

      // Auto-select first category from FOOD group
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

  // Get current categories based on active tab
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

  // Get current items for selected category
  const currentItems = useMemo(() => {
    if (!menuData || !selectedCategory) return [];
    const group = menuData.find((g) => g.parent_group === activeTab);
    if (!group) return [];
    const category = group.categories.find((cat) => cat.title === selectedCategory);
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
    // Show selection animation
    setAnimatingItemId(item.id);
    setTimeout(() => setAnimatingItemId(null), 500);

    setCartItems((prev) => {
      // Find if item without extras already exists
      const existingItemIndex = prev.findIndex(
        (cartItem) => cartItem.menu_id === item.id && cartItem.extras.length === 0
      );

      if (existingItemIndex !== -1) {
        // Item exists, increment quantity
        const updated = [...prev];
        const existingItem = updated[existingItemIndex];
        updated[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          total: existingItem.unit_price * (existingItem.quantity + 1),
        };
        return updated;
      } else {
        // Item doesn't exist, create new cart entry
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

  // Handle request extras
  const handleRequestExtras = (item: IMenuItemForSale) => {
    setSelectedItemForExtras(item);
    setExtrasModalOpen(true);
  };

  // Handle confirm extras and add to cart
  // Items with extras are ALWAYS added as separate cart entries
  const handleConfirmExtras = (
    item: IMenuItemForSale,
    selectedExtras: SelectedExtra[],
    quantity: number
  ) => {
    // Show selection animation
    setAnimatingItemId(item.id);
    setTimeout(() => setAnimatingItemId(null), 600);

    const cartItemId = `${Date.now()}-${Math.random()}`;

    const cartExtras: ICartExtra[] = selectedExtras.map((se) => ({
      id: `${cartItemId}-extra-${se.extra.id}`,
      product_id: se.extra.id,
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
    setExtrasModalOpen(false);
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

  // Handle proceed to payment (immediate pay)
  const handleProceedToPayment = async () => {
    // Validation
    if (saleType === SaleType.DINE_IN && !selectedTableId) {
      showToast(UI_TEXT.VALIDATION_SELECT_TABLE, 'warning');
      return;
    }

    if (cartItems.length === 0) {
      showToast(UI_TEXT.VALIDATION_EMPTY_CART, 'warning');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare sale data
      const saleData = {
        sale_type: saleType,
        table_id: saleType === SaleType.DINE_IN ? selectedTableId : null,
        print_order: printOrder,
        items: cartItems.map((cartItem) => ({
          menu_id: cartItem.menu_id,
          quantity: cartItem.quantity,
          extras: cartItem.extras.map((extra) => ({
            product_id: extra.product_id,
            quantity: extra.quantity,
          })),
        })),
      };

      // Create sale
      const sale = await openSale(saleData);

      showToast(UI_TEXT.SUCCESS_SALE_CREATED, 'success');

      // Redirect to payment page
      setTimeout(() => {
        router.push(`/sale/${sale.id}/payment`);
      }, 500);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : UI_TEXT.ERROR_CREATING_SALE,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle save as open sale (to pay later)
  const handleSaveAsOpen = async () => {
    // Validation
    if (saleType === SaleType.DINE_IN && !selectedTableId) {
      showToast(UI_TEXT.VALIDATION_SELECT_TABLE, 'warning');
      return;
    }

    if (cartItems.length === 0) {
      showToast(UI_TEXT.VALIDATION_EMPTY_CART, 'warning');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare sale data
      const saleData = {
        sale_type: saleType,
        table_id: saleType === SaleType.DINE_IN ? selectedTableId : null,
        print_order: printOrder,
        items: cartItems.map((cartItem) => ({
          menu_id: cartItem.menu_id,
          quantity: cartItem.quantity,
          extras: cartItem.extras.map((extra) => ({
            product_id: extra.product_id,
            quantity: extra.quantity,
          })),
        })),
      };

      // Save as open sale
      const sale = await saveAsOpenSale(saleData);

      showToast(UI_TEXT.SUCCESS_OPEN_SALE_SAVED, 'success');

      // Redirect to sales list or dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : UI_TEXT.ERROR_CREATING_SALE,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen"
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
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ color: THEME_COLORS.text }}
          >
            {UI_TEXT.PAGE_TITLE}
          </h1>
          <div style={{ color: THEME_COLORS.subtext }}>
            {getCurrentJalaliDate('dddd، jD jMMMM jYYYY')}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Left Column - Menu Selection */}
          <div className="lg:col-span-2 space-y-2">
            {/* Sale Type Selector */}
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: THEME_COLORS.bgSecondary }}
            >
              <SaleTypeSelector
                selectedType={saleType}
                onTypeChange={handleSaleTypeChange}
              />
            </div>

            {/* Table Selector (only for dine-in) */}
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

            {/* Menu Tabs */}
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

            {/* Loading State */}
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

            {/* Error State */}
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

            {/* Menu Content */}
            {!loading && !error && menuData && (
              <>
                {/* Category List */}
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

                {/* Items Grid */}
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
                cartItems={cartItems}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onProceedToPayment={handleProceedToPayment}
                onSaveAsOpen={handleSaveAsOpen}
                printOrder={printOrder}
                onPrintOrderChange={setPrintOrder}
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
      {submitting && <LoadingOverlay message={UI_TEXT.MSG_CREATING_SALE} />}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
