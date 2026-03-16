import type { GameStats } from "../types";

export function getAchievementProgress(key: string, stats: GameStats): { current: number; target: number } | null {
  switch (key) {
    case "first_quest": return { current: Math.min(stats.questsCompleted, 1), target: 1 };
    case "quest_10": return { current: Math.min(stats.questsCompleted, 10), target: 10 };
    case "quest_100": return { current: Math.min(stats.questsCompleted, 100), target: 100 };
    case "quest_500": return { current: Math.min(stats.questsCompleted, 500), target: 500 };
    case "quest_1000": return { current: Math.min(stats.questsCompleted, 1000), target: 1000 };
    case "xp_1000": return { current: Math.min(stats.totalXp, 1000), target: 1000 };
    case "xp_10000": return { current: Math.min(stats.totalXp, 10000), target: 10000 };
    case "xp_50000": return { current: Math.min(stats.totalXp, 50000), target: 50000 };
    case "streak_7": return { current: Math.min(stats.currentStreak, 7), target: 7 };
    case "streak_30": return { current: Math.min(stats.currentStreak, 30), target: 30 };
    case "streak_100": return { current: Math.min(stats.currentStreak, 100), target: 100 };
    case "gold_hoarder": return { current: Math.min(stats.gold, 500), target: 500 };
    case "gold_1000": return { current: Math.min(stats.gold, 1000), target: 1000 };
    case "level_5": return { current: Math.min(stats.currentLevel, 5), target: 5 };
    case "level_10": return { current: Math.min(stats.currentLevel, 10), target: 10 };
    case "level_25": return { current: Math.min(stats.currentLevel, 25), target: 25 };
    default: return null;
  }
}
