'use client';

import { THEME_COLORS } from '@/libs/constants';
import { GuestSelector } from '@/components/guest/GuestSelector';

interface GuestSectionProps {
  selectedGuestId: number | null;
  onGuestChange: (guestId: number | null) => void;
  guestCount: number | null;
  onGuestCountChange: (count: number | null) => void;
  onQuickCreate: (mobile?: string) => void;
}

export function GuestSection({
  selectedGuestId,
  onGuestChange,
  guestCount,
  onGuestCountChange,
  onQuickCreate,
}: GuestSectionProps) {
  return (
    <div
      className="p-2 rounded-lg"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <GuestSelector
            selectedGuestId={selectedGuestId}
            onGuestChange={onGuestChange}
            onQuickCreate={onQuickCreate}
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: THEME_COLORS.text }}
          >
            تعداد نفرات
          </label>
          <input
            type="number"
            min="1"
            max="99"
            value={guestCount ?? ''}
            onChange={(e) => onGuestCountChange(e.target.value ? Number(e.target.value) : null)}
            placeholder="تعداد..."
            className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: THEME_COLORS.bgPrimary,
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.text,
            }}
          />
        </div>
      </div>
    </div>
  );
}
