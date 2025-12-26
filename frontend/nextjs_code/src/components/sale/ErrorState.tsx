interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="rounded-xl bg-red-900/20 border border-red-800 p-5 text-sm text-red-400">
      <p className="mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="underline hover:text-red-300 transition-colors font-medium"
      >
        تلاش مجدد
      </button>
    </div>
  );
}
