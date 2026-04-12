import { useEffect, useState } from 'react';
import AppSidebar from '@/components/crm/AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  lead_count: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, name, status');
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      
      if (profiles && roles) {
        const roleMap = new Map(roles.map((r: any) => [r.user_id, r.role]));
        
        // Get lead counts per agent
        const { data: leads } = await supabase.from('leads').select('current_owner_id');
        const countMap = new Map<string, number>();
        leads?.forEach((l: any) => {
          countMap.set(l.current_owner_id, (countMap.get(l.current_owner_id) || 0) + 1);
        });

        setAgents(profiles.map((p: any) => ({
          id: p.id,
          name: p.name,
          role: roleMap.get(p.id) || 'agent',
          status: p.status,
          lead_count: countMap.get(p.id) || 0,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Agents</h1>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {agents.map(agent => (
              <div key={agent.id} className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{agent.name}</h3>
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="capitalize text-xs">
                    {agent.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground capitalize mb-2">{agent.role}</p>
                <p className="text-2xl font-bold text-primary">{agent.lead_count}</p>
                <p className="text-xs text-muted-foreground">Assigned Leads</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
