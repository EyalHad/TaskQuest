import { useState, useMemo } from "react";
import { useStore } from "../../store";
import { getCategoryColor } from "../../lib/skill-tree";
import { cn } from "../../lib/utils";
import {
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
  Plus,
  Package,
} from "lucide-react";
import type {
  CatalogCategory,
  CatalogGroup as CatalogGroupType,
  CatalogSkill,
} from "../../types";

const catBg: Record<string, string> = {
  blue: "bg-electric-blue/10 border-electric-blue/30 text-electric-blue",
  amber: "bg-gold/10 border-gold/30 text-gold",
  emerald: "bg-emerald-glow/10 border-emerald-glow/30 text-emerald-glow",
  red: "bg-crimson/10 border-crimson/30 text-crimson",
  slate: "bg-card border-default text-secondary",
};
const catBorder: Record<string, string> = {
  blue: "border-electric-blue/20",
  amber: "border-gold/20",
  emerald: "border-emerald-glow/20",
  red: "border-crimson/20",
  slate: "border-default",
};

const CATEGORY_FILTERS = [
  { code: "all", name: "All", icon: "📚" },
  { code: "INT", name: "INT", icon: "🧠" },
  { code: "CRAFT", name: "CRAFT", icon: "🔨" },
  { code: "VITALITY", name: "VITALITY", icon: "💚" },
  { code: "STR", name: "STR", icon: "💪" },
] as const;

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-electric-blue">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

export function SkillCatalog() {
  const catalog = useStore((s) => s.catalog);
  const bundles = useStore((s) => s.bundles);
  const skills = useStore((s) => s.skills);
  const addCatalogSkill = useStore((s) => s.addCatalogSkill);
  const addCatalogBundle = useStore((s) => s.addCatalogBundle);
  const loading = useStore((s) => s.loading);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [confirmBundle, setConfirmBundle] = useState<string | null>(null);

  const leafSkills = useMemo(
    () => skills.filter((s) => !skills.some((o) => o.parentSkillId === s.id)),
    [skills]
  );

  const isAdded = (skillName: string, categoryCode: string) =>
    leafSkills.some((s) => s.name === skillName && s.category === categoryCode);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    const catFilter = categoryFilter === "all" ? null : categoryFilter;

    let filtered: CatalogCategory[] = catalog;
    if (catFilter) {
      filtered = catalog.filter((c) => c.code === catFilter);
    }
    if (!q) return filtered;

    return filtered
      .map((cat) => ({
        ...cat,
        groups: cat.groups
          .map((g) => ({
            ...g,
            skills: g.skills.filter((s) => s.name.toLowerCase().includes(q)),
          }))
          .filter((g) => g.skills.length > 0),
      }))
      .filter((c) => c.groups.length > 0);
  }, [catalog, search, categoryFilter]);

  const flatSearchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const results: { skill: CatalogSkill; categoryCode: string; categoryName: string; groupName: string }[] = [];
    for (const cat of filteredCatalog) {
      for (const group of cat.groups) {
        for (const skill of group.skills) {
          results.push({
            skill,
            categoryCode: cat.code,
            categoryName: cat.name,
            groupName: group.name,
          });
        }
      }
    }
    return results;
  }, [filteredCatalog, search]);

  const isSearchMode = search.trim().length > 0;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const addAllInGroup = async (group: CatalogGroupType, categoryCode: string) => {
    for (const skill of group.skills) {
      if (!isAdded(skill.name, categoryCode)) {
        await addCatalogSkill(skill.id);
      }
    }
  };

  const addedCountInGroup = (group: CatalogGroupType, categoryCode: string) =>
    group.skills.filter((s) => isAdded(s.name, categoryCode)).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-default">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-electric-blue" />
          <h1 className="text-xl font-bold text-primary">Skill Catalog</h1>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-card/80 border border-default rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-electric-blue/40 focus:border-electric-blue/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-secondary rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Start Bundles */}
      <div className="shrink-0 px-6 py-3 border-b border-default bg-panel/30">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" /> Quick Start
        </p>
        <div className="flex flex-wrap gap-2">
          {bundles.map((bundle) => (
            <div key={bundle.key} className="relative">
              <button
                onClick={() =>
                  setConfirmBundle(confirmBundle === bundle.key ? null : bundle.key)
                }
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                  "bg-card/80 border-default text-primary hover:bg-card-hover hover:border-secondary",
                  confirmBundle === bundle.key && "ring-2 ring-electric-blue/50 border-electric-blue/40"
                )}
              >
                <span>{bundle.icon}</span>
                <span>{bundle.name}</span>
              </button>
              {confirmBundle === bundle.key && (
                <div className="absolute left-0 top-full mt-1 z-10 flex items-center gap-2 p-2 bg-card border border-default rounded-lg shadow-xl">
                  <span className="text-xs text-secondary">
                    Add {bundle.skillIds.length} skills
                  </span>
                  <button
                    onClick={async () => {
                      await addCatalogBundle(bundle.key);
                      setConfirmBundle(null);
                    }}
                    disabled={loading}
                    className="bg-electric-blue/15 text-electric-blue border border-electric-blue/30 hover:bg-electric-blue/25 rounded-lg px-3 py-1.5 text-sm font-medium"
                  >
                    Add {bundle.skillIds.length} skills
                  </button>
                  <button
                    onClick={() => setConfirmBundle(null)}
                    className="p-1 text-muted hover:text-secondary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Category sidebar */}
        <aside className="w-44 shrink-0 border-r border-default bg-panel/30 py-4 px-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Filter
          </p>
          <div className="space-y-0.5">
            {CATEGORY_FILTERS.map(({ code, name, icon }) => (
              <button
                key={code}
                onClick={() => setCategoryFilter(code)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  categoryFilter === code
                    ? "bg-electric-blue/15 text-electric-blue border border-electric-blue/30"
                    : "text-secondary hover:text-primary hover:bg-card/50"
                )}
              >
                <span>{icon}</span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isSearchMode ? (
            <div className="space-y-2">
              {flatSearchResults.length === 0 ? (
                <p className="text-muted text-sm py-8 text-center">
                  No skills match &quot;{search}&quot;
                </p>
              ) : (
                flatSearchResults.map(({ skill, categoryCode, categoryName, groupName }) => {
                  const color = getCategoryColor(categoryCode);
                  const added = isAdded(skill.name, categoryCode);
                  return (
                    <div
                      key={skill.id}
                      className={cn(
                        "flex items-center justify-between py-3 px-4 rounded-xl border",
                        "bg-card border-subtle"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg">{skill.icon}</span>
                          <span className="font-medium text-primary">
                            {highlightMatch(skill.name, search)}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded border",
                              catBg[color] ?? catBg.slate
                            )}
                          >
                            {categoryName} · {groupName}
                          </span>
                        </div>
                        {skill.description && (
                          <p className="text-xs text-muted mt-1 truncate">
                            {skill.description}
                          </p>
                        )}
                        {skill.suggestedQuests.length > 0 && (
                          <p className="text-[11px] text-muted italic mt-1 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 shrink-0" />
                            &quot;{skill.suggestedQuests[0]}&quot;
                            {skill.suggestedQuests.length > 1 &&
                              ` · "${skill.suggestedQuests[1]}"`}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 ml-4">
                        {added ? (
                          <span className="text-emerald-glow/60 text-sm flex items-center gap-1">
                            <Check className="w-4 h-4" /> Added
                          </span>
                        ) : (
                          <button
                            onClick={() => addCatalogSkill(skill.id)}
                            disabled={loading}
                            className="bg-electric-blue/15 text-electric-blue border border-electric-blue/30 hover:bg-electric-blue/25 rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCatalog.map((category) => {
                const color = getCategoryColor(category.code);
                return (
                  <div key={category.code} className="space-y-4">
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit",
                        catBg[color] ?? catBg.slate
                      )}
                    >
                      <span>{category.icon}</span>
                      <span className="font-semibold text-sm">{category.name}</span>
                    </div>
                    <div className="space-y-3">
                      {category.groups.map((group) => {
                        const groupKey = `${category.code}-${group.id}`;
                        const expanded = expandedGroups.has(groupKey);
                        const addedCount = addedCountInGroup(group, category.code);
                        const totalCount = group.skills.length;

                        return (
                          <div
                            key={group.id}
                            className={cn(
                              "bg-card border border-subtle rounded-xl overflow-hidden",
                              catBorder[color] ?? catBorder.slate
                            )}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{group.icon}</span>
                                    <span className="font-semibold text-primary">
                                      {group.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted mt-0.5">
                                    {totalCount} skill{totalCount !== 1 ? "s" : ""}
                                    {addedCount > 0 && (
                                      <span className="text-emerald-glow/70">
                                        {" "}
                                        · {addedCount} added
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {addedCount < totalCount && (
                                    <button
                                      onClick={() => addAllInGroup(group, category.code)}
                                      disabled={loading}
                                      className="text-xs bg-electric-blue/15 text-electric-blue border border-electric-blue/30 hover:bg-electric-blue/25 rounded-lg px-2 py-1 font-medium"
                                    >
                                      Add All
                                    </button>
                                  )}
                                  <button
                                    onClick={() => toggleGroup(groupKey)}
                                    className="p-1.5 text-muted hover:text-secondary rounded-lg hover:bg-card-hover"
                                  >
                                    {expanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {expanded && (
                              <div className="border-t border-subtle">
                                {group.skills.map((skill, idx) => {
                                  const added = isAdded(skill.name, category.code);
                                  const isLast = idx === group.skills.length - 1;
                                  return (
                                    <div
                                      key={skill.id}
                                      className={cn(
                                        "flex items-start justify-between gap-4 py-3 px-4",
                                        "border-b border-subtle",
                                        isLast && "border-b-0"
                                      )}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-base">{skill.icon}</span>
                                          <span className="font-medium text-primary">
                                            {skill.name}
                                          </span>
                                        </div>
                                        {skill.description && (
                                          <p className="text-xs text-muted mt-1">
                                            {skill.description}
                                          </p>
                                        )}
                                        {skill.suggestedQuests.length > 0 && (
                                          <p className="text-[11px] text-muted italic mt-1 flex items-center gap-1">
                                            <Lightbulb className="w-3 h-3 shrink-0" />
                                            {skill.suggestedQuests
                                              .map((q) => `"${q}"`)
                                              .join(" · ")}
                                          </p>
                                        )}
                                      </div>
                                      <div className="shrink-0">
                                        {added ? (
                                          <span className="text-emerald-glow/60 text-sm flex items-center gap-1">
                                            <Check className="w-4 h-4" />
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => addCatalogSkill(skill.id)}
                                            disabled={loading}
                                            className="bg-electric-blue/15 text-electric-blue border border-electric-blue/30 hover:bg-electric-blue/25 rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1"
                                          >
                                            <Plus className="w-3.5 h-3.5" /> Add
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isSearchMode && filteredCatalog.length === 0 && (
            <p className="text-muted text-sm py-12 text-center">
              No skills in this category yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
