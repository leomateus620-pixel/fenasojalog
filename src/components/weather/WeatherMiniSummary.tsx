import { useEffect, useRef } from 'react';
import { useTransportWeather } from '@/hooks/useTransportWeather';
import { WeatherBadge } from './WeatherBadge';
import { Cloud, Droplets, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WeatherMiniSummary({ transportId, className }: { transportId: string; className?: string }) {
  const { snapshot, isLoading, refresh, isRefreshing } = useTransportWeather(transportId);
  const triggeredRef = useRef(false);

  // Auto-fetch on mount if no snapshot exists yet (legacy transports created before auto-sync)
  useEffect(() => {
    if (!isLoading && !snapshot && !triggeredRef.current && !isRefreshing) {
      triggeredRef.current = true;
      refresh().catch(() => {
        /* silently ignore — will fall back to placeholder */
      });
    }
  }, [isLoading, snapshot, isRefreshing, refresh]);

  if (isLoading || (!snapshot && isRefreshing)) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-[11px] text-muted-foreground', className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>clima…</span>
      </span>
    );
  }

  if (!snapshot) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-[11px] text-muted-foreground/70', className)}>
        <Cloud className="w-3 h-3" />
        <span>—</span>
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] text-muted-foreground', className)}>
      {snapshot.current_icon_uri ? (
        <img src={snapshot.current_icon_uri} alt="" className="w-4 h-4" />
      ) : (
        <Cloud className="w-3 h-3" />
      )}
      <span className="font-medium text-foreground">
        {snapshot.temperature_c != null ? `${Math.round(Number(snapshot.temperature_c))}°` : '—'}
      </span>
      {snapshot.precipitation_probability_pct != null && Number(snapshot.precipitation_probability_pct) > 0 && (
        <span className="inline-flex items-center gap-0.5"><Droplets className="w-3 h-3" />{Math.round(Number(snapshot.precipitation_probability_pct))}%</span>
      )}
      <WeatherBadge level={snapshot.operational_risk_level} size="sm" showLabel={false} />
    </span>
  );
}
