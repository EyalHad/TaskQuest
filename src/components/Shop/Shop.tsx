import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore } from "../../store";
import { Coins, Heart, Zap, Snowflake, ArrowUp, Check, Palette, Volume2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { THEMES, THEME_KEYS } from "../../lib/themes";

type TabId = "potions" | "boosts" | "themes";

interface ShopItem {
  key: string;
  name: string;
  description: string;
  cost: number;
  icon: typeof Heart;
  iconColor: string;
}

const POTIONS: ShopItem[] = [
  { key: "hp_potion_small", name: "HP Potion", description: "Restore 25 HP", cost: 30, icon: Heart, iconColor: "text-crimson" },
  { key: "hp_potion_large", name: "Large HP Potion", description: "Restore 50 HP", cost: 60, icon: Heart, iconColor: "text-crimson" },
  { key: "hp_potion_full", name: "Full Heal", description: "Restore HP to max", cost: 100, icon: Heart, iconColor: "text-emerald-glow" },
];

const BOOSTS: ShopItem[] = [
  { key: "streak_freeze", name: "Streak Freeze", description: "Protect your streak for 1 day", cost: 50, icon: Snowflake, iconColor: "text-electric-blue" },
  { key: "xp_boost", name: "XP Boost ×5", description: "Next 5 quests earn 2× XP", cost: 80, icon: Zap, iconColor: "text-gold" },
  { key: "max_hp_upgrade", name: "Max HP +10", description: "Permanently increase max HP (cap 200)", cost: 150, icon: ArrowUp, iconColor: "text-neon-purple" },
  { key: "skill_focus_1h", name: "Skill Focus (1h)", description: "2× XP for one skill for 1 hour", cost: 25, icon: Zap, iconColor: "text-electric-blue" },
  { key: "skill_surge_1d", name: "Skill Surge (1d)", description: "1.5× XP for one skill for 24 hours", cost: 60, icon: Zap, iconColor: "text-neon-purple" },
];

const THEME_ITEMS = THEME_KEYS.filter(k => k !== "default").map(k => ({
  key: `theme_${k}`,
  name: k.charAt(0).toUpperCase() + k.slice(1),
  colors: THEMES[k],
  cost: 200,
}));

const SOUND_PACKS = ["silent", "fantasy", "scifi", "minimal"] as const;

export function Shop() {
  const gold = useStore((s) => s.stats.gold);
  const purchaseItem = useStore((s) => s.purchaseItem);
  const skills = useStore((s) => s.skills);
  const activateSkillBoost = useStore((s) => s.activateSkillBoost);
  const updateProfileTheme = useStore((s) => s.updateProfileTheme);
  const updateProfileSound = useStore((s) => s.updateProfileSound);
  const loading = useStore((s) => s.loading);
  const activeProfileId = useStore((s) => s.activeProfileId);
  const profiles = useStore((s) => s.profiles);
  const colorMode = useStore((s) => s.colorMode);
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const [tab, setTab] = useState<TabId>("potions");
  const [purchased, setPurchased] = useState<string | null>(null);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [boostPending, setBoostPending] = useState<{ mult: number; hours: number } | null>(null);

  useEffect(() => {
    if (activeProfileId) {
      invoke<string[]>("get_owned_items", { profileId: activeProfileId }).then(setOwnedItems).catch(() => {});
    }
  }, [activeProfileId, purchased]);

  const handleBuy = async (key: string) => {
    await purchaseItem(key);
    setPurchased(key);
    setTimeout(() => setPurchased(null), 1500);
    if (key === "skill_focus_1h") {
      setBoostPending({ mult: 2.0, hours: 1 });
    } else if (key === "skill_surge_1d") {
      setBoostPending({ mult: 1.5, hours: 24 });
    }
  };

  const handleActivateBoost = async (skillId: number) => {
    if (!boostPending) return;
    await activateSkillBoost(skillId, boostPending.mult, boostPending.hours);
    setBoostPending(null);
  };

  const handleEquipTheme = async (theme: string) => {
    await updateProfileTheme(theme);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary">Shop</h1>
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-gold" />
          <span className="text-sm font-bold text-gold tabular-nums">{gold}g</span>
        </div>
      </div>

      <div className="shrink-0 flex gap-1 px-5 py-3 border-b border-default bg-panel/50">
        {(["potions", "boosts", "themes"] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
              tab === t
                ? "bg-electric-blue/20 text-electric-blue border border-electric-blue/30"
                : "bg-card text-secondary border border-subtle hover:text-primary"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {tab !== "themes" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(tab === "potions" ? POTIONS : BOOSTS).map((item) => {
              const canAfford = gold >= item.cost;
              const justPurchased = purchased === item.key;
              const Icon = item.icon;
              return (
                <div key={item.key} className={cn(
                  "bg-card border rounded-xl p-4 flex flex-col justify-between transition-all duration-300",
                  canAfford ? "border-subtle hover:border-electric-blue/30" : "border-subtle opacity-50",
                  justPurchased && "border-emerald-glow/50 shadow-[0_0_20px_rgba(0,255,102,0.15)]"
                )}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-5 h-5", item.iconColor)} />
                        <h3 className="text-sm font-semibold text-primary">{item.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-gold" />
                        <span className="text-xs font-bold text-gold tabular-nums">{item.cost}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted">{item.description}</p>
                  </div>
                  <button
                    disabled={!canAfford || loading}
                    onClick={() => handleBuy(item.key)}
                    title={!canAfford ? "Not enough gold" : undefined}
                    className={cn(
                      "mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all border",
                      justPurchased ? "bg-emerald-glow/20 text-emerald-glow border-emerald-glow/30"
                        : canAfford ? "bg-electric-blue/15 text-electric-blue border-electric-blue/20 hover:bg-electric-blue/25"
                        : "bg-default text-muted border-default cursor-not-allowed"
                    )}
                  >
                    {justPurchased ? <><Check className="w-3 h-3" /> Purchased!</> : "Buy"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === "themes" && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-secondary flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-neon-purple" /> Color Themes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {THEME_ITEMS.map((t) => {
                  const owned = ownedItems.includes(t.key);
                  const isActive = activeProfile?.activeTheme === t.key.replace("theme_", "");
                  const canAfford = gold >= t.cost;
                  const justPurchased = purchased === t.key;
                  return (
                    <div key={t.key} className={cn(
                      "bg-card border rounded-xl p-4 transition-all duration-300",
                      isActive ? "border-neon-purple/40 shadow-[0_0_15px_rgba(176,38,255,0.15)]"
                        : owned ? "border-subtle hover:border-neon-purple/30" : canAfford ? "border-subtle hover:border-electric-blue/30" : "border-subtle opacity-50",
                      justPurchased && "border-emerald-glow/50 shadow-[0_0_20px_rgba(0,255,102,0.15)]"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-primary">{t.name}</h3>
                        {!owned && (
                          <div className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-gold" />
                            <span className="text-xs font-bold text-gold">{t.cost}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        {(["surface", "electric-blue", "emerald-glow", "crimson", "gold", "neon-purple"] as const).map((c) => (
                          <div key={c} className="w-6 h-6 rounded-full border border-default" style={{ backgroundColor: (t.colors[colorMode] as unknown as Record<string, string>)[c] }} />
                        ))}
                      </div>
                      {isActive ? (
                        <div className="w-full text-center py-2 rounded-lg text-xs font-medium bg-neon-purple/15 text-neon-purple border border-neon-purple/30">
                          Equipped
                        </div>
                      ) : owned ? (
                        <button onClick={() => handleEquipTheme(t.key.replace("theme_", ""))}
                          className="w-full py-2 rounded-lg text-xs font-medium bg-neon-purple/15 text-neon-purple border border-neon-purple/20 hover:bg-neon-purple/25 transition-colors">
                          Equip
                        </button>
                      ) : (
                        <button disabled={!canAfford || loading} onClick={() => handleBuy(t.key)}
                          title={!canAfford ? "Not enough gold" : undefined}
                          className={cn(
                            "w-full py-2 rounded-lg text-xs font-medium transition-all border",
                            justPurchased ? "bg-emerald-glow/20 text-emerald-glow border-emerald-glow/30"
                              : canAfford ? "bg-electric-blue/15 text-electric-blue border-electric-blue/20 hover:bg-electric-blue/25"
                              : "bg-default text-muted border-default cursor-not-allowed"
                          )}>
                          {justPurchased ? "Purchased!" : "Buy"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-secondary flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-electric-blue" /> Sound Pack
              </h2>
              <div className="flex gap-2 flex-wrap">
                {SOUND_PACKS.map((pack) => {
                  const isActive = activeProfile?.soundPack === pack;
                  return (
                    <button key={pack} onClick={() => updateProfileSound(pack)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all border",
                        isActive
                          ? "bg-electric-blue/20 text-electric-blue border-electric-blue/30"
                          : "bg-card text-secondary border-subtle hover:text-primary hover:border-secondary"
                      )}>
                      {pack}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {boostPending && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setBoostPending(null)}>
          <div className="bg-panel border border-default rounded-xl p-5 w-80 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-primary mb-3">Choose a skill to boost ({boostPending.mult}× XP for {boostPending.hours}h)</h3>
            <div className="space-y-1.5">
              {skills.filter(s => s.parentSkillId !== null && !skills.some(other => other.parentSkillId === s.id)).map(s => (
                <button key={s.id} onClick={() => handleActivateBoost(s.id)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-card border border-subtle hover:border-electric-blue/30 transition-colors flex items-center gap-2">
                  <span>{s.icon || "⭐"}</span>
                  <span className="text-sm text-primary">{s.name}</span>
                  <span className="text-xs text-muted ml-auto">Lv.{s.level}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setBoostPending(null)}
              className="mt-3 w-full py-2 text-xs text-muted hover:text-secondary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
