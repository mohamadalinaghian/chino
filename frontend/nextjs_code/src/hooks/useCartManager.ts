'use client';

import { useState, useCallback } from 'react';
import { ICartItem, ICartExtra, IMenuItemForSale } from '@/types/sale';
import { SelectedExtra } from '@/components/sale/ExtrasModal';

export interface UseCartManagerReturn {
  cartItems: ICartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<ICartItem[]>>;
  animatingItemId: number | null;
  handleAddToCart: (item: IMenuItemForSale) => void;
  handleRemoveItem: (itemId: string) => void;
  handleUpdateQuantity: (itemId: string, newQuantity: number) => void;
  handleConfirmExtras: (
    item: IMenuItemForSale,
    selectedExtras: SelectedExtra[],
    quantity: number,
    editingCartItem: ICartItem | null
  ) => void;
  calculateCartTotal: () => number;
}

export function useCartManager(
  initialItems: ICartItem[] = []
): UseCartManagerReturn {
  const [cartItems, setCartItems] = useState<ICartItem[]>(initialItems);
  const [animatingItemId, setAnimatingItemId] = useState<number | null>(null);

  const triggerAnimation = useCallback((itemId: number) => {
    setAnimatingItemId(itemId);
    setTimeout(() => setAnimatingItemId(null), 500);
  }, []);

  const handleAddToCart = useCallback((item: IMenuItemForSale) => {
    triggerAnimation(item.id);

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
  }, [triggerAnimation]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
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
  }, []);

  const handleConfirmExtras = useCallback((
    item: IMenuItemForSale,
    selectedExtras: SelectedExtra[],
    quantity: number,
    editingCartItem: ICartItem | null
  ) => {
    triggerAnimation(item.id);

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
  }, [triggerAnimation]);

  const calculateCartTotal = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  }, [cartItems]);

  return {
    cartItems,
    setCartItems,
    animatingItemId,
    handleAddToCart,
    handleRemoveItem,
    handleUpdateQuantity,
    handleConfirmExtras,
    calculateCartTotal,
  };
}
