import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore } from "../../store";
import { X, Skull } from "lucide-react";
import { SubTaskList } from "./SubTaskList";
import { startAmbience, stopAmbience, type AmbiencePreset } from "../../lib/ambience";
import { cn } from "../../lib/utils";
import type { SubTask } from "../../types";

export function FocusMode() {
  const focusQuestId = useStore((s) => s.focusQuestId);
  const quests = useStore((s) => s.quests);
  const skills = useStore((s) => s.skills);
  const setFocusQuest = useStore((s) => s.setFocusQuest);
  const toggleQuest = useStore((s) => s.toggleQuest);
  const failQuest = useStore((s) => s.failQuest);
  const updateQuestDescription = useStore((s) => s.updateQuestDescription);
  const startPomodoro = useStore((s) => s.startPomodoro);
  const pausePomodoro = useStore((s) => s.pausePomodoro);
  const resumePomodoro = useStore((s) => s.resumePomodoro);
  const cancelPomodoro = useStore((s) => s.cancelPomodoro);
  const pomodoroQuestId = useStore((s) => s.pomodoroQuestId);
  const pomodoroSecondsLeft = useStore((s) => s.pomodoroSecondsLeft);
  const pomodoroRunning = useStore((s) => s.pomodoroRunning);
  const pomodoroDuration = useStore((s) => s.pomodoroDuration);

  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [editDescription, setEditDescription] = useState("");
  const [ambience, setAmbience] = useState<AmbiencePreset>(
    () => (localStorage.getItem("focus_ambience") as AmbiencePreset) || "off"
  );

  const quest = focusQuestId ? quests.find((q) => q.id === focusQuestId) : null;
  const skillMap = new Map(skills.map((s) => [s.id, s]));
  const skillName = quest?.skillId != null ? skillMap.get(quest.skillId)?.name : undefined;

  const loadSubTasks = useCallback(async () => {
    if (!focusQuestId) return;
    try {
      const data = await invoke<SubTask[]>("get_sub_tasks", { questId: focusQuestId });
      setSubTasks(data);
    } catch {
      setSubTasks([]);
    }
  }, [focusQuestId]);

  useEffect(() => {
    if (quest) {
      setEditDescription(quest.description);
      loadSubTasks();
    }
  }, [quest, loadSubTasks]);

  useEffect(() => {
    if (focusQuestId) startAmbience(ambience);
    else stopAmbience();
    return () => stopAmbience();
  }, [focusQuestId, ambience]);

  useEffect(() => {
    if (!pomodoroRunning || pomodoroSecondsLeft <= 0) return;
    const id = setInterval(() => useStore.getState().tickPomodoro(), 1000);
    return () => clearInterval(id);
  }, [pomodoroRunning, pomodoroSecondsLeft]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!focusQuestId) return;
      if (e.key === "Escape") {
        setFocusQuest(null);
      } else if (e.key === " " && !e.repeat) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
        e.preventDefault();
        toggleQuest(focusQuestId);
        setFocusQuest(null);
      } else if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (pomodoroQuestId === focusQuestId) {
          pomodoroRunning ? pausePomodoro() : resumePomodoro();
        } else {
          startPomodoro(focusQuestId);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusQuestId, pomodoroQuestId, pomodoroRunning, setFocusQuest, toggleQuest, startPomodoro, pausePomodoro, resumePomodoro]);

  const handleSaveDescription = () => {
    if (quest && editDescription !== quest.description) {
      updateQuestDescription(quest.id, editDescription);
    }
  };

  const handleComplete = () => {
    if (quest) {
      toggleQuest(quest.id);
      setFocusQuest(null);
    }
  };

  const handleFail = () => {
    if (quest) {
      failQuest(quest.id);
      setFocusQuest(null);
    }
  };

  if (!focusQuestId || !quest) return null;

  const mm = Math.floor(pomodoroSecondsLeft / 60);
  const ss = pomodoroSecondsLeft % 60;
  const isPomodoroActive = pomodoroQuestId === focusQuestId;

  return (
    <div
      className="fixed inset-0 z-[300] bg-[var(--color-surface)] flex flex-col"
      style={{ backgroundColor: "var(--color-surface)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Focus mode"
    >
      <button
        onClick={() => setFocusQuest(null)}
        className="absolute top-4 right-4 z-10 p-2 text-muted hover:text-primary rounded-lg hover:bg-card-hover transition-colors"
        title="Exit focus (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-primary text-center mb-2">{quest.questName}</h1>
        {skillName && <p className="text-sm text-muted mb-6">{skillName}</p>}

        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onBlur={handleSaveDescription}
          placeholder="Notes / description..."
          className="w-full bg-panel/80 border border-default rounded-xl px-4 py-3 text-primary placeholder-muted resize-none min-h-[120px] focus:outline-none focus:border-electric-blue/50 mb-6"
        />

        {subTasks.length > 0 && (
          <div className="w-full mb-6">
            <SubTaskList questId={quest.id} subTasks={subTasks} onUpdate={loadSubTasks} />
          </div>
        )}

        {isPomodoroActive ? (
          <div className="mb-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(30, 41, 59, 0.8)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="var(--color-electric-blue)"
                  strokeWidth="8"
                  strokeDasharray={`${(pomodoroSecondsLeft / (pomodoroDuration || 1500)) * 283} 283`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-mono font-bold text-electric-blue tabular-nums">
                  {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </span>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => (pomodoroRunning ? pausePomodoro() : resumePomodoro())}
                className="px-4 py-2 text-sm font-medium bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30"
              >
                {pomodoroRunning ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => cancelPomodoro()}
                className="px-4 py-2 text-sm text-secondary hover:text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => startPomodoro(focusQuestId)}
            className="mb-8 px-6 py-2 text-sm font-medium bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30 border border-electric-blue/30"
          >
            Start Pomodoro (25 min)
          </button>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleComplete}
            className="px-8 py-3 text-lg font-bold bg-emerald-glow/20 text-emerald-glow rounded-xl border-2 border-emerald-glow/50 hover:bg-emerald-glow/30 hover:shadow-[0_0_20px_rgba(0,255,102,0.2)] transition-all"
          >
            Complete Quest
          </button>
          <button
            onClick={handleFail}
            className="px-6 py-3 text-sm font-medium text-crimson hover:bg-crimson/10 rounded-xl border border-crimson/30 transition-colors flex items-center gap-2"
          >
            <Skull className="w-4 h-4" />
            Fail
          </button>
        </div>

        <div className="flex items-center gap-2 mt-8">
          {(["off", "rain", "campfire", "dungeon", "lofi"] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => { setAmbience(preset); localStorage.setItem("focus_ambience", preset); }}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize",
                ambience === preset
                  ? "bg-electric-blue/15 text-electric-blue border-electric-blue/30"
                  : "bg-card text-muted border-subtle hover:text-secondary"
              )}
            >
              {preset === "off" ? "🔇 Off" : preset === "rain" ? "🌧️ Rain" : preset === "campfire" ? "🔥 Fire" : preset === "dungeon" ? "🏰 Dungeon" : "🎵 Lo-fi"}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted">
          Space = Complete · Esc = Exit · P = Pomodoro
        </p>
      </div>
    </div>
  );
}
