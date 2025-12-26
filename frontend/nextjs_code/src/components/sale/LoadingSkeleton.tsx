/**
 * Loading skeleton for sale grid
 * Displays placeholder cards while data is loading
 */

export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Individual skeleton card
 */
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm animate-pulse">
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded mb-3 w-2/3"></div>

      {/* Staff name */}
      <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>

      {/* Time */}
      <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>

      {/* Amount */}
      <div className="h-4 bg-gray-200 rounded w-1/2 mt-3"></div>
    </div>
  );
}
