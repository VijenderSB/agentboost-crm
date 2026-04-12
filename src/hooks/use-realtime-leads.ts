import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeLeads(queryKeys: string[][]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('lead-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}
