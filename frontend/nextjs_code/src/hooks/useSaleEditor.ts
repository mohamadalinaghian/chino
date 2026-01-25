'use client';

import { useState, useEffect, useCallback } from 'react';
import { SaleType, ICartItem, ICartExtra, ISaleDetailResponse, IMenuGroup } from '@/types/sale';
import { fetchSaleDetails, fetchSaleMenu, syncSaleItems } from '@/service/sale';

export interface UseSaleEditorReturn {
  // Sale configuration
  saleType: SaleType;
  setSaleType: React.Dispatch<React.SetStateAction<SaleType>>;
  selectedTableId: number | null;
  setSelectedTableId: React.Dispatch<React.SetStateAction<number | null>>;

  // Guest information
  selectedGuestId: number | null;
  setSelectedGuestId: React.Dispatch<React.SetStateAction<number | null>>;
  guestCount: number | null;
  setGuestCount: React.Dispatch<React.SetStateAction<number | null>>;

  // Menu data
  menuData: IMenuGroup[] | null;
  loading: boolean;
  error: string | null;

  // Original sale state for tracking changes
  originalSale: ISaleDetailResponse | null;
  originalCartItems: ICartItem[];

  // Actions
  loadSaleData: () => Promise<ICartItem[]>;
  loadMenu: () => Promise<void>;
  handleSaleTypeChange: (type: SaleType) => void;
  saveSaleChanges: (
    saleId: number,
    cartItems: ICartItem[]
  ) => Promise<void>;
}

export function useSaleEditor(saleId: number): UseSaleEditorReturn {
  // Sale configuration
  const [saleType, setSaleType] = useState<SaleType>(SaleType.TAKEAWAY);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  // Guest information
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);
  const [guestCount, setGuestCount] = useState<number | null>(null);

  // Menu data
  const [menuData, setMenuData] = useState<IMenuGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Original sale state for tracking changes
  const [originalSale, setOriginalSale] = useState<ISaleDetailResponse | null>(null);
  const [originalCartItems, setOriginalCartItems] = useState<ICartItem[]>([]);

  const convertSaleItemsToCart = (sale: ISaleDetailResponse): ICartItem[] => {
    return sale.items.map((item) => {
      const extras: ICartExtra[] = item.extras.map((extra) => ({
        id: `extra-${extra.id}`,
        product_id: extra.product_id,
        name: extra.product_name,
        price: Number(extra.unit_price),
        quantity: Number(extra.quantity),
      }));

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
  };

  const loadSaleData = useCallback(async (): Promise<ICartItem[]> => {
    const sale = await fetchSaleDetails(saleId);

    // Set sale type and table
    setSaleType(sale.sale_type);
    setSelectedTableId(sale.table_id || null);

    // Set guest information
    setSelectedGuestId(sale.guest_id || null);
    setGuestCount(sale.guest_count || null);

    // Convert sale items to cart items
    const convertedItems = convertSaleItemsToCart(sale);

    // Save original state for change tracking
    setOriginalSale(sale);
    setOriginalCartItems(JSON.parse(JSON.stringify(convertedItems)));

    return convertedItems;
  }, [saleId]);

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSaleMenu();
      setMenuData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت منوی فروش');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaleTypeChange = useCallback((type: SaleType) => {
    setSaleType(type);
    if (type === SaleType.TAKEAWAY) {
      setSelectedTableId(null);
    }
  }, []);

  const saveSaleChanges = useCallback(async (
    saleId: number,
    cartItems: ICartItem[]
  ) => {
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
      guest_count: guestCount || 0,
    });
  }, [saleType, selectedTableId, selectedGuestId, guestCount]);

  return {
    saleType,
    setSaleType,
    selectedTableId,
    setSelectedTableId,
    selectedGuestId,
    setSelectedGuestId,
    guestCount,
    setGuestCount,
    menuData,
    loading,
    error,
    originalSale,
    originalCartItems,
    loadSaleData,
    loadMenu,
    handleSaleTypeChange,
    saveSaleChanges,
  };
}
