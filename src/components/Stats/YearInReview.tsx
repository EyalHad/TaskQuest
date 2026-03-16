import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";
import { ChevronLeft, ChevronRight, Trophy, Zap, CalendarDays, Target, Flame, Award, Star } from "lucide-react";
import { cn } from "../../lib/utils";

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const start = ref.current;
    const diff = value - start;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

export function YearInReview() {
  const [year, setYear] = useState(new Date().getFullYear());
  const loadYearSummary = useStore((s) => s.loadYearSummary);
  const summary = useStore((s) => s.yearSummary);

  useEffect(() => {
    loadYearSummary(year);
  }, [year, loadYearSummary]);

  const stats = summary
    ? [
        { icon: Trophy, label: "Quests Completed", value: summary.totalQuests, color: "text-gold" },
        { icon: Zap, label: "XP Earned", value: summary.totalXp, color: "text-emerald-glow" },
        { icon: CalendarDays, label: "Active Days", value: summary.activeDays, color: "text-electric-blue" },
        { icon: Award, label: "Achievements", value: summary.achievementsCount, color: "text-neon-purple" },
      ]
    : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <Star className="w-5 h-5 text-gold" /> Year in Review
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1.5 rounded-lg hover:bg-card-hover text-secondary hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-primary min-w-[50px] text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1.5 rounded-lg hover:bg-card-hover text-secondary hover:text-primary transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {!summary ? (
          <div className="text-center py-12 text-muted text-sm">Loading...</div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {stats.map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="bg-card border border-subtle rounded-xl p-5 text-center page-enter"
                >
                  <Icon className={cn("w-8 h-8 mx-auto mb-2", color)} />
                  <p className={cn("text-3xl font-black tabular-nums", color)}>
                    <AnimatedNumber value={value} />
                  </p>
                  <p className="text-xs text-muted mt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summary.mostActiveSkill && (
                <div className="bg-card border border-subtle rounded-xl p-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-electric-blue shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Most Focused Skill</p>
                    <p className="text-sm font-bold text-primary">{summary.mostActiveSkill}</p>
                    <p className="text-[10px] text-muted">{summary.mostActiveSkillCount} quests</p>
                  </div>
                </div>
              )}
              {summary.bestDay && (
                <div className="bg-card border border-subtle rounded-xl p-4 flex items-center gap-3">
                  <Flame className="w-6 h-6 text-gold shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Best Day</p>
                    <p className="text-sm font-bold text-primary">
                      {new Date(summary.bestDay).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-[10px] text-muted">{summary.bestDayCount} quests</p>
                  </div>
                </div>
              )}
            </div>

            {summary.totalQuests === 0 && (
              <div className="text-center py-8 text-muted">
                <p className="text-sm">No activity recorded for {year}.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
