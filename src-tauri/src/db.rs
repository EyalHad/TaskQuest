use rusqlite::{Connection, Result, params};
use std::sync::Mutex;

pub struct AppDatabase {
    pub conn: Mutex<Connection>,
}

impl AppDatabase {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
        Ok(Self { conn: Mutex::new(conn) })
    }

    pub fn run_migrations(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let version: i64 = conn.pragma_query_value(None, "user_version", |r| r.get(0))?;

        if version < 5 {
            for t in &["template_sub_tasks","quest_templates","quest_tags","tags","sub_tasks",
                       "achievements","activity_log","purchases","quests","skills","user_stats","profiles"] {
                let _ = conn.execute_batch(&format!("DROP TABLE IF EXISTS {};", t));
            }

            conn.execute_batch(r#"
                CREATE TABLE profiles (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    name        TEXT NOT NULL,
                    avatar_icon TEXT NOT NULL DEFAULT '⚔️',
                    active_theme TEXT NOT NULL DEFAULT 'default',
                    sound_pack  TEXT NOT NULL DEFAULT 'silent',
                    default_skill_id INTEGER,
                    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE skills (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id      INTEGER NOT NULL REFERENCES profiles(id),
                    name            TEXT NOT NULL,
                    category        TEXT NOT NULL,
                    parent_skill_id INTEGER,
                    current_xp      INTEGER NOT NULL DEFAULT 0,
                    level           INTEGER NOT NULL DEFAULT 1,
                    icon            TEXT NOT NULL DEFAULT '',
                    sort_order      INTEGER NOT NULL DEFAULT 0,
                    prestige_count  INTEGER NOT NULL DEFAULT 0,
                    last_xp_date    TEXT,
                    target_level    INTEGER,
                    is_archived     INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (parent_skill_id) REFERENCES skills(id)
                );

                CREATE TABLE user_stats (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id       INTEGER NOT NULL UNIQUE REFERENCES profiles(id),
                    total_xp         INTEGER NOT NULL DEFAULT 0,
                    current_level    INTEGER NOT NULL DEFAULT 1,
                    quests_completed INTEGER NOT NULL DEFAULT 0,
                    hp               INTEGER NOT NULL DEFAULT 100,
                    max_hp           INTEGER NOT NULL DEFAULT 100,
                    gold             INTEGER NOT NULL DEFAULT 0,
                    current_streak       INTEGER NOT NULL DEFAULT 0,
                    longest_streak       INTEGER NOT NULL DEFAULT 0,
                    last_activity_date   TEXT,
                    streak_freeze_count  INTEGER NOT NULL DEFAULT 0,
                    xp_boost_remaining   INTEGER NOT NULL DEFAULT 0,
                    daily_bounties       TEXT NOT NULL DEFAULT '[]',
                    last_bounty_date     TEXT,
                    last_first_blood_date TEXT,
                    skill_boost_id       INTEGER,
                    skill_boost_mult     REAL NOT NULL DEFAULT 1.0,
                    skill_boost_expires  TEXT,
                    weekly_boss_quest_id INTEGER,
                    weekly_boss_date     TEXT
                );

                CREATE TABLE IF NOT EXISTS quest_chains (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    bonus_gold INTEGER NOT NULL DEFAULT 50,
                    bonus_xp INTEGER NOT NULL DEFAULT 50,
                    completed INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
                CREATE TABLE IF NOT EXISTS daily_challenges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    challenge_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    target INTEGER NOT NULL,
                    progress INTEGER NOT NULL DEFAULT 0,
                    reward_gold INTEGER NOT NULL DEFAULT 25,
                    reward_xp INTEGER NOT NULL DEFAULT 25,
                    date TEXT NOT NULL,
                    completed INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS habits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    name TEXT NOT NULL,
                    icon TEXT NOT NULL DEFAULT '✅',
                    skill_id INTEGER REFERENCES skills(id),
                    xp_per_check INTEGER NOT NULL DEFAULT 3,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
                CREATE TABLE IF NOT EXISTS habit_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
                    date TEXT NOT NULL,
                    UNIQUE(habit_id, date)
                );
                CREATE TABLE IF NOT EXISTS equipped_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    item_key TEXT NOT NULL,
                    equipped_at TEXT NOT NULL DEFAULT (datetime('now')),
                    UNIQUE(profile_id, item_key)
                );
                CREATE TABLE IF NOT EXISTS journal_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    content TEXT NOT NULL,
                    mood TEXT,
                    xp_granted INTEGER NOT NULL DEFAULT 5,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE quests (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id      INTEGER NOT NULL REFERENCES profiles(id),
                    quest_name      TEXT NOT NULL,
                    description     TEXT NOT NULL DEFAULT '',
                    quest_type      TEXT NOT NULL CHECK(quest_type IN ('daily','weekly','monthly')),
                    skill_id        INTEGER NOT NULL REFERENCES skills(id),
                    xp_reward       INTEGER NOT NULL DEFAULT 10,
                    completed       INTEGER NOT NULL DEFAULT 0,
                    failed          INTEGER NOT NULL DEFAULT 0,
                    completed_at    TEXT,
                    due_date        TEXT,
                    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
                    is_recurring    INTEGER NOT NULL DEFAULT 0,
                    recurrence_pattern TEXT,
                    parent_quest_id INTEGER REFERENCES quests(id),
                    difficulty      TEXT NOT NULL DEFAULT 'normal',
                    priority        TEXT NOT NULL DEFAULT 'normal',
                    is_boss         INTEGER NOT NULL DEFAULT 0,
                    is_pinned       INTEGER NOT NULL DEFAULT 0,
                    is_archived     INTEGER NOT NULL DEFAULT 0,
                    sort_order      INTEGER NOT NULL DEFAULT 0,
                    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
                    pomodoro_count  INTEGER NOT NULL DEFAULT 0,
                    failed_at       TEXT,
                    chain_id        INTEGER REFERENCES quest_chains(id),
                    chain_order     INTEGER NOT NULL DEFAULT 0,
                    estimated_minutes INTEGER,
                    blocked_by_quest_id INTEGER REFERENCES quests(id)
                );

                CREATE TABLE sub_tasks (
                    id        INTEGER PRIMARY KEY AUTOINCREMENT,
                    quest_id  INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
                    title     TEXT NOT NULL,
                    completed INTEGER NOT NULL DEFAULT 0,
                    sort_order INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE tags (
                    id   INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                );

                CREATE TABLE quest_tags (
                    quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
                    tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                    PRIMARY KEY (quest_id, tag_id)
                );

                CREATE TABLE quest_templates (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id    INTEGER NOT NULL REFERENCES profiles(id),
                    template_name TEXT NOT NULL,
                    quest_name    TEXT NOT NULL,
                    description   TEXT NOT NULL DEFAULT '',
                    quest_type    TEXT NOT NULL DEFAULT 'daily',
                    skill_id      INTEGER REFERENCES skills(id),
                    xp_reward     INTEGER NOT NULL DEFAULT 10,
                    difficulty    TEXT NOT NULL DEFAULT 'normal',
                    priority      TEXT NOT NULL DEFAULT 'normal',
                    is_boss       INTEGER NOT NULL DEFAULT 0,
                    schedule_pattern TEXT,
                    schedule_active INTEGER NOT NULL DEFAULT 0,
                    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE template_sub_tasks (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    template_id INTEGER NOT NULL REFERENCES quest_templates(id) ON DELETE CASCADE,
                    title       TEXT NOT NULL,
                    sort_order  INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE purchases (
                    id           INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id   INTEGER NOT NULL REFERENCES profiles(id),
                    item_key     TEXT NOT NULL,
                    purchased_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE achievements (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id  INTEGER NOT NULL REFERENCES profiles(id),
                    key         TEXT NOT NULL,
                    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
                    UNIQUE(profile_id, key)
                );

                CREATE TABLE activity_log (
                    id         INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    skill_id   INTEGER REFERENCES skills(id),
                    event_type TEXT NOT NULL,
                    detail     TEXT,
                    xp_delta   INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                INSERT INTO profiles (name, avatar_icon) VALUES ('Hero', '⚔️');
                INSERT INTO user_stats (profile_id) VALUES (1);

                PRAGMA user_version = 5;
            "#)?;

            self.seed_balanced_bundle(&conn, 1)?;
        }
        if version < 6 {
            let has_col: i64 = conn.query_row(
                "SELECT COUNT(*) FROM pragma_table_info('skills') WHERE name='is_archived'",
                [],
                |r| r.get(0),
            )?;
            if has_col == 0 {
                conn.execute("ALTER TABLE skills ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0", [])?;
            }
            conn.pragma_update(None, "user_version", 6i32)?;
        }
        if version < 7 {
            let add_if_missing = |conn: &Connection, table: &str, col: &str, def: &str| -> Result<()> {
                let has: i64 = conn.query_row(
                    &format!("SELECT COUNT(*) FROM pragma_table_info('{}') WHERE name='{}'", table, col),
                    [], |r| r.get(0))?;
                if has == 0 {
                    conn.execute(&format!("ALTER TABLE {} ADD COLUMN {} {}", table, col, def), [])?;
                }
                Ok(())
            };
            add_if_missing(&conn, "user_stats", "daily_bounties", "TEXT NOT NULL DEFAULT '[]'")?;
            add_if_missing(&conn, "user_stats", "last_bounty_date", "TEXT")?;
            add_if_missing(&conn, "user_stats", "last_first_blood_date", "TEXT")?;
            add_if_missing(&conn, "user_stats", "skill_boost_id", "INTEGER")?;
            add_if_missing(&conn, "user_stats", "skill_boost_mult", "REAL NOT NULL DEFAULT 1.0")?;
            add_if_missing(&conn, "user_stats", "skill_boost_expires", "TEXT")?;
            add_if_missing(&conn, "quests", "failed_at", "TEXT")?;
            conn.pragma_update(None, "user_version", 7i32)?;
        }
        if version < 8 {
            conn.execute_batch("
                CREATE TABLE IF NOT EXISTS quest_chains (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    bonus_gold INTEGER NOT NULL DEFAULT 50,
                    bonus_xp INTEGER NOT NULL DEFAULT 50,
                    completed INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
                CREATE TABLE IF NOT EXISTS daily_challenges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    challenge_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    target INTEGER NOT NULL,
                    progress INTEGER NOT NULL DEFAULT 0,
                    reward_gold INTEGER NOT NULL DEFAULT 25,
                    reward_xp INTEGER NOT NULL DEFAULT 25,
                    date TEXT NOT NULL,
                    completed INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS habits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    name TEXT NOT NULL,
                    icon TEXT NOT NULL DEFAULT '✅',
                    skill_id INTEGER REFERENCES skills(id),
                    xp_per_check INTEGER NOT NULL DEFAULT 3,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
                CREATE TABLE IF NOT EXISTS habit_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
                    date TEXT NOT NULL,
                    UNIQUE(habit_id, date)
                );
                CREATE TABLE IF NOT EXISTS equipped_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    item_key TEXT NOT NULL,
                    equipped_at TEXT NOT NULL DEFAULT (datetime('now')),
                    UNIQUE(profile_id, item_key)
                );
                CREATE TABLE IF NOT EXISTS journal_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    content TEXT NOT NULL,
                    mood TEXT,
                    xp_granted INTEGER NOT NULL DEFAULT 5,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            ")?;
            let add_if_missing = |conn: &Connection, table: &str, col: &str, def: &str| -> Result<()> {
                let has: i64 = conn.query_row(
                    &format!("SELECT COUNT(*) FROM pragma_table_info('{}') WHERE name='{}'", table, col),
                    [], |r| r.get(0))?;
                if has == 0 { conn.execute(&format!("ALTER TABLE {} ADD COLUMN {} {}", table, col, def), [])?; }
                Ok(())
            };
            add_if_missing(&conn, "quests", "chain_id", "INTEGER REFERENCES quest_chains(id)")?;
            add_if_missing(&conn, "quests", "chain_order", "INTEGER NOT NULL DEFAULT 0")?;
            add_if_missing(&conn, "skills", "prestige_count", "INTEGER NOT NULL DEFAULT 0")?;
            add_if_missing(&conn, "skills", "last_xp_date", "TEXT")?;
            add_if_missing(&conn, "user_stats", "weekly_boss_quest_id", "INTEGER")?;
            add_if_missing(&conn, "user_stats", "weekly_boss_date", "TEXT")?;
            add_if_missing(&conn, "quest_templates", "schedule_pattern", "TEXT")?;
            add_if_missing(&conn, "quest_templates", "schedule_active", "INTEGER NOT NULL DEFAULT 0")?;
            conn.pragma_update(None, "user_version", 8i32)?;
        }
        if version < 9 {
            let add_if_missing = |conn: &Connection, table: &str, col: &str, def: &str| -> Result<()> {
                let has: i64 = conn.query_row(&format!("SELECT COUNT(*) FROM pragma_table_info('{}') WHERE name='{}'", table, col), [], |r| r.get(0))?;
                if has == 0 { conn.execute(&format!("ALTER TABLE {} ADD COLUMN {} {}", table, col, def), [])?; }
                Ok(())
            };
            add_if_missing(&conn, "quests", "estimated_minutes", "INTEGER")?;
            add_if_missing(&conn, "quests", "blocked_by_quest_id", "INTEGER REFERENCES quests(id)")?;
            add_if_missing(&conn, "skills", "target_level", "INTEGER")?;
            conn.pragma_update(None, "user_version", 9i32)?;
        }
        if version < 10 {
            conn.execute("PRAGMA foreign_keys=OFF", [])?;
            conn.execute_batch(r#"
                CREATE TABLE quests_new (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id      INTEGER NOT NULL REFERENCES profiles(id),
                    quest_name      TEXT NOT NULL,
                    description     TEXT NOT NULL DEFAULT '',
                    quest_type      TEXT NOT NULL CHECK(quest_type IN ('daily','weekly','monthly')),
                    skill_id        INTEGER REFERENCES skills(id),
                    xp_reward       INTEGER NOT NULL DEFAULT 10,
                    completed       INTEGER NOT NULL DEFAULT 0,
                    failed          INTEGER NOT NULL DEFAULT 0,
                    completed_at    TEXT,
                    due_date        TEXT,
                    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
                    is_recurring    INTEGER NOT NULL DEFAULT 0,
                    recurrence_pattern TEXT,
                    parent_quest_id INTEGER REFERENCES quests_new(id),
                    difficulty      TEXT NOT NULL DEFAULT 'normal',
                    priority        TEXT NOT NULL DEFAULT 'normal',
                    is_boss         INTEGER NOT NULL DEFAULT 0,
                    is_pinned       INTEGER NOT NULL DEFAULT 0,
                    is_archived     INTEGER NOT NULL DEFAULT 0,
                    sort_order      INTEGER NOT NULL DEFAULT 0,
                    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
                    pomodoro_count  INTEGER NOT NULL DEFAULT 0,
                    failed_at       TEXT,
                    chain_id        INTEGER REFERENCES quest_chains(id),
                    chain_order     INTEGER NOT NULL DEFAULT 0,
                    estimated_minutes INTEGER,
                    blocked_by_quest_id INTEGER REFERENCES quests_new(id)
                );
                INSERT INTO quests_new SELECT * FROM quests;
                DROP TABLE quests;
                ALTER TABLE quests_new RENAME TO quests;
            "#)?;
            conn.execute("PRAGMA foreign_keys=ON", [])?;
            conn.pragma_update(None, "user_version", 10i32)?;
        }
        Ok(())
    }

    #[allow(dead_code)]
    fn seed_default_skills(&self, conn: &Connection, profile_id: i64) -> Result<()> {
        let cats: &[(&str, &str, &str, &[(&str, &str, &[(&str, &str)])])] = &[
            ("INT", "Mind & Career", "🧠", &[
                ("Software Architecture", "💻", &[("Backend", "⚙️"), ("System Design", "🏗️")]),
                ("Academic Studies", "📚", &[("Mathematics", "🔢"), ("Research", "🔬"), ("Master's Prep", "🎓")]),
            ]),
            ("CRAFT", "Home & Hobbies", "🔨", &[
                ("DIY & Building", "🪚", &[("Woodworking", "🪵"), ("Utility Cabinets", "🗄️"), ("Home Improvement", "🏠")]),
                ("Culinary Arts", "🍳", &[("Grilling", "🔥"), ("Sous-vide", "🥩"), ("Kitchen Prep", "🔪")]),
                ("Botany", "🌱", &[("Balcony Planting", "🌿"), ("Gardening", "🌻")]),
            ]),
            ("VITALITY", "Family & Life", "💚", &[
                ("Partnership", "💑", &[("Quality Time", "🕐"), ("Date Nights", "🍷"), ("Gifts for Wife", "🎁")]),
                ("Fatherhood", "👶", &[("Morning Routines", "🌅"), ("Toddler Care", "🧸"), ("Kids' Activities", "🎨")]),
            ]),
            ("STR", "Strength & Fitness", "💪", &[
                ("Resistance Training", "🏋️", &[("Weightlifting", "🏋️‍♂️"), ("Calisthenics", "💪"), ("Core Work", "🎯")]),
                ("Cardio & Endurance", "🏃", &[("Running", "🏃"), ("HIIT", "🔥"), ("Swimming", "🏊")]),
                ("Recovery & Mobility", "🧘", &[("Stretching", "🧘"), ("Sleep", "😴"), ("Nutrition", "🥗")]),
            ]),
        ];
        let mut sort = 0;
        for (cat_code, cat_name, cat_icon, groups) in cats {
            conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,NULL,?4,?5)", params![profile_id,cat_name,cat_code,cat_icon,sort])?;
            let cat_id = conn.last_insert_rowid(); sort += 1;
            for (gn, gi, skills) in *groups {
                conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,?4,?5,?6)", params![profile_id,gn,cat_code,cat_id,gi,sort])?;
                let gid = conn.last_insert_rowid(); sort += 1;
                for (sn, si) in *skills {
                    conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,?4,?5,?6)", params![profile_id,sn,cat_code,gid,si,sort])?;
                    sort += 1;
                }
            }
        }
        Ok(())
    }

    fn seed_balanced_bundle(&self, conn: &Connection, profile_id: i64) -> Result<()> {
        let skill_ids = crate::catalog::get_bundle_skill_ids("balanced");
        let mut sort = 0i64;
        for sid in skill_ids {
            if let Some((cat, grp, sk)) = crate::catalog::find_catalog_context(sid) {
                // Find or create category
                let cat_id: i64 = match conn.query_row(
                    "SELECT id FROM skills WHERE profile_id=?1 AND category=?2 AND parent_skill_id IS NULL",
                    params![profile_id, cat.code], |r| r.get(0)
                ) {
                    Ok(id) => id,
                    Err(_) => {
                        conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,NULL,?4,?5)",
                            params![profile_id, cat.name, cat.code, cat.icon, sort])?;
                        sort += 1;
                        conn.last_insert_rowid()
                    }
                };
                // Find or create group
                let group_id: i64 = match conn.query_row(
                    "SELECT id FROM skills WHERE profile_id=?1 AND name=?2 AND parent_skill_id=?3",
                    params![profile_id, grp.name, cat_id], |r| r.get(0)
                ) {
                    Ok(id) => id,
                    Err(_) => {
                        conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,?4,?5,?6)",
                            params![profile_id, grp.name, cat.code, cat_id, grp.icon, sort])?;
                        sort += 1;
                        conn.last_insert_rowid()
                    }
                };
                // Create leaf if not exists
                let existing: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM skills WHERE profile_id=?1 AND name=?2 AND parent_skill_id=?3",
                    params![profile_id, sk.name, group_id], |r| r.get(0))?;
                if existing == 0 {
                    conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,?4,?5,?6)",
                        params![profile_id, sk.name, cat.code, group_id, sk.icon, sort])?;
                    sort += 1;
                }
            }
        }
        Ok(())
    }

    // ═══════════════════════════════════════════════════
    //  DATA MANAGEMENT
    // ═══════════════════════════════════════════════════

    pub fn has_existing_data(&self) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        let total_xp: i64 = conn.query_row(
            "SELECT COALESCE(SUM(total_xp), 0) FROM user_stats", [], |r| r.get(0)
        ).unwrap_or(0);
        if total_xp > 0 { return Ok(true); }
        let quests_completed: i64 = conn.query_row(
            "SELECT COALESCE(SUM(quests_completed), 0) FROM user_stats", [], |r| r.get(0)
        ).unwrap_or(0);
        if quests_completed > 0 { return Ok(true); }
        let quest_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM quests", [], |r| r.get(0)
        ).unwrap_or(0);
        if quest_count > 0 { return Ok(true); }
        let achievement_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM achievements", [], |r| r.get(0)
        ).unwrap_or(0);
        Ok(achievement_count > 0)
    }

    pub fn reset_all_data(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("PRAGMA foreign_keys=OFF", [])?;
        for t in &["template_sub_tasks","quest_templates","quest_tags","tags","sub_tasks",
                   "achievements","activity_log","purchases","equipped_items","habit_entries",
                   "habits","journal_entries","daily_challenges","quest_chains","quests","skills","user_stats","profiles"] {
            let _ = conn.execute_batch(&format!("DELETE FROM {};", t));
        }
        let _ = conn.execute_batch("DELETE FROM sqlite_sequence;");
        conn.execute("PRAGMA foreign_keys=ON", [])?;
        conn.execute("INSERT INTO profiles (name, avatar_icon) VALUES ('Hero', '⚔️')", [])?;
        let pid = conn.last_insert_rowid();
        conn.execute("INSERT INTO user_stats (profile_id) VALUES (?1)", params![pid])?;
        Ok(())
    }

    // ═══════════════════════════════════════════════════
    //  PROFILES
    // ═══════════════════════════════════════════════════

    pub fn get_all_profiles(&self) -> Result<Vec<ProfileRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT p.id,p.name,p.avatar_icon,p.created_at,p.active_theme,p.sound_pack,p.default_skill_id,s.total_xp,s.current_level,s.hp,s.max_hp,s.gold FROM profiles p LEFT JOIN user_stats s ON s.profile_id=p.id ORDER BY p.id")?;
        let rows = stmt.query_map([], |r| Ok(ProfileRow {
            id:r.get(0)?,name:r.get(1)?,avatar_icon:r.get(2)?,created_at:r.get(3)?,
            active_theme:r.get(4)?,sound_pack:r.get(5)?,default_skill_id:r.get(6)?,
            total_xp:r.get::<_,Option<i64>>(7)?.unwrap_or(0),current_level:r.get::<_,Option<i64>>(8)?.unwrap_or(1),
            hp:r.get::<_,Option<i64>>(9)?.unwrap_or(100),max_hp:r.get::<_,Option<i64>>(10)?.unwrap_or(100),
            gold:r.get::<_,Option<i64>>(11)?.unwrap_or(0),
        }))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn create_profile(&self, name: &str, avatar_icon: &str) -> Result<ProfileRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("INSERT INTO profiles (name,avatar_icon) VALUES (?1,?2)", params![name,avatar_icon])?;
        let pid = conn.last_insert_rowid();
        conn.execute("INSERT INTO user_stats (profile_id) VALUES (?1)", params![pid])?;
        Self::read_profile(&conn, pid)
    }

    fn read_profile(conn: &Connection, pid: i64) -> Result<ProfileRow> {
        conn.query_row("SELECT p.id,p.name,p.avatar_icon,p.created_at,p.active_theme,p.sound_pack,p.default_skill_id,s.total_xp,s.current_level,s.hp,s.max_hp,s.gold FROM profiles p LEFT JOIN user_stats s ON s.profile_id=p.id WHERE p.id=?1", params![pid], |r| Ok(ProfileRow {
            id:r.get(0)?,name:r.get(1)?,avatar_icon:r.get(2)?,created_at:r.get(3)?,
            active_theme:r.get(4)?,sound_pack:r.get(5)?,default_skill_id:r.get(6)?,
            total_xp:r.get::<_,Option<i64>>(7)?.unwrap_or(0),current_level:r.get::<_,Option<i64>>(8)?.unwrap_or(1),
            hp:r.get::<_,Option<i64>>(9)?.unwrap_or(100),max_hp:r.get::<_,Option<i64>>(10)?.unwrap_or(100),
            gold:r.get::<_,Option<i64>>(11)?.unwrap_or(0),
        }))
    }

    pub fn delete_profile(&self, profile_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN")?;
        match (|| -> Result<()> {
            conn.execute("DELETE FROM template_sub_tasks WHERE EXISTS (SELECT 1 FROM quest_templates qt WHERE qt.profile_id=?1 AND template_sub_tasks.template_id=qt.id)", params![profile_id]).ok();
            for t in &["quest_templates","quest_tags","sub_tasks"] {
                if *t == "quest_tags" || *t == "sub_tasks" {
                    conn.execute(&format!("DELETE FROM {} WHERE quest_id IN (SELECT id FROM quests WHERE profile_id=?1)", t), params![profile_id])?;
                } else {
                    conn.execute(&format!("DELETE FROM {} WHERE profile_id=?1", t), params![profile_id])?;
                }
            }
            for t in &["activity_log","achievements","purchases","quests","skills","user_stats","quest_chains","daily_challenges","habits","equipped_items","journal_entries"] {
                conn.execute(&format!("DELETE FROM {} WHERE profile_id=?1", t), params![profile_id])?;
            }
            conn.execute("DELETE FROM profiles WHERE id=?1", params![profile_id])?;
            Ok(())
        })() {
            Ok(()) => { conn.execute_batch("COMMIT")?; Ok(()) }
            Err(e) => { conn.execute_batch("ROLLBACK").ok(); Err(e) }
        }
    }

    pub fn update_profile_theme(&self, profile_id: i64, theme: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        if theme != "default" {
            let item_key = format!("theme_{}", theme);
            let owned: i64 = conn.query_row(
                "SELECT COUNT(*) FROM purchases WHERE profile_id=?1 AND item_key=?2",
                params![profile_id, item_key], |r| r.get(0))?;
            if owned == 0 {
                return Err(rusqlite::Error::InvalidParameterName("Theme not owned".into()));
            }
        }
        conn.execute("UPDATE profiles SET active_theme=?1 WHERE id=?2", params![theme, profile_id])?;
        Ok(())
    }

    pub fn update_profile_sound(&self, profile_id: i64, pack: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE profiles SET sound_pack=?1 WHERE id=?2", params![pack,profile_id])?;
        Ok(())
    }

    pub fn set_default_skill(&self, profile_id: i64, skill_id: Option<i64>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE profiles SET default_skill_id=?1 WHERE id=?2", params![skill_id,profile_id])?;
        Ok(())
    }

    // ═══════════════════════════════════════════════════
    //  SKILLS
    // ═══════════════════════════════════════════════════

    pub fn get_all_skills(&self, profile_id: i64) -> Result<Vec<SkillRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,name,category,parent_skill_id,current_xp,level,icon,sort_order,is_archived,prestige_count,last_xp_date,target_level FROM skills WHERE profile_id=?1 AND is_archived=0 ORDER BY sort_order")?;
        let rows = stmt.query_map(params![profile_id], |r| Ok(SkillRow {
            id:r.get(0)?,name:r.get(1)?,category:r.get(2)?,parent_skill_id:r.get(3)?,
            current_xp:r.get(4)?,level:r.get(5)?,icon:r.get(6)?,sort_order:r.get(7)?,
            is_archived:r.get::<_,i32>(8)?!=0,prestige_count:r.get(9).unwrap_or(0),last_xp_date:r.get(10)?,target_level:r.get(11)?,
        }))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn create_skill(&self, profile_id: i64, name: &str, category: &str, parent: Option<i64>, icon: &str) -> Result<SkillRow> {
        let conn = self.conn.lock().unwrap();
        let ms: i64 = conn.query_row("SELECT COALESCE(MAX(sort_order),0) FROM skills WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
        conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,?4,?5,?6)", params![profile_id,name,category,parent,icon,ms+1])?;
        let id = conn.last_insert_rowid();
        Self::read_skill(&conn, id)
    }

    pub fn delete_skill(&self, skill_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN")?;
        match (|| -> Result<()> {
            fn collect_descendants(conn: &Connection, parent_id: i64, ids: &mut Vec<i64>) -> Result<()> {
                let mut stmt = conn.prepare("SELECT id FROM skills WHERE parent_skill_id=?1")?;
                let children: Vec<i64> = stmt.query_map(params![parent_id], |r| r.get(0))?.collect::<Result<Vec<_>, _>>()?;
                for child_id in children {
                    ids.push(child_id);
                    collect_descendants(conn, child_id, ids)?;
                }
                Ok(())
            }
            let mut all_ids = vec![skill_id];
            collect_descendants(&conn, skill_id, &mut all_ids)?;
            for id in &all_ids {
                conn.execute("DELETE FROM sub_tasks WHERE quest_id IN (SELECT id FROM quests WHERE skill_id=?1)", params![id])?;
                conn.execute("DELETE FROM quest_tags WHERE quest_id IN (SELECT id FROM quests WHERE skill_id=?1)", params![id])?;
                conn.execute("DELETE FROM quests WHERE skill_id=?1", params![id])?;
                conn.execute("UPDATE profiles SET default_skill_id=NULL WHERE default_skill_id=?1", params![id])?;
                conn.execute("DELETE FROM skills WHERE id=?1", params![id])?;
            }
            Ok(())
        })() {
            Ok(()) => { conn.execute_batch("COMMIT")?; Ok(()) }
            Err(e) => { conn.execute_batch("ROLLBACK").ok(); Err(e) }
        }
    }

    fn read_skill(conn: &Connection, id: i64) -> Result<SkillRow> {
        conn.query_row("SELECT id,name,category,parent_skill_id,current_xp,level,icon,sort_order,is_archived,prestige_count,last_xp_date,target_level FROM skills WHERE id=?1", params![id], |r| Ok(SkillRow {
            id:r.get(0)?,name:r.get(1)?,category:r.get(2)?,parent_skill_id:r.get(3)?,
            current_xp:r.get(4)?,level:r.get(5)?,icon:r.get(6)?,sort_order:r.get(7)?,
            is_archived:r.get::<_,i32>(8)?!=0,prestige_count:r.get(9).unwrap_or(0),last_xp_date:r.get(10)?,target_level:r.get(11)?,
        }))
    }

    pub fn add_catalog_skill(&self, profile_id: i64, cat_code: &str, cat_name: &str, cat_icon: &str, group_name: &str, group_icon: &str, skill_name: &str, skill_icon: &str) -> Result<SkillRow> {
        let conn = self.conn.lock().unwrap();
        let ms: i64 = conn.query_row("SELECT COALESCE(MAX(sort_order),0) FROM skills WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;

        // Find or create category
        let cat_id: i64 = match conn.query_row(
            "SELECT id FROM skills WHERE profile_id=?1 AND category=?2 AND parent_skill_id IS NULL",
            params![profile_id, cat_code], |r| r.get(0)
        ) {
            Ok(id) => id,
            Err(_) => {
                conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,NULL,?4,?5)",
                    params![profile_id, cat_name, cat_code, cat_icon, ms+1])?;
                conn.last_insert_rowid()
            }
        };

        // Find or create group
        let group_id: i64 = match conn.query_row(
            "SELECT id FROM skills WHERE profile_id=?1 AND name=?2 AND parent_skill_id=?3",
            params![profile_id, group_name, cat_id], |r| r.get(0)
        ) {
            Ok(id) => id,
            Err(_) => {
                let ms2: i64 = conn.query_row("SELECT COALESCE(MAX(sort_order),0) FROM skills WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
                conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,?4,?5,?6)",
                    params![profile_id, group_name, cat_code, cat_id, group_icon, ms2+1])?;
                conn.last_insert_rowid()
            }
        };

        // Check if leaf already exists
        let existing: i64 = conn.query_row(
            "SELECT COUNT(*) FROM skills WHERE profile_id=?1 AND name=?2 AND parent_skill_id=?3",
            params![profile_id, skill_name, group_id], |r| r.get(0))?;
        if existing > 0 {
            return Err(rusqlite::Error::InvalidParameterName("Skill already added".into()));
        }

        // Create leaf skill
        let ms3: i64 = conn.query_row("SELECT COALESCE(MAX(sort_order),0) FROM skills WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
        conn.execute("INSERT INTO skills (profile_id,name,category,parent_skill_id,icon,sort_order) VALUES (?1,?2,?3,?4,?5,?6)",
            params![profile_id, skill_name, cat_code, group_id, skill_icon, ms3+1])?;
        let id = conn.last_insert_rowid();
        Self::read_skill(&conn, id)
    }

    pub fn get_catalog_suggestions(&self, skill_id: i64) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let skill_name: String = conn.query_row("SELECT name FROM skills WHERE id=?1", params![skill_id], |r| r.get(0))?;
        for cat in crate::catalog::get_catalog() {
            for grp in cat.groups {
                for sk in grp.skills {
                    if sk.name == skill_name {
                        return Ok(sk.suggested_quests.iter().map(|s| s.to_string()).collect());
                    }
                }
            }
        }
        Ok(vec![])
    }

    pub fn update_skill(&self, skill_id: i64, name: &str, icon: &str) -> Result<SkillRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE skills SET name=?1, icon=?2 WHERE id=?3", params![name, icon, skill_id])?;
        Self::read_skill(&conn, skill_id)
    }

    pub fn move_skill(&self, skill_id: i64, new_parent_id: i64, new_category: &str) -> Result<SkillRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE skills SET parent_skill_id=?1, category=?2 WHERE id=?3", params![new_parent_id, new_category, skill_id])?;
        conn.execute("UPDATE skills SET category=?1 WHERE parent_skill_id=?2", params![new_category, skill_id])?;
        Self::read_skill(&conn, skill_id)
    }

    pub fn archive_skill(&self, skill_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE skills SET is_archived=1 WHERE id=?1", params![skill_id])?;
        conn.execute("UPDATE skills SET is_archived=1 WHERE parent_skill_id=?1", params![skill_id])?;
        Ok(())
    }

    pub fn unarchive_skill(&self, skill_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE skills SET is_archived=0 WHERE id=?1", params![skill_id])?;
        conn.execute("UPDATE skills SET is_archived=0 WHERE parent_skill_id=?1", params![skill_id])?;
        Ok(())
    }

    pub fn get_archived_skills(&self, profile_id: i64) -> Result<Vec<SkillRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,name,category,parent_skill_id,current_xp,level,icon,sort_order,is_archived,prestige_count,last_xp_date,target_level FROM skills WHERE profile_id=?1 AND is_archived=1 ORDER BY sort_order")?;
        let rows = stmt.query_map(params![profile_id], |r| Ok(SkillRow {
            id:r.get(0)?,name:r.get(1)?,category:r.get(2)?,parent_skill_id:r.get(3)?,
            current_xp:r.get(4)?,level:r.get(5)?,icon:r.get(6)?,sort_order:r.get(7)?,
            is_archived:r.get::<_,i32>(8)?!=0,prestige_count:r.get(9).unwrap_or(0),last_xp_date:r.get(10)?,target_level:r.get(11)?,
        }))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn reorder_skills(&self, skill_ids: &[i64]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        for (i, id) in skill_ids.iter().enumerate() {
            conn.execute("UPDATE skills SET sort_order=?1 WHERE id=?2", params![i as i64, id])?;
        }
        Ok(())
    }

    pub fn get_skill_quest_counts(&self, profile_id: i64) -> Result<Vec<(i64, i64)>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT skill_id, COUNT(*) FROM quests WHERE profile_id=?1 AND completed=0 AND failed=0 AND is_archived=0 GROUP BY skill_id")?;
        let rows = stmt.query_map(params![profile_id], |r| Ok((r.get(0)?, r.get(1)?)))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    // ═══════════════════════════════════════════════════
    //  QUESTS
    // ═══════════════════════════════════════════════════

    const QC: &'static str = "id,quest_name,description,quest_type,skill_id,xp_reward,completed,failed,completed_at,due_date,created_at,is_recurring,recurrence_pattern,parent_quest_id,difficulty,priority,is_boss,is_pinned,is_archived,sort_order,time_spent_seconds,pomodoro_count,failed_at,chain_id,chain_order,estimated_minutes,blocked_by_quest_id";

    fn map_quest(r: &rusqlite::Row) -> rusqlite::Result<QuestRow> {
        Ok(QuestRow {
            id:r.get(0)?,quest_name:r.get(1)?,description:r.get(2)?,quest_type:r.get(3)?,
            skill_id:r.get(4)?,xp_reward:r.get(5)?,completed:r.get::<_,i32>(6)?!=0,failed:r.get::<_,i32>(7)?!=0,
            completed_at:r.get(8)?,due_date:r.get(9)?,created_at:r.get(10)?,
            is_recurring:r.get::<_,i32>(11)?!=0,recurrence_pattern:r.get(12)?,parent_quest_id:r.get(13)?,
            difficulty:r.get(14)?,priority:r.get(15)?,is_boss:r.get::<_,i32>(16)?!=0,
            is_pinned:r.get::<_,i32>(17)?!=0,is_archived:r.get::<_,i32>(18)?!=0,
            sort_order:r.get(19)?,time_spent_seconds:r.get(20)?,pomodoro_count:r.get(21)?,failed_at:r.get(22)?,
            chain_id:r.get(23)?,chain_order:r.get(24)?,
            estimated_minutes:r.get(25)?,blocked_by_quest_id:r.get(26)?,
        })
    }

    fn query_quests<P: rusqlite::Params>(conn: &Connection, sql: &str, p: P) -> Result<Vec<QuestRow>> {
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt.query_map(p, Self::map_quest)?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn get_all_quests(&self, profile_id: i64) -> Result<Vec<QuestRow>> {
        let conn = self.conn.lock().unwrap();
        Self::query_quests(&conn, &format!("SELECT {} FROM quests WHERE profile_id=?1 AND is_archived=0 ORDER BY is_pinned DESC, CASE priority WHEN 'urgent' THEN 0 WHEN 'normal' THEN 1 WHEN 'low' THEN 2 END, sort_order, created_at DESC", Self::QC), params![profile_id])
    }

    pub fn get_quests_for_skill(&self, skill_id: i64) -> Result<Vec<QuestRow>> {
        let conn = self.conn.lock().unwrap();
        Self::query_quests(&conn, &format!("SELECT {} FROM quests WHERE skill_id=?1 AND is_archived=0 ORDER BY completed, id DESC", Self::QC), params![skill_id])
    }

    pub fn get_archived_quests(&self, profile_id: i64) -> Result<Vec<QuestRow>> {
        let conn = self.conn.lock().unwrap();
        Self::query_quests(&conn, &format!("SELECT {} FROM quests WHERE profile_id=?1 AND is_archived=1 ORDER BY completed_at DESC", Self::QC), params![profile_id])
    }

    pub fn create_quest(&self, profile_id: i64, name: &str, desc: &str, qtype: &str, skill_id: Option<i64>, _xp: i64, due: Option<&str>, recurring: bool, pattern: Option<&str>, difficulty: &str, priority: &str, is_boss: bool, estimated_minutes: Option<i64>) -> Result<QuestRow> {
        let conn = self.conn.lock().unwrap();
        let xp = Self::base_xp_for_quest_type(qtype);
        conn.execute("INSERT INTO quests (profile_id,quest_name,description,quest_type,skill_id,xp_reward,due_date,is_recurring,recurrence_pattern,difficulty,priority,is_boss,estimated_minutes) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",
            params![profile_id,name,desc,qtype,skill_id,xp,due,recurring as i32,pattern,difficulty,priority,is_boss as i32,estimated_minutes])?;
        let id = conn.last_insert_rowid();
        conn.query_row(&format!("SELECT {} FROM quests WHERE id=?1", Self::QC), params![id], Self::map_quest)
    }

    pub fn update_quest_description(&self, quest_id: i64, desc: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET description=?1 WHERE id=?2", params![desc,quest_id])?;
        Ok(())
    }

    pub fn toggle_pin_quest(&self, profile_id: i64, quest_id: i64) -> Result<QuestRow> {
        let conn = self.conn.lock().unwrap();
        let cur: i32 = conn.query_row("SELECT is_pinned FROM quests WHERE id=?1 AND profile_id=?2", params![quest_id, profile_id], |r| r.get(0))?;
        if cur == 0 {
            let cnt: i64 = conn.query_row("SELECT COUNT(*) FROM quests WHERE profile_id=?1 AND is_pinned=1", params![profile_id], |r| r.get(0))?;
            if cnt >= 3 { return Err(rusqlite::Error::InvalidParameterName("Max 3 pinned quests".into())); }
        }
        conn.execute("UPDATE quests SET is_pinned=?1 WHERE id=?2", params![1-cur,quest_id])?;
        conn.query_row(&format!("SELECT {} FROM quests WHERE id=?1", Self::QC), params![quest_id], Self::map_quest)
    }

    pub fn archive_quest(&self, quest_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET is_archived=1,is_pinned=0 WHERE id=?1", params![quest_id])?;
        Ok(())
    }

    pub fn unarchive_quest(&self, quest_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET is_archived=0 WHERE id=?1", params![quest_id])?;
        Ok(())
    }

    pub fn reorder_quests(&self, quest_ids: &[i64]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        for (i, id) in quest_ids.iter().enumerate() {
            conn.execute("UPDATE quests SET sort_order=?1 WHERE id=?2", params![i as i64, id])?;
        }
        Ok(())
    }

    fn base_xp_for_quest_type(quest_type: &str) -> i64 {
        match quest_type { "weekly" => 25, "monthly" => 50, _ => 10 }
    }

    fn difficulty_xp_mult(difficulty: &str) -> f64 {
        match difficulty { "hard" => 1.5, "epic" => 3.0, _ => 1.0 }
    }

    fn difficulty_hp_damage(difficulty: &str) -> i64 {
        match difficulty { "hard" => 15, "epic" => 25, _ => 10 }
    }

    fn streak_xp_mult(streak: i64) -> f64 {
        if streak >= 30 { 2.0 } else if streak >= 7 { 1.5 } else { 1.0 }
    }

    fn difficulty_gold(difficulty: &str) -> i64 {
        match difficulty { "easy" => 5, "hard" => 20, "epic" => 40, _ => 10 }
    }

    fn quest_type_gold_mult(quest_type: &str) -> f64 {
        match quest_type { "weekly" => 1.5, "monthly" => 2.0, _ => 1.0 }
    }

    fn streak_gold_mult(streak: i64) -> f64 {
        if streak >= 30 { 1.75 }
        else if streak >= 14 { 1.5 }
        else if streak >= 7 { 1.25 }
        else if streak >= 3 { 1.1 }
        else { 1.0 }
    }

    pub fn toggle_quest(&self, profile_id: i64, quest_id: i64) -> Result<ToggleQuestResult> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN")?;
        match (|| -> Result<ToggleQuestResult> {
        // 1. Read quest data
        let (xp_reward, skill_id, completed, difficulty, quest_type): (i64, Option<i64>, i32, String, String) = conn.query_row(
            "SELECT xp_reward,skill_id,completed,difficulty,quest_type FROM quests WHERE id=?1 AND profile_id=?2", params![quest_id, profile_id],
            |r| Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?)))?;
        let skill_category: String = if let Some(sid) = skill_id {
            conn.query_row("SELECT category FROM skills WHERE id=?1", params![sid], |r| r.get(0))?
        } else {
            "NONE".to_string()
        };

        let new_status = if completed == 0 { 1 } else { 0 };
        let count_delta: i64 = if new_status == 1 { 1 } else { -1 };

        // 2. Read stats
        let (xp_boost, streak, current_hp, max_hp, boost_skill_id, boost_mult, boost_expires): (i64, i64, i64, i64, Option<i64>, f64, Option<String>) = conn.query_row(
            "SELECT xp_boost_remaining, current_streak, hp, max_hp, skill_boost_id, skill_boost_mult, skill_boost_expires FROM user_stats WHERE profile_id=?1",
            params![profile_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?, r.get(6)?)))?;

        // 3. Calculate XP
        let (equip_xp_mult, equip_gold_bonus, equip_hp_bonus, equip_burnout_reduce) = Self::get_equipment_bonuses(&conn, profile_id, &skill_category)?;
        let mut effective_xp = if new_status == 1 {
            let diff_mult = Self::difficulty_xp_mult(&difficulty);
            let streak_mult = Self::streak_xp_mult(streak);
            let boost_mult_xp = if xp_boost > 0 { 2.0 } else { 1.0 };
            let mut xp = (xp_reward as f64 * diff_mult * streak_mult * boost_mult_xp).round() as i64;
            let now_str = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
            if let (Some(bsid), Some(ref exp)) = (boost_skill_id, &boost_expires) {
                if Some(bsid) == skill_id && exp.as_str() > now_str.as_str() {
                    xp = (xp as f64 * boost_mult).round() as i64;
                } else if exp.as_str() <= now_str.as_str() {
                    conn.execute("UPDATE user_stats SET skill_boost_id=NULL, skill_boost_mult=1.0, skill_boost_expires=NULL WHERE profile_id=?1", params![profile_id])?;
                }
            }
            xp = (xp as f64 * equip_xp_mult).round() as i64;
            xp
        } else {
            let diff_mult = Self::difficulty_xp_mult(&difficulty);
            -((xp_reward as f64 * diff_mult).round() as i64)
        };

        // 4. Calculate gold
        let mut gold_earned = if new_status == 1 {
            let base_gold = Self::difficulty_gold(&difficulty);
            let type_mult = Self::quest_type_gold_mult(&quest_type);
            let streak_g_mult = Self::streak_gold_mult(streak);
            let mut g = (base_gold as f64 * type_mult * streak_g_mult).round() as i64;
            g += equip_gold_bonus;
            g
        } else {
            let base_gold = Self::difficulty_gold(&difficulty);
            let type_mult = Self::quest_type_gold_mult(&quest_type);
            let streak_g_mult = Self::streak_gold_mult(streak);
            -((base_gold as f64 * type_mult * streak_g_mult).round() as i64)
        };

        // 5. Burnout penalty (check BEFORE healing)
        let is_burnout = current_hp == 0;
        if is_burnout && new_status == 1 {
            let penalty = if equip_burnout_reduce { 0.75 } else { 0.5 };
            effective_xp = (effective_xp as f64 * penalty).round() as i64;
            gold_earned = (gold_earned as f64 * penalty).round() as i64;
        }

        // 6. Bounty check
        let bounty_json: String = conn.query_row(
            "SELECT daily_bounties FROM user_stats WHERE profile_id=?1",
            params![profile_id], |r| r.get(0)).unwrap_or_else(|_| "[]".to_string());
        let bounty_ids: Vec<i64> = serde_json::from_str(&bounty_json).unwrap_or_default();
        let is_bounty = bounty_ids.contains(&quest_id);
        if is_bounty && new_status == 1 {
            gold_earned *= 2;
        }

        // 7. Overkill bonus (all sub-tasks completed)
        if new_status == 1 {
            let total_subs: i64 = conn.query_row(
                "SELECT COUNT(*) FROM sub_tasks WHERE quest_id=?1", params![quest_id], |r| r.get(0))?;
            let done_subs: i64 = conn.query_row(
                "SELECT COUNT(*) FROM sub_tasks WHERE quest_id=?1 AND completed=1", params![quest_id], |r| r.get(0))?;
            if total_subs > 0 && done_subs == total_subs {
                gold_earned = (gold_earned as f64 * 1.5).round() as i64;
            }
        }

        // 8. HP regen (+2 per quest, capped at 80% of max_hp)
        if new_status == 1 {
            let passive_cap = (max_hp as f64 * 0.8).round() as i64;
            if current_hp < passive_cap {
                let heal = (2 + equip_hp_bonus).min(passive_cap - current_hp);
                conn.execute("UPDATE user_stats SET hp=hp+?1 WHERE profile_id=?2", params![heal, profile_id])?;
            }
        }

        // 9. Update quest status
        conn.execute("UPDATE quests SET completed=?1, completed_at=CASE WHEN ?1=1 THEN datetime('now') ELSE NULL END WHERE id=?2", params![new_status, quest_id])?;

        // 10. Update skill XP + level
        if let Some(sid) = skill_id {
            conn.execute("UPDATE skills SET current_xp=MAX(0,current_xp+?1) WHERE id=?2", params![effective_xp, sid])?;
            if new_status == 1 {
                let today_xp = chrono::Utc::now().format("%Y-%m-%d").to_string();
                conn.execute("UPDATE skills SET last_xp_date=?1 WHERE id=?2", params![today_xp, sid])?;
            }
            let skill_xp: i64 = conn.query_row("SELECT current_xp FROM skills WHERE id=?1", params![sid], |r| r.get(0))?;
            let skill_level = calculate_level_from_xp(skill_xp as u64).0 as i64;
            conn.execute("UPDATE skills SET level=?1 WHERE id=?2", params![skill_level, sid])?;
        }

        // 11. Update user_stats
        conn.execute("UPDATE user_stats SET total_xp=MAX(0,total_xp+?1),quests_completed=MAX(0,quests_completed+?2),gold=MAX(0,gold+?3) WHERE profile_id=?4",
            params![effective_xp, count_delta, gold_earned, profile_id])?;

        // 12. Decrement XP boost
        if new_status == 1 && xp_boost > 0 {
            conn.execute("UPDATE user_stats SET xp_boost_remaining=MAX(0,xp_boost_remaining-1) WHERE profile_id=?1", params![profile_id])?;
        }

        // 13. First blood
        let mut first_blood = false;
        if new_status == 1 {
            let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
            let last_fb: Option<String> = conn.query_row(
                "SELECT last_first_blood_date FROM user_stats WHERE profile_id=?1",
                params![profile_id], |r| r.get(0)).unwrap_or(None);
            if last_fb.as_deref() != Some(&today) {
                first_blood = true;
                let fb_gold = 5i64;
                let fb_xp = 5i64;
                conn.execute(
                    "UPDATE user_stats SET gold=gold+?1, total_xp=total_xp+?2, last_first_blood_date=?3 WHERE profile_id=?4",
                    params![fb_gold, fb_xp, today, profile_id])?;
                if let Some(sid) = skill_id {
                    conn.execute("UPDATE skills SET current_xp=current_xp+?1 WHERE id=?2", params![fb_xp, sid])?;
                }
                conn.execute(
                    "INSERT INTO activity_log (profile_id,skill_id,event_type,detail,xp_delta) VALUES (?1,?2,'first_blood','First quest of the day bonus',?3)",
                    params![profile_id, skill_id, fb_xp])?;
            }
        }

        // 14. Streak update
        if new_status == 1 {
            let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
            let last_date: Option<String> = conn.query_row("SELECT last_activity_date FROM user_stats WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
            if last_date.as_deref() != Some(&today) {
                let yesterday = (chrono::Utc::now() - chrono::Duration::days(1)).format("%Y-%m-%d").to_string();
                if last_date.as_deref() == Some(&yesterday) {
                    conn.execute("UPDATE user_stats SET current_streak=current_streak+1,last_activity_date=?1 WHERE profile_id=?2", params![today, profile_id])?;
                } else {
                    conn.execute("UPDATE user_stats SET current_streak=1,last_activity_date=?1 WHERE profile_id=?2", params![today, profile_id])?;
                }
                conn.execute("UPDATE user_stats SET longest_streak=MAX(longest_streak,current_streak) WHERE profile_id=?1", params![profile_id])?;
            }
        }

        // 15. Activity log
        if new_status == 1 {
            let qname: String = conn.query_row("SELECT quest_name FROM quests WHERE id=?1", params![quest_id], |r| r.get(0))?;
            let mut detail = format!("Completed: {}", qname);
            if is_burnout { detail.push_str(" (Burnout: 50% penalty)"); }
            if is_bounty { detail.push_str(" (Bounty: 2× gold)"); }
            conn.execute("INSERT INTO activity_log (profile_id,skill_id,event_type,detail,xp_delta) VALUES (?1,?2,'quest_complete',?3,?4)",
                params![profile_id, skill_id, detail, effective_xp])?;
        }

        // Chain completion check
        if new_status == 1 {
            let chain_id_opt: Option<i64> = conn.query_row("SELECT chain_id FROM quests WHERE id=?1", params![quest_id], |r| r.get(0))?;
            if let Some(cid) = chain_id_opt {
                let total_in_chain: i64 = conn.query_row("SELECT COUNT(*) FROM quests WHERE chain_id=?1", params![cid], |r| r.get(0))?;
                let done_in_chain: i64 = conn.query_row("SELECT COUNT(*) FROM quests WHERE chain_id=?1 AND completed=1", params![cid], |r| r.get(0))?;
                if done_in_chain == total_in_chain {
                    let (bg, bx): (i64, i64) = conn.query_row("SELECT bonus_gold, bonus_xp FROM quest_chains WHERE id=?1", params![cid], |r| Ok((r.get(0)?, r.get(1)?)))?;
                    conn.execute("UPDATE quest_chains SET completed=1 WHERE id=?1", params![cid])?;
                    conn.execute("UPDATE user_stats SET gold=gold+?1, total_xp=total_xp+?2 WHERE profile_id=?3", params![bg, bx, profile_id])?;
                    if let Some(sid) = skill_id {
                        conn.execute("UPDATE skills SET current_xp=current_xp+?1 WHERE id=?2", params![bx, sid])?;
                    }
                    conn.execute("INSERT INTO activity_log (profile_id,skill_id,event_type,detail,xp_delta) VALUES (?1,?2,'chain_complete',?3,?4)",
                        params![profile_id, skill_id, format!("Quest chain completed! +{}g +{}xp", bg, bx), bx])?;
                }
            }
        }

        // Update daily challenges
        if new_status == 1 {
            let today_ch = chrono::Utc::now().format("%Y-%m-%d").to_string();
            conn.execute("UPDATE daily_challenges SET progress=progress+1 WHERE profile_id=?1 AND date=?2 AND challenge_type='complete_quests' AND completed=0", params![profile_id, today_ch])?;
            conn.execute("UPDATE daily_challenges SET progress=MIN(target,progress+?1) WHERE profile_id=?2 AND date=?3 AND challenge_type='earn_xp' AND completed=0", params![effective_xp, profile_id, today_ch])?;
            if difficulty == "hard" || difficulty == "epic" {
                conn.execute("UPDATE daily_challenges SET progress=progress+1 WHERE profile_id=?1 AND date=?2 AND challenge_type='complete_hard' AND completed=0", params![profile_id, today_ch])?;
            }
            let mut stmt_ch = conn.prepare("SELECT id, reward_gold, reward_xp FROM daily_challenges WHERE profile_id=?1 AND date=?2 AND completed=0 AND progress>=target")?;
            let completed_chs: Vec<(i64, i64, i64)> = stmt_ch.query_map(params![profile_id, today_ch], |r| Ok((r.get(0)?,r.get(1)?,r.get(2)?)))?.collect::<Result<Vec<_>,_>>()?;
            for (ch_id, ch_gold, ch_xp) in &completed_chs {
                conn.execute("UPDATE daily_challenges SET completed=1 WHERE id=?1", params![ch_id])?;
                conn.execute("UPDATE user_stats SET gold=gold+?1, total_xp=total_xp+?2 WHERE profile_id=?3", params![ch_gold, ch_xp, profile_id])?;
            }
        }

        // Combo system — rapid completions within 2 minutes
        let combo_count: i64 = if new_status == 1 {
            let now = chrono::Utc::now();
            let two_min_ago = (now - chrono::Duration::seconds(120)).format("%Y-%m-%d %H:%M:%S").to_string();
            let recent: i64 = conn.query_row(
                "SELECT COUNT(*) FROM activity_log WHERE profile_id=?1 AND event_type='quest_complete' AND created_at>=?2",
                params![profile_id, two_min_ago], |r| r.get(0))?;
            if recent > 1 {
                let bonus_xp = (recent - 1) * 2;
                let bonus_gold = (recent - 1) * 1;
                conn.execute("UPDATE user_stats SET total_xp=total_xp+?1, gold=gold+?2 WHERE profile_id=?3",
                    params![bonus_xp, bonus_gold, profile_id])?;
                if let Some(sid) = skill_id {
                    conn.execute("UPDATE skills SET current_xp=current_xp+?1 WHERE id=?2", params![bonus_xp, sid])?;
                }
                recent - 1
            } else { 0 }
        } else { 0 };

        // 16. Recalculate global level
        let total_xp: i64 = conn.query_row("SELECT total_xp FROM user_stats WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
        let global_level = calculate_level_from_xp(total_xp as u64).0 as i64;
        conn.execute("UPDATE user_stats SET current_level=?1 WHERE profile_id=?2", params![global_level, profile_id])?;

        // 17. Return
        let skill = if let Some(sid) = skill_id { Some(Self::read_skill(&conn, sid)?) } else { None };
        let stats = Self::read_stats(&conn, profile_id)?;
        Ok(ToggleQuestResult { skill, stats, first_blood, combo_count })
        })() {
            Ok(result) => { conn.execute_batch("COMMIT")?; Ok(result) }
            Err(e) => { conn.execute_batch("ROLLBACK").ok(); Err(e) }
        }
    }

    pub fn fail_quest(&self, profile_id: i64, quest_id: i64) -> Result<StatsRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN")?;
        match (|| -> Result<StatsRow> {
            let difficulty: String = conn.query_row("SELECT difficulty FROM quests WHERE id=?1 AND profile_id=?2", params![quest_id, profile_id], |r| r.get(0))?;
            let dmg = Self::difficulty_hp_damage(&difficulty);
            conn.execute("UPDATE quests SET failed=1, failed_at=datetime('now'), completed_at=datetime('now') WHERE id=?1", params![quest_id])?;
            let qname: String = conn.query_row("SELECT quest_name FROM quests WHERE id=?1", params![quest_id], |r| r.get(0))?;
            let skill_id: Option<i64> = conn.query_row("SELECT skill_id FROM quests WHERE id=?1", params![quest_id], |r| r.get(0))?;
            conn.execute("INSERT INTO activity_log (profile_id,skill_id,event_type,detail,xp_delta) VALUES (?1,?2,'quest_fail',?3,0)",
                params![profile_id, skill_id, format!("Failed: {} (-{} HP in 24h unless recovered)", qname, dmg)])?;
            Self::read_stats(&conn, profile_id)
        })() {
            Ok(result) => { conn.execute_batch("COMMIT")?; Ok(result) }
            Err(e) => { conn.execute_batch("ROLLBACK").ok(); Err(e) }
        }
    }

    pub fn apply_pending_fail_damage(&self, profile_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN")?;
        match (|| -> Result<()> {
            let cutoff = (chrono::Utc::now() - chrono::Duration::hours(24)).format("%Y-%m-%dT%H:%M:%S").to_string();
            let pending: Vec<(i64, String)> = {
                let mut stmt = conn.prepare(
                    "SELECT id, difficulty FROM quests WHERE profile_id=?1 AND failed=1 AND failed_at IS NOT NULL AND failed_at <= ?2"
                )?;
                let rows = stmt.query_map(params![profile_id, cutoff], |r| Ok((r.get(0)?, r.get(1)?)))?.collect::<Result<Vec<_>, _>>()?;
                rows
            };
            for (quest_id, difficulty) in &pending {
                let dmg = Self::difficulty_hp_damage(difficulty);
                conn.execute("UPDATE user_stats SET hp=MAX(0,hp-?1) WHERE profile_id=?2", params![dmg, profile_id])?;
                conn.execute("UPDATE quests SET failed_at=NULL WHERE id=?1", params![quest_id])?;
            }
            Ok(())
        })() {
            Ok(()) => { conn.execute_batch("COMMIT")?; Ok(()) }
            Err(e) => { conn.execute_batch("ROLLBACK").ok(); Err(e) }
        }
    }

    pub fn recover_failed_quest(&self, quest_id: i64) -> Result<QuestRow> {
        let conn = self.conn.lock().unwrap();
        let failed_at: Option<String> = conn.query_row(
            "SELECT failed_at FROM quests WHERE id=?1", params![quest_id], |r| r.get(0))?;
        if failed_at.is_none() {
            return Err(rusqlite::Error::InvalidParameterName("Grace period expired".into()));
        }
        conn.execute("UPDATE quests SET failed=0, failed_at=NULL, completed_at=NULL WHERE id=?1", params![quest_id])?;
        conn.query_row(&format!("SELECT {} FROM quests WHERE id=?1", Self::QC), params![quest_id], Self::map_quest)
    }

    pub fn check_daily_bounties(&self, profile_id: i64) -> Result<Vec<i64>> {
        let conn = self.conn.lock().unwrap();
        let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let last_bounty_date: Option<String> = conn.query_row(
            "SELECT last_bounty_date FROM user_stats WHERE profile_id=?1",
            params![profile_id], |r| r.get(0))?;
        if last_bounty_date.as_deref() == Some(&today) {
            let json_str: String = conn.query_row(
                "SELECT daily_bounties FROM user_stats WHERE profile_id=?1",
                params![profile_id], |r| r.get(0))?;
            let ids: Vec<i64> = serde_json::from_str(&json_str).unwrap_or_default();
            return Ok(ids);
        }
        let ids: Vec<i64> = {
            let mut stmt = conn.prepare(
                "SELECT id FROM quests WHERE profile_id=?1 AND completed=0 AND failed=0 AND is_archived=0 ORDER BY RANDOM() LIMIT 3"
            )?;
            let rows = stmt.query_map(params![profile_id], |r| r.get(0))?.collect::<Result<Vec<_>, _>>()?;
            rows
        };
        let json = serde_json::to_string(&ids).unwrap_or_else(|_| "[]".to_string());
        conn.execute(
            "UPDATE user_stats SET daily_bounties=?1, last_bounty_date=?2 WHERE profile_id=?3",
            params![json, today, profile_id])?;
        Ok(ids)
    }

    pub fn get_daily_bounties(&self, profile_id: i64) -> Result<Vec<i64>> {
        let conn = self.conn.lock().unwrap();
        let json_str: String = conn.query_row(
            "SELECT daily_bounties FROM user_stats WHERE profile_id=?1",
            params![profile_id], |r| r.get(0)).unwrap_or_else(|_| "[]".to_string());
        Ok(serde_json::from_str(&json_str).unwrap_or_default())
    }

    pub fn activate_skill_boost(&self, profile_id: i64, skill_id: i64, mult: f64, duration_hours: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let expires = (chrono::Utc::now() + chrono::Duration::hours(duration_hours))
            .format("%Y-%m-%dT%H:%M:%S").to_string();
        conn.execute(
            "UPDATE user_stats SET skill_boost_id=?1, skill_boost_mult=?2, skill_boost_expires=?3 WHERE profile_id=?4",
            params![skill_id, mult, expires, profile_id])?;
        Ok(())
    }

    pub fn delete_quest(&self, quest_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM sub_tasks WHERE quest_id=?1", params![quest_id])?;
        conn.execute("DELETE FROM quest_tags WHERE quest_id=?1", params![quest_id])?;
        conn.execute("UPDATE quests SET parent_quest_id=NULL WHERE parent_quest_id=?1", params![quest_id])?;
        conn.execute("DELETE FROM quests WHERE id=?1", params![quest_id])?;
        Ok(())
    }

    fn get_equipment_bonuses(conn: &Connection, profile_id: i64, skill_category: &str) -> Result<(f64, i64, i64, bool)> {
        let mut xp_mult = 1.0f64;
        let mut gold_bonus = 0i64;
        let mut hp_bonus = 0i64;
        let mut burnout_reduce = false;
        let items: Vec<String> = {
            let mut stmt = conn.prepare("SELECT item_key FROM equipped_items WHERE profile_id=?1")?;
            let rows = stmt.query_map(params![profile_id], |r| r.get(0))?;
            rows.collect::<Result<Vec<_>,_>>().unwrap_or_default()
        };
        for item in &items {
            match item.as_str() {
                "scholars_ring" if skill_category == "INT" => xp_mult *= 1.1,
                "warriors_gauntlet" if skill_category == "STR" => xp_mult *= 1.1,
                "artisans_hammer" if skill_category == "CRAFT" => xp_mult *= 1.1,
                "healers_charm" => hp_bonus += 1,
                "merchants_pouch" => gold_bonus += 2,
                "phoenix_feather" => burnout_reduce = true,
                "speedrunners_boots" => xp_mult *= 1.05,
                _ => {}
            }
        }
        Ok((xp_mult, gold_bonus, hp_bonus, burnout_reduce))
    }

    // ═══════════════════════════════════════════════════
    //  QUEST CHAINS
    // ═══════════════════════════════════════════════════

    pub fn create_chain(&self, profile_id: i64, name: &str, desc: &str, bonus_gold: i64, bonus_xp: i64) -> Result<ChainRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("INSERT INTO quest_chains (profile_id,name,description,bonus_gold,bonus_xp) VALUES (?1,?2,?3,?4,?5)",
            params![profile_id, name, desc, bonus_gold, bonus_xp])?;
        let id = conn.last_insert_rowid();
        conn.query_row("SELECT id,profile_id,name,description,bonus_gold,bonus_xp,completed,created_at FROM quest_chains WHERE id=?1", params![id], |r| Ok(ChainRow {
            id:r.get(0)?,profile_id:r.get(1)?,name:r.get(2)?,description:r.get(3)?,
            bonus_gold:r.get(4)?,bonus_xp:r.get(5)?,completed:r.get::<_,i32>(6)?!=0,created_at:r.get(7)?,
        }))
    }

    pub fn get_chains(&self, profile_id: i64) -> Result<Vec<ChainRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,profile_id,name,description,bonus_gold,bonus_xp,completed,created_at FROM quest_chains WHERE profile_id=?1 ORDER BY created_at DESC")?;
        let rows = stmt.query_map(params![profile_id], |r| Ok(ChainRow {
            id:r.get(0)?,profile_id:r.get(1)?,name:r.get(2)?,description:r.get(3)?,
            bonus_gold:r.get(4)?,bonus_xp:r.get(5)?,completed:r.get::<_,i32>(6)?!=0,created_at:r.get(7)?,
        }))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn set_quest_chain(&self, quest_id: i64, chain_id: Option<i64>, chain_order: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET chain_id=?1, chain_order=?2 WHERE id=?3", params![chain_id, chain_order, quest_id])?;
        Ok(())
    }

    pub fn delete_chain(&self, chain_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET chain_id=NULL, chain_order=0 WHERE chain_id=?1", params![chain_id])?;
        conn.execute("DELETE FROM quest_chains WHERE id=?1", params![chain_id])?;
        Ok(())
    }

    pub fn reschedule_quest(&self, quest_id: i64, new_due_date: &str) -> Result<QuestRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET due_date=?1 WHERE id=?2", params![new_due_date, quest_id])?;
        conn.query_row(&format!("SELECT {} FROM quests WHERE id=?1", Self::QC), params![quest_id], Self::map_quest)
    }

    pub fn set_quest_dependency(&self, quest_id: i64, blocked_by: Option<i64>) -> Result<QuestRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET blocked_by_quest_id=?1 WHERE id=?2", params![blocked_by, quest_id])?;
        conn.query_row(&format!("SELECT {} FROM quests WHERE id=?1", Self::QC), params![quest_id], Self::map_quest)
    }

    pub fn toggle_recurring(&self, quest_id: i64) -> Result<QuestRow> {
        let conn = self.conn.lock().unwrap();
        let cur: i32 = conn.query_row("SELECT is_recurring FROM quests WHERE id=?1", params![quest_id], |r| r.get(0))?;
        conn.execute("UPDATE quests SET is_recurring=?1 WHERE id=?2", params![1 - cur, quest_id])?;
        conn.query_row(&format!("SELECT {} FROM quests WHERE id=?1", Self::QC), params![quest_id], Self::map_quest)
    }

    pub fn update_recurrence_pattern(&self, quest_id: i64, pattern: &str) -> Result<QuestRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET recurrence_pattern=?1 WHERE id=?2", params![pattern, quest_id])?;
        conn.query_row(&format!("SELECT {} FROM quests WHERE id=?1", Self::QC), params![quest_id], Self::map_quest)
    }

    pub fn set_skill_target(&self, skill_id: i64, target_level: Option<i64>) -> Result<SkillRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE skills SET target_level=?1 WHERE id=?2", params![target_level, skill_id])?;
        Self::read_skill(&conn, skill_id)
    }

    // ═══════════════════════════════════════════════════
    //  DAILY CHALLENGES
    // ═══════════════════════════════════════════════════

    pub fn generate_daily_challenges(&self, profile_id: i64) -> Result<Vec<ChallengeRow>> {
        let conn = self.conn.lock().unwrap();
        let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let existing: i64 = conn.query_row("SELECT COUNT(*) FROM daily_challenges WHERE profile_id=?1 AND date=?2", params![profile_id, today], |r| r.get(0))?;
        if existing > 0 {
            return Self::read_challenges(&conn, profile_id, &today);
        }
        conn.execute("DELETE FROM daily_challenges WHERE profile_id=?1 AND date<?2", params![profile_id, today])?;
        let challenges = vec![
            ("complete_quests", "Complete 3 quests", 3i64, 15i64, 15i64),
            ("earn_xp", "Earn 50 XP", 50i64, 20i64, 20i64),
            ("complete_hard", "Complete a Hard or Epic quest", 1i64, 25i64, 25i64),
        ];
        for (ctype, desc, target, gold, xp) in &challenges {
            conn.execute("INSERT INTO daily_challenges (profile_id,challenge_type,description,target,reward_gold,reward_xp,date) VALUES (?1,?2,?3,?4,?5,?6,?7)",
                params![profile_id, ctype, desc, target, gold, xp, today])?;
        }
        Self::read_challenges(&conn, profile_id, &today)
    }

    fn read_challenges(conn: &Connection, profile_id: i64, date: &str) -> Result<Vec<ChallengeRow>> {
        let mut stmt = conn.prepare("SELECT id,profile_id,challenge_type,description,target,progress,reward_gold,reward_xp,date,completed FROM daily_challenges WHERE profile_id=?1 AND date=?2")?;
        let rows = stmt.query_map(params![profile_id, date], |r| Ok(ChallengeRow {
            id:r.get(0)?,profile_id:r.get(1)?,challenge_type:r.get(2)?,description:r.get(3)?,
            target:r.get(4)?,progress:r.get(5)?,reward_gold:r.get(6)?,reward_xp:r.get(7)?,
            date:r.get(8)?,completed:r.get::<_,i32>(9)?!=0,
        }))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn get_daily_challenges_list(&self, profile_id: i64) -> Result<Vec<ChallengeRow>> {
        let conn = self.conn.lock().unwrap();
        let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        Self::read_challenges(&conn, profile_id, &today)
    }

    // ═══════════════════════════════════════════════════
    //  HABITS
    // ═══════════════════════════════════════════════════

    pub fn create_habit(&self, profile_id: i64, name: &str, icon: &str, skill_id: Option<i64>, xp_per_check: i64) -> Result<HabitRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("INSERT INTO habits (profile_id,name,icon,skill_id,xp_per_check) VALUES (?1,?2,?3,?4,?5)", params![profile_id,name,icon,skill_id,xp_per_check])?;
        let id = conn.last_insert_rowid();
        conn.query_row("SELECT id,profile_id,name,icon,skill_id,xp_per_check,is_active,created_at FROM habits WHERE id=?1", params![id], |r| Ok(HabitRow {
            id:r.get(0)?,profile_id:r.get(1)?,name:r.get(2)?,icon:r.get(3)?,
            skill_id:r.get(4)?,xp_per_check:r.get(5)?,is_active:r.get::<_,i32>(6)?!=0,created_at:r.get(7)?,
        }))
    }

    pub fn get_habits(&self, profile_id: i64) -> Result<Vec<HabitRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,profile_id,name,icon,skill_id,xp_per_check,is_active,created_at FROM habits WHERE profile_id=?1 AND is_active=1 ORDER BY created_at")?;
        let rows = stmt.query_map(params![profile_id], |r| Ok(HabitRow {
            id:r.get(0)?,profile_id:r.get(1)?,name:r.get(2)?,icon:r.get(3)?,
            skill_id:r.get(4)?,xp_per_check:r.get(5)?,is_active:r.get::<_,i32>(6)?!=0,created_at:r.get(7)?,
        }))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn update_habit(&self, habit_id: i64, name: &str, icon: &str, xp_per_check: i64, skill_id: Option<i64>) -> Result<HabitRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE habits SET name=?1, icon=?2, xp_per_check=?3, skill_id=?4 WHERE id=?5",
            params![name, icon, xp_per_check, skill_id, habit_id])?;
        conn.query_row("SELECT id,profile_id,name,icon,skill_id,xp_per_check,is_active,created_at FROM habits WHERE id=?1",
            params![habit_id], |r| Ok(HabitRow {
                id:r.get(0)?,profile_id:r.get(1)?,name:r.get(2)?,icon:r.get(3)?,
                skill_id:r.get(4)?,xp_per_check:r.get(5)?,is_active:r.get::<_,i32>(6)?!=0,created_at:r.get(7)?,
            }))
    }

    pub fn delete_habit(&self, habit_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM habit_entries WHERE habit_id=?1", params![habit_id])?;
        conn.execute("DELETE FROM habits WHERE id=?1", params![habit_id])?;
        Ok(())
    }

    pub fn check_habit(&self, profile_id: i64, habit_id: i64) -> Result<StatsRow> {
        let conn = self.conn.lock().unwrap();
        let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let (skill_id, xp): (Option<i64>, i64) = conn.query_row("SELECT skill_id,xp_per_check FROM habits WHERE id=?1 AND profile_id=?2", params![habit_id, profile_id], |r| Ok((r.get(0)?,r.get(1)?)))?;
        let inserted = conn.execute("INSERT OR IGNORE INTO habit_entries (habit_id,date) VALUES (?1,?2)", params![habit_id, today])?;
        if inserted > 0 {
            conn.execute("UPDATE user_stats SET total_xp=total_xp+?1 WHERE profile_id=?2", params![xp, profile_id])?;
            if let Some(sid) = skill_id {
                conn.execute("UPDATE skills SET current_xp=current_xp+?1 WHERE id=?2", params![xp, sid])?;
                let sxp: i64 = conn.query_row("SELECT current_xp FROM skills WHERE id=?1", params![sid], |r| r.get(0))?;
                let lvl = calculate_level_from_xp(sxp as u64).0 as i64;
                conn.execute("UPDATE skills SET level=?1 WHERE id=?2", params![lvl, sid])?;
            }
            let total_xp: i64 = conn.query_row("SELECT total_xp FROM user_stats WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
            let gl = calculate_level_from_xp(total_xp as u64).0 as i64;
            conn.execute("UPDATE user_stats SET current_level=?1 WHERE profile_id=?2", params![gl, profile_id])?;
            conn.execute("INSERT INTO activity_log (profile_id,skill_id,event_type,detail,xp_delta) VALUES (?1,?2,'habit_check','Habit completed',?3)", params![profile_id, skill_id, xp])?;
        }
        Self::read_stats(&conn, profile_id)
    }

    pub fn get_habit_entries(&self, habit_id: i64, from: &str, to: &str) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT date FROM habit_entries WHERE habit_id=?1 AND date>=?2 AND date<=?3 ORDER BY date")?;
        let rows = stmt.query_map(params![habit_id, from, to], |r| r.get(0))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    // ═══════════════════════════════════════════════════
    //  PRESTIGE
    // ═══════════════════════════════════════════════════

    pub fn prestige_skill(&self, profile_id: i64, skill_id: i64) -> Result<SkillRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN")?;
        match (|| -> Result<SkillRow> {
            let level: i64 = conn.query_row("SELECT level FROM skills WHERE id=?1 AND profile_id=?2", params![skill_id, profile_id], |r| r.get(0))?;
            if level < 20 { return Err(rusqlite::Error::InvalidParameterName("Skill must be level 20+ to prestige".into())); }
            conn.execute("UPDATE skills SET current_xp=0, level=1, prestige_count=prestige_count+1 WHERE id=?1", params![skill_id])?;
            conn.execute("UPDATE user_stats SET max_hp=MIN(250,max_hp+5) WHERE profile_id=?1", params![profile_id])?;
            conn.execute("INSERT INTO activity_log (profile_id,skill_id,event_type,detail,xp_delta) VALUES (?1,?2,'prestige','Skill prestiged! +5 max HP',0)", params![profile_id, skill_id])?;
            Self::read_skill(&conn, skill_id)
        })() {
            Ok(result) => { conn.execute_batch("COMMIT")?; Ok(result) }
            Err(e) => { conn.execute_batch("ROLLBACK").ok(); Err(e) }
        }
    }

    // ═══════════════════════════════════════════════════
    //  EQUIPMENT
    // ═══════════════════════════════════════════════════

    fn equipment_defs() -> Vec<(&'static str,&'static str,&'static str,&'static str,&'static str,&'static str,&'static str,f64)> {
        vec![
            ("scholars_ring","Scholar's Ring","+10% XP for INT skills","💍","rare","xp_1000","xp_category_INT",1.1),
            ("warriors_gauntlet","Warrior's Gauntlet","+10% XP for STR skills","🥊","rare","quest_100","xp_category_STR",1.1),
            ("artisans_hammer","Artisan's Hammer","+10% XP for CRAFT skills","🔨","rare","streak_7","xp_category_CRAFT",1.1),
            ("healers_charm","Healer's Charm","+1 HP per quest","💎","epic","quest_500","hp_regen",1.0),
            ("merchants_pouch","Merchant's Pouch","+2 gold per quest","👛","rare","gold_1000","gold_flat",2.0),
            ("phoenix_feather","Phoenix Feather","Reduce burnout penalty to 25%","🪶","legendary","streak_30","burnout_reduce",0.75),
            ("speedrunners_boots","Speedrunner's Boots","+5% XP all skills","👟","common","quest_10","xp_all",1.05),
        ]
    }

    pub fn get_equipment_defs(&self, profile_id: i64) -> Result<Vec<EquipmentDef>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt_u = conn.prepare("SELECT key FROM achievements WHERE profile_id=?1")?;
        let unlocked: Vec<String> = stmt_u.query_map(params![profile_id], |r| r.get(0))?.collect::<Result<Vec<_>,_>>()?;
        let mut stmt_e = conn.prepare("SELECT item_key FROM equipped_items WHERE profile_id=?1")?;
        let equipped: Vec<String> = stmt_e.query_map(params![profile_id], |r| r.get(0))?.collect::<Result<Vec<_>,_>>()?;
        let defs = Self::equipment_defs();
        Ok(defs.iter().map(|(k,n,d,i,r,ua,et,ev)| EquipmentDef {
            key:k.to_string(),name:n.to_string(),description:d.to_string(),icon:i.to_string(),
            rarity:r.to_string(),unlock_achievement:ua.to_string(),effect_type:et.to_string(),effect_value:*ev,
            unlocked:unlocked.contains(&ua.to_string()),equipped:equipped.contains(&k.to_string()),
        }).collect())
    }

    pub fn equip_item(&self, profile_id: i64, item_key: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let defs = Self::equipment_defs();
        let def = defs.iter().find(|d| d.0 == item_key)
            .ok_or_else(|| rusqlite::Error::InvalidParameterName("Unknown equipment item".into()))?;
        let required_achievement = def.5;
        let unlocked: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM achievements WHERE profile_id=?1 AND key=?2",
            params![profile_id, required_achievement], |r| r.get(0))?;
        if !unlocked { return Err(rusqlite::Error::InvalidParameterName("Item not unlocked yet".into())); }
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM equipped_items WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
        if count >= 3 { return Err(rusqlite::Error::InvalidParameterName("Max 3 equipped items".into())); }
        conn.execute("INSERT OR IGNORE INTO equipped_items (profile_id,item_key) VALUES (?1,?2)", params![profile_id, item_key])?;
        Ok(())
    }

    pub fn unequip_item(&self, profile_id: i64, item_key: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM equipped_items WHERE profile_id=?1 AND item_key=?2", params![profile_id, item_key])?;
        Ok(())
    }

    // ═══════════════════════════════════════════════════
    //  WEEKLY BOSS
    // ═══════════════════════════════════════════════════

    pub fn check_weekly_boss(&self, profile_id: i64) -> Result<Option<i64>> {
        let conn = self.conn.lock().unwrap();
        let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let (boss_id, boss_date): (Option<i64>, Option<String>) = conn.query_row(
            "SELECT weekly_boss_quest_id, weekly_boss_date FROM user_stats WHERE profile_id=?1",
            params![profile_id], |r| Ok((r.get(0)?, r.get(1)?)))?;
        if let Some(ref bd) = boss_date {
            if days_between(bd, &today) < 7 { return Ok(boss_id); }
        }
        let weakest_skill: Option<(i64, String)> = conn.query_row(
            "SELECT id, name FROM skills WHERE profile_id=?1 AND parent_skill_id IS NOT NULL ORDER BY level ASC, current_xp ASC LIMIT 1",
            params![profile_id], |r| Ok((r.get(0)?, r.get(1)?))).ok();
        if let Some((sid, sname)) = weakest_skill {
            let boss_name = format!("Weekly Boss: Master {}", sname);
            let boss_xp = Self::base_xp_for_quest_type("weekly");
            conn.execute("INSERT INTO quests (profile_id,quest_name,description,quest_type,skill_id,xp_reward,difficulty,priority,is_boss) VALUES (?1,?2,'Defeat this weekly boss for 3× rewards!','weekly',?3,?4,'epic','urgent',1)",
                params![profile_id, boss_name, sid, boss_xp])?;
            let new_id = conn.last_insert_rowid();
            conn.execute("UPDATE user_stats SET weekly_boss_quest_id=?1, weekly_boss_date=?2 WHERE profile_id=?3", params![new_id, today, profile_id])?;
            Ok(Some(new_id))
        } else {
            Ok(None)
        }
    }

    // ═══════════════════════════════════════════════════
    //  JOURNAL
    // ═══════════════════════════════════════════════════

    pub fn create_journal_entry(&self, profile_id: i64, content: &str, mood: Option<&str>) -> Result<JournalEntryRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("INSERT INTO journal_entries (profile_id,content,mood) VALUES (?1,?2,?3)", params![profile_id, content, mood])?;
        let id = conn.last_insert_rowid();
        conn.execute("UPDATE user_stats SET total_xp=total_xp+5 WHERE profile_id=?1", params![profile_id])?;
        let total_xp: i64 = conn.query_row("SELECT total_xp FROM user_stats WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
        let gl = calculate_level_from_xp(total_xp as u64).0 as i64;
        conn.execute("UPDATE user_stats SET current_level=?1 WHERE profile_id=?2", params![gl, profile_id])?;
        conn.execute("INSERT INTO activity_log (profile_id,event_type,detail,xp_delta) VALUES (?1,'journal','Journal entry',5)", params![profile_id])?;
        conn.query_row("SELECT id,profile_id,content,mood,xp_granted,created_at FROM journal_entries WHERE id=?1", params![id], |r| Ok(JournalEntryRow {
            id:r.get(0)?,profile_id:r.get(1)?,content:r.get(2)?,mood:r.get(3)?,xp_granted:r.get(4)?,created_at:r.get(5)?,
        }))
    }

    pub fn get_journal_entries(&self, profile_id: i64, limit: i64) -> Result<Vec<JournalEntryRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,profile_id,content,mood,xp_granted,created_at FROM journal_entries WHERE profile_id=?1 ORDER BY created_at DESC LIMIT ?2")?;
        let rows = stmt.query_map(params![profile_id, limit], |r| Ok(JournalEntryRow {
            id:r.get(0)?,profile_id:r.get(1)?,content:r.get(2)?,mood:r.get(3)?,xp_granted:r.get(4)?,created_at:r.get(5)?,
        }))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn update_journal_entry(&self, entry_id: i64, content: &str, mood: Option<&str>) -> Result<JournalEntryRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE journal_entries SET content=?1, mood=?2 WHERE id=?3",
            params![content, mood, entry_id])?;
        conn.query_row("SELECT id,profile_id,content,mood,xp_granted,created_at FROM journal_entries WHERE id=?1",
            params![entry_id], |r| Ok(JournalEntryRow {
                id:r.get(0)?,profile_id:r.get(1)?,content:r.get(2)?,mood:r.get(3)?,xp_granted:r.get(4)?,created_at:r.get(5)?,
            }))
    }

    pub fn delete_journal_entry(&self, entry_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM journal_entries WHERE id=?1", params![entry_id])?;
        Ok(())
    }

    // ═══════════════════════════════════════════════════
    //  TEMPLATE SCHEDULING
    // ═══════════════════════════════════════════════════

    pub fn update_template_schedule(&self, template_id: i64, pattern: Option<&str>, active: bool) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quest_templates SET schedule_pattern=?1, schedule_active=?2 WHERE id=?3",
            params![pattern, active as i32, template_id])?;
        Ok(())
    }

    pub fn check_template_schedules(&self, profile_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN")?;
        match (|| -> Result<()> {
            let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
            let weekday = chrono::Utc::now().format("%A").to_string().to_lowercase();
            let mut stmt_t = conn.prepare("SELECT id,template_name,quest_name,description,skill_id,xp_reward,difficulty,priority,is_boss,schedule_pattern FROM quest_templates WHERE profile_id=?1 AND schedule_active=1 AND schedule_pattern IS NOT NULL")?;
            let templates: Vec<(i64, String, String, String, Option<i64>, i64, String, String, bool, String)> = stmt_t.query_map(params![profile_id], |r| Ok((
                r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?,r.get(5)?,r.get(6)?,r.get(7)?,r.get::<_,i32>(8)?!=0,r.get(9)?,
            )))?.collect::<Result<Vec<_>,_>>()?;
            for (_, _, qname, desc, skill_id, _xp, diff, pri, boss, pattern) in &templates {
                let should_create = match pattern.as_str() {
                    "daily" => true,
                    "weekly" => weekday == "monday",
                    "monthly" => today.len() >= 10 && &today[8..10] == "01",
                    p if p.starts_with("on_") => p[3..].split(',').any(|d| d.trim() == weekday),
                    _ => false,
                };
                if should_create {
                    let resolved_skill = skill_id.or_else(|| {
                        conn.query_row("SELECT default_skill_id FROM profiles WHERE id=?1", params![profile_id], |r| r.get(0)).ok().flatten()
                    });
                    if let Some(sid) = resolved_skill {
                        let existing: i64 = conn.query_row("SELECT COUNT(*) FROM quests WHERE profile_id=?1 AND quest_name=?2 AND completed=0 AND failed=0 AND DATE(created_at)=date(?3)",
                            params![profile_id, qname, today], |r| r.get(0))?;
                        if existing == 0 {
                            let sched_xp = Self::base_xp_for_quest_type("daily");
                            conn.execute("INSERT INTO quests (profile_id,quest_name,description,quest_type,skill_id,xp_reward,difficulty,priority,is_boss) VALUES (?1,?2,?3,'daily',?4,?5,?6,?7,?8)",
                                params![profile_id, qname, desc, sid, sched_xp, diff, pri, *boss as i32])?;
                        }
                    }
                }
            }
            Ok(())
        })() {
            Ok(()) => { conn.execute_batch("COMMIT")?; Ok(()) }
            Err(e) => { conn.execute_batch("ROLLBACK").ok(); Err(e) }
        }
    }

    // ═══════════════════════════════════════════════════
    //  SKILL DECAY
    // ═══════════════════════════════════════════════════

    pub fn apply_skill_decay(&self, profile_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN")?;
        match (|| -> Result<()> {
            let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
            let mut stmt_d = conn.prepare("SELECT id, last_xp_date FROM skills WHERE profile_id=?1 AND parent_skill_id IS NOT NULL AND last_xp_date IS NOT NULL AND current_xp > 0")?;
            let decayable: Vec<(i64, String)> = stmt_d.query_map(params![profile_id], |r| Ok((r.get(0)?, r.get(1)?)))?.collect::<Result<Vec<_>,_>>()?;
            for (sid, last_date) in &decayable {
                let days_inactive = days_between(last_date, &today);
                if days_inactive > 7 {
                    let decay = ((days_inactive - 7) as i64).min(10);
                    if decay > 0 {
                        conn.execute("UPDATE skills SET current_xp=MAX(0,current_xp-?1) WHERE id=?2", params![decay, sid])?;
                        let sxp: i64 = conn.query_row("SELECT current_xp FROM skills WHERE id=?1", params![sid], |r| r.get(0))?;
                        let lvl = calculate_level_from_xp(sxp as u64).0 as i64;
                        conn.execute("UPDATE skills SET level=?1 WHERE id=?2", params![lvl, sid])?;
                    }
                }
            }
            Ok(())
        })() {
            Ok(()) => { conn.execute_batch("COMMIT")?; Ok(()) }
            Err(e) => { conn.execute_batch("ROLLBACK").ok(); Err(e) }
        }
    }

    // ═══════════════════════════════════════════════════
    //  SUB-TASKS
    // ═══════════════════════════════════════════════════

    pub fn get_sub_tasks(&self, quest_id: i64) -> Result<Vec<SubTaskRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,quest_id,title,completed,sort_order FROM sub_tasks WHERE quest_id=?1 ORDER BY sort_order")?;
        let rows = stmt.query_map(params![quest_id], |r| Ok(SubTaskRow {
            id:r.get(0)?,quest_id:r.get(1)?,title:r.get(2)?,completed:r.get::<_,i32>(3)?!=0,sort_order:r.get(4)?,
        }))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn create_sub_task(&self, quest_id: i64, title: &str) -> Result<SubTaskRow> {
        let conn = self.conn.lock().unwrap();
        let ms: i64 = conn.query_row("SELECT COALESCE(MAX(sort_order),0) FROM sub_tasks WHERE quest_id=?1", params![quest_id], |r| r.get(0))?;
        conn.execute("INSERT INTO sub_tasks (quest_id,title,sort_order) VALUES (?1,?2,?3)", params![quest_id,title,ms+1])?;
        let id = conn.last_insert_rowid();
        conn.query_row("SELECT id,quest_id,title,completed,sort_order FROM sub_tasks WHERE id=?1", params![id], |r| Ok(SubTaskRow {
            id:r.get(0)?,quest_id:r.get(1)?,title:r.get(2)?,completed:r.get::<_,i32>(3)?!=0,sort_order:r.get(4)?,
        }))
    }

    pub fn toggle_sub_task(&self, profile_id: i64, sub_task_id: i64) -> Result<SubTaskToggleResult> {
        let conn = self.conn.lock().unwrap();
        let (quest_id, cur): (i64, i32) = conn.query_row("SELECT quest_id,completed FROM sub_tasks WHERE id=?1", params![sub_task_id], |r| Ok((r.get(0)?,r.get(1)?)))?;
        conn.execute("UPDATE sub_tasks SET completed=?1 WHERE id=?2", params![1-cur,sub_task_id])?;

        let total: i64 = conn.query_row("SELECT COUNT(*) FROM sub_tasks WHERE quest_id=?1", params![quest_id], |r| r.get(0))?;
        let done: i64 = conn.query_row("SELECT COUNT(*) FROM sub_tasks WHERE quest_id=?1 AND completed=1", params![quest_id], |r| r.get(0))?;

        let mut auto_completed = false;
        if done == total && total > 0 {
            let already: i32 = conn.query_row("SELECT completed FROM quests WHERE id=?1", params![quest_id], |r| r.get(0))?;
            if already == 0 {
                auto_completed = true;
            }
        }

        // Grant proportional XP when sub-task completed
        if cur == 0 && total > 0 {
            let (xp_reward, skill_id): (i64, i64) = conn.query_row("SELECT xp_reward,skill_id FROM quests WHERE id=?1", params![quest_id], |r| Ok((r.get(0)?,r.get(1)?)))?;
            let partial_xp = xp_reward / total;
            if partial_xp > 0 {
                conn.execute("UPDATE skills SET current_xp=MAX(0,current_xp+?1) WHERE id=?2", params![partial_xp,skill_id])?;
                let skill_xp: i64 = conn.query_row("SELECT current_xp FROM skills WHERE id=?1", params![skill_id], |r| r.get(0))?;
                let lvl = calculate_level_from_xp(skill_xp as u64).0 as i64;
                conn.execute("UPDATE skills SET level=?1 WHERE id=?2", params![lvl,skill_id])?;
                conn.execute("UPDATE user_stats SET total_xp=MAX(0,total_xp+?1) WHERE profile_id=?2", params![partial_xp,profile_id])?;
            }
        }

        Ok(SubTaskToggleResult { quest_id, auto_completed, completed: done, total })
    }

    pub fn delete_sub_task(&self, sub_task_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM sub_tasks WHERE id=?1", params![sub_task_id])?;
        Ok(())
    }

    // ═══════════════════════════════════════════════════
    //  TAGS
    // ═══════════════════════════════════════════════════

    pub fn add_tag_to_quest(&self, quest_id: i64, tag_name: &str) -> Result<TagRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("INSERT OR IGNORE INTO tags (name) VALUES (?1)", params![tag_name])?;
        let tag_id: i64 = conn.query_row("SELECT id FROM tags WHERE name=?1", params![tag_name], |r| r.get(0))?;
        conn.execute("INSERT OR IGNORE INTO quest_tags (quest_id,tag_id) VALUES (?1,?2)", params![quest_id,tag_id])?;
        Ok(TagRow { id: tag_id, name: tag_name.to_string() })
    }

    pub fn remove_tag_from_quest(&self, quest_id: i64, tag_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM quest_tags WHERE quest_id=?1 AND tag_id=?2", params![quest_id,tag_id])?;
        Ok(())
    }

    pub fn get_tags_for_quest(&self, quest_id: i64) -> Result<Vec<TagRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT t.id,t.name FROM tags t INNER JOIN quest_tags qt ON qt.tag_id=t.id WHERE qt.quest_id=?1 ORDER BY t.name")?;
        let rows = stmt.query_map(params![quest_id], |r| Ok(TagRow{id:r.get(0)?,name:r.get(1)?}))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn get_all_tags(&self, profile_id: i64) -> Result<Vec<TagRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT DISTINCT t.id,t.name FROM tags t INNER JOIN quest_tags qt ON qt.tag_id=t.id INNER JOIN quests q ON q.id=qt.quest_id WHERE q.profile_id=?1 ORDER BY t.name")?;
        let rows = stmt.query_map(params![profile_id], |r| Ok(TagRow{id:r.get(0)?,name:r.get(1)?}))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    // ═══════════════════════════════════════════════════
    //  TEMPLATES
    // ═══════════════════════════════════════════════════

    pub fn create_template(&self, profile_id: i64, tname: &str, qname: &str, desc: &str, qtype: &str, skill_id: Option<i64>, xp: i64, diff: &str, pri: &str, boss: bool) -> Result<TemplateRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("INSERT INTO quest_templates (profile_id,template_name,quest_name,description,quest_type,skill_id,xp_reward,difficulty,priority,is_boss) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
            params![profile_id,tname,qname,desc,qtype,skill_id,xp,diff,pri,boss as i32])?;
        let id = conn.last_insert_rowid();
        Self::read_template(&conn, id)
    }

    pub fn get_templates(&self, profile_id: i64) -> Result<Vec<TemplateRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,profile_id,template_name,quest_name,description,quest_type,skill_id,xp_reward,difficulty,priority,is_boss,schedule_pattern,schedule_active FROM quest_templates WHERE profile_id=?1 ORDER BY template_name")?;
        let rows = stmt.query_map(params![profile_id], Self::map_template)?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn delete_template(&self, template_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM template_sub_tasks WHERE template_id=?1", params![template_id])?;
        conn.execute("DELETE FROM quest_templates WHERE id=?1", params![template_id])?;
        Ok(())
    }

    pub fn create_quest_from_template(&self, profile_id: i64, template_id: i64) -> Result<QuestRow> {
        let conn = self.conn.lock().unwrap();
        let t = Self::read_template(&conn, template_id)?;
        let skill_id: Option<i64> = match t.skill_id {
            Some(sid) => Some(sid),
            None => conn.query_row(
                "SELECT default_skill_id FROM profiles WHERE id=?1", params![profile_id], |r| r.get(0))?,
        };
        let tmpl_xp = Self::base_xp_for_quest_type(&t.quest_type);
        conn.execute("INSERT INTO quests (profile_id,quest_name,description,quest_type,skill_id,xp_reward,difficulty,priority,is_boss) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            params![profile_id,t.quest_name,t.description,t.quest_type,skill_id,tmpl_xp,t.difficulty,t.priority,t.is_boss as i32])?;
        let qid = conn.last_insert_rowid();
        let mut stmt = conn.prepare("SELECT title,sort_order FROM template_sub_tasks WHERE template_id=?1 ORDER BY sort_order")?;
        let subs: Vec<(String,i64)> = stmt.query_map(params![template_id], |r| Ok((r.get(0)?,r.get(1)?)))?.collect::<Result<Vec<_>,_>>()?;
        for (title,so) in subs {
            conn.execute("INSERT INTO sub_tasks (quest_id,title,sort_order) VALUES (?1,?2,?3)", params![qid,title,so])?;
        }
        conn.query_row(&format!("SELECT {} FROM quests WHERE id=?1", Self::QC), params![qid], Self::map_quest)
    }

    fn read_template(conn: &Connection, id: i64) -> Result<TemplateRow> {
        conn.query_row("SELECT id,profile_id,template_name,quest_name,description,quest_type,skill_id,xp_reward,difficulty,priority,is_boss,schedule_pattern,schedule_active FROM quest_templates WHERE id=?1", params![id], Self::map_template)
    }

    fn map_template(r: &rusqlite::Row) -> rusqlite::Result<TemplateRow> {
        Ok(TemplateRow { id:r.get(0)?,profile_id:r.get(1)?,template_name:r.get(2)?,quest_name:r.get(3)?,
            description:r.get(4)?,quest_type:r.get(5)?,skill_id:r.get(6)?,xp_reward:r.get(7)?,
            difficulty:r.get(8)?,priority:r.get(9)?,is_boss:r.get::<_,i32>(10)?!=0,
            schedule_pattern:r.get(11)?,schedule_active:r.get::<_,i32>(12)?!=0 })
    }

    // ═══════════════════════════════════════════════════
    //  SHOP
    // ═══════════════════════════════════════════════════

    pub fn purchase_item(&self, profile_id: i64, item_key: &str) -> Result<StatsRow> {
        let conn = self.conn.lock().unwrap();
        let (cost, effect): (i64, &str) = match item_key {
            "hp_potion_small" => (30,"hp_25"), "hp_potion_large" => (60,"hp_50"),
            "hp_potion_full" => (100,"hp_full"), "streak_freeze" => (50,"freeze"),
            "xp_boost" => (80,"boost"), "max_hp_upgrade" => (150,"max_hp"),
            "skill_focus_1h" => (25,"skill_focus"), "skill_surge_1d" => (60,"skill_surge"),
            "theme_forest"|"theme_ocean"|"theme_inferno"|"theme_royal" => (200,"theme"),
            _ => return Err(rusqlite::Error::InvalidParameterName("Unknown item".into())),
        };
        let gold: i64 = conn.query_row("SELECT gold FROM user_stats WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
        if gold < cost { return Err(rusqlite::Error::InvalidParameterName("Not enough gold".into())); }
        if effect == "theme" {
            let already_owned: i64 = conn.query_row(
                "SELECT COUNT(*) FROM purchases WHERE profile_id=?1 AND item_key=?2",
                params![profile_id, item_key], |r| r.get(0))?;
            if already_owned > 0 {
                return Err(rusqlite::Error::InvalidParameterName("Already owned".into()));
            }
        }
        conn.execute("UPDATE user_stats SET gold=gold-?1 WHERE profile_id=?2", params![cost,profile_id])?;
        match effect {
            "hp_25" => { conn.execute("UPDATE user_stats SET hp=MIN(max_hp,hp+25) WHERE profile_id=?1", params![profile_id])?; },
            "hp_50" => { conn.execute("UPDATE user_stats SET hp=MIN(max_hp,hp+50) WHERE profile_id=?1", params![profile_id])?; },
            "hp_full" => { conn.execute("UPDATE user_stats SET hp=max_hp WHERE profile_id=?1", params![profile_id])?; },
            "freeze" => { conn.execute("UPDATE user_stats SET streak_freeze_count=streak_freeze_count+1 WHERE profile_id=?1", params![profile_id])?; },
            "boost" => { conn.execute("UPDATE user_stats SET xp_boost_remaining=xp_boost_remaining+5 WHERE profile_id=?1", params![profile_id])?; },
            "max_hp" => { conn.execute("UPDATE user_stats SET max_hp=MIN(200,max_hp+10) WHERE profile_id=?1", params![profile_id])?; },
            "theme" => { conn.execute("UPDATE profiles SET active_theme=?1 WHERE id=?2", params![item_key.strip_prefix("theme_").unwrap_or("default"),profile_id])?; },
            "skill_focus" | "skill_surge" => { /* Purchased — activation handled via separate activate_skill_boost command */ },
            _ => {}
        }
        conn.execute("INSERT INTO purchases (profile_id,item_key) VALUES (?1,?2)", params![profile_id,item_key])?;
        conn.execute("INSERT INTO activity_log (profile_id,event_type,detail) VALUES (?1,'purchase',?2)", params![profile_id,format!("Purchased {}",item_key)])?;
        Self::read_stats(&conn, profile_id)
    }

    pub fn get_owned_items(&self, profile_id: i64) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT DISTINCT item_key FROM purchases WHERE profile_id=?1")?;
        let rows = stmt.query_map(params![profile_id], |r| r.get(0))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    // ═══════════════════════════════════════════════════
    //  POMODORO & TIME TRACKING
    // ═══════════════════════════════════════════════════

    pub fn complete_pomodoro(&self, profile_id: i64, quest_id: i64) -> Result<StatsRow> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET pomodoro_count=pomodoro_count+1 WHERE id=?1 AND profile_id=?2", params![quest_id, profile_id])?;
        let skill_id: i64 = conn.query_row("SELECT skill_id FROM quests WHERE id=?1 AND profile_id=?2", params![quest_id, profile_id], |r| r.get(0))?;
        conn.execute("UPDATE skills SET current_xp=current_xp+5 WHERE id=?1", params![skill_id])?;
        let skill_xp: i64 = conn.query_row("SELECT current_xp FROM skills WHERE id=?1", params![skill_id], |r| r.get(0))?;
        let lvl = calculate_level_from_xp(skill_xp as u64).0 as i64;
        conn.execute("UPDATE skills SET level=?1 WHERE id=?2", params![lvl,skill_id])?;
        conn.execute("UPDATE user_stats SET total_xp=total_xp+5 WHERE profile_id=?1", params![profile_id])?;
        let total_xp: i64 = conn.query_row("SELECT total_xp FROM user_stats WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
        let gl = calculate_level_from_xp(total_xp as u64).0 as i64;
        conn.execute("UPDATE user_stats SET current_level=?1 WHERE profile_id=?2", params![gl,profile_id])?;
        conn.execute("INSERT INTO activity_log (profile_id,skill_id,event_type,detail,xp_delta) VALUES (?1,?2,'pomodoro','Pomodoro completed',5)", params![profile_id,skill_id])?;
        Self::read_stats(&conn, profile_id)
    }

    pub fn add_time_to_quest(&self, quest_id: i64, seconds: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE quests SET time_spent_seconds=time_spent_seconds+?1 WHERE id=?2", params![seconds,quest_id])?;
        Ok(())
    }

    // ═══════════════════════════════════════════════════
    //  RECURRING QUESTS
    // ═══════════════════════════════════════════════════

    pub fn check_recurring_quests(&self, profile_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let mut stmt = conn.prepare(&format!("SELECT {} FROM quests WHERE profile_id=?1 AND is_recurring=1 AND completed=1 AND recurrence_pattern IS NOT NULL", Self::QC))?;
        let quests: Vec<QuestRow> = stmt.query_map(params![profile_id], Self::map_quest)?.collect::<Result<Vec<_>,_>>()?;
        for q in &quests {
            let should = match (q.recurrence_pattern.as_deref(), q.completed_at.as_deref()) {
                (Some("daily"), Some(c)) => c.get(..10).map_or(false, |d| d < &today[..10]),
                (Some("weekly"), Some(c)) => c.get(..10).map_or(false, |d| days_between(d, &today) >= 7),
                (Some("monthly"), Some(c)) => c.get(..7).map_or(false, |d| d != &today[..7]),
                _ => false,
            };
            if should {
                let existing: i64 = conn.query_row("SELECT COUNT(*) FROM quests WHERE parent_quest_id=?1 AND completed=0 AND failed=0", params![q.id], |r| r.get(0))?;
                if existing == 0 {
                    let recur_xp = Self::base_xp_for_quest_type(&q.quest_type);
                    conn.execute("INSERT INTO quests (profile_id,quest_name,description,quest_type,skill_id,xp_reward,is_recurring,recurrence_pattern,parent_quest_id,difficulty,priority,is_boss) VALUES (?1,?2,?3,?4,?5,?6,1,?7,?8,?9,?10,?11)",
                        params![profile_id,q.quest_name,q.description,q.quest_type,q.skill_id,recur_xp,q.recurrence_pattern,q.id,q.difficulty,q.priority,q.is_boss as i32])?;
                }
            }
        }
        Ok(())
    }

    // ═══════════════════════════════════════════════════
    //  STREAKS
    // ═══════════════════════════════════════════════════

    pub fn check_streak_on_login(&self, profile_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN")?;
        match (|| -> Result<()> {
            let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
            let yesterday = (chrono::Utc::now() - chrono::Duration::days(1)).format("%Y-%m-%d").to_string();
            let (last_date, freeze): (Option<String>, i64) = conn.query_row("SELECT last_activity_date,streak_freeze_count FROM user_stats WHERE profile_id=?1", params![profile_id], |r| Ok((r.get(0)?,r.get(1)?)))?;
            if let Some(ref ld) = last_date {
                if ld == &yesterday {
                    conn.execute("UPDATE user_stats SET hp=MIN(max_hp,hp+5) WHERE profile_id=?1", params![profile_id])?;
                } else if ld != &today {
                    if freeze > 0 {
                        conn.execute("UPDATE user_stats SET streak_freeze_count=streak_freeze_count-1 WHERE profile_id=?1", params![profile_id])?;
                    } else {
                        conn.execute("UPDATE user_stats SET current_streak=0 WHERE profile_id=?1", params![profile_id])?;
                    }
                }
            }
            Ok(())
        })() {
            Ok(()) => { conn.execute_batch("COMMIT")?; Ok(()) }
            Err(e) => { conn.execute_batch("ROLLBACK").ok(); Err(e) }
        }
    }

    // ═══════════════════════════════════════════════════
    //  ACHIEVEMENTS
    // ═══════════════════════════════════════════════════

    pub fn get_achievements(&self, profile_id: i64) -> Result<Vec<AchievementRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,profile_id,key,unlocked_at FROM achievements WHERE profile_id=?1 ORDER BY unlocked_at")?;
        let rows = stmt.query_map(params![profile_id], |r| Ok(AchievementRow{id:r.get(0)?,profile_id:r.get(1)?,key:r.get(2)?,unlocked_at:r.get(3)?}))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn check_and_unlock_achievements(&self, profile_id: i64) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let stats = Self::read_stats(&conn, profile_id)?;
        let existing: Vec<String> = {
            let mut stmt = conn.prepare("SELECT key FROM achievements WHERE profile_id=?1")?;
            let rows = stmt.query_map(params![profile_id], |r| r.get(0))?.collect::<Result<Vec<_>,_>>()?;
            rows
        };
        let checks: Vec<(&str, bool)> = vec![
            ("first_quest", stats.quests_completed >= 1),
            ("quest_10", stats.quests_completed >= 10),
            ("quest_100", stats.quests_completed >= 100),
            ("quest_500", stats.quests_completed >= 500),
            ("xp_1000", stats.total_xp >= 1000),
            ("xp_10000", stats.total_xp >= 10000),
            ("streak_7", stats.current_streak >= 7),
            ("streak_30", stats.current_streak >= 30),
            ("gold_hoarder", stats.gold >= 500),
            ("gold_1000", stats.gold >= 1000),
        ];
        let mut newly: Vec<String> = Vec::new();
        for (key, met) in checks {
            if met && !existing.contains(&key.to_string()) {
                conn.execute("INSERT OR IGNORE INTO achievements (profile_id,key) VALUES (?1,?2)", params![profile_id,key])?;
                newly.push(key.to_string());
            }
        }
        let has_l10_skill: bool = conn.query_row("SELECT COUNT(*) FROM skills WHERE profile_id=?1 AND level>=10 AND parent_skill_id IS NOT NULL", params![profile_id], |r| r.get::<_,i64>(0)).map(|c| c > 0).unwrap_or(false);
        if has_l10_skill && !existing.contains(&"first_level10_skill".to_string()) {
            conn.execute("INSERT OR IGNORE INTO achievements (profile_id,key) VALUES (?1,'first_level10_skill')", params![profile_id])?;
            newly.push("first_level10_skill".to_string());
        }
        let has_boss: bool = conn.query_row("SELECT COUNT(*) FROM quests WHERE profile_id=?1 AND is_boss=1 AND completed=1", params![profile_id], |r| r.get::<_,i64>(0)).map(|c| c > 0).unwrap_or(false);
        if has_boss && !existing.contains(&"first_boss".to_string()) {
            conn.execute("INSERT OR IGNORE INTO achievements (profile_id,key) VALUES (?1,'first_boss')", params![profile_id])?;
            newly.push("first_boss".to_string());
        }
        let bounty_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM activity_log WHERE profile_id=?1 AND detail LIKE '%Bounty%'",
            params![profile_id], |r| r.get(0)).unwrap_or(0);
        if bounty_count >= 10 && !existing.contains(&"bounty_hunter".to_string()) {
            conn.execute("INSERT OR IGNORE INTO achievements (profile_id,key) VALUES (?1,'bounty_hunter')", params![profile_id])?;
            newly.push("bounty_hunter".to_string());
        }
        newly.sort();
        newly.dedup();
        Ok(newly)
    }

    // ═══════════════════════════════════════════════════
    //  ACTIVITY LOG & ANALYTICS
    // ═══════════════════════════════════════════════════

    pub fn get_activity_summary(&self, profile_id: i64, from: &str, to: &str) -> Result<Vec<DaySummary>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT DATE(created_at) as d, COUNT(*) as cnt, SUM(xp_delta) as xp FROM activity_log WHERE profile_id=?1 AND DATE(created_at)>=?2 AND DATE(created_at)<=?3 GROUP BY d ORDER BY d")?;
        let rows = stmt.query_map(params![profile_id,from,to], |r| Ok(DaySummary{date:r.get(0)?,quest_count:r.get(1)?,xp_earned:r.get(2)?}))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn get_skill_activity(&self, skill_id: i64, limit: i64) -> Result<Vec<ActivityRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,profile_id,skill_id,event_type,detail,xp_delta,created_at FROM activity_log WHERE skill_id=?1 ORDER BY created_at DESC LIMIT ?2")?;
        let rows = stmt.query_map(params![skill_id,limit], |r| Ok(ActivityRow{id:r.get(0)?,profile_id:r.get(1)?,skill_id:r.get(2)?,event_type:r.get(3)?,detail:r.get(4)?,xp_delta:r.get(5)?,created_at:r.get(6)?}))?.collect::<Result<Vec<_>,_>>()?;
        Ok(rows)
    }

    pub fn get_weekly_report(&self, profile_id: i64) -> Result<WeeklyReport> {
        let conn = self.conn.lock().unwrap();
        let _today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let week_ago = (chrono::Utc::now() - chrono::Duration::days(7)).format("%Y-%m-%d").to_string();
        let two_weeks_ago = (chrono::Utc::now() - chrono::Duration::days(14)).format("%Y-%m-%d").to_string();
        let this_q: i64 = conn.query_row("SELECT COUNT(*) FROM activity_log WHERE profile_id=?1 AND event_type='quest_complete' AND DATE(created_at)>=?2", params![profile_id,&week_ago], |r| r.get(0))?;
        let this_xp: i64 = conn.query_row("SELECT COALESCE(SUM(xp_delta),0) FROM activity_log WHERE profile_id=?1 AND event_type='quest_complete' AND DATE(created_at)>=?2", params![profile_id,&week_ago], |r| r.get(0))?;
        let last_q: i64 = conn.query_row("SELECT COUNT(*) FROM activity_log WHERE profile_id=?1 AND event_type='quest_complete' AND DATE(created_at)>=?2 AND DATE(created_at)<?3", params![profile_id,&two_weeks_ago,&week_ago], |r| r.get(0))?;
        let last_xp: i64 = conn.query_row("SELECT COALESCE(SUM(xp_delta),0) FROM activity_log WHERE profile_id=?1 AND event_type='quest_complete' AND DATE(created_at)>=?2 AND DATE(created_at)<?3", params![profile_id,&two_weeks_ago,&week_ago], |r| r.get(0))?;
        let streak: i64 = conn.query_row("SELECT current_streak FROM user_stats WHERE profile_id=?1", params![profile_id], |r| r.get(0))?;
        Ok(WeeklyReport { this_week_quests: this_q, this_week_xp: this_xp, last_week_quests: last_q, last_week_xp: last_xp, current_streak: streak })
    }

    pub fn get_year_summary(&self, profile_id: i64, year: i32) -> Result<YearSummary> {
        let conn = self.conn.lock().unwrap();
        let start = format!("{}-01-01", year);
        let end = format!("{}-12-31", year);
        let total_quests: i64 = conn.query_row(
            "SELECT COUNT(*) FROM activity_log WHERE profile_id=?1 AND event_type='quest_complete' AND DATE(created_at) BETWEEN ?2 AND ?3",
            params![profile_id, start, end], |r| r.get(0))?;
        let total_xp: i64 = conn.query_row(
            "SELECT COALESCE(SUM(xp_delta),0) FROM activity_log WHERE profile_id=?1 AND event_type='quest_complete' AND DATE(created_at) BETWEEN ?2 AND ?3",
            params![profile_id, start, end], |r| r.get(0))?;
        let (most_active_skill, most_active_skill_count) = conn.query_row(
            "SELECT s.name, COUNT(*) as cnt FROM activity_log al JOIN skills s ON s.id=al.skill_id WHERE al.profile_id=?1 AND al.event_type='quest_complete' AND DATE(al.created_at) BETWEEN ?2 AND ?3 GROUP BY al.skill_id ORDER BY cnt DESC LIMIT 1",
            params![profile_id, start, end], |r| Ok((Some(r.get::<_,String>(0)?), r.get::<_,i64>(1)?))).unwrap_or((None, 0));
        let (best_day, best_day_count) = conn.query_row(
            "SELECT DATE(created_at), COUNT(*) as cnt FROM activity_log WHERE profile_id=?1 AND event_type='quest_complete' AND DATE(created_at) BETWEEN ?2 AND ?3 GROUP BY DATE(created_at) ORDER BY cnt DESC LIMIT 1",
            params![profile_id, start, end], |r| Ok((Some(r.get::<_,String>(0)?), r.get::<_,i64>(1)?))).unwrap_or((None, 0));
        let active_days: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT DATE(created_at)) FROM activity_log WHERE profile_id=?1 AND DATE(created_at) BETWEEN ?2 AND ?3",
            params![profile_id, start, end], |r| r.get(0))?;
        let achievements_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM achievements WHERE profile_id=?1 AND DATE(unlocked_at) BETWEEN ?2 AND ?3",
            params![profile_id, start, end], |r| r.get(0))?;
        Ok(YearSummary { total_quests, total_xp, most_active_skill, most_active_skill_count, best_day, best_day_count, active_days, achievements_count })
    }

    pub fn get_smart_suggestions(&self, profile_id: i64) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut suggestions = Vec::new();
        let week_ago = (chrono::Utc::now() - chrono::Duration::days(7)).format("%Y-%m-%d").to_string();
        {
            let mut stmt = conn.prepare("SELECT s.name FROM skills s WHERE s.profile_id=?1 AND s.parent_skill_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM activity_log al WHERE al.skill_id=s.id AND DATE(al.created_at)>=?2) LIMIT 3")?;
            let names: Vec<String> = { let r = stmt.query_map(params![profile_id,&week_ago], |r| r.get(0))?.collect::<Result<Vec<_>,_>>()?; r };
            for n in names { suggestions.push(format!("You haven't worked on {} in 7+ days", n)); }
        }
        {
            let mut stmt = conn.prepare("SELECT s.name,s.level FROM skills s WHERE s.profile_id=?1 AND s.parent_skill_id IS NOT NULL ORDER BY s.level ASC, s.current_xp ASC LIMIT 1")?;
            if let Ok(row) = stmt.query_row(params![profile_id], |r| Ok((r.get::<_,String>(0)?,r.get::<_,i64>(1)?))) {
                suggestions.push(format!("Your lowest skill is {} at level {}", row.0, row.1));
            }
        }
        {
            let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
            let soon = (chrono::Utc::now() + chrono::Duration::days(2)).format("%Y-%m-%d").to_string();
            let mut stmt = conn.prepare("SELECT quest_name FROM quests WHERE profile_id=?1 AND completed=0 AND failed=0 AND due_date IS NOT NULL AND due_date<=?2 AND due_date>=?3 LIMIT 3")?;
            let names: Vec<String> = { let r = stmt.query_map(params![profile_id,&soon,&today], |r| r.get(0))?.collect::<Result<Vec<_>,_>>()?; r };
            for n in names { suggestions.push(format!("'{}' is due soon!", n)); }
        }
        Ok(suggestions)
    }

    // ═══════════════════════════════════════════════════
    //  EXPORT
    // ═══════════════════════════════════════════════════

    pub fn export_profile_data(&self, profile_id: i64) -> Result<serde_json::Value> {
        let profile = { let conn = self.conn.lock().unwrap(); Self::read_profile(&conn, profile_id)? };
        let skills = self.get_all_skills(profile_id)?;
        let quests = self.get_all_quests(profile_id)?;
        let stats = self.get_stats(profile_id)?;
        let achievements = self.get_achievements(profile_id)?;
        let owned = self.get_owned_items(profile_id)?;
        Ok(serde_json::json!({
            "profile": profile, "skills": skills, "quests": quests,
            "stats": stats, "achievements": achievements, "owned_items": owned
        }))
    }

    // ═══════════════════════════════════════════════════
    //  STATS
    // ═══════════════════════════════════════════════════

    pub fn get_stats(&self, profile_id: i64) -> Result<StatsRow> {
        let conn = self.conn.lock().unwrap();
        Self::read_stats(&conn, profile_id)
    }

    fn read_stats(conn: &Connection, profile_id: i64) -> Result<StatsRow> {
        conn.query_row("SELECT total_xp,current_level,quests_completed,hp,max_hp,gold,current_streak,longest_streak,streak_freeze_count,xp_boost_remaining,skill_boost_id,skill_boost_mult,skill_boost_expires FROM user_stats WHERE profile_id=?1", params![profile_id], |r| Ok(StatsRow {
            total_xp:r.get(0)?,current_level:r.get(1)?,quests_completed:r.get(2)?,
            hp:r.get(3)?,max_hp:r.get(4)?,gold:r.get(5)?,
            current_streak:r.get(6)?,longest_streak:r.get(7)?,streak_freeze_count:r.get(8)?,xp_boost_remaining:r.get(9)?,
            skill_boost_id:r.get(10)?,skill_boost_mult:r.get(11)?,skill_boost_expires:r.get(12)?,
        }))
    }
}

// ═══════════════════════════════════════════════════
//  ROW TYPES
// ═══════════════════════════════════════════════════

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileRow {
    pub id: i64, pub name: String, pub avatar_icon: String, pub created_at: String,
    pub active_theme: String, pub sound_pack: String, pub default_skill_id: Option<i64>,
    pub total_xp: i64, pub current_level: i64, pub hp: i64, pub max_hp: i64, pub gold: i64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillRow {
    pub id: i64, pub name: String, pub category: String, pub parent_skill_id: Option<i64>,
    pub current_xp: i64, pub level: i64, pub icon: String, pub sort_order: i64,
    pub is_archived: bool, pub prestige_count: i64, pub last_xp_date: Option<String>,
    pub target_level: Option<i64>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestRow {
    pub id: i64, pub quest_name: String, pub description: String, pub quest_type: String,
    pub skill_id: Option<i64>, pub xp_reward: i64, pub completed: bool, pub failed: bool,
    pub completed_at: Option<String>, pub due_date: Option<String>, pub created_at: String,
    pub is_recurring: bool, pub recurrence_pattern: Option<String>, pub parent_quest_id: Option<i64>,
    pub difficulty: String, pub priority: String, pub is_boss: bool,
    pub is_pinned: bool, pub is_archived: bool, pub sort_order: i64,
    pub time_spent_seconds: i64, pub pomodoro_count: i64, pub failed_at: Option<String>,
    pub chain_id: Option<i64>, pub chain_order: i64,
    pub estimated_minutes: Option<i64>, pub blocked_by_quest_id: Option<i64>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubTaskRow { pub id: i64, pub quest_id: i64, pub title: String, pub completed: bool, pub sort_order: i64 }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagRow { pub id: i64, pub name: String }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateRow {
    pub id: i64, pub profile_id: i64, pub template_name: String, pub quest_name: String,
    pub description: String, pub quest_type: String, pub skill_id: Option<i64>,
    pub xp_reward: i64, pub difficulty: String, pub priority: String, pub is_boss: bool,
    pub schedule_pattern: Option<String>,
    pub schedule_active: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatsRow {
    pub total_xp: i64, pub current_level: i64, pub quests_completed: i64,
    pub hp: i64, pub max_hp: i64, pub gold: i64,
    pub current_streak: i64, pub longest_streak: i64, pub streak_freeze_count: i64, pub xp_boost_remaining: i64,
    pub skill_boost_id: Option<i64>, pub skill_boost_mult: f64, pub skill_boost_expires: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementRow { pub id: i64, pub profile_id: i64, pub key: String, pub unlocked_at: String }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityRow { pub id: i64, pub profile_id: i64, pub skill_id: Option<i64>, pub event_type: String, pub detail: Option<String>, pub xp_delta: i64, pub created_at: String }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DaySummary { pub date: String, pub quest_count: i64, pub xp_earned: i64 }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeeklyReport { pub this_week_quests: i64, pub this_week_xp: i64, pub last_week_quests: i64, pub last_week_xp: i64, pub current_streak: i64 }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YearSummary {
    pub total_quests: i64,
    pub total_xp: i64,
    pub most_active_skill: Option<String>,
    pub most_active_skill_count: i64,
    pub best_day: Option<String>,
    pub best_day_count: i64,
    pub active_days: i64,
    pub achievements_count: i64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ToggleQuestResult { pub skill: Option<SkillRow>, pub stats: StatsRow, pub first_blood: bool, pub combo_count: i64 }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubTaskToggleResult { pub quest_id: i64, pub auto_completed: bool, pub completed: i64, pub total: i64 }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChainRow {
    pub id: i64, pub profile_id: i64, pub name: String, pub description: String,
    pub bonus_gold: i64, pub bonus_xp: i64, pub completed: bool, pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChallengeRow {
    pub id: i64, pub profile_id: i64, pub challenge_type: String, pub description: String,
    pub target: i64, pub progress: i64, pub reward_gold: i64, pub reward_xp: i64,
    pub date: String, pub completed: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HabitRow {
    pub id: i64, pub profile_id: i64, pub name: String, pub icon: String,
    pub skill_id: Option<i64>, pub xp_per_check: i64, pub is_active: bool, pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct HabitEntryRow { pub id: i64, pub habit_id: i64, pub date: String }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntryRow {
    pub id: i64, pub profile_id: i64, pub content: String, pub mood: Option<String>,
    pub xp_granted: i64, pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EquipmentDef {
    pub key: String, pub name: String, pub description: String, pub icon: String,
    pub rarity: String, pub unlock_achievement: String,
    pub effect_type: String, pub effect_value: f64,
    pub unlocked: bool, pub equipped: bool,
}

pub fn calculate_level_from_xp(total_xp: u64) -> (u32, u64, u64) {
    let mut level = 1u32;
    loop {
        let next = xp_for_level(level);
        if total_xp < next {
            let prev = if level > 1 { xp_for_level(level - 1) } else { 0 };
            return (level, total_xp - prev, next - prev);
        }
        level += 1;
    }
}

fn xp_for_level(level: u32) -> u64 { (100.0 * (level as f64).powf(1.5)).round() as u64 }

fn days_between(from: &str, to: &str) -> i64 {
    let p = |s: &str| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok();
    match (p(from), p(to)) { (Some(a), Some(b)) => (b - a).num_days(), _ => -1 }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_db() -> AppDatabase {
        let db = AppDatabase::new(":memory:").expect("Failed to create in-memory DB");
        db.run_migrations().expect("Failed to run migrations");
        db
    }

    fn default_profile_id() -> i64 { 1 }

    fn get_any_leaf_skill(db: &AppDatabase, profile_id: i64) -> i64 {
        let skills = db.get_all_skills(profile_id).unwrap();
        skills.iter()
            .find(|s| s.parent_skill_id.is_some() &&
                !skills.iter().any(|o| o.parent_skill_id == Some(s.id)))
            .map(|s| s.id)
            .expect("No leaf skill found")
    }

    // ── Pure function tests ──────────────────────────────

    #[test]
    fn xp_for_level_monotonically_increases() {
        for lvl in 1..50 {
            assert!(xp_for_level(lvl + 1) > xp_for_level(lvl), "level {} >= level {}", lvl + 1, lvl);
        }
    }

    #[test]
    fn xp_for_level_1_is_100() {
        assert_eq!(xp_for_level(1), 100);
    }

    #[test]
    fn xp_for_level_follows_polynomial() {
        assert_eq!(xp_for_level(4), (100.0 * 4.0_f64.powf(1.5)).round() as u64);
        assert_eq!(xp_for_level(10), (100.0 * 10.0_f64.powf(1.5)).round() as u64);
    }

    #[test]
    fn calculate_level_from_xp_level_1_at_zero() {
        let (level, progress, needed) = calculate_level_from_xp(0);
        assert_eq!(level, 1);
        assert_eq!(progress, 0);
        assert_eq!(needed, 100);
    }

    #[test]
    fn calculate_level_from_xp_level_2_at_100() {
        let (level, _progress, _needed) = calculate_level_from_xp(100);
        assert_eq!(level, 2);
    }

    #[test]
    fn calculate_level_from_xp_mid_level() {
        let (level, progress, needed) = calculate_level_from_xp(50);
        assert_eq!(level, 1);
        assert_eq!(progress, 50);
        assert_eq!(needed, 100);
    }

    #[test]
    fn calculate_level_large_xp() {
        let (level, _, _) = calculate_level_from_xp(100_000);
        assert!(level > 10, "100k XP should be above level 10, got {}", level);
    }

    #[test]
    fn base_xp_for_quest_types() {
        assert_eq!(AppDatabase::base_xp_for_quest_type("daily"), 10);
        assert_eq!(AppDatabase::base_xp_for_quest_type("weekly"), 25);
        assert_eq!(AppDatabase::base_xp_for_quest_type("monthly"), 50);
        assert_eq!(AppDatabase::base_xp_for_quest_type("unknown"), 10);
    }

    #[test]
    fn difficulty_multipliers() {
        assert_eq!(AppDatabase::difficulty_xp_mult("easy"), 1.0);
        assert_eq!(AppDatabase::difficulty_xp_mult("normal"), 1.0);
        assert_eq!(AppDatabase::difficulty_xp_mult("hard"), 1.5);
        assert_eq!(AppDatabase::difficulty_xp_mult("epic"), 3.0);
    }

    #[test]
    fn days_between_calculates_correctly() {
        assert_eq!(days_between("2026-01-01", "2026-01-08"), 7);
        assert_eq!(days_between("2026-03-01", "2026-03-01"), 0);
        assert_eq!(days_between("invalid", "2026-01-01"), -1);
    }

    // ── Database tests ───────────────────────────────────

    #[test]
    fn migrations_create_default_profile() {
        let db = setup_db();
        let profiles = db.get_all_profiles().unwrap();
        assert!(!profiles.is_empty(), "Default profile should be created");
        assert_eq!(profiles[0].name, "Hero");
    }

    #[test]
    fn migrations_seed_skills() {
        let db = setup_db();
        let skills = db.get_all_skills(default_profile_id()).unwrap();
        assert!(!skills.is_empty(), "Skills should be seeded after migration");
    }

    #[test]
    fn create_profile() {
        let db = setup_db();
        let profile = db.create_profile("TestHero", "🛡️").unwrap();
        assert_eq!(profile.name, "TestHero");
        assert_eq!(profile.avatar_icon, "🛡️");
        let profiles = db.get_all_profiles().unwrap();
        assert_eq!(profiles.len(), 2);
    }

    #[test]
    fn create_and_get_skill() {
        let db = setup_db();
        let pid = default_profile_id();
        let skill = db.create_skill(pid, "Cooking", "CRAFT", None, "🍳").unwrap();
        assert_eq!(skill.name, "Cooking");
        assert_eq!(skill.category, "CRAFT");
        assert_eq!(skill.level, 1);
        assert_eq!(skill.current_xp, 0);

        let all = db.get_all_skills(pid).unwrap();
        assert!(all.iter().any(|s| s.name == "Cooking"));
    }

    #[test]
    fn create_quest_uses_base_xp() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let quest = db.create_quest(pid, "Test Daily", "", "daily", Some(sid), 999, None, false, None, "normal", "normal", false, None).unwrap();
        assert_eq!(quest.xp_reward, 10, "Daily quest should always get 10 XP regardless of input");

        let weekly = db.create_quest(pid, "Test Weekly", "", "weekly", Some(sid), 1, None, false, None, "normal", "normal", false, None).unwrap();
        assert_eq!(weekly.xp_reward, 25);

        let monthly = db.create_quest(pid, "Test Monthly", "", "monthly", Some(sid), 1, None, false, None, "normal", "normal", false, None).unwrap();
        assert_eq!(monthly.xp_reward, 50);
    }

    #[test]
    fn toggle_quest_completes_and_awards_xp() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let quest = db.create_quest(pid, "Grind", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        assert!(!quest.completed);

        let result = db.toggle_quest(pid, quest.id).unwrap();
        assert!(result.stats.total_xp > 0, "XP should increase after completing quest");
        assert_eq!(result.stats.quests_completed, 1);
    }

    #[test]
    fn toggle_quest_uncomplete_reverses_xp() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let quest = db.create_quest(pid, "Reversible", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();

        db.toggle_quest(pid, quest.id).unwrap();
        let stats_after_complete = db.get_stats(pid).unwrap();
        assert!(stats_after_complete.total_xp > 0);

        db.toggle_quest(pid, quest.id).unwrap();
        let stats_after_uncomplete = db.get_stats(pid).unwrap();
        assert!(stats_after_uncomplete.total_xp < stats_after_complete.total_xp, "Uncompleting should reduce XP");
    }

    #[test]
    fn hard_difficulty_gives_more_xp() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let normal_q = db.create_quest(pid, "Normal", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        let result_normal = db.toggle_quest(pid, normal_q.id).unwrap();
        let xp_normal = result_normal.stats.total_xp;

        db.toggle_quest(pid, normal_q.id).unwrap();

        let hard_q = db.create_quest(pid, "Hard", "", "daily", Some(sid), 10, None, false, None, "hard", "normal", false, None).unwrap();
        let result_hard = db.toggle_quest(pid, hard_q.id).unwrap();
        let xp_hard = result_hard.stats.total_xp;

        assert!(xp_hard > xp_normal, "Hard quest ({}) should give more XP than normal ({})", xp_hard, xp_normal);
    }

    #[test]
    fn reorder_quests_changes_sort_order() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let q1 = db.create_quest(pid, "First", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        let q2 = db.create_quest(pid, "Second", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        let q3 = db.create_quest(pid, "Third", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();

        db.reorder_quests(&[q3.id, q1.id, q2.id]).unwrap();

        let quests = db.get_all_quests(pid).unwrap();
        let q3_order = quests.iter().find(|q| q.id == q3.id).unwrap().sort_order;
        let q1_order = quests.iter().find(|q| q.id == q1.id).unwrap().sort_order;
        let q2_order = quests.iter().find(|q| q.id == q2.id).unwrap().sort_order;

        assert!(q3_order < q1_order, "q3 should come before q1");
        assert!(q1_order < q2_order, "q1 should come before q2");
    }

    #[test]
    fn has_existing_data_false_on_fresh_db() {
        let db = setup_db();
        assert!(!db.has_existing_data().unwrap(), "Fresh DB should not report existing data");
    }

    #[test]
    fn has_existing_data_true_after_quest_completion() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let quest = db.create_quest(pid, "Real Work", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        db.toggle_quest(pid, quest.id).unwrap();

        assert!(db.has_existing_data().unwrap(), "Should detect data after quest completion");
    }

    #[test]
    fn reset_all_data_clears_everything() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let quest = db.create_quest(pid, "To Delete", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        db.toggle_quest(pid, quest.id).unwrap();
        assert!(db.has_existing_data().unwrap());

        db.reset_all_data().unwrap();
        assert!(!db.has_existing_data().unwrap(), "After reset, should be clean");

        let stats = db.get_stats(default_profile_id()).unwrap();
        assert_eq!(stats.total_xp, 0);
        assert_eq!(stats.quests_completed, 0);
    }

    #[test]
    fn pin_quest_max_three() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let mut ids = vec![];
        for i in 0..4 {
            let q = db.create_quest(pid, &format!("Pin {}", i), "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
            ids.push(q.id);
        }

        db.toggle_pin_quest(pid, ids[0]).unwrap();
        db.toggle_pin_quest(pid, ids[1]).unwrap();
        db.toggle_pin_quest(pid, ids[2]).unwrap();

        let result = db.toggle_pin_quest(pid, ids[3]);
        assert!(result.is_err(), "Should not allow more than 3 pinned quests");
    }

    #[test]
    fn archive_and_unarchive_quest() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let quest = db.create_quest(pid, "Archive Me", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        db.archive_quest(quest.id).unwrap();

        let active = db.get_all_quests(pid).unwrap();
        assert!(!active.iter().any(|q| q.id == quest.id), "Archived quest should not appear in active list");

        let archived = db.get_archived_quests(pid).unwrap();
        assert!(archived.iter().any(|q| q.id == quest.id), "Should appear in archived list");

        db.unarchive_quest(quest.id).unwrap();
        let active2 = db.get_all_quests(pid).unwrap();
        assert!(active2.iter().any(|q| q.id == quest.id), "Unarchived quest should appear again");
    }

    #[test]
    fn delete_quest() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let quest = db.create_quest(pid, "Delete Me", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        db.delete_quest(quest.id).unwrap();

        let all = db.get_all_quests(pid).unwrap();
        assert!(!all.iter().any(|q| q.id == quest.id));
    }

    #[test]
    fn create_quest_no_skill() {
        let db = setup_db();
        let pid = default_profile_id();

        let quest = db.create_quest(pid, "Scheduled Event", "", "daily", None, 10, None, false, None, "normal", "normal", false, None).unwrap();
        assert_eq!(quest.skill_id, None);
        assert_eq!(quest.xp_reward, 10);
    }

    #[test]
    fn sub_tasks_crud() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let quest = db.create_quest(pid, "With Subs", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        let sub = db.create_sub_task(quest.id, "Sub 1").unwrap();
        assert_eq!(sub.title, "Sub 1");
        assert!(!sub.completed);

        let toggled = db.toggle_sub_task(pid, sub.id).unwrap();
        assert!(toggled.completed > 0);

        db.delete_sub_task(sub.id).unwrap();
        let subs = db.get_sub_tasks(quest.id).unwrap();
        assert!(subs.is_empty());
    }

    #[test]
    fn tags_crud() {
        let db = setup_db();
        let pid = default_profile_id();
        let sid = get_any_leaf_skill(&db, pid);

        let quest = db.create_quest(pid, "Tagged", "", "daily", Some(sid), 10, None, false, None, "normal", "normal", false, None).unwrap();
        db.add_tag_to_quest(quest.id, "urgent").unwrap();
        db.add_tag_to_quest(quest.id, "coding").unwrap();

        let tags = db.get_tags_for_quest(quest.id).unwrap();
        assert_eq!(tags.len(), 2);

        let all_tags = db.get_all_tags(pid).unwrap();
        assert!(all_tags.len() >= 2);

        db.remove_tag_from_quest(quest.id, tags[0].id).unwrap();
        let tags_after = db.get_tags_for_quest(quest.id).unwrap();
        assert_eq!(tags_after.len(), 1);
    }

    #[test]
    fn get_stats_for_default_profile() {
        let db = setup_db();
        let stats = db.get_stats(default_profile_id()).unwrap();
        assert_eq!(stats.total_xp, 0);
        assert_eq!(stats.current_level, 1);
        assert_eq!(stats.hp, 100);
        assert_eq!(stats.max_hp, 100);
    }
}
