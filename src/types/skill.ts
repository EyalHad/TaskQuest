export interface Skill {
  id: number;
  name: string;
  category: string;
  parentSkillId: number | null;
  currentXp: number;
  level: number;
  icon: string;
  sortOrder: number;
  isArchived?: boolean;
  prestigeCount: number;
  lastXpDate: string | null;
  targetLevel: number | null;
}

export interface SkillNode extends Skill {
  children: SkillNode[];
  derivedLevel: number;
}

export interface CreateSkillInput {
  name: string;
  category: string;
  parentSkillId: number | null;
  icon?: string;
}

export interface UpdateSkillInput {
  name: string;
  icon: string;
}
