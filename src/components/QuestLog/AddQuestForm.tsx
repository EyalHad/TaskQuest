import { useState } from "react";
import { useStore } from "../../store";
import type { QuestType, Difficulty, Priority } from "../../types";
import { cn } from "../../lib/utils";
import { Repeat, Skull, Bookmark } from "lucide-react";

interface Props {
  preselectedSkillId?: number;
  defaultDueDate?: string;
}

export function AddQuestForm({ preselectedSkillId, defaultDueDate }: Props) {
  const skills = useStore((s) => s.skills);
  const templates = useStore((s) => s.templates);
  const createQuest = useStore((s) => s.createQuest);
  const createTemplate = useStore((s) => s.createTemplate);
  const createQuestFromTemplate = useStore((s) => s.createQuestFromTemplate);
  const loading = useStore((s) => s.loading);
  const openSkillBank = useStore((s) => s.openSkillBank);

  const leafSkills = skills.filter(
    (s) => !skills.some((other) => other.parentSkillId === s.id)
  );

  const [name, setName] = useState("");
  const [questType, setQuestType] = useState<QuestType>("daily");
  const [skillId, setSkillId] = useState<number | null>(preselectedSkillId ?? leafSkills[0]?.id ?? null);
  const [xpReward, setXpReward] = useState(10);
  const [dueDate, setDueDate] = useState(defaultDueDate ?? "");
  const [expanded, setExpanded] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [priority, setPriority] = useState<Priority>("normal");
  const [isBoss, setIsBoss] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createQuest({
      questName: name.trim(),
      questType,
      skillId: skillId ?? undefined,
      xpReward,
      dueDate: dueDate || undefined,
      isRecurring: isRecurring || undefined,
      recurrencePattern: isRecurring ? questType : undefined,
      difficulty,
      priority,
      isBoss,
    });
    setName("");
    setIsRecurring(false);
    setDifficulty("normal");
    setPriority("normal");
    setIsBoss(false);
    if (!preselectedSkillId && !defaultDueDate) setExpanded(false);
  };

  const handleSaveAsTemplate = async () => {
    const templateName = name.trim() || "Quick Template";
    await createTemplate({
      templateName,
      questName: name.trim() || "Untitled Quest",
      questType,
      skillId: skillId ?? undefined,
      xpReward,
      difficulty,
      priority,
      isBoss,
    });
  };

  if (!expanded && !preselectedSkillId && !defaultDueDate) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full rounded-xl border-2 border-dashed border-default hover:border-electric-blue/40 py-2 text-sm text-muted hover:text-electric-blue transition-colors"
      >
        + Add Quest
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn(
      "space-y-2 rounded-xl bg-card border border-subtle p-3 animate-in",
      isBoss && "epic-glow border-gold/40"
    )}>
      {templates.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted shrink-0">From template:</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedTemplateId(val);
              if (val) {
                createQuestFromTemplate(Number(val)).then(() => {
                  setSelectedTemplateId("");
                  if (!preselectedSkillId && !defaultDueDate) setExpanded(false);
                });
              }
            }}
            className="flex-1 bg-panel border border-subtle rounded-lg px-3 py-1.5 text-sm text-secondary focus:outline-none focus:border-electric-blue/50"
          >
            <option value="">— Select template —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.templateName}</option>
            ))}
          </select>
        </div>
      )}

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Quest name..."
        autoFocus
        className="w-full bg-panel border border-subtle rounded-lg px-3 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-electric-blue/50"
      />

      <div className="flex gap-2">
        {(["daily", "weekly", "monthly"] as QuestType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setQuestType(t)}
            className={cn(
              "flex-1 text-xs py-1 rounded-lg capitalize transition-colors border",
              questType === t
                ? t === "monthly"
                  ? "bg-neon-purple/15 text-neon-purple border-neon-purple/30"
                  : t === "weekly"
                    ? "bg-electric-blue/15 text-electric-blue border-electric-blue/30"
                    : "bg-emerald-glow/15 text-emerald-glow border-emerald-glow/30"
                : "bg-panel text-muted border-default hover:text-secondary"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {!preselectedSkillId && (
        <>
          <select
            value={skillId ?? ""}
            onChange={(e) => setSkillId(e.target.value ? Number(e.target.value) : null)}
            className="w-full bg-panel border border-subtle rounded-lg px-3 py-1.5 text-sm text-secondary focus:outline-none focus:border-electric-blue/50"
          >
            <option value="">No skill (event/task)</option>
            {leafSkills.map((s) => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => openSkillBank()}
            className="text-xs text-muted hover:text-electric-blue transition-colors"
          >
            + Manage Skills
          </button>
        </>
      )}

      <div className="flex gap-2">
        {(["easy", "normal", "hard", "epic"] as Difficulty[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            className={cn(
              "flex-1 text-xs py-1 rounded-lg capitalize transition-colors border",
              difficulty === d
                ? d === "easy"
                  ? "bg-muted/20 text-secondary border-default"
                  : d === "normal"
                    ? "bg-electric-blue/15 text-electric-blue border-electric-blue/30"
                    : d === "hard"
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                      : "epic-glow bg-gold/15 text-gold border-gold/40"
                : "bg-panel text-muted border-default hover:text-secondary"
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(["low", "normal", "urgent"] as Priority[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={cn(
              "flex-1 text-xs py-1 rounded-lg capitalize transition-colors border",
              priority === p
                ? p === "low"
                  ? "bg-muted/20 text-secondary border-default"
                  : p === "normal"
                    ? "bg-electric-blue/15 text-electric-blue border-electric-blue/30"
                    : "urgent-pulse bg-crimson/15 text-crimson border-l-2 border-crimson/50"
                : "bg-panel text-muted border-default hover:text-secondary"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted">Due:</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 bg-panel border border-subtle rounded-lg px-2 py-1 text-sm text-secondary focus:outline-none focus:border-electric-blue/50"
        />
        <label className="text-xs text-muted">XP:</label>
        <input
          type="number"
          value={xpReward}
          onChange={(e) => setXpReward(Math.max(1, Number(e.target.value)))}
          min={1}
          className="w-14 bg-panel border border-subtle rounded-lg px-2 py-1 text-sm text-emerald-glow focus:outline-none focus:border-electric-blue/50"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
              isRecurring ? "bg-electric-blue/20 border-electric-blue" : "border-default"
            )}
          >
            {isRecurring && <Repeat className="w-2.5 h-2.5 text-electric-blue" />}
          </button>
          <span className="text-[11px] text-secondary">Recurring</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            onClick={() => setIsBoss(!isBoss)}
            className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
              isBoss ? "bg-gold/20 border-gold epic-glow" : "border-default"
            )}
          >
            {isBoss && <Skull className="w-2.5 h-2.5 text-gold" />}
          </button>
          <span className="text-[11px] text-secondary">Boss</span>
        </label>

        <button
          type="button"
          onClick={handleSaveAsTemplate}
          className="flex items-center gap-1 text-[11px] text-secondary hover:text-electric-blue transition-colors"
          title="Save as template"
        >
          <Bookmark className="w-3.5 h-3.5" />
          Save as template
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30 disabled:opacity-40 font-medium text-sm py-1.5 rounded-lg transition-colors border border-electric-blue/20"
        >
          Add Quest
        </button>
        {!preselectedSkillId && !defaultDueDate && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="px-3 text-sm text-muted hover:text-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
