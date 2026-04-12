import { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import AppSidebar from '@/components/crm/AppSidebar';
import LeadCard from '@/components/crm/LeadCard';
import AddLeadDialog from '@/components/crm/AddLeadDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, LeadStatus, LeadTemperature } from '@/types/crm';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tempFilter, setTempFilter] = useState<string>('all');

  const fetchLeads = async () => {
    setLoading(true);
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (tempFilter !== 'all') query = query.eq('temperature', tempFilter);
    
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

  useEffect(() => { fetchLeads(); }, [statusFilter, tempFilter]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Leads</h1>
          <AddLeadDialog onLeadAdded={fetchLeads} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchLeads()}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="fresh">Fresh</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="not_connected">Not Connected</SelectItem>
              <SelectItem value="followup">Follow-up</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tempFilter} onValueChange={setTempFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Temperature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Temp</SelectItem>
              <SelectItem value="super_hot">Super Hot</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="junk">Junk</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
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
