import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: () => void;
  actionLabel?: string;
}

export function EmptyState({ icon: Icon, title, subtitle, action, actionLabel }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-12 h-12 text-muted mb-4" />
      <h3 className="text-base font-semibold text-secondary mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-xs mb-4">{subtitle}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 bg-electric-blue/15 text-electric-blue border border-electric-blue/20 rounded-lg text-sm font-medium hover:bg-electric-blue/25 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
