import { useState } from "react";
import { useStore } from "../../store";
import { Shield, Plus, Trash2, Trophy } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Profile } from "../../types";

const AVATAR_OPTIONS = ["⚔️", "🛡️", "🧙", "🏹", "🗡️", "🔮", "👑", "🐉", "🦁", "🎯", "💎", "🔥"];

export function Home() {
  const profiles = useStore((s) => s.profiles);
  const setActiveProfile = useStore((s) => s.setActiveProfile);
  const createProfile = useStore((s) => s.createProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);
  const loading = useStore((s) => s.loading);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("⚔️");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [lbTab, setLbTab] = useState<"level" | "xp" | "gold">("level");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createProfile({ name: name.trim(), avatarIcon: avatar });
    setName("");
    setAvatar("⚔️");
    setShowCreate(false);
  };

  const handleDelete = async (id: number) => {
    await deleteProfile(id);
    setConfirmDelete(null);
  };

  return (
    <div className="h-screen flex items-center justify-center p-0 sm:p-2 lg:p-3 bg-frame-bg">
    <div className="w-full h-full max-w-[1600px] flex flex-col items-center justify-center bg-surface rounded-none sm:rounded-xl lg:rounded-2xl border border-frame-border overflow-y-auto shadow-2xl shadow-black/30">
      <div className="text-center mb-10 animate-in">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Shield className="w-10 h-10 text-electric-blue" style={{ filter: "drop-shadow(0 0 12px rgba(0,229,255,0.5))" }} />
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-electric-blue">TASK</span>
            <span className="text-primary">QUEST</span>
          </h1>
        </div>
        <p className="text-sm text-muted">Choose your hero to begin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 max-w-3xl w-full">
        {profiles.map((p) => (
          <ProfileCard
            key={p.id}
            profile={p}
            onSelect={() => setActiveProfile(p.id)}
            onDelete={() => setConfirmDelete(p.id)}
            isConfirmingDelete={confirmDelete === p.id}
            onConfirmDelete={() => handleDelete(p.id)}
            onCancelDelete={() => setConfirmDelete(null)}
          />
        ))}

        {/* Create New Profile Card */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="group flex flex-col items-center justify-center gap-3 min-h-[200px] rounded-2xl border-2 border-dashed border-default hover:border-electric-blue/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]"
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-default group-hover:border-electric-blue/50 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-muted group-hover:text-electric-blue transition-colors" />
            </div>
            <span className="text-sm text-muted group-hover:text-electric-blue font-medium transition-colors">
              Create Profile
            </span>
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-3 min-h-[200px] rounded-2xl bg-card/80 border border-electric-blue/20 p-5 animate-in shadow-[0_0_20px_rgba(0,229,255,0.1)]"
          >
            <div className="flex gap-2 flex-wrap justify-center">
              {AVATAR_OPTIONS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setAvatar(e)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all border",
                    avatar === e
                      ? "bg-electric-blue/20 border-electric-blue/40 scale-110"
                      : "bg-panel border-default hover:border-secondary"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hero name..."
              autoFocus
              className="w-full bg-panel border border-default rounded-xl px-4 py-2.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-electric-blue/50"
            />
            <div className="flex gap-2 mt-auto">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30 disabled:opacity-40 font-semibold text-sm py-2 rounded-xl transition-colors border border-electric-blue/20"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 text-sm text-muted hover:text-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {profiles.length >= 2 && (
        <div className="mt-8 max-w-2xl mx-auto">
          <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" /> Leaderboard
          </h2>
          <div className="flex gap-2 mb-3">
            {(["level", "xp", "gold"] as const).map(t => (
              <button key={t} onClick={() => setLbTab(t)}
                className={cn("px-3 py-1 text-xs rounded-lg transition-colors border",
                  lbTab === t ? "bg-electric-blue/15 text-electric-blue border-electric-blue/30" : "bg-card text-muted border-default hover:text-secondary"
                )}>
                {t === "level" ? "Level" : t === "xp" ? "Total XP" : "Gold"}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {[...profiles].sort((a, b) => {
              if (lbTab === "level") return b.currentLevel - a.currentLevel || b.totalXp - a.totalXp;
              if (lbTab === "xp") return b.totalXp - a.totalXp;
              return b.gold - a.gold;
            }).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 bg-card border border-subtle rounded-xl px-4 py-3">
                <span className={cn("text-lg font-black w-8 text-center",
                  i === 0 ? "text-gold" : i === 1 ? "text-secondary" : i === 2 ? "text-amber-600" : "text-muted"
                )}>
                  {i === 0 ? "👑" : `#${i + 1}`}
                </span>
                <span className="text-lg">{p.avatarIcon}</span>
                <span className="text-sm font-semibold text-primary flex-1">{p.name}</span>
                <span className="text-sm font-bold text-electric-blue tabular-nums">
                  {lbTab === "level" ? `Lv.${p.currentLevel}` : lbTab === "xp" ? `${p.totalXp} XP` : `${p.gold}g`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function ProfileCard({
  profile: p,
  onSelect,
  onDelete,
  isConfirmingDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  profile: Profile;
  onSelect: () => void;
  onDelete: () => void;
  isConfirmingDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const hpPercent = p.maxHp > 0 ? (p.hp / p.maxHp) * 100 : 0;

  return (
    <div
      onClick={isConfirmingDelete ? undefined : onSelect}
      className={cn(
        "group relative flex flex-col items-center rounded-2xl bg-card/80 border border-subtle p-5 min-h-[200px] cursor-pointer transition-all duration-300",
        "hover:border-electric-blue/30 hover:shadow-[0_0_25px_rgba(0,229,255,0.12)]",
        "animate-in"
      )}
    >
      {/* Delete button */}
      {!isConfirmingDelete ? (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-crimson transition-all rounded-lg hover:bg-crimson/10"
          title="Delete profile"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 flex gap-1 animate-in">
          <button onClick={onConfirmDelete} className="text-[10px] px-2 py-1 rounded-md bg-crimson/20 text-crimson border border-crimson/30 hover:bg-crimson/30">Delete</button>
          <button onClick={onCancelDelete} className="text-[10px] px-2 py-1 rounded-md text-secondary hover:text-primary">Cancel</button>
        </div>
      )}

      <span className="text-4xl mb-2">{p.avatarIcon}</span>
      <h3 className="text-base font-bold text-primary mb-1">{p.name}</h3>

      <div className="flex items-center gap-2 text-xs text-secondary mb-3">
        <span className="text-electric-blue font-bold">Lv. {p.currentLevel}</span>
        <span className="text-muted">|</span>
        <span className="text-gold font-semibold">{p.gold}g</span>
      </div>

      {/* HP bar */}
      <div className="w-full space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-crimson">HP</span>
          <span className="text-muted tabular-nums">{p.hp}/{p.maxHp}</span>
        </div>
        <div className="h-2 rounded-full bg-default overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${hpPercent}%`, background: "linear-gradient(90deg, #FF3366, #CC2952)" }}
          />
        </div>
      </div>

      <p className="text-[10px] text-muted mt-2 tabular-nums">{p.totalXp} XP total</p>
    </div>
  );
}
