export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  { id: "new_year_sprint", name: "New Year Sprint", description: "Complete 30 quests in January", icon: "🎆", startMonth: 0, startDay: 1, endMonth: 0, endDay: 31 },
  { id: "spring_cleaning", name: "Spring Cleaning", description: "Archive 10 old quests in March", icon: "🌸", startMonth: 2, startDay: 1, endMonth: 2, endDay: 31 },
  { id: "summer_focus", name: "Summer Focus", description: "Maintain a 14-day streak in July", icon: "☀️", startMonth: 6, startDay: 1, endMonth: 6, endDay: 31 },
  { id: "holiday_hustle", name: "Holiday Hustle", description: "Earn 500 XP in December", icon: "🎄", startMonth: 11, startDay: 1, endMonth: 11, endDay: 31 },
];

export function getActiveEvent(): SeasonalEvent | null {
  const now = new Date();
  const m = now.getMonth();
  const d = now.getDate();
  return SEASONAL_EVENTS.find(e =>
    (m > e.startMonth || (m === e.startMonth && d >= e.startDay)) &&
    (m < e.endMonth || (m === e.endMonth && d <= e.endDay))
  ) ?? null;
}
