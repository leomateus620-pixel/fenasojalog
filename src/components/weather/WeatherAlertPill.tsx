import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function WeatherAlertPill({
  alert,
  className,
}: {
  alert: { title?: string; description?: string; severity?: string };
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30 text-[10px] font-medium max-w-[180px]',
              className,
            )}
          >
            <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{alert.title ?? 'Alerta meteorológico'}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium">{alert.title ?? 'Alerta meteorológico'}</p>
          {alert.description && <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
