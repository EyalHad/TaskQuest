import { useEffect, useState } from "react";
import { useStore } from "../../store";
import { Confetti } from "./Confetti";

export function AchievementPopup() {
  const achievementPopup = useStore((s) => s.achievementPopup);
  const dismissAchievement = useStore((s) => s.dismissAchievement);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!achievementPopup) return;
    setShowConfetti(true);
    const timer = setTimeout(dismissAchievement, 4000);
    return () => clearTimeout(timer);
  }, [achievementPopup, dismissAchievement]);

  if (!achievementPopup) return null;

  return (
    <>
      {showConfetti && <Confetti particleCount={40} onDone={() => setShowConfetti(false)} />}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-3 px-5 py-3 bg-card border border-gold/40 rounded-xl shadow-xl animate-in"
        onClick={dismissAchievement}
        role="dialog"
        aria-modal="true"
        aria-label="Achievement unlocked"
      >
      <span className="text-2xl">{achievementPopup.icon}</span>
      <div>
        <p className="text-sm font-bold text-gold">{achievementPopup.title}</p>
        <p className="text-xs text-secondary">{achievementPopup.description}</p>
      </div>
    </div>
    </>
  );
}
