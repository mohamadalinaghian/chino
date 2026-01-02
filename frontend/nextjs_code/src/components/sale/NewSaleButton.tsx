'use client';

import { useRouter } from 'next/navigation';

export function NewSaleButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/sale/new')}
      className="
        w-full rounded-lg py-2
        bg-indigo-600 text-white
        text-xs font-medium
        hover:bg-indigo-500 active:bg-indigo-700
        transition-all duration-150
        shadow-sm hover:shadow-md
        flex items-center justify-center gap-1.5
      "
    >
      <span className="text-sm">➕</span>
      <span>ایجاد فروش جدید</span>
    </button>
  );
}
