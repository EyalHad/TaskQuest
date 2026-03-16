import { useStore } from "../../store";
import { Target, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export function DailyChallenges() {
  const dailyChallenges = useStore((s) => s.dailyChallenges);

  if (dailyChallenges.length === 0) return null;

  const allDone = dailyChallenges.every((c) => c.completed);

  return (
    <div className={cn("mx-4 mt-3 p-3 rounded-xl border transition-all", allDone ? "bg-emerald-glow/5 border-emerald-glow/20" : "bg-card/50 border-subtle")}>
      <div className="flex items-center gap-2 mb-2">
        <Target className={cn("w-4 h-4", allDone ? "text-emerald-glow" : "text-electric-blue")} />
        <span className="text-xs font-semibold text-secondary">Daily Challenges</span>
        <span className="text-[10px] text-muted ml-auto">
          {dailyChallenges.filter((c) => c.completed).length}/{dailyChallenges.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {dailyChallenges.map((c) => {
          const pct = c.target > 0 ? Math.min(100, Math.round((c.progress / c.target) * 100)) : 0;
          return (
            <div key={c.id} className="flex items-center gap-2">
              {c.completed ? (
                <Check className="w-3.5 h-3.5 text-emerald-glow shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-default shrink-0" />
              )}
              <span className={cn("text-[11px] flex-1 truncate", c.completed ? "text-emerald-glow/70 line-through" : "text-secondary")}>{c.description}</span>
              <div className="w-16 h-1.5 bg-default rounded-full overflow-hidden shrink-0">
                <div className={cn("h-full rounded-full transition-all duration-500", c.completed ? "bg-emerald-glow" : "bg-electric-blue")} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[9px] text-muted tabular-nums w-8 text-right">{c.progress}/{c.target}</span>
              {!c.completed && (
                <span className="text-[9px] text-gold">{c.rewardGold}g</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
