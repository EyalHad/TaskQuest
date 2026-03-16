import { useStore } from "../../store";
import { Heart, Coins, Zap, TrendingUp, Flame } from "lucide-react";
import { cn } from "../../lib/utils";

export function StatsBar() {
  const stats = useStore((s) => s.stats);

  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-panel border-b border-default shrink-0 flex-wrap">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-electric-blue" />
        <span className="text-sm font-bold text-electric-blue tabular-nums">
          Lv. {stats.currentLevel}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <Zap className="w-4 h-4 text-emerald-glow shrink-0" />
        {stats.xpBoostRemaining > 0 && (
          <span className="text-[9px] font-bold text-gold bg-gold/15 border border-gold/30 px-1.5 py-0.5 rounded-md shrink-0">2×</span>
        )}
        <div className="flex-1 h-2.5 rounded-full bg-card overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(stats.progressPercent, 100)}%`,
              background: "linear-gradient(90deg, #00FF66, #00CC52)",
            }}
          />
        </div>
        <span className="text-xs text-muted tabular-nums whitespace-nowrap">
          {stats.progressXp}/{stats.neededXp}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <Heart className="w-4 h-4 text-crimson shrink-0 hp-bar-icon" />
        <div className="flex-1 h-2.5 rounded-full bg-card overflow-hidden hp-bar">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${stats.maxHp > 0 ? (stats.hp / stats.maxHp) * 100 : 0}%`,
              background: "linear-gradient(90deg, #FF3366, #CC2952)",
            }}
          />
        </div>
        <span className="text-xs text-muted tabular-nums whitespace-nowrap">
          {stats.hp}/{stats.maxHp}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Coins className="w-4 h-4 text-gold" />
        <span className="text-sm font-bold text-gold tabular-nums">{stats.gold}</span>
      </div>

      {stats.currentStreak > 0 && (
        <div className="flex items-center gap-1.5">
          <Flame className={cn("w-4 h-4", stats.currentStreak >= 7 ? "text-gold streak-pulse" : "text-orange-400")} />
          <span className={cn("text-sm font-bold tabular-nums", stats.currentStreak >= 7 ? "text-gold" : "text-orange-400")}>
            {stats.currentStreak}
          </span>
        </div>
      )}
    </div>
  );
}
