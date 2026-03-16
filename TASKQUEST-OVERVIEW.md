# TaskQuest — Complete Application Overview

> A gamified desktop task manager that turns your daily goals into RPG quests.  
> Platform: Windows (Tauri v2 desktop app) | 100% offline, all data stored locally.

---

## Table of Contents

1. [Application Concept](#1-application-concept)
2. [Profile System](#2-profile-system)
3. [Quest Board — The Main Workspace](#3-quest-board--the-main-workspace)
4. [Skill System](#4-skill-system)
5. [Hero Status Page](#5-hero-status-page)
6. [Gamification Engine](#6-gamification-engine)
7. [Pomodoro Timer & Time Tracking](#7-pomodoro-timer--time-tracking)
8. [Focus Mode](#8-focus-mode)
9. [Quick Capture](#9-quick-capture)
10. [Calendar Board](#10-calendar-board)
11. [Habit Tracker](#11-habit-tracker)
12. [Journal](#12-journal)
13. [Shop](#13-shop)
14. [Equipment System](#14-equipment-system)
15. [Skill Catalog](#15-skill-catalog)
16. [Achievements & Trophies](#16-achievements--trophies)
17. [Quest Chains](#17-quest-chains)
18. [Daily Challenges & Bounties](#18-daily-challenges--bounties)
19. [Stats Dashboard](#19-stats-dashboard)
20. [Settings](#20-settings)
21. [Navigation & Keyboard Shortcuts](#21-navigation--keyboard-shortcuts)
22. [Feedback & Notification Systems](#22-feedback--notification-systems)
23. [Data Management](#23-data-management)

---

## 1. Application Concept

TaskQuest is a single-player RPG-themed productivity application. Every real-world task the user creates becomes a "quest." Completing quests earns XP, gold, and progresses the user's hero through a leveling system. Tasks are organized under a 3-level skill tree, and the user's performance is tracked through stats, streaks, achievements, and visual feedback.

The app is fully offline — no internet connection, cloud sync, or external APIs are used. All data is stored in a local SQLite database.

---

## 2. Profile System

### Overview

TaskQuest supports multiple user profiles. Each profile has its own independent set of skills, quests, stats, achievements, equipment, habits, and journal entries.

### Profile Selection (Home Screen)

When no profile is active, the app displays the Home screen:

- A grid of **profile cards**, each showing:
  - Avatar icon (emoji)
  - Profile name
  - Level number
  - Gold balance
  - HP bar (visual)
  - Total XP
- A **"Create New Profile"** form:
  - Name input field
  - Avatar picker (12 emoji options: ⚔️ 🛡️ 🧙 🏹 🗡️ 🔮 👑 🐉 🦁 🎯 💎 🔥)
- **Delete profile** button (appears on hover, requires confirmation)

### Profile Properties

Each profile tracks:

| Property | Description |
|----------|-------------|
| Name | Display name |
| Avatar icon | Emoji icon |
| Active theme | Visual color scheme |
| Sound pack | Audio feedback set |
| Default skill | Pre-selected skill for new quests |

### Switching Profiles

The sidebar contains a "Switch Profile" button that returns to the Home screen.

### First-Time Setup

When a new profile is created:
- A set of default skills is seeded from the "balanced" quick-start bundle
- A `user_stats` row is initialized (Level 1, 100 HP, 0 gold, 0 XP)
- The startup routine runs: streak check, bounty generation, challenge creation, template scheduling

---

## 3. Quest Board — The Main Workspace

The Quest Board is the default landing page after selecting a profile. It is the primary workspace for managing quests.

### Layout (Top to Bottom)

1. **Stats Bar** — Level, XP progress, HP bar, gold, streak
2. **Daily Challenges** — Today's three auto-generated challenges
3. **Smart Suggestions** — AI-generated quest ideas (expandable)
4. **Daily Quote** — Motivational text (dismissible)
5. **Tag Filters** — Filter quests by tag
6. **Pinned Quests** — Up to 3 pinned quests at the top
7. **Active Quests** — All incomplete, non-failed, non-archived quests
8. **History** — Collapsible section with completed and failed quests
9. **Archive** — Collapsible section with archived quests
10. **New Quest Form** — Bottom form for creating quests

### Stats Bar

Displays at the top of the Quest Board:

| Stat | Display |
|------|---------|
| Level | `Lv. {N}` with level-up icon |
| XP | Gradient progress bar (green) with `{progress}/{needed}` text |
| HP | Gradient progress bar (red) with `{current}/{max}` text |
| Gold | Coin icon with amount |
| Streak | Flame icon with day count (if streak > 0) |

### Quest Cards (TaskCard)

Each quest is rendered as a card with the following elements:

| Element | Description |
|---------|-------------|
| Completion checkbox | Click to mark quest complete |
| Quest name | Primary text |
| Skill tag | Shows which skill this quest belongs to |
| Tags | Colored tag badges |
| Due date | If set, displayed as a date |
| Type badge | `daily` (green), `weekly` (blue), or `monthly` (purple) |
| XP reward | `+{N}` in green |
| Gold reward | Coin icon with gold value (shown for bounties) |
| Boss icon | Skull sparkle icon if quest is a boss quest |
| Recurring icon | Repeat icon if recurring |
| Pinned icon | Pin icon if pinned |

**Hover/Interaction Actions:**

| Action | How | Effect |
|--------|-----|--------|
| Complete | Click checkbox | Quest marked complete; XP, gold, HP granted |
| Fail | Click skull icon | Quest marked failed; HP damage after 24h |
| Pin/Unpin | Click pin icon | Toggles pin status (max 3 pinned) |
| Edit description | Click file icon | Opens inline textarea |
| Start Pomodoro | Click timer icon | Starts Pomodoro for this quest |
| Start time tracking | Click clock icon | Starts manual time tracking |
| Enter Focus Mode | Click maximize icon | Opens full-screen Focus Mode |
| Archive | Click archive icon | Moves quest to archive |
| Delete | Click trash icon | Permanently deletes the quest |
| Recover (failed only) | Click rotate icon | Recovers a failed quest within 24h |
| Expand sub-tasks | Click chevron | Shows/hides sub-task list |

**Sub-tasks (expandable):**
- Each quest can have sub-tasks (checklist items)
- Check/uncheck individual sub-tasks
- Add new sub-task via inline input
- Delete sub-tasks
- Completing all sub-tasks can auto-complete the parent quest

### Select Mode

A toggle in the Quest Board enables "select mode":
- Checkboxes appear on each quest
- User can select multiple quests
- Action bar appears with batch operations:
  - **Complete All** selected
  - **Archive All** selected
  - **Delete All** selected

### Creating a New Quest

The bottom of the Quest Board has a "New Quest" form:

| Field | Options | Default |
|-------|---------|---------|
| Template | Dropdown of saved templates | — |
| Quest name | Text input | Required |
| Type | `daily`, `weekly`, `monthly` | `daily` |
| Difficulty | `normal`, `hard`, `epic` | `normal` |
| Priority | `low`, `normal`, `urgent` | `normal` |
| Skill | Dropdown of leaf skills | Profile default or first skill |
| Due date | Date picker | — |
| XP reward | Number input | 10 (daily), 25 (weekly), 50 (monthly) |
| Recurring | Toggle | Off |
| Boss quest | Toggle | Off |
| Save as template | Toggle | Off |

### Tag Filtering

- "All" button plus one button per tag
- Clicking a tag filters the quest list to only show quests with that tag
- Tags are assigned to quests via the backend (no UI to add/remove tags on a card currently)

### History Section

Collapsible `<details>` element showing:
- **Completed quests:** Green check icon, strikethrough name, `+{XP}` label
- **Failed quests:** Red X icon, strikethrough name, `-{HP} HP` label

### Archive Section

Collapsible section showing archived quests with:
- **Unarchive** button to restore a quest

---

## 4. Skill System

### Skill Tree Hierarchy

Skills are organized in a 3-level tree:

```
Level 0: Categories (e.g. "Mind & Career")
  └── Level 1: Groups (e.g. "Software Architecture")
        └── Level 2: Leaf Skills (e.g. "Backend")
```

- **Categories** have a color code: `INT` = blue, `CRAFT` = amber, `VITALITY` = emerald, `STR` = red
- **Groups** organize related skills
- **Leaf Skills** are what quests link to — XP flows into leaf skills

### Default Skill Categories

| Code | Name | Description |
|------|------|-------------|
| INT | Mind & Career | Intellectual and professional skills |
| CRAFT | Home & Hobbies | Creative and hands-on skills |
| VITALITY | Family & Life | Relationships and life management |
| STR | Strength & Fitness | Physical fitness and health |

### Skill Properties

| Property | Description |
|----------|-------------|
| Name | Display name |
| Category | Which category it belongs to (INT, CRAFT, VITALITY, STR) |
| Icon | Emoji icon |
| Level | Current level (starts at 1) |
| Current XP | Accumulated XP |
| Sort order | Display ordering |
| Prestige count | Number of times prestiged |
| Last XP date | Date of last XP gain (for skill decay) |
| Archived | Whether the skill is archived |

### Derived Levels (Groups & Categories)

Group and category levels are not stored. They are computed on the frontend as the **average of their children's levels** (rounded).

### Skill Decay

When enabled, skills that haven't received XP in 7+ days lose up to 10 XP per additional inactive day. Decay is applied on profile login via `apply_skill_decay`.

### Prestige

When a leaf skill reaches **level 20 or higher**, the user can "prestige" it:
- Skill resets to level 1 with 0 XP
- `prestige_count` increments
- User gains **+5 max HP** (capped at 250)

### Manage Skills (Skill Bank)

A modal overlay for editing the skill tree. Opened via "Manage Skills" button on Hero Status or pressing `B`.

**Capabilities:**
- **Search** skills by name
- **Add group** under a category (name + emoji icon)
- **Add leaf skill** under a group (name + emoji icon)
- **Edit skill** (double-click to rename/re-icon)
- **Delete skill** (with confirmation; cascades to all quests, sub-tasks, and tags)
- **Archive/Unarchive** skills
- **Drag-and-drop reorder** leaf skills within a group
- **Browse Catalog** button to open the Skill Catalog

**Cannot do:**
- Add new root categories
- Delete or rename categories
- Move skills between groups/categories (backend supports it but no drag-across-groups UI)

### Skill Detail Modal

Clicking a skill in the tree (via `openSkillDetail`) shows a modal with:
- Skill name, icon, category, level
- XP progress bar
- **Prestige button** (if level 20+)
- List of active quests for that skill

---

## 5. Hero Status Page

A full dashboard view of the user's hero.

### Layout Modes (toggleable)

| Mode | Content |
|------|---------|
| **Full** | Stat tiles + XP bar + monthly summary + achievements + skill tree |
| **Tree** | Full-size skill tree only |
| **Stats** | Stat tiles + XP bar + skill radar chart + achievements |

### Stat Tiles (5-column grid)

| Tile | Icon | Value |
|------|------|-------|
| Level | Award | Current level |
| Total XP | Zap | Cumulative XP |
| HP | Heart | `{current}/{max}` |
| Gold | Coins | Gold balance |
| Completed | Swords | Total quests completed |

Additional context:
- **Streak** displayed with Flame icon
- **Burnout warning** shown if HP is 0 (Snowflake icon)

### XP Progress Bar

Full-width bar showing progress within the current level:
- Label: `Level {N} Progress`
- Values: `{progress} / {needed} XP`
- Green gradient fill (`#00FF66 → #00CC52`)

### Interactive Skill Tree

Displays the full 3-level tree:

- **CategorySection** — collapsible panel with category color, icon, name, derived level, group count, quest badge
- **GroupSection** — collapsible sub-panel with group icon, name, derived level, skill count
- **SkillNodeCard** — individual leaf skill with:
  - Radial **XP Ring** (SVG circle) showing progress to next level
  - Emoji icon centered in the ring
  - Name, `Lv. {N}`, `{progress}/{needed} XP`
  - Quest count badge
  - **Hover tooltip** with progress bar and percentage
  - **Click to expand** — shows active quests for that skill inline, plus an AddQuestForm

### Skill Radar (Stats mode)

A canvas-drawn radar chart showing relative strength across all categories.

### Monthly Summary

Summary of the current month's quest completions.

### Achievement Grid

Small grid of unlocked achievements (icon + title). Locked achievements shown as dimmed tiles.

---

## 6. Gamification Engine

### XP System

**Level formula:**
```
XP needed to reach level N = 100 × N^1.5 (rounded)
```

| Level | Cumulative XP | XP for This Level |
|-------|--------------|-------------------|
| 1 | 0 | — |
| 2 | 100 | 100 |
| 3 | 283 | 183 |
| 5 | 800 | 280 |
| 10 | 3,162 | — |

### XP Multipliers (stacking)

| Source | Multiplier | Condition |
|--------|-----------|-----------|
| Difficulty: Normal | ×1.0 | Default |
| Difficulty: Hard | ×1.5 | Hard quest |
| Difficulty: Epic | ×3.0 | Epic quest |
| Streak (7+ days) | ×1.5 | 7-day streak |
| Streak (30+ days) | ×2.0 | 30-day streak |
| XP Boost (shop item) | ×2.0 | Active XP boost |
| Skill Boost | Custom | Active skill-specific boost |
| Equipment bonus | +10% | Category-matching equipment |
| First Blood | +5 XP | First quest of the day |
| Combo | +2 XP per extra | 2+ quests within 2 minutes |
| Sub-task | Fractional | Each sub-task gives `xp_reward / total_subs` |
| Pomodoro | +5 XP | Per completed Pomodoro session |
| Habit check | +3 XP (default) | Per habit check-in |
| Journal entry | +5 XP | Per journal entry |

### Gold Economy

**Earning gold:**

| Source | Base Gold | Notes |
|--------|-----------|-------|
| Quest completion | 5/10/20/40 | By difficulty: easy/normal/hard/epic |
| Quest type multiplier | ×1.0/×1.5/×2.0 | Daily/weekly/monthly |
| Streak bonus | ×1.1 to ×1.75 | 3+/7+/14+/30+ days |
| Bounty quest | ×2.0 | If quest is a daily bounty |
| Overkill bonus | ×1.5 | All sub-tasks completed |
| First Blood | +5 gold | First quest of the day |
| Combo | +1 gold per extra | Rapid completions |
| Quest chain | +50 gold (default) | Completing all quests in a chain |
| Daily challenge | +25 gold (default) | Completing a challenge |

**Spending gold:**

| Item | Cost | Effect |
|------|------|--------|
| HP Potion (Small) | 30g | +25 HP |
| HP Potion (Large) | 60g | +50 HP |
| HP Potion (Full) | 100g | Full heal to max HP |
| Streak Freeze | 50g | +1 streak freeze token |
| XP Boost (×5 uses) | 80g | Next 5 quest completions get ×2 XP |
| Max HP Upgrade | 150g | +10 max HP (cap 200) |
| Skill Focus (1h) | 25g | 1-hour XP boost on one skill |
| Skill Surge (1d) | 60g | 1-day XP boost on one skill |
| Theme unlock | 200g | Unlock a color theme |

### HP System

| Event | HP Change |
|-------|-----------|
| Quest completion | +2 HP (capped at 80% of max HP) |
| Quest failure | −10 (normal), −15 (hard), −25 (epic) after 24h |
| HP Potion (shop) | +25 / +50 / full heal |
| Prestige | +5 max HP (cap 250) |
| Healer's Charm (equipment) | +1 HP per quest |
| Phoenix Feather (equipment) | Burnout penalty reduced to 25% |

**Burnout:** When HP reaches 0, the user enters "burnout" — all XP and gold earnings are reduced by 50% (25% with Phoenix Feather equipped).

### Streak System

- **Streak increments** by 1 each day the user completes at least one quest
- **Streak resets** to 0 if a full day passes with no quest completion (unless a streak freeze is active)
- **Streak freeze:** Consumed automatically when the user would lose their streak; purchased in the shop
- **Longest streak** is tracked separately
- **Streak bonuses:** Apply to XP and gold multipliers at 7+ and 30+ day thresholds

---

## 7. Pomodoro Timer & Time Tracking

### Pomodoro Timer

A countdown timer for focused work sessions.

**Starting a Pomodoro:**
- Click the timer icon on any quest card
- Press `P` to start/pause/resume
- In Focus Mode, click the circular timer area

**During a Pomodoro:**
- A **PomodoroBar** appears at the top of the app with quest name, countdown (`MM:SS`), pause/play, and cancel buttons
- In Focus Mode, the timer is shown as a large circular display

**On completion:**
- +5 XP awarded to the quest's skill and globally
- Quest's `pomodoro_count` incremented
- Activity logged

**Duration:** Configurable in Settings (15, 20, 25, 30, 45, or 60 minutes). Default: 25 minutes.

### Manual Time Tracking

- Click the clock icon on a quest to start tracking
- Click again to stop
- Elapsed time is added to the quest's `time_spent_seconds`
- Time is displayed on the quest card

---

## 8. Focus Mode

A distraction-free, full-screen view for working on a single quest.

**Opening:** Click the maximize icon on a quest card, or press `F` (focuses the first active quest).

**Contents:**
- Quest name (large)
- Description textarea (editable)
- Sub-task list (interactive)
- Pomodoro timer (circular display)
- Complete button
- Fail button

**Closing:** Press `Escape`, or complete/fail the quest.

---

## 9. Quick Capture

A rapid quest creation overlay.

**Opening:** Press `N` or `Ctrl+Shift+Q`.

**How it works:**
- A centered text input appears
- Type a quest name and press `Enter`
- A daily quest is created with the profile's default skill and default XP
- A "Quest created!" confirmation briefly appears
- Press `Escape` to close without creating

---

## 10. Calendar Board

A monthly calendar view showing quest activity.

**Layout:**
- Month/year header with previous/next arrows
- 7-column grid (Mon–Sun) with day cells

**Day cells show:**
- Day number
- Color-coded quest indicators:
  - Green circle: completed quest
  - Red circle: failed quest
  - Neutral circle: pending quest

**Navigation:** Left/right arrows to change month.

**Note:** The calendar is read-only — it displays quest history but does not allow creating or editing quests.

---

## 11. Habit Tracker

A dedicated page for tracking daily habits separately from quests.

### Creating a Habit

Form fields:
- **Icon** — Emoji picker
- **Name** — Text input
- **Linked skill** — Optional dropdown (XP goes to this skill)
- **XP per check** — Number input (default 3)

### Habit Cards

Each habit displays:
- Icon, name, linked skill
- **30-day grid** — A calendar-like row showing which days the habit was checked
  - Filled squares: checked days
  - Empty squares: missed days
- **Check button** — Marks today as done; awards XP to linked skill and globally
- **Delete button** — Removes the habit (with confirmation)

### Habit XP

Each check-in grants:
- `xp_per_check` XP to the linked skill (if set)
- Same amount to global total XP
- Activity logged

---

## 12. Journal

A personal reflection space that grants XP for writing.

### Writing an Entry

- **Content** — Textarea for the entry body
- **Mood** — Optional mood selector (emoji buttons)
- **Save Entry** — Creates the entry

### Entry List

- Entries displayed in reverse chronological order
- Each entry shows: date, mood (if set), content preview
- **Delete button** — Removes an entry (with confirmation)

### Journal XP

Each journal entry grants **+5 XP** globally. Activity is logged.

---

## 13. Shop

A gold-spending store with three tab categories.

### Potions Tab

| Item | Cost | Effect |
|------|------|--------|
| HP Potion (Small) | 30g | Restores 25 HP |
| HP Potion (Large) | 60g | Restores 50 HP |
| HP Potion (Full) | 100g | Restores HP to maximum |

### Boosts Tab

| Item | Cost | Effect |
|------|------|--------|
| Streak Freeze | 50g | +1 streak freeze token (protects streak for 1 missed day) |
| XP Boost (×5) | 80g | Next 5 quest completions earn double XP |
| Max HP Upgrade | 150g | Permanently increases max HP by 10 (cap: 200) |
| Skill Focus (1h) | 25g | 1-hour XP multiplier on a chosen skill |
| Skill Surge (1d) | 60g | 1-day XP multiplier on a chosen skill |

**Skill Focus/Surge flow:** After purchase, a modal asks the user to select which skill to boost.

### Themes Tab

| Theme | Cost | Description |
|-------|------|-------------|
| Default | Free | Standard dark blue theme |
| Forest | 200g | Green nature theme |
| Ocean | 200g | Deep blue aquatic theme |
| Inferno | 200g | Red fire theme |
| Royal | 200g | Purple regal theme |

Purchasing a theme unlocks it permanently. The user can switch between owned themes.

### Sound Packs

Four sound pack options are displayed (selectable, no purchase required):
- Silent, Fantasy, Sci-Fi, Minimal

---

## 14. Equipment System

An RPG-style equipment layer unlocked through achievements.

### How It Works

- Equipment items are unlocked by earning specific achievements
- Once unlocked, items appear in the **Armory** section of the Equipment page
- The user can equip up to **3 items** simultaneously
- Each item provides a passive gameplay bonus

### Equipment Items

| Item | Icon | Rarity | Unlock Achievement | Effect |
|------|------|--------|-------------------|--------|
| Scholar's Ring | 💍 | Rare | Earn 1,000 XP | +10% XP on INT skills |
| Warrior's Gauntlet | 🧤 | Rare | Complete 100 quests | +10% XP on STR skills |
| Artisan's Hammer | 🔨 | Rare | 7-day streak | +10% XP on CRAFT skills |
| Healer's Charm | 💚 | Epic | Complete 500 quests | +1 HP per quest completion |
| Merchant's Pouch | 💰 | Epic | Earn 1,000 gold | +2 gold per quest completion |
| Phoenix Feather | 🔥 | Legendary | 30-day streak | Burnout penalty reduced to 25% |
| Speedrunner's Boots | 👟 | Common | Complete 10 quests | +5% XP on all skills |

### Equipment Page Layout

- **Equipped** section (top) — Shows currently equipped items (up to 3 slots)
- **Armory** section (bottom) — Shows all unlocked but unequipped items
- Locked items are shown dimmed with a lock icon and their unlock condition

---

## 15. Skill Catalog

A browsable library of pre-built skills that can be added to the user's skill tree.

### Layout

- **Search bar** — Filter skills by name (highlights matching text)
- **Category filter** — Sidebar buttons: All, INT, CRAFT, VITALITY, STR
- **Quick Start Bundles** — Pre-packaged skill sets for common user types
- **Skill groups** — Expandable sections showing individual skills

### Quick Start Bundles

| Bundle | Target User | Skills Included |
|--------|-------------|-----------------|
| Student | Students | Academic, languages, meal prep, friendships, stress, finances, running, sleep, nutrition |
| Parent | Parents | Toddler, morning routines, activities, partner, meal prep, home repair, organization, sleep, running, communication, stress |
| Fitness | Athletes | Resistance, cardio, flexibility, yoga, recovery, meditation, meal prep |
| Career | Professionals | Backend, frontend, system design, leadership, finance, networking, stress, sleep, running |
| Balanced | General | Communication, budgeting, meal prep, home repair, indoor plants, partner, friendships, journaling, organization, core, running, sleep |

Adding a bundle requires confirmation and adds all its skills to the user's tree.

### Browsing Skills

Each catalog category contains groups, and each group contains individual skills with:
- Name, icon, description
- **"Add" button** — Adds the skill to the user's tree under the matching category/group
- **"Add All"** — Adds all skills in a group at once

### Catalog Suggestions

When a skill is added from the catalog, the system can suggest quest names for it (shown as "Smart Suggestions" on the Quest Board).

---

## 16. Achievements & Trophies

### Achievement List

| Achievement | Key | Condition | Rarity |
|-------------|-----|-----------|--------|
| First Quest | `first_quest` | Complete 1 quest | Common |
| Decaquest | `quest_10` | Complete 10 quests | Common |
| Centurion | `quest_100` | Complete 100 quests | Rare |
| Legend | `quest_500` | Complete 500 quests | Legendary |
| Knowledge Seeker | `xp_1000` | Earn 1,000 total XP | Common |
| Grandmaster | `xp_10000` | Earn 10,000 total XP | Epic |
| Consistent | `streak_7` | Maintain a 7-day streak | Rare |
| Unstoppable | `streak_30` | Maintain a 30-day streak | Legendary |
| Gold Hoarder | `gold_hoarder` | Accumulate 500 gold | Rare |
| Treasure Lord | `gold_1000` | Accumulate 1,000 gold | Epic |
| Specialist | `first_level10_skill` | Any skill reaches level 10 | Rare |
| Boss Slayer | `first_boss` | Complete a boss quest | Rare |
| Bounty Hunter | `bounty_hunter` | Complete 10 bounty quests | Rare |
| Survivor | `survivor` | Recover from 0 HP | Epic |
| Prestige Master | `first_prestige` | Prestige a skill | Epic |
| Chain Master | `chain_master` | Complete a quest chain | Rare |
| Habitual | `habitual` | Check a habit 30 days | Rare |

### Achievement Popup

When an achievement is unlocked:
- A toast notification slides in with the achievement icon, title, and description
- Confetti animation plays
- Auto-dismisses after 4 seconds (or click to dismiss)

### Trophy Room (Achievement Showcase)

A dedicated page showing:
- **Unlocked achievements** — Full icon, title, description, rarity badge, unlock date
- **Locked achievements** — Dimmed with lock icon, title, description, and unlock condition

---

## 17. Quest Chains

Ordered sequences of quests with a bonus reward for completing the entire chain.

### Creating a Chain

- Name, description, bonus gold, bonus XP
- Assign existing quests to the chain with a specific order

### Chain Completion

When all quests in a chain are marked complete:
- Bonus gold and XP are awarded
- Chain marked as completed
- "Chain Master" achievement progress tracked

### Chain Management

- View all chains
- Assign/remove quests to chains
- Delete chains

---

## 18. Daily Challenges & Bounties

### Daily Challenges

Three auto-generated challenges appear each day:

| Challenge | Target | Reward |
|-----------|--------|--------|
| Complete N quests | 3 | 15g + 15 XP |
| Earn N XP | 50 | 20g + 20 XP |
| Complete a Hard/Epic quest | 1 | 25g + 25 XP |

Displayed at the top of the Quest Board with progress bars.

### Daily Bounties

- 3 random active quests are marked as "bounties" each day
- Bounty quests earn **double gold** when completed
- Identified by a special indicator on the quest card

### Weekly Boss

- Auto-generated epic-difficulty quest targeting the user's **weakest skill** (lowest level)
- Appears once per week
- Rewards are **tripled** (3× XP, 3× gold)
- Completing it triggers a special "Boss Defeated" level-up overlay

---

## 19. Stats Dashboard

An analytics page with visual charts and data.

### Charts

| Chart | Type | Data |
|-------|------|------|
| XP Over Time | Line chart | 30 days of daily XP earned |
| Quest Completion | Donut chart | Breakdown by type (daily/weekly/monthly) |
| Skill Radar | Radar chart | Relative strength across all categories |
| Activity Heatmap | Calendar heatmap | 365 days of daily activity (quest count) |

### Summary Cards

- **Best Day** — Date with highest XP earned
- **Worst Day** — Date with lowest activity

### Weekly Report

| Metric | This Week | Last Week |
|--------|-----------|-----------|
| Quests completed | N | N |
| XP earned | N | N |
| Current streak | N days | — |

---

## 20. Settings

### Theme Selection

Grid of 5 color themes:
- **Default** — Standard dark blue (free)
- **Forest** — Green nature tones (200g)
- **Ocean** — Deep blue aquatic (200g)
- **Inferno** — Red fire tones (200g)
- **Royal** — Purple regal tones (200g)

Purchased themes can be freely switched.

### Sound Pack

4 options:
- Silent (default), Fantasy, Sci-Fi, Minimal

### Default Skill

Dropdown to set the default skill for new quests and Quick Capture.

### Pomodoro Duration

6 presets: 15, 20, 25, 30, 45, 60 minutes.

### Data Export

- **Copy to Clipboard** — JSON export of all profile data
- **Download as File** — Saves a `.json` file

Export includes: profile info, all skills, all quests, stats, achievements, owned items.

---

## 21. Navigation & Keyboard Shortcuts

### Sidebar Navigation

The sidebar provides access to all pages:

| Section | Items |
|---------|-------|
| Core | Quest Board, Hero Status, Skill Catalog |
| Planning | Calendar, Habits, Journal |
| *divider* | |
| Rewards | Shop, Equipment, Trophies |
| *divider* | |
| Meta | Stats, Settings |
| Actions | Manage Skills (opens Skill Bank modal) |
| Profile | Switch Profile |

The sidebar collapses to icon-only at narrow widths (`w-16`) and expands with labels at wider widths (`lg:w-52`).

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1` | Quest Board |
| `2` | Hero Status |
| `3` | Skill Catalog |
| `4` | Shop |
| `5` | Stats |
| `6` | Settings |
| `7` | Calendar |
| `8` | Habits |
| `9` | Journal |
| `0` | Equipment |
| `N` | Quick Capture |
| `Ctrl+Shift+Q` | Quick Capture |
| `B` | Open Skill Bank |
| `F` | Focus Mode (first active quest) |
| `P` | Start / Pause / Resume Pomodoro |
| `?` | Shortcut Help |
| `Escape` | Close active modal/overlay (in priority order) |

All shortcuts are disabled when focus is in a text input or textarea (except `Escape`).

### Shortcut Help Modal

Press `?` to open a reference overlay listing all keyboard shortcuts. Close with `Escape` or clicking outside.

---

## 22. Feedback & Notification Systems

### Level-Up Overlay

Full-screen celebration when the user levels up:
- Large "LEVEL UP!" or "BOSS DEFEATED!" text
- New level number prominently displayed
- Particle animation
- Auto-dismisses after 3 seconds, or click/Escape to dismiss

### Achievement Popup

Toast notification when a new achievement is unlocked:
- Achievement icon, title, description
- Confetti animation
- Auto-dismisses after 4 seconds, or click to dismiss

### XP Flyup

Floating "+N XP" text that animates upward from the quest card on completion. Fades out after ~1 second.

### Floating Reward

Context-based floating rewards showing XP and gold earned, animated near the completed quest.

### Error Toast

Red-themed toast in the bottom-right corner:
- Error icon, message text, close button
- Auto-dismisses after 5 seconds

### Combo Banner

When 2+ quests are completed within 2 minutes:
- A "Combo ×N!" banner appears on the Quest Board
- Extra gold and XP are awarded

---

## 23. Data Management

### Local Storage

All data is stored in a local SQLite database at:
```
{AppDataDir}/taskquest.db
```

No cloud sync, no external API calls. The app works fully offline.

### Profile Export

From Settings, the user can export their entire profile as JSON:
- Copy to clipboard
- Download as `.json` file

Includes: profile, skills, quests, stats, achievements, owned items.

### Startup Routine (`init_profile`)

Each time a profile is loaded, these checks run automatically:

1. **Streak check** — Update streak based on last activity date; apply freeze if needed
2. **Fail damage** — Apply HP damage for quests failed more than 24 hours ago
3. **Recurring quests** — Spawn new instances of recurring quests (daily/weekly/monthly)
4. **Daily bounties** — Select 3 random active quests as today's bounties
5. **Weekly boss** — Create a boss quest for the weakest skill (weekly)
6. **Daily challenges** — Generate 3 challenges for today
7. **Template scheduling** — Create quests from any active template schedules

### Quest Templates & Scheduling

Users can save frequently-created quests as templates. Templates support scheduling:

| Schedule | Behavior |
|----------|----------|
| Daily | Auto-creates quest every day |
| Weekly | Auto-creates quest every Monday |
| Monthly | Auto-creates quest on the 1st of each month |
| On specific days | Auto-creates quest only on listed weekdays |

### Quest Recovery

Failed quests can be recovered within **24 hours** of failure:
- Clears the failed status
- Prevents HP damage from being applied
- Quest returns to active status

---

*End of documentation.*
