/**
 * Loading state for new sale page
 * Displays skeleton while menu data loads
 */

export function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="h-8 bg-gray-800 rounded w-48 mb-6 animate-pulse"></div>

        {/* Type selector skeleton */}
        <div className="h-24 bg-gray-800 rounded-xl mb-8 animate-pulse"></div>

        {/* Menu sections skeleton */}
        <div className="space-y-8">
          {[1, 2].map((section) => (
            <div key={section}>
              <div className="h-8 bg-gray-800 rounded w-32 mb-4 animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-32 bg-gray-800 rounded-xl animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
