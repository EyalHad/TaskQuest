import { useState } from "react";
import type { SubTask } from "../../types";
import { useStore } from "../../store";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

interface Props {
  questId: number;
  subTasks: SubTask[];
  onUpdate: () => void;
}

export function SubTaskList({ questId, subTasks, onUpdate }: Props) {
  const createSubTask = useStore((s) => s.createSubTask);
  const toggleSubTask = useStore((s) => s.toggleSubTask);
  const deleteSubTask = useStore((s) => s.deleteSubTask);

  const [newStepTitle, setNewStepTitle] = useState("");

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newStepTitle.trim();
    if (!title) return;
    const created = await createSubTask(questId, title);
    if (created) {
      setNewStepTitle("");
      onUpdate();
    }
  };

  const handleToggle = async (subTaskId: number) => {
    await toggleSubTask(subTaskId);
    onUpdate();
  };

  const handleDelete = async (subTaskId: number) => {
    await deleteSubTask(subTaskId);
    onUpdate();
  };

  return (
    <div className="space-y-2">
      {subTasks
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((st) => (
          <div
            key={st.id}
            className="group flex items-center gap-2 rounded-lg bg-panel/60 px-3 py-2 hover:bg-panel/80 transition-colors"
          >
            <button
              onClick={() => handleToggle(st.id)}
              className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                st.completed
                  ? "bg-emerald-glow/30 border-emerald-glow"
                  : "border-default hover:border-electric-blue"
              )}
            >
              {st.completed && (
                <svg className="w-2.5 h-2.5 text-emerald-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              onClick={() => handleToggle(st.id)}
              className={cn(
                "flex-1 text-sm cursor-pointer select-none",
                st.completed ? "text-muted line-through" : "text-primary"
              )}
            >
              {st.title}
            </span>
            <button
              onClick={() => handleDelete(st.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-crimson transition-all rounded"
              title="Delete step"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

      <form onSubmit={handleAddStep} className="flex gap-2">
        <input
          type="text"
          value={newStepTitle}
          onChange={(e) => setNewStepTitle(e.target.value)}
          placeholder="+ Add step"
          className="flex-1 bg-panel/80 border border-default rounded-lg px-3 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-electric-blue/50"
        />
        <button
          type="submit"
          disabled={!newStepTitle.trim()}
          className="px-3 py-1.5 text-xs font-medium text-electric-blue hover:bg-electric-blue/10 rounded-lg disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}
