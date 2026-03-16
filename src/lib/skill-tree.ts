import type { Skill, SkillNode } from "../types";

export function buildTree(skills: Skill[]): SkillNode[] {
  const map = new Map<number, SkillNode>();

  for (const s of skills) {
    map.set(s.id, { ...s, children: [], derivedLevel: s.level });
  }

  const roots: SkillNode[] = [];
  for (const node of map.values()) {
    if (node.parentSkillId === null) {
      roots.push(node);
    } else {
      const parent = map.get(node.parentSkillId);
      if (parent) parent.children.push(node);
    }
  }

  for (const root of roots) {
    root.derivedLevel = computeDerivedLevel(root);
    for (const group of root.children) {
      group.derivedLevel = computeDerivedLevel(group);
    }
  }

  return roots;
}

function computeDerivedLevel(node: SkillNode): number {
  if (node.children.length === 0) return node.level;
  const sum = node.children.reduce((acc, c) => acc + computeDerivedLevel(c), 0);
  return Math.round(sum / node.children.length);
}

export function getCategoryColor(category: string): string {
  const custom = getCustomCategoryColors();
  if (custom[category]) return custom[category];
  switch (category) {
    case "INT": return "blue";
    case "CRAFT": return "amber";
    case "VITALITY": return "emerald";
    case "STR": return "red";
    default: return "slate";
  }
}

function getCustomCategoryColors(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem("taskquest_custom_colors") || "{}");
  } catch { return {}; }
}

export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export type SkillTier = { name: string; icon: string; color: string };

export function getSkillTier(level: number): SkillTier | null {
  if (level < 1) return null;
  if (level <= 5) return { name: "Bronze", icon: "🥉", color: "text-amber-600" };
  if (level <= 10) return { name: "Silver", icon: "🥈", color: "text-slate-300" };
  if (level <= 15) return { name: "Gold", icon: "🥇", color: "text-gold" };
  return { name: "Platinum", icon: "💎", color: "text-electric-blue" };
}

export function getSkillProgress(skill: Skill): { progress: number; needed: number; percent: number } {
  const currentLevelXp = skill.level > 1 ? xpForLevel(skill.level - 1) : 0;
  const nextLevelXp = xpForLevel(skill.level);
  const progress = skill.currentXp - currentLevelXp;
  const needed = nextLevelXp - currentLevelXp;
  const percent = needed > 0 ? (progress / needed) * 100 : 0;
  return { progress: Math.max(0, progress), needed, percent: Math.min(100, Math.max(0, percent)) };
}
