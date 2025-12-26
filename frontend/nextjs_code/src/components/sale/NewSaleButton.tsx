'use client';

import { useRouter } from 'next/navigation';

export function NewSaleButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/sale/new')}
      className="
        w-full rounded-xl py-3
        bg-gray-900 text-white
        text-sm font-medium
        hover:bg-gray-800 transition
      "
    >
      ایجاد فروش جدید
    </button>
  );
}
