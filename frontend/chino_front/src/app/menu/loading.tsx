export default function LoadingMenu() {
  return (
    <main className="max-w-screen-lg mx-auto px-4 sm:px-6 md:px-8 py-6 animate-pulse">
      <header className="mb-8 text-center">
        <div className="h-8 sm:h-10 md:h-12 w-1/2 mx-auto bg-gray-300 rounded" />
      </header>
      <div className="space-y-12">
        {[...Array(3)].map((_, idx) => (
          <section key={idx} className="space-y-4">
            <div className="h-6 w-32 bg-gray-300 rounded" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 sm:gap-6 border-b border-gray-200 py-4"
              >
                <div className="w-[96px] sm:w-[120px] aspect-square bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-gray-300 rounded" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/3 bg-gray-200 rounded" />
                  <div className="h-4 w-1/4 bg-gray-300 rounded mt-2" />
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
