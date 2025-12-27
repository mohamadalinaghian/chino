/**
 * Error state for new sale page
 * Displays error message with retry option
 */

interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2 text-red-400">خطا در بارگذاری</h2>
          <p className="text-gray-300 mb-4">{message}</p>
          <button
            onClick={onRetry}
            className="
              px-6 py-3 rounded-lg
              bg-indigo-600 hover:bg-indigo-500
              text-white font-medium
              transition-colors
            "
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    </div>
  );
}
