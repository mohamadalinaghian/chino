// app/menu/loading.tsx
export default function LoadingMenu() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="animate-bounce">
        <span className="text-5xl">☕️</span>
      </div>

      <p className="text-lg text-brown-800 font-semibold">
        در حال دم کردن منوی کافه چینو...
      </p>

      <div className="w-12 h-12 border-4 border-brown-500 border-t-transparent rounded-full animate-spin" />
    </main>
  );
}
