import { useEffect, useState } from "react";

interface Props {
  xp: number;
  boosted?: boolean;
  onDone: () => void;
}

export function XpFlyup({ xp, boosted, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <span className={`xp-flyup pointer-events-none absolute -top-2 right-4 z-30 text-sm font-bold ${boosted ? "text-gold" : "text-emerald-glow"}`}>
      +{xp} XP
    </span>
  );
}
