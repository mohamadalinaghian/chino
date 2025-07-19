"use client";
import { useMemo } from "react";

export default function LoadingMessageCard() {
  const phrases = useMemo(
    () => [
      "در حال دم کردن منو با V60 ...",
      "لطفاً صبر کن تا اسپرسو آماده شه...",
      "کمی صبر کن، طعم عالی در راهه!",
      "قهوه کمکس در حال آماده شدنه...",
    ],
    [],
  );

  const message = phrases[Math.floor(Math.random() * phrases.length)];

  return (
    <p className="text-lg text-brown-800 font-semibold font-[IranYekan]">
      {message}
    </p>
  );
}
