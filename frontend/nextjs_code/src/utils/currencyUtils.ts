/**
 * Currency formatting utilities
 */

/**
 * Format a number as currency in Persian/Iranian Rial
 * @param amount - The amount to format
 * @param showCurrency - Whether to show the currency symbol
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, showCurrency: boolean = true): string {
  const formatted = new Intl.NumberFormat('fa-IR').format(amount);
  return showCurrency ? `${formatted} ریال` : formatted;
}

/**
 * Format a number as currency in Toman
 * @param amount - The amount in Rial to format
 * @returns Formatted currency string in Toman
 */
export function formatToman(amount: number): string {
  const toman = amount / 10;
  const formatted = new Intl.NumberFormat('fa-IR').format(toman);
  return `${formatted} تومان`;
}
