import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTransportWeather(transportId: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['transport-weather', transportId],
    enabled: !!transportId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transport_weather_snapshots')
        .select('*')
        .eq('transport_id', transportId)
        .eq('is_latest', true)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  const refresh = useMutation({
    mutationFn: async (force: boolean = false) => {
      if (!transportId) return null;
      const { data, error } = await supabase.functions.invoke('weather-service', {
        body: { action: 'refresh', transport_id: transportId, force },
      });
      if (error) throw error;
      return data?.snapshot ?? null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport-weather', transportId] });
    },
  });

  // background refetch if expired
  const snapshot = query.data;
  const isStale = snapshot && new Date(snapshot.valid_until).getTime() < Date.now();
  if (isStale && !refresh.isPending) {
    // fire-and-forget background refresh
    refresh.mutate(false);
  }

  return {
    snapshot,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    isStale: !!isStale,
    refresh: () => refresh.mutateAsync(true),
    isRefreshing: refresh.isPending,
  };
}
