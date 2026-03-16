import { useEffect } from "react";
import { useStore } from "./store";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { QuestBoard } from "./components/QuestBoard/QuestBoard";
import { HeroStatus } from "./components/HeroStatus/HeroStatus";
import { Shop } from "./components/Shop/Shop";
import { Home } from "./components/Home/Home";
import { StatsDashboard } from "./components/Stats/StatsDashboard";
import { Settings } from "./components/Settings/Settings";
import { SkillBank } from "./components/SkillBank/SkillBank";
import { SkillCatalog } from "./components/Catalog/SkillCatalog";
import { CalendarBoard } from "./components/Calendar/CalendarBoard";
import { HabitTracker } from "./components/Habits/HabitTracker";
import { Journal } from "./components/Journal/Journal";
import { Equipment } from "./components/Equipment/Equipment";
import { AchievementShowcase } from "./components/Achievements/AchievementShowcase";
import { YearInReview } from "./components/Stats/YearInReview";
import { QuestChains } from "./components/Chains/QuestChains";
import { TemplateManager } from "./components/Templates/TemplateManager";
import { ErrorToast } from "./components/ErrorToast";
import { LevelUpOverlay } from "./components/Feedback/LevelUpOverlay";
import { AchievementPopup } from "./components/Feedback/AchievementPopup";
import { PomodoroBar } from "./components/QuestBoard/PomodoroBar";
import { FocusMode } from "./components/QuestBoard/FocusMode";
import { QuickCapture } from "./components/QuestBoard/QuickCapture";
import { ShortcutHelp } from "./components/Feedback/ShortcutHelp";
import { UndoToast } from "./components/Feedback/UndoToast";
import { Tutorial } from "./components/Onboarding/Tutorial";
import { DataRecoveryDialog } from "./components/Onboarding/DataRecoveryDialog";
import { SkillDetail } from "./components/SkillTree/SkillDetail";
import { PageTransition } from "./components/PageTransition";
import { FloatingRewardProvider } from "./components/Feedback/FloatingReward";

function App() {
  const checkForExistingData = useStore((s) => s.checkForExistingData);
  const dataCheckDone = useStore((s) => s.dataCheckDone);
  const hasExistingData = useStore((s) => s.hasExistingData);
  const resetAllData = useStore((s) => s.resetAllData);
  const continueWithExistingData = useStore((s) => s.continueWithExistingData);
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const setQuickCapture = useStore((s) => s.setQuickCapture);
  const setShortcutHelp = useStore((s) => s.setShortcutHelp);
  const setFocusQuest = useStore((s) => s.setFocusQuest);
  const focusQuestId = useStore((s) => s.focusQuestId);
  const quickCaptureOpen = useStore((s) => s.quickCaptureOpen);
  const shortcutHelpOpen = useStore((s) => s.shortcutHelpOpen);
  const quests = useStore((s) => s.quests);
  const pomodoroQuestId = useStore((s) => s.pomodoroQuestId);
  const pomodoroRunning = useStore((s) => s.pomodoroRunning);
  const startPomodoro = useStore((s) => s.startPomodoro);
  const pausePomodoro = useStore((s) => s.pausePomodoro);
  const resumePomodoro = useStore((s) => s.resumePomodoro);
  const skillBankOpen = useStore((s) => s.skillBankOpen);
  const openSkillBank = useStore((s) => s.openSkillBank);
  const closeSkillBank = useStore((s) => s.closeSkillBank);

  useEffect(() => {
    checkForExistingData();
  }, [checkForExistingData]);

  useEffect(() => {
    if (hasExistingData && !dataCheckDone) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "Escape") {
        if (shortcutHelpOpen) setShortcutHelp(false);
        else if (quickCaptureOpen) setQuickCapture(false);
        else if (focusQuestId) setFocusQuest(null);
        else if (skillBankOpen) closeSkillBank();
        return;
      }

      if (isInput && e.key !== "Escape") return;

      if (e.key === "?") {
        setShortcutHelp(true);
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        setQuickCapture(true);
        return;
      }

      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setQuickCapture(true);
        return;
      }

      if (["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].includes(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const pages = ["quests", "hero", "catalog", "shop", "stats", "settings", "calendar", "habits", "journal", "equipment"] as const;
        const idx = e.key === "0" ? 9 : parseInt(e.key, 10) - 1;
        if (idx < pages.length) setPage(pages[idx]);
        return;
      }

      if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setPage("chains");
        return;
      }

      if (e.key.toLowerCase() === "b" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        openSkillBank();
        return;
      }

      if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeQuests = quests.filter((q) => !q.completed && !q.failed && !q.isArchived);
        const first = activeQuests[0];
        if (first) setFocusQuest(first.id);
        return;
      }

      if (e.key.toLowerCase() === "p" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (pomodoroQuestId) {
          if (pomodoroRunning) pausePomodoro();
          else resumePomodoro();
        } else {
          const activeQuests = quests.filter((q) => !q.completed && !q.failed && !q.isArchived);
          const first = activeQuests[0];
          if (first) startPomodoro(first.id);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    hasExistingData,
    dataCheckDone,
    setPage,
    setQuickCapture,
    setShortcutHelp,
    setFocusQuest,
    shortcutHelpOpen,
    quickCaptureOpen,
    focusQuestId,
    skillBankOpen,
    openSkillBank,
    closeSkillBank,
    quests,
    pomodoroQuestId,
    pomodoroRunning,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
  ]);

  if (hasExistingData && !dataCheckDone) {
    return <DataRecoveryDialog onRestore={continueWithExistingData} onFresh={resetAllData} />;
  }

  if (page === "home") {
    return (
      <>
        <Home />
        <ErrorToast />
      </>
    );
  }

  return (
    <FloatingRewardProvider>
      <div className="h-screen flex items-center justify-center p-0 sm:p-2 lg:p-3 bg-frame-bg">
        <div className="w-full h-full max-w-[1600px] flex rounded-none sm:rounded-xl lg:rounded-2xl border border-frame-border bg-surface text-primary select-none overflow-hidden shadow-2xl shadow-black/30">
          <Sidebar />

          <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
            <PomodoroBar />
            <PageTransition pageKey={page}>
              {page === "quests" && <QuestBoard />}
              {page === "hero" && <HeroStatus />}
              {page === "catalog" && <SkillCatalog />}
              {page === "shop" && <Shop />}
              {page === "stats" && <StatsDashboard />}
              {page === "settings" && <Settings />}
              {page === "calendar" && <CalendarBoard />}
              {page === "habits" && <HabitTracker />}
              {page === "journal" && <Journal />}
              {page === "equipment" && <Equipment />}
              {page === "achievements" && <AchievementShowcase />}
              {page === "review" && <YearInReview />}
              {page === "chains" && <QuestChains />}
              {page === "templates" && <TemplateManager />}
            </PageTransition>
          </main>

          <SkillBank />
          <SkillDetail />
          <FocusMode />
          <QuickCapture />
          <ErrorToast />
          <LevelUpOverlay />
          <AchievementPopup />
          <UndoToast />
          <ShortcutHelp />
          <Tutorial />
        </div>
      </div>
    </FloatingRewardProvider>
  );
}

export default App;
