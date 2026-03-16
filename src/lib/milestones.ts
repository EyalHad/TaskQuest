export interface MilestoneDef {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const MILESTONES: MilestoneDef[] = [
  { key: "first_quest", title: "First Blood", description: "You completed your first quest!", icon: "⚔️" },
  { key: "quest_10", title: "Getting Started", description: "10 quests down!", icon: "🎯" },
  { key: "quest_100", title: "Century", description: "100 quests completed!", icon: "💯" },
  { key: "quest_500", title: "Relentless", description: "500 quests. Unstoppable.", icon: "🔥" },
  { key: "xp_1000", title: "Experienced", description: "1,000 XP earned!", icon: "⭐" },
  { key: "xp_10000", title: "Veteran", description: "10,000 XP!", icon: "🏆" },
  { key: "streak_7", title: "On Fire", description: "7-day streak!", icon: "🔥" },
  { key: "streak_30", title: "Unstoppable", description: "30-day streak!", icon: "💎" },
  { key: "first_boss", title: "Slayer", description: "First boss defeated!", icon: "💀" },
  { key: "gold_1000", title: "Wealthy", description: "1,000 gold saved!", icon: "💰" },
  { key: "first_level10_skill", title: "Specialist", description: "A skill reached level 10!", icon: "🎓" },
  { key: "survivor", title: "Survivor", description: "Completed 10 quests without entering burnout", icon: "🛡️" },
  { key: "gold_hoarder", title: "Gold Hoarder", description: "Accumulated 500 gold", icon: "💰" },
  { key: "bounty_hunter", title: "Bounty Hunter", description: "Completed 10 bounty quests", icon: "🎯" },
  { key: "first_prestige", title: "Reborn", description: "Prestiged a skill for the first time!", icon: "🌟" },
  { key: "chain_master", title: "Chain Master", description: "Completed a quest chain!", icon: "⛓️" },
  { key: "habitual", title: "Habitual", description: "Checked a habit for 7 days straight", icon: "🔄" },
];

export function getMilestone(key: string): MilestoneDef | undefined {
  return MILESTONES.find((m) => m.key === key);
}
