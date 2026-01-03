'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  SaleType,
  IMenuItemForSale,
  ICartItem,
  ICartExtra,
  IMenuGroup,
} from '@/types/sale';
import { fetchSaleMenu, fetchSaleDetails, syncSaleItems } from '@/service/sale';
import { SaleTypeSelector } from '@/components/sale/SaleTypeSelector';
import { TableSelector } from '@/components/sale/TableSelector';
import { CategoryList } from '@/components/sale/CategoryList';
import { ItemsGrid } from '@/components/sale/ItemsGrid';
import { CartSummary, IGuest } from '@/components/sale/CartSummary/CartSummary';
import { ExtrasModal, SelectedExtra } from '@/components/sale/ExtrasModal';
import { useToast } from '@/components/common/Toast';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';
import { getCurrentJalaliDate } from '@/utils/persianUtils';

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

  // Print order toggle (default: true - print automatically)
  const [printOrder, setPrintOrder] = useState(true);

  // Guest information
  const [guests, setGuests] = useState<IGuest[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [quickAddGuestModalOpen, setQuickAddGuestModalOpen] = useState(false);

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
      setSelectedTableId(sale.table?.id || null);
      setSelectedGuestId(null); // Will be populated if backend provides guest info
      setGuestCount(null);

      // Convert sale items to cart items
      const convertedItems: ICartItem[] = sale.items
        .filter((item) => !item.parent_item) // Only get parent items
        .map((item) => {
          const itemExtras = sale.items
            .filter((extra) => extra.parent_item === item.id)
            .map((extra) => ({
              id: `extra-${extra.id}`,
              product_id: extra.id, // Assuming the extra item id maps to product_id
              name: extra.product_name,
              price: extra.unit_price,
              quantity: extra.quantity,
            }));

          return {
            id: `item-${item.id}`,
            menu_id: item.id,
            name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            extras: itemExtras,
            total: item.total_price,
          };
        });

      setCartItems(convertedItems);
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

      await syncSaleItems(saleId, items);
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
                onProceedToPayment={handleSaveChanges}
                onSaveAsOpen={handleCancel}
                printOrder={printOrder}
                onPrintOrderChange={setPrintOrder}
                guests={guests}
                selectedGuestId={selectedGuestId}
                onGuestChange={setSelectedGuestId}
                guestCount={guestCount}
                onGuestCountChange={setGuestCount}
                onQuickAddGuest={() => setQuickAddGuestModalOpen(true)}
                // Override button labels for edit mode
                proceedButtonLabel="💾 ذخیره تغییرات"
                saveAsOpenButtonLabel="✕ لغو"
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

      <ToastContainer />
    </div>
  );
}
