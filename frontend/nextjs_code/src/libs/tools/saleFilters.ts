import { normalizeDigits } from './digits';

export type TimeFilter = 'LT_30' | '30_90' | 'GT_90';

export function matchesSearch(
  sale: any,
  rawSearch: string
): boolean {
  if (!rawSearch) return true;

  const search = normalizeDigits(rawSearch.toLowerCase());

  const fields = [
    sale.table,
    sale.opened_by_name,
    sale.guest_name,
  ];

  return fields
    .filter(Boolean)
    .some((value: string) =>
      normalizeDigits(value.toLowerCase()).includes(search)
    );
}

export function matchesTimeFilter(
  openedAt: string,
  filter?: TimeFilter
): boolean {
  if (!filter) return true;

  const opened = new Date(openedAt).getTime();
  const now = Date.now();
  const minutes = Math.floor((now - opened) / 60000);

  if (filter === 'LT_30') return minutes < 30;
  if (filter === '30_90') return minutes >= 30 && minutes <= 90;
  if (filter === 'GT_90') return minutes > 90;

  return true;
}
