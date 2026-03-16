import { useEffect } from "react";
import { useStore } from "../store";
import { AlertCircle, X } from "lucide-react";

export function ErrorToast() {
  const error = useStore((s) => s.error);
  const clearError = useStore((s) => s.clearError);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 bg-crimson/15 border border-crimson/30 text-crimson px-4 py-3 rounded-xl shadow-lg max-w-sm animate-in backdrop-blur-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="text-sm flex-1">{error}</span>
      <button
        onClick={clearError}
        className="p-0.5 hover:bg-crimson/20 rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
