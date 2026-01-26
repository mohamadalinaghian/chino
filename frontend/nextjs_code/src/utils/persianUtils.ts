import moment from 'jalali-moment';

/**
 * Formats a number to Persian money representation
 * The input number is in thousands (هزار تومان)
 * Decimal parts represent sub-thousand amounts (tomans)
 *
 * Examples:
 * 0 -> "۰ تومان"
 * 17.5 -> "۱۷ هزار و ۵۰۰ تومان" (17.5 thousand = 17,500 tomans)
 * 17 -> "۱۷ هزار تومان"
 * 17000 -> "۱۷ میلیون تومان" (17000 thousand = 17 million)
 * 17175 -> "۱۷ میلیون و ۱۷۵ هزار تومان"
 * 17175.17 -> "۱۷ میلیون و ۱۷۵ هزار و ۱۷۰ تومان"
 * 0.5 -> "۵۰۰ تومان" (just 500 tomans, no هزار)
 */
export function formatPersianMoney(amount: number): string {
  if (amount === 0) return '۰ تومان';

  // Handle negative numbers
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const billion = Math.floor(absAmount / 1000000);
  const afterBillion = absAmount % 1000000;
  const million = Math.floor(afterBillion / 1000);
  const afterMillion = afterBillion % 1000;
  const thousand = Math.floor(afterMillion);

  // Handle decimal part - represents tomans (sub-thousand amounts)
  // Use toFixed to avoid floating point precision issues
  const decimalPart = absAmount - Math.floor(absAmount);
  const toman = Math.round(decimalPart * 1000);

  const parts: string[] = [];
  const formatter = new Intl.NumberFormat('fa-IR');

  if (billion > 0) {
    parts.push(`${formatter.format(billion)} میلیارد`);
  }

  if (million > 0) {
    parts.push(`${formatter.format(million)} میلیون`);
  }

  if (thousand > 0) {
    parts.push(`${formatter.format(thousand)} هزار`);
  }

  if (toman > 0) {
    parts.push(`${formatter.format(toman)}`);
  }

  if (parts.length === 0) {
    return '۰ تومان';
  }

  const result = parts.join(' و ');
  const prefix = isNegative ? '- ' : '';
  return `${prefix}${result} تومان`;
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
