/**
 * Convert elapsed minutes into Persian relative time string.
 * No Date mutation. Pure function.
 */
export function formatRelativeTime(minutes: number): string {
  if (minutes < 1) return 'همین حالا';

  if (minutes < 60) {
    return `${minutes} دقیقه پیش`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ساعت پیش`;
  }

  return `${hours} ساعت و ${remainingMinutes} دقیقه پیش`;
}
