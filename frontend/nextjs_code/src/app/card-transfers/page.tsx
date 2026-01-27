'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ICardTransferItem } from '@/types/cardTransfer';
import {
  fetchCardTransfers,
  confirmCardTransfer,
  unconfirmCardTransfer,
} from '@/service/cardTransferService';
import { THEME_COLORS } from '@/libs/constants';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useToast } from '@/components/common/Toast';
import { formatPersianMoney } from '@/utils/persianUtils';

type ConfirmedFilter = 'all' | 'confirmed' | 'unconfirmed';

export default function CardTransfersPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  const [transfers, setTransfers] = useState<ICardTransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmedFilter, setConfirmedFilter] = useState<ConfirmedFilter>('unconfirmed');

  // Stats
  const [totalCount, setTotalCount] = useState(0);
  const [unconfirmedCount, setUnconfirmedCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);

  useEffect(() => {
    loadTransfers();
  }, [confirmedFilter]);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      let confirmed: boolean | undefined;
      if (confirmedFilter === 'confirmed') confirmed = true;
      else if (confirmedFilter === 'unconfirmed') confirmed = false;

      const data = await fetchCardTransfers(confirmed);
      setTransfers(data.transfers);
      setTotalCount(data.total_count);
      setUnconfirmedCount(data.unconfirmed_count);
      setConfirmedCount(data.confirmed_count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در بارگذاری';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (transferId: number) => {
    if (!confirm('آیا از تایید این انتقال اطمینان دارید؟')) return;

    try {
      setActionLoading(transferId);
      const result = await confirmCardTransfer(transferId);
      showToast(result.message, 'success');
      await loadTransfers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در تایید';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnconfirm = async (transferId: number) => {
    if (!confirm('آیا از لغو تایید این انتقال اطمینان دارید؟')) return;

    try {
      setActionLoading(transferId);
      const result = await unconfirmCardTransfer(transferId);
      showToast(result.message, 'success');
      await loadTransfers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در لغو تایید';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const maskCardNumber = (cardNumber: string | null) => {
    if (!cardNumber) return '-';
    return `${cardNumber.slice(0, 4)}****${cardNumber.slice(-4)}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME_COLORS.bgPrimary }}>
      {/* Header */}
      <header
        className="px-4 py-4 border-b"
        style={{ backgroundColor: THEME_COLORS.bgSecondary, borderColor: THEME_COLORS.border }}
      >
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
            >
              ← بازگشت
            </button>
            <h1 className="text-2xl font-bold" style={{ color: THEME_COLORS.text }}>
              تایید انتقال‌های کارت به کارت
            </h1>
          </div>

          <button
            onClick={loadTransfers}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
          >
            {loading ? 'در حال بارگذاری...' : 'بروزرسانی'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
              کل انتقال‌ها
            </div>
            <div className="text-3xl font-bold" style={{ color: THEME_COLORS.accent }}>
              {totalCount}
            </div>
          </div>
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: `${THEME_COLORS.orange}15` }}
          >
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
              در انتظار تایید
            </div>
            <div className="text-3xl font-bold" style={{ color: THEME_COLORS.orange }}>
              {unconfirmedCount}
            </div>
          </div>
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: `${THEME_COLORS.green}15` }}
          >
            <div className="text-sm" style={{ color: THEME_COLORS.subtext }}>
              تایید شده
            </div>
            <div className="text-3xl font-bold" style={{ color: THEME_COLORS.green }}>
              {confirmedCount}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className="p-4 rounded-xl mb-6 flex items-center gap-4"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          <span className="font-medium" style={{ color: THEME_COLORS.text }}>
            فیلتر:
          </span>
          <div className="flex gap-2">
            {(
              [
                { value: 'all', label: 'همه' },
                { value: 'unconfirmed', label: 'در انتظار تایید' },
                { value: 'confirmed', label: 'تایید شده' },
              ] as { value: ConfirmedFilter; label: string }[]
            ).map((filter) => (
              <button
                key={filter.value}
                onClick={() => setConfirmedFilter(filter.value)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                style={{
                  backgroundColor:
                    confirmedFilter === filter.value ? THEME_COLORS.accent : THEME_COLORS.surface,
                  color: confirmedFilter === filter.value ? '#fff' : THEME_COLORS.text,
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div
              className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full"
              style={{ borderColor: `${THEME_COLORS.accent} transparent transparent transparent` }}
            />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            className="p-6 rounded-xl text-center"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <div className="text-4xl mb-3" style={{ color: THEME_COLORS.red }}>
              !
            </div>
            <p className="mb-4" style={{ color: THEME_COLORS.red }}>
              {error}
            </p>
            <button
              onClick={loadTransfers}
              className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: THEME_COLORS.accent, color: '#fff' }}
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {/* Transfers List */}
        {!loading && !error && (
          <>
            {transfers.length === 0 ? (
              <div
                className="p-12 rounded-xl text-center"
                style={{ backgroundColor: THEME_COLORS.bgSecondary }}
              >
                <div className="text-6xl mb-4 opacity-50">💳</div>
                <p className="text-xl font-semibold" style={{ color: THEME_COLORS.subtext }}>
                  انتقالی یافت نشد
                </p>
                <p className="text-sm mt-2" style={{ color: THEME_COLORS.subtext }}>
                  {confirmedFilter !== 'all'
                    ? 'فیلتر را تغییر دهید'
                    : 'هیچ انتقال کارت به کارتی ثبت نشده است'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="p-4 rounded-xl transition-all"
                    style={{
                      backgroundColor: THEME_COLORS.bgSecondary,
                      border: `2px solid ${transfer.confirmed ? THEME_COLORS.green : THEME_COLORS.orange}40`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      {/* Transfer Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
                            انتقال #{transfer.id}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold"
                            style={{
                              backgroundColor: transfer.confirmed
                                ? `${THEME_COLORS.green}20`
                                : `${THEME_COLORS.orange}20`,
                              color: transfer.confirmed ? THEME_COLORS.green : THEME_COLORS.orange,
                            }}
                          >
                            {transfer.confirmed ? '✓ تایید شده' : '○ در انتظار تایید'}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: `${THEME_COLORS.purple}20`,
                              color: THEME_COLORS.purple,
                            }}
                          >
                            فروش #{transfer.sale_id}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                              مبلغ
                            </div>
                            <div className="font-bold text-lg" style={{ color: THEME_COLORS.green }}>
                              {formatPersianMoney(transfer.amount_applied)}
                            </div>
                            {transfer.tip_amount > 0 && (
                              <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                                + انعام: {formatPersianMoney(transfer.tip_amount)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                              حساب مقصد
                            </div>
                            <div className="font-medium" style={{ color: THEME_COLORS.text }}>
                              {maskCardNumber(transfer.destination_card_number)}
                            </div>
                            <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                              {transfer.destination_account_owner || '-'}
                            </div>
                            {transfer.destination_bank_name && (
                              <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                                {transfer.destination_bank_name}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                              ثبت توسط
                            </div>
                            <div className="font-medium" style={{ color: THEME_COLORS.text }}>
                              {transfer.received_by_name}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                              تاریخ و ساعت
                            </div>
                            <div className="font-medium" style={{ color: THEME_COLORS.text }}>
                              {formatDateTime(transfer.received_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        {transfer.confirmed ? (
                          <button
                            onClick={() => handleUnconfirm(transfer.id)}
                            disabled={actionLoading === transfer.id}
                            className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: THEME_COLORS.red, color: '#fff' }}
                          >
                            {actionLoading === transfer.id ? '...' : 'لغو تایید'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConfirm(transfer.id)}
                            disabled={actionLoading === transfer.id}
                            className="px-6 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
                          >
                            {actionLoading === transfer.id ? '...' : 'تایید انتقال'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
