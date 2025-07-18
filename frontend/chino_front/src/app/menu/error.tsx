"use client";

import { useEffect } from "react";
import Image from "next/image";

export default function MenuError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Menu error:", error);
  }, [error]);

  return (
    <main
      className="flex flex-col items-center justify-center p-6 text-center min-h-[60vh]"
      aria-labelledby="menu-error-heading"
    >
      <Image
        src="/error-coffee.png"
        alt="خطای منو"
        width={100}
        height={100}
        className="mb-4"
      />

      <h2
        id="menu-error-heading"
        className="text-2xl font-semibold text-red-600 mb-4"
      >
        مشکلی پیش آمده 😓
      </h2>

      <p className="mb-6 text-gray-700 max-w-md">
        در بارگذاری منو مشکلی رخ داد. لطفاً اتصال خود را بررسی کنید و مجدداً
        تلاش کنید.
      </p>

      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
      >
        تلاش مجدد
      </button>
    </main>
  );
}
