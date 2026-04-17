import { useTransportWeather } from '@/hooks/useTransportWeather';
import { WeatherBadge } from './WeatherBadge';
import { WeatherSkeleton } from './WeatherSkeleton';
import { WeatherAlertPill } from './WeatherAlertPill';
import { Cloud, Droplets, Wind, RefreshCw, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function TransportWeatherCard({ transportId, className }: { transportId: string; className?: string }) {
  const { snapshot, isLoading, isStale, refresh, isRefreshing } = useTransportWeather(transportId);

  if (isLoading) return <WeatherSkeleton className={className} />;

  if (!snapshot) {
    return (
      <div className={cn('rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-3 flex items-center justify-between', className)}>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <CloudOff className="w-4 h-4" />
          <span>Clima indisponível</span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => refresh()} disabled={isRefreshing}>
          <RefreshCw className={cn('w-3 h-3 mr-1', isRefreshing && 'animate-spin')} />
          Buscar
        </Button>
      </div>
    );
  }

  const alerts = (snapshot.alerts_summary_jsonb ?? []) as any[];
  const updatedMin = Math.max(0, Math.round((Date.now() - new Date(snapshot.fetched_at).getTime()) / 60_000));

  return (
    <div className={cn('rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-3 space-y-2', className)}>
      <div className="flex items-start gap-3">
        {snapshot.current_icon_uri ? (
          <img src={snapshot.current_icon_uri} alt={snapshot.current_condition_label ?? 'clima'} className="w-10 h-10 shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
            <Cloud className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground leading-none">
              {snapshot.temperature_c != null ? `${Math.round(Number(snapshot.temperature_c))}°` : '—'}
            </span>
            <span className="text-xs text-muted-foreground truncate">{snapshot.current_condition_label ?? '—'}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {snapshot.city_name ?? 'Localização'} · atualizado há {updatedMin} min{isStale && ' · atualizando...'}
          </p>
        </div>
        <WeatherBadge level={snapshot.operational_risk_level} size="sm" />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {snapshot.precipitation_probability_pct != null && (
          <span className="inline-flex items-center gap-1"><Droplets className="w-3 h-3" />{Math.round(Number(snapshot.precipitation_probability_pct))}%</span>
        )}
        {snapshot.wind_speed_kph != null && (
          <span className="inline-flex items-center gap-1"><Wind className="w-3 h-3" />{Math.round(Number(snapshot.wind_speed_kph))} km/h</span>
        )}
        {snapshot.feels_like_c != null && (
          <span>Sensação {Math.round(Number(snapshot.feels_like_c))}°</span>
        )}
      </div>
      {snapshot.operational_risk_reason && snapshot.operational_risk_level !== 'favoravel' && (
        <p className="text-[11px] text-foreground/80 leading-snug">{snapshot.operational_risk_reason}</p>
      )}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {alerts.slice(0, 3).map((a, i) => <WeatherAlertPill key={i} alert={a} />)}
        </div>
      )}
    </div>
  );
}
