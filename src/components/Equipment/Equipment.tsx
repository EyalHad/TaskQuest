import { useEffect } from "react";
import { useStore } from "../../store";
import { Shield, Lock, Check } from "lucide-react";
import { cn } from "../../lib/utils";

const RARITY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  legendary: { border: "border-gold/50", bg: "bg-gold/10", text: "text-gold" },
  epic: { border: "border-neon-purple/40", bg: "bg-neon-purple/10", text: "text-neon-purple" },
  rare: { border: "border-electric-blue/30", bg: "bg-electric-blue/5", text: "text-electric-blue" },
  common: { border: "border-default", bg: "bg-card/50", text: "text-secondary" },
};

export function Equipment() {
  const equipment = useStore((s) => s.equipment);
  const loadEquipment = useStore((s) => s.loadEquipment);
  const equipItem = useStore((s) => s.equipItem);
  const unequipItem = useStore((s) => s.unequipItem);

  useEffect(() => { loadEquipment(); }, [loadEquipment]);

  const equippedCount = equipment.filter((e) => e.equipped).length;
  const equipped = equipment.filter((e) => e.equipped);
  const unequipped = equipment.filter((e) => !e.equipped);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-default bg-panel flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <Shield className="w-5 h-5 text-electric-blue" /> Equipment
        </h1>
        <span className="text-sm text-secondary">{equippedCount}/3 Slots Used</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {equipped.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-emerald-glow uppercase tracking-wider mb-3">Equipped</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {equipped.map((item) => {
                const r = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                return (
                  <div key={item.key} className={cn("p-4 rounded-xl border", r.border, r.bg, "ring-1 ring-emerald-glow/20")}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-primary">{item.name}</p>
                          {item.equipped && <span className="text-[10px] font-semibold text-emerald-glow bg-emerald-glow/10 px-2 py-0.5 rounded-full">Active</span>}
                        </div>
                        <p className={cn("text-[10px] font-semibold uppercase", r.text)}>{item.rarity}</p>
                      </div>
                    </div>
                    <p className="text-xs text-secondary mb-3">{item.description}</p>
                    <p className="text-xs text-secondary mt-1 mb-3">
                      {item.effectType === "xp_category" && `+${Math.round(item.effectValue * 100)}% XP for ${item.unlockAchievement.includes("STR") ? "STR" : item.unlockAchievement.includes("INT") ? "INT" : item.unlockAchievement.includes("CRAFT") ? "CRAFT" : "category"} skills`}
                      {item.effectType === "hp_regen" && `+${item.effectValue} HP per quest completion`}
                      {item.effectType === "gold_bonus" && `+${item.effectValue} gold per quest completion`}
                      {item.effectType === "burnout_reduction" && `Burnout penalty reduced by ${Math.round(item.effectValue * 100)}%`}
                      {item.effectType === "xp_all" && `+${Math.round(item.effectValue * 100)}% XP on all skills`}
                    </p>
                    <button onClick={() => unequipItem(item.key)}
                      className="w-full py-1.5 text-xs font-medium text-crimson border border-crimson/20 rounded-lg hover:bg-crimson/10 transition-colors">
                      Unequip
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Armory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {unequipped.map((item) => {
              const r = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
              return (
                <div key={item.key} className={cn("p-4 rounded-xl border", r.border, r.bg, !item.unlocked && "opacity-40")}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{item.unlocked ? item.icon : "❓"}</span>
                    <div>
                      <p className="text-sm font-bold text-primary">{item.unlocked ? item.name : "???"}</p>
                      <p className={cn("text-[10px] font-semibold uppercase", r.text)}>{item.rarity}</p>
                    </div>
                  </div>
                  <p className="text-xs text-secondary mb-3">{item.unlocked ? item.description : "Unlock to reveal"}</p>
                  {item.unlocked && (
                    <p className="text-xs text-secondary mt-1 mb-3">
                      {item.effectType === "xp_category" && `+${Math.round(item.effectValue * 100)}% XP for ${item.unlockAchievement.includes("STR") ? "STR" : item.unlockAchievement.includes("INT") ? "INT" : item.unlockAchievement.includes("CRAFT") ? "CRAFT" : "category"} skills`}
                      {item.effectType === "hp_regen" && `+${item.effectValue} HP per quest completion`}
                      {item.effectType === "gold_bonus" && `+${item.effectValue} gold per quest completion`}
                      {item.effectType === "burnout_reduction" && `Burnout penalty reduced by ${Math.round(item.effectValue * 100)}%`}
                      {item.effectType === "xp_all" && `+${Math.round(item.effectValue * 100)}% XP on all skills`}
                    </p>
                  )}
                  {item.unlocked ? (
                    <button onClick={() => equipItem(item.key)} disabled={equippedCount >= 3}
                      className="w-full py-1.5 text-xs font-medium text-electric-blue border border-electric-blue/20 rounded-lg hover:bg-electric-blue/10 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
                      <Check className="w-3 h-3" /> Equip
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted">
                      <Lock className="w-3 h-3" /> Locked
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
