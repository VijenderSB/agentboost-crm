import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import AppSidebar from '@/components/crm/AppSidebar';
import LeadCard from '@/components/crm/LeadCard';
import AddLeadDialog from '@/components/crm/AddLeadDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Constants } from '@/integrations/supabase/types';
import type { Lead } from '@/types/crm';

interface Agent { id: string; name: string; }

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tempFilter, setTempFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  useEffect(() => {
    supabase.from('profiles').select('id, name').then(({ data }) => {
      setAgents((data || []).map((p: any) => ({ id: p.id, name: p.name })));
    });
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
    if (tempFilter !== 'all') query = query.eq('temperature', tempFilter as any);
    if (sourceFilter !== 'all') query = query.eq('source', sourceFilter as any);
    if (agentFilter !== 'all') query = query.eq('current_owner_id', agentFilter);

    const { data } = await query;
    let filtered = (data as unknown as Lead[]) || [];

    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(s) || l.mobile?.includes(s) || l.city?.toLowerCase().includes(s)
      );
    }

    setLeads(filtered);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [statusFilter, tempFilter, sourceFilter, agentFilter]);

  const hasFilters = statusFilter !== 'all' || tempFilter !== 'all' || sourceFilter !== 'all' || agentFilter !== 'all' || search.trim();

  const clearFilters = () => {
    setStatusFilter('all');
    setTempFilter('all');
    setSourceFilter('all');
    setAgentFilter('all');
    setSearch('');
  };

  const sourceLabels: Record<string, string> = {
    query_form: 'Query Form', whatsapp: 'WhatsApp', ivr: 'IVR', chat: 'Chat',
    justdial: 'JustDial', indiamart: 'IndiaMart', google_business: 'Google Business',
    practo: 'Practo', facebook: 'Facebook', instagram: 'Instagram',
    whatsapp_ads: 'WhatsApp Ads', reference: 'Reference', walkin: 'Walk-in', manual: 'Manual',
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Leads</h1>
          <AddLeadDialog />
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile, or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchLeads()}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Constants.public.Enums.lead_status.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tempFilter} onValueChange={setTempFilter}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="Temperature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Temp</SelectItem>
                {Constants.public.Enums.lead_temperature.map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px] h-9 text-sm">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Constants.public.Enums.lead_source.map(s => (
                  <SelectItem key={s} value={s}>{sourceLabels[s] || s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[150px] h-9 text-sm">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9">
                Clear filters
              </Button>
            )}
            <span className="text-sm text-muted-foreground ml-auto">{leads.length} lead(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 bg-card rounded-xl border border-border">
            <p className="text-lg font-medium">No leads found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
