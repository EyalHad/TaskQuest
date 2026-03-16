import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  Skill, Quest, GameStats, CreateQuestInput, CreateSkillInput, SkillNode,
  Profile, CreateProfileInput, SubTask, Tag, QuestTemplate, CreateTemplateInput,
  Achievement, ActivityEntry, DaySummary, WeeklyReport, UpdateSkillInput,
  CatalogCategory, QuickStartBundle,
  Chain, Challenge, Habit, JournalEntry, EquipmentItem, YearSummary,
} from "../types";
import { DEFAULT_GAME_STATS } from "../types";
import { buildTree } from "../lib/skill-tree";
import { applyTheme } from "../lib/themes";
import { checkAndNotify } from "../lib/notifications";
import { setSoundPack, playSound } from "../lib/sounds";

export type Page = "home" | "quests" | "hero" | "shop" | "stats" | "settings" | "catalog" | "calendar" | "habits" | "journal" | "equipment" | "achievements" | "review" | "chains" | "templates";

interface Flyup { id: number; xp: number; boosted: boolean }

interface AppStore {
  profiles: Profile[];
  activeProfileId: number | null;

  skills: Skill[];
  skillTree: SkillNode[];
  quests: Quest[];
  archivedQuests: Quest[];
  stats: GameStats;
  tags: Tag[];
  templates: QuestTemplate[];
  achievements: Achievement[];
  catalog: CatalogCategory[];
  bundles: QuickStartBundle[];
  archivedSkills: Skill[];
  skillQuestCounts: Record<number, number>;
  dailyBounties: number[];
  firstBloodAvailable: boolean;
  comboCount: number;
  comboTimeout: ReturnType<typeof setTimeout> | null;
  undoQuestId: number | null;
  undoTimeout: ReturnType<typeof setTimeout> | null;
  chains: Chain[];
  dailyChallenges: Challenge[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  equipment: EquipmentItem[];
  skillDecayEnabled: boolean;
  yearSummary: YearSummary | null;

  selectedSkillId: number | null;
  skillDetailOpen: boolean;
  skillBankOpen: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  page: Page;

  flyups: Flyup[];
  levelUpPending: { level: number; text: string } | null;
  achievementPopup: { key: string; title: string; description: string; icon: string } | null;

  pomodoroQuestId: number | null;
  pomodoroSecondsLeft: number;
  pomodoroRunning: boolean;
  trackingQuestId: number | null;
  trackingStartTime: number | null;

  selectMode: boolean;
  selectedQuestIds: number[];
  focusQuestId: number | null;
  quickCaptureOpen: boolean;
  shortcutHelpOpen: boolean;
  pomodoroDuration: number;

  init: () => Promise<void>;
  loadProfiles: () => Promise<void>;
  createProfile: (input: CreateProfileInput) => Promise<void>;
  deleteProfile: (profileId: number) => Promise<void>;
  setActiveProfile: (profileId: number) => Promise<void>;

  loadSkills: () => Promise<void>;
  loadQuests: () => Promise<void>;
  loadArchivedQuests: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadTags: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  loadCatalog: () => Promise<void>;
  addCatalogSkill: (catalogSkillId: string) => Promise<void>;
  addCatalogBundle: (bundleKey: string) => Promise<void>;
  getCatalogSuggestions: (skillId: number) => Promise<string[]>;

  createQuest: (input: CreateQuestInput) => Promise<Quest | undefined>;
  toggleQuest: (questId: number) => Promise<void>;
  failQuest: (questId: number) => Promise<void>;
  deleteQuest: (questId: number) => Promise<void>;
  updateQuestDescription: (questId: number, desc: string) => Promise<void>;
  togglePinQuest: (questId: number) => Promise<void>;
  archiveQuest: (questId: number) => Promise<void>;
  unarchiveQuest: (questId: number) => Promise<void>;
  reorderQuests: (ids: number[]) => Promise<void>;
  toggleRecurring: (questId: number) => Promise<void>;
  updateRecurrencePattern: (questId: number, pattern: string) => Promise<void>;

  createSubTask: (questId: number, title: string) => Promise<SubTask | null>;
  toggleSubTask: (subTaskId: number) => Promise<void>;
  deleteSubTask: (subTaskId: number) => Promise<void>;

  addTagToQuest: (questId: number, tagName: string) => Promise<void>;
  removeTagFromQuest: (questId: number, tagId: number) => Promise<void>;

  createTemplate: (input: CreateTemplateInput) => Promise<void>;
  deleteTemplate: (templateId: number) => Promise<void>;
  createQuestFromTemplate: (templateId: number) => Promise<void>;

  createSkill: (input: CreateSkillInput) => Promise<void>;
  deleteSkill: (skillId: number) => Promise<void>;
  updateSkill: (skillId: number, input: UpdateSkillInput) => Promise<void>;
  moveSkill: (skillId: number, newParentId: number, newCategory: string) => Promise<void>;
  archiveSkill: (skillId: number) => Promise<void>;
  unarchiveSkill: (skillId: number) => Promise<void>;
  loadArchivedSkills: () => Promise<void>;
  reorderSkills: (skillIds: number[]) => Promise<void>;
  loadSkillQuestCounts: () => Promise<void>;
  loadDailyBounties: () => Promise<void>;
  recoverFailedQuest: (questId: number) => Promise<void>;
  rescheduleQuest: (questId: number, newDueDate: string) => Promise<void>;
  setQuestDependency: (questId: number, blockedBy: number | null) => Promise<void>;
  setSkillTarget: (skillId: number, targetLevel: number | null) => Promise<void>;
  loadYearSummary: (year: number) => Promise<void>;

  loadChains: () => Promise<void>;
  createChain: (name: string, description: string, bonusGold: number, bonusXp: number) => Promise<void>;
  setQuestChain: (questId: number, chainId: number | null, chainOrder: number) => Promise<void>;
  deleteChain: (chainId: number) => Promise<void>;

  loadDailyChallenges: () => Promise<void>;

  loadHabits: () => Promise<void>;
  createHabit: (name: string, icon: string, skillId: number | null, xpPerCheck: number) => Promise<void>;
  updateHabit: (habitId: number, name: string, icon: string, xpPerCheck: number, skillId: number | null) => Promise<void>;
  deleteHabit: (habitId: number) => Promise<void>;
  checkHabit: (habitId: number) => Promise<void>;
  getHabitEntries: (habitId: number, from: string, to: string) => Promise<string[]>;

  prestigeSkill: (skillId: number) => Promise<void>;

  loadEquipment: () => Promise<void>;
  equipItem: (itemKey: string) => Promise<void>;
  unequipItem: (itemKey: string) => Promise<void>;

  createJournalEntry: (content: string, mood?: string) => Promise<void>;
  loadJournalEntries: (limit?: number) => Promise<void>;
  updateJournalEntry: (entryId: number, content: string, mood: string | null) => Promise<void>;
  deleteJournalEntry: (entryId: number) => Promise<void>;

  updateTemplateSchedule: (templateId: number, pattern: string | null, active: boolean) => Promise<void>;
  toggleSkillDecay: () => void;
  activateSkillBoost: (skillId: number, mult: number, durationHours: number) => Promise<void>;
  purchaseItem: (itemKey: string) => Promise<void>;

  completePomodoro: (questId: number) => Promise<void>;
  addTimeToQuest: (questId: number, seconds: number) => Promise<void>;

  getActivitySummary: (from: string, to: string) => Promise<DaySummary[]>;
  getSkillActivity: (skillId: number, limit: number) => Promise<ActivityEntry[]>;
  getWeeklyReport: () => Promise<WeeklyReport | null>;
  getSmartSuggestions: () => Promise<string[]>;
  exportProfileData: () => Promise<unknown>;

  updateProfileTheme: (theme: string) => Promise<void>;
  updateProfileSound: (pack: string) => Promise<void>;
  setDefaultSkill: (skillId: number | null) => Promise<void>;

  addFlyup: (xp: number, boosted: boolean) => void;
  removeFlyup: (id: number) => void;
  dismissLevelUp: () => void;
  dismissAchievement: () => void;
  triggerUndo: (questId: number) => void;
  dismissUndo: () => void;
  undoComplete: () => Promise<void>;

  startPomodoro: (questId: number) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  cancelPomodoro: () => void;
  tickPomodoro: () => void;
  startTracking: (questId: number) => void;
  stopTracking: () => Promise<void>;

  setSelectMode: (on: boolean) => void;
  toggleQuestSelection: (id: number) => void;
  setFocusQuest: (id: number | null) => void;
  setQuickCapture: (open: boolean) => void;
  setShortcutHelp: (open: boolean) => void;
  setPomodoroDuration: (seconds: number) => void;

  selectSkill: (skillId: number | null) => void;
  openSkillDetail: (skillId: number) => void;
  closeSkillDetail: () => void;
  openSkillBank: () => void;
  closeSkillBank: () => void;
  clearError: () => void;
  setPage: (page: Page) => void;

  colorMode: "light" | "dark";
  toggleColorMode: () => void;

  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
}

let flyupCounter = 0;

export const useStore = create<AppStore>((set, get) => ({
  profiles: [], activeProfileId: null,
  skills: [], skillTree: [], quests: [], archivedQuests: [], stats: DEFAULT_GAME_STATS,
  tags: [], templates: [], achievements: [], catalog: [], bundles: [], archivedSkills: [], skillQuestCounts: {}, dailyBounties: [], firstBloodAvailable: true,
  chains: [], dailyChallenges: [], habits: [], journalEntries: [], equipment: [],
  comboCount: 0, comboTimeout: null as ReturnType<typeof setTimeout> | null,
  undoQuestId: null as number | null,
  undoTimeout: null as ReturnType<typeof setTimeout> | null,
  skillDecayEnabled: localStorage.getItem("taskquest_skill_decay") === "true",
  yearSummary: null,
  selectedSkillId: null, skillDetailOpen: false, skillBankOpen: false,
  loading: false, initialized: false, error: null, page: "home",
  flyups: [], levelUpPending: null, achievementPopup: null,
  pomodoroQuestId: null, pomodoroSecondsLeft: 0, pomodoroRunning: false,
  trackingQuestId: null, trackingStartTime: null,
  selectMode: false, selectedQuestIds: [],
  focusQuestId: null, quickCaptureOpen: false, shortcutHelpOpen: false,
  pomodoroDuration: parseInt(localStorage.getItem("taskquest_pomodoro_duration") || "1500", 10),
  colorMode: (localStorage.getItem("taskquest_color_mode") as "light" | "dark")
    || (window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark"),
  showTutorial: false,

  init: async () => {
    await Promise.all([get().loadProfiles(), get().loadCatalog()]);
    const { profiles } = get();
    if (profiles.length === 1) {
      await get().setActiveProfile(profiles[0].id);
    }
    set({ initialized: true });
  },

  loadProfiles: async () => {
    try {
      const profiles = await invoke<Profile[]>("get_profiles");
      set({ profiles });
    } catch (e) { set({ error: String(e) }); }
  },

  createProfile: async (input) => {
    try {
      set({ loading: true });
      await invoke<Profile>("create_profile", { input });
      await get().loadProfiles();
    } catch (e) { set({ error: String(e) }); } finally { set({ loading: false }); }
  },

  deleteProfile: async (profileId) => {
    try {
      await invoke("delete_profile", { profileId });
      if (get().activeProfileId === profileId) {
        set({ activeProfileId: null, page: "home", skills: [], skillTree: [], quests: [], stats: DEFAULT_GAME_STATS });
      }
      await get().loadProfiles();
    } catch (e) { set({ error: String(e) }); }
  },

  setActiveProfile: async (profileId) => {
    set({ activeProfileId: profileId, page: "quests", initialized: false });
    try { await invoke("init_profile", { profileId }); } catch { /* non-critical */ }
    await Promise.all([get().loadSkills(), get().loadQuests(), get().loadStats(), get().loadTags(), get().loadTemplates(), get().loadAchievements()]);
    await get().loadSkillQuestCounts();
    await get().loadDailyBounties();
    await Promise.all([get().loadChains(), get().loadDailyChallenges(), get().loadHabits(), get().loadEquipment()]);
    if (get().skillDecayEnabled) {
      try { await invoke("apply_skill_decay", { profileId }); } catch { /* non-critical */ }
    }
    set({ firstBloodAvailable: true });
    checkAndNotify(get().quests).catch(() => {});
    const profile = get().profiles.find(p => p.id === profileId);
    if (profile) {
      applyTheme(profile.activeTheme, get().colorMode);
      setSoundPack(profile.soundPack);
    }
    if (profile && profile.totalXp === 0 && !localStorage.getItem(`taskquest_tutorial_done_${profileId}`)) {
      set({ showTutorial: true });
    }
    set({ initialized: true });
  },

  loadSkills: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const skills = await invoke<Skill[]>("get_skill_tree", { profileId: pid });
      set({ skills, skillTree: buildTree(skills) });
    } catch (e) { set({ error: String(e) }); }
  },

  loadQuests: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const quests = await invoke<Quest[]>("get_all_quests", { profileId: pid });
      set({ quests });
    } catch (e) { set({ error: String(e) }); }
  },

  loadArchivedQuests: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const archivedQuests = await invoke<Quest[]>("get_archived_quests", { profileId: pid });
      set({ archivedQuests });
    } catch (e) { set({ error: String(e) }); }
  },

  loadStats: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const stats = await invoke<GameStats>("get_game_stats", { profileId: pid });
      set({ stats });
    } catch (e) { set({ error: String(e) }); }
  },

  loadTags: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const tags = await invoke<Tag[]>("get_all_tags", { profileId: pid });
      set({ tags });
    } catch (e) { set({ error: String(e) }); }
  },

  loadTemplates: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const templates = await invoke<QuestTemplate[]>("get_templates", { profileId: pid });
      set({ templates });
    } catch (e) { set({ error: String(e) }); }
  },

  loadAchievements: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const achievements = await invoke<Achievement[]>("get_achievements", { profileId: pid });
      set({ achievements });
    } catch (e) { set({ error: String(e) }); }
  },

  loadCatalog: async () => {
    try {
      const [catalog, bundles] = await Promise.all([
        invoke<CatalogCategory[]>("get_skill_catalog"),
        invoke<QuickStartBundle[]>("get_quick_start_bundles"),
      ]);
      set({ catalog, bundles });
    } catch (e) { set({ error: String(e) }); }
  },

  addCatalogSkill: async (catalogSkillId) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      set({ loading: true });
      await invoke("add_catalog_skill", { profileId: pid, catalogSkillId });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); } finally { set({ loading: false }); }
  },

  addCatalogBundle: async (bundleKey) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      set({ loading: true });
      await invoke("add_catalog_bundle", { profileId: pid, bundleKey });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); } finally { set({ loading: false }); }
  },

  getCatalogSuggestions: async (skillId) => {
    try { return await invoke<string[]>("get_catalog_suggestions", { skillId }); }
    catch { return []; }
  },

  createQuest: async (input) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      set({ loading: true });
      const created = await invoke<Quest>("create_quest", { profileId: pid, input });
      await Promise.all([get().loadQuests(), get().loadStats()]);
      return created;
    } catch (e) { set({ error: String(e) }); } finally { set({ loading: false }); }
  },

  toggleQuest: async (questId) => {
    const pid = get().activeProfileId; if (!pid) return;
    const quest = get().quests.find(q => q.id === questId);
    const prevLevel = get().stats.currentLevel;
    try {
      const result = await invoke<{ skill: Skill | null; stats: GameStats; newAchievements: string[]; firstBlood: boolean; comboCount: number }>("toggle_quest", { profileId: pid, questId });
      set({ stats: result.stats });
      if (!quest?.completed) {
        playSound("quest_complete");
        if (result.stats.currentLevel > prevLevel) {
          playSound("level_up");
          set({ levelUpPending: { level: result.stats.currentLevel, text: quest?.isBoss ? "BOSS DEFEATED!" : "LEVEL UP!" } });
        } else if (quest?.isBoss) {
          set({ levelUpPending: { level: result.stats.currentLevel, text: "BOSS DEFEATED!" } });
        }
        if (result.stats.gold > get().stats.gold) playSound("gold_clink");
        if (result.firstBlood) {
          get().addFlyup(5, false);
          set({ firstBloodAvailable: false });
        }
        if (result.comboCount > 0) {
          const prev = get().comboTimeout;
          if (prev) clearTimeout(prev);
          const timeout = setTimeout(() => set({ comboCount: 0, comboTimeout: null }), 3000);
          set({ comboCount: result.comboCount, comboTimeout: timeout });
        }
      }
      if (!quest?.completed) {
        get().triggerUndo(questId);
      } else {
        get().dismissUndo();
      }
      if (result.newAchievements?.length) {
        const { getMilestone } = await import("../lib/milestones");
        for (const key of result.newAchievements) {
          const m = getMilestone(key);
          if (m) set({ achievementPopup: m });
        }
      }
      await Promise.all([get().loadSkills(), get().loadQuests(), get().loadAchievements()]);
      await get().loadDailyChallenges();
    } catch (e) { set({ error: String(e) }); }
  },

  failQuest: async (questId) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const result = await invoke<{ stats: GameStats }>("fail_quest", { profileId: pid, questId });
      playSound("quest_fail");
      set({ stats: result.stats });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  deleteQuest: async (questId) => {
    try {
      await invoke("delete_quest", { questId });
      await Promise.all([get().loadQuests(), get().loadStats()]);
    } catch (e) { set({ error: String(e) }); }
  },

  updateQuestDescription: async (questId, desc) => {
    try {
      await invoke("update_quest_description", { questId, description: desc });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  togglePinQuest: async (questId) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke<Quest>("toggle_pin_quest", { profileId: pid, questId });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  archiveQuest: async (questId) => {
    try {
      await invoke("archive_quest", { questId });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  unarchiveQuest: async (questId) => {
    try {
      await invoke("unarchive_quest", { questId });
      await Promise.all([get().loadQuests(), get().loadArchivedQuests()]);
    } catch (e) { set({ error: String(e) }); }
  },

  reorderQuests: async (ids) => {
    try {
      await invoke("reorder_quests", { questIds: ids });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  toggleRecurring: async (questId) => {
    try {
      await invoke("toggle_recurring", { questId });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  updateRecurrencePattern: async (questId, pattern) => {
    try {
      await invoke("update_recurrence_pattern", { questId, pattern });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  createSubTask: async (questId, title) => {
    try {
      return await invoke<SubTask>("create_sub_task", { questId, title });
    } catch (e) { set({ error: String(e) }); return null; }
  },

  toggleSubTask: async (subTaskId) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const result = await invoke<{ questId: number; autoCompleted: boolean }>("toggle_sub_task", { profileId: pid, subTaskId });
      if (result.autoCompleted) await get().toggleQuest(result.questId);
      else await Promise.all([get().loadSkills(), get().loadStats()]);
    } catch (e) { set({ error: String(e) }); }
  },

  deleteSubTask: async (subTaskId) => {
    try { await invoke("delete_sub_task", { subTaskId }); } catch (e) { set({ error: String(e) }); }
  },

  addTagToQuest: async (questId, tagName) => {
    try {
      await invoke<Tag>("add_tag_to_quest", { questId, tagName });
      await get().loadTags();
    } catch (e) { set({ error: String(e) }); }
  },

  removeTagFromQuest: async (questId, tagId) => {
    try {
      await invoke("remove_tag_from_quest", { questId, tagId });
      await get().loadTags();
    } catch (e) { set({ error: String(e) }); }
  },

  createTemplate: async (input) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke<QuestTemplate>("create_template", { profileId: pid, input });
      await get().loadTemplates();
    } catch (e) { set({ error: String(e) }); }
  },

  deleteTemplate: async (templateId) => {
    try {
      await invoke("delete_template", { templateId });
      await get().loadTemplates();
    } catch (e) { set({ error: String(e) }); }
  },

  createQuestFromTemplate: async (templateId) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke<Quest>("create_quest_from_template", { profileId: pid, templateId });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  createSkill: async (input) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      set({ loading: true });
      await invoke<Skill>("create_skill", { profileId: pid, input });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); } finally { set({ loading: false }); }
  },

  deleteSkill: async (skillId) => {
    try {
      await invoke("delete_skill", { skillId });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); }
  },

  updateSkill: async (skillId, input) => {
    try {
      set({ loading: true });
      await invoke("update_skill", { skillId, input });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); } finally { set({ loading: false }); }
  },

  moveSkill: async (skillId, newParentId, newCategory) => {
    try {
      await invoke("move_skill", { skillId, newParentId, newCategory });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); }
  },

  archiveSkill: async (skillId) => {
    try {
      await invoke("archive_skill", { skillId });
      await Promise.all([get().loadSkills(), get().loadArchivedSkills()]);
    } catch (e) { set({ error: String(e) }); }
  },

  unarchiveSkill: async (skillId) => {
    try {
      await invoke("unarchive_skill", { skillId });
      await Promise.all([get().loadSkills(), get().loadArchivedSkills()]);
    } catch (e) { set({ error: String(e) }); }
  },

  loadArchivedSkills: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const archivedSkills = await invoke<Skill[]>("get_archived_skills", { profileId: pid });
      set({ archivedSkills });
    } catch (e) { set({ error: String(e) }); }
  },

  reorderSkills: async (skillIds) => {
    try {
      await invoke("reorder_skills", { skillIds });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); }
  },

  loadSkillQuestCounts: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const pairs = await invoke<[number, number][]>("get_skill_quest_counts", { profileId: pid });
      const counts: Record<number, number> = {};
      for (const [sid, cnt] of pairs) counts[sid] = cnt;
      set({ skillQuestCounts: counts });
    } catch (e) { set({ error: String(e) }); }
  },

  loadDailyBounties: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const bounties = await invoke<number[]>("get_daily_bounties", { profileId: pid });
      set({ dailyBounties: bounties });
    } catch (e) { set({ error: String(e) }); }
  },

  recoverFailedQuest: async (questId) => {
    try {
      await invoke("recover_failed_quest", { questId });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  rescheduleQuest: async (questId, newDueDate) => {
    try {
      await invoke("reschedule_quest", { questId, dueDate: newDueDate });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  setQuestDependency: async (questId, blockedBy) => {
    try {
      await invoke("set_quest_dependency", { questId, blockedByQuestId: blockedBy });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  setSkillTarget: async (skillId, targetLevel) => {
    try {
      await invoke("set_skill_target", { skillId, targetLevel });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); }
  },

  loadYearSummary: async (year) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const yearSummary = await invoke<YearSummary>("get_year_summary", { profileId: pid, year });
      set({ yearSummary });
    } catch (e) { set({ error: String(e) }); }
  },

  loadChains: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const chains = await invoke<Chain[]>("get_chains", { profileId: pid });
      set({ chains });
    } catch (e) { set({ error: String(e) }); }
  },

  createChain: async (name, description, bonusGold, bonusXp) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke<Chain>("create_chain", { profileId: pid, name, description, bonusGold, bonusXp });
      await get().loadChains();
    } catch (e) { set({ error: String(e) }); }
  },

  setQuestChain: async (questId, chainId, chainOrder) => {
    try {
      await invoke("set_quest_chain", { questId, chainId, chainOrder });
      await get().loadQuests();
    } catch (e) { set({ error: String(e) }); }
  },

  deleteChain: async (chainId) => {
    try {
      await invoke("delete_chain", { chainId });
      await Promise.all([get().loadChains(), get().loadQuests()]);
    } catch (e) { set({ error: String(e) }); }
  },

  loadDailyChallenges: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const dailyChallenges = await invoke<Challenge[]>("get_daily_challenges", { profileId: pid });
      set({ dailyChallenges });
    } catch (e) { set({ error: String(e) }); }
  },

  loadHabits: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const habits = await invoke<Habit[]>("get_habits", { profileId: pid });
      set({ habits });
    } catch (e) { set({ error: String(e) }); }
  },

  createHabit: async (name, icon, skillId, xpPerCheck) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke<Habit>("create_habit", { profileId: pid, name, icon, skillId, xpPerCheck });
      await get().loadHabits();
    } catch (e) { set({ error: String(e) }); }
  },

  updateHabit: async (habitId, name, icon, xpPerCheck, skillId) => {
    try {
      await invoke("update_habit", { habitId, name, icon, xpPerCheck, skillId });
      await get().loadHabits();
    } catch (e) { set({ error: String(e) }); }
  },

  deleteHabit: async (habitId) => {
    try {
      await invoke("delete_habit", { habitId });
      await get().loadHabits();
    } catch (e) { set({ error: String(e) }); }
  },

  checkHabit: async (habitId) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const stats = await invoke<GameStats>("check_habit", { profileId: pid, habitId });
      set({ stats });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); }
  },

  getHabitEntries: async (habitId, from, to) => {
    try { return await invoke<string[]>("get_habit_entries", { habitId, fromDate: from, toDate: to }); }
    catch { return []; }
  },

  prestigeSkill: async (skillId) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke<Skill>("prestige_skill", { profileId: pid, skillId });
      await Promise.all([get().loadSkills(), get().loadStats()]);
    } catch (e) { set({ error: String(e) }); }
  },

  loadEquipment: async () => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const equipment = await invoke<EquipmentItem[]>("get_equipment", { profileId: pid });
      set({ equipment });
    } catch (e) { set({ error: String(e) }); }
  },

  equipItem: async (itemKey) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke("equip_item", { profileId: pid, itemKey });
      await get().loadEquipment();
    } catch (e) { set({ error: String(e) }); }
  },

  unequipItem: async (itemKey) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke("unequip_item", { profileId: pid, itemKey });
      await get().loadEquipment();
    } catch (e) { set({ error: String(e) }); }
  },

  createJournalEntry: async (content, mood) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke<JournalEntry>("create_journal_entry", { profileId: pid, content, mood: mood || null });
      await Promise.all([get().loadJournalEntries(), get().loadStats()]);
    } catch (e) { set({ error: String(e) }); }
  },

  loadJournalEntries: async (limit = 50) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const journalEntries = await invoke<JournalEntry[]>("get_journal_entries", { profileId: pid, limit });
      set({ journalEntries });
    } catch (e) { set({ error: String(e) }); }
  },

  updateJournalEntry: async (entryId, content, mood) => {
    try {
      await invoke("update_journal_entry", { entryId, content, mood });
      await get().loadJournalEntries();
    } catch (e) { set({ error: String(e) }); }
  },

  deleteJournalEntry: async (entryId) => {
    try {
      await invoke("delete_journal_entry", { entryId });
      await get().loadJournalEntries();
    } catch (e) { set({ error: String(e) }); }
  },

  updateTemplateSchedule: async (templateId, pattern, active) => {
    try {
      await invoke("update_template_schedule", { templateId, pattern, active });
      await get().loadTemplates();
    } catch (e) { set({ error: String(e) }); }
  },

  toggleSkillDecay: () => {
    const next = !get().skillDecayEnabled;
    localStorage.setItem("taskquest_skill_decay", String(next));
    set({ skillDecayEnabled: next });
  },

  activateSkillBoost: async (skillId, mult, durationHours) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke("activate_skill_boost", { profileId: pid, skillId, mult, durationHours });
      await get().loadStats();
    } catch (e) { set({ error: String(e) }); }
  },

  purchaseItem: async (itemKey) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      set({ loading: true });
      playSound("purchase");
      const stats = await invoke<GameStats>("purchase_item", { profileId: pid, itemKey });
      set({ stats });
      await get().loadProfiles();
      if (itemKey.startsWith("theme_")) {
        const profile = get().profiles.find(p => p.id === pid);
        if (profile) applyTheme(profile.activeTheme, get().colorMode);
      }
    } catch (e) { set({ error: String(e) }); } finally { set({ loading: false }); }
  },

  completePomodoro: async (questId) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      const stats = await invoke<GameStats>("complete_pomodoro", { profileId: pid, questId });
      set({ stats });
      await get().loadSkills();
    } catch (e) { set({ error: String(e) }); }
  },

  addTimeToQuest: async (questId, seconds) => {
    try { await invoke("add_time_to_quest", { questId, seconds }); } catch (e) { set({ error: String(e) }); }
  },

  getActivitySummary: async (from, to) => {
    const pid = get().activeProfileId; if (!pid) return [];
    try { return await invoke<DaySummary[]>("get_activity_summary", { profileId: pid, fromDate: from, toDate: to }); }
    catch { return []; }
  },

  getSkillActivity: async (skillId, limit) => {
    try { return await invoke<ActivityEntry[]>("get_skill_activity", { skillId, limit }); }
    catch { return []; }
  },

  getWeeklyReport: async () => {
    const pid = get().activeProfileId; if (!pid) return null;
    try { return await invoke<WeeklyReport>("get_weekly_report", { profileId: pid }); }
    catch { return null; }
  },

  getSmartSuggestions: async () => {
    const pid = get().activeProfileId; if (!pid) return [];
    try { return await invoke<string[]>("get_smart_suggestions", { profileId: pid }); }
    catch { return []; }
  },

  exportProfileData: async () => {
    const pid = get().activeProfileId; if (!pid) return null;
    try { return await invoke<unknown>("export_profile_data", { profileId: pid }); }
    catch (e) { set({ error: String(e) }); return null; }
  },

  updateProfileTheme: async (theme) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke("update_profile_theme", { profileId: pid, theme });
      applyTheme(theme, get().colorMode);
      await get().loadProfiles();
    } catch (e) { set({ error: String(e) }); }
  },

  updateProfileSound: async (pack) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke("update_profile_sound", { profileId: pid, pack });
      setSoundPack(pack);
      await get().loadProfiles();
    } catch (e) { set({ error: String(e) }); }
  },

  setDefaultSkill: async (skillId) => {
    const pid = get().activeProfileId; if (!pid) return;
    try {
      await invoke("set_default_skill", { profileId: pid, skillId });
      await get().loadProfiles();
    } catch (e) { set({ error: String(e) }); }
  },

  addFlyup: (xp, boosted) => { const id = ++flyupCounter; set(s => ({ flyups: [...s.flyups, { id, xp, boosted }] })); },
  removeFlyup: (id) => set(s => ({ flyups: s.flyups.filter(f => f.id !== id) })),
  dismissLevelUp: () => set({ levelUpPending: null }),
  dismissAchievement: () => set({ achievementPopup: null }),
  triggerUndo: (questId) => {
    const prev = get().undoTimeout;
    if (prev) clearTimeout(prev);
    const timeout = setTimeout(() => set({ undoQuestId: null, undoTimeout: null }), 5000);
    set({ undoQuestId: questId, undoTimeout: timeout });
  },
  dismissUndo: () => {
    const prev = get().undoTimeout;
    if (prev) clearTimeout(prev);
    set({ undoQuestId: null, undoTimeout: null });
  },
  undoComplete: async () => {
    const questId = get().undoQuestId;
    if (!questId) return;
    const prev = get().undoTimeout;
    if (prev) clearTimeout(prev);
    set({ undoQuestId: null, undoTimeout: null });
    await get().toggleQuest(questId);
  },

  startPomodoro: (questId) => set(s => ({ pomodoroQuestId: questId, pomodoroSecondsLeft: s.pomodoroDuration, pomodoroRunning: true })),
  pausePomodoro: () => set({ pomodoroRunning: false }),
  resumePomodoro: () => set({ pomodoroRunning: true }),
  cancelPomodoro: () => set({ pomodoroQuestId: null, pomodoroSecondsLeft: 0, pomodoroRunning: false }),
  tickPomodoro: () => {
    const s = get();
    if (!s.pomodoroRunning || s.pomodoroSecondsLeft <= 0) return;
    const next = s.pomodoroSecondsLeft - 1;
    if (next <= 0 && s.pomodoroQuestId) {
      const questId = s.pomodoroQuestId;
      set({ pomodoroSecondsLeft: 0, pomodoroRunning: false, pomodoroQuestId: null });
      playSound("quest_complete");
      get().completePomodoro(questId);
    } else {
      set({ pomodoroSecondsLeft: next });
    }
  },

  startTracking: (questId) => set({ trackingQuestId: questId, trackingStartTime: Date.now() }),
  stopTracking: async () => {
    const { trackingQuestId, trackingStartTime } = get();
    if (trackingQuestId && trackingStartTime) {
      const seconds = Math.floor((Date.now() - trackingStartTime) / 1000);
      if (seconds > 0) await get().addTimeToQuest(trackingQuestId, seconds);
    }
    set({ trackingQuestId: null, trackingStartTime: null });
  },

  setSelectMode: (on) => set({ selectMode: on, selectedQuestIds: on ? [] : [] }),
  toggleQuestSelection: (id) => set(s => ({
    selectedQuestIds: s.selectedQuestIds.includes(id) ? s.selectedQuestIds.filter(x => x !== id) : [...s.selectedQuestIds, id],
  })),
  setFocusQuest: (id) => set({ focusQuestId: id }),
  setQuickCapture: (open) => set({ quickCaptureOpen: open }),
  setShortcutHelp: (open) => set({ shortcutHelpOpen: open }),

  setPomodoroDuration: (seconds) => {
    localStorage.setItem("taskquest_pomodoro_duration", String(seconds));
    set({ pomodoroDuration: seconds });
  },
  selectSkill: (skillId) => set({ selectedSkillId: skillId }),
  openSkillDetail: (skillId) => set({ selectedSkillId: skillId, skillDetailOpen: true }),
  closeSkillDetail: () => set({ skillDetailOpen: false }),
  openSkillBank: () => set({ skillBankOpen: true }),
  closeSkillBank: () => set({ skillBankOpen: false }),
  clearError: () => set({ error: null }),
  setPage: (page) => set({ page }),

  toggleColorMode: () => {
    const current = get().colorMode;
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("taskquest_color_mode", next);
    set({ colorMode: next });
    const profile = get().profiles.find(p => p.id === get().activeProfileId);
    applyTheme(profile?.activeTheme ?? "default", next);
  },

  setShowTutorial: (show) => set({ showTutorial: show }),
}));
