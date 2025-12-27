/**
 * New Sale Page (Updated with UX Improvements)
 *
 * Features:
 * - Menu browsing by category (BAR/FOOD)
 * - Quick navigation bar for jumping between categories
 * - Floating cart button on mobile
 * - Shopping cart with item management
 * - Extra items (syrups, toppings)
 * - Sale type selection (dine-in/takeaway)
 * - Real table selection from API
 * - Submit order
 *
 * UX Improvements:
 * - Sticky category navigation
 * - Active category highlighting
 * - Floating cart button on mobile
 * - Smooth scrolling
 * - Better mobile experience
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSaleMenu } from '@/hooks/useSaleMenu';
import { useCart } from '@/hooks/useCart';
import { SaleApiClient } from '@/libs/sale/saleApiClient';
import { MenuSection } from '@/components/newSale/MenuSection';
import { CartSidebar } from '@/components/newSale/CartSidebar';
import { SaleTypeSelector } from '@/components/newSale/SaleTypeSelector';
import { CategoryQuickNav } from '@/components/newSale/CategoryQuickNav';
import { FloatingCartButton } from '@/components/newSale/FloatingCartButton';
import { LoadingState } from '@/components/newSale/LoadingState';
import { ErrorState } from '@/components/newSale/ErrorState';
import { NewSaleType } from '@/types/newSaleTypes';
import type { SyncSaleItemInput } from '@/types/saleType';

export default function NewSalePage() {
  const router = useRouter();
  const { menuData, loading, error, retry } = useSaleMenu();
  const cart = useCart();

  // Form state
  const [saleType, setSaleType] = useState<NewSaleType>(NewSaleType.DINE_IN);
  const [tableId, setTableId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Mobile cart visibility
  const [showMobileCart, setShowMobileCart] = useState(false);

  /**
   * Validates form before submission
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
   * Converts cart items to API format
   */
  const cartToApiFormat = (): SyncSaleItemInput[] => {
    return cart.items.map((item) => ({
      item_id: null, // New item
      menu_id: item.menu_id,
      quantity: item.quantity,
      extras: item.extras.map((extra) => ({
        product_id: extra.product_id,
        quantity: extra.quantity,
      })),
    }));
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async () => {
    // Validate
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await SaleApiClient.openSale({
        sale_type: saleType,
        table_id: saleType === NewSaleType.DINE_IN ? tableId : null,
        guest_id: null,
        guest_count: null,
        note: note || null,
        items: cartToApiFormat(),
      });

      // Success - redirect to sale detail page
      router.push(`/sale/${response.sale_id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'ایجاد فروش با خطا مواجه شد';
      setSubmitError(errorMessage);
      console.error('Error creating sale:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handles cancel action
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
    return <LoadingState />;
  }

  // Error state
  if (error || !menuData) {
    return <ErrorState message={error || 'خطای نامشخص'} onRetry={retry} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col lg:flex-row">
      {/* Main Content - Menu */}
      <div className="flex-1 overflow-y-auto">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 shadow-xl">
          <div className="max-w-5xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl lg:text-3xl font-bold">ایجاد فروش جدید</h1>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                ✕ انصراف
              </button>
            </div>

            {/* Sale Type Selector */}
            <SaleTypeSelector
              value={saleType}
              onChange={setSaleType}
              tableId={tableId}
              onTableChange={setTableId}
            />
          </div>
        </div>

        {/* Quick Navigation Bar */}
        <CategoryQuickNav
          barCategories={menuData.bar_items}
          foodCategories={menuData.food_items}
        />

        {/* Menu Sections */}
        <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-8 pb-24 lg:pb-8">
          {/* Bar Items */}
          <MenuSection
            title="🍹 نوشیدنی‌ها"
            categoryGroups={menuData.bar_items}
            onAddItem={cart.addItem}
          />

          {/* Food Items */}
          <MenuSection
            title="🍽️ غذاها"
            categoryGroups={menuData.food_items}
            onAddItem={cart.addItem}
          />
        </div>
      </div>

      {/* Sidebar - Cart (Desktop) / Modal (Mobile) */}
      <div
        className={`
          lg:block
          ${showMobileCart ? 'block' : 'hidden'}
        `}
      >
        <CartSidebar
          cart={cart}
          note={note}
          onNoteChange={setNote}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
          onClose={() => setShowMobileCart(false)} // For mobile close
        />
      </div>

      {/* Floating Cart Button (Mobile) */}
      <FloatingCartButton
        itemCount={cart.itemCount}
        totalAmount={cart.totalAmount}
        onClick={() => setShowMobileCart(true)}
      />

      {/* Mobile Cart Backdrop */}
      {showMobileCart && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setShowMobileCart(false)}
        />
      )}
    </div>
  );
}
