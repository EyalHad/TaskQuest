import { useEffect } from "react";
import { useStore } from "../../store";
import { X } from "lucide-react";

const SHORTCUTS: { key: string; description: string }[] = [
  { key: "N", description: "New Quest (Quick Capture)" },
  { key: "1", description: "Quest Board" },
  { key: "2", description: "Hero Status" },
  { key: "3", description: "Skill Catalog" },
  { key: "4", description: "Shop" },
  { key: "5", description: "Stats" },
  { key: "6", description: "Settings" },
  { key: "7", description: "Calendar" },
  { key: "8", description: "Habits" },
  { key: "9", description: "Journal" },
  { key: "0", description: "Equipment" },
  { key: "Esc", description: "Close modal / overlay" },
  { key: "F", description: "Focus Mode (first active quest)" },
  { key: "P", description: "Start / Pause Pomodoro" },
  { key: "C", description: "Quest Chains" },
  { key: "B", description: "Skill Bank" },
  { key: "Ctrl+Shift+Q", description: "Quick Capture" },
  { key: "?", description: "This Help" },
];

export function ShortcutHelp() {
  const shortcutHelpOpen = useStore((s) => s.shortcutHelpOpen);
  const setShortcutHelp = useStore((s) => s.setShortcutHelp);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShortcutHelp(false);
    };
    if (shortcutHelpOpen) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [shortcutHelpOpen, setShortcutHelp]);

  if (!shortcutHelpOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setShortcutHelp(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="bg-card border border-default rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-default">
          <h2 className="text-lg font-bold text-primary">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShortcutHelp(false)}
            className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-card-hover transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
          {SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="contents">
              <kbd className="px-2.5 py-1 rounded-md bg-panel border border-subtle text-sm font-mono text-primary">
                {key}
              </kbd>
              <span className="text-sm text-secondary">{description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
