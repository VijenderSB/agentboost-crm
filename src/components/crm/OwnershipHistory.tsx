import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OwnershipRecord {
  id: string;
  owner_id: string;
  owner_name: string;
  started_at: string;
  ended_at: string | null;
  duration: string;
}

export default function OwnershipHistory({ leadId }: { leadId: string }) {
  const [records, setRecords] = useState<OwnershipRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: history }, { data: profiles }] = await Promise.all([
        supabase
          .from('lead_ownership_history')
          .select('*')
          .eq('lead_id', leadId)
          .order('started_at', { ascending: false }),
        supabase.from('profiles').select('id, name'),
      ]);

      const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.name]));

      const mapped = (history || []).map((h: any) => {
        const start = new Date(h.started_at);
        const end = h.ended_at ? new Date(h.ended_at) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return {
          id: h.id,
          owner_id: h.owner_id,
          owner_name: nameMap.get(h.owner_id) || 'Unknown',
          started_at: h.started_at,
          ended_at: h.ended_at,
          duration: days > 0 ? `${days}d ${hours}h` : `${hours}h`,
        };
      });

      setRecords(mapped);
      setLoading(false);
    };
    fetch();
  }, [leadId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading history...</p>;
  if (records.length === 0) return <p className="text-sm text-muted-foreground">No ownership history yet</p>;

  return (
    <div className="space-y-3">
      {records.map((r, i) => (
        <div key={r.id} className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium">
                {r.owner_name}
                {i === 0 && !r.ended_at && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Current</span>
                )}
              </p>
              <span className="text-xs text-muted-foreground">{r.duration}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(r.started_at).toLocaleDateString()} → {r.ended_at ? new Date(r.ended_at).toLocaleDateString() : 'Present'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
