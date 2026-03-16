import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";

export function QuickCapture() {
  const quickCaptureOpen = useStore((s) => s.quickCaptureOpen);
  const setQuickCapture = useStore((s) => s.setQuickCapture);
  const createQuest = useStore((s) => s.createQuest);
  const profiles = useStore((s) => s.profiles);
  const activeProfileId = useStore((s) => s.activeProfileId);
  const skills = useStore((s) => s.skills);

  const [input, setInput] = useState("");
  const [toast, setToast] = useState(false);
  const [toastFading, setToastFading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const leafSkills = skills.filter((s) => !skills.some((o) => o.parentSkillId === s.id));
  const defaultSkillId = activeProfile?.defaultSkillId ?? leafSkills[0]?.id ?? 0;

  useEffect(() => {
    if (quickCaptureOpen) {
      setInput("");
      setToast(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [quickCaptureOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickCapture(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setQuickCapture]);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    const skillId = defaultSkillId || leafSkills[0]?.id || null;
    await createQuest({
      questName: name,
      questType: "daily",
      skillId: skillId || undefined,
      difficulty: "normal",
    });
    setInput("");
    setQuickCapture(false);
    setToast(true);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setTimeout(() => setToastFading(true), 1500);
    toastTimeout.current = setTimeout(() => {
      setToast(false);
      setToastFading(false);
    }, 2000);
  };

  if (!quickCaptureOpen) {
    return toast ? (
      <div
        className={`fixed top-1/3 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-lg bg-emerald-glow/20 text-emerald-glow text-sm font-medium animate-in transition-opacity duration-500 ${toastFading ? "opacity-0" : "opacity-100"}`}
      >
        Quest created!
      </div>
    ) : null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/60"
        onClick={() => setQuickCapture(false)}
        aria-hidden
      />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[201] w-full max-w-md px-4" role="dialog" aria-modal="true" aria-label="Quick capture">
        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-default rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Quick capture quest..."
            className="w-full bg-transparent px-4 py-3 text-primary placeholder-muted focus:outline-none text-sm"
            onKeyDown={(e) => e.key === "Escape" && setQuickCapture(false)}
          />
        </form>
        <p className="text-xs text-muted mt-2 text-center">Enter to create · Esc to dismiss</p>
      </div>
    </>
  );
}
