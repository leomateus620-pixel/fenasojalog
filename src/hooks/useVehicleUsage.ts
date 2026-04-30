import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from './useCurrentOrg';

/**
 * Fonte única de verdade para KM rodados = tabela `vehicle_usage`.
 *
 * Cada transporte concluído gera automaticamente 2 registros em `vehicle_usage`
 * ("Ida automática" + "Volta automática") via edge function `transport-lifecycle`,
 * cuja soma já equivale a `transports.km_devolucao - km_retirada`.
 *
 * Por isso NÃO somamos as duas fontes — isso causaria duplicidade (cada
 * viagem contaria 2x). `vehicle_usage.km_rodados` é uma coluna GENERATED ALWAYS
 * (`km_chegada - km_saida`), garantindo integridade.
 */
export function useVehicleUsage(vehicleId?: string) {
  const { orgId } = useCurrentOrg();
  const qc = useQueryClient();

  const { data: usages = [], isLoading } = useQuery({
    queryKey: ['vehicle_usage', orgId, vehicleId],
    queryFn: async () => {
      if (!orgId) return [];
      let query = (supabase as any)
        .from('vehicle_usage')
        .select('*')
        .eq('org_id', orgId)
        .order('retirada_em', { ascending: false });
      if (vehicleId) query = query.eq('vehicle_id', vehicleId);
      const { data } = await query;
      return data || [];
    },
    enabled: !!orgId,
    staleTime: 30000,
  });

  // KM total a partir de vehicle_usage (fonte canônica)
  const totalKm = usages.reduce((sum: number, u: any) => {
    const val = Number(u.km_rodados);
    return sum + (isNaN(val) || val <= 0 ? 0 : val);
  }, 0);

  const kmByVehicle = usages.reduce((map: Record<string, number>, u: any) => {
    if (!u.vehicle_id) return map;
    const val = Number(u.km_rodados);
    if (!isNaN(val) && val > 0) {
      map[u.vehicle_id] = (map[u.vehicle_id] || 0) + val;
    }
    return map;
  }, {} as Record<string, number>);

  const createUsage = useMutation({
    mutationFn: async (usage: Record<string, any>) => {
      const { data, error } = await (supabase as any)
        .from('vehicle_usage')
        .insert({ ...usage, org_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicle_usage'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const updateUsage = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await (supabase as any)
        .from('vehicle_usage')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicle_usage'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  return { usages, totalKm, kmByVehicle, isLoading, createUsage, updateUsage };
}
