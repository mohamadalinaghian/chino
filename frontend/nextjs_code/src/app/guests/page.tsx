'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { THEME_COLORS } from '@/libs/constants';
import { IGuest } from '@/types/guest';
import { listGuests, quickCreateGuest } from '@/service/guest';
import { GuestQuickCreateModal } from '@/components/guest/GuestQuickCreateModal';
import { useToast } from '@/components/common/Toast';
import { toPersianDigits } from '@/utils/persianUtils';
import { getCurrentJalaliDate } from '@/utils/persianUtils';

/**
 * Guest Management Page
 *
 * Features:
 * - List all registered guests
 * - Search by mobile number or name
 * - Quick-create new guests
 * - View guest statistics
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles guest list management
 * - Open/Closed: Extensible through service layer
 * - Dependency Inversion: Uses service layer for data access
 */
export default function GuestsPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  const [guests, setGuests] = useState<IGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    loadGuests();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadGuests(searchTerm);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const loadGuests = async (search?: string) => {
    try {
      setLoading(true);
      const response = await listGuests({
        search: search || undefined,
        limit: 100,
      });
      setGuests(response.guests);
      setTotalCount(response.total_count);
    } catch (error) {
      showToast('خطا در بارگذاری لیست مهمانان', 'error');
      console.error('Error loading guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCreated = (guest: IGuest) => {
    showToast(`مهمان "${guest.name}" با موفقیت ایجاد شد`, 'success');
    loadGuests(searchTerm);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: THEME_COLORS.bgPrimary }}
    >
      {/* Header */}
      <header
        className="p-4 border-b"
        style={{
          backgroundColor: THEME_COLORS.bgSecondary,
          borderColor: THEME_COLORS.border,
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/sale/dashboard')}
              className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90 border-2"
              style={{
                backgroundColor: 'transparent',
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.subtext,
              }}
            >
              ← بازگشت
            </button>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: THEME_COLORS.text }}
            >
              مدیریت مهمانان
            </h1>
          </div>
          <div style={{ color: THEME_COLORS.subtext }}>
            {getCurrentJalaliDate('dddd، jD jMMMM jYYYY')}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto p-4">
        {/* Search and Actions Bar */}
        <div
          className="p-4 rounded-lg mb-4"
          style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        >
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو بر اساس شماره موبایل یا نام..."
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: THEME_COLORS.bgPrimary,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.text,
                }}
              />
            </div>

            {/* Stats and Create Button */}
            <div className="flex items-center gap-3">
              <div
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: THEME_COLORS.surface,
                  color: THEME_COLORS.text,
                }}
              >
                تعداد: {toPersianDigits(totalCount)}
              </div>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90"
                style={{
                  backgroundColor: THEME_COLORS.green,
                  color: '#fff',
                }}
              >
                + مهمان جدید
              </button>
            </div>
          </div>
        </div>

        {/* Guest List */}
        {loading ? (
          <div
            className="p-8 rounded-lg text-center"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <div
              className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto"
              style={{
                borderColor: `${THEME_COLORS.accent} transparent transparent transparent`,
              }}
            />
            <p className="mt-4" style={{ color: THEME_COLORS.subtext }}>
              در حال بارگذاری...
            </p>
          </div>
        ) : guests.length === 0 ? (
          <div
            className="p-8 rounded-lg text-center"
            style={{ backgroundColor: THEME_COLORS.bgSecondary }}
          >
            <div className="text-4xl mb-3">👤</div>
            <p className="mb-2" style={{ color: THEME_COLORS.text }}>
              {searchTerm ? 'مهمانی یافت نشد' : 'هنوز مهمانی ثبت نشده است'}
            </p>
            <p className="text-sm" style={{ color: THEME_COLORS.subtext }}>
              {searchTerm
                ? 'لطفاً جستجوی دیگری امتحان کنید'
                : 'برای ایجاد مهمان جدید روی دکمه "مهمان جدید" کلیک کنید'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className="p-4 rounded-lg border transition-all hover:shadow-lg"
                style={{
                  backgroundColor: THEME_COLORS.bgSecondary,
                  borderColor: THEME_COLORS.border,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div
                      className="text-lg font-bold mb-1"
                      style={{ color: THEME_COLORS.text }}
                    >
                      {guest.name}
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: THEME_COLORS.subtext }}
                      dir="ltr"
                    >
                      {guest.mobile}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      guest.is_active ? '' : 'opacity-50'
                    }`}
                    style={{
                      backgroundColor: guest.is_active
                        ? `${THEME_COLORS.green}20`
                        : `${THEME_COLORS.red}20`,
                      color: guest.is_active
                        ? THEME_COLORS.green
                        : THEME_COLORS.red,
                    }}
                  >
                    {guest.is_active ? 'فعال' : 'غیرفعال'}
                  </div>
                </div>

                <div
                  className="text-xs pt-3 border-t"
                  style={{
                    borderColor: THEME_COLORS.border,
                    color: THEME_COLORS.subtext,
                  }}
                >
                  شناسه: {guest.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guest Quick-Create Modal */}
      <GuestQuickCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onGuestCreated={handleGuestCreated}
        initialMobile=""
      />

      <ToastContainer />
    </div>
  );
}
