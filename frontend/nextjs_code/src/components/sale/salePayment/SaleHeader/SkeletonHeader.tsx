export function SkeletonHeader({ THEME_COLORS }: { THEME_COLORS: any }) {
  return (
    <header
      className="px-5 py-4 border-b shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-opacity-90 animate-pulse"
      style={{
        backgroundColor: THEME_COLORS.bgSecondary,
        borderColor: THEME_COLORS.border,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-lg bg-gray-300/30 h-9 w-24" />
          <div className="h-8 w-48 bg-gray-300/30 rounded" />
        </div>
        <div className="flex gap-4 md:gap-6">
          <div className="px-4 py-2.5 rounded-xl min-w-[140px] bg-gray-300/30 h-10" />
          <div className="px-4 py-2.5 rounded-xl min-w-[140px] bg-gray-300/30 h-10" />
          <div className="px-4 py-2.5 rounded-xl min-w-[140px] bg-gray-300/30 h-10" />
        </div>
      </div>
    </header>
  );
}
