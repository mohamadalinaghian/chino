/**
 * Jalali (Persian/Shamsi) date formatting utilities
 *
 * Converts Gregorian dates to Persian calendar for display in UI
 */

import moment from 'jalali-moment';

/**
 * Format a date string or Date object to Persian calendar format
 *
 * @param date - ISO date string, Date object, or timestamp
 * @param format - Output format (default: 'jYYYY/jMM/jDD HH:mm')
 * @returns Formatted Persian date string
 *
 * Common format patterns:
 * - jYYYY: 4-digit Jalali year
 * - jMM: 2-digit Jalali month
 * - jDD: 2-digit Jalali day
 * - HH: Hours (24-hour)
 * - mm: Minutes
 * - ss: Seconds
 *
 * @example
 * formatJalali('2025-01-15T10:30:00') // '1403/10/26 10:30'
 * formatJalali(new Date(), 'jYYYY/jMM/jDD') // '1403/10/26'
 */
export function formatJalali(
  date: string | Date | number,
  format: string = 'jYYYY/jMM/jDD HH:mm'
): string {
  return moment(date).locale('fa').format(format);
}

/**
 * Format a date to Persian short format (date only, no time)
 *
 * @param date - ISO date string, Date object, or timestamp
 * @returns Formatted Persian date string (YYYY/MM/DD)
 *
 * @example
 * formatJalaliDate('2025-01-15T10:30:00') // '1403/10/26'
 */
export function formatJalaliDate(date: string | Date | number): string {
  return formatJalali(date, 'jYYYY/jMM/jDD');
}

/**
 * Format a date to Persian time only
 *
 * @param date - ISO date string, Date object, or timestamp
 * @returns Formatted time string (HH:mm)
 *
 * @example
 * formatJalaliTime('2025-01-15T10:30:00') // '10:30'
 */
export function formatJalaliTime(date: string | Date | number): string {
  return moment(date).format('HH:mm');
}

/**
 * Format a date to Persian datetime with weekday name
 *
 * @param date - ISO date string, Date object, or timestamp
 * @returns Formatted Persian datetime with weekday
 *
 * @example
 * formatJalaliLong('2025-01-15T10:30:00')
 * // 'سه‌شنبه، 26 دی 1403 ساعت 10:30'
 */
export function formatJalaliLong(date: string | Date | number): string {
  return moment(date)
    .locale('fa')
    .format('dddd، jD jMMMM jYYYY ساعت HH:mm');
}

/**
 * Get relative time in Persian (e.g., "2 روز پیش")
 *
 * @param date - ISO date string, Date object, or timestamp
 * @returns Persian relative time string
 *
 * @example
 * formatJalaliRelative(Date.now() - 3600000) // '1 ساعت پیش'
 * formatJalaliRelative(Date.now() - 86400000 * 2) // '2 روز پیش'
 */
export function formatJalaliRelative(date: string | Date | number): string {
  return moment(date).locale('fa').fromNow();
}

/**
 * Convert Jalali date to Gregorian ISO string
 * Useful for sending dates to backend
 *
 * @param year - Jalali year
 * @param month - Jalali month (1-12)
 * @param day - Jalali day (1-31)
 * @returns ISO 8601 date string
 *
 * @example
 * jalaliToGregorian(1403, 10, 26) // '2025-01-15T00:00:00.000Z'
 */
export function jalaliToGregorian(
  year: number,
  month: number,
  day: number
): string {
  return moment(`${year}/${month}/${day}`, 'jYYYY/jM/jD').toISOString();
}

/**
 * Get current Jalali date components
 *
 * @returns Object with year, month, and day in Jalali calendar
 *
 * @example
 * getCurrentJalali() // { year: 1403, month: 10, day: 26 }
 */
export function getCurrentJalali(): { year: number; month: number; day: number } {
  const now = moment().locale('fa');
  return {
    year: now.jYear(),
    month: now.jMonth() + 1, // moment.js months are 0-indexed
    day: now.jDate(),
  };
}
