# TaskQuest

A gamified desktop task manager that turns your daily goals into RPG quests. Built with Tauri v2, React, and SQLite — 100% offline, all data stored locally.

## Features

- **Quest Board** — Create, track, and complete tasks as RPG quests with XP, gold, and HP rewards
- **3-Level Skill Tree** — Organize skills into categories (Mind, Craft, Vitality, Strength) with groups and leaf skills
- **Hero Status** — Dashboard with level, XP progress, HP bar, streak counter, and skill radar chart
- **Gamification Engine** — XP multipliers, gold economy, HP system, streaks, combo bonuses, and difficulty scaling
- **Pomodoro Timer** — Built-in focus timer with configurable duration (15–60 min)
- **Focus Mode** — Distraction-free full-screen view for working on a single quest
- **Calendar Board** — Monthly overview of quest completion history
- **Habit Tracker** — Daily habits with 30-day grids and XP rewards
- **Journal** — Personal reflection entries that grant XP
- **Shop** — Spend gold on HP potions, XP boosts, streak freezes, themes, and more
- **Equipment System** — Unlock gear through achievements for passive bonuses
- **Achievements & Trophies** — 17 achievements with rarity tiers and a trophy room
- **Quest Chains** — Ordered quest sequences with bonus rewards
- **Daily Challenges & Bounties** — Auto-generated daily goals and bounty quests for extra gold
- **Stats Dashboard** — XP charts, activity heatmap, weekly reports
- **Multiple Profiles** — Each profile has independent data, skills, and progression
- **Keyboard Shortcuts** — Quick navigation and actions (`N` for quick capture, `F` for focus, `P` for Pomodoro, etc.)
- **Themes** — 5 unlockable color themes (Default, Forest, Ocean, Inferno, Royal)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop runtime | [Tauri v2](https://v2.tauri.app/) (Rust) |
| Frontend | React 19 + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Database | SQLite (via rusqlite) |
| Icons | lucide-react |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/) (stable toolchain)
- [Git](https://git-scm.com/)

On Windows you also need the [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (installed with the Rust toolchain or separately).

## Getting Started

```bash
# Clone the repository
git clone https://github.com/EyalHad/TaskQuest.git
cd TaskQuest

# Install frontend dependencies
npm install

# Run in development mode (opens the desktop window with hot-reload)
npm run tauri dev
```

## Building an Installer

To create a standalone Windows installer that runs without any terminal or dev tools:

```bash
npm run tauri build
```

The installer is output to:

```
src-tauri/target/release/bundle/nsis/TaskQuest_0.1.0_x64-setup.exe
```

Double-click the `.exe` to install TaskQuest as a regular desktop app (Start Menu shortcut, no terminal needed).

## Project Structure

```
src/                    # React frontend
  components/           # UI components (QuestBoard, SkillTree, HeroStatus, Shop, etc.)
  store/                # Zustand store (all app state + Tauri invoke wrappers)
  types/                # TypeScript interfaces mirroring Rust models
  lib/                  # Utilities (skill-tree builder, sounds, themes, quotes)
  App.tsx               # Root component with routing and feedback overlays
  index.css             # Tailwind + custom theme variables

src-tauri/              # Tauri / Rust backend
  src/
    lib.rs              # Tauri setup, state, command registration
    db.rs               # SQLite initialization and migrations
    models.rs           # Data structs (Skill, Quest, GameStats, etc.)
    errors.rs           # AppError enum
    catalog.rs          # Pre-built skill catalog data
  Cargo.toml
  tauri.conf.json
```

## Data Storage

All data lives in a local SQLite database at:

```
%APPDATA%/com.taskquest.app/taskquest.db
```

No internet connection, cloud sync, or external APIs are used. The app works fully offline.

## License

This project is private and not licensed for public use.
