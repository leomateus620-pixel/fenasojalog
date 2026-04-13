import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from './useCurrentOrg';

export function useExpenseCategories() {
  const { orgId } = useCurrentOrg();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['expense-categories', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any)
        .from('expense_categories')
        .select('*')
        .eq('org_id', orgId)
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
    staleTime: 60000,
  });

  return { categories, isLoading };
}
