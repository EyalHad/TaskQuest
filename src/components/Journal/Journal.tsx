import { useState, useEffect } from "react";
import { useStore } from "../../store";
import { BookOpen, Trash2, Zap, PenLine, Pencil } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";
import { cn } from "../../lib/utils";

const MOODS = [
  { key: "great", emoji: "😊", label: "Great" },
  { key: "good", emoji: "🙂", label: "Good" },
  { key: "neutral", emoji: "😐", label: "Neutral" },
  { key: "tired", emoji: "😴", label: "Tired" },
  { key: "stressed", emoji: "😰", label: "Stressed" },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function Journal() {
  const journalEntries = useStore((s) => s.journalEntries);
  const createJournalEntry = useStore((s) => s.createJournalEntry);
  const loadJournalEntries = useStore((s) => s.loadJournalEntries);
  const deleteJournalEntry = useStore((s) => s.deleteJournalEntry);
  const updateJournalEntry = useStore((s) => s.updateJournalEntry);

  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editMood, setEditMood] = useState<string | null>(null);

  useEffect(() => { loadJournalEntries(); }, [loadJournalEntries]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await createJournalEntry(content.trim(), mood || undefined);
    setContent(""); setMood(null);
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await deleteJournalEntry(id);
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-neon-purple" />
        <h1 className="text-lg font-bold text-primary">Journal</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div className="bg-card border border-subtle rounded-xl p-4 space-y-3">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What went well today? What to improve?"
            className="w-full bg-panel border border-default rounded-lg px-3 py-2.5 text-sm text-primary resize-none min-h-[100px] focus:outline-none focus:border-neon-purple/50"
            rows={4} />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {MOODS.map((m) => (
                <button key={m.key} onClick={() => setMood(mood === m.key ? null : m.key)}
                  title={m.label}
                  className={cn("text-lg p-1.5 rounded-lg transition-colors",
                    mood === m.key ? "bg-neon-purple/20 ring-1 ring-neon-purple/40" : "hover:bg-card-hover"
                  )}>
                  {m.emoji}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-glow" /> +5 XP
              </span>
              <button onClick={handleSubmit} disabled={!content.trim() || saving}
                className="px-4 py-2 text-xs font-medium bg-neon-purple/15 text-neon-purple border border-neon-purple/20 rounded-lg hover:bg-neon-purple/25 disabled:opacity-50 transition-colors">
                Save Entry
              </button>
            </div>
          </div>
        </div>

        {journalEntries.length === 0 && (
          <EmptyState icon={PenLine} title="Your journal is empty" subtitle="Write your first entry for +5 XP." />
        )}

        <div className="space-y-3">
          {journalEntries.map((entry) => {
            const moodDef = MOODS.find((m) => m.key === entry.mood);
            return (
              <div key={entry.id} className="bg-card border border-subtle rounded-xl p-4 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {moodDef && <span className="text-lg">{moodDef.emoji}</span>}
                    <span className="text-[11px] text-muted">{formatDate(entry.createdAt)}</span>
                  </div>
                  {editingEntryId !== entry.id && (
                  confirmDelete === entry.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(entry.id)} className="px-2 py-1 text-[10px] bg-crimson/20 text-crimson rounded border border-crimson/30">Delete</button>
                      <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-[10px] text-muted">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingEntryId(entry.id); setEditContent(entry.content); setEditMood(entry.mood); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-secondary transition-all rounded">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => setConfirmDelete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-crimson transition-all rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                  )}
                </div>
                {editingEntryId === entry.id ? (
                  <div className="space-y-2">
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-panel border border-default rounded-lg px-3 py-2 text-sm text-primary resize-none min-h-[80px] focus:outline-none" />
                    <div className="flex items-center gap-2">
                      <button onClick={async () => { await updateJournalEntry(entry.id, editContent.trim(), editMood); setEditingEntryId(null); }}
                        className="text-xs text-emerald-glow hover:underline">Save</button>
                      <button onClick={() => setEditingEntryId(null)} className="text-xs text-muted hover:underline">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
