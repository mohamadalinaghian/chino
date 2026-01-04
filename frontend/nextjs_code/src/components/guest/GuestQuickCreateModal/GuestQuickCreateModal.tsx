'use client';

import { useState, useEffect } from 'react';
import { THEME_COLORS } from '@/libs/constants';
import { IGuest } from '@/types/guest';
import { quickCreateGuest } from '@/service/guest';
import { toPersianDigits } from '@/utils/persianUtils';

interface GuestQuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestCreated: (guest: IGuest) => void;
  initialMobile?: string;
}

/**
 * Guest Quick-Create Modal
 *
 * Allows staff to quickly create a guest account with:
 * - Mobile number (auto-validated)
 * - Guest name
 *
 * Design:
 * - Simple, fast workflow
 * - Clear validation feedback
 * - Auto-focus for quick entry
 */
export function GuestQuickCreateModal({
  isOpen,
  onClose,
  onGuestCreated,
  initialMobile = '',
}: GuestQuickCreateModalProps) {
  const [mobile, setMobile] = useState(initialMobile);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMobile(initialMobile);
      setName('');
      setError(null);
    }
  }, [isOpen, initialMobile]);

  const validateMobile = (value: string): boolean => {
    if (!value.startsWith('09')) {
      setError('شماره موبایل باید با 09 شروع شود');
      return false;
    }
    if (value.length !== 11) {
      setError('شماره موبایل باید 11 رقم باشد');
      return false;
    }
    if (!/^\d+$/.test(value)) {
      setError('شماره موبایل فقط باید شامل اعداد باشد');
      return false;
    }
    return true;
  };

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setError('نام مهمان الزامی است');
      return false;
    }
    if (value.trim().length < 2) {
      setError('نام باید حداقل 2 کاراکتر باشد');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!validateMobile(mobile)) return;
    if (!validateName(name)) return;

    try {
      setLoading(true);
      const guest = await quickCreateGuest({
        mobile: mobile.trim(),
        name: name.trim(),
      });

      // Success - call parent callback
      onGuestCreated(guest);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        // Check for specific error messages
        if (err.message.includes('already exists')) {
          setError('این شماره موبایل قبلاً ثبت شده است');
        } else {
          setError(err.message || 'خطا در ایجاد مهمان');
        }
      } else {
        setError('خطا در ایجاد مهمان');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMobileChange = (value: string) => {
    // Only allow digits and max 11 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    setMobile(cleaned);
    setError(null);
  };

  // Validate mobile number format for styling
  const isValidMobileFormat = (value: string): boolean => {
    if (!value) return true; // Empty is neutral
    if (!value.startsWith('09')) return false;
    if (value.length > 11) return false;
    if (!/^\d+$/.test(value)) return false;
    return true;
  };

  const mobileIsInvalid = mobile.length > 0 && !isValidMobileFormat(mobile);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg shadow-2xl p-6"
        style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: THEME_COLORS.text }}>
            ایجاد سریع مهمان
          </h2>
          <button
            onClick={onClose}
            className="text-2xl hover:scale-110 transition-transform"
            style={{ color: THEME_COLORS.subtext }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mobile Number */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: THEME_COLORS.text }}
            >
              شماره موبایل *
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => handleMobileChange(e.target.value)}
              placeholder="09123456789"
              disabled={loading}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: THEME_COLORS.bgPrimary,
                borderColor: mobileIsInvalid ? THEME_COLORS.red : THEME_COLORS.border,
                color: mobileIsInvalid ? THEME_COLORS.red : THEME_COLORS.text,
              }}
              dir="ltr"
            />
            <p className="text-xs mt-1" style={{ color: THEME_COLORS.subtext }}>
              شماره موبایل باید 11 رقم و با 09 شروع شود
            </p>
          </div>

          {/* Guest Name */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: THEME_COLORS.text }}
            >
              نام مهمان *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="نام کامل مهمان را وارد کنید"
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: THEME_COLORS.bgPrimary,
                borderColor: error && mobile ? THEME_COLORS.red : THEME_COLORS.border,
                color: THEME_COLORS.text,
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: THEME_COLORS.red,
                color: THEME_COLORS.red,
              }}
            >
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg font-bold border-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: 'transparent',
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.subtext,
              }}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading || !mobile || !name}
              className="flex-1 px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: THEME_COLORS.green,
                color: '#fff',
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
                    style={{ borderColor: '#fff transparent transparent transparent' }}
                  />
                  در حال ایجاد...
                </div>
              ) : (
                '✓ ایجاد مهمان'
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div
          className="mt-4 p-3 rounded-lg text-xs"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: THEME_COLORS.accent,
          }}
        >
          ℹ️ این حساب فقط برای ردیابی مهمان ایجاد می‌شود و نیازی به رمز عبور ندارد.
        </div>
      </div>
    </div>
  );
}
