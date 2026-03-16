import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore } from "../../store";
import { THEMES, THEME_KEYS } from "../../lib/themes";
import { cn } from "../../lib/utils";
import {
  Palette,
  Volume2,
  Target,
  Timer,
  Download,
  ChevronRight,
  Bell,
  Skull,
  Sun,
  Moon,
} from "lucide-react";

const SOUND_PACKS = ["silent", "fantasy", "scifi", "minimal"] as const;
const SOUND_DESCRIPTIONS: Record<string, string> = {
  silent: "No audio feedback",
  fantasy: "Warm sine-wave tones",
  scifi: "Sharp sawtooth synths",
  minimal: "Soft triangle waves",
};

const THEME_LABELS: Record<string, string> = {
  default: "Neon Dark",
  forest: "Forest",
  ocean: "Ocean",
  inferno: "Inferno",
  royal: "Royal",
};

const POMODORO_PRESETS = [
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
  { label: "25 min", seconds: 1500 },
  { label: "30 min", seconds: 1800 },
  { label: "45 min", seconds: 2700 },
  { label: "60 min", seconds: 3600 },
];

export function Settings() {
  const profiles = useStore((s) => s.profiles);
  const activeProfileId = useStore((s) => s.activeProfileId);
  const skills = useStore((s) => s.skills);
  const updateProfileTheme = useStore((s) => s.updateProfileTheme);
  const updateProfileSound = useStore((s) => s.updateProfileSound);
  const setDefaultSkill = useStore((s) => s.setDefaultSkill);
  const exportProfileData = useStore((s) => s.exportProfileData);
  const pomodoroDuration = useStore((s) => s.pomodoroDuration);
  const setPomodoroDuration = useStore((s) => s.setPomodoroDuration);
  const skillDecayEnabled = useStore((s) => s.skillDecayEnabled);
  const toggleSkillDecay = useStore((s) => s.toggleSkillDecay);
  const colorMode = useStore((s) => s.colorMode);
  const toggleColorMode = useStore((s) => s.toggleColorMode);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const activeTheme = activeProfile?.activeTheme ?? "default";
  const activeSound = activeProfile?.soundPack ?? "silent";
  const defaultSkillId = activeProfile?.defaultSkillId ?? null;

  const leafSkills = skills.filter(
    (s) => !skills.some((o) => o.parentSkillId === s.id)
  );

  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [exportFeedback, setExportFeedback] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("taskquest_notifications") === "true"
  );

  useEffect(() => {
    if (activeProfileId) {
      invoke<string[]>("get_owned_items", { profileId: activeProfileId }).then(setOwnedItems).catch(() => {});
    }
  }, [activeProfileId]);

  const handleExport = async () => {
    const data = await exportProfileData();
    if (data == null) return;
    const json = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setExportFeedback(true);
      setTimeout(() => setExportFeedback(false), 2000);
    } catch {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taskquest-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportFeedback(true);
      setTimeout(() => setExportFeedback(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel">
        <h1 className="text-lg font-bold text-primary">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* ── Appearance ── */}
        <Section icon={Sun} title="Appearance" iconColor="text-gold">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleColorMode}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all bg-card border-default text-secondary hover:bg-card-hover"
            >
              {colorMode === "dark" ? (
                <><Moon className="w-4 h-4 text-electric-blue" /> Dark</>
              ) : (
                <><Sun className="w-4 h-4 text-gold" /> Light</>
              )}
            </button>
            <p className="text-xs text-muted">
              {colorMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            </p>
          </div>
        </Section>

        {/* ── Theme ── */}
        <Section icon={Palette} title="Theme" iconColor="text-neon-purple">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THEME_KEYS.map((key) => {
              const themeSet = THEMES[key];
              const colors = themeSet[colorMode];
              const isActive = activeTheme === key;
              const isOwned = key === "default" || ownedItems.includes(`theme_${key}`);
              return (
                <button
                  key={key}
                  onClick={() => !isActive && isOwned && updateProfileTheme(key)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    isActive
                      ? "bg-electric-blue/10 border-electric-blue/40 shadow-[0_0_12px_rgba(0,229,255,0.1)]"
                      : isOwned
                        ? "bg-card border-default hover:border-secondary"
                        : "bg-card border-default opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex gap-1 shrink-0">
                    {(["surface", "electric-blue", "emerald-glow", "crimson", "gold", "neon-purple"] as const).map(
                      (c) => (
                        <div
                          key={c}
                          className="w-4 h-4 rounded-full border border-default/50"
                          style={{ backgroundColor: (colors as unknown as Record<string, string>)[c] }}
                        />
                      )
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium flex-1",
                      isActive ? "text-electric-blue" : "text-secondary"
                    )}
                  >
                    {THEME_LABELS[key] ?? key}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-semibold text-electric-blue uppercase tracking-wider">
                      Active
                    </span>
                  )}
                  {!isOwned && (
                    <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                      🔒 Shop
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Sound Pack ── */}
        <Section icon={Volume2} title="Sound Pack" iconColor="text-electric-blue">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SOUND_PACKS.map((pack) => {
              const isActive = activeSound === pack;
              return (
                <button
                  key={pack}
                  onClick={() => !isActive && updateProfileSound(pack)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    isActive
                      ? "bg-electric-blue/10 border-electric-blue/40"
                      : "bg-card border-default hover:border-secondary"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium capitalize",
                        isActive ? "text-electric-blue" : "text-secondary"
                      )}
                    >
                      {pack}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {SOUND_DESCRIPTIONS[pack]}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-semibold text-electric-blue uppercase tracking-wider shrink-0">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Default Skill ── */}
        <Section icon={Target} title="Default Skill" iconColor="text-emerald-glow">
          <p className="text-xs text-muted mb-3">
            Pre-selected skill when creating new quests.
          </p>
          <select
            value={defaultSkillId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setDefaultSkill(val ? Number(val) : null);
            }}
            className="w-full max-w-sm bg-card border border-default rounded-xl px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-electric-blue/50"
          >
            <option value="">None (use first available)</option>
            {leafSkills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
        </Section>

        {/* ── Pomodoro Duration ── */}
        <Section icon={Timer} title="Pomodoro Duration" iconColor="text-gold">
          <p className="text-xs text-muted mb-3">
            How long each focus session lasts.
          </p>
          <div className="flex flex-wrap gap-2">
            {POMODORO_PRESETS.map((preset) => {
              const isActive = pomodoroDuration === preset.seconds;
              return (
                <button
                  key={preset.seconds}
                  onClick={() => setPomodoroDuration(preset.seconds)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                    isActive
                      ? "bg-gold/15 text-gold border-gold/30"
                      : "bg-card text-secondary border-default hover:text-primary hover:border-secondary"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Notifications ── */}
        <Section icon={Bell} title="Notifications" iconColor="text-gold">
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <p className="text-sm text-secondary">Desktop Notifications</p>
              <p className="text-xs text-muted">Reminders for overdue and due-today quests</p>
            </div>
            <button
              onClick={() => {
                const next = !notificationsEnabled;
                setNotificationsEnabled(next);
                localStorage.setItem("taskquest_notifications", String(next));
              }}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notificationsEnabled ? "bg-electric-blue/30" : "bg-default"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                notificationsEnabled ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </Section>

        {/* ── Skill Decay ── */}
        <Section icon={Skull} title="Skill Decay" iconColor="text-amber-500">
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <p className="text-sm text-secondary">Enable Skill Decay</p>
              <p className="text-xs text-muted">Skills lose XP if inactive for 7+ days</p>
            </div>
            <button
              onClick={toggleSkillDecay}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                skillDecayEnabled ? "bg-amber-500/30" : "bg-default"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                skillDecayEnabled ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
          {skillDecayEnabled && (
            <p className="text-[10px] text-amber-400 mt-2">
              ⚠️ Active — skills idle for 7+ days will lose up to 10 XP per extra inactive day
            </p>
          )}
        </Section>

        {/* ── Data ── */}
        <Section icon={Download} title="Data" iconColor="text-secondary">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-default text-sm text-secondary hover:text-primary hover:border-secondary transition-colors"
          >
            <Download className="w-4 h-4" />
            {exportFeedback ? "Copied to clipboard!" : "Export Profile Data"}
            {!exportFeedback && <ChevronRight className="w-4 h-4 text-muted ml-auto" />}
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  iconColor,
  children,
}: {
  icon: typeof Palette;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-4">
        <Icon className={cn("w-4 h-4", iconColor)} />
        {title}
      </h2>
      {children}
    </section>
  );
}
