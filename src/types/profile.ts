export interface Profile {
  id: number;
  name: string;
  avatarIcon: string;
  createdAt: string;
  activeTheme: string;
  soundPack: string;
  defaultSkillId: number | null;
  totalXp: number;
  currentLevel: number;
  hp: number;
  maxHp: number;
  gold: number;
}

export interface CreateProfileInput {
  name: string;
  avatarIcon?: string;
}
