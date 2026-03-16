import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

const EMOJI_CATEGORIES = [
  { name: "Activities", emojis: ["⚙️","💻","🏗️","📚","🔢","🔬","🎓","📊","📈","🚀","🎮","🤖","📱","🎯","⚖️","🧠","📧","🌍","🗣️","💰","📖","✍️","💼"] },
  { name: "Home & Craft", emojis: ["🔨","🪚","🪵","🗄️","🏠","🔧","⚡","🚿","🍳","🔥","🥩","🔪","🍞","🍱","☕","🫙","🌱","🪴","🌻","🌿","🎨","📷","🎵","📝","🎬","🚗","🚲","🔌","🧵","🏺"] },
  { name: "Family & Life", emojis: ["💚","❤️","💑","🍷","🎁","💬","👶","🧸","🌅","👥","🤝","🤲","🏘️","🧘","📓","💭","🌊","📋","📄","🗂️","✅","🧹","✨","📅"] },
  { name: "Fitness", emojis: ["💪","🏋️","🏋️‍♂️","🦵","🤸","🏃","🚴","🏊","🚣","🥾","🧘‍♂️","🥋","😴","🥗","💧","🛋️","🏀","⚽","🎾","🧗","🏋️‍♀️","🔄"] },
  { name: "Symbols", emojis: ["⭐","🔥","💎","👑","🛡️","⚔️","🗡️","🔮","🐉","🦁","💡","🌟","🏆","🎖️","🌈","🍀","🦊","🐺","🦅","🐻","🎪","🎲"] },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  trigger?: React.ReactNode;
}

export function EmojiPicker({ value, onChange, trigger }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("mousedown", handle); document.removeEventListener("keydown", handleKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger ? (
        <div onClick={() => setOpen(!open)}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "w-10 h-10 rounded-lg border flex items-center justify-center text-lg transition-colors",
            open ? "bg-electric-blue/10 border-electric-blue/40" : "bg-card border-default hover:border-secondary"
          )}
        >
          {value || "😀"}
        </button>
      )}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-[60] bg-panel border border-default rounded-xl shadow-2xl p-3 w-72 max-h-64 overflow-hidden flex flex-col animate-in">
          <div className="flex gap-1 mb-2 overflow-x-auto shrink-0 pb-1">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setTab(i)}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors",
                  tab === i ? "bg-electric-blue/20 text-electric-blue" : "text-muted hover:text-secondary"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-0.5 overflow-y-auto flex-1">
            {EMOJI_CATEGORIES[tab].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onChange(emoji); setOpen(false); }}
                className={cn(
                  "w-8 h-8 rounded-lg text-base flex items-center justify-center hover:bg-card-hover transition-colors cursor-pointer",
                  value === emoji && "bg-electric-blue/20 ring-1 ring-electric-blue/40"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
