import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/libs/tools/time';

/**
 * Returns a Persian relative time string.
 * Updates internally every minute.
 */
export function useRelativeTime(openedAt: string): string {
  const calculate = () => {
    const opened = new Date(openedAt).getTime();
    const now = Date.now();
    const minutes = Math.floor((now - opened) / 60000);
    return formatRelativeTime(minutes);
  };

  const [value, setValue] = useState(calculate);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(calculate());
    }, 60_000);

    return () => clearInterval(interval);
  }, [openedAt]);

  return value;
}
