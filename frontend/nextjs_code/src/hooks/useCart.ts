/**
 * Custom hook for managing shopping cart state
 *
 * Features:
 * - Add/remove/update items
 * - Manage extras for each item
 * - Calculate totals
 * - Type-safe operations
 *
 * Follows Single Responsibility Principle:
 * - Only manages cart state, not API calls or UI
 */

import { useState, useCallback, useMemo } from 'react';
import type { CartItem, CartExtra } from '@/types/newSaleTypes';

/**
 * Hook return type
 */
export interface UseCartReturn {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  addItem: (menuId: number, name: string, price: number) => void;
  removeItem: (menuId: number) => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  addExtra: (menuId: number, productId: number, name: string, price: number) => void;
  removeExtra: (menuId: number, productId: number) => void;
  updateExtraQuantity: (menuId: number, productId: number, quantity: number) => void;
  clearCart: () => void;
}

/**
 * Hook for managing cart state
 */
export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);

  /**
   * Adds a new item to cart or increments quantity if exists
   */
  const addItem = useCallback(
    (menuId: number, name: string, price: number) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.menu_id === menuId);

        if (existingIndex >= 0) {
          // Item exists - increment quantity
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
          return updated;
        }

        // New item
        return [
          ...prev,
          {
            menu_id: menuId,
            name,
            price,
            quantity: 1,
            extras: [],
          },
        ];
      });
    },
    []
  );

  /**
   * Removes an item from cart
   */
  const removeItem = useCallback((menuId: number) => {
    setItems((prev) => prev.filter((item) => item.menu_id !== menuId));
  }, []);

  /**
   * Updates quantity of an item
   * Removes item if quantity becomes 0
   */
  const updateQuantity = useCallback((menuId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.menu_id !== menuId));
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.menu_id === menuId ? { ...item, quantity } : item
      )
    );
  }, []);

  /**
   * Adds an extra to a specific item or increments quantity if exists
   */
  const addExtra = useCallback(
    (menuId: number, productId: number, name: string, price: number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.menu_id !== menuId) return item;

          const existingExtraIndex = item.extras.findIndex(
            (extra) => extra.product_id === productId
          );

          if (existingExtraIndex >= 0) {
            // Extra exists - increment quantity
            const updatedExtras = [...item.extras];
            updatedExtras[existingExtraIndex] = {
              ...updatedExtras[existingExtraIndex],
              quantity: updatedExtras[existingExtraIndex].quantity + 1,
            };
            return { ...item, extras: updatedExtras };
          }

          // New extra
          return {
            ...item,
            extras: [
              ...item.extras,
              { product_id: productId, name, price, quantity: 1 },
            ],
          };
        })
      );
    },
    []
  );

  /**
   * Removes an extra from a specific item
   */
  const removeExtra = useCallback(
    (menuId: number, productId: number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.menu_id !== menuId) return item;
          return {
            ...item,
            extras: item.extras.filter(
              (extra) => extra.product_id !== productId
            ),
          };
        })
      );
    },
    []
  );

  /**
   * Updates quantity of an extra
   * Removes extra if quantity becomes 0
   */
  const updateExtraQuantity = useCallback(
    (menuId: number, productId: number, quantity: number) => {
      if (quantity <= 0) {
        removeExtra(menuId, productId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.menu_id !== menuId) return item;
          return {
            ...item,
            extras: item.extras.map((extra) =>
              extra.product_id === productId ? { ...extra, quantity } : extra
            ),
          };
        })
      );
    },
    [removeExtra]
  );

  /**
   * Clears entire cart
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * Calculate total amount
   * Includes both items and extras
   */
  const totalAmount = useMemo(() => {
    return items.reduce((total, item) => {
      // Item total
      const itemTotal = item.price * item.quantity;

      // Extras total for this item
      const extrasTotal = item.extras.reduce(
        (sum, extra) => sum + extra.price * extra.quantity,
        0
      );

      return total + itemTotal + extrasTotal;
    }, 0);
  }, [items]);

  /**
   * Total number of items (not including extras)
   */
  const itemCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  return {
    items,
    totalAmount,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    addExtra,
    removeExtra,
    updateExtraQuantity,
    clearCart,
  };
}
