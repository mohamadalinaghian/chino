'use client';

import { useRouter } from 'next/navigation';

export function NewSaleButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/sale/new')}
      className="
        w-full rounded-xl py-3.5
        bg-indigo-600 text-white
        text-sm font-medium
        hover:bg-indigo-500 active:bg-indigo-700
        transition-all duration-200
        shadow-md hover:shadow-lg
      "
    >
      ایجاد فروش جدید
    </button>
  );
}
