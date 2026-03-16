import { useEffect } from "react";
import { useStore } from "../../store";
import { Pause, Play, X } from "lucide-react";
import { cn } from "../../lib/utils";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PomodoroBar() {
  const pomodoroQuestId = useStore((s) => s.pomodoroQuestId);
  const pomodoroSecondsLeft = useStore((s) => s.pomodoroSecondsLeft);
  const pomodoroRunning = useStore((s) => s.pomodoroRunning);
  const quests = useStore((s) => s.quests);
  const tickPomodoro = useStore((s) => s.tickPomodoro);
  const pausePomodoro = useStore((s) => s.pausePomodoro);
  const resumePomodoro = useStore((s) => s.resumePomodoro);
  const cancelPomodoro = useStore((s) => s.cancelPomodoro);

  useEffect(() => {
    if (!pomodoroQuestId || !pomodoroRunning) return;
    const id = setInterval(tickPomodoro, 1000);
    return () => clearInterval(id);
  }, [pomodoroQuestId, pomodoroRunning, tickPomodoro]);

  if (!pomodoroQuestId) return null;

  const quest = quests.find((q) => q.id === pomodoroQuestId);
  const questName = quest?.questName ?? "Quest";

  return (
    <div className="shrink-0 flex items-center gap-4 px-5 py-3 bg-panel border-b border-default">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2 h-8 rounded-full bg-gold/60 animate-pulse" />
        <span className="text-sm font-medium text-primary truncate">{questName}</span>
      </div>
      <span className="text-lg font-bold text-gold tabular-nums min-w-[4rem]">
        {formatTime(pomodoroSecondsLeft)}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={pomodoroRunning ? pausePomodoro : resumePomodoro}
          className={cn(
            "p-2 rounded-lg transition-colors",
            "text-gold hover:bg-gold/10 hover:text-gold"
          )}
          aria-label={pomodoroRunning ? "Pause" : "Resume"}
        >
          {pomodoroRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={cancelPomodoro}
          className="p-2 rounded-lg text-secondary hover:text-crimson hover:bg-crimson/10 transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
