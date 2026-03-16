export type QuestType = "daily" | "weekly" | "monthly";
export type Difficulty = "easy" | "normal" | "hard" | "epic";
export type Priority = "low" | "normal" | "urgent";

export interface Quest {
  id: number;
  questName: string;
  description: string;
  questType: QuestType;
  skillId: number | null;
  xpReward: number;
  completed: boolean;
  failed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  isRecurring: boolean;
  recurrencePattern: string | null;
  parentQuestId: number | null;
  difficulty: Difficulty;
  priority: Priority;
  isBoss: boolean;
  isPinned: boolean;
  isArchived: boolean;
  sortOrder: number;
  timeSpentSeconds: number;
  pomodoroCount: number;
  failedAt: string | null;
  chainId: number | null;
  chainOrder: number;
  estimatedMinutes: number | null;
  blockedByQuestId: number | null;
}

export interface CreateQuestInput {
  questName: string;
  description?: string;
  questType: QuestType;
  skillId?: number | null;
  xpReward?: number;
  dueDate?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  difficulty?: Difficulty;
  priority?: Priority;
  isBoss?: boolean;
  estimatedMinutes?: number;
}

export interface SubTask {
  id: number;
  questId: number;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface QuestTemplate {
  id: number;
  profileId: number;
  templateName: string;
  questName: string;
  description: string;
  questType: string;
  skillId: number | null;
  xpReward: number;
  difficulty: string;
  priority: string;
  isBoss: boolean;
  schedulePattern: string | null;
  scheduleActive: boolean;
}

export interface CreateTemplateInput {
  templateName: string;
  questName: string;
  description?: string;
  questType?: string;
  skillId?: number;
  xpReward?: number;
  difficulty?: string;
  priority?: string;
  isBoss?: boolean;
}
