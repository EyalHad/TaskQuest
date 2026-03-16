import { useState, useEffect, useCallback } from "react";
import { useStore } from "../../store";
import { Plus, Trash2, Check, Zap, Pencil, X } from "lucide-react";
import { cn } from "../../lib/utils";

const ICONS = ["✅", "🏃", "📖", "🧘", "💪", "🎯", "🎵", "💧", "🍎", "💤"];

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function HabitTracker() {
  const habits = useStore((s) => s.habits);
  const skills = useStore((s) => s.skills);
  const createHabit = useStore((s) => s.createHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const checkHabit = useStore((s) => s.checkHabit);
  const getHabitEntries = useStore((s) => s.getHabitEntries);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✅");
  const [skillId, setSkillId] = useState<number | null>(null);
  const [xp, setXp] = useState(3);
  const [entries, setEntries] = useState<Record<number, Set<string>>>({});
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editXp, setEditXp] = useState(5);

  const last30 = getLast30Days();
  const fromDate = last30[0];
  const toDate = last30[last30.length - 1];

  const leafSkills = skills.filter((s) => !skills.some((o) => o.parentSkillId === s.id));

  const loadEntries = useCallback(async () => {
    const map: Record<number, Set<string>> = {};
    for (const h of habits) {
      const dates = await getHabitEntries(h.id, fromDate, toDate);
      map[h.id] = new Set(dates);
    }
    setEntries(map);
  }, [habits, getHabitEntries, fromDate, toDate]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createHabit(name.trim(), icon, skillId, xp);
    setName(""); setIcon("✅"); setSkillId(null); setXp(3); setShowForm(false);
  };

  const handleCheck = async (habitId: number) => {
    await checkHabit(habitId);
    await loadEntries();
  };

  const handleDelete = async (habitId: number) => {
    await deleteHabit(habitId);
    setConfirmDelete(null);
  };

  const startEdit = (habit: { id: number; name: string; icon: string; xpPerCheck: number }) => {
    setEditingHabitId(habit.id);
    setEditName(habit.name);
    setEditIcon(habit.icon);
    setEditXp(habit.xpPerCheck);
  };

  const saveEdit = async () => {
    if (editingHabitId && editName.trim()) {
      const habit = habits.find(h => h.id === editingHabitId);
      await updateHabit(editingHabitId, editName.trim(), editIcon, editXp, habit?.skillId ?? null);
      setEditingHabitId(null);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary">Habit Tracker</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-electric-blue border border-electric-blue/20 rounded-lg hover:bg-electric-blue/10 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Habit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {showForm && (
          <div className="bg-card border border-subtle rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              {ICONS.map((e) => (
                <button key={e} onClick={() => setIcon(e)}
                  className={cn("text-xl p-1.5 rounded-lg transition-colors", icon === e ? "bg-electric-blue/20 ring-1 ring-electric-blue/40" : "hover:bg-card-hover")}>
                  {e}
                </button>
              ))}
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit name..."
              className="w-full bg-panel border border-default rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-electric-blue/50" />
            <div className="flex gap-3">
              <select value={skillId ?? ""} onChange={(e) => setSkillId(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 bg-panel border border-default rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-electric-blue/50">
                <option value="">No linked skill</option>
                {leafSkills.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-glow" />
                <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} min={1} max={20}
                  className="w-14 bg-panel border border-default rounded-lg px-2 py-2 text-sm text-primary text-center focus:outline-none" />
                <span className="text-xs text-muted">XP</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-secondary hover:text-primary">Cancel</button>
              <button onClick={handleAdd} disabled={!name.trim()}
                className="px-4 py-1.5 text-xs font-medium bg-electric-blue/15 text-electric-blue border border-electric-blue/20 rounded-lg hover:bg-electric-blue/25 disabled:opacity-50 transition-colors">
                Add Habit
              </button>
            </div>
          </div>
        )}

        {habits.length === 0 && !showForm && (
          <div className="text-center py-12 text-muted">
            <p className="text-sm">No habits yet. Create one to start tracking!</p>
          </div>
        )}

        {habits.map((h) => {
          const habitEntries = entries[h.id] || new Set<string>();
          const checkedToday = habitEntries.has(today);
          const linkedSkill = leafSkills.find((s) => s.id === h.skillId);
          const streak = (() => {
            let s = 0;
            for (let i = last30.length - 1; i >= 0; i--) {
              if (habitEntries.has(last30[i])) s++;
              else break;
            }
            return s;
          })();

          return (
            <div key={h.id} className="bg-card border border-subtle rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                {editingHabitId === h.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className="w-8 bg-panel border border-default rounded text-center text-sm p-1" />
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 bg-panel border border-default rounded px-2 py-1 text-sm text-primary" />
                    <input type="number" value={editXp} onChange={(e) => setEditXp(Number(e.target.value))} className="w-12 bg-panel border border-default rounded px-1 py-1 text-sm text-center" min={1} />
                    <button onClick={saveEdit} className="text-emerald-glow hover:bg-emerald-glow/10 p-1 rounded"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingHabitId(null)} className="text-muted hover:text-secondary p-1 rounded"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl">{h.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-primary">{h.name}</p>
                    <p className="text-[10px] text-muted">
                      +{h.xpPerCheck} XP{linkedSkill ? ` → ${linkedSkill.name}` : ""}
                      {streak > 0 && <span className="text-gold ml-2">🔥 {streak}d streak</span>}
                    </p>
                  </div>
                </div>
                )}
                <div className="flex items-center gap-2">
                  {editingHabitId !== h.id && (
                    <>
                  <button onClick={() => startEdit(h)} className="p-1.5 text-muted hover:text-electric-blue transition-colors rounded-lg">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleCheck(h.id)} disabled={checkedToday}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      checkedToday ? "bg-emerald-glow/15 text-emerald-glow border-emerald-glow/30" : "bg-default text-secondary border-default hover:border-emerald-glow/40 hover:text-emerald-glow"
                    )}>
                    <Check className="w-3.5 h-3.5" /> {checkedToday ? "Done!" : "Check"}
                  </button>
                  {confirmDelete === h.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(h.id)} className="px-2 py-1 text-[10px] bg-crimson/20 text-crimson rounded border border-crimson/30">Delete</button>
                      <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-[10px] text-muted">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(h.id)} className="p-1.5 text-muted hover:text-crimson transition-colors rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-0.5 flex-wrap">
                {last30.map((d) => (
                  <div key={d} title={d}
                    className={cn("w-3.5 h-3.5 rounded-sm transition-colors",
                      habitEntries.has(d) ? "bg-emerald-glow/70" : d === today ? "bg-muted" : "bg-default/50"
                    )} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
