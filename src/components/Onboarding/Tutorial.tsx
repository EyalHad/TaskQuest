import { useState } from "react";
import { useStore } from "../../store";
import { Swords, Shield, ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to TaskQuest!",
    body: "Your real-life tasks become RPG quests. Complete them to earn XP, gold, and level up your skills.",
    color: "text-gold",
  },
  {
    icon: Swords,
    title: "Create Your First Quest",
    body: "Head to the Quest Board and click 'New Quest'. Pick a skill, set difficulty, and start conquering tasks.",
    color: "text-electric-blue",
  },
  {
    icon: Shield,
    title: "Grow Your Skill Tree",
    body: "Every quest earns XP for a skill. Level up skills from Bronze to Silver to Gold tier. Reach level 20 to Prestige!",
    color: "text-emerald-glow",
  },
  {
    icon: ShoppingBag,
    title: "Visit the Shop",
    body: "Spend gold on HP potions, XP boosts, streak freezes, and cosmetic themes. Your rewards, your choice.",
    color: "text-neon-purple",
  },
];

export function Tutorial() {
  const showTutorial = useStore((s) => s.showTutorial);
  const setShowTutorial = useStore((s) => s.setShowTutorial);
  const activeProfileId = useStore((s) => s.activeProfileId);
  const [step, setStep] = useState(0);

  if (!showTutorial) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  const dismiss = () => {
    setShowTutorial(false);
    if (activeProfileId) {
      localStorage.setItem(`taskquest_tutorial_done_${activeProfileId}`, "true");
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Tutorial">
      <div className="bg-card border border-default rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center page-enter">
        <Icon className={cn("w-16 h-16 mx-auto mb-4", current.color)} />
        <h2 className="text-xl font-bold text-primary mb-2">{current.title}</h2>
        <p className="text-sm text-secondary mb-8 leading-relaxed">{current.body}</p>

        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={cn("w-2 h-2 rounded-full transition-colors",
              i === step ? "bg-electric-blue" : i < step ? "bg-electric-blue/40" : "bg-muted"
            )} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={dismiss} className="text-sm text-muted hover:text-secondary transition-colors">
            Skip
          </button>
          <button onClick={next}
            className="px-6 py-2.5 bg-electric-blue/20 text-electric-blue border border-electric-blue/30 rounded-xl text-sm font-semibold hover:bg-electric-blue/30 transition-colors">
            {step < STEPS.length - 1 ? "Next" : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}
