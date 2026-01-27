'use client';

import { useState, useEffect, useRef } from 'react';
import { THEME_COLORS } from '@/libs/constants';
import jalaliMoment from 'jalali-moment';

interface JalaliDatePickerProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
}

/**
 * JalaliDatePicker
 * A date picker component that displays dates in Jalali (Persian) calendar
 * but stores them in Gregorian format for the backend
 */
export function JalaliDatePicker({
  value,
  onChange,
  label,
  error,
  touched,
  required,
  disabled = false,
}: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return value ? jalaliMoment(value) : jalaliMoment();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert Gregorian to Jalali for display
  const jalaliDate = value ? jalaliMoment(value).locale('fa') : null;
  const displayValue = jalaliDate ? jalaliDate.format('jYYYY/jMM/jDD') : '';

  // Persian day names
  const dayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // Persian month names
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate calendar days
  const generateCalendarDays = () => {
    const days: { date: jalaliMoment.Moment | null; isCurrentMonth: boolean }[] = [];

    // Start of month in Jalali
    const startOfMonth = currentMonth.clone().startOf('jMonth');
    const endOfMonth = currentMonth.clone().endOf('jMonth');

    // Get day of week for first day (Saturday = 0 in Jalali week)
    const startDayOfWeek = startOfMonth.day();
    // Convert to Saturday-based week (0 = Saturday)
    const adjustedStartDay = (startDayOfWeek + 1) % 7;

    // Add empty cells for days before the first
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    // Add days of the month
    const daysInMonth = currentMonth.jDaysInMonth();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = startOfMonth.clone().jDate(day);
      days.push({ date, isCurrentMonth: true });
    }

    return days;
  };

  const handleDayClick = (date: jalaliMoment.Moment) => {
    // Convert Jalali date to Gregorian ISO format
    const gregorianDate = date.format('YYYY-MM-DD');
    onChange(gregorianDate);
    setIsOpen(false);
  };

  const goToPrevMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'jMonth'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'jMonth'));
  };

  const goToToday = () => {
    const today = jalaliMoment();
    setCurrentMonth(today);
    onChange(today.format('YYYY-MM-DD'));
    setIsOpen(false);
  };

  const hasError = touched && error;

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: THEME_COLORS.text }}>
          📅 {label}
          {required && <span style={{ color: THEME_COLORS.red }}>*</span>}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-4 py-3 rounded-lg border outline-none transition-all text-right flex items-center justify-between"
          style={{
            backgroundColor: THEME_COLORS.surface,
            color: THEME_COLORS.text,
            borderColor: hasError ? THEME_COLORS.red : THEME_COLORS.border,
          }}
        >
          <span style={{ color: displayValue ? THEME_COLORS.text : THEME_COLORS.subtext }}>
            {displayValue || 'انتخاب تاریخ'}
          </span>
          <span>📅</span>
        </button>

        {/* Calendar Popup */}
        {isOpen && (
          <div
            className="absolute z-50 mt-2 p-4 rounded-xl shadow-xl border w-72"
            style={{
              backgroundColor: THEME_COLORS.bgSecondary,
              borderColor: THEME_COLORS.border,
              right: 0,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="p-2 rounded-lg hover:opacity-80 transition-all"
                style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
              >
                ←
              </button>
              <span className="font-bold" style={{ color: THEME_COLORS.text }}>
                {monthNames[currentMonth.jMonth()]} {currentMonth.jYear()}
              </span>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:opacity-80 transition-all"
                style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.text }}
              >
                →
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium py-1"
                  style={{ color: THEME_COLORS.subtext }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((day, index) => {
                if (!day.date) {
                  return <div key={`empty-${index}`} className="p-2" />;
                }

                const isSelected = value && day.date.format('YYYY-MM-DD') === value;
                const isToday = day.date.format('YYYY-MM-DD') === jalaliMoment().format('YYYY-MM-DD');

                return (
                  <button
                    key={day.date.format('YYYY-MM-DD')}
                    type="button"
                    onClick={() => handleDayClick(day.date!)}
                    className="p-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                    style={{
                      backgroundColor: isSelected
                        ? THEME_COLORS.accent
                        : isToday
                          ? `${THEME_COLORS.accent}30`
                          : 'transparent',
                      color: isSelected
                        ? '#fff'
                        : isToday
                          ? THEME_COLORS.accent
                          : THEME_COLORS.text,
                    }}
                  >
                    {day.date.jDate()}
                  </button>
                );
              })}
            </div>

            {/* Today Button */}
            <button
              type="button"
              onClick={goToToday}
              className="w-full mt-3 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-80"
              style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.accent }}
            >
              امروز
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <p className="text-xs" style={{ color: THEME_COLORS.red }}>
          {error}
        </p>
      )}
    </div>
  );
}
