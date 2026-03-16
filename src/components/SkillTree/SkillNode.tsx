import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { SkillNode as SkillNodeType, Quest } from "../../types";
import { getCategoryColor, getSkillProgress, getSkillTier } from "../../lib/skill-tree";
import { useStore } from "../../store";
import { cn } from "../../lib/utils";
import { TaskCard } from "../QuestBoard/TaskCard";
import { AddQuestForm } from "../QuestLog/AddQuestForm";
import { ChevronDown, Info } from "lucide-react";

interface Props {
  node: SkillNodeType;
  depth?: number;
  questCount?: number;
}

const ringColors: Record<string, string> = {
  blue: "#00E5FF",
  amber: "#FFD700",
  emerald: "#00FF66",
  red: "#FF3366",
  slate: "#64748b",
};

const borderColors: Record<string, string> = {
  blue: "border-electric-blue/15 hover:border-electric-blue/40",
  amber: "border-gold/15 hover:border-gold/40",
  emerald: "border-emerald-glow/15 hover:border-emerald-glow/40",
  red: "border-crimson/15 hover:border-crimson/40",
  slate: "border-default hover:border-secondary",
};

const glowHover: Record<string, string> = {
  blue: "hover:shadow-[0_0_12px_rgba(0,229,255,0.2)]",
  amber: "hover:shadow-[0_0_12px_rgba(255,215,0,0.2)]",
  emerald: "hover:shadow-[0_0_12px_rgba(0,255,102,0.2)]",
  red: "hover:shadow-[0_0_12px_rgba(255,51,102,0.2)]",
  slate: "",
};

const badgeBg: Record<string, string> = {
  blue: "bg-electric-blue text-inverse",
  amber: "bg-gold text-inverse",
  emerald: "bg-emerald-glow text-inverse",
  red: "bg-crimson text-white",
  slate: "bg-default text-primary",
};

function XpRing({ percent, color, size = 44 }: { percent: number; color: string; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const strokeColor = ringColors[color] ?? ringColors.slate;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1e293b"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="xp-ring"
        style={{ filter: `drop-shadow(0 0 3px ${strokeColor}40)` }}
      />
    </svg>
  );
}

export function SkillNodeCard({ node, questCount = 0 }: Props) {
  const quests = useStore((s) => s.quests);
  const openSkillDetail = useStore((s) => s.openSkillDetail);
  const color = getCategoryColor(node.category);
  const { progress, needed, percent } = getSkillProgress(node);
  const [expanded, setExpanded] = useState(false);
  const [skillQuests, setSkillQuests] = useState<Quest[]>([]);

  useEffect(() => {
    if (!expanded) return;
    invoke<Quest[]>("get_quests_for_skill", { skillId: node.id }).then(setSkillQuests);
  }, [expanded, node.id, quests]);

  const activeQuests = skillQuests.filter((q) => !q.completed && !q.failed);

  return (
    <div className="flex flex-col">
      {/* Main card */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "skill-node-hover relative cursor-pointer rounded-xl bg-card border p-3 transition-all duration-200",
          borderColors[color],
          glowHover[color],
          expanded && "ring-1 ring-electric-blue/30",
        )}
      >
        <div className="flex items-center gap-3">
          {/* Radial XP Ring with icon */}
          <div className="relative">
            <XpRing percent={percent} color={color} />
            <span className="absolute inset-0 flex items-center justify-center text-sm">
              {node.icon}
            </span>
          </div>

          {/* Name + Level */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary truncate">{node.name}</p>
            <p className="text-[10px] text-muted tabular-nums flex items-center gap-1">
              Lv. {node.level}
              {(() => {
                const tier = getSkillTier(node.level);
                return tier ? <span className={cn("text-[10px]", tier.color)}>{tier.icon}</span> : null;
              })()}
              <span className="text-muted mx-1">&middot;</span>
              {progress}/{needed} XP
            </p>
          </div>

          {/* Detail button */}
          <button
            onClick={(e) => { e.stopPropagation(); openSkillDetail(node.id); }}
            className="p-1 rounded-lg text-muted hover:text-secondary hover:bg-card-hover transition-colors shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Quest badge */}
          {questCount > 0 && (
            <span className={cn(
              "text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0",
              badgeBg[color],
            )}>
              {questCount}
            </span>
          )}

          {/* Expand indicator */}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted transition-transform duration-200 shrink-0",
              expanded && "rotate-180 text-secondary"
            )}
          />
        </div>

        {/* Hover tooltip */}
        <div className="skill-tooltip absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 px-3 py-2 rounded-lg bg-panel border border-default shadow-xl whitespace-nowrap">
          <p className="text-xs font-semibold text-primary">{node.name}</p>
          <p className="text-[10px] text-secondary">
            Level {node.level} &middot; {Math.round(percent)}% to next
          </p>
          <div className="mt-1 h-1.5 w-24 rounded-full bg-default overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${percent}%`, backgroundColor: ringColors[color] }}
            />
          </div>
        </div>
      </div>

      {/* Inline detail panel */}
      {expanded && (
        <div className="detail-expand mt-1 rounded-xl bg-panel/80 border border-subtle p-3 space-y-2">
          {activeQuests.length === 0 ? (
            <p className="text-[11px] text-muted italic">No active quests for this skill.</p>
          ) : (
            <div className="space-y-1.5">
              {activeQuests.map((q) => (
                <TaskCard key={q.id} quest={q} />
              ))}
            </div>
          )}
          <AddQuestForm preselectedSkillId={node.id} />
        </div>
      )}
    </div>
  );
}
