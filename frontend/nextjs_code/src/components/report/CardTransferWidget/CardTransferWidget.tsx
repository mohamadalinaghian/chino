'use client';

import { useState, useEffect, useMemo } from 'react';
import { THEME_COLORS } from '@/libs/constants';
import { formatPersianMoney } from '@/utils/persianUtils';
import { fetchCardTransfers, confirmCardTransfer, bulkConfirmCardTransfers } from '@/service/cardTransferService';
import { ICardTransferListItem } from '@/types/cardTransfer';
import jalaliMoment from 'jalali-moment';

interface CardTransferWidgetProps {
  onTotalChange: (total: number) => void;
  reportDate?: string;
}

type FilterOption = 'all' | 'unconfirmed' | 'confirmed';

/**
 * CardTransferWidget
 * Widget for viewing and confirming card transfers in report creation page
 */
export function CardTransferWidget({
  onTotalChange,
  reportDate,
}: CardTransferWidgetProps) {
  const [transfers, setTransfers] = useState<ICardTransferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterOption>('unconfirmed');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Load card transfers
  const loadTransfers = async () => {
    try {
      setLoading(true);
      const data = await fetchCardTransfers(undefined, 100);
      setTransfers(data.transfers);
    } catch (error) {
      console.error('Error loading transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  // Calculate confirmed total and notify parent
  useEffect(() => {
    const confirmedTotal = transfers
      .filter(t => t.confirmed)
      .reduce((sum, t) => sum + t.amount, 0);
    onTotalChange(confirmedTotal);
  }, [transfers, onTotalChange]);

  // Filter transfers based on selection
  const filteredTransfers = useMemo(() => {
    let result = transfers;

    // Filter by confirmation status
    if (filter === 'confirmed') {
      result = result.filter(t => t.confirmed);
    } else if (filter === 'unconfirmed') {
      result = result.filter(t => !t.confirmed);
    }

    // Optionally filter by report date
    if (reportDate) {
      const reportDay = jalaliMoment(reportDate).startOf('day');
      result = result.filter(t => {
        const transferDay = jalaliMoment(t.received_at).startOf('day');
        return transferDay.isSame(reportDay);
      });
    }

    return result;
  }, [transfers, filter, reportDate]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredTransfers.length;
    const confirmed = filteredTransfers.filter(t => t.confirmed).length;
    const unconfirmed = total - confirmed;
    const confirmedAmount = filteredTransfers
      .filter(t => t.confirmed)
      .reduce((sum, t) => sum + t.amount, 0);
    const unconfirmedAmount = filteredTransfers
      .filter(t => !t.confirmed)
      .reduce((sum, t) => sum + t.amount, 0);
    return { total, confirmed, unconfirmed, confirmedAmount, unconfirmedAmount };
  }, [filteredTransfers]);

  // Handle single confirm
  const handleConfirm = async (transferId: number) => {
    try {
      setActionLoading(transferId);
      await confirmCardTransfer(transferId);
      setTransfers(prev => prev.map(t =>
        t.id === transferId ? { ...t, confirmed: true } : t
      ));
    } catch (error) {
      console.error('Error confirming transfer:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle bulk confirm
  const handleBulkConfirm = async () => {
    const unconfirmedIds = filteredTransfers
      .filter(t => !t.confirmed)
      .map(t => t.id);

    if (unconfirmedIds.length === 0) return;

    try {
      setActionLoading(-1); // -1 indicates bulk action
      await bulkConfirmCardTransfers(unconfirmedIds);
      setTransfers(prev => prev.map(t =>
        unconfirmedIds.includes(t.id) ? { ...t, confirmed: true } : t
      ));
    } catch (error) {
      console.error('Error bulk confirming transfers:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Format date in Jalali
  const formatDate = (dateStr: string) => {
    return jalaliMoment(dateStr).locale('fa').format('jMM/jDD HH:mm');
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: THEME_COLORS.border }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <h3 className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
                کارت به کارت‌ها
              </h3>
              <p className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                تایید واریزی‌های کارت به کارت
              </p>
            </div>
          </div>
          <button
            onClick={loadTransfers}
            disabled={loading}
            className="p-2 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
          >
            {loading ? '...' : '🔄'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: `${THEME_COLORS.green}15` }}
        >
          <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>تایید شده</div>
          <div className="font-bold" style={{ color: THEME_COLORS.green }}>
            {formatPersianMoney(stats.confirmedAmount)}
          </div>
          <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
            ({stats.confirmed} مورد)
          </div>
        </div>
        <div
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: `${THEME_COLORS.orange}15` }}
        >
          <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>در انتظار</div>
          <div className="font-bold" style={{ color: THEME_COLORS.orange }}>
            {formatPersianMoney(stats.unconfirmedAmount)}
          </div>
          <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
            ({stats.unconfirmed} مورد)
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pb-2 flex gap-2">
        {(['all', 'unconfirmed', 'confirmed'] as FilterOption[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: filter === opt ? THEME_COLORS.accent : THEME_COLORS.surface,
              color: filter === opt ? '#fff' : THEME_COLORS.text,
            }}
          >
            {opt === 'all' ? 'همه' : opt === 'unconfirmed' ? 'در انتظار' : 'تایید شده'}
          </button>
        ))}
      </div>

      {/* Bulk Confirm Button */}
      {stats.unconfirmed > 0 && filter !== 'confirmed' && (
        <div className="px-4 py-2">
          <button
            onClick={handleBulkConfirm}
            disabled={actionLoading !== null}
            className="w-full py-2 rounded-lg font-medium text-sm transition-all hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
          >
            {actionLoading === -1 ? 'در حال تایید...' : `تایید همه (${stats.unconfirmed} مورد)`}
          </button>
        </div>
      )}

      {/* Transfers List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center" style={{ color: THEME_COLORS.subtext }}>
            در حال بارگذاری...
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="p-8 text-center" style={{ color: THEME_COLORS.subtext }}>
            موردی یافت نشد
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: THEME_COLORS.border }}>
            {filteredTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="px-4 py-3 flex items-center justify-between"
                style={{
                  backgroundColor: transfer.confirmed ? `${THEME_COLORS.green}08` : 'transparent',
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: THEME_COLORS.green }}>
                      {formatPersianMoney(transfer.amount)}
                    </span>
                    {transfer.confirmed && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${THEME_COLORS.green}20`, color: THEME_COLORS.green }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
                    {transfer.destination_account_owner} • {transfer.destination_card_number?.slice(-4)}****
                  </div>
                  <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
                    {transfer.received_by_name} • {formatDate(transfer.received_at)}
                  </div>
                </div>
                {!transfer.confirmed && (
                  <button
                    onClick={() => handleConfirm(transfer.id)}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: THEME_COLORS.green, color: '#fff' }}
                  >
                    {actionLoading === transfer.id ? '...' : 'تایید'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
