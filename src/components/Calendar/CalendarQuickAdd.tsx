import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  date: string;
  onClose: () => void;
}

export function CalendarQuickAdd({ date, onClose }: Props) {
  const skills = useStore((s) => s.skills);
  const createQuest = useStore((s) => s.createQuest);
  const inputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [skillId, setSkillId] = useState<number | null>(null);
  const [questType, setQuestType] = useState<"daily" | "weekly" | "monthly">("daily");

  const leafSkills = skills.filter((s) => !skills.some((o) => o.parentSkillId === s.id));

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createQuest({ questName: name.trim(), questType, skillId: skillId ?? undefined, dueDate: date });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-card border border-default rounded-xl shadow-2xl w-full max-w-sm mx-4 p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary">
            New Quest — {new Date(date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
          <button onClick={onClose} className="p-1 text-muted hover:text-secondary rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Quest name..."
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full bg-panel border border-subtle rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-electric-blue/50"
        />
        <select
          value={skillId ?? ""}
          onChange={(e) => setSkillId(e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-panel border border-subtle rounded-lg px-3 py-2 text-sm text-primary focus:outline-none"
        >
          <option value="">Select skill...</option>
          {leafSkills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {(["daily", "weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setQuestType(t)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                questType === t
                  ? "bg-electric-blue/15 text-electric-blue border-electric-blue/30"
                  : "bg-panel text-muted border-subtle hover:text-secondary"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full py-2 text-sm font-medium bg-electric-blue/15 text-electric-blue border border-electric-blue/20 rounded-lg hover:bg-electric-blue/25 disabled:opacity-50 transition-colors"
        >
          Add Quest
        </button>
      </div>
    </div>
  );
}
