'use client';

import { THEME_COLORS } from '@/libs/constants';

interface FloatingCartButtonProps {
  onClick: () => void;
  visible: boolean;
}

export function FloatingCartButton({ onClick, visible }: FloatingCartButtonProps) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 block lg:hidden w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl font-bold hover:scale-110 active:scale-95 transition-all duration-300 animate-pulse"
      style={{
        backgroundColor: THEME_COLORS.accent,
        color: '#fff',
        boxShadow: '0 10px 30px rgba(59, 130, 246, 0.5)',
      }}
      title="نمایش سبد خرید"
    >
      سبد
    </button>
  );
}
