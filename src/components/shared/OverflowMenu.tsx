import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "../../lib/utils";

export interface OverflowMenuSubItem {
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface OverflowMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  submenu?: OverflowMenuSubItem[];
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  className?: string;
}

export function OverflowMenu({ items, className }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
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
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1 rounded-md text-muted hover:text-secondary hover:bg-card-hover transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-[60] bg-card border border-default rounded-xl shadow-xl py-1 min-w-[160px] animate-in">
          {items.map((item, i) => (
            item.submenu ? (
              <div key={i} className="relative group/sub">
                <div
                  className={cn(
                    "w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 transition-colors text-secondary",
                    item.disabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {item.icon}
                  {item.label}
                  <span className="text-muted">›</span>
                </div>
                <div className="absolute left-full top-0 ml-0.5 hidden group-hover/sub:block z-[70] bg-card border border-default rounded-xl shadow-xl py-1 min-w-[180px] max-h-48 overflow-y-auto">
                  {item.submenu.map((sub, j) => (
                    <button
                      key={j}
                      type="button"
                      disabled={sub.disabled}
                      onClick={(e) => { e.stopPropagation(); sub.onClick(); setOpen(false); }}
                      className={cn(
                        "w-full px-3 py-1.5 text-xs text-left hover:bg-card-hover transition-colors",
                        sub.disabled && "opacity-30"
                      )}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                key={i}
                type="button"
                disabled={item.disabled}
                onClick={(e) => { e.stopPropagation(); item.onClick?.(); setOpen(false); }}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors",
                  item.danger ? "text-crimson hover:bg-crimson/10" : "text-secondary hover:bg-card-hover",
                  item.disabled && "opacity-40 cursor-not-allowed"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}
