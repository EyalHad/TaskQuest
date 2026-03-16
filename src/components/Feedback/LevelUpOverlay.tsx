import { useEffect, useRef } from "react";
import { useStore } from "../../store";
import { cn } from "../../lib/utils";

export function LevelUpOverlay() {
  const levelUpPending = useStore((s) => s.levelUpPending);
  const dismissLevelUp = useStore((s) => s.dismissLevelUp);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (levelUpPending) {
      timerRef.current = setTimeout(() => {
        dismissLevelUp();
        timerRef.current = null;
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [levelUpPending, dismissLevelUp]);

  const show = !!levelUpPending;
  const isBoss = levelUpPending?.text === "BOSS DEFEATED!";

  if (!show) return null;

  const level = levelUpPending!.level;
  const text = levelUpPending!.text;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={dismissLevelUp}
      role="dialog"
      aria-modal="true"
      aria-label="Level up notification"
      onKeyDown={(e) => e.key === "Escape" && dismissLevelUp()}
    >
      {/* Clickable backdrop - pointer-events enabled for click-to-dismiss */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 28 }).map((_, i) => (
          <Particle key={i} index={i} isBoss={isBoss} />
        ))}
      </div>

      <div className="level-up-text text-center pointer-events-none relative z-10">
        <p
          className={cn(
            "text-5xl font-extrabold tracking-wider",
            isBoss ? "text-crimson" : "text-electric-blue"
          )}
          style={{
            textShadow: isBoss
              ? "0 0 40px rgba(255,51,102,0.6), 0 0 80px rgba(255,51,102,0.3)"
              : "0 0 40px rgba(0,229,255,0.6), 0 0 80px rgba(0,229,255,0.3)",
          }}
        >
          {text}
        </p>
        <p
          className="text-7xl font-black text-gold mt-2"
          style={{
            textShadow: "0 0 30px rgba(255,215,0,0.5)",
          }}
        >
          {level}
        </p>
      </div>
    </div>
  );
}

const COLORS_LEVEL = ["#00E5FF", "#B026FF", "#00FF66", "#FFD700", "#FF3366"];
const COLORS_BOSS = ["#FF3366", "#FFD700", "#B026FF", "#FF3366", "#FFD700"];

function Particle({ index, isBoss }: { index: number; isBoss: boolean }) {
  const COLORS = isBoss ? COLORS_BOSS : COLORS_LEVEL;
  const angle = (index / 28) * 360;
  const distance = 150 + Math.random() * 200;
  const color = COLORS[index % COLORS.length];
  const size = 4 + Math.random() * 6;
  const delay = Math.random() * 0.4;
  const duration = 1.5 + Math.random();

  const tx = Math.cos((angle * Math.PI) / 180) * distance;
  const ty = Math.sin((angle * Math.PI) / 180) * distance;

  return (
    <div
      className="confetti-particle absolute rounded-sm"
      style={{
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        "--tx": `${tx}px`,
        "--ty": `${ty}px`,
      } as React.CSSProperties}
    />
  );
}
