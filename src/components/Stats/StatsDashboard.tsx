import { useEffect, useState, useMemo } from "react";
import { useStore } from "../../store";
import { ArrowLeft, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import type { DaySummary, WeeklyReport } from "../../types";
import { subDays, format, parseISO } from "date-fns";

export function StatsDashboard() {
  const setPage = useStore((s) => s.setPage);
  const getActivitySummary = useStore((s) => s.getActivitySummary);
  const getWeeklyReport = useStore((s) => s.getWeeklyReport);
  const quests = useStore((s) => s.quests);
  const archivedQuests = useStore((s) => s.archivedQuests);
  const skills = useStore((s) => s.skills);

  const [activity30, setActivity30] = useState<DaySummary[]>([]);
  const [activity365, setActivity365] = useState<DaySummary[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    const today = new Date();
    const from30 = format(subDays(today, 30), "yyyy-MM-dd");
    const to30 = format(today, "yyyy-MM-dd");
    getActivitySummary(from30, to30).then(setActivity30);
  }, [getActivitySummary]);

  useEffect(() => {
    const today = new Date();
    const from365 = format(subDays(today, 365), "yyyy-MM-dd");
    const to365 = format(today, "yyyy-MM-dd");
    getActivitySummary(from365, to365).then(setActivity365);
  }, [getActivitySummary]);

  useEffect(() => {
    getWeeklyReport().then(setWeeklyReport);
  }, [getWeeklyReport]);

  const estimationData = useMemo(() => {
    const withEstimates = quests.filter(q => q.completed && q.estimatedMinutes && q.timeSpentSeconds > 0);
    if (withEstimates.length === 0) return null;
    const ratios = withEstimates.map(q => q.timeSpentSeconds / 60 / q.estimatedMinutes!);
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const accuracy = Math.max(0, Math.round((1 - Math.abs(1 - avgRatio)) * 100));
    const overEstimated = ratios.filter(r => r < 0.8).length;
    const underEstimated = ratios.filter(r => r > 1.2).length;
    const accurate = withEstimates.length - overEstimated - underEstimated;
    return { accuracy, total: withEstimates.length, overEstimated, underEstimated, accurate };
  }, [quests]);

  const allCompleted = [...quests.filter((q) => q.completed), ...archivedQuests.filter((q) => q.completed)];
  const completedByType = {
    daily: allCompleted.filter((q) => q.questType === "daily").length,
    weekly: allCompleted.filter((q) => q.questType === "weekly").length,
    monthly: allCompleted.filter((q) => q.questType === "monthly").length,
  };
  const totalCompleted = completedByType.daily + completedByType.weekly + completedByType.monthly;

  const leafSkills = skills.filter(
    (s) => !skills.some((other) => other.parentSkillId === s.id)
  );

  const bestDay = activity365.length
    ? activity365.reduce((a, b) => (b.questCount > a.questCount ? b : a), activity365[0])
    : null;
  const worstDay = activity365.length
    ? activity365.reduce((a, b) => (b.questCount < a.questCount ? b : a), activity365[0])
    : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center gap-3">
        <button
          onClick={() => setPage("quests")}
          className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-card-hover transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-primary">Stats Dashboard</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* XP Over Time */}
        <section className="bg-card border border-subtle rounded-xl p-4">
          <h2 className="text-sm font-semibold text-primary mb-4">XP Over Time (30 days)</h2>
          <XpLineChart data={activity30} />
        </section>

        {/* Completion Rate by Type */}
        <section className="bg-card border border-subtle rounded-xl p-4">
          <h2 className="text-sm font-semibold text-primary mb-4">Completion Rate by Type</h2>
          <DonutChart
            daily={completedByType.daily}
            weekly={completedByType.weekly}
            monthly={completedByType.monthly}
            total={totalCompleted}
          />
        </section>

        {/* Skill Radar Chart */}
        <section className="bg-card border border-subtle rounded-xl p-4">
          <h2 className="text-sm font-semibold text-primary mb-4">Skill Radar</h2>
          <SkillRadarChart skills={leafSkills} />
        </section>

        {/* Activity Heatmap */}
        <section className="bg-card border border-subtle rounded-xl p-4">
          <h2 className="text-sm font-semibold text-primary mb-4">Activity Heatmap (365 days)</h2>
          <ActivityHeatmap data={activity365} />
        </section>

        {/* Estimation Accuracy */}
        {estimationData && (
          <div className="bg-card border border-subtle rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-electric-blue" />
              <span className="text-xs font-semibold text-secondary">Estimation Accuracy</span>
            </div>
            <p className={cn("text-2xl font-black tabular-nums",
              estimationData.accuracy >= 70 ? "text-emerald-glow" :
              estimationData.accuracy >= 40 ? "text-gold" : "text-crimson"
            )}>{estimationData.accuracy}%</p>
            <p className="text-[10px] text-muted mt-1">{estimationData.total} quests with estimates</p>
            <div className="flex gap-3 mt-2">
              <span className="text-[10px] text-emerald-glow">✅ {estimationData.accurate} accurate</span>
              <span className="text-[10px] text-electric-blue">⬆️ {estimationData.overEstimated} over</span>
              <span className="text-[10px] text-crimson">⬇️ {estimationData.underEstimated} under</span>
            </div>
          </div>
        )}

        {/* Best / Worst Day */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-subtle rounded-xl p-4">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Best Day</h3>
            {bestDay ? (
              <>
                <p className="text-2xl font-bold text-emerald-glow tabular-nums">{bestDay.questCount}</p>
                <p className="text-xs text-muted mt-1">{format(parseISO(bestDay.date), "MMM d, yyyy")}</p>
                <p className="text-xs text-secondary mt-0.5">+{bestDay.xpEarned} XP</p>
              </>
            ) : (
              <p className="text-muted text-sm">No data</p>
            )}
          </div>
          <div className="bg-card border border-subtle rounded-xl p-4">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Worst Day</h3>
            {worstDay ? (
              <>
                <p className="text-2xl font-bold text-secondary tabular-nums">{worstDay.questCount}</p>
                <p className="text-xs text-muted mt-1">{format(parseISO(worstDay.date), "MMM d, yyyy")}</p>
                <p className="text-xs text-secondary mt-0.5">+{worstDay.xpEarned} XP</p>
              </>
            ) : (
              <p className="text-muted text-sm">No data</p>
            )}
          </div>
        </div>

        {/* Weekly Report */}
        <section className="bg-card border border-subtle rounded-xl p-4">
          <h2 className="text-sm font-semibold text-primary mb-4">Weekly Report</h2>
          <WeeklyReportCard report={weeklyReport} />
        </section>
      </div>
    </div>
  );
}

function XpLineChart({ data }: { data: DaySummary[] }) {
  if (data.length === 0) {
    return <p className="text-muted text-sm py-8 text-center">No activity data yet</p>;
  }
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxXp = Math.max(1, ...data.map((d) => d.xpEarned));
  const points: { x: number; y: number; d: DaySummary }[] = data.map((d, i) => ({
    x: padding.left + (i / Math.max(1, data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - (d.xpEarned / maxXp) * chartHeight,
    d,
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const fillPoints = `${padding.left},${padding.top + chartHeight} ${polylinePoints} ${padding.left + chartWidth},${padding.top + chartHeight}`;

  const xLabels = data.filter((_, i) => i % 7 === 0 || i === data.length - 1).slice(0, 6);
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxXp * (yTicks - i)) / yTicks)
  );

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="xpGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00FF66" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00FF66" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {Array.from({ length: 4 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={padding.left}
            y1={padding.top + (chartHeight * (i + 1)) / 5}
            x2={padding.left + chartWidth}
            y2={padding.top + (chartHeight * (i + 1)) / 5}
            stroke="#334155"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={padding.left + (chartWidth * i) / 5}
            y1={padding.top}
            x2={padding.left + (chartWidth * i) / 5}
            y2={padding.top + chartHeight}
            stroke="#334155"
            strokeWidth="0.5"
          />
        ))}
        {/* Fill */}
        <polygon points={fillPoints} fill="url(#xpGradient)" />
        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#00FF66"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00FF66" />
        ))}
        {/* X labels */}
        {xLabels.map((d, i) => {
          const idx = data.findIndex((x) => x.date === d.date);
          if (idx < 0) return null;
          const x = padding.left + (idx / Math.max(1, data.length - 1)) * chartWidth;
          return (
            <text key={i} x={x} y={height - 8} textAnchor="middle" className="text-[10px] fill-muted">
              {format(parseISO(d.date), "M/d")}
            </text>
          );
        })}
        {/* Y labels */}
        {yLabels.map((v, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={padding.top + (chartHeight * i) / yTicks + 4}
            textAnchor="end"
            className="text-[10px] fill-muted"
          >
            {v}
          </text>
        ))}
      </svg>
    </div>
  );
}

function DonutChart({
  daily,
  weekly,
  monthly,
  total,
}: {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
}) {
  const size = 160;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  const colors = {
    daily: "#00FF66",
    weekly: "#00E5FF",
    monthly: "#B026FF",
  };

  const segments = [
    { value: daily, color: colors.daily, key: "daily" },
    { value: weekly, color: colors.weekly, key: "weekly" },
    { value: monthly, color: colors.monthly, key: "monthly" },
  ].filter((s) => s.value > 0);

  let offset = 0;
  const arcs = segments.map((s) => {
    const dash = total > 0 ? (s.value / total) * circumference : 0;
    const arc = { ...s, dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} className="xp-ring">
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={`${a.dash} ${circumference}`}
              strokeDashoffset={-a.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary tabular-nums">{total}</span>
        </div>
      </div>
      <div className="flex gap-6 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-glow" />
          Daily: {daily}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-electric-blue" />
          Weekly: {weekly}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-neon-purple" />
          Monthly: {monthly}
        </span>
      </div>
    </div>
  );
}

function SkillRadarChart({ skills }: { skills: { id: number; name: string; level: number }[] }) {
  if (skills.length === 0) {
    return <p className="text-muted text-sm py-8 text-center">No leaf skills yet</p>;
  }

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxLevel = 20;
  const radius = Math.min(cx, cy) - 50;

  const n = skills.length;
  const angleStep = (2 * Math.PI) / n;

  const points = skills.map((s, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (Math.min(s.level, maxLevel) / maxLevel) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      name: s.name,
      angle,
      labelRadius: radius + 25,
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const concentricLevels = [5, 10, 15, 20];
  const labelPoints = skills.map((_, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = radius + 25;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      name: skills[i].name,
      angle,
    };
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] mx-auto" preserveAspectRatio="xMidYMid meet">
        {/* Concentric polygons */}
        {concentricLevels.map((level) => {
          const r = (level / maxLevel) * radius;
          const pts = skills.map((_, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(" ");
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke="#334155"
              strokeWidth="0.5"
            />
          );
        })}
        {/* Main polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(0, 229, 255, 0.15)"
          stroke="#00E5FF"
          strokeWidth="1.5"
        />
        {/* Labels */}
        {labelPoints.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={p.x > cx ? "start" : p.x < cx ? "end" : "middle"}
            dominantBaseline="middle"
            className="text-[9px] fill-secondary"
          >
            {p.name.length > 10 ? p.name.slice(0, 8) + "…" : p.name}
          </text>
        ))}
      </svg>
    </div>
  );
}

function ActivityHeatmap({ data }: { data: DaySummary[] }) {
  const dataMap = new Map(data.map((d) => [d.date, d.questCount]));

  const rows = 7;
  const cols = 52;
  const cellSize = 12;
  const gap = 2;
  const width = cols * (cellSize + gap) + 60;
  const height = rows * (cellSize + gap) + 30;

  const startDate = subDays(new Date(), 364);
  const grid: { date: Date; dateStr: string; count: number; col: number; row: number }[] = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = format(d, "yyyy-MM-dd");
    const col = Math.floor(i / 7);
    const row = d.getDay();
    grid.push({
      date: new Date(d),
      dateStr,
      count: dataMap.get(dateStr) ?? 0,
      col,
      row,
    });
  }

  const monthLabels: { month: string; x: number }[] = [];
  let lastMonth = "";
  for (let col = 0; col < cols; col++) {
    const dayIdx = col * 7;
    if (dayIdx < grid.length) {
      const m = format(grid[dayIdx].date, "MMM");
      if (m !== lastMonth) {
        monthLabels.push({ month: m, x: col * (cellSize + gap) });
        lastMonth = m;
      }
    }
  }

  const getColor = (count: number) => {
    if (count === 0) return "rgb(30 41 59)";
    if (count <= 2) return "rgba(0, 255, 102, 0.2)";
    if (count <= 4) return "rgba(0, 255, 102, 0.5)";
    return "#00FF66";
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px]" preserveAspectRatio="xMinYMid meet">
        <text x={0} y={12} className="text-[10px] fill-muted">Sun</text>
        <text x={0} y={12 + (cellSize + gap) * 3.5} className="text-[10px] fill-muted">Wed</text>
        <text x={0} y={12 + (cellSize + gap) * 6.5} className="text-[10px] fill-muted">Sat</text>
        {monthLabels.slice(0, 12).map((m, i) => (
          <text key={i} x={50 + m.x} y={18} className="text-[9px] fill-muted">
            {m.month}
          </text>
        ))}
        {grid.map((day, i) => {
          const x = 50 + day.col * (cellSize + gap);
          const y = 25 + day.row * (cellSize + gap);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={getColor(day.count)}
            >
              <title>{`${format(day.date, "MMM d, yyyy")}: ${day.count} quest${day.count !== 1 ? "s" : ""}`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

function WeeklyReportCard({ report }: { report: WeeklyReport | null }) {
  if (!report) {
    return <p className="text-muted text-sm">No weekly data yet</p>;
  }

  const questChange = report.lastWeekQuests > 0
    ? ((report.thisWeekQuests - report.lastWeekQuests) / report.lastWeekQuests) * 100
    : report.thisWeekQuests > 0 ? 100 : 0;
  const xpChange = report.lastWeekXp > 0
    ? ((report.thisWeekXp - report.lastWeekXp) / report.lastWeekXp) * 100
    : report.thisWeekXp > 0 ? 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-panel/50 rounded-lg p-3">
        <p className="text-xs text-muted mb-1">This Week</p>
        <p className="text-lg font-bold text-primary tabular-nums">{report.thisWeekQuests} quests</p>
        <p className="text-sm text-emerald-glow tabular-nums">+{report.thisWeekXp} XP</p>
      </div>
      <div className="bg-panel/50 rounded-lg p-3">
        <p className="text-xs text-muted mb-1">Last Week</p>
        <p className="text-lg font-bold text-secondary tabular-nums">{report.lastWeekQuests} quests</p>
        <p className="text-sm text-secondary tabular-nums">+{report.lastWeekXp} XP</p>
      </div>
      <div className="col-span-2 flex items-center gap-4 text-sm">
        <span className={cn(
          "flex items-center gap-1",
          questChange >= 0 ? "text-emerald-glow" : "text-crimson"
        )}>
          {questChange >= 0 ? "↑" : "↓"} {Math.abs(questChange).toFixed(0)}% quests
        </span>
        <span className={cn(
          "flex items-center gap-1",
          xpChange >= 0 ? "text-emerald-glow" : "text-crimson"
        )}>
          {xpChange >= 0 ? "↑" : "↓"} {Math.abs(xpChange).toFixed(0)}% XP
        </span>
        <span className="text-muted">Streak: {report.currentStreak} days</span>
      </div>
    </div>
  );
}
