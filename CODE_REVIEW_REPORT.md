# Second-Pass Code Review Report — React/TypeScript src/

**Scope:** All React/TypeScript source files in `src/` (components, store, types, lib, App.tsx, main.tsx, index.css)  
**Focus:** Issues missed in the first pass — state management, null safety, type safety, UI/UX, memory leaks, invoke mismatches, broken flows, CSS, accessibility, performance.

---

## 1. State Management Bugs

### 1.1 **store/index.ts:302–305 — `setTimeout` in `toggleQuest` not cleaned up on unmount**
```typescript
if (result.comboCount > 0) {
  set({ comboCount: result.comboCount });
  setTimeout(() => set({ comboCount: 0 }), 3000);
}
```
**Issue:** If the component unmounts before 3 seconds, `set({ comboCount: 0 })` still runs and can update state after unmount.  
**Fix:** Store the timeout ID and clear it in a cleanup, or use a ref to track mounted state.

### 1.2 **store/index.ts:686 — `completePomodoro` called without `await` in `tickPomodoro`**
```typescript
if (next <= 0 && s.pomodoroQuestId) {
  s.completePomodoro(s.pomodoroQuestId);  // Fire-and-forget
  playSound("quest_complete");
  set({ pomodoroSecondsLeft: 0, pomodoroRunning: false, pomodoroQuestId: null });
}
```
**Issue:** `completePomodoro` is async but not awaited. Stats/skills may not update before UI reflects completion.  
**Fix:** `await s.completePomodoro(s.pomodoroQuestId)` (requires making `tickPomodoro` async and handling it in the interval).

### 1.3 **QuestBoard.tsx:102–107 — `skillId` effect can overwrite user selection**
```typescript
useEffect(() => {
  if (skillId === 0 && leafSkills.length > 0) {
    setSkillId(defaultSkillId || leafSkills[0].id);
  }
}, [leafSkills, defaultSkillId, skillId]);
```
**Issue:** When `skillId === 0` and `leafSkills` changes (e.g. after adding a skill), the effect resets `skillId` even if the user had explicitly chosen a different skill that was later removed. Also, `skillId === 0` can be a valid choice if there are no leaf skills initially.  
**Fix:** Only run when `skillId === 0` and `defaultSkillId`/`leafSkills` are available; avoid overwriting a non-zero `skillId` that the user set.

### 1.4 **QuestBoard.tsx:111 — `getSmartSuggestions` missing `profileId` guard**
```typescript
useEffect(() => {
  getSmartSuggestions().then(setSuggestions);
}, []);
```
**Issue:** `getSmartSuggestions` returns `[]` when `activeProfileId` is null, but the effect runs on mount before a profile may be selected. No re-run when profile changes.  
**Fix:** Add `activeProfileId` to the dependency array and guard: `if (activeProfileId) getSmartSuggestions().then(setSuggestions);`.

### 1.5 **SkillDetail.tsx:39 — `quests` in dependency array causes unnecessary refetches**
```typescript
useEffect(() => {
  if (!selectedSkillId || !skillDetailOpen) return;
  invoke<Quest[]>("get_quests_for_skill", { skillId: selectedSkillId }).then(setSkillQuests);
}, [selectedSkillId, skillDetailOpen, quests]);
```
**Issue:** `quests` changes on every quest completion/toggle. This refetches skill quests from the backend even when the change was local (e.g. completing a quest).  
**Fix:** Remove `quests` from deps if the backend is the source of truth, or merge local updates instead of refetching.

### 1.6 **SkillNode.tsx:93 — Same `quests` dependency issue**
```typescript
useEffect(() => {
  if (!expanded) return;
  invoke<Quest[]>("get_quests_for_skill", { skillId: node.id }).then(setSkillQuests);
}, [expanded, node.id, quests]);
```
**Issue:** Same as 1.5 — `quests` causes refetch on every quest change.  
**Fix:** Remove `quests` or use a different strategy for keeping skill quests in sync.

### 1.7 **AddQuestForm.tsx:27 — `skillId` initialized from `leafSkills[0]?.id ?? 0` when `leafSkills` may be empty**
```typescript
const [skillId, setSkillId] = useState<number>(preselectedSkillId ?? leafSkills[0]?.id ?? 0);
```
**Issue:** On first render, `leafSkills` may be `[]`, so `skillId` becomes `0`. Submitting with `skillId === 0` could fail or create a quest with an invalid skill.  
**Fix:** Add `useEffect` to set `skillId` when `leafSkills` loads and `skillId` is 0, similar to QuestBoard.

### 1.8 **CalendarQuickAdd.tsx:17 — `skillId` can stay `null` with no leaf skills**
```typescript
const [skillId, setSkillId] = useState<number | null>(null);
```
**Issue:** If `leafSkills` is empty, user can't select a skill. No effect to set a default when `leafSkills` loads.  
**Fix:** Add effect: when `leafSkills.length > 0` and `skillId === null`, set `skillId` to first leaf skill.

---

## 2. Null/Undefined Crashes

### 2.1 **DailyChallenges.tsx:23 — Division by zero when `c.target === 0`**
```typescript
const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
```
**Issue:** If `c.target === 0`, this yields `Infinity` or `NaN`.  
**Fix:** `const pct = c.target > 0 ? Math.min(100, Math.round((c.progress / c.target) * 100)) : 0;`

### 2.2 **AchievementShowcase.tsx:78 — Division by zero in progress**
```typescript
const pct = Math.round((progress.current / progress.target) * 100);
```
**Issue:** If `progress.target === 0`, division by zero.  
**Fix:** `const pct = progress.target > 0 ? Math.round((progress.current / progress.target) * 100) : 0;`

### 2.3 **TaskCard.tsx:274 — `blockerQuest!` non-null assertion**
```typescript
<span>Blocked by: {blockerQuest!.questName}</span>
```
**Issue:** `blockerQuest` is checked by `!!blockerQuest`, but TypeScript may not narrow it in all paths. Using `!` is risky.  
**Fix:** Use optional chaining: `{blockerQuest?.questName}` or keep the `!!blockerQuest` check and use `blockerQuest.questName` without `!`.

### 2.4 **Journal.tsx:93 — `entry.mood` may not match `MOODS` keys**
```typescript
const moodDef = MOODS.find((m) => m.key === entry.mood);
```
**Issue:** `entry.mood` can be `string | null`. If it's a string not in MOODS (e.g. from old data), `moodDef` is undefined — handled. But `entry.mood` could be `null` and `moodDef` would be undefined — also handled. Low risk, but worth noting.

### 2.5 **Profile type — `maxHp` and `hp` on Profile**
**Home.tsx:192** uses `p.maxHp` and `p.hp`. The `Profile` type in `types/profile.ts` has `hp` and `maxHp`. If backend returns 0 for `maxHp`, `hpPercent` calculation is safe (`maxHp > 0` check exists). No crash found.

### 2.6 **SkillBank.tsx:455 — `DeleteConfirmRow` expects `quests: { skillId: number }[]`**
```typescript
quests: { skillId: number }[];
```
**Issue:** Store passes `quests` (full `Quest[]`). `Quest` has `skillId`, so this works. Type could be `Quest[]` for clarity.

---

## 3. Type Safety

### 3.1 **Shop.tsx:186 — Unsafe cast for theme colors**
```typescript
style={{ backgroundColor: (t.colors[colorMode] as unknown as Record<string, string>)[c] }}
```
**Issue:** `as unknown as Record<string, string>` bypasses type checking. If `c` is not a key in the theme, result is `undefined`.  
**Fix:** Add a type guard or use a properly typed theme structure.

### 3.2 **Settings.tsx:145 — Same theme color cast**
```typescript
style={{ backgroundColor: (colors as unknown as Record<string, string>)[c] }}
```
**Issue:** Same as 3.1.  
**Fix:** Use a typed theme structure.

### 3.3 **AddQuestForm.tsx:108 — `createQuestFromTemplate` return value ignored**
```typescript
createQuestFromTemplate(Number(val)).then(() => { ... });
```
**Issue:** No error handling. If the promise rejects, the UI may not reflect failure.  
**Fix:** Add `.catch()` and show error or use store's error handling.

### 3.4 **QuestBoard.tsx:641 — Template select `onChange` resets value without awaiting**
```typescript
onChange={(e) => {
  const id = Number(e.target.value);
  if (id) createQuestFromTemplate(id);
  e.target.value = "";
}}
```
**Issue:** Resets `e.target.value` immediately. If `createQuestFromTemplate` fails, user loses selection. No loading/error feedback.  
**Fix:** Await the call, handle errors, then reset.

---

## 4. UI/UX Bugs

### 4.1 **QuickCapture.tsx:51–56 — Toast shown when modal is closed**
```typescript
if (!quickCaptureOpen) {
  return toast ? (
    <div className="...">Quest created!</div>
  ) : null;
}
```
**Issue:** When the user submits, `setQuickCapture(false)` runs and the modal closes. The component then renders the toast. But the toast uses `toastFading` and timeouts — if the user navigates away quickly, the toast may still be visible briefly. Minor.

### 4.2 **ShortcutHelp.tsx:30–37 — `setShortcutHelp` in dependency array but not used in handler**
```typescript
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setShortcutHelp(false);
  };
  if (shortcutHelpOpen) {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }
}, [shortcutHelpOpen, setShortcutHelp]);
```
**Issue:** `setShortcutHelp` is in deps but the effect doesn't need to re-run when it changes (it's stable from Zustand). Harmless.

### 4.3 **SkillDetail.tsx — No focus trap in modal**
**Issue:** When the modal opens, focus is not moved to the modal. Keyboard users may tab outside.  
**Fix:** Use `aria-modal="true"`, `role="dialog"`, and focus the first focusable element on open; trap focus inside.

### 4.4 **SkillBank, FocusMode, QuickCapture — Same modal focus/trap issues**
**Issue:** Modals/overlays don't trap focus or restore it on close.  
**Fix:** Implement focus trap and `aria-modal`/`role="dialog"` for accessibility.

### 4.5 **FocusMode.tsx:75 — Space key completes quest even when typing in textarea**
```typescript
} else if (e.key === " " && !e.repeat) {
  e.preventDefault();
  toggleQuest(focusQuestId);
  setFocusQuest(null);
}
```
**Issue:** If the user is typing in the description textarea and hits Space, the quest is completed.  
**Fix:** Check `e.target` — if it's an input/textarea, don't handle Space.

### 4.6 **App.tsx:70 — Same issue for `n` key**
```typescript
if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
  setQuickCapture(true);
  return;
}
```
**Issue:** Pressing "n" in an input opens Quick Capture.  
**Fix:** The `isInput` check at line 59 returns early for non-Escape keys only when `isInput` is true — but the check at line 70 doesn't consider `isInput`. The flow is: line 70 runs only if we didn't return at 69. At 69, we return if `isInput && e.key !== "Escape"`. So if `isInput` and key is "n", we would have returned at 69. Actually, 69 says `if (isInput && e.key !== "Escape") return;` — so for "n" in an input, we return. Good. Re-checking: for "n" in input, we hit 69 and return. So we never get to 70. OK.

### 4.7 **XpFlyup.tsx:18 — `onDone` in dependency array**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setVisible(false);
    onDone();
  }, 1000);
  return () => clearTimeout(timer);
}, [onDone]);
```
**Issue:** If `onDone` is not memoized (e.g. inline in TaskCard), it changes every render and the effect re-runs, resetting the timer.  
**Fix:** Ensure `onDone` is stable (e.g. `useCallback`) or remove from deps if it's safe.

---

## 5. Memory Leaks

### 5.1 **QuickCapture.tsx:51–56 — `setTimeout` not cleaned up**
```typescript
setTimeout(() => setToastFading(true), 1500);
setTimeout(() => {
  setToast(false);
  setToastFading(false);
}, 2000);
```
**Issue:** If the component unmounts before 2 seconds, these timeouts still run and call `setToast`/`setToastFading` on an unmounted component.  
**Fix:** Store timeout IDs and clear them in a `useEffect` cleanup.

### 5.2 **FloatingReward.tsx:30–32 — `setTimeout` in `showReward`**
```typescript
setTimeout(() => {
  setRewards((prev) => prev.filter((r) => r.id !== id));
}, 1300);
```
**Issue:** If the provider unmounts before 1300ms, the callback runs. Using functional update `setRewards(prev => ...)` is safer but the timeout itself is not cleared.  
**Fix:** Store timeout ID and clear on unmount if the reward is still pending.

### 5.3 **Confetti.tsx:76 — `onDone` in effect deps**
```typescript
}, [originX, originY, particleCount, onDone]);
```
**Issue:** If `onDone` changes, the effect re-runs and cancels the previous animation. If `onDone` is recreated every render, confetti restarts.  
**Fix:** Use `useRef` for `onDone` or ensure it's stable.

---

## 6. Invoke Mismatches

### 6.1 **QuestBoard.tsx:143 — `get_tags_for_quest` return type**
```typescript
const t = await invoke<{ id: number }[]>("get_tags_for_quest", { questId: q.id });
return { questId: q.id, tagIds: t.map((x) => x.id) };
```
**Issue:** Rust returns `Vec<Tag>` with `{ id, name }`. The frontend uses `{ id: number }[]` which is compatible. `t.map(x => x.id)` works. No mismatch.

### 6.2 **Store `loadSkillQuestCounts` — `get_skill_quest_counts`**
```typescript
const pairs = await invoke<[number, number][]>("get_skill_quest_counts", { profileId: pid });
```
**Issue:** Rust may return a different structure. Need to verify backend returns `[[skillId, count], ...]`. Not verified in this review.

### 6.3 **Shop.tsx:62 — `get_owned_items`**
```typescript
invoke<string[]>("get_owned_items", { profileId: activeProfileId }).then(setOwnedItems).catch(() => {});
```
**Issue:** Parameter is `profileId` (camelCase). Tauri converts to `profile_id`. Should be correct.

---

## 7. Broken User Flows

### 7.1 **Completing an already-completed quest**
**store/index.ts:384–388:** `toggleQuest` checks `!quest?.completed` for sound/level-up logic. If the user clicks complete on an already-completed quest, `toggleQuest` is still called. The backend likely un-completes it (toggle behavior). The `!quest?.completed` check means we won't play completion sound or show level-up — correct. But we should ensure the backend handles double-complete gracefully.

### 7.2 **Deleting a skill with active quests**
**SkillBank.tsx:454–468:** `DeleteConfirmRow` shows quest count and warns. User can still confirm. Backend `delete_skill` — need to verify: does it cascade delete quests, set skill_id to null, or fail? Not verified. Frontend at least warns.

### 7.3 **Navigate away during async operation**
**QuestBoard.tsx:262–278 — `handleBatchComplete`, `handleBatchArchive`, `handleBatchDelete`**
```typescript
const handleBatchComplete = async () => {
  for (const id of selectedQuestIds) {
    await toggleQuest(id);
  }
  setSelectMode(false);
};
```
**Issue:** If user navigates away mid-loop, `setSelectMode(false)` still runs. The loop continues in the background. Partial completion is possible.  
**Fix:** Consider aborting on unmount or using a single batch API if available.

### 7.4 **Pomodoro completion during navigation**
**FocusMode.tsx:** If user closes Focus Mode while Pomodoro is running, the interval in `FocusMode` is cleaned up (component unmounts). But the global `tickPomodoro` interval in `FocusMode` (line 61–63) uses `useStore.getState().tickPomodoro()` — that interval is in FocusMode's useEffect. When FocusMode unmounts (user exits), the interval is cleared. Good.  
**PomodoroBar.tsx:21–25:** Has its own interval for `tickPomodoro`. So Pomodoro can run even when FocusMode is closed. If the user is on another page, the bar still ticks. When it hits 0, `completePomodoro` is called from `tickPomodoro` in the store. OK.

---

## 8. CSS/Layout Issues

### 8.1 **SkillDetail.tsx:61 — z-index 50**
**SkillBank.tsx:214** uses `z-50`. **FocusMode.tsx:114** uses `z-[300]`. **ShortcutHelp.tsx:43** uses `z-[300]`. **LevelUpOverlay** uses `z-[200]`. **AchievementPopup** uses `z-[250]`. **FloatingReward** uses `z-[350]`. **Tutorial** uses `z-[500]`.  
**Issue:** SkillDetail and SkillBank both use `z-50`. If both are open (shouldn't happen normally), stacking could be wrong. Consider a z-index scale.

### 8.2 **EmojiPicker.tsx:50 — z-[60]**
**OverflowMenu.tsx:49** also uses `z-[60]`. If both are open in the same area, they could overlap. Context-dependent.

### 8.3 **index.css — `.collapse-section > div { overflow: hidden }`**
**Issue:** The child div has `overflow: hidden`. If content is taller than the animated height, it may be clipped during transition. Usually acceptable for collapse.

---

## 9. Accessibility

### 9.1 **Modals missing `aria-modal`, `role="dialog"`, `aria-labelledby`**
**SkillDetail, SkillBank, FocusMode, QuickCapture, ShortcutHelp, Tutorial, LevelUpOverlay, AchievementPopup, CalendarQuickAdd** — none set these attributes.  
**Fix:** Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the title.

### 9.2 **Focus trap in modals**
**Issue:** Tab can leave the modal.  
**Fix:** Implement focus trap (e.g. focus-first, trap Tab/Shift+Tab, restore focus on close).

### 9.3 **LevelUpOverlay.tsx:33–36 — Clickable overlay**
```typescript
onClick={dismissLevelUp}
role="button"
tabIndex={0}
onKeyDown={(e) => e.key === "Escape" && dismissLevelUp()}
aria-label="Dismiss"
```
**Good:** Has `role="button"`, `tabIndex={0}`, `aria-label`. But the overlay is behind the content (pointer-events). The outer div is clickable. Need to ensure the overlay div receives clicks.

### 9.4 **StatsBar, Sidebar — Icon-only buttons**
Some icon buttons lack `aria-label` (e.g. PomodoroBar has `aria-label` for Pause/Resume/Cancel). QuestBoard view toggle buttons have `title` but not `aria-label`.  
**Fix:** Add `aria-label` for icon-only buttons.

---

## 10. Performance

### 10.1 **QuestBoard.tsx — Subscribes to many store slices**
```typescript
const quests = useStore((s) => s.quests);
const skills = useStore((s) => s.skills);
// ... 30+ selectors
```
**Issue:** Each `useStore` call subscribes to the whole store. When any part of the store changes, all these selectors re-run. Zustand uses shallow compare, so if the selected value is the same reference, no re-render. But `quests`, `skills`, etc. are new references when they're updated. This can cause many re-renders.  
**Fix:** Consider splitting the store or using selectors that return stable references when the underlying data hasn't meaningfully changed.

### 10.2 **SkillTree.tsx:184–188 — `questCounts` rebuilt every render**
```typescript
const questCounts = new Map<number, number>();
for (const q of quests) {
  if (!q.completed && !q.failed) {
    questCounts.set(q.skillId, (questCounts.get(q.skillId) ?? 0) + 1);
  }
}
```
**Issue:** This runs on every render. Could be memoized with `useMemo` depending on `quests`.

### 10.3 **QuestBoard.tsx:126 — `skillMap` created every render**
```typescript
const skillMap = new Map(skills.map((s) => [s.id, s]));
```
**Issue:** New Map every render.  
**Fix:** `useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills])`.

### 10.4 **TaskCard — Subscribes to many store values**
TaskCard subscribes to ~25 store values. Each TaskCard re-renders when any of those change. With many cards, this can be expensive.  
**Fix:** Consider splitting TaskCard into a wrapper that reads minimal state and passes props to a memoized inner component.

### 10.5 **HabitTracker.tsx:44–51 — `loadEntries` runs for every habit on every `habits` change**
```typescript
const loadEntries = useCallback(async () => {
  const map: Record<number, Set<string>> = {};
  for (const h of habits) {
    const dates = await getHabitEntries(h.id, fromDate, toDate);
    map[h.id] = new Set(dates);
  }
  setEntries(map);
}, [habits, getHabitEntries, fromDate, toDate]);
```
**Issue:** When `habits` changes (e.g. adding a habit), we refetch all entries. Could be optimized to only fetch for new habits.

---

## Summary of Highest-Priority Fixes

| Priority | File | Line | Issue |
|----------|------|------|-------|
| High | store/index.ts | 302–305 | `setTimeout` in toggleQuest not cleaned up |
| High | store/index.ts | 686 | `completePomodoro` not awaited in tickPomodoro |
| High | FocusMode.tsx | 75 | Space key completes quest when typing in textarea |
| High | DailyChallenges.tsx | 23 | Division by zero when target is 0 |
| High | AchievementShowcase.tsx | 78 | Division by zero in progress |
| Medium | QuickCapture.tsx | 51–56 | Toast timeouts not cleaned up |
| Medium | SkillDetail.tsx, SkillNode.tsx | 39, 93 | `quests` in deps causes unnecessary refetches |
| Medium | AddQuestForm.tsx, CalendarQuickAdd.tsx | 27, 17 | skillId initialization when leafSkills empty |
| Medium | Modals | various | Missing focus trap and aria attributes |
| Low | Shop.tsx, Settings.tsx | 186, 145 | Unsafe theme color casts |
| Low | QuestBoard.tsx | 126 | skillMap not memoized |
| Low | SkillTree.tsx | 184 | questCounts not memoized |

---

*Report generated from line-by-line review of all React/TypeScript source files in src/.*
