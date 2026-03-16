import { useState, useMemo } from "react";
import { useStore } from "../../store";
import { SkillNodeCard } from "./SkillNode";
import { getCategoryColor } from "../../lib/skill-tree";
import type { SkillNode } from "../../types";
import { cn } from "../../lib/utils";
import { ChevronRight } from "lucide-react";
import { SkillNodeSkeleton } from "../shared/Skeleton";

const categoryGlows: Record<string, string> = {
  blue: "shadow-[0_0_20px_rgba(0,229,255,0.08)]",
  amber: "shadow-[0_0_20px_rgba(255,215,0,0.08)]",
  emerald: "shadow-[0_0_20px_rgba(0,255,102,0.08)]",
  red: "shadow-[0_0_20px_rgba(255,51,102,0.08)]",
  slate: "",
};

const categoryBorders: Record<string, string> = {
  blue: "border-electric-blue/20",
  amber: "border-gold/20",
  emerald: "border-emerald-glow/20",
  red: "border-crimson/20",
  slate: "border-default",
};

const categoryTextColors: Record<string, string> = {
  blue: "text-electric-blue",
  amber: "text-gold",
  emerald: "text-emerald-glow",
  red: "text-crimson",
  slate: "text-secondary",
};

const connectorBg: Record<string, string> = {
  blue: "bg-electric-blue/20",
  amber: "bg-gold/20",
  emerald: "bg-emerald-glow/20",
  red: "bg-crimson/20",
  slate: "bg-default",
};

function CategorySection({ category, questCounts }: { category: SkillNode; questCounts: Map<number, number> }) {
  const [expanded, setExpanded] = useState(true);
  const color = getCategoryColor(category.category);
  const totalQuests = countQuestsInTree(category, questCounts);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/50 transition-all duration-300",
        categoryBorders[color],
        expanded && categoryGlows[color],
      )}
    >
      {/* Category Header — always visible, toggles children */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 group"
      >
        <span className="text-2xl">{category.icon}</span>
        <div className="flex-1 text-left min-w-0">
          <p className={cn("text-sm font-bold", categoryTextColors[color])}>
            {category.name}
          </p>
          <p className="text-[11px] text-muted">
            Lv. {category.derivedLevel} &middot; {category.children.length} group{category.children.length !== 1 ? "s" : ""}
          </p>
        </div>
        {totalQuests > 0 && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            color === "blue" ? "bg-electric-blue/15 text-electric-blue" :
            color === "amber" ? "bg-gold/15 text-gold" :
            color === "emerald" ? "bg-emerald-glow/15 text-emerald-glow" :
            "bg-default text-secondary"
          )}>
            {totalQuests} quest{totalQuests !== 1 ? "s" : ""}
          </span>
        )}
        <ChevronRight
          className={cn(
            "w-4 h-4 text-muted transition-transform duration-300",
            expanded && "rotate-90"
          )}
        />
      </button>

      {/* Collapsible children */}
      <div className={cn("collapse-section", expanded && "expanded")}>
        <div>
          <div className="px-3 pb-3 space-y-2">
            {category.children.map((group, gi) => (
              <GroupSection
                key={group.id}
                group={group}
                color={color}
                questCounts={questCounts}
                delayIndex={gi}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupSection({ group, color, questCounts, delayIndex }: {
  group: SkillNode;
  color: string;
  questCounts: Map<number, number>;
  delayIndex: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const groupQuests = countQuestsInTree(group, questCounts);

  return (
    <div
      className="node-enter rounded-xl bg-panel/60 border border-subtle"
      style={{ animationDelay: `${delayIndex * 60}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 group"
      >
        <div className={cn("w-0.5 h-5 rounded-full shrink-0", connectorBg[color])} />
        <span className="text-base">{group.icon}</span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold text-primary truncate">
            {group.name}
          </p>
          <p className="text-[10px] text-muted">
            Lv. {group.derivedLevel} &middot; {group.children.length} skill{group.children.length !== 1 ? "s" : ""}
          </p>
        </div>
        {groupQuests > 0 && (
          <span className="text-[10px] font-medium text-muted bg-card px-1.5 py-0.5 rounded-md">
            {groupQuests}
          </span>
        )}
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 text-muted transition-transform duration-300",
            expanded && "rotate-90"
          )}
        />
      </button>

      <div className={cn("collapse-section", expanded && "expanded")}>
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 px-3 pb-3">
            {group.children.map((skill, si) => (
              <div
                key={skill.id}
                className="node-enter"
                style={{ animationDelay: `${(delayIndex * 60) + (si * 40)}ms` }}
              >
                <SkillNodeCard
                  node={skill}
                  depth={2}
                  questCount={questCounts.get(skill.id) ?? 0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function countQuestsInTree(node: SkillNode, counts: Map<number, number>): number {
  if (node.children.length === 0) return counts.get(node.id) ?? 0;
  return node.children.reduce((sum, child) => sum + countQuestsInTree(child, counts), 0);
}

export function SkillTree() {
  const skillTree = useStore((s) => s.skillTree);
  const quests = useStore((s) => s.quests);

  const questCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const q of quests) {
      if (!q.completed && !q.failed && q.skillId != null) {
        counts.set(q.skillId, (counts.get(q.skillId) ?? 0) + 1);
      }
    }
    return counts;
  }, [quests]);

  const initialized = useStore((s) => s.initialized);
  if (!initialized) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkillNodeSkeleton />
            <div className="ml-6 space-y-2">
              <SkillNodeSkeleton />
              <SkillNodeSkeleton />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {skillTree.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          questCounts={questCounts}
        />
      ))}
    </div>
  );
}
