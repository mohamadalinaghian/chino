export default function CoffeeSteamCard() {
  return (
    <div className="absolute top-[-1.5rem] left-1/2 -translate-x-1/2 flex space-x-1 opacity-80">
      <div className="w-1 h-4 bg-gray-300 rounded-full animate-[steam_1.5s_infinite]" />
      <div className="w-1 h-5 bg-gray-200 rounded-full animate-[steam_1.8s_infinite]" />
      <div className="w-1 h-3 bg-gray-300 rounded-full animate-[steam_1.2s_infinite]" />
    </div>
  );
}
