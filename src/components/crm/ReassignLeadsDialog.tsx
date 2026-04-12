import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';

interface Agent {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
  onDone?: () => void;
}

export default function ReassignLeadsDialog({ open, onOpenChange, agentId, agentName, onDone }: Props) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [targetAgent, setTargetAgent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      const { data: leadsData } = await supabase.from('leads').select('*').eq('current_owner_id', agentId);
      setLeads((leadsData as unknown as Lead[]) || []);

      const { data: profiles } = await supabase.from('profiles').select('id, name');
      setAgents((profiles || []).filter((p: any) => p.id !== agentId).map((p: any) => ({ id: p.id, name: p.name })));
    };
    fetch();
  }, [open, agentId]);

  const toggleLead = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  const reassign = async () => {
    if (!targetAgent || selectedLeads.size === 0) {
      toast.error('Select leads and a target agent');
      return;
    }
    setLoading(true);
    try {
      const ids = Array.from(selectedLeads);
      const { error } = await supabase.from('leads').update({ current_owner_id: targetAgent } as any).in('id', ids);
      if (error) throw error;

      // Log assignments
      if (user) {
        const assignments = ids.map(id => ({
          lead_id: id,
          assigned_to: targetAgent,
          assigned_by: user.id,
        }));
        await supabase.from('lead_assignments').insert(assignments);
      }

      toast.success(`${ids.length} lead(s) reassigned`);
      onOpenChange(false);
      setSelectedLeads(new Set());
      setTargetAgent('');
      onDone?.();
    } catch (err: any) {
      toast.error(err.message || 'Reassignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reassign Leads from {agentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-auto">
          <div>
            <Label>Target Agent</Label>
            <Select value={targetAgent} onValueChange={setTargetAgent}>
              <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
              <SelectContent>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Leads ({leads.length})</Label>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedLeads.size === leads.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No leads assigned to this agent</p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-auto border border-border rounded-lg p-2">
              {leads.map(lead => (
                <label key={lead.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLeads.has(lead.id)}
                    onChange={() => toggleLead(lead.id)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{lead.name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground ml-2">{lead.mobile}</span>
                  </div>
                  <span className="text-xs capitalize text-muted-foreground">{lead.status}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <Button onClick={reassign} disabled={loading || selectedLeads.size === 0 || !targetAgent} className="w-full mt-2">
          {loading ? 'Reassigning...' : `Reassign ${selectedLeads.size} Lead(s)`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
