import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore } from "../../store";
import type { Quest, ActivityEntry } from "../../types";
import { getCategoryColor, getSkillProgress, getSkillTier } from "../../lib/skill-tree";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";
import { TaskCard } from "../QuestBoard/TaskCard";

const xpForLevel = (lvl: number) => Math.round(100 * Math.pow(lvl, 1.5));

const barColors: Record<string, string> = {
  blue:    "bg-electric-blue",
  amber:   "bg-gold",
  emerald: "bg-emerald-glow",
  red:     "bg-crimson",
  slate:   "bg-muted",
};

export function SkillDetail() {
  const skills = useStore((s) => s.skills);
  const selectedSkillId = useStore((s) => s.selectedSkillId);
  const skillDetailOpen = useStore((s) => s.skillDetailOpen);
  const closeSkillDetail = useStore((s) => s.closeSkillDetail);
  const prestigeSkill = useStore((s) => s.prestigeSkill);
  const setSkillTarget = useStore((s) => s.setSkillTarget);
  const getSkillActivity = useStore((s) => s.getSkillActivity);
  const quests = useStore((s) => s.quests);
  const [skillQuests, setSkillQuests] = useState<Quest[]>([]);
  const [detailTab, setDetailTab] = useState<"quests" | "history">("quests");
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const skill = skills.find((s) => s.id === selectedSkillId);

  useEffect(() => {
    if (!selectedSkillId || !skillDetailOpen) return;
    invoke<Quest[]>("get_quests_for_skill", { skillId: selectedSkillId }).then(
      setSkillQuests
    );
  }, [selectedSkillId, skillDetailOpen, quests]);

  useEffect(() => {
    if (detailTab === "history" && skill) {
      getSkillActivity(skill.id, 50).then(setActivity);
    }
  }, [detailTab, skill, getSkillActivity]);

  useEffect(() => {
    setDetailTab("quests");
  }, [skill?.id]);

  if (!skillDetailOpen || !skill) return null;

  const color = getCategoryColor(skill.category);
  const { progress, needed, percent } = getSkillProgress(skill);
  const tier = getSkillTier(skill.level);

  const activeQuests = skillQuests.filter((q) => !q.completed && !q.failed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={closeSkillDetail}
      role="dialog"
      aria-modal="true"
      aria-label="Skill details"
    >
      <div
        className="bg-panel border border-subtle rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{skill.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-primary">{skill.name}</h2>
                <p className="text-xs text-muted">
                {skill.category} &middot; Level {skill.level}
                {skill.prestigeCount > 0 && (
                  <span className="text-gold text-xs font-semibold ml-1">🌟 ×{skill.prestigeCount}</span>
                )}
              </p>
              {tier && (
                <div className={cn("flex items-center gap-1 text-xs font-semibold mt-0.5", tier.color)}>
                  {tier.icon} {tier.name} Tier
                </div>
              )}
              </div>
            </div>
            <button
              onClick={closeSkillDetail}
              className="text-muted hover:text-secondary transition-colors p-1 rounded-lg hover:bg-card-hover"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted">
              <span>Skill XP</span>
              <span className="tabular-nums">{progress} / {needed}</span>
            </div>
            <div className="h-2.5 rounded-full bg-card overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", barColors[color])}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-secondary">Target Level:</span>
              <input
                type="number"
                min={(skill?.level ?? 1) + 1}
                max={20}
                value={skill?.targetLevel ?? ""}
                onChange={(e) => {
                  if (skill) setSkillTarget(skill.id, e.target.value ? Number(e.target.value) : null);
                }}
                placeholder="—"
                className="w-16 bg-card border border-default rounded-lg px-2 py-1 text-sm text-primary text-center focus:outline-none focus:border-electric-blue/50"
              />
              {skill?.targetLevel && skill.targetLevel > skill.level && (
                <span className="text-[10px] text-electric-blue">
                  ~{Math.max(1, Math.round((xpForLevel(skill.targetLevel) - skill.currentXp) / 10))} quests to go
                </span>
              )}
            </div>
            {skill?.targetLevel && skill.level >= skill.targetLevel && (
              <span className="text-emerald-glow text-xs font-semibold">✅ Goal reached!</span>
            )}
            {skill.lastXpDate && (() => {
              const days = Math.floor((Date.now() - new Date(skill.lastXpDate).getTime()) / 86400000);
              if (days > 7) return <span className="text-crimson text-[10px]">⚠️ {days}d inactive — XP decay active</span>;
              return null;
            })()}
            {skill.parentSkillId && skill.level >= 20 && (
              <button
                onClick={async () => { await prestigeSkill(skill.id); closeSkillDetail(); }}
                className="mt-2 w-full py-2 text-sm font-semibold bg-gold/15 text-gold border border-gold/30 rounded-lg hover:bg-gold/25 transition-colors flex items-center justify-center gap-2"
              >
                🌟 Prestige ({skill.prestigeCount} times)
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex gap-1 mb-3">
            <button onClick={() => setDetailTab("quests")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                detailTab === "quests" ? "bg-electric-blue/20 text-electric-blue" : "text-muted hover:text-secondary"
              )}>Active Quests</button>
            <button onClick={() => setDetailTab("history")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                detailTab === "history" ? "bg-electric-blue/20 text-electric-blue" : "text-muted hover:text-secondary"
              )}>History</button>
          </div>

          {detailTab === "history" && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {activity.map(a => (
                <div key={a.id} className="flex items-center justify-between py-1.5 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                      a.eventType === "quest_complete" ? "bg-emerald-glow" :
                      a.eventType === "quest_fail" ? "bg-crimson" : "bg-muted"
                    )} />
                    <span className="text-secondary truncate">{a.detail}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {a.xpDelta !== 0 && (
                      <span className={a.xpDelta > 0 ? "text-emerald-glow" : "text-crimson"}>
                        {a.xpDelta > 0 ? "+" : ""}{a.xpDelta}
                      </span>
                    )}
                    <span className="text-muted">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {activity.length === 0 && <p className="text-xs text-muted py-4 text-center">No activity yet</p>}
            </div>
          )}

          {detailTab === "quests" && (
            <>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                Quests ({activeQuests.length})
              </h3>

              {activeQuests.length === 0 && (
                <p className="text-sm text-muted italic">No active quests for this skill.</p>
              )}

              <div className="space-y-2">
                {activeQuests.map((q) => (
                  <TaskCard key={q.id} quest={q} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
