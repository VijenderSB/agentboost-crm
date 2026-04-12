import { useEffect, useState } from 'react';
import { Users, ArrowRightLeft, Phone, CheckCircle, TrendingUp, Shuffle } from 'lucide-react';
import AppSidebar from '@/components/crm/AppSidebar';
import AddAgentDialog from '@/components/crm/AddAgentDialog';
import ReassignLeadsDialog from '@/components/crm/ReassignLeadsDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AgentStats {
  id: string;
  name: string;
  role: string;
  status: string;
  totalLeads: number;
  freshLeads: number;
  connectedLeads: number;
  conversions: number;
  pendingFollowups: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassignAgent, setReassignAgent] = useState<{ id: string; name: string } | null>(null);

  const fetchAgents = async () => {
    setLoading(true);

    const [{ data: profiles }, { data: roles }, { data: leads }, { data: followups }] = await Promise.all([
      supabase.from('profiles').select('id, name, status'),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('leads').select('current_owner_id, status, temperature'),
      supabase.from('followups').select('assigned_to, completed').eq('completed', false),
    ]);

    if (!profiles || !roles) { setLoading(false); return; }

    const roleMap = new Map(roles.map((r: any) => [r.user_id, r.role]));

    const statsMap = new Map<string, { total: number; fresh: number; connected: number; conversions: number }>();
    leads?.forEach((l: any) => {
      const oid = l.current_owner_id;
      const s = statsMap.get(oid) || { total: 0, fresh: 0, connected: 0, conversions: 0 };
      s.total++;
      if (l.status === 'fresh') s.fresh++;
      if (l.status === 'connected') s.connected++;
      if (l.temperature === 'success') s.conversions++;
      statsMap.set(oid, s);
    });

    const fuMap = new Map<string, number>();
    followups?.forEach((f: any) => {
      fuMap.set(f.assigned_to, (fuMap.get(f.assigned_to) || 0) + 1);
    });

    setAgents(profiles.map((p: any) => {
      const s = statsMap.get(p.id) || { total: 0, fresh: 0, connected: 0, conversions: 0 };
      return {
        id: p.id,
        name: p.name,
        role: roleMap.get(p.id) || 'agent',
        status: p.status,
        totalLeads: s.total,
        freshLeads: s.fresh,
        connectedLeads: s.connected,
        conversions: s.conversions,
        pendingFollowups: fuMap.get(p.id) || 0,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { fetchAgents(); }, []);

  const updateRole = async (agentId: string, newRole: string) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole as any }).eq('user_id', agentId);
    if (error) { toast.error(error.message); return; }
    toast.success('Role updated');
    fetchAgents();
  };

  const toggleStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', agentId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Agent ${newStatus}`);
    fetchAgents();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Agents</h1>
          <AddAgentDialog onAdded={fetchAgents} />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : (
          <div className="space-y-4">
            {agents.map(agent => (
              <div key={agent.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Select value={agent.role} onValueChange={v => updateRole(agent.id, v)}>
                          <SelectTrigger className="h-7 text-xs w-28 border-dashed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={agent.status === 'active' ? 'default' : 'secondary'}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleStatus(agent.id, agent.status)}
                    >
                      {agent.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setReassignAgent({ id: agent.id, name: agent.name })}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Reassign
                    </Button>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs">Total</span>
                    </div>
                    <p className="text-xl font-bold">{agent.totalLeads}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-xs">Fresh</span>
                    </div>
                    <p className="text-xl font-bold">{agent.freshLeads}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-xs">Connected</span>
                    </div>
                    <p className="text-xl font-bold">{agent.connectedLeads}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-xs">Conversions</span>
                    </div>
                    <p className="text-xl font-bold text-primary">{agent.conversions}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="text-xs">Follow-ups</span>
                    </div>
                    <p className="text-xl font-bold">{agent.pendingFollowups}</p>
                  </div>
                </div>

                {/* Conversion Rate */}
                {agent.totalLeads > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Conversion Rate</span>
                      <span>{((agent.conversions / agent.totalLeads) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((agent.conversions / agent.totalLeads) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {reassignAgent && (
          <ReassignLeadsDialog
            open={!!reassignAgent}
            onOpenChange={open => !open && setReassignAgent(null)}
            agentId={reassignAgent.id}
            agentName={reassignAgent.name}
            onDone={fetchAgents}
          />
        )}
      </main>
    </div>
  );
}
