import { useStore } from "../../store";
import { MILESTONES } from "../../lib/milestones";
import { getAchievementProgress } from "../../lib/achievement-progress";
import { Lock, Trophy, Award } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";
import { cn } from "../../lib/utils";

const RARITY: Record<string, { label: string; border: string; glow: string; bg: string }> = {
  legendary: { label: "Legendary", border: "border-gold/60", glow: "shadow-[0_0_20px_rgba(255,215,0,0.3)]", bg: "bg-gold/10" },
  epic: { label: "Epic", border: "border-neon-purple/50", glow: "shadow-[0_0_15px_rgba(176,38,255,0.2)]", bg: "bg-neon-purple/10" },
  rare: { label: "Rare", border: "border-electric-blue/40", glow: "shadow-[0_0_12px_rgba(0,229,255,0.15)]", bg: "bg-electric-blue/5" },
  common: { label: "Common", border: "border-secondary", glow: "", bg: "bg-card/50" },
};

function getRarity(key: string): string {
  if (["streak_30", "quest_500", "xp_10000", "gold_1000", "first_prestige"].includes(key)) return "legendary";
  if (["streak_7", "quest_100", "first_boss", "bounty_hunter", "chain_master"].includes(key)) return "epic";
  if (["quest_10", "xp_1000", "gold_hoarder", "first_level10_skill", "habitual"].includes(key)) return "rare";
  return "common";
}

export function AchievementShowcase() {
  const achievements = useStore((s) => s.achievements);
  const stats = useStore((s) => s.stats);
  const unlockedKeys = new Set(achievements.map((a) => a.key));
  const unlocked = MILESTONES.filter((m) => unlockedKeys.has(m.key));
  const locked = MILESTONES.filter((m) => !unlockedKeys.has(m.key));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold" /> Trophy Room
        </h1>
        <span className="text-sm text-secondary">{unlocked.length}/{MILESTONES.length} Unlocked</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {unlocked.length === 0 && (
          <EmptyState icon={Award} title="No achievements yet" subtitle="Complete quests, build streaks, and level up to unlock trophies." />
        )}
        {unlocked.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">Unlocked</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {unlocked.map((m) => {
                const r = RARITY[getRarity(m.key)] || RARITY.common;
                const ach = achievements.find((a) => a.key === m.key);
                return (
                  <div key={m.key} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border transition-all", r.border, r.glow, r.bg)}>
                    <span className="text-3xl">{m.icon}</span>
                    <span className="text-xs font-bold text-primary text-center">{m.title}</span>
                    <span className="text-[10px] text-secondary text-center leading-tight">{m.description}</span>
                    <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      getRarity(m.key) === "legendary" ? "text-gold bg-gold/20" :
                      getRarity(m.key) === "epic" ? "text-neon-purple bg-neon-purple/20" :
                      getRarity(m.key) === "rare" ? "text-electric-blue bg-electric-blue/20" :
                      "text-muted bg-default"
                    )}>{r.label}</span>
                    {ach && <span className="text-[9px] text-muted">{new Date(ach.unlockedAt).toLocaleDateString()}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {locked.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Locked</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {locked.map((m) => (
                <div key={m.key} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-subtle bg-card/30 opacity-50">
                  <Lock className="w-8 h-8 text-muted" />
                  <span className="text-xs font-medium text-muted text-center">{m.title}</span>
                  <span className="text-[10px] text-muted text-center leading-tight">{m.description}</span>
                  {(() => {
                    const progress = getAchievementProgress(m.key, stats);
                    if (!progress) return null;
                    const pct = progress.target > 0 ? Math.round((progress.current / progress.target) * 100) : 0;
                    return (
                      <div className="mt-2">
                        <div className="h-1 rounded-full bg-default overflow-hidden">
                          <div className="h-full rounded-full bg-electric-blue/50 transition-all duration-300"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] text-muted tabular-nums mt-0.5 block">{progress.current}/{progress.target}</span>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
