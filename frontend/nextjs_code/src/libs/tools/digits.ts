/**
 * Normalize Persian and Arabic digits to English digits
 * This ensures search works consistently across inputs.
 */
export function normalizeDigits(input: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

  return input.replace(/[۰-۹٠-٩]/g, (char) => {
    const persianIndex = persianDigits.indexOf(char);
    if (persianIndex !== -1) return String(persianIndex);

    const arabicIndex = arabicDigits.indexOf(char);
    if (arabicIndex !== -1) return String(arabicIndex);

    return char;
  });
}
