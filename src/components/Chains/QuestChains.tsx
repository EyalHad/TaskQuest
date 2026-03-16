import { useState, useMemo } from "react";
import { useStore } from "../../store";
import { Link2, Plus, Trash2, ChevronUp, ChevronDown, X, CheckCircle, Circle } from "lucide-react";
import { cn } from "../../lib/utils";
import { EmptyState } from "../shared/EmptyState";

export function QuestChains() {
  const chains = useStore((s) => s.chains);
  const quests = useStore((s) => s.quests);
  const skills = useStore((s) => s.skills);
  const createChain = useStore((s) => s.createChain);
  const setQuestChain = useStore((s) => s.setQuestChain);
  const deleteChain = useStore((s) => s.deleteChain);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bonusGold, setBonusGold] = useState(50);
  const [bonusXp, setBonusXp] = useState(100);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [assigningChainId, setAssigningChainId] = useState<number | null>(null);

  const skillMap = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);

  const unchainedQuests = useMemo(
    () =>
      quests.filter(
        (q) => !q.chainId && !q.completed && !q.failed && !q.isArchived
      ),
    [quests]
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createChain(name.trim(), description.trim(), bonusGold, bonusXp);
    setName("");
    setDescription("");
    setBonusGold(50);
    setBonusXp(100);
    setShowForm(false);
  };

  const handleAssign = async (questId: number, chainId: number) => {
    const chainQuests = quests.filter((q) => q.chainId === chainId);
    const nextOrder = chainQuests.length;
    await setQuestChain(questId, chainId, nextOrder);
    setAssigningChainId(null);
  };

  const handleRemoveFromChain = async (questId: number) => {
    await setQuestChain(questId, null, 0);
  };

  const handleMoveUp = async (
    questId: number,
    chainId: number,
    currentOrder: number
  ) => {
    if (currentOrder === 0) return;
    const chainQuests = quests
      .filter((q) => q.chainId === chainId)
      .sort((a, b) => a.chainOrder - b.chainOrder);
    const prevQuest = chainQuests.find((q) => q.chainOrder === currentOrder - 1);
    if (prevQuest) {
      await setQuestChain(questId, chainId, currentOrder - 1);
      await setQuestChain(prevQuest.id, chainId, currentOrder);
    }
  };

  const handleMoveDown = async (
    questId: number,
    chainId: number,
    currentOrder: number,
    maxOrder: number
  ) => {
    if (currentOrder >= maxOrder) return;
    const chainQuests = quests
      .filter((q) => q.chainId === chainId)
      .sort((a, b) => a.chainOrder - b.chainOrder);
    const nextQuest = chainQuests.find((q) => q.chainOrder === currentOrder + 1);
    if (nextQuest) {
      await setQuestChain(questId, chainId, currentOrder + 1);
      await setQuestChain(nextQuest.id, chainId, currentOrder);
    }
  };

  const handleDelete = async (chainId: number) => {
    await deleteChain(chainId);
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <Link2 className="w-5 h-5 text-neon-purple" /> Quest Chains
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-neon-purple/15 text-neon-purple border border-neon-purple/20 rounded-lg hover:bg-neon-purple/25 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Chain
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Create form */}
        {showForm && (
          <div className="bg-card border border-subtle rounded-xl p-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chain name..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full bg-panel border border-default rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-neon-purple/50"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full bg-panel border border-default rounded-lg px-3 py-2 text-sm text-primary resize-none focus:outline-none focus:border-neon-purple/50"
            />
            <div className="flex gap-3">
              <div>
                <label className="text-[10px] text-muted block mb-1">
                  Bonus Gold
                </label>
                <input
                  type="number"
                  value={bonusGold}
                  onChange={(e) => setBonusGold(Number(e.target.value))}
                  min={0}
                  className="w-20 bg-panel border border-default rounded-lg px-2 py-1.5 text-sm text-gold text-center focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted block mb-1">
                  Bonus XP
                </label>
                <input
                  type="number"
                  value={bonusXp}
                  onChange={(e) => setBonusXp(Number(e.target.value))}
                  min={0}
                  className="w-20 bg-panel border border-default rounded-lg px-2 py-1.5 text-sm text-emerald-glow text-center focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="px-4 py-2 text-sm font-medium bg-neon-purple/20 text-neon-purple rounded-lg border border-neon-purple/30 hover:bg-neon-purple/30 disabled:opacity-50 transition-colors"
              >
                Create Chain
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-muted hover:text-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Chain cards */}
        {chains.length === 0 && !showForm && (
          <EmptyState
            icon={Link2}
            title="No quest chains"
            subtitle="Link quests into campaigns for bonus rewards."
            action={() => setShowForm(true)}
            actionLabel="Create Chain"
          />
        )}

        {chains.map((chain) => {
          const chainQuests = quests
            .filter((q) => q.chainId === chain.id)
            .sort((a, b) => a.chainOrder - b.chainOrder);
          const completed = chainQuests.filter((q) => q.completed).length;
          const total = chainQuests.length;
          const allDone = total > 0 && completed === total;
          const progress = total > 0 ? (completed / total) * 100 : 0;

          return (
            <div
              key={chain.id}
              className={cn(
                "bg-card border rounded-xl overflow-hidden",
                allDone
                  ? "border-gold/40 shadow-[0_0_20px_rgba(255,215,0,0.1)]"
                  : "border-subtle"
              )}
            >
              <div className="px-4 py-3 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "text-sm font-bold truncate",
                        allDone ? "text-gold" : "text-primary"
                      )}
                    >
                      {allDone && "🎉 "}
                      {chain.name}
                    </h3>
                    {allDone && (
                      <span className="text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                        COMPLETE
                      </span>
                    )}
                  </div>
                  {chain.description && (
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {chain.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-gold tabular-nums">
                      +{chain.bonusGold}g
                    </span>
                    <span className="text-[10px] text-emerald-glow tabular-nums">
                      +{chain.bonusXp} XP
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      setAssigningChainId(
                        assigningChainId === chain.id ? null : chain.id
                      )
                    }
                    className="p-1.5 text-muted hover:text-electric-blue rounded-lg hover:bg-card-hover transition-colors"
                    title="Assign quest"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {confirmDelete === chain.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(chain.id)}
                        className="text-[10px] text-crimson hover:underline"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] text-muted hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(chain.id)}
                      className="p-1.5 text-muted hover:text-crimson rounded-lg hover:bg-card-hover transition-colors"
                      title="Delete chain"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Assign dropdown */}
              {assigningChainId === chain.id && (
                <div className="px-4 pb-3">
                  <select
                    onChange={(e) => {
                      if (e.target.value)
                        handleAssign(Number(e.target.value), chain.id);
                      e.target.value = "";
                    }}
                    className="w-full bg-panel border border-default rounded-lg px-3 py-1.5 text-xs text-secondary focus:outline-none focus:border-electric-blue/50"
                  >
                    <option value="">Add a quest to this chain...</option>
                    {unchainedQuests.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.questName} ({q.skillId != null ? skillMap.get(q.skillId)?.name : "No skill"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quest list */}
              {chainQuests.length > 0 ? (
                <div className="border-t border-subtle">
                  {chainQuests.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-card-hover transition-colors group"
                    >
                      <span className="text-[10px] text-muted w-5 text-right tabular-nums">
                        {i + 1}.
                      </span>
                      {q.completed ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-glow shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-xs flex-1 truncate",
                          q.completed ? "text-muted line-through" : "text-secondary"
                        )}
                      >
                        {q.questName}
                      </span>
                      <span className="text-[10px] text-emerald-glow/60 tabular-nums">
                        +{q.xpReward} XP
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            handleMoveUp(q.id, chain.id, q.chainOrder)
                          }
                          disabled={i === 0}
                          className="p-0.5 text-muted hover:text-secondary disabled:opacity-20"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            handleMoveDown(
                              q.id,
                              chain.id,
                              q.chainOrder,
                              chainQuests.length - 1
                            )
                          }
                          disabled={i === chainQuests.length - 1}
                          className="p-0.5 text-muted hover:text-secondary disabled:opacity-20"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromChain(q.id)}
                          className="p-0.5 text-muted hover:text-crimson"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2 border-t border-subtle">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted">
                        Progress
                      </span>
                      <span className="text-[10px] text-secondary tabular-nums">
                        {completed}/{total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-default overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          allDone ? "bg-gold" : "bg-neon-purple"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4 border-t border-subtle text-center">
                  <p className="text-xs text-muted">No quests assigned</p>
                  <button
                    onClick={() => setAssigningChainId(chain.id)}
                    className="text-xs text-electric-blue hover:underline mt-1"
                  >
                    + Assign Quests
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
