import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Quest, SubTask, Tag } from "../../types";
import { useStore } from "../../store";
import { cn } from "../../lib/utils";
import {
  Skull,
  Trash2,
  Repeat,
  Pin,
  Archive,
  Calendar,
  FileText,
  Timer,
  Clock,
  Maximize,
  X,
  Coins,
  Sparkles,
  Lock,
} from "lucide-react";
import { XpFlyup } from "../Feedback/XpFlyup";
import { useFloatingReward } from "../Feedback/FloatingReward";
import { SubTaskList } from "./SubTaskList";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface Props {
  quest: Quest;
  skillName?: string;
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "";
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function daysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0;
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  return Math.max(0, diff);
}

function formatGraceRemaining(failedAt: string): string {
  const failed = new Date(failedAt);
  const expires = new Date(failed.getTime() + 24 * 60 * 60 * 1000);
  const remaining = expires.getTime() - Date.now();
  if (remaining <= 0) return "expired";
  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

export function TaskCard({ quest, skillName }: Props) {
  const toggleQuest = useStore((s) => s.toggleQuest);
  const failQuest = useStore((s) => s.failQuest);
  const deleteQuest = useStore((s) => s.deleteQuest);
  const archiveQuest = useStore((s) => s.archiveQuest);
  const rescheduleQuest = useStore((s) => s.rescheduleQuest);
  const togglePinQuest = useStore((s) => s.togglePinQuest);
  const updateQuestDescription = useStore((s) => s.updateQuestDescription);
  const startPomodoro = useStore((s) => s.startPomodoro);
  const startTracking = useStore((s) => s.startTracking);
  const stopTracking = useStore((s) => s.stopTracking);
  const setFocusQuest = useStore((s) => s.setFocusQuest);
  const toggleQuestSelection = useStore((s) => s.toggleQuestSelection);
  const xpBoost = useStore((s) => s.stats.xpBoostRemaining);
  const selectMode = useStore((s) => s.selectMode);
  const selectedQuestIds = useStore((s) => s.selectedQuestIds);
  const pomodoroQuestId = useStore((s) => s.pomodoroQuestId);
  const trackingQuestId = useStore((s) => s.trackingQuestId);
  const isBurnout = useStore((s) => s.stats.isBurnout);
  const dailyBounties = useStore((s) => s.dailyBounties);
  const firstBloodAvailable = useStore((s) => s.firstBloodAvailable);
  const comboCount = useStore((s) => s.comboCount);
  const recoverFailedQuest = useStore((s) => s.recoverFailedQuest);
  const streak = useStore((s) => s.stats.currentStreak);
  const quests = useStore((s) => s.quests);
  const addTagToQuest = useStore((s) => s.addTagToQuest);
  const removeTagFromQuest = useStore((s) => s.removeTagFromQuest);
  const setQuestDependency = useStore((s) => s.setQuestDependency);
  const toggleRecurring = useStore((s) => s.toggleRecurring);
  const updateRecurrencePattern = useStore((s) => s.updateRecurrencePattern);

  const [animating, setAnimating] = useState(false);
  const [showXp, setShowXp] = useState(false);
  const [shakeHp, setShakeHp] = useState(false);
  const [subTasksExpanded, setSubTasksExpanded] = useState(false);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [editDescription, setEditDescription] = useState(quest.description);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmFail, setConfirmFail] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const { showReward } = useFloatingReward();
  const cardRef = useRef<HTMLDivElement>(null);

  const overdueDays = daysOverdue(quest.dueDate);
  const isOverdue = overdueDays > 0;

  const loadSubTasks = useCallback(async () => {
    try {
      const data = await invoke<SubTask[]>("get_sub_tasks", { questId: quest.id });
      setSubTasks(data);
    } catch {
      setSubTasks([]);
    }
  }, [quest.id]);

  const loadTags = useCallback(async () => {
    try {
      const data = await invoke<Tag[]>("get_tags_for_quest", { questId: quest.id });
      setTags(data);
    } catch {
      setTags([]);
    }
  }, [quest.id]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);
  useEffect(() => {
    if (subTasksExpanded) loadSubTasks();
  }, [subTasksExpanded, loadSubTasks]);

  const handleComplete = async () => {
    setShowXp(true);
    setAnimating(true);
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      showReward(`+${effectiveXp} XP`, "#00FF66", rect.left + rect.width / 2, rect.top);
      setTimeout(() => showReward(`+${estimatedGold}g`, "#FFD700", rect.left + rect.width / 2 + 40, rect.top + 5), 200);
    }
    setTimeout(() => toggleQuest(quest.id), 400);
  };

  const handleFail = async () => {
    setShakeHp(true);
    setAnimating(true);
    document.querySelector(".hp-bar")?.classList.add("hp-shake");
    setTimeout(() => {
      document.querySelector(".hp-bar")?.classList.remove("hp-shake");
    }, 500);
    setTimeout(() => failQuest(quest.id), 400);
  };

  const clearXp = useCallback(() => setShowXp(false), []);

  const handleSaveDescription = () => {
    if (editDescription !== quest.description) {
      updateQuestDescription(quest.id, editDescription);
    }
    setDescriptionExpanded(false);
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    await addTagToQuest(quest.id, newTagName.trim());
    setNewTagName("");
    setAddingTag(false);
    loadTags();
  };

  const handleRemoveTag = async (tagId: number) => {
    await removeTagFromQuest(quest.id, tagId);
    loadTags();
  };

  const typeColor =
    quest.questType === "monthly"
      ? "text-neon-purple border-neon-purple/30 bg-neon-purple/10"
      : quest.questType === "weekly"
        ? "text-electric-blue border-electric-blue/30 bg-electric-blue/10"
        : "text-emerald-glow border-emerald-glow/30 bg-emerald-glow/10";

  const effectiveXp = (() => {
    let xp = xpBoost > 0 ? quest.xpReward * 2 : quest.xpReward;
    if (isBurnout) xp = Math.round(xp * 0.5);
    return xp;
  })();

  const isBounty = dailyBounties.includes(quest.id);

  const estimatedGold = (() => {
    const baseGold = quest.difficulty === "easy" ? 5 : quest.difficulty === "hard" ? 20 : quest.difficulty === "epic" ? 40 : 10;
    const typeMult = quest.questType === "weekly" ? 1.5 : quest.questType === "monthly" ? 2.0 : 1.0;
    const streakMult = streak >= 30 ? 1.75 : streak >= 14 ? 1.5 : streak >= 7 ? 1.25 : streak >= 3 ? 1.1 : 1.0;
    let g = Math.round(baseGold * typeMult * streakMult);
    if (isBurnout) g = Math.round(g * 0.5);
    if (isBounty) g *= 2;
    return g;
  })();

  const difficultyBorder =
    quest.difficulty === "easy"
      ? "border-l-4 border-l-default"
      : quest.difficulty === "hard"
        ? "border-l-4 border-l-orange-500"
        : quest.difficulty === "epic"
          ? "border-l-4 border-l-gold border-l-gold/50 shadow-[0_0_12px_rgba(255,215,0,0.3)] animate-pulse"
          : "";

  const priorityUrgent = quest.priority === "urgent" ? "border-l-red-500/80 animate-pulse" : "";
  const priorityLow = quest.priority === "low" ? "opacity-75" : "";

  const overdueBorder =
    overdueDays >= 3
      ? "border-l-4 border-l-crimson animate-pulse"
      : overdueDays >= 1
        ? "border-l-4 border-l-amber-500"
        : "";

  const blockerQuest = quest.blockedByQuestId ? quests.find((q) => q.id === quest.blockedByQuestId) : null;
  const isBlocked = !!blockerQuest && !blockerQuest.completed;

  const isSelected = selectedQuestIds.includes(quest.id);
  const isPomodoroActive = pomodoroQuestId === quest.id;
  const isTracking = trackingQuestId === quest.id;

  const completedSubCount = subTasks.filter((s) => s.completed).length;
  const totalSubCount = subTasks.length;

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex flex-col rounded-xl border border-subtle transition-all duration-200",
        isBounty && !quest.completed && "bounty-glow",
        quest.isBoss
          ? "bg-card/90 border-2 border-gold/40 bg-gradient-to-r from-crimson/10 to-neon-purple/10 shadow-[0_0_20px_rgba(255,51,102,0.15),0_0_12px_rgba(255,215,0,0.15)] scale-[1.02]"
          : "bg-card",
        "hover:border-electric-blue/30 hover:shadow-[0_0_10px_rgba(0,229,255,0.1)]",
        difficultyBorder,
        priorityUrgent,
        priorityLow,
        overdueBorder,
        animating && !shakeHp && "quest-complete-out",
        animating && shakeHp && "animate-fade-out"
      )}
    >
      {quest.failed && quest.failedAt && (
        <div className="absolute inset-0 bg-amber-500/5 border-2 border-amber-500/40 rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-sm font-semibold text-amber-400">Failed — Recover?</p>
            <p className="text-[10px] text-secondary mb-2">
              Grace period: {formatGraceRemaining(quest.failedAt)}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => recoverFailedQuest(quest.id)}
                className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium hover:bg-amber-500/30 transition-colors">
                Recover
              </button>
            </div>
          </div>
        </div>
      )}
      {isBlocked && (
        <div className="absolute inset-0 z-10 bg-panel/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <Lock className="w-4 h-4" />
            <span>Blocked by: {blockerQuest!.questName}</span>
          </div>
        </div>
      )}
      {showXp && <XpFlyup xp={effectiveXp} boosted={xpBoost > 0} onDone={clearXp} />}

      <div className="flex items-start gap-3 px-4 py-3">
        {selectMode && (
          <button
            onClick={() => toggleQuestSelection(quest.id)}
            className="shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all border-default hover:border-electric-blue"
          >
            {isSelected && (
              <svg className="w-3 h-3 text-electric-blue" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={handleComplete}
          disabled={isBlocked}
          className={cn(
            "w-5 h-5 rounded-md border-2 border-default hover:border-emerald-glow flex items-center justify-center shrink-0 transition-all mt-0.5",
            animating && !shakeHp && "bg-emerald-glow/30 border-emerald-glow",
            isBlocked && "opacity-30 cursor-not-allowed"
          )}
          title="Complete quest"
        >
          {animating && !shakeHp && (
            <svg className="w-3 h-3 text-emerald-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm text-primary truncate font-medium">{quest.isBoss && "👑 "}{quest.questName}</p>
            {quest.isBoss && <Skull className="w-4 h-4 text-crimson shrink-0" />}
            {quest.isRecurring && <Repeat className="w-3 h-3 text-electric-blue/60 shrink-0" />}
            {isBounty && (
              <span className="text-[10px] font-bold text-gold bg-gold/15 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Daily Bounty — 2× Gold!">
                <Coins className="w-3 h-3" /> 2×
              </span>
            )}
            {quest.chainId !== null && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neon-purple/15 text-neon-purple border border-neon-purple/20" title="Part of quest chain">
                ⛓️ #{quest.chainOrder + 1}
              </span>
            )}
            {firstBloodAvailable && !quest.completed && (
              <span title="First Blood bonus available"><Sparkles className="w-3 h-3 text-gold/60 shrink-0" /></span>
            )}
            {isOverdue && (
              <span className="text-[10px] font-bold text-crimson bg-crimson/20 px-1.5 py-0.5 rounded">Overdue</span>
            )}
          </div>
          {skillName && <p className="text-[11px] text-muted truncate mt-0.5">{skillName}</p>}
          {(tags.length > 0 || !quest.completed) && (
            <div className="flex flex-wrap gap-1 mt-1 items-center">
              {tags.map((t) => (
                <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full bg-default/80 text-secondary flex items-center gap-1 group/tag">
                  {t.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(t.id);
                    }}
                    className="opacity-0 group-hover/tag:opacity-100 text-muted hover:text-crimson transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {!quest.completed && !addingTag && (
                <button
                  onClick={() => setAddingTag(true)}
                  className="text-[10px] px-1.5 py-0.5 rounded-full border border-dashed border-default text-muted hover:text-secondary hover:border-secondary transition-colors"
                >
                  +
                </button>
              )}
              {addingTag && (
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="tag..."
                  autoFocus
                  className="text-[10px] w-20 bg-panel border border-default rounded-full px-2 py-0.5 text-secondary focus:outline-none focus:border-electric-blue/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTag();
                    if (e.key === "Escape") {
                      setAddingTag(false);
                      setNewTagName("");
                    }
                  }}
                  onBlur={() => {
                    if (!newTagName.trim()) {
                      setAddingTag(false);
                      setNewTagName("");
                    }
                  }}
                />
              )}
            </div>
          )}
          {quest.dueDate && (
            <p className="text-[10px] text-muted mt-0.5">{formatDueDate(quest.dueDate)}</p>
          )}
        </div>

        <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border shrink-0", typeColor)}>
          {quest.questType}
        </span>

        <span className="text-xs font-semibold text-emerald-glow tabular-nums shrink-0" title="Estimated — actual rewards vary based on streak, equipment, and bonuses">
          +{effectiveXp}
          {isBurnout && <span className="text-[10px] text-crimson ml-0.5">(½)</span>}
        </span>
        <span className="text-xs font-semibold text-gold tabular-nums shrink-0 flex items-center gap-0.5" title="Estimated — actual rewards vary based on streak, equipment, and bonuses">
          <Coins className="w-3 h-3" />{estimatedGold}
        </span>
        {quest.estimatedMinutes != null && (
          <span
            className={cn(
              "text-[10px] tabular-nums shrink-0",
              quest.timeSpentSeconds > quest.estimatedMinutes * 60 ? "text-crimson" : "text-muted"
            )}
          >
            {Math.round(quest.timeSpentSeconds / 60)}m/{quest.estimatedMinutes}m
          </span>
        )}
        {comboCount > 0 && !quest.completed && (
          <span className="text-[10px] font-black text-gold bg-gold/15 px-1.5 py-0.5 rounded combo-pulse">
            {comboCount + 1}× COMBO
          </span>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => togglePinQuest(quest.id)}
            className={cn(
              "p-1 rounded-md transition-all",
              quest.isPinned ? "text-electric-blue opacity-100" : "opacity-0 group-hover:opacity-100 text-muted hover:text-electric-blue"
            )}
            title="Pin quest"
          >
            <Pin className={cn("w-4 h-4", quest.isPinned && "fill-electric-blue/30")} />
          </button>
          {quest.description && (
            <button
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-electric-blue transition-all rounded-md"
              title="Toggle description"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          {!isPomodoroActive && (
            <button
              onClick={() => startPomodoro(quest.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-electric-blue transition-all rounded-md"
              title="Start Pomodoro"
            >
              <Timer className="w-4 h-4" />
            </button>
          )}
          {!isTracking ? (
            <button
              onClick={() => startTracking(quest.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-electric-blue transition-all rounded-md"
              title="Start time tracking"
            >
              <Clock className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => stopTracking()}
              className="p-1 text-electric-blue rounded-md"
              title="Stop tracking"
            >
              <Clock className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setFocusQuest(quest.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-electric-blue transition-all rounded-md"
            title="Focus mode"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmFail(true)}
            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-crimson transition-all rounded-md hover:bg-crimson/10"
            title="Fail quest"
          >
            <Skull className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRescheduleOpen(!rescheduleOpen)}
            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-electric-blue transition-all rounded-md"
            title="Reschedule quest"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => archiveQuest(quest.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-secondary transition-all rounded-md"
            title="Archive quest"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-crimson transition-all rounded-md"
            title="Delete quest"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {rescheduleOpen && (
        <div className="px-4 pb-3 border-t border-subtle pt-2 flex items-center gap-2">
          <input
            type="date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="bg-card border border-default rounded-lg px-2 py-1 text-xs text-secondary focus:outline-none focus:border-electric-blue/50"
          />
          <button
            onClick={async () => {
              if (rescheduleDate) {
                await rescheduleQuest(quest.id, rescheduleDate);
                setRescheduleOpen(false);
                setRescheduleDate("");
              }
            }}
            disabled={!rescheduleDate}
            className="px-3 py-1 text-xs font-medium bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30 disabled:opacity-40"
          >
            Set
          </button>
          <button
            onClick={() => { setRescheduleOpen(false); setRescheduleDate(""); }}
            className="text-xs text-muted hover:text-secondary"
          >
            Cancel
          </button>
        </div>
      )}
      {descriptionExpanded && quest.description && (
        <div className="px-4 pb-3 border-t border-subtle pt-2">
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onBlur={handleSaveDescription}
            className="w-full bg-panel/80 border border-default rounded-lg px-3 py-2 text-sm text-primary resize-none min-h-[60px] focus:outline-none focus:border-electric-blue/50"
            placeholder="Description..."
            autoFocus
          />
          <button
            onClick={() => setDescriptionExpanded(false)}
            className="mt-2 p-1 text-muted hover:text-secondary rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="border-t border-subtle">
        <button
          onClick={() => setSubTasksExpanded(!subTasksExpanded)}
          className="w-full flex items-center justify-between px-4 py-2 text-left text-xs text-secondary hover:bg-card/50 transition-colors"
        >
          <span>Sub-tasks</span>
          {subTasksExpanded && totalSubCount > 0 && (
            <span className="font-mono bg-default/80 px-2 py-0.5 rounded">
              {completedSubCount}/{totalSubCount}
            </span>
          )}
        </button>
        {subTasksExpanded && (
          <div className="px-4 pb-3">
            <SubTaskList questId={quest.id} subTasks={subTasks} onUpdate={loadSubTasks} />
            <div className="mt-2 pt-2 border-t border-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Blocked by:</span>
                <select
                  value={quest.blockedByQuestId ?? ""}
                  onChange={async (e) => {
                    await setQuestDependency(quest.id, e.target.value ? Number(e.target.value) : null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card border border-default rounded-lg px-2 py-1 text-xs text-secondary focus:outline-none max-w-[200px]"
                >
                  <option value="">None</option>
                  {quests.filter(q => q.id !== quest.id && !q.completed && !q.failed && !q.isArchived && q.blockedByQuestId !== quest.id).map(q => (
                    <option key={q.id} value={q.id}>{q.questName}</option>
                  ))}
                </select>
              </div>
            </div>
            {(quest.isRecurring || quest.recurrencePattern) && (
              <div className="mt-2 pt-2 border-t border-subtle space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    Repeats: {quest.recurrencePattern ?? "none"}
                    {!quest.isRecurring && quest.recurrencePattern && (
                      <span className="text-amber-400 text-[10px]">(paused)</span>
                    )}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); toggleRecurring(quest.id); }}
                    className={cn("text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      quest.isRecurring
                        ? "text-emerald-glow border-emerald-glow/20 hover:bg-emerald-glow/10"
                        : "text-amber-400 border-amber-400/20 hover:bg-amber-400/10"
                    )}>
                    {quest.isRecurring ? "Active" : "Paused"}
                  </button>
                </div>
                <select value={quest.recurrencePattern ?? "daily"}
                  onChange={(e) => { e.stopPropagation(); updateRecurrencePattern(quest.id, e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card border border-default rounded-lg px-2 py-1 text-xs text-secondary focus:outline-none">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Quest"
        message={`Are you sure you want to delete "${quest.questName}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { deleteQuest(quest.id); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={confirmFail}
        title="Fail Quest"
        message={`Mark "${quest.questName}" as failed? You'll take HP damage in 24h unless recovered.`}
        confirmLabel="Fail Quest"
        variant="warning"
        onConfirm={() => { handleFail(); setConfirmFail(false); }}
        onCancel={() => setConfirmFail(false)}
      />
    </div>
  );
}
