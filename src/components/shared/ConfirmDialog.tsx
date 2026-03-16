import { cn } from "../../lib/utils";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", variant = "danger", onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-[401] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
        <div className="bg-panel border border-default rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg shrink-0", isDanger ? "bg-crimson/10" : "bg-gold/10")}>
              <AlertTriangle className={cn("w-5 h-5", isDanger ? "text-crimson" : "text-gold")} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">{title}</h3>
              <p className="text-xs text-secondary mt-1">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-secondary hover:text-primary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all border",
                isDanger
                  ? "bg-crimson/20 text-crimson border-crimson/30 hover:bg-crimson/30"
                  : "bg-gold/20 text-gold border-gold/30 hover:bg-gold/30"
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
