/**
 * usePaymentData Hook (FIXED)
 *
 * Responsibilities:
 * - Fetch sale details, bank accounts, POS account
 * - Handle loading and error states safely
 * - Avoid infinite fetch loops caused by unstable callbacks
 *
 * Design notes:
 * - onError is stored in a ref to avoid effect dependency loops
 * - loadData is stable and depends ONLY on saleId
 * - Guards prevent execution with invalid saleId
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSaleDetails, fetchBankAccounts } from '@/service/sale';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL, API_ENDPOINTS } from '@/libs/constants';
import type { SaleData, BankAccount, POSAccount } from '@/types/payment';

interface UsePaymentDataProps {
  saleId: number;
  onError: (message: string) => void;
}

interface UsePaymentDataReturn {
  sale: SaleData | null;
  bankAccounts: BankAccount[];
  posAccount: POSAccount | null;
  loading: boolean;
  refreshData: () => Promise<void>;
}

export function usePaymentData({
  saleId,
  onError,
}: UsePaymentDataProps): UsePaymentDataReturn {
  const [sale, setSale] = useState<SaleData | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [posAccount, setPosAccount] = useState<POSAccount | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Store onError in a ref to prevent dependency loops.
   * This allows the hook to call the latest callback
   * without re-triggering effects.
   */
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Core data loader.
   * Stable across renders unless saleId changes.
   */
  const loadData = useCallback(async () => {
    if (!saleId || saleId <= 0 || Number.isNaN(saleId)) {
      return;
    }

    setLoading(true);

    try {
      const [saleData, accounts, pos] = await Promise.all([
        fetchSaleDetails(saleId),
        fetchBankAccounts(),
        authenticatedFetchJSON<POSAccount>(
          `${CS_API_URL}${API_ENDPOINTS.POS_ACCOUNT}`
        ).catch(() => null), // POS account is optional
      ]);

      setSale({
        ...saleData,
        payments: saleData.payments ?? [],
      });

      setBankAccounts(accounts as BankAccount[]);
      setPosAccount(pos);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات';
      onErrorRef.current(message);
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  /**
   * Initial load + reload on saleId change only.
   */
  useEffect(() => {
    if (!saleId || saleId <= 0 || Number.isNaN(saleId)) {
      return;
    }

    loadData();
  }, [saleId, loadData]);

  return {
    sale,
    bankAccounts,
    posAccount,
    loading,
    refreshData: loadData,
  };
}
