import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, ArrowLeft, Clock, MapPin, Globe, PhoneCall } from 'lucide-react';
import LeadTimeline from '@/components/crm/LeadTimeline';
import OwnershipHistory from '@/components/crm/OwnershipHistory';
import WhatsAppTemplates from '@/components/crm/WhatsAppTemplates';
import LeadEyeCentres from '@/components/crm/LeadEyeCentres';
import AppSidebar from '@/components/crm/AppSidebar';
import { LeadStatusBadge, TemperatureBadge } from '@/components/crm/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [comment, setComment] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canEditAll = isAdmin || isManager;

  const fetchLead = async () => {
    if (!id) return;
    const { data } = await supabase.from('leads').select('*').eq('id', id).single();
    if (data) {
      const leadData = data as unknown as Lead;
      setLead(leadData);
      setAltMobile((leadData as any).alternative_mobile || '');
    }

    const { data: acts } = await supabase.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false });
    if (acts) setActivities(acts as unknown as LeadActivity[]);
    setLoading(false);
  };

  useEffect(() => { fetchLead(); }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('name').eq('id', user.id).single().then(({ data }) => {
      if (data) setAgentName((data as any).name);
    });
  }, [user]);

  const updateLead = async (updates: Partial<Lead> & { alternative_mobile?: string }) => {
    if (!id) return;
    const { error } = await supabase.from('leads').update(updates as any).eq('id', id);
    if (error) { toast.error(error.message); return; }

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

  const addComment = async () => {
    if (!comment.trim() || !user || !id) return;
    await supabase.from('lead_activities').insert({
      lead_id: id,
      user_id: user.id,
      activity_type: 'comment',
      remarks: comment.trim(),
    });
    setComment('');
    toast.success('Comment added');
    fetchLead();
  };

  const saveAltMobile = async () => {
    if (!id) return;
    await updateLead({ alternative_mobile: altMobile.trim() } as any);
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
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Lead Info Card */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold">{lead.name || 'Unknown'}</h1>
                  <p className="text-muted-foreground">{lead.mobile}</p>
                  {(lead as any).alternative_mobile && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <PhoneCall className="w-3.5 h-3.5" /> Alt: {(lead as any).alternative_mobile}
                    </p>
                  )}
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
                {(lead as any).alternative_mobile && (
                  <a href={`tel:${(lead as any).alternative_mobile}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2 text-success border-success/30 hover:bg-success/10">
                      <PhoneCall className="w-4 h-4" /> Call Alt
                    </Button>
                  </a>
                )}
                <div className="flex-1">
                  <WhatsAppTemplates lead={lead} agentName={agentName} />
                </div>
                <Button onClick={convertLead} className="flex-1 gap-2">
                  Convert
                </Button>
              </div>
            </div>

            {/* Update Status/Temperature - All roles can do this */}
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
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Alternative Mobile - All roles can add */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-3">Alternative Number</h3>
              <div className="flex gap-2">
                <Input
                  value={altMobile}
                  onChange={e => setAltMobile(e.target.value)}
                  placeholder="Enter alternative mobile number..."
                  className="flex-1"
                />
                <Button onClick={saveAltMobile} disabled={altMobile === ((lead as any).alternative_mobile || '')}>
                  Save
                </Button>
              </div>
            </div>

            {/* Edit Lead Details - Only Admin/Manager */}
            {canEditAll && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold mb-3">Edit Lead Details</h3>
                <p className="text-xs text-muted-foreground mb-3">Only Super Admin & Admin can edit these fields</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      defaultValue={lead.name}
                      onBlur={e => {
                        if (e.target.value !== lead.name) updateLead({ name: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Mobile</Label>
                    <Input
                      defaultValue={lead.mobile}
                      onBlur={e => {
                        if (e.target.value !== lead.mobile) updateLead({ mobile: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      defaultValue={lead.city}
                      onBlur={e => {
                        if (e.target.value !== lead.city) updateLead({ city: e.target.value });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Add Comment */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-3">Add Comment</h3>
              <div className="space-y-2">
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Write a comment about this lead..."
                  rows={3}
                />
                <Button onClick={addComment} disabled={!comment.trim()}>
                  Add Comment
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Eye Centres */}
            <LeadEyeCentres leadId={id!} />

            {/* Ownership History */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Ownership History</h3>
              <OwnershipHistory leadId={id!} />
            </div>

            {/* Activity Timeline (Comment History) */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Activity & Comment History</h3>
              <LeadTimeline leadId={id!} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
