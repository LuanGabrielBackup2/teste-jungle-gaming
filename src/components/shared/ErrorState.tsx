interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Algo deu errado.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <span className="text-4xl" aria-hidden="true">⚠</span>
      <p className="text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="outline-button px-6 py-2 text-xs font-bold"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
