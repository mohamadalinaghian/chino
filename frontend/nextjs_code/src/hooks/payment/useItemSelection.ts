import { useCallback, useState } from 'react';
import { ISaleItemDetail } from '@/types/sale';
import { SelectedItem } from '@/types/payment';

interface UseItemSelectionArgs {
  unpaidItems: ISaleItemDetail[];
}

interface UseItemSelectionResult {
  selectedItems: SelectedItem[];
  toggleItemSelection: (item: ISaleItemDetail) => void;
  updateItemQuantity: (item: ISaleItemDetail, quantity: number) => void;
  updateItemTax: (itemId: number, taxPercent: number) => void;
  selectAllItems: () => void;
  clearSelection: () => void;
}

export function useItemSelection(
  args: UseItemSelectionArgs
): UseItemSelectionResult {
  const { unpaidItems } = args;

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const toggleItemSelection = useCallback((item: ISaleItemDetail) => {
    setSelectedItems(prev => {
      const existing = prev.find(s => s.itemId === item.id);

      if (existing) {
        return prev.filter(s => s.itemId !== item.id);
      }

      return [
        ...prev,
        {
          itemId: Number(item.id),
          quantity: item.quantity_remaining,
          taxPercent: 10,
        },
      ];
    });
  }, []);

  const updateItemQuantity = useCallback(
    (item: ISaleItemDetail, quantity: number) => {
      const maxQty = item.quantity_remaining;
      const newQty = Math.max(0, Math.min(maxQty, quantity));

      const id = Number(item.id);
      setSelectedItems(prev => {
        if (newQty === 0) {

          return prev.filter(s => s.itemId !== id);
        }

        const existing = prev.find(s => s.itemId === id);

        if (!existing) {
          return [
            ...prev,
            {
              itemId: Number(item.id),
              quantity: newQty,
              taxPercent: 10,
            },
          ];
        }

        return prev.map(s =>
          s.itemId === id ? { ...s, quantity: newQty } : s
        );
      });
    },
    []
  );

  const selectAllItems = useCallback(() => {
    setSelectedItems(
      unpaidItems.map(item => ({
        itemId: Number(item.id),
        quantity: item.quantity_remaining,
        taxPercent: 10,
      }))
    );
  }, [unpaidItems]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const updateItemTax = useCallback(
    (itemId: number, taxPercent: number) => {
      setSelectedItems(prev =>
        prev.map(s =>
          s.itemId === itemId ? { ...s, taxPercent } : s
        )
      );
    },
    []
  );

  return {
    selectedItems,
    toggleItemSelection,
    updateItemQuantity,
    updateItemTax,
    selectAllItems,
    clearSelection,
  };
}
