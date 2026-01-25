'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SaleType, IMenuItemForSale, ICartItem } from '@/types/sale';
import { IGuest } from '@/types/guest';

// Hooks
import { useCartManager } from '@/hooks/useCartManager';
import { useSaleEditor } from '@/hooks/useSaleEditor';
import { useSalePrintDiff } from '@/hooks/useSalePrintDiff';

// Components
import { SaleTypeSelector } from '@/components/sale/SaleTypeSelector';
import { TableSelector } from '@/components/sale/TableSelector';
import { CategoryList } from '@/components/sale/CategoryList';
import { ItemsGrid } from '@/components/sale/ItemsGrid';
import { CartSummary } from '@/components/sale/CartSummary/CartSummary';
import { ExtrasModal, SelectedExtra } from '@/components/sale/ExtrasModal';
import { GuestQuickCreateModal } from '@/components/guest/GuestQuickCreateModal';
import { EditSaleHeader } from '@/components/sale/EditSaleHeader';
import { SaleInfoCard } from '@/components/sale/SaleInfoCard';
import { GuestSection } from '@/components/sale/GuestSection';
import { MenuTabs } from '@/components/sale/MenuTabs';
import { LoadingErrorState } from '@/components/sale/LoadingErrorState';
import { FloatingCartButton } from '@/components/sale/FloatingCartButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useToast } from '@/components/common/Toast';

import { THEME_COLORS } from '@/libs/constants';

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
  const saleId = parseInt(params.id as string);
  const { showToast, ToastContainer } = useToast();

  // Custom hooks
  const saleEditor = useSaleEditor(saleId);
  const cart = useCartManager();
  const printDiff = useSalePrintDiff();

  // Navigation state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'BAR' | 'FOOD'>('FOOD');

  // Extras modal state
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [selectedItemForExtras, setSelectedItemForExtras] = useState<IMenuItemForSale | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<ICartItem | null>(null);

  // Guest modal state
  const [guestQuickCreateModalOpen, setGuestQuickCreateModalOpen] = useState(false);
  const [searchedMobile, setSearchedMobile] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Cart ref + floating button
  const cartSummaryRef = useRef<HTMLDivElement>(null);

  const scrollToCart = () => {
    cartSummaryRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const cartItems = await saleEditor.loadSaleData();
        cart.setCartItems(cartItems);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'خطا در بارگذاری فروش',
          'error'
        );
      }
    };
    loadData();
    saleEditor.loadMenu();
  }, [saleId]);

  // Update selected category when tab or menu changes
  useEffect(() => {
    if (!saleEditor.menuData) return;
    const group = saleEditor.menuData.find((g) => g.parent_group === activeTab);
    if (group && group.categories.length > 0) {
      setSelectedCategory(group.categories[0].title);
    }
  }, [activeTab, saleEditor.menuData]);

  // Memoized data
  const currentCategories = useMemo(() => {
    if (!saleEditor.menuData) return [];
    const group = saleEditor.menuData.find((g) => g.parent_group === activeTab);
    if (!group) return [];
    return group.categories.map((cat) => ({
      id: cat.title,
      name: cat.title,
      parentGroup: activeTab,
    }));
  }, [saleEditor.menuData, activeTab]);

  const currentItems = useMemo(() => {
    if (!saleEditor.menuData || !selectedCategory) return [];
    const group = saleEditor.menuData.find((g) => g.parent_group === activeTab);
    if (!group) return [];
    const category = group.categories.find((cat) => cat.title === selectedCategory);
    return category?.items || [];
  }, [saleEditor.menuData, selectedCategory, activeTab]);

  // Handlers
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
    cart.handleConfirmExtras(item, selectedExtras, quantity, editingCartItem);
    setExtrasModalOpen(false);
    setSelectedItemForExtras(null);
    setEditingCartItem(null);
  };

  const handleCancel = () => {
    if (confirm('آیا از لغو تغییرات اطمینان دارید؟')) {
      router.push('/sale/dashboard');
    }
  };

  const handleGuestCreated = (guest: IGuest) => {
    saleEditor.setSelectedGuestId(guest.id);
    showToast(`مهمان "${guest.name}" ایجاد شد`, 'success');
  };

  const validateBeforeSave = (): boolean => {
    if (cart.cartItems.length === 0) {
      showToast('سبد خرید نمی‌تواند خالی باشد', 'warning');
      return false;
    }

    if (saleEditor.saleType === SaleType.DINE_IN && !saleEditor.selectedTableId) {
      showToast('لطفاً یک میز انتخاب کنید', 'warning');
      return false;
    }

    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateBeforeSave()) return;

    try {
      setSubmitting(true);
      await saleEditor.saveSaleChanges(saleId, cart.cartItems);
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

  const handlePrintAndSave = async () => {
    if (!validateBeforeSave() || !saleEditor.originalSale) {
      if (!saleEditor.originalSale) {
        showToast('خطا: اطلاعات اصلی فروش یافت نشد', 'error');
      }
      return;
    }

    try {
      setSubmitting(true);
      await saleEditor.saveSaleChanges(saleId, cart.cartItems);
      showToast('تغییرات ذخیره شد، در حال چاپ...', 'success');

      const printData = printDiff.preparePrintEditData(
        saleId,
        saleEditor.saleType,
        cart.cartItems,
        saleEditor.originalSale,
        saleEditor.originalCartItems,
        saleEditor.selectedTableId
      );

      await printDiff.queueEditPrint(printData, saleId);

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
    if (!validateBeforeSave()) return;

    try {
      setSubmitting(true);
      await saleEditor.saveSaleChanges(saleId, cart.cartItems);
      showToast('تغییرات ذخیره شد، در حال چاپ...', 'success');

      const printData = printDiff.preparePrintAllData(
        saleId,
        saleEditor.saleType,
        cart.cartItems,
        saleEditor.selectedTableId,
        saleEditor.guestCount
      );

      await printDiff.queueFullPrint(printData, saleId);

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

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: THEME_COLORS.bgPrimary }}
    >
      {/* Header */}
      <EditSaleHeader saleId={saleId} onCancel={handleCancel} />

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
                selectedType={saleEditor.saleType}
                onTypeChange={saleEditor.handleSaleTypeChange}
              />
            </div>

            {/* Table Selector (for DINE_IN) */}
            {saleEditor.saleType === SaleType.DINE_IN && (
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: THEME_COLORS.bgSecondary }}
              >
                <TableSelector
                  selectedTableId={saleEditor.selectedTableId}
                  onTableSelect={saleEditor.setSelectedTableId}
                />
              </div>
            )}

            {/* Current Sale Info Card */}
            {saleEditor.originalSale && (
              <SaleInfoCard originalSale={saleEditor.originalSale} />
            )}

            {/* Guest Section */}
            <GuestSection
              selectedGuestId={saleEditor.selectedGuestId}
              onGuestChange={saleEditor.setSelectedGuestId}
              guestCount={saleEditor.guestCount}
              onGuestCountChange={saleEditor.setGuestCount}
              onQuickCreate={(mobile) => {
                setSearchedMobile(mobile || '');
                setGuestQuickCreateModalOpen(true);
              }}
            />

            {/* Menu Tabs */}
            <MenuTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Loading/Error State */}
            <LoadingErrorState
              loading={saleEditor.loading}
              error={saleEditor.error}
              onRetry={saleEditor.loadMenu}
            />

            {/* Menu Content */}
            {!saleEditor.loading && !saleEditor.error && saleEditor.menuData && (
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
                    onAddToCart={cart.handleAddToCart}
                    onRequestExtras={handleRequestExtras}
                    animatingItemId={cart.animatingItemId}
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
                cartItems={cart.cartItems}
                onRemoveItem={cart.handleRemoveItem}
                onUpdateQuantity={cart.handleUpdateQuantity}
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

      {/* Floating Cart Button (Mobile) */}
      <FloatingCartButton
        onClick={scrollToCart}
        visible={cart.cartItems.length > 0}
      />

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

      {/* Loading Overlay */}
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
