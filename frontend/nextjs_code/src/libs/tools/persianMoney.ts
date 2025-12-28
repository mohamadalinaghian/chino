/**
 * Persian Money Formatter - FIXED VERSION
 *
 * IMPORTANT: Your database stores prices WITHOUT the last 3 zeros
 * Example: Database has 234, but real price is 234,000 Tomans
 *
 * This formatter AUTOMATICALLY multiplies by 1000 before formatting
 *
 * Examples:
 * - DB: 234 → Display: "۲۳۴ هزار تومان" (234,000)
 * - DB: 34 → Display: "۳۴ هزار تومان" (34,000)
 * - DB: 1567 → Display: "۱ میلیون و ۵۶۷ هزار تومان" (1,567,000)
 */

/**
 * Convert English digits to Persian digits
 */
function toPersianDigits(num: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Format number in Persian money style
 * AUTOMATICALLY multiplies by 1000 (your DB stores without last 3 zeros)
 *
 * @param amount - Amount from DB (e.g., 234 means 234,000 Tomans)
 * @param usePersianDigits - Whether to use Persian digits (default: true)
 * @returns Formatted string (e.g., "۲۳۴ هزار تومان")
 */
export function formatPersianMoney(
  amount: number | string,
  usePersianDigits = true
): string {
  let num = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle invalid numbers
  if (isNaN(num) || num < 0) {
    return '0 تومان';
  }

  // CRITICAL FIX: Multiply by 1000 because DB stores without last 3 zeros
  num = num * 1000;

  // Handle zero
  if (num === 0) {
    return '0 تومان';
  }

  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);

  const parts: string[] = [];

  // Millions part
  if (millions > 0) {
    const millionStr = usePersianDigits
      ? toPersianDigits(millions)
      : millions.toLocaleString('fa-IR');
    parts.push(`${millionStr} میلیون`);
  }

  // Thousands part
  if (thousands > 0) {
    const thousandStr = usePersianDigits
      ? toPersianDigits(thousands)
      : thousands.toLocaleString('fa-IR');
    parts.push(`${thousandStr} هزار`);
  }

  // Join parts with "و" (and)
  let result = parts.join(' و ');

  // Add "تومان" at the end
  result += ' تومان';

  return result;
}

/**
 * Format number in short Persian style (for compact displays)
 * AUTOMATICALLY multiplies by 1000
 *
 * @param amount - Amount from DB
 * @param usePersianDigits - Whether to use Persian digits (default: true)
 * @returns Short formatted string (e.g., "۲۳۴ هزار")
 */
export function formatPersianMoneyShort(
  amount: number | string,
  usePersianDigits = true
): string {
  let num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num) || num < 0) {
    return '0';
  }

  // CRITICAL FIX: Multiply by 1000
  num = num * 1000;

  if (num === 0) {
    return '0';
  }

  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);

  if (millions > 0) {
    if (thousands > 0) {
      const millionStr = usePersianDigits
        ? toPersianDigits(millions)
        : millions.toLocaleString('fa-IR');
      const thousandStr = usePersianDigits
        ? toPersianDigits(thousands)
        : thousands.toLocaleString('fa-IR');
      return `${millionStr}م و ${thousandStr}هـ`;
    }
    const millionStr = usePersianDigits
      ? toPersianDigits(millions)
      : millions.toLocaleString('fa-IR');
    return `${millionStr} میلیون`;
  }

  if (thousands > 0) {
    const thousandStr = usePersianDigits
      ? toPersianDigits(thousands)
      : thousands.toLocaleString('fa-IR');
    return `${thousandStr} هزار`;
  }

  const numStr = usePersianDigits
    ? toPersianDigits(num)
    : num.toLocaleString('fa-IR');
  return numStr;
}

/**
 * Format as price badge (for UI components)
 * AUTOMATICALLY multiplies by 1000
 *
 * @param amount - Amount from DB
 * @returns Object with value and unit
 */
export function formatPriceBadge(
  amount: number | string,
  usePersianDigits = true
): { value: string; unit: string } {
  let num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num) || num < 0) {
    return { value: '0', unit: 'تومان' };
  }

  // CRITICAL FIX: Multiply by 1000
  num = num * 1000;

  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);

  if (millions > 0) {
    if (thousands > 0) {
      const millionStr = usePersianDigits
        ? toPersianDigits(millions)
        : millions.toLocaleString('fa-IR');
      const thousandStr = usePersianDigits
        ? toPersianDigits(thousands)
        : thousands.toLocaleString('fa-IR');
      return {
        value: `${millionStr}م و ${thousandStr}هـ`,
        unit: 'تومان',
      };
    }
    const millionStr = usePersianDigits
      ? toPersianDigits(millions)
      : millions.toLocaleString('fa-IR');
    return { value: millionStr, unit: 'میلیون تومان' };
  }

  if (thousands > 0) {
    const thousandStr = usePersianDigits
      ? toPersianDigits(thousands)
      : thousands.toLocaleString('fa-IR');
    return { value: thousandStr, unit: 'هزار تومان' };
  }

  const numStr = usePersianDigits
    ? toPersianDigits(num)
    : num.toLocaleString('fa-IR');
  return { value: numStr, unit: 'تومان' };
}

/**
 * Examples with FIXED multiplication:
 *
 * Database Value → Real Value → Display
 *
 * formatPersianMoney(234)
 * → 234 * 1000 = 234,000
 * → "۲۳۴ هزار تومان"
 *
 * formatPersianMoney(34)
 * → 34 * 1000 = 34,000
 * → "۳۴ هزار تومان"
 *
 * formatPersianMoney(1567)
 * → 1567 * 1000 = 1,567,000
 * → "۱ میلیون و ۵۶۷ هزار تومان"
 *
 * formatPersianMoney(2500)
 * → 2500 * 1000 = 2,500,000
 * → "۲ میلیون و ۵۰۰ هزار تومان"
 *
 * formatPersianMoney(1000)
 * → 1000 * 1000 = 1,000,000
 * → "۱ میلیون تومان"
 */
