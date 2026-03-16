import { useState, useEffect } from "react";
import { useStore } from "../../store";
import { SkillTree } from "../SkillTree/SkillTree";
import {
  Heart,
  Coins,
  Zap,
  Award,
  Swords,
  Flame,
  Shield,
  Snowflake,
  Trophy,
  Lock,
  LayoutGrid,
  TreePine,
  BarChart3,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Skeleton } from "../shared/Skeleton";
import { MILESTONES } from "../../lib/milestones";
import { format, startOfMonth, endOfMonth } from "date-fns";

export type HeroLayoutPreset = "full" | "tree" | "stats";

const LAYOUT_STORAGE_KEY = "heroStatusLayout";

function StatTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Heart;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-card border border-subtle rounded-xl px-4 py-3">
      <Icon className={cn("w-5 h-5", color)} />
      <div>
        <p className="text-[11px] text-muted uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-primary tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function SkillRadarMini({ skills }: { skills: { name: string; level: number }[] }) {
  if (skills.length === 0) return null;
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const maxLevel = 20;
  const radius = 45;
  const n = skills.length;
  const angleStep = (2 * Math.PI) / n;
  const points = skills.map((s, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (Math.min(s.level, maxLevel) / maxLevel) * radius;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-32">
      <polygon
        points={points}
        fill="rgba(0, 229, 255, 0.15)"
        stroke="#00E5FF"
        strokeWidth="1"
      />
    </svg>
  );
}

export function HeroStatus() {
  const stats = useStore((s) => s.stats);
  const achievements = useStore((s) => s.achievements);
  const skills = useStore((s) => s.skills);
  const getActivitySummary = useStore((s) => s.getActivitySummary);
  const openSkillBank = useStore((s) => s.openSkillBank);
  const activeProfileId = useStore((s) => s.activeProfileId);

  const [layout, setLayout] = useState<HeroLayoutPreset>("full");
  const [monthSummary, setMonthSummary] = useState<{ quests: number; xp: number } | null>(null);

  useEffect(() => {
    if (!activeProfileId) return;
    const stored = localStorage.getItem(`${LAYOUT_STORAGE_KEY}_${activeProfileId}`) as HeroLayoutPreset | null;
    if (stored && ["full", "tree", "stats"].includes(stored)) {
      setLayout(stored);
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (!activeProfileId) return;
    const now = new Date();
    const from = format(startOfMonth(now), "yyyy-MM-dd");
    const to = format(endOfMonth(now), "yyyy-MM-dd");
    getActivitySummary(from, to).then((data) => {
      const quests = data.reduce((s, d) => s + d.questCount, 0);
      const xp = data.reduce((s, d) => s + d.xpEarned, 0);
      setMonthSummary({ quests, xp });
    });
  }, [activeProfileId, getActivitySummary]);

  const unlockedKeys = new Set(achievements.map((a) => a.key));
  const leafSkills = skills.filter(
    (s) => !skills.some((other) => other.parentSkillId === s.id)
  );

  const saveLayout = (preset: HeroLayoutPreset) => {
    setLayout(preset);
    if (activeProfileId) {
      localStorage.setItem(`${LAYOUT_STORAGE_KEY}_${activeProfileId}`, preset);
    }
  };

  const isFull = layout === "full";
  const isTree = layout === "tree";
  const isStats = layout === "stats";

  const initialized = useStore((s) => s.initialized);
  if (!initialized) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-5 py-4 border-b border-default bg-panel">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-5 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-primary">Hero Status</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => saveLayout("full")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isFull ? "bg-default text-electric-blue" : "text-muted hover:text-secondary"
            )}
            title="Full layout"
            aria-label="Full layout"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => saveLayout("tree")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isTree ? "bg-default text-electric-blue" : "text-muted hover:text-secondary"
            )}
            title="Tree-focused"
            aria-label="Tree-focused layout"
          >
            <TreePine className="w-4 h-4" />
          </button>
          <button
            onClick={() => saveLayout("stats")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isStats ? "bg-default text-electric-blue" : "text-muted hover:text-secondary"
            )}
            title="Stats-focused"
            aria-label="Stats-focused layout"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={openSkillBank}
            className="text-xs text-electric-blue hover:text-electric-blue/80 transition-colors px-3 py-1.5 rounded-lg border border-electric-blue/20 hover:bg-electric-blue/10"
          >
            Manage Skills
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 space-y-5">
          {stats.isBurnout && (
            <div className="bg-crimson/10 border border-crimson/30 rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
              <Heart className="w-5 h-5 text-crimson" />
              <div>
                <p className="text-sm font-semibold text-crimson">Burnout!</p>
                <p className="text-xs text-secondary">XP and Gold earned are halved. Complete quests or use a potion to recover.</p>
              </div>
            </div>
          )}
          {/* Stat tiles - compact in tree mode */}
          <div
            className={cn(
              "grid gap-3",
              isTree ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"
            )}
          >
            <StatTile icon={Award} label="Level" value={stats.currentLevel} color="text-electric-blue" />
            <StatTile icon={Zap} label="Total XP" value={stats.totalXp} color="text-emerald-glow" />
            <StatTile icon={Heart} label="HP"
              value={stats.isBurnout ? "BURNOUT" : `${stats.hp}/${stats.maxHp}`}
              color={stats.isBurnout ? "text-crimson animate-pulse" : "text-crimson"} />
            <StatTile icon={Coins} label="Gold" value={stats.gold} color="text-gold" />
          </div>

          {(isFull || isStats) && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile icon={Swords} label="Completed" value={stats.questsCompleted} color="text-neon-purple" />
              <StatTile
                icon={Flame}
                label="Streak"
                value={stats.currentStreak}
                color={stats.currentStreak >= 7 ? "text-gold" : "text-orange-400"}
              />
              <StatTile icon={Flame} label="Best Streak" value={stats.longestStreak} color="text-neon-purple" />
              <StatTile icon={Snowflake} label="Freezes" value={stats.streakFreezeCount} color="text-electric-blue" />
              {stats.xpBoostRemaining > 0 && (
                <StatTile icon={Shield} label="XP Boost" value={`${stats.xpBoostRemaining} left`} color="text-gold" />
              )}
              {stats.skillBoostId && stats.skillBoostExpires && (
                <StatTile icon={Zap} label="Skill Boost" value={`${stats.skillBoostMult}× XP`} color="text-neon-purple" />
              )}
            </div>
          )}

          {/* XP Progress */}
          <div className="bg-card border border-subtle rounded-xl p-4">
            <div className="flex justify-between text-xs text-secondary mb-2">
              <span>Level {stats.currentLevel} Progress</span>
              <span className="tabular-nums">
                {stats.progressXp} / {stats.neededXp} XP
              </span>
            </div>
            <div className="h-3 rounded-full bg-default overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(stats.progressPercent, 100)}%`,
                  background: "linear-gradient(90deg, #00FF66, #00CC52)",
                }}
              />
            </div>
          </div>

          {/* Monthly summary card */}
          {(isFull || isStats) && (
            <div className="bg-card border border-subtle rounded-xl p-4">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                This Month
              </h3>
              <div className="flex gap-6">
                <span className="text-lg font-bold text-primary tabular-nums">
                  {monthSummary?.quests ?? 0} quests
                </span>
                <span className="text-lg font-bold text-emerald-glow tabular-nums">
                  +{monthSummary?.xp ?? 0} XP
                </span>
              </div>
            </div>
          )}

          {/* Achievements */}
          {(isFull || isStats) && (
            <div>
              <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold" />
                Achievements
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {MILESTONES.map((m) => {
                  const unlocked = unlockedKeys.has(m.key);
                  return (
                    <div
                      key={m.key}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                        unlocked
                          ? "bg-gold/5 border-gold/30 shadow-[0_0_12px_rgba(255,215,0,0.15)]"
                          : "bg-card/50 border-subtle opacity-60"
                      )}
                    >
                      {unlocked ? (
                        <span className="text-2xl">{m.icon}</span>
                      ) : (
                        <Lock className="w-6 h-6 text-muted" />
                      )}
                      <span
                        className={cn(
                          "text-[10px] font-medium text-center truncate max-w-full px-1",
                          unlocked ? "text-primary" : "text-muted"
                        )}
                      >
                        {m.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats-focused: radar chart */}
          {isStats && leafSkills.length > 0 && (
            <div className="bg-card border border-subtle rounded-xl p-4">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
                Skill Radar
              </h3>
              <SkillRadarMini skills={leafSkills} />
            </div>
          )}

          {/* Skill Tree */}
          <div className={cn(isTree && "flex-1 min-h-0")}>
            <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
              Skill Tree
            </h2>
            {!isTree && (
              <p className="text-[11px] text-muted mb-3">
                Click a category to collapse. Click any skill to see its quests and add new ones inline.
              </p>
            )}
            <SkillTree />
          </div>
        </div>
      </div>
    </div>
  );
}
