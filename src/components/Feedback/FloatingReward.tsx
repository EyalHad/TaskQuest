import { useState, useCallback, createContext, useContext } from "react";

interface Reward {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

interface FloatingRewardContextType {
  showReward: (text: string, color: string, x: number, y: number) => void;
}

const FloatingRewardContext = createContext<FloatingRewardContextType>({
  showReward: () => {},
});

export function useFloatingReward() {
  return useContext(FloatingRewardContext);
}

let nextId = 0;

export function FloatingRewardProvider({ children }: { children: React.ReactNode }) {
  const [rewards, setRewards] = useState<Reward[]>([]);

  const showReward = useCallback((text: string, color: string, x: number, y: number) => {
    const id = nextId++;
    setRewards((prev) => [...prev, { id, text, color, x, y }]);
    setTimeout(() => {
      setRewards((prev) => prev.filter((r) => r.id !== id));
    }, 1300);
  }, []);

  const removeReward = useCallback((id: number) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <FloatingRewardContext.Provider value={{ showReward }}>
      {children}
      <div className="fixed inset-0 z-[350] pointer-events-none overflow-hidden">
        {rewards.map((r) => (
          <div
            key={r.id}
            className="float-reward absolute text-sm font-black pointer-events-none"
            style={{ left: r.x, top: r.y, color: r.color, textShadow: `0 0 10px ${r.color}40` }}
            onAnimationEnd={() => removeReward(r.id)}
          >
            {r.text}
          </div>
        ))}
      </div>
    </FloatingRewardContext.Provider>
  );
}
