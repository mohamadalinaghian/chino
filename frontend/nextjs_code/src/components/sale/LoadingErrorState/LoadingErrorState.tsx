'use client';

import { THEME_COLORS, UI_TEXT } from '@/libs/constants';

interface LoadingErrorStateProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function LoadingErrorState({ loading, error, onRetry }: LoadingErrorStateProps) {
  if (loading) {
    return (
      <div
        className="p-6 rounded-lg text-center"
        style={{ backgroundColor: THEME_COLORS.bgSecondary }}
      >
        <div
          className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto"
          style={{
            borderColor: `${THEME_COLORS.accent} transparent transparent transparent`,
          }}
        />
        <p className="mt-4" style={{ color: THEME_COLORS.subtext }}>
          {UI_TEXT.MSG_LOADING_MENU}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ backgroundColor: THEME_COLORS.bgSecondary }}
      >
        <div
          className="text-4xl mb-3"
          style={{ color: THEME_COLORS.red }}
        >
          !
        </div>
        <p className="mb-4" style={{ color: THEME_COLORS.red }}>
          {error}
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
          style={{
            backgroundColor: THEME_COLORS.accent,
            color: '#fff',
          }}
        >
          {UI_TEXT.BTN_RETRY}
        </button>
      </div>
    );
  }

  return null;
}
