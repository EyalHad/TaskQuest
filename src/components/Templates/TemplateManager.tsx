import { useState, useMemo } from "react";
import { useStore } from "../../store";
import { FileStack, Play, CalendarClock, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { EmptyState } from "../shared/EmptyState";

const SCHEDULE_OPTIONS = [
  { value: "", label: "No schedule" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every Monday" },
  { value: "monthly", label: "1st of each month" },
  { value: "weekdays", label: "Weekdays (Mon-Fri)" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-emerald-glow bg-emerald-glow/10",
  normal: "text-secondary bg-default/50",
  hard: "text-orange-400 bg-orange-400/10",
  epic: "text-neon-purple bg-neon-purple/10",
};

export function TemplateManager() {
  const templates = useStore((s) => s.templates);
  const skills = useStore((s) => s.skills);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const createQuestFromTemplate = useStore((s) => s.createQuestFromTemplate);
  const updateTemplateSchedule = useStore((s) => s.updateTemplateSchedule);
  const setPage = useStore((s) => s.setPage);

  const skillMap = useMemo(() => new Map(skills.map(s => [s.id, s])), [skills]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [editScheduleId, setEditScheduleId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    await deleteTemplate(id);
    setConfirmDelete(null);
  };

  const handleScheduleChange = async (templateId: number, pattern: string) => {
    await updateTemplateSchedule(templateId, pattern || null, !!pattern);
    setEditScheduleId(null);
  };

  const handleToggleActive = async (templateId: number, pattern: string | null, currentActive: boolean) => {
    if (!pattern) return;
    await updateTemplateSchedule(templateId, pattern, !currentActive);
  };

  if (templates.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="shrink-0 px-5 py-4 border-b border-default bg-panel">
          <h1 className="text-lg font-bold text-primary flex items-center gap-2">
            <FileStack className="w-5 h-5 text-electric-blue" /> Quest Templates
          </h1>
        </div>
        <div className="flex-1">
          <EmptyState icon={FileStack} title="No templates" subtitle="Save quest templates for recurring workflows."
            action={() => setPage("quests")} actionLabel="Go to Quest Board" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <FileStack className="w-5 h-5 text-electric-blue" /> Quest Templates
        </h1>
        <span className="text-xs text-muted">{templates.length} template{templates.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {templates.map((t) => {
          const skill = t.skillId ? skillMap.get(t.skillId) : null;
          const scheduleLabel = SCHEDULE_OPTIONS.find(o => o.value === (t.schedulePattern ?? ""))?.label ?? t.schedulePattern ?? "No schedule";

          return (
            <div key={t.id} className="bg-card border border-subtle rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-primary truncate">{t.templateName}</h3>
                  <p className="text-xs text-muted truncate mt-0.5">Quest: "{t.questName}"</p>
                </div>
                {t.isBoss && <span className="text-[10px] font-semibold text-crimson bg-crimson/10 px-2 py-0.5 rounded-full shrink-0">BOSS</span>}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-default/50 text-secondary capitalize">{t.questType}</span>
                {skill && <span className="text-[10px] px-2 py-0.5 rounded-full bg-default/50 text-secondary">{skill.icon} {skill.name}</span>}
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full capitalize", DIFFICULTY_COLORS[t.difficulty] ?? DIFFICULTY_COLORS.normal)}>{t.difficulty}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-glow/10 text-emerald-glow tabular-nums">{t.xpReward} XP</span>
              </div>

              {/* Schedule */}
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="w-3.5 h-3.5 text-muted" />
                {editScheduleId === t.id ? (
                  <select autoFocus defaultValue={t.schedulePattern ?? ""}
                    onChange={(e) => handleScheduleChange(t.id, e.target.value)}
                    onBlur={() => setEditScheduleId(null)}
                    className="bg-panel border border-default rounded-lg px-2 py-1 text-xs text-secondary focus:outline-none">
                    {SCHEDULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <button onClick={() => setEditScheduleId(t.id)} className="text-xs text-secondary hover:text-electric-blue transition-colors">
                    {scheduleLabel}
                  </button>
                )}
                {t.schedulePattern && (
                  <button onClick={() => handleToggleActive(t.id, t.schedulePattern, t.scheduleActive)}
                    className={cn("text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      t.scheduleActive
                        ? "bg-emerald-glow/10 text-emerald-glow border-emerald-glow/20"
                        : "bg-default/50 text-muted border-default hover:text-secondary"
                    )}>
                    {t.scheduleActive ? "Active" : "Paused"}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-subtle">
                <button onClick={() => createQuestFromTemplate(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-electric-blue/15 text-electric-blue border border-electric-blue/20 rounded-lg hover:bg-electric-blue/25 transition-colors">
                  <Play className="w-3 h-3" /> Create Quest Now
                </button>
                {confirmDelete === t.id ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[10px] text-muted">Delete?</span>
                    <button onClick={() => handleDelete(t.id)} className="text-[10px] text-crimson hover:underline">Yes</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-[10px] text-muted hover:underline">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(t.id)}
                    className="ml-auto p-1.5 text-muted hover:text-crimson rounded-lg hover:bg-card-hover transition-colors" title="Delete template">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
