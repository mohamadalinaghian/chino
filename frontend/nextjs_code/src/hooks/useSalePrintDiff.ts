'use client';

import { useCallback } from 'react';
import { SaleType, ICartItem, ISaleDetailResponse } from '@/types/sale';
import {
  PrintEditItem,
  PrintEditData,
  PrintSaleData,
  queueReceipt,
  queueEditReceipt
} from '@/utils/printUtils';

export interface UseSalePrintDiffReturn {
  calculateDiffItems: (
    originalCartItems: ICartItem[],
    cartItems: ICartItem[]
  ) => PrintEditItem[];
  preparePrintEditData: (
    saleId: number,
    saleType: SaleType,
    cartItems: ICartItem[],
    originalSale: ISaleDetailResponse,
    originalCartItems: ICartItem[],
    selectedTableId: number | null
  ) => PrintEditData;
  preparePrintAllData: (
    saleId: number,
    saleType: SaleType,
    cartItems: ICartItem[],
    selectedTableId: number | null,
    guestCount: number | null
  ) => PrintSaleData;
  queueEditPrint: (data: PrintEditData, saleId: number) => Promise<void>;
  queueFullPrint: (data: PrintSaleData, saleId: number) => Promise<void>;
}

export function useSalePrintDiff(): UseSalePrintDiffReturn {
  const calculateDiffItems = useCallback((
    originalCartItems: ICartItem[],
    cartItems: ICartItem[]
  ): PrintEditItem[] => {
    const diffItems: PrintEditItem[] = [];

    // Find removed and modified items
    originalCartItems.forEach((originalItem) => {
      const currentItem = cartItems.find(
        (ci) =>
          ci.menu_id === originalItem.menu_id &&
          JSON.stringify(ci.extras) === JSON.stringify(originalItem.extras)
      );

      if (!currentItem) {
        diffItems.push({
          name: originalItem.name,
          quantity: originalItem.quantity,
          unit_price: originalItem.unit_price,
          total: originalItem.total,
          extras: originalItem.extras.map((e) => ({
            name: e.name,
            quantity: e.quantity,
            unit_price: e.price,
            total: e.price * e.quantity,
          })),
          status: 'removed',
        });
      } else if (currentItem.quantity !== originalItem.quantity) {
        diffItems.push({
          name: currentItem.name,
          quantity: currentItem.quantity,
          unit_price: currentItem.unit_price,
          total: currentItem.total,
          extras: currentItem.extras.map((e) => ({
            name: e.name,
            quantity: e.quantity,
            unit_price: e.price,
            total: e.price * e.quantity,
          })),
          status: 'modified',
          oldQuantity: originalItem.quantity,
          quantityDiff: currentItem.quantity - originalItem.quantity,
        });
      } else {
        diffItems.push({
          name: currentItem.name,
          quantity: currentItem.quantity,
          unit_price: currentItem.unit_price,
          total: currentItem.total,
          extras: currentItem.extras.map((e) => ({
            name: e.name,
            quantity: e.quantity,
            unit_price: e.price,
            total: e.price * e.quantity,
          })),
          status: 'unchanged',
        });
      }
    });

    // Find added items
    cartItems.forEach((currentItem) => {
      const wasOriginal = originalCartItems.some(
        (oi) =>
          oi.menu_id === currentItem.menu_id &&
          JSON.stringify(oi.extras) === JSON.stringify(currentItem.extras)
      );

      if (!wasOriginal) {
        diffItems.push({
          name: currentItem.name,
          quantity: currentItem.quantity,
          unit_price: currentItem.unit_price,
          total: currentItem.total,
          extras: currentItem.extras.map((e) => ({
            name: e.name,
            quantity: e.quantity,
            unit_price: e.price,
            total: e.price * e.quantity,
          })),
          status: 'added',
        });
      }
    });

    return diffItems;
  }, []);

  const preparePrintEditData = useCallback((
    saleId: number,
    saleType: SaleType,
    cartItems: ICartItem[],
    originalSale: ISaleDetailResponse,
    originalCartItems: ICartItem[],
    selectedTableId: number | null
  ): PrintEditData => {
    const tableChanged = selectedTableId !== originalSale.table_id;
    const oldTableName = originalSale.table_name || undefined;
    const newTableName = selectedTableId ? `میز ${selectedTableId}` : undefined;

    const diffItems = calculateDiffItems(originalCartItems, cartItems);
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

    return {
      sale_id: saleId,
      sale_type: saleType,
      table_name: newTableName,
      items: diffItems,
      subtotal,
      total: subtotal,
      timestamp: new Date(),
      tableChanged,
      oldTableName,
      newTableName,
    };
  }, [calculateDiffItems]);

  const preparePrintAllData = useCallback((
    saleId: number,
    saleType: SaleType,
    cartItems: ICartItem[],
    selectedTableId: number | null,
    guestCount: number | null
  ): PrintSaleData => {
    const tableName = selectedTableId ? `میز ${selectedTableId}` : undefined;
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

    return {
      sale_id: saleId,
      sale_type: saleType,
      table_name: tableName,
      guest_count: guestCount || 0,
      items: cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        extras: item.extras.map((e) => ({
          name: e.name,
          quantity: e.quantity,
          unit_price: e.price,
          total: e.price * e.quantity,
        })),
      })),
      subtotal,
      total: subtotal,
      timestamp: new Date(),
    };
  }, []);

  const queueEditPrint = useCallback(async (data: PrintEditData, saleId: number) => {
    await queueEditReceipt(data, saleId);
  }, []);

  const queueFullPrint = useCallback(async (data: PrintSaleData, saleId: number) => {
    await queueReceipt(data, saleId);
  }, []);

  return {
    calculateDiffItems,
    preparePrintEditData,
    preparePrintAllData,
    queueEditPrint,
    queueFullPrint,
  };
}
