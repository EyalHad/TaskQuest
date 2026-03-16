use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: i64, pub name: String, pub avatar_icon: String, pub created_at: String,
    pub active_theme: String, pub sound_pack: String, pub default_skill_id: Option<i64>,
    pub total_xp: i64, pub current_level: i64, pub hp: i64, pub max_hp: i64, pub gold: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProfileInput { pub name: String, pub avatar_icon: Option<String> }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Skill {
    pub id: i64, pub name: String, pub category: String, pub parent_skill_id: Option<i64>,
    pub current_xp: i64, pub level: i64, pub icon: String, pub sort_order: i64,
    pub is_archived: bool,
    pub prestige_count: i64, pub last_xp_date: Option<String>,
    pub target_level: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Quest {
    pub id: i64, pub quest_name: String, pub description: String, pub quest_type: String,
    pub skill_id: Option<i64>, pub xp_reward: i64, pub completed: bool, pub failed: bool,
    pub completed_at: Option<String>, pub due_date: Option<String>, pub created_at: String,
    pub is_recurring: bool, pub recurrence_pattern: Option<String>, pub parent_quest_id: Option<i64>,
    pub difficulty: String, pub priority: String, pub is_boss: bool,
    pub is_pinned: bool, pub is_archived: bool, pub sort_order: i64,
    pub time_spent_seconds: i64, pub pomodoro_count: i64,
    pub failed_at: Option<String>,
    pub chain_id: Option<i64>, pub chain_order: i64,
    pub estimated_minutes: Option<i64>, pub blocked_by_quest_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQuestInput {
    pub quest_name: String, pub description: Option<String>, pub quest_type: String,
    pub skill_id: Option<i64>, pub xp_reward: Option<i64>, pub due_date: Option<String>,
    pub is_recurring: Option<bool>, pub recurrence_pattern: Option<String>,
    pub difficulty: Option<String>, pub priority: Option<String>, pub is_boss: Option<bool>,
    pub estimated_minutes: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSkillInput { pub name: String, pub category: String, pub parent_skill_id: Option<i64>, pub icon: Option<String> }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSkillInput {
    pub name: String,
    pub icon: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubTask { pub id: i64, pub quest_id: i64, pub title: String, pub completed: bool, pub sort_order: i64 }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag { pub id: i64, pub name: String }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestTemplate {
    pub id: i64, pub profile_id: i64, pub template_name: String, pub quest_name: String,
    pub description: String, pub quest_type: String, pub skill_id: Option<i64>,
    pub xp_reward: i64, pub difficulty: String, pub priority: String, pub is_boss: bool,
    pub schedule_pattern: Option<String>, pub schedule_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTemplateInput {
    pub template_name: String, pub quest_name: String, pub description: Option<String>,
    pub quest_type: Option<String>, pub skill_id: Option<i64>, pub xp_reward: Option<i64>,
    pub difficulty: Option<String>, pub priority: Option<String>, pub is_boss: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Achievement { pub id: i64, pub profile_id: i64, pub key: String, pub unlocked_at: String }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEntry { pub id: i64, pub profile_id: i64, pub skill_id: Option<i64>, pub event_type: String, pub detail: Option<String>, pub xp_delta: i64, pub created_at: String }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DaySummary { pub date: String, pub quest_count: i64, pub xp_earned: i64 }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeeklyReport { pub this_week_quests: i64, pub this_week_xp: i64, pub last_week_quests: i64, pub last_week_xp: i64, pub current_streak: i64 }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStats {
    pub total_xp: i64, pub current_level: i64, pub quests_completed: i64,
    pub hp: i64, pub max_hp: i64, pub gold: i64,
    pub progress_xp: i64, pub needed_xp: i64, pub progress_percent: f64,
    pub current_streak: i64, pub longest_streak: i64, pub streak_freeze_count: i64, pub xp_boost_remaining: i64,
    pub is_burnout: bool,
    pub skill_boost_id: Option<i64>, pub skill_boost_mult: f64, pub skill_boost_expires: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubTaskToggleResult { pub quest_id: i64, pub auto_completed: bool, pub completed: i64, pub total: i64 }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Chain {
    pub id: i64, pub profile_id: i64, pub name: String, pub description: String,
    pub bonus_gold: i64, pub bonus_xp: i64, pub completed: bool, pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Challenge {
    pub id: i64, pub profile_id: i64, pub challenge_type: String, pub description: String,
    pub target: i64, pub progress: i64, pub reward_gold: i64, pub reward_xp: i64,
    pub date: String, pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Habit {
    pub id: i64, pub profile_id: i64, pub name: String, pub icon: String,
    pub skill_id: Option<i64>, pub xp_per_check: i64, pub is_active: bool, pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntry {
    pub id: i64, pub profile_id: i64, pub content: String, pub mood: Option<String>,
    pub xp_granted: i64, pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EquipmentItem {
    pub key: String, pub name: String, pub description: String, pub icon: String,
    pub rarity: String, pub unlock_achievement: String,
    pub effect_type: String, pub effect_value: f64,
    pub unlocked: bool, pub equipped: bool,
}

// ═══════════════════════════════════════════════════
//  From impls
// ═══════════════════════════════════════════════════

impl From<crate::db::ProfileRow> for Profile {
    fn from(r: crate::db::ProfileRow) -> Self {
        Self { id:r.id, name:r.name, avatar_icon:r.avatar_icon, created_at:r.created_at,
            active_theme:r.active_theme, sound_pack:r.sound_pack, default_skill_id:r.default_skill_id,
            total_xp:r.total_xp, current_level:r.current_level, hp:r.hp, max_hp:r.max_hp, gold:r.gold }
    }
}

impl From<crate::db::SkillRow> for Skill {
    fn from(r: crate::db::SkillRow) -> Self {
        Self { id:r.id, name:r.name, category:r.category, parent_skill_id:r.parent_skill_id,
            current_xp:r.current_xp, level:r.level, icon:r.icon, sort_order:r.sort_order,
            is_archived: r.is_archived, prestige_count: r.prestige_count, last_xp_date: r.last_xp_date,
            target_level: r.target_level }
    }
}

impl From<crate::db::QuestRow> for Quest {
    fn from(r: crate::db::QuestRow) -> Self {
        Self { id:r.id, quest_name:r.quest_name, description:r.description, quest_type:r.quest_type,
            skill_id:r.skill_id, xp_reward:r.xp_reward, completed:r.completed, failed:r.failed,
            completed_at:r.completed_at, due_date:r.due_date, created_at:r.created_at,
            is_recurring:r.is_recurring, recurrence_pattern:r.recurrence_pattern, parent_quest_id:r.parent_quest_id,
            difficulty:r.difficulty, priority:r.priority, is_boss:r.is_boss,
            is_pinned:r.is_pinned, is_archived:r.is_archived, sort_order:r.sort_order,
            time_spent_seconds:r.time_spent_seconds, pomodoro_count:r.pomodoro_count,
            failed_at:r.failed_at, chain_id: r.chain_id, chain_order: r.chain_order,
            estimated_minutes: r.estimated_minutes, blocked_by_quest_id: r.blocked_by_quest_id }
    }
}

impl From<crate::db::ChainRow> for Chain {
    fn from(r: crate::db::ChainRow) -> Self {
        Self { id:r.id, profile_id:r.profile_id, name:r.name, description:r.description,
            bonus_gold:r.bonus_gold, bonus_xp:r.bonus_xp, completed:r.completed, created_at:r.created_at }
    }
}

impl From<crate::db::ChallengeRow> for Challenge {
    fn from(r: crate::db::ChallengeRow) -> Self {
        Self { id:r.id, profile_id:r.profile_id, challenge_type:r.challenge_type, description:r.description,
            target:r.target, progress:r.progress, reward_gold:r.reward_gold, reward_xp:r.reward_xp,
            date:r.date, completed:r.completed }
    }
}

impl From<crate::db::HabitRow> for Habit {
    fn from(r: crate::db::HabitRow) -> Self {
        Self { id:r.id, profile_id:r.profile_id, name:r.name, icon:r.icon,
            skill_id:r.skill_id, xp_per_check:r.xp_per_check, is_active:r.is_active, created_at:r.created_at }
    }
}

impl From<crate::db::JournalEntryRow> for JournalEntry {
    fn from(r: crate::db::JournalEntryRow) -> Self {
        Self { id:r.id, profile_id:r.profile_id, content:r.content, mood:r.mood,
            xp_granted:r.xp_granted, created_at:r.created_at }
    }
}

impl From<crate::db::EquipmentDef> for EquipmentItem {
    fn from(r: crate::db::EquipmentDef) -> Self {
        Self { key:r.key, name:r.name, description:r.description, icon:r.icon,
            rarity:r.rarity, unlock_achievement:r.unlock_achievement,
            effect_type:r.effect_type, effect_value:r.effect_value,
            unlocked:r.unlocked, equipped:r.equipped }
    }
}

impl From<crate::db::SubTaskRow> for SubTask {
    fn from(r: crate::db::SubTaskRow) -> Self { Self { id:r.id, quest_id:r.quest_id, title:r.title, completed:r.completed, sort_order:r.sort_order } }
}

impl From<crate::db::TagRow> for Tag {
    fn from(r: crate::db::TagRow) -> Self { Self { id:r.id, name:r.name } }
}

impl From<crate::db::TemplateRow> for QuestTemplate {
    fn from(r: crate::db::TemplateRow) -> Self {
        Self { id:r.id, profile_id:r.profile_id, template_name:r.template_name, quest_name:r.quest_name,
            description:r.description, quest_type:r.quest_type, skill_id:r.skill_id, xp_reward:r.xp_reward,
            difficulty:r.difficulty, priority:r.priority, is_boss:r.is_boss,
            schedule_pattern:r.schedule_pattern, schedule_active:r.schedule_active }
    }
}

impl From<crate::db::AchievementRow> for Achievement {
    fn from(r: crate::db::AchievementRow) -> Self { Self { id:r.id, profile_id:r.profile_id, key:r.key, unlocked_at:r.unlocked_at } }
}

impl From<crate::db::ActivityRow> for ActivityEntry {
    fn from(r: crate::db::ActivityRow) -> Self { Self { id:r.id, profile_id:r.profile_id, skill_id:r.skill_id, event_type:r.event_type, detail:r.detail, xp_delta:r.xp_delta, created_at:r.created_at } }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

impl From<crate::db::YearSummary> for YearSummary {
    fn from(r: crate::db::YearSummary) -> Self {
        Self { total_quests:r.total_quests, total_xp:r.total_xp, most_active_skill:r.most_active_skill,
            most_active_skill_count:r.most_active_skill_count, best_day:r.best_day,
            best_day_count:r.best_day_count, active_days:r.active_days, achievements_count:r.achievements_count }
    }
}

impl From<crate::db::DaySummary> for DaySummary {
    fn from(r: crate::db::DaySummary) -> Self { Self { date:r.date, quest_count:r.quest_count, xp_earned:r.xp_earned } }
}

impl From<crate::db::WeeklyReport> for WeeklyReport {
    fn from(r: crate::db::WeeklyReport) -> Self { Self { this_week_quests:r.this_week_quests, this_week_xp:r.this_week_xp, last_week_quests:r.last_week_quests, last_week_xp:r.last_week_xp, current_streak:r.current_streak } }
}

impl From<crate::db::SubTaskToggleResult> for SubTaskToggleResult {
    fn from(r: crate::db::SubTaskToggleResult) -> Self { Self { quest_id:r.quest_id, auto_completed:r.auto_completed, completed:r.completed, total:r.total } }
}

impl From<crate::db::StatsRow> for GameStats {
    fn from(r: crate::db::StatsRow) -> Self {
        let (_, progress, needed) = crate::db::calculate_level_from_xp(r.total_xp.max(0) as u64);
        let pct = if needed > 0 { (progress as f64 / needed as f64) * 100.0 } else { 0.0 };
        Self { total_xp:r.total_xp, current_level:r.current_level, quests_completed:r.quests_completed,
            hp:r.hp, max_hp:r.max_hp, gold:r.gold,
            progress_xp:progress as i64, needed_xp:needed as i64, progress_percent:pct,
            current_streak:r.current_streak, longest_streak:r.longest_streak,
            streak_freeze_count:r.streak_freeze_count, xp_boost_remaining:r.xp_boost_remaining,
            is_burnout: r.hp == 0,
            skill_boost_id:r.skill_boost_id, skill_boost_mult:r.skill_boost_mult, skill_boost_expires:r.skill_boost_expires }
    }
}
