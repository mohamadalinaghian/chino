"use client";
import CoffeeSteamCard from "./CoffeeSteamCard";

export default function CoffeeEmojiCard() {
  return (
    <div className="relative animate-bounce">
      <span className="text-5xl z-10">☕️</span>
      <CoffeeSteamCard />
    </div>
  );
}
