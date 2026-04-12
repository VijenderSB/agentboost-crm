import { useEffect, useState } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
import AppSidebar from '@/components/crm/AppSidebar';
import LeadCard from '@/components/crm/LeadCard';
import { supabase } from '@/integrations/supabase/client';
import type { Lead } from '@/types/crm';

export default function FollowupsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'followup')
        .order('followup_date', { ascending: true });
      setLeads((data as unknown as Lead[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const today = new Date().toDateString();
  const todayLeads = leads.filter(l => l.followup_date && new Date(l.followup_date).toDateString() === today);
  const upcomingLeads = leads.filter(l => l.followup_date && new Date(l.followup_date) > new Date());
  const overdueLeads = leads.filter(l => l.followup_date && new Date(l.followup_date) < new Date() && new Date(l.followup_date).toDateString() !== today);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Follow-ups</h1>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : (
          <div className="space-y-6">
            {overdueLeads.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-destructive mb-3">Overdue ({overdueLeads.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {overdueLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
                </div>
              </div>
            )}
            
            <div>
              <h2 className="text-lg font-semibold text-warning mb-3">Today ({todayLeads.length})</h2>
              {todayLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-card rounded-xl border border-border p-6 text-center">No follow-ups scheduled for today</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {todayLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
                </div>
              )}
            </div>

            {upcomingLeads.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Upcoming ({upcomingLeads.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {upcomingLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
