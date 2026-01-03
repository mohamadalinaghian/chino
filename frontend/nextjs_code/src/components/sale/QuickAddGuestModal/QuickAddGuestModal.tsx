'use client';
import { useState } from 'react';
import { THEME_COLORS } from '@/libs/constants';

interface QuickAddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guestData: { first_name: string; last_name: string; phone?: string }) => Promise<void>;
}

export function QuickAddGuestModal({ isOpen, onClose, onSubmit }: QuickAddGuestModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('نام و نام خانوادگی الزامی است');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      // Reset form on success
      setFirstName('');
      setLastName('');
      setPhone('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد مهمان');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFirstName('');
      setLastName('');
      setPhone('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 shadow-2xl"
        style={{ backgroundColor: THEME_COLORS.bgSecondary }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: THEME_COLORS.text }}>
            افزودن سریع مهمان
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-2xl hover:scale-110 transition-transform"
            style={{ color: THEME_COLORS.subtext }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.text }}>
              نام <span style={{ color: THEME_COLORS.red }}>*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="نام مهمان..."
              disabled={submitting}
              className="w-full px-4 py-2 rounded-md border outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: THEME_COLORS.surface,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text,
              }}
              autoFocus
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.text }}>
              نام خانوادگی <span style={{ color: THEME_COLORS.red }}>*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="نام خانوادگی مهمان..."
              disabled={submitting}
              className="w-full px-4 py-2 rounded-md border outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: THEME_COLORS.surface,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text,
              }}
              required
            />
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.text }}>
              تلفن (اختیاری)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XX XXX XXXX"
              disabled={submitting}
              className="w-full px-4 py-2 rounded-md border outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: THEME_COLORS.surface,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text,
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="p-3 rounded-md text-sm"
              style={{
                backgroundColor: `${THEME_COLORS.red}20`,
                color: THEME_COLORS.red,
              }}
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 py-2 rounded-lg font-bold transition-all hover:opacity-90 border-2"
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
              disabled={submitting}
              className="flex-1 py-2 rounded-lg font-bold transition-all hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: THEME_COLORS.accent,
                color: '#fff',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'در حال ایجاد...' : 'ایجاد مهمان'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
