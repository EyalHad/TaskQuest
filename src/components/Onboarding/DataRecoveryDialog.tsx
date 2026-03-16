import { useState } from "react";
import { Shield, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  onRestore: () => void;
  onFresh: () => void;
}

export function DataRecoveryDialog({ onRestore, onFresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmFresh, setConfirmFresh] = useState(false);

  const handleFresh = async () => {
    if (!confirmFresh) {
      setConfirmFresh(true);
      return;
    }
    setLoading(true);
    onFresh();
  };

  const handleRestore = () => {
    setLoading(true);
    onRestore();
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-frame-bg">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-frame-border shadow-2xl shadow-black/40 overflow-hidden animate-in">
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-electric-blue" style={{ filter: "drop-shadow(0 0 10px rgba(0,229,255,0.5))" }} />
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="text-electric-blue">TASK</span>
              <span className="text-primary">QUEST</span>
            </h1>
          </div>
          <p className="text-sm text-secondary font-medium mb-1">Previous adventure data found!</p>
          <p className="text-xs text-muted">Would you like to continue where you left off or start a new journey?</p>
        </div>

        <div className="px-6 pb-8 space-y-3">
          <button
            onClick={handleRestore}
            disabled={loading}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
              "border-electric-blue/30 bg-electric-blue/5 hover:bg-electric-blue/10 hover:border-electric-blue/50",
              loading && "opacity-50 pointer-events-none"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-electric-blue/15 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-electric-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Restore Previous Data</p>
              <p className="text-xs text-muted mt-0.5">Continue with your existing heroes, skills, and quests</p>
            </div>
          </button>

          <button
            onClick={handleFresh}
            disabled={loading}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
              confirmFresh
                ? "border-crimson/50 bg-crimson/10 hover:bg-crimson/15"
                : "border-subtle bg-card hover:bg-card/80 hover:border-default",
              loading && "opacity-50 pointer-events-none"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              confirmFresh ? "bg-crimson/15" : "bg-card"
            )}>
              <Sparkles className={cn("w-5 h-5", confirmFresh ? "text-crimson" : "text-secondary")} />
            </div>
            <div>
              <p className={cn("text-sm font-semibold", confirmFresh ? "text-crimson" : "text-primary")}>
                {confirmFresh ? "Confirm: Erase & Start Fresh" : "Start Fresh"}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {confirmFresh
                  ? "This will permanently delete all previous data"
                  : "Delete old data and begin a brand new adventure"}
              </p>
            </div>
          </button>

          {confirmFresh && (
            <button
              onClick={() => setConfirmFresh(false)}
              className="w-full text-xs text-muted hover:text-secondary py-1 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
