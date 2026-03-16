mod db;
mod errors;
mod models;
mod catalog;

use db::AppDatabase;
use errors::AppError;
use models::*;
use tauri::Manager;

// ═══════════════════════════════════════════════════
//  DATA MANAGEMENT
// ═══════════════════════════════════════════════════

#[tauri::command]
fn check_has_data(state: tauri::State<'_, AppDatabase>) -> Result<bool, String> {
    state.has_existing_data().map_err(|e| AppError::Database(e).to_string())
}

#[tauri::command]
fn reset_all_data(state: tauri::State<'_, AppDatabase>) -> Result<(), String> {
    state.reset_all_data().map_err(|e| AppError::Database(e).to_string())
}

// ═══════════════════════════════════════════════════
//  PROFILES
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_profiles(state: tauri::State<'_, AppDatabase>) -> Result<Vec<Profile>, String> {
    Ok(state.get_all_profiles().map_err(|e| AppError::Database(e))?.into_iter().map(Profile::from).collect())
}

#[tauri::command]
fn create_profile(state: tauri::State<'_, AppDatabase>, input: CreateProfileInput) -> Result<Profile, String> {
    let icon = input.avatar_icon.unwrap_or_else(|| "⚔️".to_string());
    Ok(Profile::from(state.create_profile(&input.name, &icon).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn delete_profile(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<(), String> {
    state.delete_profile(profile_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn update_profile_theme(state: tauri::State<'_, AppDatabase>, profile_id: i64, theme: String) -> Result<(), String> {
    state.update_profile_theme(profile_id, &theme).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn update_profile_sound(state: tauri::State<'_, AppDatabase>, profile_id: i64, pack: String) -> Result<(), String> {
    state.update_profile_sound(profile_id, &pack).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn set_default_skill(state: tauri::State<'_, AppDatabase>, profile_id: i64, skill_id: Option<i64>) -> Result<(), String> {
    state.set_default_skill(profile_id, skill_id).map_err(|e| AppError::Database(e))?; Ok(())
}

// ═══════════════════════════════════════════════════
//  SKILLS
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_skill_tree(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<Skill>, String> {
    Ok(state.get_all_skills(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(Skill::from).collect())
}

#[tauri::command]
fn create_skill(state: tauri::State<'_, AppDatabase>, profile_id: i64, input: CreateSkillInput) -> Result<Skill, String> {
    let icon = input.icon.unwrap_or_default();
    Ok(Skill::from(state.create_skill(profile_id, &input.name, &input.category, input.parent_skill_id, &icon).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn delete_skill(state: tauri::State<'_, AppDatabase>, skill_id: i64) -> Result<(), String> {
    state.delete_skill(skill_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn update_skill(state: tauri::State<'_, AppDatabase>, skill_id: i64, input: UpdateSkillInput) -> Result<Skill, String> {
    Ok(Skill::from(state.update_skill(skill_id, &input.name, &input.icon).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn move_skill(state: tauri::State<'_, AppDatabase>, skill_id: i64, new_parent_id: i64, new_category: String) -> Result<Skill, String> {
    Ok(Skill::from(state.move_skill(skill_id, new_parent_id, &new_category).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn archive_skill(state: tauri::State<'_, AppDatabase>, skill_id: i64) -> Result<(), String> {
    state.archive_skill(skill_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn unarchive_skill(state: tauri::State<'_, AppDatabase>, skill_id: i64) -> Result<(), String> {
    state.unarchive_skill(skill_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn get_archived_skills(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<Skill>, String> {
    Ok(state.get_archived_skills(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(Skill::from).collect())
}

#[tauri::command]
fn reorder_skills(state: tauri::State<'_, AppDatabase>, skill_ids: Vec<i64>) -> Result<(), String> {
    state.reorder_skills(&skill_ids).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn get_skill_quest_counts(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<(i64, i64)>, String> {
    state.get_skill_quest_counts(profile_id).map_err(|e| AppError::Database(e).to_string())
}

// ═══════════════════════════════════════════════════
//  QUESTS
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_quests_for_skill(state: tauri::State<'_, AppDatabase>, skill_id: i64) -> Result<Vec<Quest>, String> {
    Ok(state.get_quests_for_skill(skill_id).map_err(|e| AppError::Database(e))?.into_iter().map(Quest::from).collect())
}

#[tauri::command]
fn get_all_quests(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<Quest>, String> {
    Ok(state.get_all_quests(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(Quest::from).collect())
}

#[tauri::command]
fn get_archived_quests(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<Quest>, String> {
    Ok(state.get_archived_quests(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(Quest::from).collect())
}

#[tauri::command]
fn create_quest(state: tauri::State<'_, AppDatabase>, profile_id: i64, input: CreateQuestInput) -> Result<Quest, String> {
    let desc = input.description.unwrap_or_default();
    let xp = input.xp_reward.unwrap_or(10);
    let due = input.due_date.as_deref();
    let recurring = input.is_recurring.unwrap_or(false);
    let pattern = input.recurrence_pattern.as_deref();
    let diff = input.difficulty.as_deref().unwrap_or("normal");
    let pri = input.priority.as_deref().unwrap_or("normal");
    let boss = input.is_boss.unwrap_or(false);
    let est = input.estimated_minutes;
    let skill_id = input.skill_id.filter(|&id| id > 0);
    Ok(Quest::from(state.create_quest(profile_id, &input.quest_name, &desc, &input.quest_type, skill_id, xp, due, recurring, pattern, diff, pri, boss, est).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn toggle_quest(state: tauri::State<'_, AppDatabase>, profile_id: i64, quest_id: i64) -> Result<ToggleResult, String> {
    let r = state.toggle_quest(profile_id, quest_id).map_err(|e| AppError::Database(e))?;
    let new_achievements = state.check_and_unlock_achievements(profile_id).unwrap_or_default();
    Ok(ToggleResult { skill: r.skill.map(Skill::from), stats: GameStats::from(r.stats), new_achievements, first_blood: r.first_blood, combo_count: r.combo_count })
}

#[tauri::command]
fn fail_quest(state: tauri::State<'_, AppDatabase>, profile_id: i64, quest_id: i64) -> Result<FailResult, String> {
    let r = state.fail_quest(profile_id, quest_id).map_err(|e| AppError::Database(e))?;
    Ok(FailResult { stats: GameStats::from(r) })
}

#[tauri::command]
fn delete_quest(state: tauri::State<'_, AppDatabase>, quest_id: i64) -> Result<(), String> {
    state.delete_quest(quest_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn update_quest_description(state: tauri::State<'_, AppDatabase>, quest_id: i64, description: String) -> Result<(), String> {
    state.update_quest_description(quest_id, &description).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn toggle_pin_quest(state: tauri::State<'_, AppDatabase>, profile_id: i64, quest_id: i64) -> Result<Quest, String> {
    Ok(Quest::from(state.toggle_pin_quest(profile_id, quest_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn archive_quest(state: tauri::State<'_, AppDatabase>, quest_id: i64) -> Result<(), String> {
    state.archive_quest(quest_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn unarchive_quest(state: tauri::State<'_, AppDatabase>, quest_id: i64) -> Result<(), String> {
    state.unarchive_quest(quest_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn reorder_quests(state: tauri::State<'_, AppDatabase>, quest_ids: Vec<i64>) -> Result<(), String> {
    state.reorder_quests(&quest_ids).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn reschedule_quest(state: tauri::State<'_, AppDatabase>, quest_id: i64, due_date: String) -> Result<Quest, String> {
    Ok(Quest::from(state.reschedule_quest(quest_id, &due_date).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn set_quest_dependency(state: tauri::State<'_, AppDatabase>, quest_id: i64, blocked_by_quest_id: Option<i64>) -> Result<Quest, String> {
    Ok(Quest::from(state.set_quest_dependency(quest_id, blocked_by_quest_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn set_skill_target(state: tauri::State<'_, AppDatabase>, skill_id: i64, target_level: Option<i64>) -> Result<Skill, String> {
    Ok(Skill::from(state.set_skill_target(skill_id, target_level).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn get_year_summary(state: tauri::State<'_, AppDatabase>, profile_id: i64, year: i32) -> Result<YearSummary, String> {
    Ok(YearSummary::from(state.get_year_summary(profile_id, year).map_err(|e| AppError::Database(e))?))
}

// ═══════════════════════════════════════════════════
//  SUB-TASKS
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_sub_tasks(state: tauri::State<'_, AppDatabase>, quest_id: i64) -> Result<Vec<SubTask>, String> {
    Ok(state.get_sub_tasks(quest_id).map_err(|e| AppError::Database(e))?.into_iter().map(SubTask::from).collect())
}

#[tauri::command]
fn create_sub_task(state: tauri::State<'_, AppDatabase>, quest_id: i64, title: String) -> Result<SubTask, String> {
    Ok(SubTask::from(state.create_sub_task(quest_id, &title).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn toggle_sub_task(state: tauri::State<'_, AppDatabase>, profile_id: i64, sub_task_id: i64) -> Result<SubTaskToggleResult, String> {
    Ok(SubTaskToggleResult::from(state.toggle_sub_task(profile_id, sub_task_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn delete_sub_task(state: tauri::State<'_, AppDatabase>, sub_task_id: i64) -> Result<(), String> {
    state.delete_sub_task(sub_task_id).map_err(|e| AppError::Database(e))?; Ok(())
}

// ═══════════════════════════════════════════════════
//  TAGS
// ═══════════════════════════════════════════════════

#[tauri::command]
fn add_tag_to_quest(state: tauri::State<'_, AppDatabase>, quest_id: i64, tag_name: String) -> Result<Tag, String> {
    Ok(Tag::from(state.add_tag_to_quest(quest_id, &tag_name).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn remove_tag_from_quest(state: tauri::State<'_, AppDatabase>, quest_id: i64, tag_id: i64) -> Result<(), String> {
    state.remove_tag_from_quest(quest_id, tag_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn get_tags_for_quest(state: tauri::State<'_, AppDatabase>, quest_id: i64) -> Result<Vec<Tag>, String> {
    Ok(state.get_tags_for_quest(quest_id).map_err(|e| AppError::Database(e))?.into_iter().map(Tag::from).collect())
}

#[tauri::command]
fn get_all_tags(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<Tag>, String> {
    Ok(state.get_all_tags(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(Tag::from).collect())
}

// ═══════════════════════════════════════════════════
//  TEMPLATES
// ═══════════════════════════════════════════════════

#[tauri::command]
fn create_template(state: tauri::State<'_, AppDatabase>, profile_id: i64, input: CreateTemplateInput) -> Result<QuestTemplate, String> {
    let desc = input.description.unwrap_or_default();
    let qt = input.quest_type.as_deref().unwrap_or("daily");
    let xp = input.xp_reward.unwrap_or(10);
    let diff = input.difficulty.as_deref().unwrap_or("normal");
    let pri = input.priority.as_deref().unwrap_or("normal");
    let boss = input.is_boss.unwrap_or(false);
    Ok(QuestTemplate::from(state.create_template(profile_id, &input.template_name, &input.quest_name, &desc, qt, input.skill_id, xp, diff, pri, boss).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn get_templates(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<QuestTemplate>, String> {
    Ok(state.get_templates(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(QuestTemplate::from).collect())
}

#[tauri::command]
fn delete_template(state: tauri::State<'_, AppDatabase>, template_id: i64) -> Result<(), String> {
    state.delete_template(template_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn create_quest_from_template(state: tauri::State<'_, AppDatabase>, profile_id: i64, template_id: i64) -> Result<Quest, String> {
    Ok(Quest::from(state.create_quest_from_template(profile_id, template_id).map_err(|e| AppError::Database(e))?))
}

// ═══════════════════════════════════════════════════
//  SHOP & STATS
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_game_stats(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<GameStats, String> {
    Ok(GameStats::from(state.get_stats(profile_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn purchase_item(state: tauri::State<'_, AppDatabase>, profile_id: i64, item_key: String) -> Result<GameStats, String> {
    Ok(GameStats::from(state.purchase_item(profile_id, &item_key).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn get_owned_items(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<String>, String> {
    state.get_owned_items(profile_id).map_err(|e| AppError::Database(e).to_string())
}

// ═══════════════════════════════════════════════════
//  POMODORO & TIME
// ═══════════════════════════════════════════════════

#[tauri::command]
fn complete_pomodoro(state: tauri::State<'_, AppDatabase>, profile_id: i64, quest_id: i64) -> Result<GameStats, String> {
    Ok(GameStats::from(state.complete_pomodoro(profile_id, quest_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn add_time_to_quest(state: tauri::State<'_, AppDatabase>, quest_id: i64, seconds: i64) -> Result<(), String> {
    state.add_time_to_quest(quest_id, seconds).map_err(|e| AppError::Database(e))?; Ok(())
}

// ═══════════════════════════════════════════════════
//  ACHIEVEMENTS
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_achievements(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<Achievement>, String> {
    Ok(state.get_achievements(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(Achievement::from).collect())
}

// ═══════════════════════════════════════════════════
//  ANALYTICS
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_activity_summary(state: tauri::State<'_, AppDatabase>, profile_id: i64, from_date: String, to_date: String) -> Result<Vec<DaySummary>, String> {
    Ok(state.get_activity_summary(profile_id, &from_date, &to_date).map_err(|e| AppError::Database(e))?.into_iter().map(DaySummary::from).collect())
}

#[tauri::command]
fn get_skill_activity(state: tauri::State<'_, AppDatabase>, skill_id: i64, limit: i64) -> Result<Vec<ActivityEntry>, String> {
    Ok(state.get_skill_activity(skill_id, limit).map_err(|e| AppError::Database(e))?.into_iter().map(ActivityEntry::from).collect())
}

#[tauri::command]
fn get_weekly_report(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<WeeklyReport, String> {
    Ok(WeeklyReport::from(state.get_weekly_report(profile_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn get_smart_suggestions(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<String>, String> {
    state.get_smart_suggestions(profile_id).map_err(|e| AppError::Database(e).to_string())
}

// ═══════════════════════════════════════════════════
//  EXPORT & INIT
// ═══════════════════════════════════════════════════

#[tauri::command]
fn export_profile_data(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<serde_json::Value, String> {
    state.export_profile_data(profile_id).map_err(|e| AppError::Database(e).to_string())
}

#[tauri::command]
fn init_profile(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<(), String> {
    state.check_streak_on_login(profile_id).map_err(|e| AppError::Database(e))?;
    state.apply_pending_fail_damage(profile_id).map_err(|e| AppError::Database(e))?;
    state.check_recurring_quests(profile_id).map_err(|e| AppError::Database(e))?;
    state.check_daily_bounties(profile_id).map_err(|e| AppError::Database(e).to_string())?;
    state.check_weekly_boss(profile_id).map_err(|e| AppError::Database(e))?;
    state.generate_daily_challenges(profile_id).map_err(|e| AppError::Database(e))?;
    state.check_template_schedules(profile_id).map_err(|e| AppError::Database(e))?;
    Ok(())
}

// ═══════════════════════════════════════════════════
//  CATALOG
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_skill_catalog() -> Vec<catalog::CatalogCategory> {
    catalog::get_catalog().to_vec()
}

#[tauri::command]
fn get_quick_start_bundles() -> Vec<catalog::QuickStartBundle> {
    catalog::get_bundles().to_vec()
}

#[tauri::command]
fn add_catalog_skill(state: tauri::State<'_, AppDatabase>, profile_id: i64, catalog_skill_id: String) -> Result<Skill, String> {
    let (cat, grp, sk) = catalog::find_catalog_context(&catalog_skill_id)
        .ok_or_else(|| "Catalog skill not found".to_string())?;
    Ok(Skill::from(state.add_catalog_skill(profile_id, cat.code, cat.name, cat.icon, grp.name, grp.icon, sk.name, sk.icon)
        .map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn add_catalog_bundle(state: tauri::State<'_, AppDatabase>, profile_id: i64, bundle_key: String) -> Result<Vec<Skill>, String> {
    let skill_ids = catalog::get_bundle_skill_ids(&bundle_key);
    if skill_ids.is_empty() {
        return Err("Bundle not found".to_string());
    }
    let mut added = Vec::new();
    for sid in skill_ids {
        if let Some((cat, grp, sk)) = catalog::find_catalog_context(sid) {
            match state.add_catalog_skill(profile_id, cat.code, cat.name, cat.icon, grp.name, grp.icon, sk.name, sk.icon) {
                Ok(row) => added.push(Skill::from(row)),
                Err(rusqlite::Error::SqliteFailure(e, _)) if e.extended_code == 2067 => {} // UNIQUE constraint = already added
                Err(e) => return Err(AppError::Database(e).to_string()),
            }
        }
    }
    Ok(added)
}

#[tauri::command]
fn get_catalog_suggestions(state: tauri::State<'_, AppDatabase>, skill_id: i64) -> Result<Vec<String>, String> {
    state.get_catalog_suggestions(skill_id).map_err(|e| AppError::Database(e).to_string())
}

#[tauri::command]
fn get_daily_bounties(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<i64>, String> {
    state.get_daily_bounties(profile_id).map_err(|e| AppError::Database(e).to_string())
}

#[tauri::command]
fn recover_failed_quest(state: tauri::State<'_, AppDatabase>, quest_id: i64) -> Result<Quest, String> {
    Ok(Quest::from(state.recover_failed_quest(quest_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn activate_skill_boost(state: tauri::State<'_, AppDatabase>, profile_id: i64, skill_id: i64, mult: f64, duration_hours: i64) -> Result<(), String> {
    state.activate_skill_boost(profile_id, skill_id, mult, duration_hours).map_err(|e| AppError::Database(e))?;
    Ok(())
}

// ═══════════════════════════════════════════════════
//  QUEST CHAINS
// ═══════════════════════════════════════════════════

#[tauri::command]
fn create_chain(state: tauri::State<'_, AppDatabase>, profile_id: i64, name: String, description: String, bonus_gold: i64, bonus_xp: i64) -> Result<Chain, String> {
    Ok(Chain::from(state.create_chain(profile_id, &name, &description, bonus_gold, bonus_xp).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn get_chains(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<Chain>, String> {
    Ok(state.get_chains(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(Chain::from).collect())
}

#[tauri::command]
fn set_quest_chain(state: tauri::State<'_, AppDatabase>, quest_id: i64, chain_id: Option<i64>, chain_order: i64) -> Result<(), String> {
    state.set_quest_chain(quest_id, chain_id, chain_order).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn delete_chain(state: tauri::State<'_, AppDatabase>, chain_id: i64) -> Result<(), String> {
    state.delete_chain(chain_id).map_err(|e| AppError::Database(e))?; Ok(())
}

// ═══════════════════════════════════════════════════
//  DAILY CHALLENGES
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_daily_challenges(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<Challenge>, String> {
    Ok(state.get_daily_challenges_list(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(Challenge::from).collect())
}

// ═══════════════════════════════════════════════════
//  HABITS
// ═══════════════════════════════════════════════════

#[tauri::command]
fn create_habit(state: tauri::State<'_, AppDatabase>, profile_id: i64, name: String, icon: String, skill_id: Option<i64>, xp_per_check: i64) -> Result<Habit, String> {
    Ok(Habit::from(state.create_habit(profile_id, &name, &icon, skill_id, xp_per_check).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn get_habits(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<Habit>, String> {
    Ok(state.get_habits(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(Habit::from).collect())
}

#[tauri::command]
fn update_habit(state: tauri::State<'_, AppDatabase>, habit_id: i64, name: String, icon: String, xp_per_check: i64, skill_id: Option<i64>) -> Result<Habit, String> {
    Ok(Habit::from(state.update_habit(habit_id, &name, &icon, xp_per_check, skill_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn delete_habit(state: tauri::State<'_, AppDatabase>, habit_id: i64) -> Result<(), String> {
    state.delete_habit(habit_id).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn check_habit(state: tauri::State<'_, AppDatabase>, profile_id: i64, habit_id: i64) -> Result<GameStats, String> {
    Ok(GameStats::from(state.check_habit(profile_id, habit_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn get_habit_entries(state: tauri::State<'_, AppDatabase>, habit_id: i64, from_date: String, to_date: String) -> Result<Vec<String>, String> {
    state.get_habit_entries(habit_id, &from_date, &to_date).map_err(|e| AppError::Database(e).to_string())
}

// ═══════════════════════════════════════════════════
//  PRESTIGE
// ═══════════════════════════════════════════════════

#[tauri::command]
fn prestige_skill(state: tauri::State<'_, AppDatabase>, profile_id: i64, skill_id: i64) -> Result<Skill, String> {
    Ok(Skill::from(state.prestige_skill(profile_id, skill_id).map_err(|e| AppError::Database(e))?))
}

// ═══════════════════════════════════════════════════
//  EQUIPMENT
// ═══════════════════════════════════════════════════

#[tauri::command]
fn get_equipment(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<Vec<EquipmentItem>, String> {
    Ok(state.get_equipment_defs(profile_id).map_err(|e| AppError::Database(e))?.into_iter().map(EquipmentItem::from).collect())
}

#[tauri::command]
fn equip_item(state: tauri::State<'_, AppDatabase>, profile_id: i64, item_key: String) -> Result<(), String> {
    state.equip_item(profile_id, &item_key).map_err(|e| AppError::Database(e))?; Ok(())
}

#[tauri::command]
fn unequip_item(state: tauri::State<'_, AppDatabase>, profile_id: i64, item_key: String) -> Result<(), String> {
    state.unequip_item(profile_id, &item_key).map_err(|e| AppError::Database(e))?; Ok(())
}

// ═══════════════════════════════════════════════════
//  JOURNAL
// ═══════════════════════════════════════════════════

#[tauri::command]
fn create_journal_entry(state: tauri::State<'_, AppDatabase>, profile_id: i64, content: String, mood: Option<String>) -> Result<JournalEntry, String> {
    Ok(JournalEntry::from(state.create_journal_entry(profile_id, &content, mood.as_deref()).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn get_journal_entries(state: tauri::State<'_, AppDatabase>, profile_id: i64, limit: i64) -> Result<Vec<JournalEntry>, String> {
    Ok(state.get_journal_entries(profile_id, limit).map_err(|e| AppError::Database(e))?.into_iter().map(JournalEntry::from).collect())
}

#[tauri::command]
fn update_journal_entry(state: tauri::State<'_, AppDatabase>, entry_id: i64, content: String, mood: Option<String>) -> Result<JournalEntry, String> {
    Ok(JournalEntry::from(state.update_journal_entry(entry_id, &content, mood.as_deref()).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn delete_journal_entry(state: tauri::State<'_, AppDatabase>, entry_id: i64) -> Result<(), String> {
    state.delete_journal_entry(entry_id).map_err(|e| AppError::Database(e))?; Ok(())
}

// ═══════════════════════════════════════════════════
//  RECURRING QUEST MANAGEMENT
// ═══════════════════════════════════════════════════

#[tauri::command]
fn toggle_recurring(state: tauri::State<'_, AppDatabase>, quest_id: i64) -> Result<Quest, String> {
    Ok(Quest::from(state.toggle_recurring(quest_id).map_err(|e| AppError::Database(e))?))
}

#[tauri::command]
fn update_recurrence_pattern(state: tauri::State<'_, AppDatabase>, quest_id: i64, pattern: String) -> Result<Quest, String> {
    Ok(Quest::from(state.update_recurrence_pattern(quest_id, &pattern).map_err(|e| AppError::Database(e))?))
}

// ═══════════════════════════════════════════════════
//  TEMPLATE SCHEDULING
// ═══════════════════════════════════════════════════

#[tauri::command]
fn update_template_schedule(state: tauri::State<'_, AppDatabase>, template_id: i64, pattern: Option<String>, active: bool) -> Result<(), String> {
    state.update_template_schedule(template_id, pattern.as_deref(), active).map_err(|e| AppError::Database(e))?; Ok(())
}

// ═══════════════════════════════════════════════════
//  SKILL DECAY
// ═══════════════════════════════════════════════════

#[tauri::command]
fn apply_skill_decay(state: tauri::State<'_, AppDatabase>, profile_id: i64) -> Result<(), String> {
    state.apply_skill_decay(profile_id).map_err(|e| AppError::Database(e))?; Ok(())
}

// ═══════════════════════════════════════════════════
//  RESULT STRUCTS
// ═══════════════════════════════════════════════════

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ToggleResult { pub skill: Option<Skill>, pub stats: GameStats, pub new_achievements: Vec<String>, pub first_blood: bool, pub combo_count: i64 }

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct FailResult { pub stats: GameStats }

// ═══════════════════════════════════════════════════
//  APP ENTRY
// ═══════════════════════════════════════════════════

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("failed to resolve app data dir");
            std::fs::create_dir_all(&data_dir).expect("failed to create data dir");
            let db_path = data_dir.join("taskquest.db");
            let database = AppDatabase::new(db_path.to_str().unwrap()).expect("failed to open database");
            database.run_migrations().expect("failed to run migrations");
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_has_data, reset_all_data,
            get_profiles, create_profile, delete_profile, update_profile_theme, update_profile_sound, set_default_skill,
            get_skill_tree, create_skill, delete_skill,
            update_skill, move_skill, archive_skill, unarchive_skill, get_archived_skills, reorder_skills, get_skill_quest_counts,
            get_quests_for_skill, get_all_quests, get_archived_quests,
            create_quest, toggle_quest, fail_quest, delete_quest,
            update_quest_description, toggle_pin_quest, archive_quest, unarchive_quest, reorder_quests,
            reschedule_quest, set_quest_dependency, set_skill_target, get_year_summary,
            get_sub_tasks, create_sub_task, toggle_sub_task, delete_sub_task,
            add_tag_to_quest, remove_tag_from_quest, get_tags_for_quest, get_all_tags,
            create_template, get_templates, delete_template, create_quest_from_template,
            get_game_stats, purchase_item, get_owned_items,
            complete_pomodoro, add_time_to_quest,
            get_achievements,
            get_activity_summary, get_skill_activity, get_weekly_report, get_smart_suggestions,
            export_profile_data, init_profile,
            get_skill_catalog, get_quick_start_bundles, add_catalog_skill, add_catalog_bundle, get_catalog_suggestions,
            get_daily_bounties, recover_failed_quest, activate_skill_boost,
            create_chain, get_chains, set_quest_chain, delete_chain,
            get_daily_challenges,
            create_habit, get_habits, delete_habit, check_habit, get_habit_entries,
            prestige_skill,
            get_equipment, equip_item, unequip_item,
            create_journal_entry, get_journal_entries, delete_journal_entry,
            update_template_schedule,
            apply_skill_decay,
            update_habit, update_journal_entry,
            toggle_recurring, update_recurrence_pattern,
        ])
        .run(tauri::generate_context!())
        .expect("error while running application");
}
