'use client';

import { CATPPUCCIN_COLORS } from '@/libs/constants';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'در حال بارگذاری...' }: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div className="text-center">
        <div
          className="animate-spin w-16 h-16 border-4 border-t-transparent rounded-full mx-auto"
          style={{
            borderColor: `${CATPPUCCIN_COLORS.accent} transparent transparent transparent`,
          }}
        />
        <p
          className="mt-4 text-xl font-bold"
          style={{ color: CATPPUCCIN_COLORS.text }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
