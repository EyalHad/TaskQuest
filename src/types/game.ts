export interface GameStats {
  totalXp: number;
  currentLevel: number;
  questsCompleted: number;
  hp: number;
  maxHp: number;
  gold: number;
  progressXp: number;
  neededXp: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezeCount: number;
  xpBoostRemaining: number;
  isBurnout: boolean;
  skillBoostId: number | null;
  skillBoostMult: number;
  skillBoostExpires: string | null;
}

export const DEFAULT_GAME_STATS: GameStats = {
  totalXp: 0, currentLevel: 1, questsCompleted: 0,
  hp: 100, maxHp: 100, gold: 0,
  progressXp: 0, neededXp: 100, progressPercent: 0,
  currentStreak: 0, longestStreak: 0, streakFreezeCount: 0, xpBoostRemaining: 0,
  isBurnout: false, skillBoostId: null, skillBoostMult: 1.0, skillBoostExpires: null,
};

export interface Achievement {
  id: number;
  profileId: number;
  key: string;
  unlockedAt: string;
}

export interface ActivityEntry {
  id: number;
  profileId: number;
  skillId: number | null;
  eventType: string;
  detail: string | null;
  xpDelta: number;
  createdAt: string;
}

export interface DaySummary {
  date: string;
  questCount: number;
  xpEarned: number;
}

export interface WeeklyReport {
  thisWeekQuests: number;
  thisWeekXp: number;
  lastWeekQuests: number;
  lastWeekXp: number;
  currentStreak: number;
}
