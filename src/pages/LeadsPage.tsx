import { useEffect, useState } from 'react';
import { Search, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/crm/AppSidebar';
import LeadCard from '@/components/crm/LeadCard';
import AddLeadDialog from '@/components/crm/AddLeadDialog';
import { LeadStatusBadge, TemperatureBadge } from '@/components/crm/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Constants } from '@/integrations/supabase/types';
import type { Lead } from '@/types/crm';

interface Agent { id: string; name: string; }
interface OwnershipEntry { lead_id: string; owner_id: string; started_at: string; ended_at: string | null; }

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [ownershipMap, setOwnershipMap] = useState<Map<string, OwnershipEntry[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
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

    const [{ data }, { data: historyData }] = await Promise.all([
      query,
      supabase.from('lead_ownership_history').select('lead_id, owner_id, started_at, ended_at').order('started_at', { ascending: true }),
    ]);
    let filtered = (data as unknown as Lead[]) || [];

    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(s) || l.mobile?.includes(s) || l.city?.toLowerCase().includes(s)
      );
    }

    // Build ownership history map
    const oMap = new Map<string, OwnershipEntry[]>();
    (historyData || []).forEach((h: any) => {
      const arr = oMap.get(h.lead_id) || [];
      arr.push(h);
      oMap.set(h.lead_id, arr);
    });
    setOwnershipMap(oMap);

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

  const agentMap = new Map(agents.map(a => [a.id, a.name]));

  const daysSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Leads</h1>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 gap-1.5"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 gap-1.5"
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Matrix</span>
              </Button>
            </div>
            <AddLeadDialog />
          </div>
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
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40px] text-xs">#</TableHead>
                    <TableHead className="text-xs min-w-[140px]">Name</TableHead>
                    <TableHead className="text-xs min-w-[110px]">Mobile</TableHead>
                    <TableHead className="text-xs min-w-[110px]">Alt Mobile</TableHead>
                    <TableHead className="text-xs min-w-[100px]">City</TableHead>
                    <TableHead className="text-xs min-w-[100px]">Status</TableHead>
                    <TableHead className="text-xs min-w-[100px]">Temperature</TableHead>
                    <TableHead className="text-xs min-w-[120px]">Source</TableHead>
                    <TableHead className="text-xs min-w-[110px]">First Owner</TableHead>
                    <TableHead className="text-xs min-w-[110px]">Current Agent</TableHead>
                    <TableHead className="text-xs min-w-[110px]">Conversion Agent</TableHead>
                    <TableHead className="text-xs min-w-[90px]">Created</TableHead>
                    <TableHead className="text-xs min-w-[60px]">Age</TableHead>
                    <TableHead className="text-xs min-w-[90px]">Follow-up</TableHead>
                    <TableHead className="text-xs min-w-[90px]">Updated</TableHead>
                    <TableHead className="text-xs min-w-[200px]">Ownership History</TableHead>
                    <TableHead className="text-xs min-w-[150px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead, idx) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{lead.name || '—'}</TableCell>
                      <TableCell className="text-sm font-mono">{lead.mobile}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {(lead as any).alternative_mobile || '—'}
                      </TableCell>
                      <TableCell className="text-sm">{lead.city || '—'}</TableCell>
                      <TableCell><LeadStatusBadge status={lead.status} /></TableCell>
                      <TableCell><TemperatureBadge temperature={lead.temperature} /></TableCell>
                      <TableCell className="text-sm">{sourceLabels[lead.source] || lead.source}</TableCell>
                      <TableCell className="text-sm">{agentMap.get(lead.first_owner_id) || '—'}</TableCell>
                      <TableCell className="text-sm">{agentMap.get(lead.current_owner_id) || '—'}</TableCell>
                      <TableCell className="text-sm">{lead.conversion_owner_id ? agentMap.get(lead.conversion_owner_id) || '—' : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={`font-medium ${daysSince(lead.created_at) > 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {daysSince(lead.created_at)}d
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {lead.followup_date
                          ? new Date(lead.followup_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(lead.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[250px]">
                        {(() => {
                          const history = ownershipMap.get(lead.id) || [];
                          if (history.length === 0) return '—';
                          return (
                            <div className="flex flex-wrap gap-1">
                              {history.map((h, i) => {
                                const name = agentMap.get(h.owner_id) || 'Unknown';
                                const isCurrent = !h.ended_at;
                                return (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      isCurrent
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {name}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {lead.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
