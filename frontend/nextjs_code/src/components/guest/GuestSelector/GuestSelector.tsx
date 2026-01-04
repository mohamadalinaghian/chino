'use client';

import { useState, useEffect, useRef } from 'react';
import { THEME_COLORS, UI_TEXT } from '@/libs/constants';
import { IGuest } from '@/types/guest';
import { getGuestById, searchGuestByMobile, listGuests } from '@/service/guest';
import { toPersianDigits } from '@/utils/persianUtils';

interface GuestSelectorProps {
  selectedGuestId: number | null;
  onGuestChange: (guestId: number | null) => void;
  onQuickCreate?: (mobile?: string) => void;
  disabled?: boolean;
}

/**
 * Guest Selector Component
 *
 * Features:
 * - Search by mobile number
 * - Auto-suggest from existing guests
 * - Quick-create button if not found
 * - Clear selection
 *
 * Design: SOLID principles
 * - Single Responsibility: Only handles guest selection
 * - Open/Closed: Extensible through props
 * - Dependency Inversion: Uses service layer
 */
export function GuestSelector({
  selectedGuestId,
  onGuestChange,
  onQuickCreate,
  disabled = false,
}: GuestSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [guests, setGuests] = useState<IGuest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<IGuest | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadSelectedGuest = async (guestId: number) => {
    try {
      setLoading(true);
      const guest = await getGuestById(guestId);
      setSelectedGuest(guest);
      setSearchTerm(guest.name);
      onGuestChange(guest.id);
    } catch (error) {
      console.error('Error loading selected guest:', error);
      // Guest not found or error - clear selection
      setSelectedGuest(null);
      setSearchTerm('');
    } finally {
      setLoading(false);
    }
  };

  // Load selected guest info when selectedGuestId changes
  useEffect(() => {
    if (selectedGuestId && (!selectedGuest || selectedGuest.id !== selectedGuestId)) {
      loadSelectedGuest(selectedGuestId);
    }
  }, [selectedGuestId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadGuestList = async (search?: string) => {
    try {
      setLoading(true);
      const response = await listGuests({ search, limit: 20 });
      setGuests(response.guests);
    } catch (error) {
      console.error('Error loading guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = async (value: string) => {
    setSearchTerm(value);
    setNotFound(false);

    if (!value.trim()) {
      setGuests([]);
      setShowDropdown(false);
      return;
    }

    // If looks like mobile number (starts with 09)
    if (value.startsWith('09') && value.length >= 3) {
      setShowDropdown(true);
      await loadGuestList(value);

      // If complete mobile number, try direct search
      if (value.length === 11) {
        try {
          const guest = await searchGuestByMobile(value);
          setGuests([guest]);
          setNotFound(false);
        } catch (error) {
          // Not found - show quick-create option
          setNotFound(true);
        }
      }
    } else {
      // Search by name
      setShowDropdown(true);
      await loadGuestList(value);
    }
  };

  const handleFocus = async () => {
    // Load initial guest list when focused
    if (!searchTerm && guests.length === 0) {
      setShowDropdown(true);
      await loadGuestList();
    } else if (searchTerm) {
      setShowDropdown(true);
    }
  };

  const handleSelectGuest = (guest: IGuest) => {
    setSelectedGuest(guest);
    setSearchTerm(guest.name);
    setShowDropdown(false);
    setNotFound(false);
    onGuestChange(guest.id);
  };

  const handleClearSelection = () => {
    setSelectedGuest(null);
    setSearchTerm('');
    setGuests([]);
    setNotFound(false);
    onGuestChange(null);
  };

  const handleQuickCreate = () => {
    setShowDropdown(false);
    // Pass the searched mobile number to the quick-create modal
    onQuickCreate?.(searchTerm.length === 11 ? searchTerm : undefined);
  };

  // Validate mobile number format
  const isValidMobile = (value: string): boolean => {
    if (!value) return true; // Empty is neutral
    if (!value.startsWith('09')) return false;
    if (value.length > 11) return false;
    if (!/^\d+$/.test(value)) return false;
    return true;
  };

  const mobileIsInvalid = searchTerm.length > 0 && searchTerm.startsWith('09') && !isValidMobile(searchTerm);

  return (
    <div ref={dropdownRef} className="relative">
      <label
        className="block text-sm font-medium mb-1"
        style={{ color: THEME_COLORS.text }}
      >
        مهمان
      </label>

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={handleFocus}
          placeholder="جستجو بر اساس شماره موبایل یا نام..."
          disabled={disabled}
          className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            backgroundColor: disabled ? THEME_COLORS.surface : THEME_COLORS.bgPrimary,
            borderColor: mobileIsInvalid ? THEME_COLORS.red : THEME_COLORS.border,
            color: mobileIsInvalid ? THEME_COLORS.red : THEME_COLORS.text,
          }}
        />

        {selectedGuest && (
          <button
            onClick={handleClearSelection}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-lg hover:scale-110 transition-transform"
            style={{ color: THEME_COLORS.red }}
            title="پاک کردن"
          >
            ✕
          </button>
        )}

        {loading && (
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2"
            style={{ color: THEME_COLORS.accent }}
          >
            <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full"
              style={{ borderColor: `${THEME_COLORS.accent} transparent transparent transparent` }}
            />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg border max-h-60 overflow-y-auto"
          style={{
            backgroundColor: THEME_COLORS.bgSecondary,
            borderColor: THEME_COLORS.border,
          }}
        >
          {guests.length > 0 ? (
            <div>
              {guests.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => handleSelectGuest(guest)}
                  className="w-full px-4 py-3 text-right hover:bg-opacity-80 transition-all border-b last:border-b-0"
                  style={{
                    backgroundColor: THEME_COLORS.bgSecondary,
                    borderColor: THEME_COLORS.border,
                  }}
                >
                  <div className="font-bold" style={{ color: THEME_COLORS.text }}>
                    {guest.name}
                  </div>
                  <div className="text-sm" style={{ color: THEME_COLORS.subtext }} dir="ltr">
                    {guest.mobile}
                  </div>
                </button>
              ))}
            </div>
          ) : notFound && searchTerm.length === 11 ? (
            <div className="p-4 text-center">
              <p className="mb-3" style={{ color: THEME_COLORS.subtext }}>
                مهمانی با این شماره موبایل یافت نشد
              </p>
              {onQuickCreate && (
                <button
                  onClick={handleQuickCreate}
                  className="px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
                  style={{
                    backgroundColor: THEME_COLORS.green,
                    color: '#fff',
                  }}
                >
                  + ایجاد سریع مهمان
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 text-center" style={{ color: THEME_COLORS.subtext }}>
              {searchTerm.length < 3
                ? 'حداقل 3 کاراکتر وارد کنید'
                : 'در حال جستجو...'}
            </div>
          )}
        </div>
      )}

      {selectedGuest && (
        <div className="mt-2 p-2 rounded-lg border" style={{
          backgroundColor: THEME_COLORS.bgPrimary,
          borderColor: THEME_COLORS.border,
        }}>
          <div className="text-xs" style={{ color: THEME_COLORS.subtext }}>
            مهمان انتخاب شده:
          </div>
          <div className="font-bold" style={{ color: THEME_COLORS.text }}>
            {selectedGuest.name}
          </div>
          <div className="text-sm" style={{ color: THEME_COLORS.subtext }} dir="ltr">
            {selectedGuest.mobile}
          </div>
        </div>
      )}
    </div>
  );
}
