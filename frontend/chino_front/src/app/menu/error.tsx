"use client";

import { useEffect } from "react";

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
    <div className="flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      <h2 className="text-2xl font-semibold text-red-600 mb-4">
        مشکلی پیش آمده 😓
      </h2>
      <p className="mb-6 text-gray-700">
        در بارگذاری منو مشکلی رخ داد. لطفاً دوباره تلاش کنید.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
      >
        تلاش مجدد
      </button>
    </div>
  );
}
