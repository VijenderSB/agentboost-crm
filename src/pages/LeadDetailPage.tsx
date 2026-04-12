import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, ArrowLeft, Clock, MapPin, Globe } from 'lucide-react';
import LeadTimeline from '@/components/crm/LeadTimeline';
import WhatsAppTemplates from '@/components/crm/WhatsAppTemplates';
import AppSidebar from '@/components/crm/AppSidebar';
import { LeadStatusBadge, TemperatureBadge } from '@/components/crm/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Lead, LeadActivity, LeadStatus, LeadTemperature } from '@/types/crm';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [agentName, setAgentName] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLead = async () => {
    if (!id) return;
    const { data } = await supabase.from('leads').select('*').eq('id', id).single();
    if (data) setLead(data as unknown as Lead);
    
    const { data: acts } = await supabase.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false });
    if (acts) setActivities(acts as unknown as LeadActivity[]);
    setLoading(false);
  };

  useEffect(() => { fetchLead(); }, [id]);

  const updateLead = async (updates: Partial<Lead>) => {
    if (!id) return;
    const { error } = await supabase.from('leads').update(updates as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    
    // Log activity
    if (user) {
      const activityType = Object.keys(updates).join(', ') + ' updated';
      await supabase.from('lead_activities').insert({
        lead_id: id,
        user_id: user.id,
        activity_type: activityType,
        remarks: `Updated to: ${JSON.stringify(updates)}`,
      });
    }
    
    toast.success('Lead updated');
    fetchLead();
  };

  const addNote = async () => {
    if (!note.trim() || !user || !id) return;
    await supabase.from('lead_activities').insert({
      lead_id: id,
      user_id: user.id,
      activity_type: 'note',
      remarks: note.trim(),
    });
    setNote('');
    toast.success('Note added');
    fetchLead();
  };

  const convertLead = async () => {
    if (!id || !user) return;
    await updateLead({ status: 'connected' as LeadStatus, temperature: 'success' as LeadTemperature, conversion_owner_id: user.id });
    toast.success('Lead converted to Success!');
  };

  if (loading) return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 flex items-center justify-center">Loading...</main>
    </div>
  );

  if (!lead) return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 flex items-center justify-center">Lead not found</main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        {/* Header */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold">{lead.name || 'Unknown'}</h1>
                  <p className="text-muted-foreground">{lead.mobile}</p>
                </div>
                <div className="flex gap-2">
                  <LeadStatusBadge status={lead.status} />
                  <TemperatureBadge temperature={lead.temperature} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {lead.city || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4" /> {lead.source.replace('_', ' ')}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" /> {new Date(lead.created_at).toLocaleDateString()}
                </div>
                {lead.followup_date && (
                  <div className="flex items-center gap-2 text-warning">
                    <Clock className="w-4 h-4" /> Follow-up: {new Date(lead.followup_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              {lead.notes && (
                <p className="mt-3 text-sm bg-muted p-3 rounded-lg">{lead.notes}</p>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                <a href={`tel:${lead.mobile}`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2 text-success border-success/30 hover:bg-success/10">
                    <Phone className="w-4 h-4" /> Call
                  </Button>
                </a>
                <a href={`https://wa.me/${lead.mobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 text-accent border-accent/30 hover:bg-accent/10">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
                <Button onClick={convertLead} className="flex-1 gap-2">
                  Convert
                </Button>
              </div>
            </div>

            {/* Update Status/Temperature */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-3">Update Lead</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={lead.status} onValueChange={v => updateLead({ status: v as LeadStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresh">Fresh</SelectItem>
                      <SelectItem value="connected">Connected</SelectItem>
                      <SelectItem value="not_connected">Not Connected</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Temperature</Label>
                  <Select value={lead.temperature} onValueChange={v => updateLead({ temperature: v as LeadTemperature })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
              </div>
            </div>

            {/* Add Note */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-3">Add Note</h3>
              <div className="flex gap-2">
                <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Write a note..." className="flex-1" />
                <Button onClick={addNote} disabled={!note.trim()}>Add</Button>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            <LeadTimeline leadId={id!} />
          </div>
        </div>
      </main>
    </div>
  );
}
