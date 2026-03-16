export interface CatalogSkill {
  id: string;
  name: string;
  icon: string;
  description: string;
  suggestedQuests: string[];
}

export interface CatalogGroup {
  id: string;
  name: string;
  icon: string;
  skills: CatalogSkill[];
}

export interface CatalogCategory {
  code: string;
  name: string;
  icon: string;
  groups: CatalogGroup[];
}

export interface QuickStartBundle {
  key: string;
  name: string;
  description: string;
  icon: string;
  skillIds: string[];
}
