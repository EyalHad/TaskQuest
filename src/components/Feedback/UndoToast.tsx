import { useStore } from "../../store";
import { Undo2 } from "lucide-react";

export function UndoToast() {
  const undoQuestId = useStore((s) => s.undoQuestId);
  const undoComplete = useStore((s) => s.undoComplete);
  const dismissUndo = useStore((s) => s.dismissUndo);

  if (!undoQuestId) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[350] flex items-center gap-3 px-4 py-3 bg-panel border border-default rounded-xl shadow-2xl animate-in">
      <span className="text-sm text-secondary">Quest completed</span>
      <button
        onClick={undoComplete}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-electric-blue bg-electric-blue/15 rounded-lg hover:bg-electric-blue/25 border border-electric-blue/20 transition-colors"
      >
        <Undo2 className="w-3.5 h-3.5" />
        Undo
      </button>
      <button
        onClick={dismissUndo}
        className="text-xs text-muted hover:text-secondary"
      >
        Dismiss
      </button>
    </div>
  );
}
