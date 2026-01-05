'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  SaleType,
  IMenuItemForSale,
  ICartItem,
  ICartExtra,
  IMenuGroup,
} from '@/types/sale';
import { IGuest } from '@/types/guest';
import { fetchSaleMenu, openSale, saveAsOpenSale } from '@/service/sale';
import { SaleTypeSelector } from '@/components/sale/SaleTypeSelector';
import { TableSelector } from '@/components/sale/TableSelector';
import { CategoryList } from '@/components/sale/CategoryList';
import { ItemsGrid } from '@/components/sale/ItemsGrid';
import { CartSummary } from '@/components/sale/CartSummary/CartSummary';
import { ExtrasModal, SelectedExtra } from '@/components/sale/ExtrasModal';
import { GuestSelector } from '@/components/guest/GuestSelector';
import { GuestQuickCreateModal } from '@/components/guest/GuestQuickCreateModal';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';
import { getCurrentJalaliDate } from '@/utils/persianUtils';
import { PrintSaleData, PrintSaleItem, queueReceipt } from '@/utils/printUtils';

// --- CUSTOM HOOKS (Ideally move these to /src/hooks/sale/...) ---

/**
 * Manages Menu Data, Tabs (Food/Bar), and Category Selection
 */
const useSaleMenu = () => {
  const [menuData, setMenuData] = useState<IMenuGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'BAR' | 'FOOD'>('FOOD');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSaleMenu();
      setMenuData(data);

      // Default to first category of FOOD
      const foodGroup = data.find((g) => g.parent_group === 'FOOD');
      if (foodGroup && foodGroup.categories.length > 0) {
        setSelectedCategory(foodGroup.categories[0].title);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : UI_TEXT.ERROR_LOADING_MENU);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Update category when tab changes
  useEffect(() => {
    if (!menuData) return;
    const group = menuData.find((g) => g.parent_group === activeTab);
    if (group && group.categories.length > 0) {
      setSelectedCategory(group.categories[0].title);
    }
  }, [activeTab, menuData]);

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

  return {
    menuData,
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedCategory,
    setSelectedCategory,
    currentCategories,
    currentItems,
    retryLoad: loadMenu
  };
};

/**
 * Manages Cart State and Logic
 */
const useCart = () => {
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);

  const addToCart = (item: IMenuItemForSale) => {
    setCartItems((prev) => {
      // Find item with same ID and NO extras
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
      }

      const cartItemId = `${Date.now()}-${Math.random()}`;
      return [...prev, {
        id: cartItemId,
        menu_id: item.id,
        name: item.name,
        quantity: 1,
        unit_price: item.price,
        extras: [],
        total: item.price,
      }];
    });
  };

  const removeItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
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

  const addOrUpdateWithExtras = (
    item: IMenuItemForSale,
    selectedExtras: SelectedExtra[],
    quantity: number,
    editingCartItem: ICartItem | null
  ) => {
    // Helper to map selected extras to cart extras
    const mapExtras = (prefixId: string): ICartExtra[] =>
      selectedExtras.map((se) => ({
        id: `${prefixId}-extra-${se.extra.id}`,
        product_id: se.extra.id,
        name: se.extra.name,
        price: se.extra.price,
        quantity: se.quantity,
      }));

    if (editingCartItem) {
      // Logic for updating existing cart item
      const updatedExtras = mapExtras(editingCartItem.id);
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
    } else {
      // Logic for creating new cart item with extras
      const cartItemId = `${Date.now()}-${Math.random()}`;
      const cartExtras = mapExtras(cartItemId);
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
  };

  return {
    cartItems,
    setCartItems, // Exposed for clear/bulk set if needed
    addToCart,
    removeItem,
    updateQuantity,
    addOrUpdateWithExtras
  };
};

/**
 * Manages Sale Submission (Open, Pay, Print)
 */
type SubmissionAction = 'PROCEED_PAYMENT' | 'SAVE_OPEN' | 'SAVE_PAY' | 'SAVE_PRINT';

const useSaleSubmission = (
  router: ReturnType<typeof useRouter>,
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void
) => {
  const [submitting, setSubmitting] = useState(false);

  // Helper to trigger printing
  const triggerPrintReceipt = async (
    cartItems: ICartItem[],
    saleType: SaleType,
    selectedTableId: number | null,
    saleId?: number,
    invoiceNumber?: string
  ) => {
    const printItems: PrintSaleItem[] = cartItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      extras: item.extras.map((extra) => ({
        name: extra.name,
        quantity: extra.quantity,
        unit_price: extra.price,
        total: extra.price * extra.quantity,
      })),
    }));

    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

    const printData: PrintSaleData = {
      sale_id: saleId,
      invoice_number: invoiceNumber,
      sale_type: saleType,
      table_name: selectedTableId ? `میز ${selectedTableId}` : undefined,
      items: printItems,
      subtotal,
      total: subtotal,
      timestamp: new Date(),
    };

    try {
      await queueReceipt(printData, saleId);
    } catch (error) {
      console.error('Print queue error:', error);
    }
  };

  // Main submission handler
  const submitSale = async (
    action: SubmissionAction,
    data: {
      saleType: SaleType;
      selectedTableId: number | null;
      cartItems: ICartItem[];
      selectedGuestId: number | null;
      guestCount: number | null;
    }
  ) => {
    const { saleType, selectedTableId, cartItems, selectedGuestId, guestCount } = data;

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

      const apiPayload = {
        sale_type: saleType,
        table_id: saleType === SaleType.DINE_IN ? selectedTableId : null,
        guest_id: selectedGuestId,
        guest_count: guestCount,
        note: null,
        items: cartItems.map((cartItem) => ({
          menu_id: cartItem.menu_id,
          quantity: cartItem.quantity,
          extras: cartItem.extras.map((extra) => ({
            product_id: extra.product_id,
            quantity: extra.quantity,
          })),
        })),
      };

      let sale;
      let successMsg = '';
      let nextRoute = '';

      // Execute specific logic based on action
      switch (action) {
        case 'PROCEED_PAYMENT':
          sale = await openSale(apiPayload);
          successMsg = UI_TEXT.SUCCESS_SALE_CREATED;
          nextRoute = `/sale/${sale.id}/payment`;
          break;

        case 'SAVE_OPEN':
          sale = await saveAsOpenSale(apiPayload);
          successMsg = UI_TEXT.SUCCESS_OPEN_SALE_SAVED;
          nextRoute = '/sale/dashboard';
          break;

        case 'SAVE_PAY':
          sale = await saveAsOpenSale(apiPayload);
          successMsg = UI_TEXT.SUCCESS_OPEN_SALE_SAVED;
          nextRoute = `/sale/${sale.id}/payment`;
          break;

        case 'SAVE_PRINT':
          sale = await openSale(apiPayload);
          successMsg = UI_TEXT.SUCCESS_SALE_CREATED;
          nextRoute = `/sale/${sale.id}/payment`;
          // Fire and forget print
          triggerPrintReceipt(cartItems, saleType, selectedTableId, sale.id);
          break;
      }

      showToast(successMsg, 'success');
      setTimeout(() => {
        router.push(nextRoute);
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

  return { submitting, submitSale };
};

// --- MAIN COMPONENT ---

export default function NewSalePage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  // --- State: Sale Configuration ---
  const [saleType, setSaleType] = useState<SaleType>(SaleType.DINE_IN);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);
  const [guestCount, setGuestCount] = useState<number | null>(null);

  // --- State: UI & Modals ---
  const [animatingItemId, setAnimatingItemId] = useState<number | null>(null);
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [guestQuickCreateModalOpen, setGuestQuickCreateModalOpen] = useState(false);
  const [searchedMobile, setSearchedMobile] = useState<string>('');

  // Selection state for Extras Modal
  const [selectedItemForExtras, setSelectedItemForExtras] = useState<IMenuItemForSale | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<ICartItem | null>(null);

  // --- Hooks ---
  const {
    loading: menuLoading,
    error: menuError,
    activeTab,
    setActiveTab,
    selectedCategory,
    setSelectedCategory,
    currentCategories,
    currentItems,
    retryLoad
  } = useSaleMenu();

  const {
    cartItems,
    addToCart,
    removeItem,
    updateQuantity,
    addOrUpdateWithExtras
  } = useCart();

  const { submitting, submitSale } = useSaleSubmission(router, showToast);

  // --- Ref for Scrolling ---
  const cartSummaryRef = useRef<HTMLDivElement>(null);
  const showFloatingButton = cartItems.length > 0;

  const scrollToCart = () => {
    cartSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // --- Event Handlers ---

  const handleSaleTypeChange = (type: SaleType) => {
    setSaleType(type);
    if (type === SaleType.TAKEAWAY) {
      setSelectedTableId(null);
    }
  };

  const handleAddToCart = (item: IMenuItemForSale) => {
    setAnimatingItemId(item.id);
    setTimeout(() => setAnimatingItemId(null), 500);
    addToCart(item);
  };

  const handleRequestExtras = (item: IMenuItemForSale) => {
    setSelectedItemForExtras(item);
    setEditingCartItem(null);
    setExtrasModalOpen(true);
  };

  const handleEditCartItemExtras = (cartItem: ICartItem) => {
    setSelectedItemForExtras({
      id: cartItem.menu_id,
      name: cartItem.name,
      price: cartItem.unit_price,
    });
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

    addOrUpdateWithExtras(item, selectedExtras, quantity, editingCartItem);

    setExtrasModalOpen(false);
    setSelectedItemForExtras(null);
  };

  const handleGuestCreated = (guest: IGuest) => {
    setSelectedGuestId(guest.id);
    showToast(`مهمان "${guest.name}" ایجاد شد`, 'success');
  };

  const handleCancel = () => {
    if (cartItems.length > 0) {
      if (confirm('آیا از لغو و بازگشت اطمینان دارید؟ تغییرات ذخیره نخواهد شد.')) {
        router.push('/sale/dashboard');
      }
    } else {
      router.push('/sale/dashboard');
    }
  };

  // Wrapper for all submission actions to pass current state
  const handleSubmission = (action: SubmissionAction) => {
    submitSale(action, {
      saleType,
      selectedTableId,
      cartItems,
      selectedGuestId,
      guestCount
    });
  };

  // --- Render ---

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header
        className="p-2 border-b"
        style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}
      >
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/sale/dashboard')}
              className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90 border-2"
              style={{
                backgroundColor: 'transparent',
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.subtext,
              }}
            >
              ← بازگشت
            </button>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: THEME_COLORS.text }}>
              {UI_TEXT.PAGE_TITLE}
            </h1>
          </div>
          <div style={{ color: THEME_COLORS.subtext }}>
            {getCurrentJalaliDate('dddd، jD jMMMM jYYYY')}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

          {/* Left Column - Selection & Menu */}
          <div className="lg:col-span-2 space-y-2">

            {/* Sale Type */}
            <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
              <SaleTypeSelector
                selectedType={saleType}
                onTypeChange={handleSaleTypeChange}
              />
            </div>

            {/* Table Selection */}
            {saleType === SaleType.DINE_IN && (
              <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
                <TableSelector
                  selectedTableId={selectedTableId}
                  onTableSelect={setSelectedTableId}
                />
              </div>
            )}

            {/* Guest Info */}
            <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
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
                  <label className="block text-sm font-medium mb-1" style={{ color: THEME_COLORS.text }}>
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

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('FOOD')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${activeTab === 'FOOD' ? 'scale-105' : ''}`}
                style={{
                  backgroundColor: activeTab === 'FOOD' ? THEME_COLORS.accent : THEME_COLORS.surface,
                  color: activeTab === 'FOOD' ? '#fff' : THEME_COLORS.subtext,
                }}
              >
                {UI_TEXT.TAB_FOOD}
              </button>
              <button
                onClick={() => setActiveTab('BAR')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${activeTab === 'BAR' ? 'scale-105' : ''}`}
                style={{
                  backgroundColor: activeTab === 'BAR' ? THEME_COLORS.accent : THEME_COLORS.surface,
                  color: activeTab === 'BAR' ? '#fff' : THEME_COLORS.subtext,
                }}
              >
                {UI_TEXT.TAB_DRINKS}
              </button>
            </div>

            {/* Content: Loading / Error / Menu */}
            {menuLoading && (
              <div className="p-6 rounded-lg text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
                <div
                  className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto"
                  style={{ borderColor: `${THEME_COLORS.accent} transparent transparent transparent` }}
                />
                <p className="mt-4" style={{ color: THEME_COLORS.subtext }}>
                  {UI_TEXT.MSG_LOADING_MENU}
                </p>
              </div>
            )}

            {menuError && (
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
                <div className="text-4xl mb-3" style={{ color: THEME_COLORS.red }}>⚠️</div>
                <p className="mb-4" style={{ color: THEME_COLORS.red }}>{menuError}</p>
                <button
                  onClick={retryLoad}
                  className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
                  style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
                >
                  {UI_TEXT.BTN_RETRY}
                </button>
              </div>
            )}

            {!menuLoading && !menuError && (
              <>
                <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
                  <CategoryList
                    categories={currentCategories}
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                  />
                </div>

                <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_COLORS.bgSecondary }}>
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
                onRemoveItem={removeItem}
                onUpdateQuantity={updateQuantity}
                onEditExtras={handleEditCartItemExtras}
                // Mapping generalized submission handler to specific props
                onSaveSilent={() => handleSubmission('PROCEED_PAYMENT')}
                onSaveAndPrintAll={() => handleSubmission('SAVE_PRINT')}
                onSaveAndPay={() => handleSubmission('SAVE_PAY')}
                onCancel={handleCancel}
                isEditMode={false}
                isSubmitting={submitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Button */}
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

      {/* Modals */}
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

      <GuestQuickCreateModal
        isOpen={guestQuickCreateModalOpen}
        onClose={() => setGuestQuickCreateModalOpen(false)}
        onGuestCreated={handleGuestCreated}
        initialMobile={searchedMobile}
      />

      {submitting && <LoadingOverlay message={UI_TEXT.MSG_CREATING_SALE} />}

      <ToastContainer />
    </div>
  );
}
