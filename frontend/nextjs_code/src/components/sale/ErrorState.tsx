interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
      <p>{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 underline"
      >
        تلاش مجدد
      </button>
    </div>
  );
}
