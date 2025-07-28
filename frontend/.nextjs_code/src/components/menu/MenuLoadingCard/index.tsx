"use client";

import CoffeeEmojiCard from "./CoffeeEmojiCard";
import LoadingMessageCard from "./LoadingMessageCard";
import SpinnerCard from "./SpinnerCard";

export default function MenuLoadingCard() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 p-6">
      <CoffeeEmojiCard />
      <LoadingMessageCard />
      <SpinnerCard />

      <style jsx global>{`
        @keyframes steam {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-1.5rem) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
