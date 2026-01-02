import moment from 'jalali-moment';

/**
 * Formats a number to Persian money representation
 * Examples:
 * 1 -> "1 هزار تومان"
 * 342 -> "342 هزار تومان"
 * 1547 -> "1 میلیون و 547 هزار تومان"
 * 2000000 -> "2 میلیارد تومان"
 */
export function formatPersianMoney(amount: number): string {
  if (amount === 0) return '0 تومان';

  const billion = Math.floor(amount / 1000000);
  const million = Math.floor((amount % 1000000) / 1000);
  const thousand = amount % 1000;

  const parts: string[] = [];

  if (billion > 0) {
    parts.push(`${new Intl.NumberFormat('fa-IR').format(billion)} میلیارد`);
  }

  if (million > 0) {
    parts.push(`${new Intl.NumberFormat('fa-IR').format(million)} میلیون`);
  }

  if (thousand > 0) {
    parts.push(`${new Intl.NumberFormat('fa-IR').format(thousand)} هزار`);
  }

  return `${parts.join(' و ')} تومان`;
}

/**
 * Formats a number to Persian digit representation
 * Example: 1234 -> "۱۲۳۴"
 */
export function toPersianDigits(num: number | string): string {
  return new Intl.NumberFormat('fa-IR').format(Number(num));
}

/**
 * Converts English digits to Persian digits
 * Example: "123" -> "۱۲۳"
 */
export function convertToPersianDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Converts Persian digits to English digits
 * Example: "۱۲۳" -> "123"
 */
export function convertToEnglishDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let result = str;
  persianDigits.forEach((persianDigit, index) => {
    result = result.replace(new RegExp(persianDigit, 'g'), index.toString());
  });
  return result;
}

/**
 * Formats a date to Persian/Jalali format
 * @param date - Date string or Date object
 * @param format - Jalali moment format (default: 'jYYYY/jMM/jDD')
 */
export function formatJalaliDate(
  date: string | Date,
  format: string = 'jYYYY/jMM/jDD'
): string {
  return moment(date).locale('fa').format(format);
}

/**
 * Formats a date to Persian date with time
 * Example: "۱۴۰۴/۱۰/۱۳ - ۱۴:۳۰"
 */
export function formatJalaliDateTime(date: string | Date): string {
  return moment(date).locale('fa').format('jYYYY/jMM/jDD - HH:mm');
}

/**
 * Gets current Jalali date
 */
export function getCurrentJalaliDate(format: string = 'jYYYY/jMM/jDD'): string {
  return moment().locale('fa').format(format);
}

/**
 * Gets current Jalali date and time
 */
export function getCurrentJalaliDateTime(): string {
  return moment().locale('fa').format('jYYYY/jMM/jDD - HH:mm:ss');
}

/**
 * Converts a Jalali date to Gregorian
 */
export function jalaliToGregorian(jalaliDate: string): Date {
  return moment(jalaliDate, 'jYYYY/jMM/jDD').toDate();
}

/**
 * Gets relative time in Persian
 * Example: "۵ دقیقه پیش", "۲ ساعت پیش"
 */
export function getRelativeTime(date: string | Date): string {
  return moment(date).locale('fa').fromNow();
}
