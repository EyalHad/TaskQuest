import { useState, useMemo, useCallback } from "react";
import { useStore } from "../../store";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Circle, Calendar } from "lucide-react";
import { cn } from "../../lib/utils";
import { CalendarQuickAdd } from "./CalendarQuickAdd";
import { EmptyState } from "../shared/EmptyState";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year: number, month: number) { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; }

type ViewMode = "month" | "week";

export function CalendarBoard() {
  const quests = useStore((s) => s.quests);
  const rescheduleQuest = useStore((s) => s.rescheduleQuest);
  const setPage = useStore((s) => s.setPage);
  const setFocusQuest = useStore((s) => s.setFocusQuest);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [view, setView] = useState<ViewMode>("month");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const hasScheduledQuests = useMemo(() => quests.some(q => q.dueDate), [quests]);

  const questsByDate = useMemo(() => {
    const map: Record<string, typeof quests> = {};
    for (const q of quests) {
      const date = q.dueDate?.slice(0, 10);
      if (date) { if (!map[date]) map[date] = []; map[date].push(q); }
    }
    return map;
  }, [quests]);

  const today = new Date().toISOString().slice(0, 10);

  const prevPeriod = () => {
    if (view === "week") { setWeekOffset(w => w - 1); }
    else if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextPeriod = () => {
    if (view === "week") { setWeekOffset(w => w + 1); }
    else if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDrop = useCallback(async (dateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(null);
    const questId = Number(e.dataTransfer.getData("questId"));
    if (questId) await rescheduleQuest(questId, dateStr);
  }, [rescheduleQuest]);

  const handleQuestClick = (questId: number) => {
    setFocusQuest(questId);
    setPage("quests");
  };

  // Week view: get 7 days starting from Monday of current week + offset
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekOffset]);

  // Month grid
  const monthCells = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const renderDayCell = (dateStr: string, day: number | string, tall: boolean) => {
    const dayQuests = questsByDate[dateStr] || [];
    const isToday = dateStr === today;
    const isDragOver = dragOverDate === dateStr;
    const maxShow = tall ? 8 : 3;

    return (
      <div
        key={dateStr}
        onClick={() => setSelectedDate(dateStr)}
        onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateStr); }}
        onDragLeave={() => setDragOverDate(null)}
        onDrop={(e) => handleDrop(dateStr, e)}
        className={cn(
          "bg-panel p-1.5 cursor-pointer hover:bg-card/60 transition-colors",
          tall ? "min-h-[160px]" : "min-h-[80px]",
          isToday && "ring-1 ring-inset ring-electric-blue/40 bg-electric-blue/5",
          isDragOver && "ring-2 ring-inset ring-electric-blue/50 bg-electric-blue/10"
        )}
      >
        <div className={cn("text-xs font-medium mb-1", isToday ? "text-electric-blue" : "text-secondary")}>{day}</div>
        <div className="space-y-0.5">
          {dayQuests.slice(0, maxShow).map((q) => (
            <div
              key={q.id}
              draggable
              onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("questId", String(q.id)); e.dataTransfer.effectAllowed = "move"; }}
              onClick={(e) => { e.stopPropagation(); handleQuestClick(q.id); }}
              className={cn("text-[10px] truncate px-1 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-card-hover transition-colors",
                q.completed ? "text-emerald-glow/80 bg-emerald-glow/10" : q.failed ? "text-crimson/80 bg-crimson/10" : "text-secondary bg-card"
              )}
            >
              {q.completed ? <CheckCircle className="w-2.5 h-2.5 shrink-0" /> : q.failed ? <XCircle className="w-2.5 h-2.5 shrink-0" /> : <Circle className="w-2.5 h-2.5 shrink-0" />}
              <span className="truncate">{q.questName}</span>
            </div>
          ))}
          {dayQuests.length > maxShow && <div className="text-[9px] text-muted pl-1">+{dayQuests.length - maxShow} more</div>}
        </div>
      </div>
    );
  };

  const periodLabel = view === "week"
    ? `${weekDays[0].slice(5)} — ${weekDays[6].slice(5)}`
    : `${MONTHS[month]} ${year}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary">Calendar</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card rounded-lg border border-subtle p-0.5 text-xs">
            <button onClick={() => { setView("month"); setWeekOffset(0); }}
              className={cn("px-2.5 py-1 rounded-md transition-colors", view === "month" ? "bg-default text-electric-blue" : "text-muted hover:text-secondary")}>Month</button>
            <button onClick={() => { setView("week"); setWeekOffset(0); }}
              className={cn("px-2.5 py-1 rounded-md transition-colors", view === "week" ? "bg-default text-electric-blue" : "text-muted hover:text-secondary")}>Week</button>
          </div>
          <button onClick={prevPeriod} className="p-1.5 rounded-lg hover:bg-card-hover text-secondary hover:text-primary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-primary min-w-[140px] text-center">{periodLabel}</span>
          <button onClick={nextPeriod} className="p-1.5 rounded-lg hover:bg-card-hover text-secondary hover:text-primary transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!hasScheduledQuests && (
          <EmptyState icon={Calendar} title="No scheduled quests" subtitle="Add due dates to quests to see them on the calendar." />
        )}
        <div className="grid grid-cols-7 gap-px bg-card rounded-xl overflow-hidden border border-subtle">
          {DAYS.map((d) => (
            <div key={d} className="bg-panel px-2 py-2 text-center text-[11px] font-semibold text-muted uppercase tracking-wider">{d}</div>
          ))}
          {view === "month" ? (
            monthCells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className="bg-panel/50 min-h-[80px]" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              return renderDayCell(dateStr, day, false);
            })
          ) : (
            weekDays.map((dateStr) => {
              const d = new Date(dateStr + "T00:00:00");
              const label = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
              return renderDayCell(dateStr, label, true);
            })
          )}
        </div>
      </div>

      {selectedDate && <CalendarQuickAdd date={selectedDate} onClose={() => setSelectedDate(null)} />}
    </div>
  );
}
