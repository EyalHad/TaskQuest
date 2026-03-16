import { useMemo } from "react";
import { useStore } from "../../store";
import { TaskCard } from "./TaskCard";
import { cn } from "../../lib/utils";

const COLUMNS = [
  { key: "todo", title: "To Do", color: "text-secondary", border: "border-default", bg: "bg-card/30" },
  { key: "progress", title: "In Progress", color: "text-electric-blue", border: "border-electric-blue/30", bg: "bg-electric-blue/5" },
  { key: "done", title: "Done Today", color: "text-emerald-glow", border: "border-emerald-glow/30", bg: "bg-emerald-glow/5" },
] as const;

export function KanbanView() {
  const quests = useStore((s) => s.quests);
  const skills = useStore((s) => s.skills);
  const toggleQuest = useStore((s) => s.toggleQuest);
  const skillMap = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);
  const today = new Date().toISOString().slice(0, 10);

  const active = useMemo(() => quests.filter((q) => !q.completed && !q.failed && !q.isArchived), [quests]);
  const todo = useMemo(() => active.filter((q) => q.timeSpentSeconds === 0 && q.pomodoroCount === 0), [active]);
  const inProgress = useMemo(() => active.filter((q) => q.timeSpentSeconds > 0 || q.pomodoroCount > 0), [active]);
  const doneToday = useMemo(
    () => quests.filter((q) => q.completed && q.completedAt?.slice(0, 10) === today),
    [quests, today]
  );

  const columns = [
    { ...COLUMNS[0], quests: todo },
    { ...COLUMNS[1], quests: inProgress },
    { ...COLUMNS[2], quests: doneToday },
  ];

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    const questId = Number(e.dataTransfer.getData("questId"));
    if (!questId) return;
    if (targetColumn === "done") {
      const q = quests.find((q) => q.id === questId);
      if (q && !q.completed) await toggleQuest(questId);
    } else if (targetColumn === "todo") {
      const q = quests.find((q) => q.id === questId);
      if (q && q.completed) await toggleQuest(questId);
    }
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto p-4">
      {columns.map((col) => (
        <div
          key={col.key}
          className="flex-1 min-w-[300px] max-w-[420px] flex flex-col"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, col.key)}
        >
          <div className={cn("flex items-center justify-between mb-3 pb-2 border-b", col.border)}>
            <h3 className={cn("text-sm font-bold", col.color)}>{col.title}</h3>
            <span className="text-xs text-muted tabular-nums bg-card px-2 py-0.5 rounded-full">
              {col.quests.length}
            </span>
          </div>
          <div className={cn("flex-1 overflow-y-auto space-y-2 rounded-lg p-2", col.bg)}>
            {col.quests.length === 0 && (
              <div className="text-center py-8 text-muted text-xs">No quests</div>
            )}
            {col.quests.map((q, i) => (
              <div
                key={q.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("questId", String(q.id));
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="card-stagger cursor-grab active:cursor-grabbing"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <TaskCard quest={q} skillName={q.skillId != null ? skillMap.get(q.skillId)?.name : undefined} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
