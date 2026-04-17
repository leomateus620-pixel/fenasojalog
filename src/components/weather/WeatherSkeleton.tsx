import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function WeatherSkeleton({ className, compact = false }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    );
  }
  return (
    <div className={cn('rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-3 space-y-2', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}
