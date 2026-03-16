export interface Chain {
  id: number;
  profileId: number;
  name: string;
  description: string;
  bonusGold: number;
  bonusXp: number;
  completed: boolean;
  createdAt: string;
}

export interface Challenge {
  id: number;
  profileId: number;
  challengeType: string;
  description: string;
  target: number;
  progress: number;
  rewardGold: number;
  rewardXp: number;
  date: string;
  completed: boolean;
}

export interface Habit {
  id: number;
  profileId: number;
  name: string;
  icon: string;
  skillId: number | null;
  xpPerCheck: number;
  isActive: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: number;
  profileId: number;
  content: string;
  mood: string | null;
  xpGranted: number;
  createdAt: string;
}

export interface EquipmentItem {
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  unlockAchievement: string;
  effectType: string;
  effectValue: number;
  unlocked: boolean;
  equipped: boolean;
}

export interface YearSummary {
  totalQuests: number;
  totalXp: number;
  mostActiveSkill: string | null;
  mostActiveSkillCount: number;
  bestDay: string | null;
  bestDayCount: number;
  activeDays: number;
  achievementsCount: number;
}
