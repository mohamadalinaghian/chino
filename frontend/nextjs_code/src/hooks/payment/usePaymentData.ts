/**
 * Payment Data Loading Hook
 * Handles fetching sale details and account information
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ISaleDetailResponse, IBankAccount } from '@/types/sale';
import { fetchSaleDetails, fetchBankAccounts } from '@/service/sale';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL, API_ENDPOINTS } from '@/libs/constants';
import { IPOSAccount, PaymentSnapshot, PaymentRecord } from './types';

interface UsePaymentDataOptions {
  saleId: number;
  onError?: (message: string) => void;
  onSaleLoaded?: (sale: ISaleDetailResponse) => void;
}

interface UsePaymentDataReturn {
  loading: boolean;
  sale: ISaleDetailResponse | null;
  bankAccounts: IBankAccount[];
  posAccount: IPOSAccount | null;
  snapshot: PaymentSnapshot | null;
  payments: PaymentRecord[];
  isViewOnly: boolean;
  loadSaleData: () => Promise<void>;
}

/**
 * Hook for loading and managing payment-related data
 * Handles sale details, bank accounts, and POS account
 */
export function usePaymentData({
  saleId,
  onError,
  onSaleLoaded,
}: UsePaymentDataOptions): UsePaymentDataReturn {
  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState<ISaleDetailResponse | null>(null);
  const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<IPOSAccount | null>(null);

  // Use refs for callbacks to avoid infinite loops
  // This is a common pattern to handle callback dependencies
  const onErrorRef = useRef(onError);
  const onSaleLoadedRef = useRef(onSaleLoaded);

  useEffect(() => {
    onErrorRef.current = onError;
    onSaleLoadedRef.current = onSaleLoaded;
  });

  // Track if initial load has happened
  const initialLoadDone = useRef(false);

  /**
   * Load sale details from API
   */
  const loadSaleData = useCallback(async () => {
    try {
      setLoading(true);
      const saleData = await fetchSaleDetails(saleId);
      setSale(saleData);
      onSaleLoadedRef.current?.(saleData);
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : 'خطا در بارگذاری فروش');
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  /**
   * Load bank accounts and POS account
   */
  const loadAccounts = useCallback(async () => {
    try {
      const [accounts, pos] = await Promise.all([
        fetchBankAccounts(),
        authenticatedFetchJSON<IPOSAccount>(`${CS_API_URL}${API_ENDPOINTS.POS_ACCOUNT}`).catch(() => null),
      ]);
      setBankAccounts(accounts);
      if (pos) setPosAccount(pos);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  }, []);

  // Initial data load - only runs once
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadSaleData();
      loadAccounts();
    }
  }, [loadSaleData, loadAccounts]);

  /**
   * Create frozen snapshot from sale data
   */
  const snapshot: PaymentSnapshot | null = useMemo(() => {
    if (!sale) return null;
    return {
      saleId: sale.id,
      totalAmount: sale.total_amount,
      taxAmount: sale.tax_amount,
      discountAmount: sale.discount_amount,
      subtotalAmount: sale.subtotal_amount,
      totalPaid: sale.total_paid,
      remainingDue: sale.balance_due,
      items: sale.items,
      isFullyPaid: sale.is_fully_paid,
      paymentStatus: sale.payment_status,
      saleState: sale.state,
    };
  }, [sale]);

  /**
   * Transform payment records for display
   */
  const payments: PaymentRecord[] = useMemo(() => {
    if (!sale?.payments) return [];
    return sale.payments.map(p => ({
      id: p.id,
      method: p.method,
      amount: p.amount_applied,
      tipAmount: p.tip_amount,
      receivedBy: p.received_by_name,
      receivedAt: p.received_at,
      status: p.status as 'ACTIVE' | 'VOID',
      accountInfo: p.destination_card_number
        ? `${p.destination_bank_name || ''} - ${p.destination_card_number}`.trim()
        : undefined,
    }));
  }, [sale]);

  /**
   * Check if payment page should be view-only
   */
  const isViewOnly = useMemo(() => {
    if (!snapshot) return false;
    return snapshot.isFullyPaid || snapshot.saleState === 'CANCELED';
  }, [snapshot]);

  return {
    loading,
    sale,
    bankAccounts,
    posAccount,
    snapshot,
    payments,
    isViewOnly,
    loadSaleData,
  };
}
