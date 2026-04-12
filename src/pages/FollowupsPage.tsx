import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import AppSidebar from '@/components/crm/AppSidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { LeadStatusBadge, TemperatureBadge } from '@/components/crm/StatusBadge';
import type { Lead } from '@/types/crm';

interface FollowupWithLead {
  id: string;
  followup_date: string;
  completed: boolean;
  assigned_to: string;
  lead: Lead;
}

export default function FollowupsPage() {
  const { user } = useAuth();
  const [followups, setFollowups] = useState<FollowupWithLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowups = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('followups')
      .select('*, lead:leads(*)')
      .eq('completed', false)
      .order('followup_date', { ascending: true });

    if (data) {
      setFollowups(
        (data as any[]).map(f => ({
          id: f.id,
          followup_date: f.followup_date,
          completed: f.completed,
          assigned_to: f.assigned_to,
          lead: f.lead as Lead,
        })).filter(f => f.lead)
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchFollowups(); }, []);

  const markDone = async (id: string) => {
    await supabase.from('followups').update({ completed: true }).eq('id', id);
    toast.success('Follow-up completed');
    fetchFollowups();
  };

  const now = new Date();
  const todayStr = now.toDateString();

  const overdue = followups.filter(f => {
    const d = new Date(f.followup_date);
    return d < now && d.toDateString() !== todayStr;
  });
  const today = followups.filter(f => new Date(f.followup_date).toDateString() === todayStr);
  const upcoming = followups.filter(f => new Date(f.followup_date) > now && new Date(f.followup_date).toDateString() !== todayStr);

  const renderGroup = (items: FollowupWithLead[]) => (
    <div className="space-y-2">
      {items.map(f => (
        <Link key={f.id} to={`/leads/${f.lead.id}`} className="block">
          <div className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{f.lead.name || 'Unknown'}</span>
                <LeadStatusBadge status={f.lead.status} />
                <TemperatureBadge temperature={f.lead.temperature} />
              </div>
              <div className="text-sm text-muted-foreground">
                {f.lead.mobile} · {f.lead.city || 'N/A'} · Due: {new Date(f.followup_date).toLocaleDateString()}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={(e) => { e.preventDefault(); markDone(f.id); }}
            >
              <CheckCircle className="w-4 h-4" /> Done
            </Button>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Follow-ups</h1>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : followups.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 bg-card rounded-xl border border-border">
            <p className="text-lg font-medium">No pending follow-ups</p>
          </div>
        ) : (
          <div className="space-y-6">
            {overdue.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-destructive mb-3">Overdue ({overdue.length})</h2>
                {renderGroup(overdue)}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-warning mb-3">Today ({today.length})</h2>
              {today.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-card rounded-xl border border-border p-6 text-center">No follow-ups scheduled for today</p>
              ) : renderGroup(today)}
            </div>

            {upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Upcoming ({upcoming.length})</h2>
                {renderGroup(upcoming)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
