import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-default/60", className)} />
  );
}

export function QuestCardSkeleton() {
  return (
    <div className="bg-card border border-subtle rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-5 h-5 rounded-md" />
        <Skeleton className="h-4 flex-1 max-w-[200px]" />
        <Skeleton className="h-4 w-12 rounded-md" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function SkillNodeSkeleton() {
  return (
    <div className="bg-card border border-subtle rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-2 w-full max-w-[120px]" />
        </div>
        <Skeleton className="h-6 w-10 rounded-md" />
      </div>
    </div>
  );
}

export function StatsBarSkeleton() {
  return (
    <div className="px-5 py-3 border-b border-default bg-panel/50 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="px-5 py-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <QuestCardSkeleton key={i} />
      ))}
    </div>
  );
}
