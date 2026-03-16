import { useState, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore } from "../../store";
import { StatsBar } from "./StatsBar";
import { DailyChallenges } from "./DailyChallenges";
import { TaskCard } from "./TaskCard";
import { KanbanView } from "./KanbanView";
import {
  Plus,
  Repeat,
  Lightbulb,
  Pin,
  ChevronDown,
  ChevronUp,
  Skull,
  X,
  CheckSquare,
  Search,
  LayoutList,
  Columns3,
  GripVertical,
  FileText,
} from "lucide-react";
import type { QuestType, Difficulty, Priority } from "../../types";
import { getDailyQuote } from "../../lib/quotes";
import { getActiveEvent } from "../../lib/seasonal";
import { cn } from "../../lib/utils";
import { PageSkeleton, StatsBarSkeleton } from "../shared/Skeleton";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "normal", label: "Normal" },
  { value: "hard", label: "Hard" },
  { value: "epic", label: "Epic" },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
];

export function QuestBoard() {
  const quests = useStore((s) => s.quests);
  const skills = useStore((s) => s.skills);
  const setPage = useStore((s) => s.setPage);
  const addCatalogBundle = useStore((s) => s.addCatalogBundle);
  const bundles = useStore((s) => s.bundles);
  const tags = useStore((s) => s.tags);
  const templates = useStore((s) => s.templates);
  const createQuest = useStore((s) => s.createQuest);
  const createQuestFromTemplate = useStore((s) => s.createQuestFromTemplate);
  const loadArchivedQuests = useStore((s) => s.loadArchivedQuests);
  const getSmartSuggestions = useStore((s) => s.getSmartSuggestions);
  const setSelectMode = useStore((s) => s.setSelectMode);
  const selectMode = useStore((s) => s.selectMode);
  const selectedQuestIds = useStore((s) => s.selectedQuestIds);
  const toggleQuest = useStore((s) => s.toggleQuest);
  const archiveQuest = useStore((s) => s.archiveQuest);
  const unarchiveQuest = useStore((s) => s.unarchiveQuest);
  const archivedQuests = useStore((s) => s.archivedQuests);
  const deleteQuest = useStore((s) => s.deleteQuest);
  const openSkillBank = useStore((s) => s.openSkillBank);
  const loading = useStore((s) => s.loading);
  const activeProfileId = useStore((s) => s.activeProfileId);
  const profiles = useStore((s) => s.profiles);
  const comboCount = useStore((s) => s.comboCount);
  const dailyBounties = useStore((s) => s.dailyBounties);

  const [name, setName] = useState("");
  const [questType, setQuestType] = useState<QuestType>("daily");
  const [skillId, setSkillId] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [priority, setPriority] = useState<Priority>("normal");
  const [isBoss, setIsBoss] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [quoteDismissed, setQuoteDismissed] = useState(false);
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [questTagsMap, setQuestTagsMap] = useState<Map<number, number[]>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState<number | null>(null);
  const [quickFilter, setQuickFilter] = useState<"due_today" | "overdue" | "boss" | "bounty" | "hard" | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">(() => (localStorage.getItem("questboard_view") as "list" | "kanban") || "list");
  const [draggedQuestId, setDraggedQuestId] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [questSuggestions, setQuestSuggestions] = useState<string[]>([]);
  const [blockedBy, setBlockedBy] = useState<number | null>(null);

  const reorderQuests = useStore((s) => s.reorderQuests);
  const getCatalogSuggestions = useStore((s) => s.getCatalogSuggestions);
  const setQuestDependency = useStore((s) => s.setQuestDependency);

  const leafSkills = useMemo(() => skills.filter((s) => !skills.some((o) => o.parentSkillId === s.id)), [skills]);
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const defaultSkillId = activeProfile?.defaultSkillId ?? leafSkills[0]?.id ?? 0;

  useEffect(() => {
    if (skillId === 0 && defaultSkillId) {
      setSkillId(defaultSkillId);
    }
  }, [defaultSkillId]);

  useEffect(() => {
    getSmartSuggestions().then(setSuggestions);
  }, []);

  useEffect(() => {
    if (skillId && showForm) {
      getCatalogSuggestions(skillId).then(setQuestSuggestions);
    } else {
      setQuestSuggestions([]);
    }
  }, [skillId, showForm, getCatalogSuggestions]);

  const activeQuests = quests.filter((q) => !q.completed && !q.failed && !q.isArchived);
  const pinnedQuests = activeQuests.filter((q) => q.isPinned);
  const unpinnedQuests = activeQuests.filter((q) => !q.isPinned);
  const completedQuests = quests.filter((q) => q.completed);
  const failedQuests = quests.filter((q) => q.failed);

  const skillMap = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);

  const sortedUnpinned = unpinnedQuests;

  useEffect(() => {
    if (tagFilter === null || sortedUnpinned.length === 0) {
      setQuestTagsMap(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        sortedUnpinned.map(async (q) => {
          try {
            const t = await invoke<{ id: number }[]>("get_tags_for_quest", { questId: q.id });
            return { questId: q.id, tagIds: t.map((x) => x.id) };
          } catch {
            return { questId: q.id, tagIds: [] as number[] };
          }
        })
      );
      if (!cancelled) {
        const map = new Map<number, number[]>();
        results.forEach((r) => map.set(r.questId, r.tagIds));
        setQuestTagsMap(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tagFilter, sortedUnpinned]);

  const displayedUnpinned =
    tagFilter === null
      ? sortedUnpinned
      : sortedUnpinned.filter((q) => questTagsMap.get(q.id)?.includes(tagFilter) ?? false);

  const applyFilters = useCallback(
    (list: typeof displayedUnpinned) => {
      let result = list;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(
          (quest) =>
            quest.questName.toLowerCase().includes(q) || quest.description?.toLowerCase().includes(q)
        );
      }
      if (skillFilter !== null) {
        result = result.filter((quest) => quest.skillId === skillFilter);
      }
      if (quickFilter) {
        const today = new Date().toISOString().slice(0, 10);
        result = result.filter((quest) => {
          switch (quickFilter) {
            case "due_today":
              return quest.dueDate?.slice(0, 10) === today;
            case "overdue":
              return (
                quest.dueDate &&
                quest.dueDate.slice(0, 10) < today &&
                !quest.completed &&
                !quest.failed
              );
            case "boss":
              return quest.isBoss;
            case "bounty":
              return dailyBounties.includes(quest.id);
            case "hard":
              return quest.difficulty === "hard" || quest.difficulty === "epic";
            default:
              return true;
          }
        });
      }
      return result;
    },
    [searchQuery, skillFilter, quickFilter, dailyBounties]
  );

  const filteredPinned = applyFilters(pinnedQuests);
  const filteredUnpinned = applyFilters(displayedUnpinned);

  const handleDrop = async (targetIdx: number) => {
    if (draggedQuestId === null) return;
    const currentOrder = filteredUnpinned.map((q) => q.id);
    const fromIdx = currentOrder.indexOf(draggedQuestId);
    if (fromIdx === -1 || fromIdx === targetIdx) return;
    currentOrder.splice(fromIdx, 1);
    currentOrder.splice(targetIdx, 0, draggedQuestId);
    await reorderQuests(currentOrder);
    setDraggedQuestId(null);
    setDragOverIdx(null);
  };

  useEffect(() => {
    localStorage.setItem("questboard_view", viewMode);
  }, [viewMode]);

  const overdueCount = activeQuests.filter((q) => {
    if (!q.dueDate) return false;
    return new Date(q.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  }).length;

  const recurringCount = (questId: number) =>
    completedQuests.filter((q) => q.parentQuestId === questId || q.id === questId).length;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const created = await createQuest({
      questName: name.trim(),
      description: description.trim() || undefined,
      questType,
      skillId: skillId || undefined,
      xpReward: questType === "monthly" ? 50 : questType === "weekly" ? 25 : 10,
      isRecurring: isRecurring || undefined,
      recurrencePattern: isRecurring ? questType : undefined,
      difficulty,
      priority,
      isBoss,
      estimatedMinutes,
      dueDate: dueDate || undefined,
    });
    if (blockedBy && created) {
      await setQuestDependency(created.id, blockedBy);
    }
    setName("");
    setShowForm(false);
    setIsRecurring(false);
    setIsBoss(false);
    setEstimatedMinutes(undefined);
    setDueDate("");
    setDescription("");
    setShowDescription(false);
    setBlockedBy(null);
  };

  const handleBatchComplete = async () => {
    for (const id of selectedQuestIds) {
      await toggleQuest(id);
    }
    setSelectMode(false);
  };

  const handleBatchArchive = async () => {
    for (const id of selectedQuestIds) {
      await archiveQuest(id);
    }
    setSelectMode(false);
  };

  const handleBatchDelete = async () => {
    for (const id of selectedQuestIds) {
      await deleteQuest(id);
    }
    setSelectMode(false);
  };

  const quoteCategory = (() => {
    const skillQuestCount = new Map<string, number>();
    for (const q of activeQuests) {
      const skill = skillMap.get(q.skillId);
      if (skill) {
        const cat = skill.category;
        skillQuestCount.set(cat, (skillQuestCount.get(cat) ?? 0) + 1);
      }
    }
    let maxCat = "INT";
    let maxCount = 0;
    for (const [cat, count] of skillQuestCount) {
      if (count > maxCount) {
        maxCount = count;
        maxCat = cat;
      }
    }
    return maxCat;
  })();

  const leafSkillsForBanner = skills.filter(
    (s) =>
      s.parentSkillId !== null &&
      skills.some((p) => p.id === s.parentSkillId && p.parentSkillId !== null)
  );
  const hasSkills = leafSkillsForBanner.length > 0 || skills.length > 0;

  const initialized = useStore((s) => s.initialized);
  if (!initialized) {
    return (
      <div className="flex flex-col h-full flex-1 min-h-0">
        <StatsBarSkeleton />
        <PageSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 min-h-0">
      <StatsBar />
      <DailyChallenges />
      {comboCount > 0 && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center gap-2 combo-pulse">
          <span className="text-sm font-black text-gold">🔥 {comboCount + 1}× COMBO!</span>
          <span className="text-[10px] text-gold/70">+{comboCount * 2} bonus XP</span>
        </div>
      )}

      {(() => {
        const event = getActiveEvent();
        if (!event) return null;
        return (
          <div className="mx-4 mt-2 bg-gold/5 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{event.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gold">{event.name}</p>
              <p className="text-xs text-secondary">{event.description}</p>
            </div>
          </div>
        );
      })()}

      {!hasSkills && (
        <div className="mx-5 mt-4 bg-card border border-electric-blue/20 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-primary mb-2">Your skill tree is empty!</h3>
          <p className="text-sm text-secondary mb-4">
            Browse the{" "}
            <button
              onClick={() => setPage("catalog")}
              className="text-electric-blue hover:underline font-medium"
            >
              Skill Catalog
            </button>{" "}
            to add skills, or pick a Quick Start bundle:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {bundles.map((b) => (
              <button
                key={b.key}
                onClick={() => addCatalogBundle(b.key)}
                className="px-4 py-2 rounded-lg bg-default border border-default text-sm font-medium text-primary hover:bg-card-hover hover:border-electric-blue/30 transition-all"
              >
                {b.icon} {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg font-bold text-primary">Quest Board</h1>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quests..."
                className="w-full bg-card border border-default rounded-lg pl-9 pr-8 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-electric-blue/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={skillFilter ?? ""}
              onChange={(e) => setSkillFilter(e.target.value ? Number(e.target.value) : null)}
              className="bg-card border border-default rounded-lg px-2 py-1.5 text-xs text-secondary focus:outline-none max-w-[140px]"
            >
              <option value="">All Skills</option>
              {leafSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-card rounded-lg border border-default p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "list" ? "bg-default text-electric-blue" : "text-muted hover:text-secondary"
                )}
                title="List view"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "kanban" ? "bg-default text-electric-blue" : "text-muted hover:text-secondary"
                )}
                title="Kanban view"
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>
            {overdueCount > 0 && (
              <span className="text-xs font-bold text-crimson bg-crimson/20 px-2 py-0.5 rounded">
                {overdueCount} overdue
              </span>
            )}
            <button
              onClick={() => setSelectMode(!selectMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                selectMode
                  ? "bg-electric-blue/20 text-electric-blue border border-electric-blue/30"
                  : "bg-card text-secondary border border-default hover:text-primary"
              )}
            >
              <CheckSquare className="w-4 h-4" />
              Select
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <details open={suggestionsOpen} className="group">
            <summary
              className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-secondary select-none"
              onClick={(e) => {
                e.preventDefault();
                setSuggestionsOpen(!suggestionsOpen);
              }}
            >
              {suggestionsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              <Lightbulb className="w-4 h-4 text-gold" />
              Smart suggestions
            </summary>
            <ul className="mt-2 space-y-1 pl-6">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                  <Lightbulb className="w-3.5 h-3.5 text-gold/60 shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </details>
        )}

        {!quoteDismissed && (
          <div className="flex items-start gap-2 py-2 px-3 bg-panel/50 rounded-lg border border-default">
            <p className="flex-1 text-sm italic text-muted">{getDailyQuote(quoteCategory)}</p>
            <button
              onClick={() => setQuoteDismissed(true)}
              className="p-1 text-muted hover:text-secondary rounded shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTagFilter(null)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              tagFilter === null
                ? "bg-electric-blue/20 text-electric-blue border border-electric-blue/30"
                : "bg-card text-muted border border-default hover:text-secondary"
            )}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => setTagFilter(tagFilter === t.id ? null : t.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                tagFilter === t.id
                  ? "bg-electric-blue/20 text-electric-blue border border-electric-blue/30"
                  : "bg-card text-muted border border-default hover:text-secondary"
              )}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 px-4 mt-2">
          {(
            [
              { key: "due_today" as const, label: "Due Today", activeClass: "bg-electric-blue/15 text-electric-blue border-electric-blue/30" },
              { key: "overdue" as const, label: "Overdue", activeClass: "bg-crimson/15 text-crimson border-crimson/30" },
              { key: "boss" as const, label: "Boss", activeClass: "bg-neon-purple/15 text-neon-purple border-neon-purple/30" },
              { key: "bounty" as const, label: "Bounty", activeClass: "bg-gold/15 text-gold border-gold/30" },
              { key: "hard" as const, label: "Hard+", activeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
            ] as const
          ).map(({ key, label, activeClass }) => (
            <button
              key={key}
              onClick={() => setQuickFilter(quickFilter === key ? null : key)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors border",
                quickFilter === key ? activeClass : "bg-card/50 text-muted border-subtle hover:text-secondary"
              )}
            >
              {label}
            </button>
          ))}
          {(searchQuery || skillFilter !== null || quickFilter) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSkillFilter(null);
                setQuickFilter(null);
              }}
              className="px-2.5 py-1 text-[11px] text-electric-blue hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {viewMode === "kanban" ? (
          <KanbanView />
        ) : (
          <>
        {filteredPinned.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold text-electric-blue mb-2">
              <Pin className="w-4 h-4" />
              Focus ({filteredPinned.length})
            </h2>
            <div className="space-y-2">
              {filteredPinned.map((q, i) => (
                <div key={q.id} className="card-stagger ring-1 ring-electric-blue/40 rounded-xl overflow-hidden" style={{ animationDelay: `${i * 0.04}s` }}>
                  <TaskCard quest={q} skillName={skillMap.get(q.skillId)?.name} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="flex items-center justify-between text-sm font-bold text-primary mb-2">
            Active Quests
            <span className="text-xs font-normal text-muted tabular-nums">
              {filteredUnpinned.length} quest{filteredUnpinned.length !== 1 ? "s" : ""}
            </span>
          </h2>
          {filteredUnpinned.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted text-sm">
                {tagFilter ? "No quests with this tag." : searchQuery || skillFilter !== null || quickFilter ? "No quests match your filters." : "No active quests."}
              </p>
              <p className="text-muted text-xs mt-1">
                {tagFilter ? "Clear the tag filter or add one to begin." : searchQuery || skillFilter !== null || quickFilter ? "Try clearing filters." : "Add one to begin your adventure."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUnpinned.map((q, i) => (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => setDraggedQuestId(q.id)}
                  onDragEnd={() => {
                    setDraggedQuestId(null);
                    setDragOverIdx(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(i);
                  }}
                  onDrop={() => handleDrop(i)}
                  className={cn(
                    "card-stagger flex items-center gap-1 group/drag",
                    draggedQuestId === q.id && "opacity-50",
                    dragOverIdx === i && draggedQuestId !== q.id && "border-t-2 border-electric-blue"
                  )}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="opacity-0 group-hover/drag:opacity-100 cursor-grab active:cursor-grabbing shrink-0 p-1">
                    <GripVertical className="w-3.5 h-3.5 text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <TaskCard quest={q} skillName={skillMap.get(q.skillId)?.name} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
          </>
        )}

        <details
          open={historyOpen}
          onToggle={(e) => setHistoryOpen((e.target as HTMLDetailsElement).open)}
          className="group"
        >
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted hover:text-secondary select-none">
            {historyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            History ({completedQuests.length + failedQuests.length})
          </summary>
          <div className="mt-3 space-y-1.5">
            {completedQuests.map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-lg bg-card/40 px-4 py-2 opacity-50">
                <div className="w-4 h-4 rounded-md bg-emerald-glow/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-emerald-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-muted line-through truncate flex-1">{q.questName}</span>
                {q.isRecurring && (
                  <span className="text-[10px] text-electric-blue/60 flex items-center gap-0.5">
                    <Repeat className="w-3 h-3" /> ×{recurringCount(q.id)}
                  </span>
                )}
                <span className="text-xs text-emerald-glow/60">+{q.xpReward}</span>
              </div>
            ))}
            {failedQuests.map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-lg bg-crimson/5 border border-crimson/10 px-4 py-2 opacity-50">
                <div className="w-4 h-4 rounded-md bg-crimson/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-sm text-muted line-through truncate flex-1">{q.questName}</span>
                <span className="text-xs text-crimson/60">-10 HP</span>
              </div>
            ))}
          </div>
        </details>

        <details
          open={archiveOpen}
          onToggle={async (e) => {
            const open = (e.target as HTMLDetailsElement).open;
            setArchiveOpen(open);
            if (open) await loadArchivedQuests();
          }}
          className="group"
        >
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted hover:text-secondary select-none">
            {archiveOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            Archive
          </summary>
          <div className="mt-3 space-y-1.5">
            {archivedQuests.map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-lg bg-card/40 px-4 py-2">
                <span className="text-sm text-secondary truncate flex-1">{q.questName}</span>
                <button
                  onClick={() => unarchiveQuest(q.id)}
                  className="text-xs font-medium text-electric-blue hover:underline"
                >
                  Unarchive
                </button>
              </div>
            ))}
            {archivedQuests.length === 0 && (
              <p className="text-sm text-muted py-2">No archived quests.</p>
            )}
          </div>
        </details>
      </div>

      {selectMode && selectedQuestIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-panel border border-default rounded-xl shadow-xl">
          <span className="text-sm text-secondary">{selectedQuestIds.length} selected</span>
          <button
            onClick={handleBatchComplete}
            className="px-3 py-1.5 text-xs font-medium bg-emerald-glow/20 text-emerald-glow rounded-lg hover:bg-emerald-glow/30"
          >
            Complete All
          </button>
          <button
            onClick={handleBatchArchive}
            className="px-3 py-1.5 text-xs font-medium bg-muted text-primary rounded-lg hover:bg-card-hover"
          >
            Archive All
          </button>
          <button
            onClick={handleBatchDelete}
            className="px-3 py-1.5 text-xs font-medium bg-crimson/20 text-crimson rounded-lg hover:bg-crimson/30"
          >
            Delete All
          </button>
        </div>
      )}

      <div className="shrink-0 border-t border-default bg-panel px-5 py-3">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-default text-sm text-muted hover:text-electric-blue hover:border-electric-blue/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Quest
          </button>
        ) : (
          <form onSubmit={handleQuickAdd} className="space-y-3 animate-in">
            {questSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-muted">Ideas:</span>
                {questSuggestions.slice(0, 5).map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setName(s)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-default/80 text-secondary hover:bg-electric-blue/20 hover:text-electric-blue transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What's the quest?"
              autoFocus
              className="w-full bg-card border border-default rounded-xl px-4 py-2.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-electric-blue/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.1)]"
            />
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className="text-[10px] text-muted hover:text-electric-blue flex items-center gap-1"
            >
              <FileText className="w-3 h-3" /> {showDescription ? "Hide" : "Add"} description
            </button>
            {showDescription && (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description, notes, links..."
                rows={2}
                className="w-full bg-card border border-default rounded-xl px-4 py-2 text-sm text-primary placeholder-muted resize-none focus:outline-none focus:border-electric-blue/50"
              />
            )}

            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as QuestType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQuestType(t)}
                  className={cn(
                    "flex-1 text-xs py-1.5 rounded-lg capitalize transition-all border",
                    questType === t
                      ? t === "monthly"
                        ? "bg-neon-purple/15 text-neon-purple border-neon-purple/30"
                        : t === "weekly"
                          ? "bg-electric-blue/15 text-electric-blue border-electric-blue/30"
                          : "bg-emerald-glow/15 text-emerald-glow border-emerald-glow/30"
                      : "bg-card text-muted border-default hover:text-secondary"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={cn(
                    "flex-1 text-xs py-1.5 rounded-lg transition-all border",
                    difficulty === d.value
                      ? "bg-muted text-primary border-default"
                      : "bg-card text-muted border-default hover:text-secondary"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 text-xs py-1.5 rounded-lg transition-all border",
                    priority === p.value
                      ? "bg-muted text-primary border-default"
                      : "bg-card text-muted border-default hover:text-secondary"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setIsBoss(!isBoss)}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                    isBoss ? "bg-crimson/20 border-crimson" : "border-default hover:border-secondary"
                  )}
                >
                  {isBoss && <Skull className="w-3 h-3 text-crimson" />}
                </button>
                <span className="text-xs text-secondary">Boss quest</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                    isRecurring ? "bg-electric-blue/20 border-electric-blue" : "border-default hover:border-secondary"
                  )}
                >
                  {isRecurring && <Repeat className="w-3 h-3 text-electric-blue" />}
                </button>
                <span className="text-xs text-secondary">Recurring ({questType})</span>
              </label>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Due Date</label>
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const today = new Date();
                  const fmt = (d: Date) => d.toISOString().slice(0, 10);
                  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
                  const shortcuts = [
                    { label: "Today", value: fmt(today) },
                    { label: "Tomorrow", value: fmt(tomorrow) },
                    { label: "Next week", value: fmt(nextWeek) },
                  ];
                  return shortcuts.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setDueDate(dueDate === s.value ? "" : s.value)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors",
                        dueDate === s.value
                          ? "bg-electric-blue/15 text-electric-blue border-electric-blue/30"
                          : "bg-card text-muted border-default hover:text-secondary"
                      )}
                    >
                      {s.label}
                    </button>
                  ));
                })()}
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-36 bg-card border border-default rounded-lg px-2 py-1 text-xs text-secondary focus:outline-none focus:border-electric-blue/50"
                />
                {dueDate && (
                  <button type="button" onClick={() => setDueDate("")} className="text-[10px] text-muted hover:text-crimson">
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Estimated Time</label>
              <input
                type="number"
                value={estimatedMinutes ?? ""}
                onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="minutes"
                min={1}
                className="w-32 bg-card border border-default rounded-xl px-3 py-2 text-sm text-secondary placeholder-muted focus:outline-none focus:border-electric-blue/50"
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Blocked By</label>
              <select
                value={blockedBy ?? ""}
                onChange={(e) => setBlockedBy(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-card border border-default rounded-xl px-3 py-2 text-sm text-secondary focus:outline-none focus:border-electric-blue/50"
              >
                <option value="">No dependency</option>
                {quests.filter((q) => !q.completed && !q.failed && !q.isArchived).map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.questName}
                  </option>
                ))}
              </select>
            </div>

            {templates.length > 0 && (
              <div>
                <label className="text-xs text-muted block mb-1">From Template</label>
                <select
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) createQuestFromTemplate(id);
                    e.target.value = "";
                  }}
                  className="w-full bg-card border border-default rounded-xl px-4 py-2 text-sm text-secondary focus:outline-none focus:border-electric-blue/50"
                >
                  <option value="">— Select template —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.templateName}: {t.questName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <select
              value={skillId}
              onChange={(e) => setSkillId(Number(e.target.value))}
              className="w-full bg-card border border-default rounded-xl px-4 py-2 text-sm text-secondary focus:outline-none focus:border-electric-blue/50"
            >
              <option value={0}>📅 No skill (scheduled event)</option>
              {leafSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => openSkillBank()}
              className="text-xs text-muted hover:text-electric-blue transition-colors mt-1"
            >
              + Manage Skills
            </button>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30 disabled:opacity-40 font-medium text-sm py-2 rounded-xl transition-colors border border-electric-blue/20"
              >
                Add Quest
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setIsRecurring(false);
                  setIsBoss(false);
                  setDescription("");
                  setShowDescription(false);
                  setBlockedBy(null);
                  setDueDate("");
                }}
                className="px-4 text-sm text-muted hover:text-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
