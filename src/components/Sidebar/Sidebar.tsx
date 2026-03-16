import { useStore, type Page } from "../../store";
import { Swords, Shield, BookOpen, ShoppingBag, BarChart3, Users, Settings, Wrench, CalendarDays, Repeat, PenLine, Trophy, ShieldCheck, Star, Link2, FileStack, Sun, Moon } from "lucide-react";
import { cn } from "../../lib/utils";

const NAV_ITEMS: { id: Page; label: string; icon: typeof Swords; divider?: boolean }[] = [
  { id: "quests", label: "Quest Board", icon: Swords },
  { id: "hero", label: "Hero Status", icon: Shield },
  { id: "catalog", label: "Skill Catalog", icon: BookOpen },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "habits", label: "Habits", icon: Repeat },
  { id: "journal", label: "Journal", icon: PenLine, divider: true },
  { id: "shop", label: "Shop", icon: ShoppingBag },
  { id: "equipment", label: "Equipment", icon: ShieldCheck },
  { id: "achievements", label: "Trophies", icon: Trophy, divider: true },
  { id: "chains", label: "Chains", icon: Link2 },
  { id: "templates", label: "Templates", icon: FileStack },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "review", label: "Year Review", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const openSkillBank = useStore((s) => s.openSkillBank);
  const stats = useStore((s) => s.stats);
  const profiles = useStore((s) => s.profiles);
  const activeProfileId = useStore((s) => s.activeProfileId);
  const quests = useStore((s) => s.quests);
  const colorMode = useStore((s) => s.colorMode);
  const toggleColorMode = useStore((s) => s.toggleColorMode);
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = quests.filter(
    (q) => !q.completed && !q.failed && q.dueDate && new Date(q.dueDate) < today
  ).length;

  return (
    <nav className="w-16 lg:w-52 shrink-0 flex flex-col bg-panel border-r border-default h-full">
      {/* Profile section */}
      <div className="px-3 py-4 border-b border-default">
        {activeProfile ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center text-lg shrink-0">
              {activeProfile.avatarIcon}
            </div>
            <div className="hidden lg:block min-w-0 flex-1">
              <p className="text-xs font-bold text-primary truncate">{activeProfile.name}</p>
              <p className="text-[10px] text-electric-blue font-semibold">Lv. {stats.currentLevel}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-electric-blue shrink-0" />
            <span className="text-sm font-bold tracking-tight text-primary hidden lg:block">TASKQUEST</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-0.5 px-2 py-4 overflow-y-auto scrollbar-none">
        {NAV_ITEMS.map(({ id, label, icon: Icon, divider }) => (
          <div key={id}>
            <button
              onClick={() => setPage(id)}
              className={cn(
                "nav-lift flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative w-full",
                page === id
                  ? "bg-card text-electric-blue shadow-[0_0_10px_rgba(0,229,255,0.15)]"
                  : "text-secondary hover:text-primary hover:bg-card-hover"
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="hidden lg:block">{label}</span>
              {id === "quests" && overdueCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-crimson text-[10px] font-bold text-white px-1">
                  {overdueCount}
                </span>
              )}
            </button>
            {divider && <div className="my-1.5 mx-3 border-t border-subtle" />}
          </div>
        ))}

        <button
          onClick={openSkillBank}
          className="nav-lift flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-secondary hover:bg-card-hover transition-all duration-200"
        >
          <Wrench className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block">Manage Skills</span>
        </button>

        {/* Switch Profile */}
        <button
          onClick={() => setPage("home")}
          className="nav-lift flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-secondary hover:bg-card-hover transition-all duration-200 mt-2"
        >
          <Users className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block">Switch Profile</span>
        </button>
      </div>

      <div className="px-3 py-4 border-t border-default space-y-3">
        {/* Light/Dark toggle */}
        <button
          onClick={toggleColorMode}
          className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-muted hover:text-secondary transition-colors"
          title={`Switch to ${colorMode === "dark" ? "light" : "dark"} mode`}
        >
          {colorMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="hidden lg:block ml-3 text-sm">{colorMode === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-sm font-bold text-electric-blue">
            {stats.currentLevel}
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-[10px] text-muted uppercase tracking-wider">Level</p>
            <p className="text-xs text-secondary font-medium truncate">{stats.totalXp} XP</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs flex-wrap">
          <span className="text-gold font-semibold">{stats.gold}g</span>
          <span className="text-muted">|</span>
          <span className="text-crimson font-semibold">{stats.hp}/{stats.maxHp} HP</span>
          {stats.currentStreak > 0 && (
            <>
              <span className="text-muted">|</span>
              <span className={cn("font-semibold", stats.currentStreak >= 7 ? "text-gold streak-pulse" : "text-orange-400")}>
                🔥{stats.currentStreak}
              </span>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
