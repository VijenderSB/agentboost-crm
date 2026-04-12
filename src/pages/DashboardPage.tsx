import { Users, Flame, TrendingUp, Clock, Snowflake, CheckCircle, XCircle, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AppSidebar from '@/components/crm/AppSidebar';
import StatCard from '@/components/crm/StatCard';
import LeadCard from '@/components/crm/LeadCard';
import AddLeadDialog from '@/components/crm/AddLeadDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeLeads } from '@/hooks/use-realtime-leads';
import type { Lead, DashboardStats } from '@/types/crm';

const STATS_KEY = ['dashboard-stats'];
const RECENT_KEY = ['dashboard-recent-leads'];

export default function DashboardPage() {
  const { user } = useAuth();

  useRealtimeLeads([STATS_KEY, RECENT_KEY]);

  const { data: stats = { total: 0, fresh: 0, super_hot: 0, hot: 0, warm: 0, cold: 0, success: 0, closed: 0, junk: 0 } } = useQuery({
    queryKey: STATS_KEY,
    queryFn: async (): Promise<DashboardStats> => {
      const counts = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'fresh'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('temperature', 'super_hot'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('temperature', 'hot'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('temperature', 'warm'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('temperature', 'cold'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('temperature', 'success'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('temperature', 'closed'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('temperature', 'junk'),
      ]);
      return {
        total: counts[0].count || 0, fresh: counts[1].count || 0, super_hot: counts[2].count || 0,
        hot: counts[3].count || 0, warm: counts[4].count || 0, cold: counts[5].count || 0,
        success: counts[6].count || 0, closed: counts[7].count || 0, junk: counts[8].count || 0,
      };
    },
  });

  const { data: recentLeads = [], isLoading } = useQuery({
    queryKey: RECENT_KEY,
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(10);
      return (data as unknown as Lead[]) || [];
    },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <AddLeadDialog />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Leads" value={stats.total} icon={Users} />
          <StatCard label="Fresh" value={stats.fresh} icon={Zap} color="bg-status-fresh/15" />
          <StatCard label="Super Hot" value={stats.super_hot} icon={Flame} color="bg-temp-super-hot/15" />
          <StatCard label="Hot" value={stats.hot} icon={TrendingUp} color="bg-temp-hot/15" />
          <StatCard label="Warm" value={stats.warm} icon={Clock} color="bg-temp-warm/15" />
          <StatCard label="Cold" value={stats.cold} icon={Snowflake} color="bg-temp-cold/15" />
          <StatCard label="Success" value={stats.success} icon={CheckCircle} color="bg-temp-success/15" />
          <StatCard label="Closed" value={stats.closed} icon={XCircle} color="bg-temp-closed/15" />
        </div>

        <h2 className="text-lg font-semibold mb-3">Recent Leads</h2>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : recentLeads.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 bg-card rounded-xl border border-border">
            <p className="text-lg font-medium">No leads yet</p>
            <p className="text-sm mt-1">Add your first lead to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {recentLeads.map(lead => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
